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
GOODS_API_BASE = 'https://goods.api.smartlombard.ru/api/exchange/v1'
AUTH_URL = f'{API_BASE}/auth/access_token'
OPS_URL = f'{API_BASE}/operations'
ELEM_OPS_URL = f'{API_BASE}/elementary_operations'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
    'Content-Type': 'application/json',
}

# Безопасный белый список путей smartlombard, которые разрешено вызывать через proxy.
# Поддерживаются placeholder'ы {id}.
PROXY_GET_PATHS = {
    '/operations', '/elementary_operations',
    '/pawn_tickets', '/pawn_tickets/{id}',
    '/pawn_goods', '/pawn_goods/{id}',
    '/clients', '/clients/{id}',
    '/clients_legal', '/clients_legal/{id}',
    '/branches', '/employees',
    '/categories', '/subcategories',
    '/storage_places', '/metals', '/probes', '/gemstones',
    '/tariffs', '/document_types', '/advertising_channels',
    '/clients/{id}/documents', '/clients/{id}/bank_cards', '/clients/{id}/bonus_history',
}
PROXY_POST_PATHS = {
    '/pawn_tickets/operations',         # залог
    '/operations/prolongation',         # продление
    '/operations/repledge',              # перезалог
    '/operations/dobor',                 # добор
    '/operations/part_buyout',           # частичный выкуп
    '/operations/part_buyout_pawn_good', # частичный выкуп имущества
    '/operations/buyout',                # выкуп
    '/operations/realization',           # реализация
    '/operations/seizure',               # изъятие
    '/operations/send_to_realization',   # отправка на реализацию
    '/clients', '/clients/{id}/documents', '/clients/{id}/bank_cards',
    '/clients_legal',
    '/shifts/open', '/shifts/close',
    '/upload_image',
}
PROXY_PUT_PATHS = {
    '/clients/{id}', '/clients_legal/{id}',
    '/pawn_goods/{id}',
}
# На goods.api.smartlombard.ru
GOODS_GET_PATHS = {'/goods', '/goods/{id}', '/contracts', '/contracts/{id}'}

SCHEMA = 't_p31606708_tech_buying_service'

INCOME_TYPES = {'buyout', 'part_buyout', 'part_buyout_pawn_good', 'prolongation', 'prolongation_online', 'sell_realization'}
EXPENSE_TYPES = {'pledge', 'repledge', 'dobor'}


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _check_token(event: dict, allow_all_staff: bool = False) -> tuple[bool, str | None]:
    """Возвращает (авторизован, роль). По умолчанию пропускает только owner/admin.
    allow_all_staff=True — пропускает любого активного сотрудника."""
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return False, None
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
            return False, None
        role = row[0]
        if allow_all_staff:
            return True, role
        return role in ('owner', 'admin'), role
    except Exception:
        return False, None


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


def _token_cache_get(ignore_ttl: bool = False) -> str | None:
    """Берём токен из БД, если он младше TOKEN_TTL_SECONDS.
    ignore_ttl=True — берём любой ненулевой токен (используется как fallback при 429)."""
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
        if not ignore_ttl and (age is None or float(age) > TOKEN_TTL_SECONDS):
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
    """POST https://online.smartlombard.ru/api/exchange/v1/auth/access_token
    multipart/form-data: account_id (int), secret_key (str)
    Документация: https://docs.api.smartlombard.ru/src/methods_autorization.html
    Ответ: {status: true, result: {access_token: ...}}
    ВАЖНО: secret_key удаляется при смене пароля сотрудника,
    восстановлении через «Забыли?», отключении ключа вручную или увольнении.
    """
    account_id_raw = (os.environ.get('SMARTLOMBARD_ACCOUNT_ID') or '').strip()
    secret_key = (os.environ.get('SMARTLOMBARD_SECRET_KEY') or '').strip()
    if not account_id_raw or not secret_key:
        return None, 'SMARTLOMBARD_ACCOUNT_ID/SMARTLOMBARD_SECRET_KEY не заданы'
    # account_id строго integer (по спеке)
    try:
        account_id_int = int(account_id_raw)
    except Exception:
        return None, f'auth: SMARTLOMBARD_ACCOUNT_ID должен быть числом, получено: "{account_id_raw}"'

    try:
        r = requests.post(
            AUTH_URL,
            files={
                'account_id': (None, str(account_id_int)),
                'secret_key': (None, secret_key),
            },
            timeout=20,
        )
    except Exception as e:
        return None, f'auth: network error {e}'
    try:
        data = r.json()
    except Exception:
        return None, f'auth: bad json (status {r.status_code}, body={r.text[:200]})'
    if not data.get('status'):
        msg = data.get('message') or data.get('error') or data.get('errors') or 'failed'
        # Полезные подсказки по типичным причинам
        hint = ''
        msg_str = json.dumps(msg, ensure_ascii=False) if not isinstance(msg, str) else msg
        msg_low = msg_str.lower()
        if 'secret' in msg_low or 'ключ' in msg_low:
            hint = ' (возможно, secret_key был удалён в SmartLombard — перевыпусти его в карточке сотрудника)'
        elif 'account' in msg_low or 'пользоват' in msg_low:
            hint = ' (проверь SMARTLOMBARD_ACCOUNT_ID в секретах)'
        return None, f'auth: {msg_str} (HTTP {r.status_code}){hint}'
    res = data.get('result') or {}
    token = res.get('access_token')
    if isinstance(token, dict):
        token = token.get('access_token') or token.get('token') or token.get('value')
    if not token:
        return None, f'auth: no access_token in response (got: {json.dumps(data, ensure_ascii=False)[:200]})'
    return str(token), None


