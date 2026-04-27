import json
import os
import re
from datetime import datetime, timedelta, timezone

import psycopg2
import requests

CACHE_TTL_SECONDS = 60
TOKEN_TTL_SECONDS = 19 * 60  # smartlombard: токен можно получать не чаще 1 раза в 20 мин
TOKEN_CACHE_KEY = '__access_token__'

API_BASE = 'https://online.smartlombard.ru/api/exchange/v1'
AUTH_URL = f'{API_BASE}/auth/access_token'
OPS_URL = f'{API_BASE}/operations'
ELEM_OPS_URL = f'{API_BASE}/elementary_operations'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p31606708_tech_buying_service'

INCOME_TYPES = {'buyout', 'part_buyout', 'part_buyout_pawn_good', 'prolongation', 'prolongation_online', 'sell_realization'}
EXPENSE_TYPES = {'pledge', 'repledge', 'dobor'}


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


def _msk_today_dmy() -> str:
    msk = datetime.now(timezone.utc) + timedelta(hours=3)
    return msk.strftime('%d.%m.%Y')


def _parse_date_param(val: str) -> str:
    if not val:
        return _msk_today_dmy()
    val = val.strip()
    try:
        if re.match(r'^\d{4}-\d{2}-\d{2}$', val):
            d = datetime.strptime(val, '%Y-%m-%d')
            return d.strftime('%d.%m.%Y')
        if re.match(r'^\d{2}\.\d{2}\.\d{4}$', val):
            return val
    except Exception:
        pass
    return _msk_today_dmy()


def _token_cache_get() -> str | None:
    """Берём токен из БД, если он младше TOKEN_TTL_SECONDS."""
    try:
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT payload, EXTRACT(EPOCH FROM (NOW() - updated_at)) FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{TOKEN_CACHE_KEY}'"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return None
        payload, age = row
        if age is None or float(age) > TOKEN_TTL_SECONDS:
            return None
        if isinstance(payload, str):
            payload = json.loads(payload)
        token = (payload or {}).get('token')
        return token if token else None
    except Exception:
        return None


def _token_cache_set(token: str) -> None:
    try:
        payload_safe = json.dumps({'token': token}, ensure_ascii=False).replace("'", "''")
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.smartlombard_cache (cache_key, payload, updated_at) "
            f"VALUES ('{TOKEN_CACHE_KEY}', '{payload_safe}'::jsonb, NOW()) "
            f"ON CONFLICT (cache_key) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()"
        )
        conn.commit()
        cur.close(); conn.close()
    except Exception:
        pass


def _request_new_token() -> tuple[str | None, str | None]:
    account_id = os.environ.get('SMARTLOMBARD_ACCOUNT_ID', '').strip()
    secret_key = os.environ.get('SMARTLOMBARD_SECRET_KEY', '').strip()
    if not account_id or not secret_key:
        return None, 'SMARTLOMBARD_ACCOUNT_ID/SMARTLOMBARD_SECRET_KEY не заданы'
    try:
        r = requests.post(
            AUTH_URL,
            files={
                'account_id': (None, str(account_id)),
                'secret_key': (None, secret_key),
            },
            timeout=20,
        )
    except Exception as e:
        return None, f'auth: network error {e}'
    try:
        data = r.json()
    except Exception:
        return None, f'auth: bad json (status {r.status_code})'
    if not data.get('status'):
        return None, f'auth: {data.get("message") or data.get("error") or "failed"} (status {r.status_code})'
    res = data.get('result') or {}
    token = res.get('access_token')
    if isinstance(token, dict):
        token = token.get('access_token') or token.get('token') or token.get('value')
    if not token:
        return None, 'auth: no access_token in response'
    return str(token), None


def _get_access_token(force: bool = False) -> tuple[str | None, str | None]:
    """Возвращает токен из кэша БД (если ему меньше 19 мин) либо запрашивает новый."""
    if not force:
        cached = _token_cache_get()
        if cached:
            return cached, None
    token, err = _request_new_token()
    if token:
        _token_cache_set(token)
    return token, err


