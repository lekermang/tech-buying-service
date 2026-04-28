import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta

import psycopg2

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, Authorization',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def hash_pin(pin: str) -> str:
    # отдельная соль, чтобы PIN-хеш не совпадал с password_hash
    return hashlib.sha256(('pin:' + pin).encode()).hexdigest()


OWNER_REQUIRED_PIN = '231189'


def get_employee_by_token(token: str):
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"SELECT id, full_name, login, role FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (token,))
    row = cur.fetchone(); cur.close(); conn.close()
    return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]} if row else None


def handler(event: dict, context) -> dict:
    """Авторизация сотрудников: вход, профиль, управление сотрудниками (только owner/admin)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    # GET /profile
    if method == 'GET' and params.get('action') != 'list':
        if not emp_token:
            return _err(401, 'Требуется токен')
        emp = get_employee_by_token(emp_token)
        if not emp:
            return _err(401, 'Токен недействителен')
        return _ok(emp)

    # GET /list — список сотрудников (только owner/admin) с поиском и фильтром
    if method == 'GET' and params.get('action') == 'list':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        q = (params.get('q') or '').strip()
        status_f = (params.get('status') or '').strip()  # active | inactive | ''
        role_f = (params.get('role') or '').strip()
        conditions = []
        values: list = []
        if q:
            conditions.append("(full_name ILIKE %s OR login ILIKE %s OR COALESCE(email,'') ILIKE %s OR COALESCE(phone,'') ILIKE %s OR COALESCE(position,'') ILIKE %s)")
            like = f"%{q}%"
            values.extend([like, like, like, like, like])
        if status_f == 'active':
            conditions.append("is_active = true")
        elif status_f == 'inactive':
            conditions.append("is_active = false")
        if role_f in ('owner', 'admin', 'staff', 'master'):
            conditions.append("role = %s"); values.append(role_f)
        where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
        conn = get_conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id, full_name, login, role, is_active, created_at, position, email, phone, note "
            f"FROM {SCHEMA}.employees{where} ORDER BY is_active DESC, id",
            values,
        )
        rows = cur.fetchall(); cur.close(); conn.close()
        employees = [{
            'id': r[0], 'full_name': r[1], 'login': r[2], 'role': r[3],
            'is_active': r[4], 'created_at': r[5].isoformat() if r[5] else None,
            'position': r[6], 'email': r[7], 'phone': r[8], 'note': r[9],
        } for r in rows]
        return _ok({'employees': employees, 'total': len(employees)})

    # GET /clients — список клиентов программы скидок (owner/admin)
    if method == 'GET' and params.get('action') == 'clients':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""SELECT id, full_name, phone, email, discount_pct, loyalty_points, registered_at
                        FROM {SCHEMA}.clients ORDER BY registered_at DESC""")
        rows = cur.fetchall(); cur.close(); conn.close()
        clients = [{'id': r[0], 'full_name': r[1], 'phone': r[2], 'email': r[3],
                    'discount_pct': r[4], 'loyalty_points': r[5],
                    'registered_at': r[6].isoformat() if r[6] else None} for r in rows]
        return _ok({'clients': clients, 'total': len(clients)})

    # POST /reset-password — сброс пароля через ADMIN_TOKEN (системный секрет)
    if method == 'POST' and body.get('action') == 'reset_password':
        admin_secret = os.environ.get('ADMIN_TOKEN', '')
        provided = body.get('admin_token', '').strip()
        if not provided or provided != admin_secret:
            return _err(403, 'Нет доступа')
        login_val = body.get('login', '').strip()
        new_pw = body.get('password', '').strip()
        if not login_val or not new_pw:
            return _err(400, 'Логин и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.employees SET password_hash=%s WHERE login=%s RETURNING id",
                    (hash_pw(new_pw), login_val))
        updated = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        if not updated:
            return _err(404, 'Сотрудник не найден')
        return _ok({'ok': True})

    # POST /login — шаг 1: проверка логина+пароля, выдаём pin_ticket
    if method == 'POST' and body.get('action') == 'login':
        login_val = body.get('login', '').strip()
        password = body.get('password', '').strip()
        if not login_val or not password:
            return _err(400, 'Логин и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        pw_hash = hash_pw(password)
        cur.execute(f"SELECT id, full_name, role, password_hash, pin_hash, pin_locked_until FROM {SCHEMA}.employees WHERE login=%s AND is_active=true", (login_val,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close(); return _err(401, 'Неверный логин или пароль')
        emp_id, full_name, role, stored_hash, pin_hash, pin_locked_until = row
        # CHANGE_ME — пароль ещё не установлен, фиксируем введённый
        if stored_hash == 'CHANGE_ME':
            cur.execute(f"UPDATE {SCHEMA}.employees SET password_hash=%s WHERE id=%s", (pw_hash, emp_id))
            stored_hash = pw_hash
        if stored_hash != pw_hash:
            cur.close(); conn.close(); return _err(401, 'Неверный логин или пароль')

        # Блокировка PIN ещё активна?
        if pin_locked_until and pin_locked_until > datetime.utcnow():
            cur.close(); conn.close()
            return _err(423, 'PIN временно заблокирован из-за ошибок. Попробуйте позже.')

        # Выдаём короткоживущий pin_ticket (5 минут) для шага 2
        ticket = secrets.token_hex(24)
        ticket_exp = datetime.utcnow() + timedelta(minutes=5)
        cur.execute(
            f"UPDATE {SCHEMA}.employees SET auth_token=%s, token_expires_at=%s, pin_pending=true WHERE id=%s",
            (ticket, ticket_exp, emp_id),
        )
        conn.commit(); cur.close(); conn.close()
        # Если PIN не задан — сотруднику предложим создать его (владельцу — обязан быть 231189)
        return _ok({
            'stage': 'pin',
            'pin_ticket': ticket,
            'pin_set': bool(pin_hash),
            'role': role,
            'full_name': full_name,
        })

    # POST /verify_pin — шаг 2: проверка/создание PIN, выдаём финальный токен
    if method == 'POST' and body.get('action') == 'verify_pin':
        ticket = (body.get('pin_ticket') or '').strip()
        pin = (body.get('pin') or '').strip()
        if not ticket or not pin:
            return _err(400, 'PIN обязателен')
        if not pin.isdigit() or not (4 <= len(pin) <= 8):
            return _err(400, 'PIN должен быть 4–8 цифр')

        conn = get_conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id, full_name, role, pin_hash, pin_failed_count, pin_locked_until "
            f"FROM {SCHEMA}.employees "
            f"WHERE auth_token=%s AND token_expires_at>NOW() AND pin_pending=true AND is_active=true",
            (ticket,),
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close(); return _err(401, 'Сессия входа истекла, войдите заново')
        emp_id, full_name, role, pin_hash, pin_failed, pin_locked = row

        if pin_locked and pin_locked > datetime.utcnow():
            cur.close(); conn.close()
            return _err(423, 'PIN временно заблокирован, попробуйте позже')

        new_pin_hash = hash_pin(pin)

        # Создание PIN при первом входе
        if not pin_hash:
            # Владельцу разрешён только конкретный PIN
            if role == 'owner' and pin != OWNER_REQUIRED_PIN:
                cur.close(); conn.close()
                return _err(403, 'Неверный PIN владельца')
            cur.execute(
                f"UPDATE {SCHEMA}.employees SET pin_hash=%s, pin_failed_count=0, pin_locked_until=NULL WHERE id=%s",
                (new_pin_hash, emp_id),
            )
        else:
            # Проверка существующего PIN
            if role == 'owner':
                # Владелец всегда обязан вводить фиксированный PIN
                if pin != OWNER_REQUIRED_PIN:
                    failed = (pin_failed or 0) + 1
                    locked_sql = ''
                    locked_val = None
                    if failed >= 5:
                        locked_val = datetime.utcnow() + timedelta(minutes=15)
                        locked_sql = ", pin_locked_until=%s"
                    if locked_val is not None:
                        cur.execute(
                            f"UPDATE {SCHEMA}.employees SET pin_failed_count=%s{locked_sql} WHERE id=%s",
                            (failed, locked_val, emp_id),
                        )
                    else:
                        cur.execute(
                            f"UPDATE {SCHEMA}.employees SET pin_failed_count=%s WHERE id=%s",
                            (failed, emp_id),
                        )
                    conn.commit(); cur.close(); conn.close()
                    return _err(401, 'Неверный PIN')
            else:
                if pin_hash != new_pin_hash:
                    failed = (pin_failed or 0) + 1
                    locked_val = None
                    if failed >= 5:
                        locked_val = datetime.utcnow() + timedelta(minutes=15)
                    if locked_val is not None:
                        cur.execute(
                            f"UPDATE {SCHEMA}.employees SET pin_failed_count=%s, pin_locked_until=%s WHERE id=%s",
                            (failed, locked_val, emp_id),
                        )
                    else:
                        cur.execute(
                            f"UPDATE {SCHEMA}.employees SET pin_failed_count=%s WHERE id=%s",
                            (failed, emp_id),
                        )
                    conn.commit(); cur.close(); conn.close()
                    return _err(401, 'Неверный PIN')

        # Успех — выдаём финальный токен на 30 дней
        token = secrets.token_hex(32)
        expires = datetime.utcnow() + timedelta(days=30)
        cur.execute(
            f"UPDATE {SCHEMA}.employees "
            f"SET auth_token=%s, token_expires_at=%s, pin_pending=false, pin_failed_count=0, pin_locked_until=NULL "
            f"WHERE id=%s",
            (token, expires, emp_id),
        )
        conn.commit(); cur.close(); conn.close()
        return _ok({
            'token': token,
            'full_name': full_name,
            'role': role,
            'first_pin': not bool(pin_hash),
        })

    # POST /create — создать сотрудника (owner/admin)
    if method == 'POST' and body.get('action') == 'create':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        login_val = body.get('login', '').strip()
        full_name = body.get('full_name', '').strip()
        password = body.get('password', '').strip()
        role = body.get('role', 'staff')
        position = (body.get('position') or '').strip() or None
        email = (body.get('email') or '').strip() or None
        phone = (body.get('phone') or '').strip() or None
        note = (body.get('note') or '').strip() or None
        if emp['role'] == 'admin' and role == 'owner':
            return _err(403, 'Нельзя назначить роль владельца')
        if role not in ('staff', 'admin', 'master'):
            role = 'staff'
        if not login_val or not full_name or not password:
            return _err(400, 'Логин, ФИО и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.employees WHERE login=%s", (login_val,))
        if cur.fetchone():
            cur.close(); conn.close(); return _err(409, 'Логин уже занят')
        pw_hash = hash_pw(password)
        cur.execute(
            f"INSERT INTO {SCHEMA}.employees (full_name, login, password_hash, role, position, email, phone, note) "
            f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
            (full_name, login_val, pw_hash, role, position, email, phone, note),
        )
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return _ok({'id': new_id, 'ok': True})

    # PUT /update — изменить пароль или деактивировать (owner/admin)
    if method == 'PUT':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        target_id = body.get('id')
        if not target_id:
            return _err(400, 'id обязателен')
        conn = get_conn(); cur = conn.cursor()
        # Нельзя менять owner другому
        cur.execute(f"SELECT role FROM {SCHEMA}.employees WHERE id=%s", (int(target_id),))
        tr = cur.fetchone()
        if not tr:
            cur.close(); conn.close(); return _err(404, 'Сотрудник не найден')
        if tr[0] == 'owner' and emp['role'] != 'owner':
            cur.close(); conn.close(); return _err(403, 'Нельзя изменить владельца')

        fields, values = [], []
        if 'password' in body and body['password']:
            fields.append("password_hash=%s"); values.append(hash_pw(body['password']))
        if 'is_active' in body:
            fields.append("is_active=%s"); values.append(bool(body['is_active']))
        if 'full_name' in body and body['full_name']:
            fields.append("full_name=%s"); values.append(body['full_name'])
        if 'role' in body and body['role'] in ('staff', 'admin', 'master'):
            if emp['role'] == 'owner':
                fields.append("role=%s"); values.append(body['role'])
        if 'position' in body:
            fields.append("position=%s"); values.append((body.get('position') or '').strip() or None)
        if 'email' in body:
            fields.append("email=%s"); values.append((body.get('email') or '').strip() or None)
        if 'phone' in body:
            fields.append("phone=%s"); values.append((body.get('phone') or '').strip() or None)
        if 'note' in body:
            fields.append("note=%s"); values.append((body.get('note') or '').strip() or None)
        if fields:
            values.append(int(target_id))
            cur.execute(f"UPDATE {SCHEMA}.employees SET {', '.join(fields)} WHERE id=%s", values)
            conn.commit()
        cur.close(); conn.close()
        return _ok({'ok': True})

    return _err(404, 'Не найдено')


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}

def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}