def _request_new_token_verbose() -> dict:
    """Возвращает аудит-инфу о текущем кэшированном токене (без сетевого запроса).
    Чтобы не упереться в rate-limit, реальный POST не делаем."""
    info: dict = {
        'request_url': AUTH_URL,
        'request_method': 'POST',
        'request_body_form': {
            'account_id': os.environ.get('SMARTLOMBARD_ACCOUNT_ID', '(не задан)'),
            'secret_key': '(скрыт)' if os.environ.get('SMARTLOMBARD_SECRET_KEY') else '(не задан)',
        },
        'note': 'Реальный POST к /auth/access_token не делается — лимит 1 раз / 20 мин. Используется кэшированный токен.',
    }
    try:
        conn = _get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)), payload IS NOT NULL "
            f"FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{TOKEN_CACHE_KEY}'"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if row:
            age, has = row
            info['cached_token_age_sec'] = int(float(age)) if age is not None else None
            info['cached_token_present'] = bool(has)
            info['cached_token_fresh'] = (age is not None and float(age) <= TOKEN_TTL_SECONDS)
        else:
            info['cached_token_present'] = False
    except Exception as e:
        info['cache_error'] = str(e)
    return info


def _get_access_token(force: bool = False) -> tuple[str | None, str | None]:
    """Возвращает токен из кэша БД (если ему меньше 19 мин) либо запрашивает новый.
    При 429 (rate limit) откатывается на старый токен из БД, если он там есть."""
    if not force:
        cached = _token_cache_get()
        if cached:
            return cached, None
    token, err = _request_new_token()
    if token:
        _token_cache_set(token)
        return token, None
    # Fallback: если SmartLombard вернул 429 — пробуем старый токен из БД (часто он ещё рабочий)
    if err and ('429' in err or 'не более чем 1 раз' in err or 'rate' in err.lower()):
        old = _token_cache_get(ignore_ttl=True)
        if old:
            return old, None
    return token, err


def _is_no_data_error(data: dict) -> bool:
    """Smartlombard на page=1 при отсутствии данных возвращает 412 со словом 'максимальное количество страниц: 0'."""
    msg_blob = json.dumps(data, ensure_ascii=False).lower()
    return 'максимальное количество страниц' in msg_blob or 'максимальное кол' in msg_blob


