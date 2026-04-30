import json
import os
import re
from datetime import datetime, timedelta, timezone

import psycopg2
import requests

# Build marker — bump для принудительного передеплоя и подхвата новых секретов
_BUILD_MARKER = '2026-04-29-redeploy-keys'

CACHE_TTL_SECONDS = 60
TOKEN_TTL_SECONDS = 23 * 60 * 60  # smartlombard: токен живёт 24 часа (берём 23ч с запасом). Лимит 1 раз / 20 мин — это лимит на ПЕРЕвыпуск, не TTL.
TOKEN_CACHE_KEY = '__access_token__'

API_BASE = 'https://online.smartlombard.ru/api/exchange/v1'
GOODS_API_BASE = 'https://goods.api.smartlombard.ru/api/exchange/v1'
# Согласно документации REST API: токен выдаётся на том же хосте online.smartlombard.ru
# (не auth.api.* — это был неверный домен из старой документации).
AUTH_API_BASE = 'https://online.smartlombard.ru/api/exchange/v1'
AUTH_URL = f'{AUTH_API_BASE}/auth/access_token'
# Старый (legacy) URL — оставлен как fallback для совместимости со старыми ключами
AUTH_URL_LEGACY = 'https://auth.api.smartlombard.ru/api/exchange/v1/auth/access_token'
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


def _get_api_keys_list() -> list[dict]:
    """Возвращает список всех API-сотрудников: [{account_id, secret_key}, ...].
    1) Сначала читает SMARTLOMBARD_API_KEYS (JSON-массив) — основной способ.
    2) Если его нет — fallback на старые SMARTLOMBARD_ACCOUNT_ID + SMARTLOMBARD_SECRET_KEY.
    """
    raw = (os.environ.get('SMARTLOMBARD_API_KEYS') or '').strip()
    keys: list[dict] = []
    if raw:
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        aid = str(item.get('account_id') or '').strip()
                        sk = str(item.get('secret_key') or '').strip()
                        if aid and sk:
                            keys.append({'account_id': aid, 'secret_key': sk})
        except Exception:
            pass
    if not keys:
        aid = (os.environ.get('SMARTLOMBARD_ACCOUNT_ID') or '').strip()
        sk = (os.environ.get('SMARTLOMBARD_SECRET_KEY') or '').strip()
        if aid and sk:
            keys.append({'account_id': aid, 'secret_key': sk})
    return keys


def _request_new_token_for(account_id_raw: str, secret_key: str) -> tuple[str | None, str | None]:
    """POST /auth/access_token для конкретной пары account_id+secret_key.
    Пробует основной URL (online.smartlombard.ru), при неудаче — legacy (auth.api.*).
    """
    if not account_id_raw or not secret_key:
        return None, 'account_id/secret_key пусты'
    try:
        account_id_int = int(account_id_raw)
    except Exception:
        return None, f'auth: account_id должен быть числом, получено: "{account_id_raw}"'

    last_err: str | None = None
    for auth_endpoint in (AUTH_URL, AUTH_URL_LEGACY):
        try:
            r = requests.post(
                auth_endpoint,
                files={
                    'account_id': (None, str(account_id_int)),
                    'secret_key': (None, secret_key),
                },
                timeout=20,
            )
        except Exception as e:
            last_err = f'auth: network error {e} (url={auth_endpoint})'
            continue
        try:
            data = r.json()
        except Exception:
            last_err = f'auth: bad json (status {r.status_code}, body={r.text[:200]}, url={auth_endpoint})'
            continue
        if not data.get('status'):
            msg = data.get('message') or data.get('error') or data.get('errors') or 'failed'
            msg_str = json.dumps(msg, ensure_ascii=False) if not isinstance(msg, str) else msg
            last_err = f'auth[{account_id_raw}]: {msg_str} (HTTP {r.status_code}, url={auth_endpoint})'
            continue
        res = data.get('result') or {}
        token = res.get('access_token')
        if isinstance(token, dict):
            token = token.get('access_token') or token.get('token') or token.get('value')
        if not token:
            last_err = f'auth[{account_id_raw}]: no access_token in response (url={auth_endpoint})'
            continue
        return str(token), None
    return None, last_err or f'auth[{account_id_raw}]: failed on both endpoints'


def _request_new_token() -> tuple[str | None, str | None]:
    """Совместимость: получает токен для первого ключа в списке."""
    keys = _get_api_keys_list()
    if not keys:
        return None, 'SMARTLOMBARD_API_KEYS / SMARTLOMBARD_ACCOUNT_ID не заданы'
    return _request_new_token_for(keys[0]['account_id'], keys[0]['secret_key'])


def _token_cache_key_for(account_id: str) -> str:
    return f'__access_token_{account_id}__'


