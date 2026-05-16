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


def _calc_today(amount, rate, term_days, start_date, paid_total, on_date=None):
    """
    Сумма к возврату на текущую дату (для досрочного выкупа).
    Проценты — только за фактически прошедшие дни (минимум 1 день),
    но не больше term_days (после срока — полная сумма).
    """
    amount = Decimal(str(amount))
    rate = Decimal(str(rate))
    paid_total = Decimal(str(paid_total or 0))
    today = on_date or date.today()
    if isinstance(start_date, str):
        start_date = _parse_date(start_date) or today
    days_passed_raw = (today - start_date).days
    days_passed = max(1, min(int(term_days), days_passed_raw)) if days_passed_raw >= 1 else 1
    is_early = days_passed_raw < int(term_days)
    interest_today = (amount * rate * Decimal(days_passed) / Decimal(100)).quantize(Decimal('0.01'))
    full_due = (amount * (Decimal(1) + rate * Decimal(term_days) / Decimal(100))).quantize(Decimal('0.01'))
    today_due_full = (amount + interest_today).quantize(Decimal('0.01'))
    # После истечения срока — фиксируем полную сумму договора
    if not is_early:
        today_due_full = full_due
    today_remaining = today_due_full - paid_total
    if today_remaining < Decimal('0'):
        today_remaining = Decimal('0')
    saving = full_due - today_due_full
    if saving < Decimal('0'):
        saving = Decimal('0')
    return {
        'days_passed': int(days_passed),
        'days_passed_raw': int(days_passed_raw),
        'is_early': bool(is_early),
        'interest_today': float(interest_today),
        'today_due_full': float(today_due_full),
        'today_remaining': float(today_remaining),
        'full_due': float(full_due),
        'saving': float(saving),
    }


def _log(cur, contract_id, action, details, actor):
    cur.execute(
        f"INSERT INTO {SCHEMA}.contracts_14d_log (contract_id, action, details, actor_name, actor_role) "
        f"VALUES (%s, %s, %s::jsonb, %s, %s)",
        (contract_id, action, json.dumps(details, ensure_ascii=False, default=_json_default),
         actor.get('full_name') if actor else None,
         actor.get('role') if actor else None)
    )


def _parse_date(s, default=None):
    if not s:
        return default
    try:
        return datetime.strptime(str(s)[:10], '%Y-%m-%d').date()
    except Exception:
        return default


def _resolve_cash_account(cur, account_id):
    """Возвращает id активного счёта. Если account_id не задан — берёт is_default или первый активный."""
    if account_id:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.slshop_cash_accounts WHERE id=%s AND is_active=true",
            (int(account_id),)
        )
        row = cur.fetchone()
        return row[0] if row else None
    cur.execute(
        f"SELECT id FROM {SCHEMA}.slshop_cash_accounts WHERE is_active=true "
        f"ORDER BY is_default DESC, id ASC LIMIT 1"
    )
    row = cur.fetchone()
    return row[0] if row else None


