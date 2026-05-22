"""
Управление клиентами кабинета /client из админки /staff.
Доступ: любой залогиненный сотрудник (X-Employee-Token).
Удалять клиента — только owner/admin.

Действия (POST):
  - list           : список клиентов с поиском, фильтром, пагинацией
  - get            : подробная карточка одного клиента (профиль + статистика)
  - update         : правка ФИО, телефона, email, паспорта, адреса, скидки, заметок
  - reset_password : сброс пароля клиента (выдаёт временный пароль, который сотрудник скажет клиенту)
  - delete         : удалить клиента (только owner/admin)
  - verify_email   : вручную пометить email подтверждённым
"""
import os
import json
import re
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
}

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')


def _ok(body, code=200):
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _err(msg, code=400):
    return _ok({'error': msg}, code)


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _hash_pw(pw: str) -> str:
    return hashlib.sha256(('client:' + pw).encode()).hexdigest()


def _normalize_phone(phone: str) -> str:
    digits = ''.join(c for c in (phone or '') if c.isdigit())
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    return digits


def _resolve_emp(event: dict):
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (hdrs.get('x-employee-token') or '').strip()
    if not token:
        return None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, role FROM {SCHEMA}.employees "
            f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'full_name': row[1], 'role': row[2]}
    finally:
        cur.close(); conn.close()