def _get_token_for_key(account_id: str, secret_key: str, force: bool = False) -> tuple[str | None, str | None]:
    """Возвращает токен конкретного API-сотрудника (из БД-кэша или новый).
    Кэш индивидуальный по account_id, чтобы каждый сотрудник попадал в свой 20-минутный лимит."""
    cache_key = _token_cache_key_for(account_id)
    if not force:
        try:
            conn = _get_conn()
            cur = conn.cursor()
            cur.execute(
                f"SELECT payload, EXTRACT(EPOCH FROM (NOW() - updated_at)) FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{cache_key}'"
            )
            row = cur.fetchone()
            cur.close(); conn.close()
            if row:
                payload, age = row
                if age is not None and float(age) <= TOKEN_TTL_SECONDS:
                    if isinstance(payload, str):
                        payload = json.loads(payload)
                    tok = (payload or {}).get('token')
                    if tok:
                        return tok, None
        except Exception:
            pass
    token, err = _request_new_token_for(account_id, secret_key)
    if token:
        try:
            payload_safe = json.dumps({'token': token}, ensure_ascii=False).replace("'", "''")
            conn = _get_conn()
            cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.smartlombard_cache (cache_key, payload, updated_at) "
                f"VALUES ('{cache_key}', '{payload_safe}'::jsonb, NOW()) "
                f"ON CONFLICT (cache_key) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()"
            )
            conn.commit(); cur.close(); conn.close()
        except Exception:
            pass
        return token, None
    # Fallback при 429: используем последний валидный токен из кэша, даже просроченный
    if err and ('429' in err or 'не более чем 1 раз' in err):
        try:
            conn = _get_conn()
            cur = conn.cursor()
            cur.execute(
                f"SELECT payload FROM {SCHEMA}.smartlombard_cache WHERE cache_key='{cache_key}'"
            )
            row = cur.fetchone()
            cur.close(); conn.close()
            if row:
                payload = row[0]
                if isinstance(payload, str):
                    payload = json.loads(payload)
                tok = (payload or {}).get('token')
                if tok:
                    return tok, None
        except Exception:
            pass
    return None, err


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
    """SmartLombard сигналит «данных нет» по-разному:
    - старый формат (page): 412 + «максимальное количество страниц: 0»
    - новый формат (offset): HTTP 200 + {status:false, http_code:204, error:{message:"Данных по запросу не найдено"}}
    Оба варианта — это НЕ ошибка, а пустой результат."""
    if not isinstance(data, dict):
        return False
    # Новый формат: http_code=204
    if data.get('http_code') == 204:
        return True
    msg_blob = json.dumps(data, ensure_ascii=False).lower()
    if 'максимальное количество страниц' in msg_blob or 'максимальное кол' in msg_blob:
        return True
    if 'данных по запросу не найдено' in msg_blob or 'данные не найдены' in msg_blob:
        return True
    return False


def _fetch_all_pages_multi_account(url: str, params: dict) -> tuple[list, list[dict], list[dict]]:
    """Перебирает ВСЕХ API-сотрудников из SMARTLOMBARD_API_KEYS и объединяет
    операции от каждого (дедупликация по id). Возвращает (items, per_account_stats, audit).
    per_account_stats — что вернул каждый сотрудник (для дебага)."""
    keys = _get_api_keys_list()
    seen_ids: set = set()
    all_items: list = []
    per_account: list[dict] = []
    audit: list[dict] = []
    for k in keys:
        aid = k['account_id']
        sk = k['secret_key']
        token, terr = _get_token_for_key(aid, sk)
        if terr or not token:
            per_account.append({'account_id': aid, 'count': 0, 'error': terr or 'no token'})
            audit.append({'stage': f'auth[{aid}]', 'error': terr or 'no token'})
            continue
        items, ferr, dbg = _fetch_all_pages(url, token, params)
        # Дедупликация: операция могла вернуться у нескольких сотрудников
        added = 0
        for op in items:
            op_id = op.get('id') if isinstance(op, dict) else None
            if op_id is None or op_id not in seen_ids:
                if op_id is not None:
                    seen_ids.add(op_id)
                all_items.append(op)
                added += 1
        per_account.append({'account_id': aid, 'count': len(items), 'added': added, 'error': ferr})
        if dbg:
            audit.append({'stage': f'operations[{aid}]', **dbg})
    return all_items, per_account, audit


