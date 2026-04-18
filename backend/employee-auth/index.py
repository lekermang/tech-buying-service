import json
import os
import secrets
import hashlib
from datetime import datetime, timedelta
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


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

    # GET /list — список сотрудников (только owner/admin)
    if method == 'GET' and params.get('action') == 'list':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id, full_name, login, role, is_active, created_at FROM {SCHEMA}.employees ORDER BY id")
        rows = cur.fetchall(); cur.close(); conn.close()
        employees = [{'id': r[0], 'full_name': r[1], 'login': r[2], 'role': r[3],
                      'is_active': r[4], 'created_at': r[5].isoformat() if r[5] else None} for r in rows]
        return _ok({'employees': employees})

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

    # POST /login
    if method == 'POST' and body.get('action') == 'login':
        login_val = body.get('login', '').strip()
        password = body.get('password', '').strip()
        if not login_val or not password:
            return _err(400, 'Логин и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        pw_hash = hash_pw(password)
        cur.execute(f"SELECT id, full_name, role, password_hash FROM {SCHEMA}.employees WHERE login=%s AND is_active=true", (login_val,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close(); return _err(401, 'Неверный логин или пароль')
        emp_id, full_name, role, stored_hash = row
        # CHANGE_ME — пароль ещё не установлен, принимаем любой и устанавливаем
        if stored_hash == 'CHANGE_ME':
            token = secrets.token_hex(32)
            expires = datetime.utcnow() + timedelta(days=30)
            cur.execute(f"UPDATE {SCHEMA}.employees SET password_hash=%s, auth_token=%s, token_expires_at=%s WHERE id=%s",
                        (pw_hash, token, expires, emp_id))
            conn.commit(); cur.close(); conn.close()
            return _ok({'token': token, 'full_name': full_name, 'role': role, 'first_login': True})
        if stored_hash != pw_hash:
            cur.close(); conn.close(); return _err(401, 'Неверный логин или пароль')
        token = secrets.token_hex(32)
        expires = datetime.utcnow() + timedelta(days=30)
        cur.execute(f"UPDATE {SCHEMA}.employees SET auth_token=%s, token_expires_at=%s WHERE id=%s", (token, expires, emp_id))
        conn.commit(); cur.close(); conn.close()
        return _ok({'token': token, 'full_name': full_name, 'role': role})

    # POST /create — создать сотрудника (owner/admin)
    if method == 'POST' and body.get('action') == 'create':
        emp = get_employee_by_token(emp_token)
        if not emp or emp['role'] not in ('owner', 'admin'):
            return _err(403, 'Нет доступа')
        login_val = body.get('login', '').strip()
        full_name = body.get('full_name', '').strip()
        password = body.get('password', '').strip()
        role = body.get('role', 'staff')
        # owner не может создать другого owner
        if emp['role'] == 'admin' and role == 'owner':
            return _err(403, 'Нельзя назначить роль владельца')
        if role not in ('staff', 'admin'):
            role = 'staff'
        if not login_val or not full_name or not password:
            return _err(400, 'Логин, ФИО и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.employees WHERE login=%s", (login_val,))
        if cur.fetchone():
            cur.close(); conn.close(); return _err(409, 'Логин уже занят')
        pw_hash = hash_pw(password)
        cur.execute(f"INSERT INTO {SCHEMA}.employees (full_name, login, password_hash, role) VALUES (%s,%s,%s,%s) RETURNING id",
                    (full_name, login_val, pw_hash, role))
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
        if 'role' in body and body['role'] in ('staff', 'admin'):
            if emp['role'] == 'owner':
                fields.append("role=%s"); values.append(body['role'])
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