def _fetch_all_pages(url: str, token: str, params: dict, max_pages: int = 50) -> tuple[list, str | None, dict | None]:
    items: list = []
    page = 1
    debug_first: dict | None = None
    while page <= max_pages:
        q = dict(params)
        q['page'] = page
        q['limit'] = 100
        # Полный URL с query — чтобы можно было скопировать для тикета поддержки
        try:
            from urllib.parse import urlencode
            full_url = f'{url}?{urlencode(q)}'
        except Exception:
            full_url = url
        req_headers = {'Authorization': f'Bearer {token[:8]}…(скрыто)'}  # для дебага
        try:
            r = requests.get(url, params=q, headers={'Authorization': f'Bearer {token}'}, timeout=25)
        except Exception as e:
            return items, f'ops: network error {e}', debug_first
        raw_body = r.text[:2500] if hasattr(r, 'text') else ''
        try:
            data = r.json()
        except Exception:
            if page == 1:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            return items, f'ops: bad json (status {r.status_code})', debug_first
        # 412 "максимальное количество страниц: 0" = данных нет, это не ошибка
        if r.status_code == 412 and _is_no_data_error(data):
            if page == 1:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'pagination': {'total_pages': 0}, 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            break
        if not data.get('status'):
            if page == 1:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            return items, f'ops: {data.get("message") or data.get("error") or "failed"} (status {r.status_code})', debug_first
        result = data.get('result') or {}
        ops = result.get('operations') or []
        if page == 1:
            debug_first = {
                'page1_count': len(ops),
                'sample': ops[:2],
                'pagination': (data.get('metadata') or {}).get('pagination'),
                'request_url': full_url,
                'request_headers': req_headers,
                'response_status': r.status_code,
                'response_raw': raw_body,
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
    sales_total = 0.0   # продажи товаров (реализация)
    sales_count = 0
    pledge_total = 0.0
    pledge_count = 0
    buyout_total = 0.0
    buyout_count = 0
    by_type: dict[str, float] = {}
    by_type_count: dict[str, int] = {}

    for op in operations:
        t = (op.get('type_operation') or '').strip()
        primary = t.split(',')[0].strip() if t else ''
        s = _to_float(op.get('sum'))
        by_type[primary] = by_type.get(primary, 0.0) + s
        by_type_count[primary] = by_type_count.get(primary, 0) + 1
        if primary in INCOME_TYPES:
            income += s
        elif primary in EXPENSE_TYPES:
            expense += s
        if primary == 'sell_realization':
            sales_total += s
            sales_count += 1
        elif primary == 'pledge':
            pledge_total += s
            pledge_count += 1
        elif primary in ('buyout', 'part_buyout', 'part_buyout_pawn_good'):
            buyout_total += s
            buyout_count += 1

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
        'sales_total': int(round(sales_total)),
        'sales_count': sales_count,
        'pledge_total': int(round(pledge_total)),
        'pledge_count': pledge_count,
        'buyout_total': int(round(buyout_total)),
        'buyout_count': buyout_count,
        'by_type': {k: int(round(v)) for k, v in by_type.items()},
        'by_type_count': by_type_count,
    }


def _match_path(path: str, allowed: set) -> bool:
    """Проверяет path по белому списку. {id} = одно или несколько цифровых сегментов."""
    if path in allowed:
        return True
    parts = path.strip('/').split('/')
    for tpl in allowed:
        tpl_parts = tpl.strip('/').split('/')
        if len(tpl_parts) != len(parts):
            continue
        ok = True
        for tp, p in zip(tpl_parts, parts):
            if tp == '{id}':
                if not p.isdigit():
                    ok = False; break
            elif tp != p:
                ok = False; break
        if ok:
            return True
    return False


def _proxy_call(method: str, path: str, params: dict, body: dict | None, base: str = API_BASE) -> tuple[int, dict]:
    """Универсальный вызов smartlombard API с авто-обновлением токена при 401."""
    token, err = _get_access_token()
    if err or not token:
        return 502, {'error': err or 'auth failed'}

    url = base.rstrip('/') + '/' + path.lstrip('/')

    def _do(tok: str):
        headers = {'Authorization': f'Bearer {tok}'}
        if method.upper() == 'GET':
            return requests.get(url, params=params or {}, headers=headers, timeout=25)
        return requests.request(method.upper(), url, params=params or {},
                                json=body if body is not None else None,
                                headers=headers, timeout=25)
    try:
        r = _do(token)
        if r.status_code == 401:
            token2, err2 = _get_access_token(force=True)
            if token2:
                r = _do(token2)
        try:
            data = r.json()
        except Exception:
            return r.status_code, {'error': f'bad json (status {r.status_code})'}
        # 412 «страниц 0» = пустой результат, не ошибка
        if r.status_code == 412 and _is_no_data_error(data):
            return 200, {'status': True, 'http_code': 200, 'result': {'operations': [], 'pawn_tickets': [], 'clients': [], 'goods': []}, 'metadata': {'pagination': {'total_pages': 0}}}
        return r.status_code, data
    except Exception as e:
        return 502, {'error': f'network: {e}'}


