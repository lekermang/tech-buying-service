import json
import os
import re
from datetime import datetime, timedelta, timezone

import psycopg2
import requests

CACHE_TTL_SECONDS = 60

BASE = 'https://online.smartlombard.ru'
LOGIN_URL = f'{BASE}/login/auth'
OPS_URL = f'{BASE}/cash/operations_by_date/'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p31606708_tech_buying_service'


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _check_token(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return False
    try:
        token_safe = token.replace("'", "''")
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT role FROM {SCHEMA}.employees WHERE auth_token='{token_safe}' AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return False
        return row[0] in ('owner', 'admin')
    except Exception:
        return False


def _cache_get(key: str) -> dict | None:
    try:
        key_safe = key.replace("'", "''")
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT payload, EXTRACT(EPOCH FROM (NOW() - updated_at)) FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{key_safe}'"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return None
        payload, age = row
        if age is None or float(age) > CACHE_TTL_SECONDS:
            return None
        if isinstance(payload, str):
            return json.loads(payload)
        return payload
    except Exception:
        return None


def _cache_set(key: str, data: dict) -> None:
    try:
        key_safe = key.replace("'", "''")
        payload_safe = json.dumps(data, ensure_ascii=False).replace("'", "''")
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.smartlombard_cache (cache_key, payload, updated_at) "
            f"VALUES ('{key_safe}', '{payload_safe}'::jsonb, NOW()) "
            f"ON CONFLICT (cache_key) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()"
        )
        conn.commit()
        cur.close(); conn.close()
    except Exception:
        pass


def _msk_today_str() -> str:
    msk = datetime.now(timezone.utc) + timedelta(hours=3)
    return msk.strftime('%d.%m.%Y')


def _parse_date_param(val: str) -> str:
    if not val:
        return _msk_today_str()
    val = val.strip()
    # accept YYYY-MM-DD or DD.MM.YYYY
    try:
        if re.match(r'^\d{4}-\d{2}-\d{2}$', val):
            d = datetime.strptime(val, '%Y-%m-%d')
            return d.strftime('%d.%m.%Y')
        if re.match(r'^\d{2}\.\d{2}\.\d{4}$', val):
            return val
    except Exception:
        pass
    return _msk_today_str()


def _login(session: requests.Session) -> dict:
    login = os.environ.get('SMARTLOMBARD_LOGIN', '')
    password = os.environ.get('SMARTLOMBARD_PASSWORD', '')
    if not login or not password:
        return {'ok': False, 'error': 'SMARTLOMBARD_LOGIN/PASSWORD не заданы'}
    # Прогрев — получим cookie сессии
    session.get(BASE + '/', timeout=15, headers={'User-Agent': 'Mozilla/5.0'})
    r = session.post(
        LOGIN_URL,
        data={'login': login, 'password': password},
        headers={
            'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': BASE + '/',
        },
        timeout=20,
    )
    try:
        data = r.json()
    except Exception:
        return {'ok': False, 'error': f'login: bad json (status {r.status_code})'}
    if not data.get('success'):
        return {'ok': False, 'error': data.get('fail') or 'login failed'}
    return {'ok': True}


def _to_int(s: str) -> int:
    s = re.sub(r'[^\d\-]', '', s or '')
    try:
        return int(s)
    except Exception:
        return 0


_NUM_RE = r'(-?[0-9][0-9 \xa0]*[\.,]?[0-9]*)'


def _find_number_after(html: str, label: str) -> int:
    """Ищет первое число после указанной метки (в пределах ~500 символов)."""
    # Регэксп: метка + любые символы (включая теги) + первое число
    pat = re.escape(label) + r'.{0,500}?' + _NUM_RE
    m = re.search(pat, html, re.DOTALL)
    if not m:
        return 0
    raw = m.group(1).replace('\xa0', ' ').replace(' ', '').replace(',', '.')
    # отбрасываем дробную часть
    if '.' in raw:
        raw = raw.split('.')[0]
    try:
        return int(raw)
    except Exception:
        return 0


def _find_number_any(html: str, labels: list[str]) -> int:
    for lab in labels:
        v = _find_number_after(html, lab)
        if v:
            return v
    return 0