def handler(event: dict, context) -> dict:
    """Управление клиентами для сотрудников /staff."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    emp = _resolve_emp(event)
    if not emp:
        return _err('Unauthorized', 401)

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    action = (body.get('action') or '').strip()

    if action == 'list':
        return _list(body)
    if action == 'get':
        return _get(body)
    if action == 'update':
        return _update(emp, body)
    if action == 'reset_password':
        return _reset_password(emp, body)
    if action == 'delete':
        return _delete(emp, body)
    if action == 'verify_email':
        return _verify_email(emp, body)

    return _err(f'unknown action: {action}')


def _list(body):
    q = (body.get('q') or '').strip()
    page = max(1, int(body.get('page') or 1))
    per = min(100, max(10, int(body.get('per_page') or 30)))
    offset = (page - 1) * per
    only = (body.get('only') or '').strip()

    where = []
    args = []
    if q:
        digits = ''.join(c for c in q if c.isdigit())
        like = f"%{q}%"
        if digits and len(digits) >= 3:
            where.append("(full_name ILIKE %s OR LOWER(email) LIKE %s "
                         "OR REGEXP_REPLACE(phone,'[^0-9]','','g') LIKE %s "
                         "OR passport_number LIKE %s)")
            args.extend([like, f"%{q.lower()}%", f"%{digits}%", f"%{digits}%"])
        else:
            where.append("(full_name ILIKE %s OR LOWER(email) LIKE %s)")
            args.extend([like, f"%{q.lower()}%"])

    if only == 'with_email':
        where.append("email IS NOT NULL AND email <> ''")
    elif only == 'verified':
        where.append("email_verified = TRUE")
    elif only == 'no_passport':
        where.append("(passport_number IS NULL OR passport_number = '')")

    where_sql = ('WHERE ' + ' AND '.join(where)) if where else ''

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.clients {where_sql}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"SELECT id, full_name, phone, email, email_verified, "
            f"passport_series, passport_number, address, discount_pct, loyalty_points, "
            f"registered_at, last_login_at, client_group, avatar_url, notes "
            f"FROM {SCHEMA}.clients {where_sql} "
            f"ORDER BY COALESCE(last_login_at, registered_at) DESC NULLS LAST "
            f"LIMIT %s OFFSET %s",
            args + [per, offset]
        )
        rows = cur.fetchall()
        clients = []
        for r in rows:
            clients.append({
                'id': r[0], 'full_name': r[1], 'phone': r[2], 'email': r[3],
                'email_verified': r[4],
                'passport_series': r[5], 'passport_number': r[6],
                'address': r[7], 'discount_pct': r[8], 'loyalty_points': r[9],
                'registered_at': r[10].isoformat() if r[10] else None,
                'last_login_at': r[11].isoformat() if r[11] else None,
                'client_group': r[12], 'avatar_url': r[13],
                'notes': r[14],
                'has_passport': bool(r[6]),
            })
        return _ok({'clients': clients, 'total': total, 'page': page, 'per_page': per})
    except Exception as e:
        return _err(f'list failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _get(body):
    cid = body.get('id')
    if not cid:
        return _err('id обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, phone, email, email_verified, "
            f"passport_series, passport_number, passport_issued_by, passport_issued_date, "
            f"address, discount_pct, loyalty_points, registered_at, last_login_at, "
            f"client_group, avatar_url, notes "
            f"FROM {SCHEMA}.clients WHERE id=%s",
            (cid,)
        )
        r = cur.fetchone()
        if not r:
            return _err('Клиент не найден', 404)
        client = {
            'id': r[0], 'full_name': r[1], 'phone': r[2], 'email': r[3],
            'email_verified': r[4],
            'passport_series': r[5], 'passport_number': r[6],
            'passport_issued_by': r[7],
            'passport_issued_date': r[8].isoformat() if r[8] else None,
            'address': r[9], 'discount_pct': r[10], 'loyalty_points': r[11],
            'registered_at': r[12].isoformat() if r[12] else None,
            'last_login_at': r[13].isoformat() if r[13] else None,
            'client_group': r[14], 'avatar_url': r[15], 'notes': r[16],
        }

        # Статистика
        phone_digits = ''.join(c for c in (r[2] or '') if c.isdigit())
        last10 = phone_digits[-10:] if len(phone_digits) >= 10 else phone_digits
        cur.execute(
            f"SELECT COUNT(*), "
            f"COUNT(*) FILTER (WHERE status IN ('new','accepted','in_progress','ready','waiting_parts')) "
            f"FROM {SCHEMA}.repair_orders "
            f"WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE %s",
            ('%' + last10,)
        )
        rep_total, rep_active = cur.fetchone()

        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.client_offers WHERE client_id=%s",
            (cid,)
        )
        off_total = cur.fetchone()[0]

        client['stats'] = {
            'repairs_total': rep_total,
            'repairs_active': rep_active,
            'offers_total': off_total,
        }
        return _ok({'client': client})
    except Exception as e:
        return _err(f'get failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _update(emp, body):
    cid = body.get('id')
    if not cid:
        return _err('id обязателен')

    fields = []
    args = []
    
    if 'full_name' in body:
        fn = (body.get('full_name') or '').strip()
        if len(fn) < 2:
            return _err('Имя слишком короткое')
        fields.append('full_name=%s'); args.append(fn)
    if 'phone' in body:
        ph = _normalize_phone(body.get('phone') or '')
        if len(ph) < 10:
            return _err('Некорректный телефон')
        fields.append('phone=%s'); args.append(ph)
    if 'email' in body:
        em = (body.get('email') or '').strip().lower() or None
        if em and not EMAIL_RE.match(em):
            return _err('Некорректный email')
        fields.append('email=%s'); args.append(em)
    if 'passport_series' in body:
        fields.append('passport_series=%s'); args.append((body.get('passport_series') or '').strip() or None)
    if 'passport_number' in body:
        fields.append('passport_number=%s'); args.append((body.get('passport_number') or '').strip() or None)
    if 'passport_issued_by' in body:
        fields.append('passport_issued_by=%s'); args.append((body.get('passport_issued_by') or '').strip() or None)
    if 'passport_issued_date' in body:
        d = (body.get('passport_issued_date') or '').strip() or None
        fields.append('passport_issued_date=%s'); args.append(d)
    if 'address' in body:
        fields.append('address=%s'); args.append((body.get('address') or '').strip() or None)
    if 'discount_pct' in body:
        try:
            dp = max(0, min(50, int(body.get('discount_pct'))))
        except Exception:
            return _err('discount_pct должен быть числом 0..50')
        fields.append('discount_pct=%s'); args.append(dp)
    if 'loyalty_points' in body:
        try:
            lp = max(0, int(body.get('loyalty_points')))
        except Exception:
            return _err('loyalty_points должен быть числом')
        fields.append('loyalty_points=%s'); args.append(lp)
    if 'client_group' in body:
        fields.append('client_group=%s'); args.append((body.get('client_group') or '').strip() or None)
    if 'notes' in body:
        fields.append('notes=%s'); args.append((body.get('notes') or '').strip() or None)

    if not fields:
        return _err('Нет полей для обновления')

    fields.append('updated_at=NOW()')
    args.append(cid)

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET {', '.join(fields)} WHERE id=%s",
            args
        )
        if cur.rowcount == 0:
            return _err('Клиент не найден', 404)
        conn.commit()
        return _ok({'ok': True, 'edited_by': emp['full_name']})
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return _err('Такой email уже зарегистрирован у другого клиента')
    except Exception as e:
        conn.rollback()
        return _err(f'update failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _reset_password(emp, body):
    cid = body.get('id')
    if not cid:
        return _err('id обязателен')
    new_pw = secrets.token_urlsafe(8)[:10]
    ph = _hash_pw(new_pw)
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET password_hash=%s, auth_token=NULL, "
            f"token_expires_at=NULL, updated_at=NOW() WHERE id=%s RETURNING email",
            (ph, cid)
        )
        row = cur.fetchone()
        if not row:
            return _err('Клиент не найден', 404)
        conn.commit()
        return _ok({'ok': True, 'temp_password': new_pw, 'email': row[0]})
    except Exception as e:
        conn.rollback()
        return _err(f'reset failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _verify_email(emp, body):
    cid = body.get('id')
    if not cid:
        return _err('id обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET email_verified=TRUE, email_verify_token=NULL, "
            f"updated_at=NOW() WHERE id=%s",
            (cid,)
        )
        if cur.rowcount == 0:
            return _err('Клиент не найден', 404)
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'verify failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _delete(emp, body):
    if emp['role'] not in ('owner', 'admin'):
        return _err('Удалять клиентов могут только администраторы', 403)
    cid = body.get('id')
    if not cid:
        return _err('id обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"DELETE FROM {SCHEMA}.clients WHERE id=%s", (cid,))
        if cur.rowcount == 0:
            return _err('Клиент не найден', 404)
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'delete failed: {e}', 500)
    finally:
        cur.close(); conn.close()