# ============================================================================
# Парсер «Касса и банк → Операции по датам» (online.smartlombard.ru, HTML)
# Используется логин/пароль из SMARTLOMBARD_LOGIN/SMARTLOMBARD_PASSWORD.
# Кассовый отчёт показывает реальные продажи (Iphone 15, Sony PS4 и т.д.)
# которые НЕ возвращаются через REST API /operations.
# ============================================================================

KASSA_BASE = 'https://online.smartlombard.ru'
KASSA_LOGIN_PAGE = f'{KASSA_BASE}/login'
KASSA_LOGIN_POST = f'{KASSA_BASE}/login'
KASSA_PERIOD_URL = f'{KASSA_BASE}/cash/period'  # «Операции по датам»
KASSA_SESSION_KEY = '__kassa_session__'
KASSA_SESSION_TTL = 25 * 60  # 25 минут


def _kassa_session_get() -> dict | None:
    try:
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT payload, EXTRACT(EPOCH FROM (NOW() - updated_at)) FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{KASSA_SESSION_KEY}'"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return None
        payload, age = row
        if age is None or float(age) > KASSA_SESSION_TTL:
            return None
        if isinstance(payload, str):
            payload = json.loads(payload)
        return payload or None
    except Exception:
        return None


def _kassa_session_set(cookies: dict) -> None:
    try:
        payload_safe = json.dumps({'cookies': cookies}, ensure_ascii=False).replace("'", "''")
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.smartlombard_cache (cache_key, payload, updated_at) "
            f"VALUES ('{KASSA_SESSION_KEY}', '{payload_safe}'::jsonb, NOW()) "
            f"ON CONFLICT (cache_key) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()"
        )
        conn.commit(); cur.close(); conn.close()
    except Exception:
        pass


def _kassa_login() -> tuple[requests.Session | None, str | None]:
    login = os.environ.get('SMARTLOMBARD_LOGIN', '').strip()
    password = os.environ.get('SMARTLOMBARD_PASSWORD', '').strip()
    if not login or not password:
        return None, 'SMARTLOMBARD_LOGIN/SMARTLOMBARD_PASSWORD не заданы'
    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
    })
    try:
        from bs4 import BeautifulSoup
    except Exception as e:
        return None, f'kassa: bs4 not installed ({e})'
    try:
        # 1) GET страницы логина — получаем CSRF и cookies
        r = s.get(KASSA_LOGIN_PAGE, timeout=20, allow_redirects=True)
        if r.status_code >= 500:
            return None, f'kassa: login page status {r.status_code}'
        soup = BeautifulSoup(r.text, 'lxml')
        # ищем форму логина и скрытые поля
        form = soup.find('form')
        payload = {}
        if form:
            for inp in form.find_all('input'):
                name = inp.get('name')
                if not name:
                    continue
                payload[name] = inp.get('value', '')
        # подставляем логин/пароль (имена полей варьируются)
        for k in list(payload.keys()):
            kl = k.lower()
            if 'login' in kl or 'email' in kl or 'user' in kl:
                payload[k] = login
            elif 'pass' in kl:
                payload[k] = password
        if 'login' not in payload and 'email' not in payload:
            payload['login'] = login
        if 'password' not in payload:
            payload['password'] = password

        # 2) POST логина
        action = (form.get('action') if form else None) or KASSA_LOGIN_POST
        if action and not action.startswith('http'):
            action = KASSA_BASE + (action if action.startswith('/') else '/' + action)
        r2 = s.post(action, data=payload, timeout=25, allow_redirects=True)
        if r2.status_code >= 400:
            return None, f'kassa: login post status {r2.status_code}'
        # эвристика успеха: на странице после логина не должно быть формы логина
        if 'name="password"' in r2.text.lower() and '/login' in r2.url:
            return None, 'kassa: login failed (still on login page)'
        # сохраняем cookies
        cookies = requests.utils.dict_from_cookiejar(s.cookies)
        if cookies:
            _kassa_session_set(cookies)
        return s, None
    except Exception as e:
        return None, f'kassa: login exception {e}'


def _kassa_get_session() -> tuple[requests.Session | None, str | None]:
    cached = _kassa_session_get()
    if cached and isinstance(cached, dict) and cached.get('cookies'):
        s = requests.Session()
        s.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
        for k, v in cached['cookies'].items():
            s.cookies.set(k, v)
        return s, None
    return _kassa_login()


