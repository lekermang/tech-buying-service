import json
import os
import base64
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal

import psycopg2
import psycopg2.extras
import boto3

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, Authorization',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p31606708_tech_buying_service'

ALLOWED_ROLES = {'owner', 'admin', 'staff', 'manager', 'master'}


def _ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=_json_default)}


def _err(status, msg):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def _json_default(o):
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)
    return str(o)


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT id, full_name, login, role FROM {SCHEMA}.employees "
        f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,)
    )
    row = cur.fetchone(); cur.close(); conn.close()
    if not row:
        return None
    return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]}


def _esc(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, (int, float, Decimal)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"


def _next_contract_number(cur) -> str:
    year = datetime.now().year
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.contracts_14d WHERE contract_number LIKE %s",
        (f'CON-{year}-%',)
    )
    n = (cur.fetchone()[0] or 0) + 1
    return f'CON-{year}-{n:05d}'


def _calc(amount: Decimal, rate: Decimal, days: int):
    amount = Decimal(str(amount))
    rate = Decimal(str(rate))
    interest = (amount * rate * Decimal(days) / Decimal(100)).quantize(Decimal('0.01'))
    total = (amount + interest).quantize(Decimal('0.01'))
    daily = (total / Decimal(days)).quantize(Decimal('0.01')) if days > 0 else Decimal('0')
    return {
        'principal': float(amount),
        'interest': float(interest),
        'total_due': float(total),
        'daily_payment': float(daily),
    }


def _log(cur, contract_id, action, details, actor):
    cur.execute(
        f"INSERT INTO {SCHEMA}.contracts_14d_log (contract_id, action, details, actor_name, actor_role) "
        f"VALUES (%s, %s, %s::jsonb, %s, %s)",
        (contract_id, action, json.dumps(details, ensure_ascii=False, default=_json_default),
         actor.get('full_name') if actor else None,
         actor.get('role') if actor else None)
    )


# ============ Calculate ============
def action_calculate(params):
    try:
        amount = Decimal(str(params.get('amount') or '0'))
        days = int(params.get('days') or 14)
        rate = Decimal(str(params.get('rate') or '4'))
    except Exception:
        return _err(400, 'Некорректные параметры')
    if amount <= 0:
        return _err(400, 'Сумма должна быть больше 0')
    return _ok(_calc(amount, rate, days))


# ============ Photo upload (base64 -> S3) ============
def action_upload_photo(body, actor):
    """Загрузка фото в S3. Принимает base64. Возвращает file_url + s3_key."""
    photo_type = (body.get('photo_type') or '').strip()
    file_b64 = body.get('file_base64') or ''
    filename = (body.get('filename') or 'photo.jpg').strip()
    if photo_type not in ('passport', 'device'):
        return _err(400, 'photo_type must be passport|device')
    if not file_b64:
        return _err(400, 'file_base64 required')
    try:
        if ',' in file_b64:
            file_b64 = file_b64.split(',', 1)[1]
        data = base64.b64decode(file_b64)
    except Exception:
        return _err(400, 'Bad base64')
    if len(data) > 5 * 1024 * 1024:
        return _err(400, 'Файл больше 5 МБ')

    ext = (filename.rsplit('.', 1)[-1] if '.' in filename else 'jpg').lower()
    if ext not in ('jpg', 'jpeg', 'png', 'webp'):
        return _err(400, 'Допустимы JPG/PNG/WEBP')
    content_type = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}[ext]

    key = f'contracts_14d/{photo_type}/{uuid.uuid4().hex}.{ext}'
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return _ok({'file_url': cdn_url, 's3_key': key})


