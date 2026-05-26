"""
Авторизация клиентов кабинета /client по email + паролю.
Действия (POST):
  - register        : регистрация (email, password, full_name, phone) → отправляет письмо с подтверждением
  - login           : вход по email + паролю
  - me              : профиль по X-Client-Token
  - logout          : выход
  - update_profile  : смена ФИО, email, аватара
  - verify_email    : подтвердить email по токену из письма
  - resend_verify   : повторно отправить письмо с подтверждением
  - request_reset   : запрос на сброс пароля (письмо с ссылкой)
  - reset_password  : установить новый пароль по токену
  - change_password : смена пароля (нужен X-Client-Token + старый пароль)
"""
import os
import json
import hashlib
import secrets
import smtplib
import ssl
import re
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
SITE_BASE = 'https://skypka24.ru'
SMTP_FROM = 'lekermany@yandex.ru'
SMTP_FROM_NAME = 'Скупка 24'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Token',
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


def _resolve_client(event: dict):
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (hdrs.get('x-client-token') or '').strip()
    if not token:
        return None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, phone, email, email_verified, avatar_url, discount_pct, loyalty_points, "
            f"birth_date, passport_series, passport_number, passport_issued, "
            f"delivery_name, delivery_phone, delivery_city, delivery_address, delivery_postal "
            f"FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            'id': row[0], 'full_name': row[1], 'phone': row[2],
            'email': row[3], 'email_verified': row[4],
            'avatar_url': row[5], 'discount_pct': row[6], 'loyalty_points': row[7],
            'birth_date': str(row[8]) if row[8] else None,
            'passport_series': row[9], 'passport_number': row[10], 'passport_issued': row[11],
            'delivery_name': row[12], 'delivery_phone': row[13],
            'delivery_city': row[14], 'delivery_address': row[15], 'delivery_postal': row[16],
        }
    finally:
        cur.close(); conn.close()


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    pw = os.environ.get('YANDEX_SMTP_PASSWORD', '').strip()
    if not pw:
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = formataddr((SMTP_FROM_NAME, SMTP_FROM))
        msg['To'] = to_email
        msg.attach(MIMEText(html_body, 'html', 'utf-8'))
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465, context=ctx, timeout=12) as srv:
            srv.login(SMTP_FROM, pw)
            srv.sendmail(SMTP_FROM, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f'SMTP error: {e}')
        return False


def _email_template(title: str, intro: str, button_text: str, button_url: str, footer: str = '') -> str:
    return f"""<!doctype html>
<html><body style="margin:0;padding:0;background:#0A0A0A;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#0F0F0F;color:#fff;">
  <div style="text-align:center;margin-bottom:24px;">
    <div style="font-size:24px;font-weight:bold;color:#FFD700;letter-spacing:2px;">СКУПКА 24</div>
    <div style="font-size:11px;color:#777;letter-spacing:1px;text-transform:uppercase;margin-top:4px;">Личный кабинет клиента</div>
  </div>
  <h1 style="color:#FFD700;font-size:22px;margin:0 0 16px 0;">{title}</h1>
  <p style="color:#cfcfcf;font-size:15px;line-height:1.6;margin:0 0 24px 0;">{intro}</p>
  <div style="text-align:center;margin:32px 0;">
    <a href="{button_url}" style="display:inline-block;background:#FFD700;color:#000;padding:14px 32px;text-decoration:none;font-weight:bold;font-size:15px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">{button_text}</a>
  </div>
  <p style="color:#777;font-size:12px;line-height:1.5;margin:24px 0 0 0;">Если кнопка не работает, открой ссылку:<br/><span style="color:#FFD700;word-break:break-all;">{button_url}</span></p>
  {f'<p style="color:#666;font-size:12px;line-height:1.5;margin-top:24px;">{footer}</p>' if footer else ''}
  <hr style="border:none;border-top:1px solid #1F1F1F;margin:32px 0 16px 0;"/>
  <p style="color:#555;font-size:11px;text-align:center;margin:0;">© Скупка 24 · Калуга · ул. Кирова 11, 7/47<br/>+7 (992) 999-03-33 · skypka24.ru</p>
</div>
</body></html>"""


def handler(event: dict, context) -> dict:
    """Авторизация клиентов: email+пароль, верификация, сброс."""
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
        return _ok(me)
    if action == 'logout':
        return _logout(event)
    if action == 'update_profile':
        return _update_profile(event, body)
    if action == 'verify_email':
        return _verify_email(body)
    if action == 'resend_verify':
        return _resend_verify(event)
    if action == 'request_reset':
        return _request_reset(body)
    if action == 'reset_password':
        return _reset_password(body)
    if action == 'change_password':
        return _change_password(event, body)

    return _err(f'unknown action: {action}')