def _kassa_dmy_to_iso(dmy: str) -> str:
    # 'DD.MM.YYYY' -> 'YYYY-MM-DD'
    parts = dmy.split('.')
    if len(parts) == 3:
        return f'{parts[2]}-{parts[1]}-{parts[0]}'
    return dmy


def _kassa_money(s: str) -> float:
    if not s:
        return 0.0
    cleaned = s.replace('\xa0', '').replace(' ', '').replace('руб.', '').replace('₽', '').replace(',', '.').strip()
    try:
        return float(cleaned)
    except Exception:
        return 0.0


def _kassa_fetch_period(date_from_dmy: str, date_to_dmy: str) -> tuple[dict | None, str | None]:
    """Парсит «Касса и банк → Операции по датам» и возвращает суммы прихода/расхода
    + список операций «Продажа товара» и «Скупка»."""
    try:
        from bs4 import BeautifulSoup
    except Exception as e:
        return None, f'kassa: bs4 not installed ({e})'

    s, err = _kassa_get_session()
    if err or not s:
        return None, err

    df_iso = _kassa_dmy_to_iso(date_from_dmy)
    dt_iso = _kassa_dmy_to_iso(date_to_dmy)

    # Разные варианты параметров — подбираем что-нибудь, что сработает
    param_variants = [
        {'from': df_iso, 'to': dt_iso},
        {'date_from': df_iso, 'date_to': dt_iso},
        {'date_begin': date_from_dmy, 'date_end': date_to_dmy},
        {'period_from': df_iso, 'period_to': dt_iso},
        {'beginDate': df_iso, 'endDate': dt_iso},
    ]
    html = ''
    used_params = None
    last_status = None
    for params in param_variants:
        try:
            r = s.get(KASSA_PERIOD_URL, params=params, timeout=30, allow_redirects=True)
        except Exception as e:
            return None, f'kassa: period network {e}'
        last_status = r.status_code
        if r.status_code == 200 and ('Приход' in r.text or 'Расход' in r.text or 'period' in r.url):
            html = r.text
            used_params = params
            break
        # если редиректнуло на login — повторим логин один раз
        if '/login' in r.url:
            s2, err2 = _kassa_login()
            if err2 or not s2:
                return None, err2
            s = s2
            try:
                r = s.get(KASSA_PERIOD_URL, params=params, timeout=30, allow_redirects=True)
            except Exception as e:
                return None, f'kassa: period network after relogin {e}'
            if r.status_code == 200:
                html = r.text; used_params = params; break

    if not html:
        return None, f'kassa: empty response (status {last_status})'

    soup = BeautifulSoup(html, 'lxml')

    # Извлекаем общие суммы
    def _extract_sum_after(label: str) -> float:
        # Ищем "Приход: 192 994.00 руб." как текст
        import re
        # Текст в html может быть в любом теге
        for tag in soup.find_all(string=re.compile(label, re.IGNORECASE)):
            txt = str(tag)
            m = re.search(rf'{label}\s*:?\s*([\d\s.,\xa0]+)', txt, re.IGNORECASE)
            if m:
                return _kassa_money(m.group(1))
        return 0.0

    income_total = _extract_sum_after('Приход')
    expense_total = _extract_sum_after('Расход')

    # Извлекаем таблицы — обычно это две таблицы: приходные и расходные операции
    sales_items: list = []   # «Продажа товара»
    buyout_items: list = []  # «Скупка»

    for table in soup.find_all('table'):
        rows = table.find_all('tr')
        if len(rows) < 2:
            continue
        # заголовки
        header_cells = [c.get_text(strip=True).lower() for c in rows[0].find_all(['th', 'td'])]
        if not header_cells or 'действие' not in ' '.join(header_cells):
            continue
        # ищем индексы колонок
        try:
            i_time = next(i for i, h in enumerate(header_cells) if 'врем' in h or 'дата' in h)
        except StopIteration:
            i_time = 0
        try:
            i_action = next(i for i, h in enumerate(header_cells) if 'действ' in h)
        except StopIteration:
            i_action = 1
        try:
            i_desc = next(i for i, h in enumerate(header_cells) if 'описан' in h)
        except StopIteration:
            i_desc = 2
        try:
            i_sum = next(i for i, h in enumerate(header_cells) if 'сумм' in h)
        except StopIteration:
            i_sum = 3

        for tr in rows[1:]:
            cells = [c.get_text(' ', strip=True) for c in tr.find_all(['td', 'th'])]
            if len(cells) <= max(i_time, i_action, i_desc, i_sum):
                continue
            action_l = cells[i_action].lower()
            item = {
                'time': cells[i_time],
                'action': cells[i_action],
                'desc': cells[i_desc],
                'sum': _kassa_money(cells[i_sum]),
            }
            if 'продаж' in action_l:
                sales_items.append(item)
            elif 'скупк' in action_l or 'покупк' in action_l:
                buyout_items.append(item)

    sales_sum = round(sum(x['sum'] for x in sales_items), 2)
    buyout_sum = round(sum(x['sum'] for x in buyout_items), 2)

    return {
        'date_from': date_from_dmy,
        'date_to': date_to_dmy,
        'income_total': income_total,
        'expense_total': expense_total,
        'sales_total': sales_sum,
        'sales_count': len(sales_items),
        'buyout_total': buyout_sum,
        'buyout_count': len(buyout_items),
        'sales': sales_items[:200],
        'buyouts': buyout_items[:200],
        'used_params': used_params,
    }, None