# ============ Create contract ============
def action_create(body, actor):
    client = body.get('client') or {}
    item = body.get('item') or {}
    photos = body.get('photos') or []  # [{photo_type, file_url, s3_key}]
    try:
        amount = Decimal(str(body.get('amount') or '0'))
    except Exception:
        return _err(400, 'amount: некорректная сумма')
    interest_rate = Decimal(str(body.get('interest_rate') or '4'))
    term_days = int(body.get('term_days') or 14)
    status = (body.get('status') or 'active').strip()  # active | draft

    if not (client.get('full_name') or '').strip():
        return _err(400, 'ФИО клиента обязательно')
    if amount <= 0:
        return _err(400, 'Сумма выдачи должна быть больше 0')
    if status not in ('active', 'draft'):
        status = 'active'

    calc = _calc(amount, interest_rate, term_days)
    total_due = Decimal(str(calc['total_due']))

    conn = get_conn(); cur = conn.cursor()
    try:
        # Клиент
        cur.execute(
            f"INSERT INTO {SCHEMA}.contracts_14d_clients "
            f"(full_name, birth_date, passport_series, passport_number, passport_issued_by, passport_issue_date, phone, email) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                client.get('full_name', '').strip(),
                client.get('birth_date') or None,
                client.get('passport_series'),
                client.get('passport_number'),
                client.get('passport_issued_by'),
                client.get('passport_issue_date') or None,
                client.get('phone'),
                client.get('email'),
            )
        )
        client_id = cur.fetchone()[0]

        # Имущество
        cur.execute(
            f"INSERT INTO {SCHEMA}.contracts_14d_items "
            f"(item_type, brand, model, serial_number, condition, accessories, notes) "
            f"VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s) RETURNING id",
            (
                item.get('item_type'),
                item.get('brand'),
                item.get('model'),
                item.get('serial_number'),
                item.get('condition'),
                json.dumps(item.get('accessories') or [], ensure_ascii=False),
                item.get('notes'),
            )
        )
        item_id = cur.fetchone()[0]

        # Договор
        contract_number = _next_contract_number(cur)
        start_date = date.today()
        end_date = start_date + timedelta(days=term_days)
        cur.execute(
            f"INSERT INTO {SCHEMA}.contracts_14d "
            f"(contract_number, client_id, item_id, amount, interest_rate, term_days, total_due, "
            f"remaining_debt, start_date, end_date, status, created_by) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                contract_number, client_id, item_id, amount, interest_rate, term_days,
                total_due, total_due, start_date, end_date, status,
                (actor or {}).get('full_name'),
            )
        )
        contract_id = cur.fetchone()[0]

        # Фото
        for p in photos:
            if not isinstance(p, dict):
                continue
            ptype = p.get('photo_type')
            url = p.get('file_url')
            if ptype not in ('passport', 'device') or not url:
                continue
            cur.execute(
                f"INSERT INTO {SCHEMA}.contracts_14d_photos "
                f"(contract_id, photo_type, file_url, s3_key) VALUES (%s, %s, %s, %s)",
                (contract_id, ptype, url, p.get('s3_key'))
            )

        _log(cur, contract_id, 'create', {
            'contract_number': contract_number,
            'amount': float(amount),
            'status': status,
        }, actor)
        conn.commit()
        return _ok({
            'id': contract_id,
            'contract_number': contract_number,
            'total_due': float(total_due),
            'remaining_debt': float(total_due),
            'end_date': end_date.isoformat(),
            'status': status,
        }, status=201)
    except Exception as e:
        conn.rollback()
        return _err(500, f'DB error: {e}')
    finally:
        cur.close(); conn.close()


# ============ List contracts ============
def action_list(params):
    """status: active | archive | all (по умолчанию active)"""
    status_filter = (params.get('status') or 'active').strip()
    q = (params.get('q') or '').strip()
    date_from = (params.get('date_from') or '').strip()
    date_to = (params.get('date_to') or '').strip()
    limit = min(int(params.get('limit') or 100), 500)

    where = []
    if status_filter == 'active':
        where.append("c.status='active'")
    elif status_filter == 'archive':
        where.append("c.status IN ('closed','terminated')")
    elif status_filter == 'draft':
        where.append("c.status='draft'")
    # 'all' — без фильтра

    if q:
        qe = q.replace("'", "''")
        where.append(
            f"(c.contract_number ILIKE '%{qe}%' OR cl.full_name ILIKE '%{qe}%' OR cl.phone ILIKE '%{qe}%')"
        )
    if date_from:
        where.append(f"c.start_date >= {_esc(date_from)}")
    if date_to:
        where.append(f"c.start_date <= {_esc(date_to)}")

    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT c.id, c.contract_number, c.amount, c.total_due, c.paid_total, c.remaining_debt, "
        f"c.start_date, c.end_date, c.status, c.created_at, c.created_by, "
        f"cl.full_name AS client_name, cl.phone AS client_phone, "
        f"i.brand AS item_brand, i.model AS item_model, i.item_type "
        f"FROM {SCHEMA}.contracts_14d c "
        f"JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id=c.client_id "
        f"JOIN {SCHEMA}.contracts_14d_items i ON i.id=c.item_id "
        f"{where_sql} ORDER BY c.created_at DESC LIMIT {limit}"
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    today = date.today()
    for r in rows:
        ed = r.get('end_date')
        if r['status'] == 'active' and ed and ed < today:
            r['overdue'] = True
            r['overdue_days'] = (today - ed).days
        else:
            r['overdue'] = False
            r['overdue_days'] = 0
    return _ok({'items': rows, 'count': len(rows)})


