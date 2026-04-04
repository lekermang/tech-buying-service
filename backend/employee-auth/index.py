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


def handler(event: dict, context) -> dict:
    """Авторизация сотрудников: вход по логину/паролю, смена пароля, получение профиля"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    # GET /profile
    if method == 'GET':
        if not emp_token:
            return _err(401, 'Требуется токен')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT id, full_name, login, role FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (emp_token,))
        row = cur.fetchone(); cur.close(); conn.close()
        if not row:
            return _err(401, 'Токен недействителен')
        return _ok({'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]})

    # POST /login
    if method == 'POST' and body.get('action') == 'login':
        login = body.get('login', '').strip()
        password = body.get('password', '').strip()
        if not login or not password:
            return _err(400, 'Логин и пароль обязательны')
        conn = get_conn(); cur = conn.cursor()
        pw_hash = hash_pw(password)
        cur.execute(f"SELECT id, full_name, role, password_hash FROM {SCHEMA}.employees WHERE login=%s AND is_active=true", (login,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close(); return _err(401, 'Неверный логин или пароль')
        emp_id, full_name, role, stored_hash = row
        # Первый вход — пароль CHANGE_ME меняем на любой
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

    # POST /create-employee (только admin)
    if method == 'POST' and body.get('action') == 'create':
        if not _is_admin(emp_token):
            return _err(403, 'Нет доступа')
        login = body.get('login', '').strip()
        full_name = body.get('full_name', '').strip()
        role = body.get('role', 'staff')
        if not login or not full_name:
            return _err(400, 'Логин и ФИО обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.employees (full_name, login, password_hash, role) VALUES (%s,%s,'CHANGE_ME',%s) RETURNING id",
                    (full_name, login, role))
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return _ok({'id': new_id, 'message': f'Сотрудник создан. Первый пароль задаётся при первом входе.'})

    return _err(404, 'Не найдено')


def _is_admin(token: str) -> bool:
    if not token:
        return False
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"SELECT role FROM t_p31606708_tech_buying_service.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (token,))
    row = cur.fetchone(); cur.close(); conn.close()
    return row and row[0] == 'admin'


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}

def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}