def handler(event: dict, context) -> dict:
    """SmartLombard API proxy + статистика.
    actions:
      - stats (default): агрегированные приход/расход/прибыль за период (owner/admin).
      - proxy: универсальный proxy к smartlombard (любой staff). body={path,method,params,body}.
      - kassa_period: парсинг «Касса и банк → Операции по датам» (HTML с online.smartlombard.ru).
      - operations_list, pawn_tickets, clients, goods, branches, categories — упрощённые обёртки.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod') or 'GET'
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})

    action = (params.get('action') or body.get('action') or 'stats').lower()

    # ---------- PROXY (всем сотрудникам) ----------
    if action == 'proxy':
        ok, role = _check_token(event, allow_all_staff=True)
        if not ok:
            return _err(401, 'Unauthorized')
        target_method = (body.get('method') or 'GET').upper()
        target_path = body.get('path') or ''
        target_params = body.get('params') or {}
        target_body = body.get('body')
        use_goods = bool(body.get('goods'))

        if not target_path.startswith('/'):
            target_path = '/' + target_path

        # белый список
        if use_goods:
            allowed = GOODS_GET_PATHS if target_method == 'GET' else set()
        else:
            if target_method == 'GET':
                allowed = PROXY_GET_PATHS
            elif target_method == 'POST':
                allowed = PROXY_POST_PATHS
            elif target_method == 'PUT':
                allowed = PROXY_PUT_PATHS
            else:
                return _err(405, f'method {target_method} not allowed')
        if not _match_path(target_path, allowed):
            return _err(403, f'path {target_path} not in allowlist for {target_method}')

        # Запись разрешена только owner/admin
        if target_method != 'GET' and role not in ('owner', 'admin'):
            return _err(403, 'Запись доступна только владельцу/администратору')

        base = GOODS_API_BASE if use_goods else API_BASE
        status, data = _proxy_call(target_method, target_path, target_params, target_body, base)
        return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}

    # ---------- AUTH_CHECK: проверка/перевыпуск токена SmartLombard ----------
    # Документация: https://docs.api.smartlombard.ru/src/methods_autorization.html
    if action == 'auth_check':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')
        force = (params.get('force') or body.get('force') or '').strip().lower() in ('1', 'true', 'yes')
        # Возраст текущего токена в кэше
        token_age_sec: int | None = None
        try:
            conn = _get_conn(); cur = conn.cursor()
            cur.execute(
                f"SELECT EXTRACT(EPOCH FROM (NOW() - updated_at)) FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{TOKEN_CACHE_KEY}'"
            )
            row = cur.fetchone()
            cur.close(); conn.close()
            if row and row[0] is not None:
                token_age_sec = int(float(row[0]))
        except Exception:
            pass

        if force:
            tok, err = _request_new_token()
            if err or not tok:
                return _err(502, err or 'auth failed')
            _token_cache_set(tok)
            return _ok({
                'ok': True, 'forced': True,
                'token_age_sec': 0,
                'token_expires_in_sec': TOKEN_TTL_SECONDS,
            })

        tok, err = _get_access_token(force=False)
        if err or not tok:
            return _err(502, err or 'auth failed')
        ttl_left = max(0, TOKEN_TTL_SECONDS - (token_age_sec or 0))
        return _ok({
            'ok': True, 'forced': False,
            'token_age_sec': token_age_sec or 0,
            'token_expires_in_sec': ttl_left,
        })

    # ---------- KASSA_PERIOD: парсинг «Касса и банк → Операции по датам» ----------
    if action == 'kassa_period':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')
        df = _parse_date_param(params.get('date_from') or params.get('date') or '')
        dt = _parse_date_param(params.get('date_to') or params.get('date') or '') if (params.get('date_to') or params.get('date')) else df
        nocache_k = (params.get('nocache') or '').lower() in ('1', 'true', 'yes')
        ck = f'kassa__{df}__{dt}'
        if not nocache_k:
            cached = _cache_get(ck)
            if cached is not None:
                cached['cached'] = True
                return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(cached, ensure_ascii=False)}
        data, err = _kassa_fetch_period(df, dt)
        if err or not data:
            return {'statusCode': 502, 'headers': HEADERS,
                    'body': json.dumps({'error': err or 'kassa parse failed', 'date_from': df, 'date_to': dt}, ensure_ascii=False)}
        _cache_set(ck, data)
        data['cached'] = False
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}

    # ---------- STATS (owner/admin) ----------
    ok, _ = _check_token(event, allow_all_staff=False)
    if not ok:
        return _err(401, 'Unauthorized')

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

    # Полный аудит-лог цепочки запросов (для тикета в SmartLombard)
    audit: list = []
    auth_dbg = _request_new_token_verbose() if debug else None
    if auth_dbg:
        audit.append({'stage': 'auth', **auth_dbg})

    token, err = _get_access_token()
    if err or not token:
        body = {'error': err or 'auth failed', 'stage': 'auth'}
        if debug:
            body['date_from'] = date_from
            body['date_to'] = date_to
            body['operations_total'] = 0
            body['elem_operations_total'] = 0
            body['audit'] = audit
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps(body, ensure_ascii=False)}

    q = {'date_begin': date_from, 'date_end': date_to}
    operations, err1, dbg1 = _fetch_all_pages(OPS_URL, token, q)
    if debug and dbg1:
        audit.append({'stage': 'operations', **dbg1})
    if err1:
        body = {'error': err1, 'stage': 'operations'}
        if debug:
            body['date_from'] = date_from
            body['date_to'] = date_to
            body['operations_total'] = len(operations or [])
            body['elem_operations_total'] = 0
            body['operations_debug'] = dbg1
            body['audit'] = audit
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps(body, ensure_ascii=False)}

    elem_operations, err2, dbg2 = _fetch_all_pages(ELEM_OPS_URL, token, q)
    if debug and dbg2:
        audit.append({'stage': 'elementary_operations', **dbg2})
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
                    'audit': audit,
                }, ensure_ascii=False)}

    payload = {
        'date_from': date_from,
        'date_to': date_to,
        'income': agg['income'],
        'expense': agg['expense'],
        'period_income': agg['period_income'],
        'period_costs': agg['period_costs'],
        'period_profit': agg['period_profit'],
        'sales_total': agg['sales_total'],
        'sales_count': agg['sales_count'],
        'pledge_total': agg['pledge_total'],
        'pledge_count': agg['pledge_count'],
        'buyout_total': agg['buyout_total'],
        'buyout_count': agg['buyout_count'],
        'by_type': agg['by_type'],
        'by_type_count': agg['by_type_count'],
        'operations_total': len(operations),
    }

    # ВАЖНО: HTML-парсер «Кассы и банк» отключён — поддержка SmartLombard
    # подтвердила, что токен через REST /auth/access_token выдаётся 1 раз и
    # действует ~20 мин. Все нужные данные (приход/расход, продажи товара
    # sell_realization, выкупы) уже приходят через REST API /operations.
    # Кэширование токена в _get_access_token уже учитывает ограничение 19 мин.

    _cache_set(cache_key, payload)
    payload['cached'] = False
    return {
        'statusCode': 200, 'headers': HEADERS,
        'body': json.dumps(payload, ensure_ascii=False)
    }


def _err(code: int, msg: str) -> dict:
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def _ok(data: dict) -> dict:
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}