def _parse_ops_page(html: str) -> dict:
    """Достаём Приход / Расход и блок «Доход за период / Затраты / Прибыль»."""
    result = {'income': 0, 'expense': 0, 'period_income': 0, 'period_costs': 0, 'period_profit': 0}

    result['income'] = _find_number_any(html, ['Приход:', 'Приход', 'Income:', 'Поступления:', 'Поступления'])
    result['expense'] = _find_number_any(html, ['Расход:', 'Расход', 'Expense:', 'Списания:', 'Списания'])
    result['period_income'] = _find_number_any(html, ['Доход за период', 'Доход за период:', 'Доход'])
    result['period_costs'] = _find_number_any(html, ['Затраты за период', 'Затраты за период:', 'Затраты'])
    result['period_profit'] = _find_number_any(html, ['Прибыль за период', 'Прибыль за период:', 'Прибыль'])

    # Запасной вариант — разница
    if result['period_profit'] == 0 and (result['period_income'] or result['period_costs']):
        result['period_profit'] = result['period_income'] - result['period_costs']

    return result


def _fetch_ops(session: requests.Session, date_from: str, date_to: str) -> dict:
    # Сначала GET — чтобы понять, какие параметры формы ожидает страница
    params = {
        'from': date_from + ' 00:00',
        'to': date_to + ' 23:59',
        'mode': 'accountant',
    }
    r = session.get(
        OPS_URL,
        params=params,
        timeout=25,
        headers={'User-Agent': 'Mozilla/5.0', 'Referer': BASE + '/'},
    )
    if r.status_code != 200:
        return {'ok': False, 'error': f'ops: status {r.status_code}'}
    html = r.text
    # Не залогинены — редирект на /
    if 'formlogin' in html or 'Вход в программу' in html:
        return {'ok': False, 'error': 'session expired / not logged in'}
    parsed = _parse_ops_page(html)
    return {'ok': True, 'data': parsed, 'html': html}


def handler(event: dict, context) -> dict:
    """Парсит smartlombard.ru — Касса и банк / Операции по датам.
    GET ?date=YYYY-MM-DD (по умолчанию — сегодня МСК). Только owner/admin.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if not _check_token(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    params = event.get('queryStringParameters') or {}
    date_from = _parse_date_param(params.get('date_from') or params.get('date') or '')
    date_to = _parse_date_param(params.get('date_to') or params.get('date') or '') if (params.get('date_to') or params.get('date')) else date_from

    nocache = (params.get('nocache') or '').lower() in ('1', 'true', 'yes')
    cache_key = f'{date_from}__{date_to}'

    if not nocache:
        cached = _cache_get(cache_key)
        if cached is not None:
            cached['cached'] = True
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(cached, ensure_ascii=False)}

    session = requests.Session()
    login_res = _login(session)
    if not login_res.get('ok'):
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps({'error': login_res.get('error', 'login failed')}, ensure_ascii=False)}

    ops = _fetch_ops(session, date_from, date_to)
    if not ops.get('ok'):
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps({'error': ops.get('error', 'ops failed')}, ensure_ascii=False)}

    data = ops['data']

    # Debug: вернуть фрагменты HTML для понимания структуры страницы
    if (params.get('debug') or '').lower() in ('1', 'true', 'yes'):
        html = ops.get('html') or ''
        snippets: dict = {}
        for lab in ['Приход', 'Расход', 'Доход', 'Затрат', 'Прибыль']:
            idx = html.find(lab)
            snippets[lab] = (html[idx:idx + 600] if idx >= 0 else None)
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'date_from': date_from, 'date_to': date_to,
                    'parsed': data,
                    'html_len': len(html),
                    'snippets': snippets,
                }, ensure_ascii=False)}

    payload = {
        'date_from': date_from,
        'date_to': date_to,
        'income': data['income'],
        'expense': data['expense'],
        'period_income': data['period_income'],
        'period_costs': data['period_costs'],
        'period_profit': data['period_profit'],
    }
    _cache_set(cache_key, payload)
    payload['cached'] = False
    return {
        'statusCode': 200, 'headers': HEADERS,
        'body': json.dumps(payload, ensure_ascii=False)
    }