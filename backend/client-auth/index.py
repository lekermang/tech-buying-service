"""
Авторизация клиентов кабинета /client.
Действия (POST):
  - register: создать аккаунт (login + password + full_name + phone)
  - login   : войти по логину и паролю → выдать auth_token
  - me      : вернуть профиль по X-Client-Token
  - logout  : удалить токен
"""
import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Token',
}


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


def _resolve_client(event: dict):
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (hdrs.get('x-client-token') or '').strip()
    if not token:
        return None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, phone, email, login, avatar_url, discount_pct, loyalty_points "
            f"FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            'id': row[0], 'full_name': row[1], 'phone': row[2],
            'email': row[3], 'login': row[4], 'avatar_url': row[5],
            'discount_pct': row[6], 'loyalty_points': row[7],
        }
    finally:
        cur.close(); conn.close()


def handler(event: dict, context) -> dict:
    """Авторизация клиентов: регистрация, вход, профиль."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    action = (body.get('action') or '').strip()

    if action == 'register':
        return _register(body)
    if action == 'login':
        return _login(body)
    if action == 'me':
        me = _resolve_client(event)
        if not me:
            return _err('Unauthorized', 401)
        return _ok({'client': me})
    if action == 'logout':
        return _logout(event)
    if action == 'update_profile':
        return _update_profile(event, body)

    return _err(f'unknown action: {action}')


def _register(body):
    login = (body.get('login') or '').strip().lower()
    password = body.get('password') or ''
    full_name = (body.get('full_name') or '').strip()
    phone = _normalize_phone(body.get('phone') or '')
    email = (body.get('email') or '').strip() or None

    if len(login) < 3:
        return _err('Логин должен быть не короче 3 символов')
    if not all(c.isalnum() or c in '._-' for c in login):
        return _err('Логин: только латиница, цифры, . _ -')
    if len(password) < 6:
        return _err('Пароль не короче 6 символов')
    if len(full_name) < 2:
        return _err('Укажите имя и фамилию')
    if len(phone) < 10:
        return _err('Укажите корректный телефон')

    conn = _connect()
    cur = conn.cursor()
    try:
        # проверка занятости логина
        cur.execute(f"SELECT id FROM {SCHEMA}.clients WHERE LOWER(login)=%s", (login,))
        if cur.fetchone():
            return _err('Логин уже занят')

        # ищем существующего клиента по телефону
        cur.execute(f"SELECT id, login FROM {SCHEMA}.clients WHERE phone=%s LIMIT 1", (phone,))
        existing = cur.fetchone()

        token = secrets.token_hex(24)
        expires = datetime.now(timezone.utc) + timedelta(days=60)
        ph = _hash_pw(password)

        if existing:
            if existing[1]:
                return _err('На этот телефон уже зарегистрирован аккаунт. Войдите.')
            cid = existing[0]
            cur.execute(
                f"UPDATE {SCHEMA}.clients SET login=%s, password_hash=%s, full_name=%s, "
                f"email=COALESCE(%s, email), auth_token=%s, token_expires_at=%s, "
                f"last_login_at=NOW(), updated_at=NOW() WHERE id=%s",
                (login, ph, full_name, email, token, expires, cid)
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.clients "
                f"(full_name, phone, email, login, password_hash, auth_token, token_expires_at, last_login_at) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, NOW()) RETURNING id",
                (full_name, phone, email, login, ph, token, expires)
            )
            cid = cur.fetchone()[0]

        conn.commit()
        return _ok({'ok': True, 'token': token, 'client_id': cid})
    except Exception as e:
        conn.rollback()
        return _err(f'register failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _login(body):
    login_or_phone = (body.get('login') or '').strip().lower()
    password = body.get('password') or ''
    if not login_or_phone or not password:
        return _err('Введите логин и пароль')

    conn = _connect()
    cur = conn.cursor()
    try:
        ph = _hash_pw(password)
        cur.execute(
            f"SELECT id, full_name FROM {SCHEMA}.clients "
            f"WHERE (LOWER(login)=%s OR phone=%s) AND password_hash=%s LIMIT 1",
            (login_or_phone, _normalize_phone(login_or_phone), ph)
        )
        row = cur.fetchone()
        if not row:
            return _err('Неверный логин или пароль', 401)
        cid = row[0]
        token = secrets.token_hex(24)
        expires = datetime.now(timezone.utc) + timedelta(days=60)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET auth_token=%s, token_expires_at=%s, last_login_at=NOW() WHERE id=%s",
            (token, expires, cid)
        )
        conn.commit()
        return _ok({'ok': True, 'token': token, 'client_id': cid, 'full_name': row[1]})
    except Exception as e:
        conn.rollback()
        return _err(f'login failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _logout(event):
    me = _resolve_client(event)
    if not me:
        return _ok({'ok': True})
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.clients SET auth_token=NULL, token_expires_at=NULL WHERE id=%s", (me['id'],))
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        cur.close(); conn.close()
    return _ok({'ok': True})


def _update_profile(event, body):
    me = _resolve_client(event)
    if not me:
        return _err('Unauthorized', 401)
    full_name = (body.get('full_name') or me['full_name']).strip()
    email = (body.get('email') or '').strip() or None
    avatar_url = (body.get('avatar_url') or '').strip() or None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET full_name=%s, email=COALESCE(%s,email), "
            f"avatar_url=COALESCE(%s,avatar_url), updated_at=NOW() WHERE id=%s",
            (full_name, email, avatar_url, me['id'])
        )
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'update_profile failed: {e}', 500)
    finally:
        cur.close(); conn.close()