def _fetch_all_pages(url: str, token: str, params: dict, max_pages: int = 50) -> tuple[list, str | None, dict | None]:
    """Пагинация по offset (page deprecated в SmartLombard). limit=100, offset=0,100,200..."""
    items: list = []
    limit = 100
    offset = 0
    iteration = 0
    debug_first: dict | None = None
    while iteration < max_pages:
        q = dict(params)
        q['limit'] = limit
        q['offset'] = offset
        try:
            from urllib.parse import urlencode
            full_url = f'{url}?{urlencode(q)}'
        except Exception:
            full_url = url
        req_headers = {'Authorization': f'Bearer {token[:8]}…(скрыто)'}
        try:
            r = requests.get(url, params=q, headers={'Authorization': f'Bearer {token}'}, timeout=25)
        except Exception as e:
            return items, f'ops: network error {e}', debug_first
        raw_body = r.text[:2500] if hasattr(r, 'text') else ''
        try:
            data = r.json()
        except Exception:
            if iteration == 0:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            return items, f'ops: bad json (status {r.status_code})', debug_first
        # «Данных по запросу не найдено» = НЕ ошибка, просто пусто.
        # Покрывает: 412 + «максимальное количество страниц», 200 + http_code:204.
        if _is_no_data_error(data):
            if iteration == 0:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'pagination': {'total': 0}, 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            break
        if not data.get('status'):
            if iteration == 0:
                debug_first = {
                    'page1_count': 0, 'sample': [], 'no_data': True,
                    'request_url': full_url, 'request_headers': req_headers,
                    'response_status': r.status_code, 'response_raw': raw_body,
                }
            # Расшифровка типичных ошибок SmartLombard
            err_obj = data.get('error') or data.get('message') or 'failed'
            err_msg = err_obj.get('message') if isinstance(err_obj, dict) else err_obj
            err_msg_str = str(err_msg)
            hint = ''
            if r.status_code == 405 or 'нет прав' in err_msg_str.lower() or 'no permission' in err_msg_str.lower():
                hint = ' [нет прав в SmartLombard — дать сотруднику доступ к операциям через API]'
            elif r.status_code == 401 or r.status_code == 403:
                hint = ' [авторизация отклонена — проверь secret_key]'
            return items, f'ops: {err_msg_str} (status {r.status_code}){hint}', debug_first
        result = data.get('result') or {}
        ops = result.get('operations') or []
        if iteration == 0:
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
        total = pagination.get('total') or pagination.get('total_count') or pagination.get('totalCount')
        if total is not None:
            try:
                if offset + len(ops) >= int(total):
                    break
            except Exception:
                pass
        if len(ops) < limit:
            break
        offset += limit
        iteration += 1
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
KASSA_SITE = 'komissionka'  # профиль (важно: без site=komissionka сервер возвращает {"fail":""})
KASSA_LOGIN_PAGE = f'{KASSA_BASE}/login/?site={KASSA_SITE}'
KASSA_LOGIN_POST = f'{KASSA_BASE}/auth/login'  # реальный эндпоинт (найден через kassa_diag)
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
    """Логин в SmartLombard (профиль komissionka).
    Сценарий: GET /login/?site=komissionka (получаем session cookie)
    → POST /auth/login с form-data (login, password) в той же сессии.
    Сервер возвращает JSON: {"ok":true,...} при успехе или {"fail":"..."} при ошибке.
    """
    login = os.environ.get('SMARTLOMBARD_LOGIN', '').strip()
    password = os.environ.get('SMARTLOMBARD_PASSWORD', '').strip()
    if not login or not password:
        return None, 'SMARTLOMBARD_LOGIN/SMARTLOMBARD_PASSWORD не заданы'
    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'ru,en;q=0.9',
    })
    try:
        # 1) GET страницы логина (с site=komissionka) — получаем session cookie
        s.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        r = s.get(KASSA_LOGIN_PAGE, timeout=20, allow_redirects=True)
        if r.status_code >= 500:
            return None, f'kassa: login page status {r.status_code}'

        # 2) POST логина на /auth/login (form-data, в той же сессии)
        post_headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': KASSA_BASE,
            'Referer': KASSA_LOGIN_PAGE,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
        payload = {'login': login, 'password': password, 'site': KASSA_SITE}
        r2 = s.post(KASSA_LOGIN_POST, data=payload, headers=post_headers, timeout=25, allow_redirects=False)
        if r2.status_code >= 500:
            return None, f'kassa: auth/login status {r2.status_code}'

        # Разбираем JSON-ответ
        try:
            j = r2.json()
        except Exception:
            j = None
        if isinstance(j, dict):
            if 'fail' in j and j.get('fail') != '':
                return None, f"kassa: login fail ({j.get('fail')})"
            if 'fail' in j and j.get('fail') == '':
                # пустой fail — обычно означает «неверный логин/пароль» (без подсказки)
                return None, 'kassa: login fail (пустой fail — неверный логин/пароль или нужен сайт komissionka)'

        # Успех: cookies должны включать session/auth
        cookies = requests.utils.dict_from_cookiejar(s.cookies)
        if not cookies:
            return None, 'kassa: после логина нет cookies'
        # Проверяем что больше не редиректит на /login/
        try:
            check = s.get(f'{KASSA_BASE}/?site={KASSA_SITE}', timeout=15, allow_redirects=False)
            if check.status_code in (301, 302):
                loc = check.headers.get('Location') or ''
                if '/login' in loc.lower():
                    return None, f'kassa: после логина редирект на {loc} (учётка не пустила в komissionka)'
        except Exception:
            pass

        _kassa_session_set(cookies)
        return s, None
    except Exception as e:
        return None, f'kassa: login exception {e}'