# ============ Get contract details ============
def action_get(params):
    cid = params.get('id')
    if not cid:
        return _err(400, 'id required')
    try:
        cid = int(cid)
    except Exception:
        return _err(400, 'id must be integer')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT c.*, "
        f"cl.full_name AS client_name, cl.birth_date AS client_birth_date, "
        f"cl.passport_series, cl.passport_number, cl.passport_issued_by, cl.passport_issue_date, "
        f"cl.phone AS client_phone, cl.email AS client_email, "
        f"i.item_type, i.brand AS item_brand, i.model AS item_model, "
        f"i.serial_number, i.condition, i.accessories, i.notes AS item_notes "
        f"FROM {SCHEMA}.contracts_14d c "
        f"JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id=c.client_id "
        f"JOIN {SCHEMA}.contracts_14d_items i ON i.id=c.item_id "
        f"WHERE c.id=%s",
        (cid,)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return _err(404, 'Договор не найден')
    contract = dict(row)

    cur.execute(
        f"SELECT id, photo_type, file_url, s3_key, uploaded_at "
        f"FROM {SCHEMA}.contracts_14d_photos WHERE contract_id=%s ORDER BY uploaded_at",
        (cid,)
    )
    contract['photos'] = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT id, amount, payment_type, comment, paid_at, recorded_by "
        f"FROM {SCHEMA}.contracts_14d_payments WHERE contract_id=%s ORDER BY paid_at DESC",
        (cid,)
    )
    contract['payments'] = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT id, action, details, actor_name, actor_role, created_at "
        f"FROM {SCHEMA}.contracts_14d_log WHERE contract_id=%s ORDER BY created_at DESC LIMIT 100",
        (cid,)
    )
    contract['log'] = [dict(r) for r in cur.fetchall()]

    today = date.today()
    ed = contract.get('end_date')
    contract['overdue'] = bool(contract['status'] == 'active' and ed and ed < today)
    contract['overdue_days'] = (today - ed).days if (ed and ed < today) else 0
    cur.close(); conn.close()
    return _ok(contract)