def _fetch_all_pages(url: str, token: str, params: dict, max_pages: int = 50) -> tuple[list, str | None, dict | None]:
    items: list = []
    page = 1
    debug_first: dict | None = None
    while page <= max_pages:
        q = dict(params)
        q['page'] = page
        q['limit'] = 100
        try:
            r = requests.get(url, params=q, headers={'Authorization': f'Bearer {token}'}, timeout=25)
        except Exception as e:
            return items, f'ops: network error {e}', debug_first
        try:
            data = r.json()
        except Exception:
            return items, f'ops: bad json (status {r.status_code})', debug_first
        if not data.get('status'):
            return items, f'ops: {data.get("message") or data.get("error") or "failed"} (status {r.status_code})', debug_first
        result = data.get('result') or {}
        ops = result.get('operations') or []
        if page == 1:
            debug_first = {
                'page1_count': len(ops),
                'sample': ops[:2],
                'pagination': (data.get('metadata') or {}).get('pagination'),
            }
        if not ops:
            break
        items.extend(ops)
        pagination = (data.get('metadata') or {}).get('pagination') or {}
        total_pages = pagination.get('total_pages') or pagination.get('totalPages')
        if total_pages and page >= int(total_pages):
            break
        if len(ops) < 100:
            break
        page += 1
    return items, None, debug_first


def _to_float(x) -> float:
    try:
        if x is None:
            return 0.0
        return float(x)
    except Exception:
        return 0.0


def _aggregate(operations: list, elem_operations: list) -> dict:
    income = 0.0
    expense = 0.0
    by_type: dict[str, float] = {}

    for op in operations:
        t = (op.get('type_operation') or '').strip()
        primary = t.split(',')[0].strip() if t else ''
        s = _to_float(op.get('sum'))
        by_type[primary] = by_type.get(primary, 0.0) + s
        if primary in INCOME_TYPES:
            income += s
        elif primary in EXPENSE_TYPES:
            expense += s

    period_income = 0.0
    period_costs = 0.0
    for eo in elem_operations:
        period_income += _to_float(eo.get('percent')) + _to_float(eo.get('overprofit'))
        period_costs += _to_float(eo.get('loss'))
    period_profit = period_income - period_costs

    return {
        'income': int(round(income)),
        'expense': int(round(expense)),
        'period_income': int(round(period_income)),
        'period_costs': int(round(period_costs)),
        'period_profit': int(round(period_profit)),
        'by_type': {k: int(round(v)) for k, v in by_type.items()},
    }


def handler(event: dict, context) -> dict:
    """Получает данные из smartlombard REST API (operations + elementary_operations)
    и считает приход/расход/прибыль за период. Только owner/admin.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if not _check_token(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    params = event.get('queryStringParameters') or {}
    date_from = _parse_date_param(params.get('date_from') or params.get('date') or '')
    date_to = _parse_date_param(params.get('date_to') or params.get('date') or '') if (params.get('date_to') or params.get('date')) else date_from

    nocache = (params.get('nocache') or '').lower() in ('1', 'true', 'yes')
    debug = (params.get('debug') or '').lower() in ('1', 'true', 'yes')
    cache_key = f'api__{date_from}__{date_to}'

    if not nocache and not debug:
        cached = _cache_get(cache_key)
        if cached is not None:
            cached['cached'] = True
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(cached, ensure_ascii=False)}

    token, err = _get_access_token()
    if err or not token:
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps({'error': err or 'auth failed'}, ensure_ascii=False)}

    q = {'date_begin': date_from, 'date_end': date_to}
    operations, err1, dbg1 = _fetch_all_pages(OPS_URL, token, q)
    if err1:
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps({'error': err1, 'stage': 'operations'}, ensure_ascii=False)}

    elem_operations, err2, dbg2 = _fetch_all_pages(ELEM_OPS_URL, token, q)
    if err2:
        elem_operations = []

    agg = _aggregate(operations, elem_operations)

    if debug:
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'date_from': date_from, 'date_to': date_to,
                    'aggregated': agg,
                    'operations_total': len(operations),
                    'elem_operations_total': len(elem_operations),
                    'operations_debug': dbg1,
                    'elem_debug': dbg2,
                }, ensure_ascii=False)}

    payload = {
        'date_from': date_from,
        'date_to': date_to,
        'income': agg['income'],
        'expense': agg['expense'],
        'period_income': agg['period_income'],
        'period_costs': agg['period_costs'],
        'period_profit': agg['period_profit'],
        'operations_total': len(operations),
    }
    _cache_set(cache_key, payload)
    payload['cached'] = False
    return {
        'statusCode': 200, 'headers': HEADERS,
        'body': json.dumps(payload, ensure_ascii=False)
    }