def _kassa_diag_login() -> dict:
    """Диагностика логина в SmartLombard (komissionka).
    Сценарий = тот же, что и боевой _kassa_login:
    GET /login/?site=komissionka → POST /auth/login (form-data, с session cookies).
    """
    out: dict = {
        'ok': False,
        'login_page': KASSA_LOGIN_PAGE,
        'login_post_url': KASSA_LOGIN_POST,
        'site': KASSA_SITE,
        'steps': [],
        'env': {},
        'form': {},
        'final': {},
        'verdict': '',
    }
    login = os.environ.get('SMARTLOMBARD_LOGIN', '').strip()
    password = os.environ.get('SMARTLOMBARD_PASSWORD', '').strip()
    out['env'] = {
        'SMARTLOMBARD_LOGIN_present': bool(login),
        'SMARTLOMBARD_LOGIN_len': len(login),
        'SMARTLOMBARD_LOGIN_mask': (login[:2] + '***' + login[-2:]) if len(login) > 4 else ('***' if login else ''),
        'SMARTLOMBARD_PASSWORD_present': bool(password),
        'SMARTLOMBARD_PASSWORD_len': len(password),
    }
    if not login or not password:
        out['verdict'] = 'Не заданы SMARTLOMBARD_LOGIN или SMARTLOMBARD_PASSWORD'
        return out

    s = requests.Session()
    s.headers.update({
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
    })

    # ШАГ 1: GET страницы логина (с site=komissionka) — получаем session cookie
    try:
        r = s.get(KASSA_LOGIN_PAGE, timeout=20, allow_redirects=True)
        out['steps'].append({
            'stage': 'GET login page (site=komissionka)',
            'url': KASSA_LOGIN_PAGE,
            'status': r.status_code,
            'final_url': r.url,
            'redirects': [{'from': h.url, 'status': h.status_code, 'to': h.headers.get('Location')} for h in r.history],
            'set_cookies': list(requests.utils.dict_from_cookiejar(s.cookies).keys()),
            'html_len': len(r.text),
            'html_preview': r.text[:400],
        })
    except Exception as e:
        out['steps'].append({'stage': 'GET login page', 'error': str(e)})
        out['verdict'] = f'Не удалось открыть страницу логина: {e}'
        return out

    # ШАГ 2: POST на /auth/login (form-data, в той же сессии)
    payload = {'login': login, 'password': password, 'site': KASSA_SITE}
    payload_safe = {
        'login': (login[:2] + '***' + login[-2:]) if len(login) > 4 else '***',
        'password': f'***({len(password)} chars)',
        'site': KASSA_SITE,
    }
    out['form'] = {
        'login_post_url': KASSA_LOGIN_POST,
        'method': 'POST',
        'content_type': 'application/x-www-form-urlencoded',
        'payload_to_send': payload_safe,
    }

    try:
        post_headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': KASSA_BASE,
            'Referer': KASSA_LOGIN_PAGE,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        }
        r2 = s.post(KASSA_LOGIN_POST, data=payload, headers=post_headers, timeout=25, allow_redirects=False)
        body_text = r2.text or ''
        try:
            body_json = r2.json()
        except Exception:
            body_json = None

        out['steps'].append({
            'stage': 'POST /auth/login (form-data, x-www-form-urlencoded)',
            'url': KASSA_LOGIN_POST,
            'status': r2.status_code,
            'final_url': r2.url,
            'response_content_type': r2.headers.get('Content-Type'),
            'response_json': body_json,
            'response_preview': body_text[:600],
            'set_cookies': list(requests.utils.dict_from_cookiejar(s.cookies).keys()),
        })

        # анализ JSON-ответа
        if isinstance(body_json, dict):
            if 'fail' in body_json and body_json.get('fail') != '':
                out['verdict'] = f"Сервер вернул fail: «{body_json.get('fail')}» — сообщение от smartlombard."
            elif 'fail' in body_json and body_json.get('fail') == '':
                out['verdict'] = (
                    'Сервер ответил {"fail":""} — пустая ошибка. Обычно это «неверный логин/пароль» '
                    'или «учётка не привязана к профилю komissionka». Проверь в браузере: '
                    'https://online.smartlombard.ru/login/?site=komissionka — заходит ли с теми же кредами.'
                )
            elif body_json.get('ok') or body_json.get('success') or body_json.get('redirect'):
                # Успех — проверим следующий запрос
                pass

        # ШАГ 3: проверка авторизации — пробуем зайти на главную с site=komissionka
        try:
            check = s.get(f'{KASSA_BASE}/?site={KASSA_SITE}', timeout=15, allow_redirects=False)
            check_loc = check.headers.get('Location') or ''
            redirects_to_login = bool(check_loc) and '/login' in check_loc.lower()
            out['steps'].append({
                'stage': 'GET /?site=komissionka (проверка)',
                'url': f'{KASSA_BASE}/?site={KASSA_SITE}',
                'status': check.status_code,
                'redirect_to': check_loc,
                'still_redirects_to_login': redirects_to_login,
                'html_preview': check.text[:300] if check.text else '',
            })
            if not redirects_to_login and check.status_code in (200, 301, 302):
                # 200 без редиректа = вошли
                if check.status_code == 200 or (check.status_code in (301, 302) and check_loc and '/login' not in check_loc.lower()):
                    out['ok'] = True
                    out['verdict'] = '✓ Успешный вход в komissionka. Парсер кассы готов работать.'
        except Exception as e:
            out['steps'].append({'stage': 'GET / check', 'error': str(e)})

        out['final'] = {
            'cookies_after': list(requests.utils.dict_from_cookiejar(s.cookies).keys()),
            'login_response': body_json,
        }

    except Exception as e:
        out['steps'].append({'stage': 'POST /auth/login', 'error': str(e)})
        out['verdict'] = f'Ошибка при POST: {e}'

    # помощь по решению
    if not out['ok']:
        if not out['verdict']:
            out['verdict'] = 'Логин не удался. См. шаги.'
        out['hint'] = (
            'Если в браузере вход проходит, а тут нет — проверь, что в секретах '
            'SMARTLOMBARD_LOGIN = lekermang@gmail.com и SMARTLOMBARD_PASSWORD = Mark2015N (без пробелов). '
            'Если совпадает — возможно, у учётки включён 2FA/капча после неудачных попыток — '
            'войди в браузере и через 5-10 минут попробуй снова.'
        )

    return out


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

        # 429 = это НЕ ошибка, это нормальное состояние «лимит на перевыпуск»
        def _is_rate_limit(e: str | None) -> bool:
            if not e:
                return False
            el = e.lower()
            return ('429' in e) or ('1 раз' in e) or ('rate' in el) or ('лимит' in el)

        if force:
            tok, err = _request_new_token()
            if err or not tok:
                # При 429 не падаем 502, отдаём 200 с rate_limited=true и старым токеном из БД
                if _is_rate_limit(err):
                    ttl_left = max(0, TOKEN_TTL_SECONDS - (token_age_sec or 0))
                    return _ok({
                        'ok': True, 'forced': False,
                        'rate_limited': True,
                        'rate_limit_message': err,
                        'token_age_sec': token_age_sec or 0,
                        'token_expires_in_sec': ttl_left,
                    })
                return _err(502, err or 'auth failed')
            _token_cache_set(tok)
            return _ok({
                'ok': True, 'forced': True,
                'token_age_sec': 0,
                'token_expires_in_sec': TOKEN_TTL_SECONDS,
            })

        tok, err = _get_access_token(force=False)
        if err or not tok:
            if _is_rate_limit(err):
                ttl_left = max(0, TOKEN_TTL_SECONDS - (token_age_sec or 0))
                return _ok({
                    'ok': True, 'forced': False,
                    'rate_limited': True,
                    'rate_limit_message': err,
                    'token_age_sec': token_age_sec or 0,
                    'token_expires_in_sec': ttl_left,
                })
            return _err(502, err or 'auth failed')
        ttl_left = max(0, TOKEN_TTL_SECONDS - (token_age_sec or 0))
        return _ok({
            'ok': True, 'forced': False,
            'token_age_sec': token_age_sec or 0,
            'token_expires_in_sec': ttl_left,
        })

    # ---------- ACCOUNT_CHECK: проверка содержимого аккаунта SmartLombard ----------
    # Опрашивает справочники (branches, employees, pawn_tickets, clients) для каждого
    # API-ключа из SMARTLOMBARD_API_KEYS — чтобы понять, есть ли в аккаунте хоть что-то.
    if action == 'account_check':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')

        # SmartLombard: для комиссионки доступны методы с goods.api.smartlombard.ru
        # (товары, договоры). Имущества/билеты/клиенты — только для ломбарда.
        # Формат: (path, response_key, label, base_override)
        # base_override=None → API_BASE (online.smartlombard.ru)
        # base_override='goods' → GOODS_API_BASE (goods.api.smartlombard.ru)
        check_paths = [
            # Универсальные справочники (есть у всех профилей)
            ('/categories', 'categories', 'Категории', None),
            ('/operations', 'operations', 'Операции (без фильтра)', None),
            # КОМИССИОНКА — goods.api.smartlombard.ru (по доке /methods_preview_goods)
            ('/goods', 'goods', 'Товары (комиссионка)', 'goods'),
            ('/contracts', 'contracts', 'Договоры клиентов (комиссионка)', 'goods'),
            # Ломбардные методы — для комиссионки обычно 404, оставляем как индикатор профиля
            ('/branches', 'branches', 'Филиалы (ломбард)', None),
            ('/employees', 'employees', 'Сотрудники (ломбард)', None),
            ('/pawn_tickets', 'pawn_tickets', 'Билеты залог (ломбард)', None),
            ('/clients', 'clients', 'Клиенты (ломбард)', None),
        ]
        keys = _get_api_keys_list()

        # Диагностика секретов — что реально видит функция
        raw_api_keys = (os.environ.get('SMARTLOMBARD_API_KEYS') or '')
        env_diag = {
            'SMARTLOMBARD_API_KEYS_present': bool(raw_api_keys),
            'SMARTLOMBARD_API_KEYS_length': len(raw_api_keys),
            'SMARTLOMBARD_API_KEYS_first_chars': raw_api_keys[:30] if raw_api_keys else '',
            'SMARTLOMBARD_ACCOUNT_ID_present': bool(os.environ.get('SMARTLOMBARD_ACCOUNT_ID')),
            'SMARTLOMBARD_SECRET_KEY_present': bool(os.environ.get('SMARTLOMBARD_SECRET_KEY')),
            'parsed_keys_count': len(keys),
            'parsed_account_ids': [k.get('account_id') for k in keys],
            'build_marker': _BUILD_MARKER,
        }

        results: list = []
        for k in keys:
            aid = k['account_id']
            sk = k['secret_key']
            tok, terr = _get_token_for_key(aid, sk)
            account_block: dict = {'account_id': aid, 'paths': []}
            if terr or not tok:
                account_block['auth_error'] = terr or 'no token'
                results.append(account_block)
                continue
            for path, key, label, base_override in check_paths:
                base_for_path = GOODS_API_BASE if base_override == 'goods' else API_BASE
                url_path = f'{base_for_path}{path}'
                try:
                    r = requests.get(
                        url_path,
                        params={'limit': 5, 'offset': 0},
                        headers={'Authorization': f'Bearer {tok}'},
                        timeout=15,
                    )
                    try:
                        data = r.json()
                    except Exception:
                        data = {'_raw': r.text[:200]}
                    # Гибкое извлечение items: result.{key} | result (если list) | data.{key} | data (если list)
                    items = []
                    msg = None
                    if isinstance(data, dict):
                        result = data.get('result')
                        if isinstance(result, list):
                            items = result
                        elif isinstance(result, dict):
                            cand = result.get(key)
                            if isinstance(cand, list):
                                items = cand
                            else:
                                # ищем первый list в result
                                for v in result.values():
                                    if isinstance(v, list):
                                        items = v
                                        break
                        elif isinstance(data.get(key), list):
                            items = data[key]
                        # Сообщение об ошибке
                        err_obj = data.get('error')
                        if isinstance(err_obj, dict):
                            msg = err_obj.get('message')
                        elif isinstance(err_obj, str):
                            msg = err_obj
                        if not msg and data.get('message'):
                            msg = data.get('message')
                    elif isinstance(data, list):
                        items = data
                    account_block['paths'].append({
                        'path': path, 'label': label,
                        'http_status': r.status_code,
                        'count': len(items) if isinstance(items, list) else 0,
                        'sample': items[:2] if isinstance(items, list) else [],
                        'message': msg,
                        'raw_preview': (str(data)[:200]) if (not items and r.status_code != 200) else None,
                    })
                except Exception as e:
                    account_block['paths'].append({
                        'path': path, 'label': label, 'error': str(e),
                    })
            results.append(account_block)
        return _ok({'ok': True, 'accounts': results, 'env_diag': env_diag})

    # ---------- KASSA_DIAG: тест логина в кассу с подробной диагностикой ----------
    if action == 'kassa_diag':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')
        result = _kassa_diag_login()
        return _ok(result)

    # ---------- TEST_API_KEY: ручной тест произвольного account_id+secret_key ----------
    if action == 'test_api_key':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')
        test_account = str(body.get('account_id') or params.get('account_id') or '').strip()
        test_key = str(body.get('secret_key') or params.get('secret_key') or '').strip()
        if not test_account or not test_key:
            return _err(400, 'account_id и secret_key обязательны')
        # Прямой POST на оба эндпоинта SmartLombard
        results = []
        for label, url in [('online.smartlombard.ru', AUTH_URL), ('auth.api.smartlombard.ru', AUTH_URL_LEGACY)]:
            attempt = {'endpoint': label, 'url': url}
            try:
                rr = requests.post(
                    url,
                    files={
                        'account_id': (None, test_account),
                        'secret_key': (None, test_key),
                    },
                    timeout=20,
                )
                attempt['http_status'] = rr.status_code
                attempt['content_type'] = rr.headers.get('Content-Type')
                try:
                    attempt['response'] = rr.json()
                except Exception:
                    attempt['response_raw'] = rr.text[:400]
                # извлечём токен если есть
                try:
                    j = rr.json() if 'json' in (rr.headers.get('Content-Type') or '').lower() else None
                    if j and j.get('status'):
                        tok = (j.get('result') or {}).get('access_token')
                        if isinstance(tok, dict):
                            tok = tok.get('access_token') or tok.get('token') or tok.get('value')
                        if tok:
                            attempt['token_preview'] = str(tok)[:20] + '...'
                            attempt['ok'] = True
                except Exception:
                    pass
            except Exception as e:
                attempt['error'] = str(e)
            results.append(attempt)
        any_ok = any(a.get('ok') for a in results)
        return _ok({
            'ok': any_ok,
            'account_id': test_account,
            'secret_key_len': len(test_key),
            'secret_key_preview': test_key[:6] + '...' + test_key[-4:],
            'endpoints': results,
            'verdict': '✓ Ключ рабочий!' if any_ok else 'Ключ не подошёл ни на одном из эндпоинтов. См. response.',
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

    # ---------- GOODS_DB: содержимое sl_goods (для сверки с API operations) ----------
    if action == 'goods_db':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')
        try:
            conn = _get_conn(); cur = conn.cursor()
            cur.execute(
                f"SELECT article, item_type, name, price, organization, "
                f"sold, withdrawn, hidden, removed, "
                f"COALESCE(updated_at, created_at) AS upd "
                f"FROM {SCHEMA}.sl_goods "
                f"ORDER BY article DESC LIMIT 5000"
            )
            rows = cur.fetchall()
            cur.close(); conn.close()
            goods = []
            for r in rows:
                goods.append({
                    'article': int(r[0]) if r[0] is not None else None,
                    'item_type': int(r[1]) if r[1] is not None else 1,
                    'name': r[2],
                    'price': float(r[3]) if r[3] is not None else 0.0,
                    'organization': int(r[4]) if r[4] is not None else None,
                    'sold': int(r[5]) if r[5] is not None else 0,
                    'withdrawn': int(r[6]) if r[6] is not None else 0,
                    'hidden': int(r[7]) if r[7] is not None else 0,
                    'removed': bool(r[8]) if r[8] is not None else False,
                    'updated_at': r[9].isoformat() if r[9] else None,
                })
            return _ok({'goods': goods, 'total': len(goods)})
        except Exception as e:
            return _err(500, f'goods_db error: {e}')

    # ---------- RECONCILE: сверка API operations vs sl_goods ----------
    if action == 'reconcile':
        ok, _r = _check_token(event, allow_all_staff=False)
        if not ok:
            return _err(401, 'Unauthorized')

        date_from_r = _parse_date_param(params.get('date_from') or body.get('date_from') or '')
        date_to_r = _parse_date_param(params.get('date_to') or body.get('date_to') or '') \
            if (params.get('date_to') or body.get('date_to')) else date_from_r

        # 1) API operations за период (мульти-аккаунт)
        keys = _get_api_keys_list()
        if not keys:
            return _err(502, 'SMARTLOMBARD_API_KEYS не задан')
        q = {'date_begin': date_from_r, 'date_end': date_to_r}
        operations, _ops_per, _ops_audit = _fetch_all_pages_multi_account(OPS_URL, q)

        # 2) Наши товары (sl_goods)
        try:
            conn = _get_conn(); cur = conn.cursor()
            cur.execute(
                f"SELECT article, item_type, name, price, sold, withdrawn, removed "
                f"FROM {SCHEMA}.sl_goods"
            )
            db_rows = cur.fetchall()
            cur.close(); conn.close()
        except Exception as e:
            return _err(500, f'db read error: {e}')

        db_by_article: dict[int, dict] = {}
        for r in db_rows:
            try:
                art = int(r[0])
            except Exception:
                continue
            db_by_article[art] = {
                'article': art,
                'item_type': int(r[1]) if r[1] is not None else 1,
                'name': r[2] or '',
                'price': float(r[3]) if r[3] is not None else 0.0,
                'sold': int(r[4]) if r[4] is not None else 0,
                'withdrawn': int(r[5]) if r[5] is not None else 0,
                'removed': bool(r[6]) if r[6] is not None else False,
            }

        # 3) Группируем операции по pawn_ticket_id (=article)
        api_by_article: dict[int, dict] = {}
        for op in operations:
            pid = op.get('pawn_ticket_id')
            if pid is None:
                continue
            try:
                pid_i = int(pid)
            except Exception:
                continue
            t = (op.get('type_operation') or '').split(',')[0].strip()
            row = api_by_article.setdefault(pid_i, {
                'article': pid_i,
                'types': [],
                'last_type': '',
                'last_sum': 0.0,
                'last_date': '',
                'employee': '',
                'client': '',
            })
            row['types'].append(t)
            # Берём последнюю операцию (первая в API — обычно самая свежая)
            if not row['last_type']:
                row['last_type'] = t
                try:
                    row['last_sum'] = float(op.get('sum') or 0)
                except Exception:
                    row['last_sum'] = 0.0
                row['last_date'] = op.get('created_at') or ''
                row['employee'] = op.get('employee_name') or ''
                row['client'] = op.get('client_name') or ''

        # 4) Расхождения
        only_in_api: list = []   # есть в API operations, нет в нашей БД
        only_in_db: list = []    # есть в БД, нет в API operations
        in_both: list = []       # есть и там и там
        # «релевантные» типы — те, что должны порождать товар на витрине
        TRANSFER_TYPES = {'send_to_realization', 'sell_realization', 'seizure'}

        for art, api_row in api_by_article.items():
            db_row = db_by_article.get(art)
            relevant = any(t in TRANSFER_TYPES for t in api_row['types'])
            if db_row is None:
                only_in_api.append({**api_row, 'relevant_for_goods': relevant})
            else:
                in_both.append({
                    'article': art,
                    'api_types': api_row['types'],
                    'api_last_type': api_row['last_type'],
                    'api_last_sum': api_row['last_sum'],
                    'api_last_date': api_row['last_date'],
                    'api_employee': api_row['employee'],
                    'api_client': api_row['client'],
                    'db_name': db_row['name'],
                    'db_price': db_row['price'],
                    'db_sold': db_row['sold'],
                    'db_withdrawn': db_row['withdrawn'],
                    'db_removed': db_row['removed'],
                })

        # БД-товары, которых нет в API за период
        for art, db_row in db_by_article.items():
            if art not in api_by_article:
                only_in_db.append(db_row)

        return _ok({
            'date_from': date_from_r,
            'date_to': date_to_r,
            'api_operations_total': len(operations),
            'api_articles_total': len(api_by_article),
            'db_goods_total': len(db_by_article),
            'only_in_api': only_in_api,
            'only_in_db': only_in_db,
            'in_both': in_both,
            'counts': {
                'only_in_api': len(only_in_api),
                'only_in_db': len(only_in_db),
                'in_both': len(in_both),
            },
        })

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

    # МУЛЬТИ-АККАУНТНЫЙ режим: перебираем всех API-сотрудников из SMARTLOMBARD_API_KEYS,
    # объединяем операции (с дедупликацией по id). Так если у разных сотрудников
    # доступ к разным филиалам — мы видим общую картину.
    keys = _get_api_keys_list()
    if not keys:
        body = {'error': 'SMARTLOMBARD_API_KEYS не задан', 'stage': 'config'}
        return {'statusCode': 502, 'headers': HEADERS,
                'body': json.dumps(body, ensure_ascii=False)}

    q = {'date_begin': date_from, 'date_end': date_to}
    operations, ops_per_account, ops_audit = _fetch_all_pages_multi_account(OPS_URL, q)
    elem_operations, elem_per_account, elem_audit = _fetch_all_pages_multi_account(ELEM_OPS_URL, q)

    audit: list = []
    if debug:
        audit.extend(ops_audit)
        audit.extend(elem_audit)

    agg = _aggregate(operations, elem_operations)

    if debug:
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'date_from': date_from, 'date_to': date_to,
                    'aggregated': agg,
                    'operations_total': len(operations),
                    'elem_operations_total': len(elem_operations),
                    'accounts_used': [k['account_id'] for k in keys],
                    'operations_per_account': ops_per_account,
                    'elem_per_account': elem_per_account,
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
        'accounts_used': len(keys),
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