# ============ Add payment ============
def action_payment(body, actor):
    cid = body.get('contract_id')
    if not cid:
        return _err(400, 'contract_id required')
    try:
        cid = int(cid)
        amount = Decimal(str(body.get('amount') or '0'))
    except Exception:
        return _err(400, 'Некорректные данные')
    if amount <= 0:
        return _err(400, 'Сумма платежа должна быть больше 0')
    payment_type = (body.get('payment_type') or 'partial').strip()
    if payment_type not in ('partial', 'full'):
        payment_type = 'partial'
    comment = body.get('comment') or None

    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT total_due, paid_total, status FROM {SCHEMA}.contracts_14d WHERE id=%s FOR UPDATE",
            (cid,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Договор не найден')
        total_due, paid_total, status = Decimal(str(row[0])), Decimal(str(row[1])), row[2]
        if status != 'active':
            return _err(400, 'Платёж можно вносить только по активному договору')

        new_paid = paid_total + amount
        if new_paid > total_due + Decimal('0.01'):
            new_paid = total_due
            amount = total_due - paid_total
            if amount <= 0:
                return _err(400, 'Договор уже полностью погашен')
        new_remaining = total_due - new_paid
        if new_remaining < Decimal('0.01'):
            new_remaining = Decimal('0')

        cur.execute(
            f"INSERT INTO {SCHEMA}.contracts_14d_payments "
            f"(contract_id, amount, payment_type, comment, recorded_by) VALUES (%s, %s, %s, %s, %s)",
            (cid, amount, payment_type, comment, (actor or {}).get('full_name'))
        )

        new_status = 'closed' if new_remaining <= 0 else 'active'
        closed_at_sql = "NOW()" if new_status == 'closed' else "NULL"
        cur.execute(
            f"UPDATE {SCHEMA}.contracts_14d SET paid_total=%s, remaining_debt=%s, status=%s, "
            f"closed_at=CASE WHEN %s='closed' THEN NOW() ELSE closed_at END, updated_at=NOW() WHERE id=%s",
            (new_paid, new_remaining, new_status, new_status, cid)
        )

        _log(cur, cid, 'payment', {
            'amount': float(amount),
            'payment_type': payment_type,
            'remaining_debt': float(new_remaining),
            'auto_closed': new_status == 'closed',
        }, actor)
        conn.commit()
        return _ok({
            'remaining_debt': float(new_remaining),
            'paid_total': float(new_paid),
            'status': new_status,
        })
    except Exception as e:
        conn.rollback()
        return _err(500, f'DB error: {e}')
    finally:
        cur.close(); conn.close()


# ============ Terminate / close ============
def action_terminate(body, actor):
    cid = body.get('contract_id')
    reason = (body.get('reason') or '').strip() or None
    if not cid:
        return _err(400, 'contract_id required')
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.contracts_14d SET status='terminated', closed_at=NOW(), "
            f"updated_at=NOW(), terminate_reason=%s WHERE id=%s AND status='active' RETURNING id",
            (reason, int(cid))
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Активный договор не найден')
        _log(cur, int(cid), 'terminate', {'reason': reason}, actor)
        conn.commit()
        return _ok({'ok': True, 'status': 'terminated'})
    except Exception as e:
        conn.rollback()
        return _err(500, f'DB error: {e}')
    finally:
        cur.close(); conn.close()


def action_close(body, actor):
    cid = body.get('contract_id')
    if not cid:
        return _err(400, 'contract_id required')
    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT remaining_debt FROM {SCHEMA}.contracts_14d WHERE id=%s AND status='active'",
            (int(cid),)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Активный договор не найден')
        if Decimal(str(row[0])) > Decimal('0.01'):
            return _err(400, 'Нельзя закрыть договор с остатком долга')
        cur.execute(
            f"UPDATE {SCHEMA}.contracts_14d SET status='closed', closed_at=NOW(), updated_at=NOW() WHERE id=%s",
            (int(cid),)
        )
        _log(cur, int(cid), 'close', {}, actor)
        conn.commit()
        return _ok({'ok': True, 'status': 'closed'})
    except Exception as e:
        conn.rollback()
        return _err(500, f'DB error: {e}')
    finally:
        cur.close(); conn.close()


# ============ Stats ============
def action_stats():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT "
        f"COUNT(*) FILTER (WHERE status='active') AS active_count, "
        f"COUNT(*) FILTER (WHERE status='active' AND end_date < CURRENT_DATE) AS overdue_count, "
        f"COUNT(*) FILTER (WHERE status IN ('closed','terminated')) AS archive_count, "
        f"COUNT(*) FILTER (WHERE status='draft') AS draft_count, "
        f"COALESCE(SUM(remaining_debt) FILTER (WHERE status='active'), 0) AS total_active_debt, "
        f"COALESCE(SUM(amount) FILTER (WHERE status='active'), 0) AS total_active_amount "
        f"FROM {SCHEMA}.contracts_14d"
    )
    row = dict(cur.fetchone() or {})
    cur.close(); conn.close()
    return _ok(row)


# ============ Handler ============
def handler(event: dict, context) -> dict:
    """Договоры продажи на 14 дней (СмартЛомбард). Действия: list, get, create, calculate, payment, terminate, close, stats, upload_photo."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''
    actor = get_employee(token)
    if not actor:
        return _err(401, 'Не авторизован')
    if actor.get('role') not in ALLOWED_ROLES:
        return _err(403, 'Нет доступа к разделу')

    qs = event.get('queryStringParameters') or {}
    action = (qs.get('action') or '').strip()

    body = {}
    raw = event.get('body') or ''
    if raw:
        try:
            body = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except Exception:
            body = {}

    if method == 'GET':
        if action == 'list':
            return action_list(qs)
        if action == 'get':
            return action_get(qs)
        if action == 'calculate':
            return action_calculate(qs)
        if action == 'stats':
            return action_stats()
        return _err(400, f'Unknown GET action: {action}')

    if method == 'POST':
        if action == 'create':
            return action_create(body, actor)
        if action == 'payment':
            return action_payment(body, actor)
        if action == 'terminate':
            return action_terminate(body, actor)
        if action == 'close':
            return action_close(body, actor)
        if action == 'upload_photo':
            return action_upload_photo(body, actor)
        return _err(400, f'Unknown POST action: {action}')

    return _err(405, 'Method not allowed')