def _cash_movement(cur, account_id, direction, amount, category, reason, actor, branch_id=None, created_at=None):
    """Создаёт движение в кассе и обновляет баланс. Возвращает id движения.
    created_at — опциональная дата операции (для проведения задним числом).
    """
    amt = Decimal(str(amount))
    if amt <= 0:
        return None
    cur.execute(
        f"SELECT balance FROM {SCHEMA}.slshop_cash_accounts WHERE id=%s FOR UPDATE",
        (account_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    balance = Decimal(str(row[0] or 0))
    new_balance = balance + amt if direction == 'in' else balance - amt
    cur.execute(
        f"UPDATE {SCHEMA}.slshop_cash_accounts SET balance=%s WHERE id=%s",
        (new_balance, account_id)
    )
    if created_at is not None:
        cur.execute(
            f"INSERT INTO {SCHEMA}.slshop_cash_movements "
            f"(account_id, direction, amount, balance_after, category, reason, employee_name, is_auto, branch_id, created_at) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s, %s) RETURNING id",
            (account_id, direction, amt, new_balance, category, reason,
             (actor or {}).get('full_name'), branch_id, created_at)
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.slshop_cash_movements "
            f"(account_id, direction, amount, balance_after, category, reason, employee_name, is_auto, branch_id) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, %s) RETURNING id",
            (account_id, direction, amt, new_balance, category, reason,
             (actor or {}).get('full_name'), branch_id)
        )
    return cur.fetchone()[0]


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
    cash_account_id = body.get('cash_account_id')
    skip_cash = bool(body.get('skip_cash'))  # для late-договоров (внесены задним числом)

    # Дата заключения договора (можно указать прошлую, нельзя будущую)
    today = date.today()
    requested_start = _parse_date(body.get('start_date'), today)
    if requested_start > today:
        return _err(400, 'Дата заключения не может быть в будущем')

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
        start_date = requested_start
        end_date = start_date + timedelta(days=term_days)
        is_late = start_date < today

        # Касса (для активных, не черновиков, и не late с пометкой skip_cash)
        resolved_cash_id = None
        payout_movement_id = None
        if status == 'active' and not skip_cash:
            resolved_cash_id = _resolve_cash_account(cur, cash_account_id)

        cur.execute(
            f"INSERT INTO {SCHEMA}.contracts_14d "
            f"(contract_number, client_id, item_id, amount, interest_rate, term_days, total_due, "
            f"remaining_debt, start_date, end_date, status, created_by, cash_account_id) "
            f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                contract_number, client_id, item_id, amount, interest_rate, term_days,
                total_due, total_due, start_date, end_date, status,
                (actor or {}).get('full_name'),
                resolved_cash_id,
            )
        )
        contract_id = cur.fetchone()[0]

        # Движение по кассе — выдача наличных клиенту (списание)
        if resolved_cash_id:
            payout_movement_id = _cash_movement(
                cur, resolved_cash_id, 'out', amount,
                'contracts_14d_payout',
                f'Выдача по договору {contract_number} ({client.get("full_name", "").strip()})',
                actor
            )
            if payout_movement_id:
                cur.execute(
                    f"UPDATE {SCHEMA}.contracts_14d SET payout_movement_id=%s WHERE id=%s",
                    (payout_movement_id, contract_id)
                )

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

        log_action = 'add_late_contract' if is_late and status == 'active' else 'create'
        _log(cur, contract_id, log_action, {
            'contract_number': contract_number,
            'amount': float(amount),
            'status': status,
            'start_date': start_date.isoformat(),
            'is_late': is_late,
            'cash_account_id': resolved_cash_id,
            'payout_movement_id': payout_movement_id,
        }, actor)
        conn.commit()
        return _ok({
            'id': contract_id,
            'contract_number': contract_number,
            'total_due': float(total_due),
            'remaining_debt': float(total_due),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'status': status,
            'cash_account_id': resolved_cash_id,
            'payout_movement_id': payout_movement_id,
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

    # Расчёт суммы на сегодня (досрочный выкуп)
    if contract['status'] == 'active':
        today_calc = _calc_today(
            contract.get('amount'),
            contract.get('interest_rate'),
            contract.get('term_days') or 14,
            contract.get('start_date'),
            contract.get('paid_total'),
        )
        contract['today_calc'] = today_calc
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
    cash_account_id = body.get('cash_account_id')
    skip_cash = bool(body.get('skip_cash'))
    # Дата операции (datetime-local: '2026-05-09T14:30'). Если не передано — NOW()
    paid_at_raw = (body.get('paid_at') or '').strip()
    paid_at_value = None
    if paid_at_raw:
        try:
            # datetime-local формат
            paid_at_value = datetime.strptime(paid_at_raw[:16], '%Y-%m-%dT%H:%M')
        except Exception:
            try:
                paid_at_value = datetime.strptime(paid_at_raw[:10], '%Y-%m-%d')
            except Exception:
                paid_at_value = None

    conn = get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT total_due, paid_total, status, amount, contract_number, "
            f"interest_rate, term_days, start_date "
            f"FROM {SCHEMA}.contracts_14d WHERE id=%s FOR UPDATE",
            (cid,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Договор не найден')
        total_due = Decimal(str(row[0]))
        paid_total = Decimal(str(row[1]))
        status = row[2]
        principal = Decimal(str(row[3]))
        contract_number = row[4]
        rate = Decimal(str(row[5]))
        term_days = int(row[6])
        sd = row[7]
        if status != 'active':
            return _err(400, 'Платёж можно вносить только по активному договору')

        # При досрочном выкупе считаем сумму к возврату на дату операции
        # (если сотрудник проводит платёж задним числом — проценты считаются на эту дату)
        op_date = paid_at_value.date() if paid_at_value is not None else date.today()
        today_calc = _calc_today(principal, rate, term_days, sd, paid_total, on_date=op_date)
        today_due_full = Decimal(str(today_calc['today_due_full']))
        is_early = bool(today_calc['is_early'])

        # При полном расчёте подменяем сумму на актуальную сегодня
        if payment_type == 'full':
            target_amount = today_due_full - paid_total
            if target_amount <= 0:
                return _err(400, 'Договор уже полностью погашен')
            # если клиент сам ввёл сумму — округляем к target
            amount = target_amount

        # Эффективный «потолок» долга — на сегодня (для досрочки) или total_due (после срока)
        effective_due = today_due_full if is_early else total_due
        new_paid = paid_total + amount
        if new_paid > effective_due + Decimal('0.01'):
            new_paid = effective_due
            amount = effective_due - paid_total
            if amount <= 0:
                return _err(400, 'Договор уже полностью погашен')
        new_remaining = effective_due - new_paid
        if new_remaining < Decimal('0.01'):
            new_remaining = Decimal('0')

        # Классификация типа дохода: principal / interest / mixed
        # Сначала гасится тело (amount), потом проценты
        prev_principal_paid = paid_total if paid_total < principal else principal
        principal_left = principal - prev_principal_paid
        if principal_left >= amount:
            income_type = 'principal'
        elif principal_left <= 0:
            income_type = 'interest'
        else:
            income_type = 'mixed'

        # Касса
        cash_id = None
        movement_id = None
        if not skip_cash:
            cash_id = _resolve_cash_account(cur, cash_account_id)
            if cash_id:
                movement_id = _cash_movement(
                    cur, cash_id, 'in', amount,
                    'contracts_14d_payment',
                    f'Платёж по договору {contract_number}' + (f' · {comment}' if comment else ''),
                    actor,
                    created_at=paid_at_value,
                )

        if paid_at_value is not None:
            cur.execute(
                f"INSERT INTO {SCHEMA}.contracts_14d_payments "
                f"(contract_id, amount, payment_type, comment, recorded_by, "
                f"cash_account_id, cash_movement_id, income_type, paid_at) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (cid, amount, payment_type, comment, (actor or {}).get('full_name'),
                 cash_id, movement_id, income_type, paid_at_value)
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.contracts_14d_payments "
                f"(contract_id, amount, payment_type, comment, recorded_by, "
                f"cash_account_id, cash_movement_id, income_type) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (cid, amount, payment_type, comment, (actor or {}).get('full_name'),
                 cash_id, movement_id, income_type)
            )
        payment_id = cur.fetchone()[0]

        new_status = 'closed' if new_remaining <= 0 else 'active'
        # При досрочном выкупе обновляем total_due на актуальную сумму на дату операции,
        # чтобы остаток и сумма к возврату везде показывались корректно.
        new_total_due = effective_due if is_early else total_due
        # closed_at = дата операции (если задним числом) или NOW()
        if new_status == 'closed' and paid_at_value is not None:
            cur.execute(
                f"UPDATE {SCHEMA}.contracts_14d SET total_due=%s, paid_total=%s, remaining_debt=%s, status=%s, "
                f"closed_at=%s, updated_at=NOW() WHERE id=%s",
                (new_total_due, new_paid, new_remaining, new_status, paid_at_value, cid)
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.contracts_14d SET total_due=%s, paid_total=%s, remaining_debt=%s, status=%s, "
                f"closed_at=CASE WHEN %s='closed' THEN NOW() ELSE closed_at END, updated_at=NOW() WHERE id=%s",
                (new_total_due, new_paid, new_remaining, new_status, new_status, cid)
            )

        _log(cur, cid, 'payment', {
            'payment_id': payment_id,
            'amount': float(amount),
            'payment_type': payment_type,
            'income_type': income_type,
            'remaining_debt': float(new_remaining),
            'auto_closed': new_status == 'closed',
            'is_early_redemption': bool(is_early and payment_type == 'full'),
            'days_passed': today_calc.get('days_passed'),
            'saving': today_calc.get('saving'),
            'cash_account_id': cash_id,
            'cash_movement_id': movement_id,
        }, actor)
        conn.commit()
        return _ok({
            'remaining_debt': float(new_remaining),
            'paid_total': float(new_paid),
            'total_due': float(new_total_due),
            'status': new_status,
            'income_type': income_type,
            'cash_movement_id': movement_id,
            'is_early_redemption': bool(is_early and payment_type == 'full'),
            'days_passed': today_calc.get('days_passed'),
            'saving': today_calc.get('saving'),
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


def action_payment_cancel(body, actor):
    """Отменить ошибочный платёж. Откатывает кассу, удаляет запись, пересчитывает остаток.
    Если договор был закрыт этим платежом — снова активирует."""
    payment_id = body.get('payment_id')
    if not payment_id:
        return _err(400, 'payment_id required')
    try:
        payment_id = int(payment_id)
    except Exception:
        return _err(400, 'Некорректный payment_id')
    conn = get_conn(); cur = conn.cursor()
    try:
        # 1. Получаем платёж + договор
        cur.execute(
            f"SELECT p.contract_id, p.amount, p.payment_type, p.cash_account_id, p.cash_movement_id, "
            f"p.paid_at, p.recorded_by, "
            f"c.amount AS principal, c.paid_total, c.remaining_debt, c.total_due, c.status, "
            f"c.interest_rate, c.term_days, c.start_date "
            f"FROM {SCHEMA}.contracts_14d_payments p "
            f"JOIN {SCHEMA}.contracts_14d c ON c.id=p.contract_id "
            f"WHERE p.id=%s",
            (payment_id,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Платёж не найден')
        cid = int(row[0])
        amt = Decimal(str(row[1]))
        cash_id = row[3]
        movement_id = row[4]
        paid_at_value = row[5]
        principal = Decimal(str(row[7]))
        paid_total = Decimal(str(row[8]))
        cur_status = row[11]
        rate = Decimal(str(row[12]))
        term_days = int(row[13])
        sd = row[14]

        # 2. Откатываем кассу — создаём обратное движение 'out' той же датой
        if cash_id and movement_id:
            # Узнаём ветку
            cur.execute(
                f"SELECT branch_id FROM {SCHEMA}.slshop_cash_accounts WHERE id=%s",
                (cash_id,)
            )
            br_row = cur.fetchone()
            branch_id = br_row[0] if br_row else None
            _cash_movement(
                cur, cash_id, 'out', amt,
                'contracts_14d_payment_cancel',
                f'Отмена платежа №{payment_id} по договору',
                actor, branch_id=branch_id, created_at=paid_at_value,
            )

        # 3. Удаляем сам платёж
        cur.execute(
            f"DELETE FROM {SCHEMA}.contracts_14d_payments WHERE id=%s",
            (payment_id,)
        )

        # 4. Пересчитываем paid_total и остаток
        new_paid_total = paid_total - amt
        if new_paid_total < Decimal('0'):
            new_paid_total = Decimal('0')

        # Пересчёт суммы к возврату на сегодня (для досрочки) или полная (после срока)
        today_calc = _calc_today(principal, rate, term_days, sd, new_paid_total)
        is_early_now = bool(today_calc['is_early'])
        # Восстанавливаем total_due: если договор был закрыт досрочно — total_due был пересчитан
        # на день закрытия, теперь надо вернуть оригинальный total
        full_total = (principal * (Decimal(1) + rate * Decimal(term_days) / Decimal(100))).quantize(Decimal('0.01'))
        new_total_due = full_total
        new_remaining = new_total_due - new_paid_total
        if new_remaining < Decimal('0'):
            new_remaining = Decimal('0')

        # 5. Возвращаем статус active, если был closed
        new_status = 'active' if cur_status == 'closed' else cur_status
        if new_status == 'active':
            cur.execute(
                f"UPDATE {SCHEMA}.contracts_14d SET total_due=%s, paid_total=%s, remaining_debt=%s, "
                f"status='active', closed_at=NULL, updated_at=NOW() WHERE id=%s",
                (new_total_due, new_paid_total, new_remaining, cid)
            )
        else:
            cur.execute(
                f"UPDATE {SCHEMA}.contracts_14d SET total_due=%s, paid_total=%s, remaining_debt=%s, "
                f"updated_at=NOW() WHERE id=%s",
                (new_total_due, new_paid_total, new_remaining, cid)
            )

        # 6. Лог
        _log(cur, cid, 'payment_cancel', {
            'payment_id': payment_id,
            'amount': float(amt),
            'reopened': cur_status == 'closed',
            'new_remaining': float(new_remaining),
            'is_early_now': is_early_now,
        }, actor)
        conn.commit()
        return _ok({
            'ok': True,
            'reopened': cur_status == 'closed',
            'paid_total': float(new_paid_total),
            'remaining_debt': float(new_remaining),
            'total_due': float(new_total_due),
            'status': new_status,
        })
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


# ============ Cash accounts list ============
def action_cash_accounts():
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, name, kind, balance, is_default, is_active "
        f"FROM {SCHEMA}.slshop_cash_accounts WHERE is_active=true "
        f"ORDER BY is_default DESC, id ASC"
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'accounts': rows})


# ============ Income report ============
def action_income_report(params):
    """
    GET /?action=income_report&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
        &income_type=all|principal|interest|mixed
        &contract_status=all|active|closed|terminated
    """
    today = date.today()
    sd = _parse_date(params.get('start_date'), today.replace(day=1))
    ed = _parse_date(params.get('end_date'), today)
    income_type = (params.get('income_type') or 'all').strip()
    contract_status = (params.get('contract_status') or 'all').strip()

    where = [f"p.paid_at::date >= {_esc(sd.isoformat())}",
             f"p.paid_at::date <= {_esc(ed.isoformat())}"]
    if income_type in ('principal', 'interest', 'mixed'):
        where.append(f"p.income_type = {_esc(income_type)}")
    if contract_status in ('active', 'closed', 'terminated'):
        where.append(f"c.status = {_esc(contract_status)}")
    where_sql = 'WHERE ' + ' AND '.join(where)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT p.id, p.paid_at, p.amount, p.payment_type, p.income_type, p.comment, p.recorded_by, "
        f"c.id AS contract_id, c.contract_number, c.status AS contract_status, "
        f"cl.full_name AS client_name "
        f"FROM {SCHEMA}.contracts_14d_payments p "
        f"JOIN {SCHEMA}.contracts_14d c ON c.id = p.contract_id "
        f"JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id = c.client_id "
        f"{where_sql} "
        f"ORDER BY p.paid_at DESC LIMIT 5000"
    )
    details = [dict(r) for r in cur.fetchall()]

    # сводка
    total = sum(Decimal(str(r['amount'] or 0)) for r in details)
    contracts = {r['contract_id'] for r in details}
    interest_sum = sum(Decimal(str(r['amount'] or 0)) for r in details if r.get('income_type') == 'interest')
    principal_sum = sum(Decimal(str(r['amount'] or 0)) for r in details if r.get('income_type') == 'principal')
    mixed_sum = sum(Decimal(str(r['amount'] or 0)) for r in details if r.get('income_type') == 'mixed')

    # помесячная разбивка
    by_day = {}
    for r in details:
        pa = r.get('paid_at')
        if pa:
            d = pa.date() if hasattr(pa, 'date') else _parse_date(str(pa)[:10])
            key = d.isoformat() if d else None
            if key:
                by_day[key] = float(Decimal(str(by_day.get(key, 0))) + Decimal(str(r['amount'] or 0)))
    daily = [{'date': k, 'amount': v} for k, v in sorted(by_day.items())]

    cur.close(); conn.close()

    avg = float(total / len(contracts)) if contracts else 0.0
    actor_name = None  # лог пишем в handler — здесь только данные

    return _ok({
        'period': {'start_date': sd.isoformat(), 'end_date': ed.isoformat()},
        'summary': {
            'total_income': float(total),
            'principal_income': float(principal_sum),
            'interest_income': float(interest_sum),
            'mixed_income': float(mixed_sum),
            'contract_count': len(contracts),
            'payments_count': len(details),
            'avg_income_per_contract': round(avg, 2),
        },
        'daily': daily,
        'details': details,
    })


# ============ Late contracts (созданные задним числом) ============
def action_late(params):
    date_from = (params.get('date_from') or '').strip()
    date_to = (params.get('date_to') or '').strip()
    where = ["c.start_date < c.created_at::date"]
    if date_from:
        where.append(f"c.start_date >= {_esc(date_from)}")
    if date_to:
        where.append(f"c.start_date <= {_esc(date_to)}")
    where_sql = 'WHERE ' + ' AND '.join(where)
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT c.id, c.contract_number, c.amount, c.start_date, c.end_date, c.status, c.created_at, "
        f"cl.full_name AS client_name, cl.phone AS client_phone, "
        f"i.brand AS item_brand, i.model AS item_model "
        f"FROM {SCHEMA}.contracts_14d c "
        f"JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id = c.client_id "
        f"JOIN {SCHEMA}.contracts_14d_items i ON i.id = c.item_id "
        f"{where_sql} ORDER BY c.start_date DESC LIMIT 500"
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'items': rows, 'count': len(rows)})


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
def action_public_view(params):
    """Публичный просмотр договора для клиента по номеру (без авторизации).
    Возвращает только безопасные поля: сумма к возврату, прошло/осталось дней, дата окончания.
    """
    number = (params.get('number') or '').strip().upper()
    if not number:
        return _err(400, 'number required')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT c.contract_number, c.amount, c.interest_rate, c.term_days, "
        f"c.start_date, c.end_date, c.status, c.paid_total, c.total_due, "
        f"cl.full_name AS client_name, "
        f"i.item_type, i.brand AS item_brand, i.model AS item_model "
        f"FROM {SCHEMA}.contracts_14d c "
        f"JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id=c.client_id "
        f"JOIN {SCHEMA}.contracts_14d_items i ON i.id=c.item_id "
        f"WHERE UPPER(c.contract_number)=%s",
        (number,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return _err(404, 'Договор не найден')
    contract = dict(row)
    # Маскируем ФИО: Иванов Иван Иванович -> Иванов И. И.
    name = (contract.get('client_name') or '').strip()
    parts = [p for p in name.split() if p]
    if len(parts) >= 2:
        masked = parts[0] + ' ' + '. '.join(p[0] for p in parts[1:]) + '.'
    else:
        masked = name
    today = date.today()
    end_date = contract.get('end_date')
    start_date = contract.get('start_date')
    term_days = int(contract.get('term_days') or 14)
    is_active = contract.get('status') == 'active'
    today_calc = None
    days_remaining = None
    overdue_days = 0
    if is_active:
        today_calc = _calc_today(
            contract.get('amount'),
            contract.get('interest_rate'),
            term_days,
            start_date,
            contract.get('paid_total'),
        )
        if end_date:
            days_remaining = (end_date - today).days
            if days_remaining < 0:
                overdue_days = -days_remaining
                days_remaining = 0
    return _ok({
        'contract_number': contract.get('contract_number'),
        'status': contract.get('status'),
        'amount': float(contract.get('amount') or 0),
        'interest_rate': float(contract.get('interest_rate') or 0),
        'term_days': term_days,
        'start_date': start_date.isoformat() if start_date else None,
        'end_date': end_date.isoformat() if end_date else None,
        'days_remaining': days_remaining,
        'overdue_days': overdue_days,
        'client_name_masked': masked,
        'item_brand': contract.get('item_brand'),
        'item_model': contract.get('item_model'),
        'today_calc': today_calc,
        'paid_total': float(contract.get('paid_total') or 0),
        'total_due': float(contract.get('total_due') or 0),
    })


def handler(event: dict, context) -> dict:
    """Договоры продажи на 14 дней (СмартЛомбард). Действия: list, get, create, calculate, payment, terminate, close, stats, upload_photo, public_view."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = (qs.get('action') or '').strip()

    # Публичный action — без авторизации
    if method == 'GET' and action == 'public_view':
        return action_public_view(qs)

    headers = event.get('headers') or {}
    token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''
    actor = get_employee(token)
    if not actor:
        return _err(401, 'Не авторизован')
    if actor.get('role') not in ALLOWED_ROLES:
        return _err(403, 'Нет доступа к разделу')

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
        if action == 'cash_accounts':
            return action_cash_accounts()
        if action == 'income_report':
            return action_income_report(qs)
        if action == 'late':
            return action_late(qs)
        return _err(400, f'Unknown GET action: {action}')

    if method == 'POST':
        if action == 'create':
            return action_create(body, actor)
        if action == 'payment':
            return action_payment(body, actor)
        if action == 'payment_cancel':
            return action_payment_cancel(body, actor)
        if action == 'terminate':
            return action_terminate(body, actor)
        if action == 'close':
            return action_close(body, actor)
        if action == 'upload_photo':
            return action_upload_photo(body, actor)
        return _err(400, f'Unknown POST action: {action}')

    return _err(405, 'Method not allowed')