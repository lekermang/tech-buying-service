import json
import os
from datetime import datetime, date
from decimal import Decimal

import psycopg2
import psycopg2.extras

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p31606708_tech_buying_service'
VALID_STATUSES = ('new', 'in_progress', 'done', 'failed')


def _json_default(o):
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)
    return str(o)


def _ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=_json_default)}


def _err(status, msg):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, full_name, login, role FROM {SCHEMA}.employees "
        f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]}


def action_list(params):
    status = (params.get('status') or '').strip()
    where = ''
    args = []
    if status in VALID_STATUSES:
        where = 'WHERE status = %s'
        args.append(status)
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, device_model, imei, client_name, client_phone, account_email, note, "
        f"status, price, created_by, created_at, status_updated_at, done_at "
        f"FROM {SCHEMA}.frp_requests {where} ORDER BY created_at DESC LIMIT 500",
        args,
    )
    rows = [dict(r) for r in cur.fetchall()]
    # Счётчики по статусам
    cur.execute(
        f"SELECT status, COUNT(*) AS cnt FROM {SCHEMA}.frp_requests GROUP BY status"
    )
    counts = {r['status']: int(r['cnt']) for r in cur.fetchall()}
    cur.close()
    conn.close()
    return _ok({'items': rows, 'counts': counts})


def action_create(body, actor):
    device_model = (body.get('device_model') or '').strip()
    if not device_model:
        return _err(400, 'Укажите модель устройства')
    imei = (body.get('imei') or '').strip() or None
    client_name = (body.get('client_name') or '').strip() or None
    client_phone = (body.get('client_phone') or '').strip() or None
    account_email = (body.get('account_email') or '').strip() or None
    note = (body.get('note') or '').strip() or None
    try:
        price = int(body.get('price')) if body.get('price') not in (None, '') else None
    except Exception:
        price = None
    created_by = (actor or {}).get('login') if actor else None

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.frp_requests "
        f"(device_model, imei, client_name, client_phone, account_email, note, price, created_by) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (device_model, imei, client_name, client_phone, account_email, note, price, created_by),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return _ok({'ok': True, 'id': new_id})


def action_update_status(body, actor):
    try:
        rid = int(body.get('id'))
    except Exception:
        return _err(400, 'id обязателен')
    new_status = (body.get('status') or '').strip()
    if new_status not in VALID_STATUSES:
        return _err(400, 'Неверный статус')
    conn = get_conn()
    cur = conn.cursor()
    done_sql = ", done_at = NOW()" if new_status == 'done' else ""
    cur.execute(
        f"UPDATE {SCHEMA}.frp_requests "
        f"SET status = %s, status_updated_at = NOW(){done_sql} "
        f"WHERE id = %s RETURNING id",
        (new_status, rid),
    )
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return _err(404, 'Заявка не найдена')
    return _ok({'ok': True, 'id': rid, 'status': new_status})


def action_delete(body, actor):
    try:
        rid = int(body.get('id'))
    except Exception:
        return _err(400, 'id обязателен')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"DELETE FROM {SCHEMA}.frp_requests WHERE id = %s RETURNING id", (rid,))
    row = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    if not row:
        return _err(404, 'Заявка не найдена')
    return _ok({'ok': True, 'id': rid})


def handler(event: dict, context) -> dict:
    """FRP-разблокировка: заявки сотрудников (список, создание, смена статуса, удаление)."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    actor = get_employee(token)
    if not actor:
        return _err(401, 'Не авторизован')

    params = event.get('queryStringParameters') or {}

    if method == 'GET':
        action = (params.get('action') or 'list').strip()
        if action == 'list':
            return action_list(params)
        return _err(400, 'Неизвестное действие')

    if method == 'POST':
        raw = event.get('body') or '{}'
        try:
            body = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except Exception:
            body = {}
        action = (body.get('action') or '').strip()
        if action == 'create':
            return action_create(body, actor)
        if action == 'update_status':
            return action_update_status(body, actor)
        if action == 'delete':
            return action_delete(body, actor)
        return _err(400, 'Неизвестное действие')

    return _err(405, 'Метод не поддерживается')