def _register(body):
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    full_name = (body.get('full_name') or '').strip()
    phone = _normalize_phone(body.get('phone') or '')

    if not EMAIL_RE.match(email):
        return _err('Введите корректный email')
    if len(password) < 6:
        return _err('Пароль не короче 6 символов')
    if len(full_name) < 2:
        return _err('Укажите имя и фамилию')
    if len(phone) < 10:
        return _err('Укажите корректный телефон')

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, password_hash FROM {SCHEMA}.clients WHERE LOWER(email)=%s LIMIT 1", (email,))
        existed = cur.fetchone()
        if existed and existed[1]:
            return _err('На этот email уже зарегистрирован аккаунт. Войдите.')

        # Ищем клиента по телефону — если есть, привязываем email и пароль
        cur.execute(f"SELECT id FROM {SCHEMA}.clients WHERE phone=%s LIMIT 1", (phone,))
        by_phone = cur.fetchone()

        token = secrets.token_hex(24)
        expires = datetime.now(timezone.utc) + timedelta(days=60)
        ph = _hash_pw(password)
        verify_token = secrets.token_urlsafe(32)

        if existed:
            cid = existed[0]
            cur.execute(
                f"UPDATE {SCHEMA}.clients SET email=%s, password_hash=%s, full_name=%s, phone=%s, "
                f"auth_token=%s, token_expires_at=%s, email_verify_token=%s, email_verify_sent_at=NOW(), "
                f"last_login_at=NOW(), updated_at=NOW() WHERE id=%s",
                (email, ph, full_name, phone, token, expires, verify_token, cid)
            )
        elif by_phone:
            cid = by_phone[0]
            cur.execute(
                f"UPDATE {SCHEMA}.clients SET email=%s, password_hash=%s, full_name=%s, "
                f"auth_token=%s, token_expires_at=%s, email_verify_token=%s, email_verify_sent_at=NOW(), "
                f"last_login_at=NOW(), updated_at=NOW() WHERE id=%s",
                (email, ph, full_name, token, expires, verify_token, cid)
            )
        else:
            cur.execute(
                f"INSERT INTO {SCHEMA}.clients "
                f"(full_name, phone, email, password_hash, auth_token, token_expires_at, "
                f"email_verify_token, email_verify_sent_at, last_login_at) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW()) RETURNING id",
                (full_name, phone, email, ph, token, expires, verify_token)
            )
            cid = cur.fetchone()[0]
        conn.commit()

        # Письмо с подтверждением
        verify_url = f"{SITE_BASE}/client?verify={verify_token}"
        html = _email_template(
            title=f"Привет, {full_name.split()[0]}!",
            intro=f"Спасибо за регистрацию в личном кабинете Скупка 24. Подтверди свой email, чтобы получать уведомления о ремонтах, залогах и предложениях.",
            button_text='Подтвердить email',
            button_url=verify_url,
            footer='Ты получил это письмо, потому что зарегистрировался в кабинете на skypka24.ru. Если это не ты — просто проигнорируй письмо.',
        )
        _send_email(email, 'Скупка 24 · Подтвердите email', html)

        return _ok({'ok': True, 'token': token, 'client_id': cid, 'email_sent': True})
    except Exception as e:
        conn.rollback()
        return _err(f'register failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _login(body):
    email = (body.get('email') or body.get('login') or '').strip().lower()
    password = body.get('password') or ''
    if not email or not password:
        return _err('Введите email и пароль')

    conn = _connect()
    cur = conn.cursor()
    try:
        ph = _hash_pw(password)
        cur.execute(
            f"SELECT id, full_name, email_verified FROM {SCHEMA}.clients "
            f"WHERE LOWER(email)=%s AND password_hash=%s LIMIT 1",
            (email, ph)
        )
        row = cur.fetchone()
        if not row:
            return _err('Неверный email или пароль', 401)
        cid, full_name, verified = row
        token = secrets.token_hex(24)
        expires = datetime.now(timezone.utc) + timedelta(days=60)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET auth_token=%s, token_expires_at=%s, last_login_at=NOW() WHERE id=%s",
            (token, expires, cid)
        )
        conn.commit()
        return _ok({'ok': True, 'token': token, 'client_id': cid, 'full_name': full_name, 'email_verified': verified})
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
    full_name = (body.get('full_name') or me['full_name'] or '').strip()
    avatar_url = (body.get('avatar_url') or '').strip() or None

    birth_date = (body.get('birth_date') or '').strip() or None
    passport_series = (body.get('passport_series') or '').strip() or None
    passport_number = (body.get('passport_number') or '').strip() or None
    passport_issued = (body.get('passport_issued') or '').strip() or None

    delivery_name = (body.get('delivery_name') or '').strip() or None
    delivery_phone_raw = _normalize_phone(body.get('delivery_phone') or '')
    delivery_phone = delivery_phone_raw if len(delivery_phone_raw) >= 10 else ((body.get('delivery_phone') or '').strip() or None)
    delivery_city = (body.get('delivery_city') or '').strip() or None
    delivery_address = (body.get('delivery_address') or '').strip() or None
    delivery_postal = (body.get('delivery_postal') or '').strip() or None

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET full_name=%s, "
            f"avatar_url=COALESCE(%s,avatar_url), "
            f"birth_date=%s, passport_series=%s, passport_number=%s, passport_issued=%s, "
            f"delivery_name=%s, delivery_phone=%s, delivery_city=%s, delivery_address=%s, delivery_postal=%s, "
            f"updated_at=NOW() WHERE id=%s",
            (full_name, avatar_url,
             birth_date, passport_series, passport_number, passport_issued,
             delivery_name, delivery_phone, delivery_city, delivery_address, delivery_postal,
             me['id'])
        )
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'update_profile failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _verify_email(body):
    token = (body.get('token') or '').strip()
    if not token:
        return _err('Токен не указан')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET email_verified=TRUE, email_verify_token=NULL "
            f"WHERE email_verify_token=%s RETURNING id, email",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return _err('Ссылка недействительна или email уже подтверждён')
        conn.commit()
        return _ok({'ok': True, 'email': row[1]})
    except Exception as e:
        conn.rollback()
        return _err(f'verify failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _resend_verify(event):
    me = _resolve_client(event)
    if not me:
        return _err('Unauthorized', 401)
    if me.get('email_verified'):
        return _ok({'ok': True, 'already_verified': True})
    if not me.get('email'):
        return _err('У аккаунта нет email')
    conn = _connect()
    cur = conn.cursor()
    try:
        verify_token = secrets.token_urlsafe(32)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET email_verify_token=%s, email_verify_sent_at=NOW() WHERE id=%s",
            (verify_token, me['id'])
        )
        conn.commit()
        verify_url = f"{SITE_BASE}/client?verify={verify_token}"
        html = _email_template(
            title='Подтверди email',
            intro=f"Чтобы получать важные уведомления, подтверди свой email.",
            button_text='Подтвердить email',
            button_url=verify_url,
        )
        sent = _send_email(me['email'], 'Скупка 24 · Подтвердите email', html)
        return _ok({'ok': True, 'sent': sent})
    except Exception as e:
        conn.rollback()
        return _err(f'resend failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _request_reset(body):
    email = (body.get('email') or '').strip().lower()
    if not EMAIL_RE.match(email):
        return _err('Введите корректный email')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT id, full_name FROM {SCHEMA}.clients WHERE LOWER(email)=%s LIMIT 1", (email,))
        row = cur.fetchone()
        # Не раскрываем существование аккаунта
        if not row:
            return _ok({'ok': True})
        cid, name = row
        reset_token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=2)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET password_reset_token=%s, password_reset_expires=%s WHERE id=%s",
            (reset_token, expires, cid)
        )
        conn.commit()
        reset_url = f"{SITE_BASE}/client?reset={reset_token}"
        html = _email_template(
            title='Сброс пароля',
            intro=f"{name.split()[0] if name else 'Привет'}, ты запросил восстановление пароля от кабинета Скупка 24. Нажми на кнопку и придумай новый пароль. Ссылка действует 2 часа.",
            button_text='Сбросить пароль',
            button_url=reset_url,
            footer='Если ты не запрашивал сброс пароля — просто проигнорируй это письмо. Твой текущий пароль останется в силе.',
        )
        _send_email(email, 'Скупка 24 · Сброс пароля', html)
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'request_reset failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _reset_password(body):
    token = (body.get('token') or '').strip()
    password = body.get('password') or ''
    if not token:
        return _err('Токен не указан')
    if len(password) < 6:
        return _err('Пароль не короче 6 символов')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id FROM {SCHEMA}.clients WHERE password_reset_token=%s AND password_reset_expires>NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return _err('Ссылка устарела или недействительна')
        cid = row[0]
        ph = _hash_pw(password)
        new_token = secrets.token_hex(24)
        expires = datetime.now(timezone.utc) + timedelta(days=60)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET password_hash=%s, password_reset_token=NULL, "
            f"password_reset_expires=NULL, auth_token=%s, token_expires_at=%s, "
            f"last_login_at=NOW(), updated_at=NOW() WHERE id=%s",
            (ph, new_token, expires, cid)
        )
        conn.commit()
        return _ok({'ok': True, 'token': new_token})
    except Exception as e:
        conn.rollback()
        return _err(f'reset failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _change_password(event, body):
    me = _resolve_client(event)
    if not me:
        return _err('Unauthorized', 401)
    old = body.get('old_password') or ''
    new = body.get('new_password') or ''
    if len(new) < 6:
        return _err('Новый пароль не короче 6 символов')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"SELECT password_hash FROM {SCHEMA}.clients WHERE id=%s", (me['id'],))
        row = cur.fetchone()
        if not row or row[0] != _hash_pw(old):
            return _err('Старый пароль неверен', 401)
        cur.execute(
            f"UPDATE {SCHEMA}.clients SET password_hash=%s, updated_at=NOW() WHERE id=%s",
            (_hash_pw(new), me['id'])
        )
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'change_password failed: {e}', 500)
    finally:
        cur.close(); conn.close()