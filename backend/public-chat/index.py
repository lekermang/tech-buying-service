"""
Public Chat — веб-чат на сайте skypka24.com.

Через эту функцию менеджеры общаются с клиентами в браузере.
Минимальный набор действий:

  POST /?action=create_invite   — сотрудник создаёт invite-ссылку для клиента
  POST /?action=auth            — клиент авторизуется по invite-токену или phone+code
  GET  /?action=room&room_id=N  — комната + последние 100 сообщений
  POST /?action=send            — отправить сообщение в комнату
  GET  /?action=poll&room_id&since=ID  — long-poll новых сообщений
  GET  /?action=staff_rooms     — список активных комнат для сотрудников

CORS: Access-Control-Allow-Origin: *
"""
import json
import os
import re
import base64
import secrets
from typing import Any

import psycopg2
import psycopg2.extras
import requests

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Admin-Token, X-Employee-Token',
}

INVITE_TTL_HOURS = 24
SITE_BASE = os.environ.get('PUBLIC_CHAT_SITE_BASE', 'https://skypka24.com')
MAX_BOT_URL = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'


# ─────────────────────────── helpers ────────────────────────────────

def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _ok(payload: dict, status: int = 200) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps(payload, ensure_ascii=False, default=str),
    }


def _err(status: int, message: str) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps({'ok': False, 'error': message}, ensure_ascii=False),
    }


def _esc(v: Any) -> str:
    if v is None:
        return 'NULL'
    s = str(v).replace("'", "''")
    return f"'{s}'"


def _gen_token(n: int = 32) -> str:
    return secrets.token_urlsafe(n)[:n]


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    return digits


def _lc_headers(event: dict) -> dict:
    return {str(k).lower(): v for k, v in (event.get('headers') or {}).items()}


# ─────────────────────────── auth ──────────────────────────────────

def auth_staff(event: dict) -> bool:
    """Проверка X-Admin-Token / X-Employee-Token. Совместима с repair-admin."""
    hdrs = _lc_headers(event)
    token = (hdrs.get('x-admin-token') or hdrs.get('x-employee-token') or '').strip()
    if not token:
        return False
    # ADMIN_TOKEN
    if token == os.environ.get('ADMIN_TOKEN', ''):
        return True
    # EMPLOYEE_TOKENS (env)
    emp_raw = os.environ.get('EMPLOYEE_TOKENS', '')
    if emp_raw and token in {t.strip() for t in emp_raw.split(',') if t.strip()}:
        return True
    # БД employees
    try:
        safe_token = token.replace("'", "''")
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees "
            f"WHERE auth_token='{safe_token}' AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        print(f'[auth_staff] token={token[:8]}... found={row is not None}')
        return row is not None
    except Exception as e:
        print(f'[auth_staff] error: {e}')
        return False


def get_staff_info(event: dict) -> dict:
    """Возвращает имя сотрудника по токену (либо 'Менеджер')."""
    hdrs = _lc_headers(event)
    token = (hdrs.get('x-admin-token') or hdrs.get('x-employee-token') or '').strip()
    name = 'Менеджер'
    sid = 0
    if not token:
        return {'id': 0, 'name': name}
    try:
        safe_token = token.replace("'", "''")
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id, full_name FROM {SCHEMA}.employees "
            f"WHERE auth_token='{safe_token}' AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if row:
            return {'id': int(row[0]), 'name': row[1] or name}
    except Exception:
        pass
    return {'id': sid, 'name': name}


def auth_client(event: dict):
    """Возвращает dict клиента по X-Auth-Token либо None."""
    hdrs = _lc_headers(event)
    token = (hdrs.get('x-auth-token') or '').strip()
    if not token:
        return None
    try:
        safe_token = token.replace("'", "''")
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT id, phone, display_name, auth_token, is_blocked "
            f"FROM {SCHEMA}.pchat_clients WHERE auth_token='{safe_token}' LIMIT 1"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row or row.get('is_blocked'):
            return None
        return dict(row)
    except Exception:
        return None


# ─────────────────────────── DB ────────────────────────────────────

def _get_or_create_client(phone: str, name: str = '') -> dict:
    """Найти/создать pchat_clients по телефону. Возвращает dict с id, phone, display_name, auth_token."""
    digits = _normalize_phone(phone)
    if not digits or len(digits) < 11:
        raise ValueError('bad_phone')
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, phone, display_name, auth_token FROM {SCHEMA}.pchat_clients WHERE phone=%s LIMIT 1",
        (digits,)
    )
    row = cur.fetchone()
    if row:
        # Обновим имя если пустое
        if name and not row.get('display_name'):
            cur.execute(
                f"UPDATE {SCHEMA}.pchat_clients SET display_name=%s WHERE id=%s",
                (name, row['id'])
            )
            conn.commit()
            row['display_name'] = name
        cur.close(); conn.close()
        return dict(row)
    # создаём
    auth_token = _gen_token(40)
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, auth_method) "
        f"VALUES (%s, %s, %s, 'invite') RETURNING id, phone, display_name, auth_token",
        (digits, name or None, auth_token)
    )
    row = cur.fetchone()
    conn.commit(); cur.close(); conn.close()
    return dict(row)


def _get_or_create_direct_room(client_id: int, client_name: str = '') -> int:
    """Найти direct-комнату клиента или создать."""
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.pchat_rooms WHERE client_id=%s AND type='direct' "
        f"ORDER BY id ASC LIMIT 1",
        (client_id,)
    )
    row = cur.fetchone()
    if row:
        rid = int(row[0])
        cur.close(); conn.close()
        return rid
    title = client_name or f'Клиент #{client_id}'
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_rooms (type, title, client_id) "
        f"VALUES ('direct', %s, %s) RETURNING id",
        (title, client_id)
    )
    rid = int(cur.fetchone()[0])
    conn.commit(); cur.close(); conn.close()
    return rid


def _ensure_room_for_client(client_id: int) -> int:
    """Гарантирует наличие direct-комнаты для клиента."""
    return _get_or_create_direct_room(client_id)


def _post_message(room_id: int, author_type: str, author_id: int, author_name: str,
                  text: str, is_system: bool = False, photo_url: str = None) -> dict:
    """INSERT в pchat_messages + обновление last_message_at у комнаты."""
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_messages "
        f"(room_id, author_type, author_id, author_name, text, photo_url, is_system) "
        f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
        (room_id, author_type, author_id, author_name, text, photo_url, is_system)
    )
    row = cur.fetchone()
    preview = (text or '').strip()
    if not preview and photo_url:
        preview = '📷 Фото'
    cur.execute(
        f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text=%s WHERE id=%s",
        (preview[:500], room_id)
    )
    conn.commit(); cur.close(); conn.close()
    return dict(row)


def _upload_chat_photo(b64: str, mime: str = 'image/jpeg') -> str:
    """Сохраняет фото в S3, возвращает CDN-URL."""
    import boto3
    from botocore.client import Config as BotoConfig
    try:
        data = base64.b64decode(b64)
    except Exception:
        raise ValueError('bad_base64')
    if len(data) > 12 * 1024 * 1024:
        raise ValueError('too_big')
    ext_map = {'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
               'image/webp': 'webp', 'image/heic': 'heic'}
    ext = ext_map.get(mime.lower(), 'jpg')
    key = f'chat/{secrets.token_hex(12)}.{ext}'
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


# ─────────────────────── notification helpers ───────────────────────

def _notify_max_client(phone: str, text: str):
    """Дублировать сообщение клиенту в MAX (если он привязан)."""
    try:
        requests.post(
            f'{MAX_BOT_URL}?action=send',
            json={'phone': phone, 'text': text},
            timeout=5,
        )
    except Exception as e:
        print(f'[public-chat][MAX-send] {e}')


MAX_STAFF_GROUP = 'https://max.ru/join/snbnTleb0RnsMQ-yXZ4tuuXJfDPM6liEP2ktT8zoIeE'
MAX_API_URL = 'https://botapi.max.ru'
SITE_CHAT_URL = 'https://skypka24.com/staff'


def _notify_max_staff_group(text: str, site_link: str = ''):
    """Уведомление в MAX-группу команды через бот."""
    bot_token = os.environ.get('MAX_BOT_TOKEN', '')
    group_chat_id = os.environ.get('MAX_STAFF_CHAT_ID', '')
    if not bot_token or not group_chat_id:
        print(f'[public-chat][max-staff] no token or chat_id, skipping')
        return
    try:
        chat_id_int = int(group_chat_id)
    except Exception:
        print(f'[public-chat][max-staff] bad chat_id: {group_chat_id}')
        return
    payload = {'chat_id': chat_id_int, 'text': text}
    if site_link:
        payload['attachments'] = [{'type': 'inline_keyboard', 'payload': {'buttons': [[
            {'type': 'link', 'url': site_link, 'text': '💬 Ответить в панели'}
        ]]}}]
    try:
        resp = requests.post(
            f'{MAX_API_URL}/messages',
            params={'chat_id': chat_id_int},
            json=payload,
            headers={'Authorization': bot_token, 'Content-Type': 'application/json'},
            timeout=6,
        )
        print(f'[public-chat][max-staff] status={resp.status_code} body={resp.text[:300]}')
    except Exception as e:
        print(f'[public-chat][max-staff] error: {e}')


def _notify_telegram_staff(text: str):
    """Уведомление сотрудников в основной TG-чат."""
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
            timeout=5,
        )
    except Exception:
        try:
            requests.post(
                f'https://api.telegram.org/bot{token}/sendMessage',
                json={'chat_id': chat_id, 'text': text},
                timeout=5,
            )
        except Exception:
            pass


def _max_chat_id_by_phone(phone: str):
    """Получаем max_chat_id клиента (если есть) — для проверки, нужно ли дублировать в MAX."""
    try:
        conn = _conn(); cur = conn.cursor()
        # max_chat_id хранится в pchat_clients (по миграциям). Проверим существование колонки безопасно.
        cur.execute(
            f"SELECT column_name FROM information_schema.columns "
            f"WHERE table_schema='{SCHEMA}' AND table_name='pchat_clients' "
            f"AND column_name IN ('max_chat_id','max_user_id')"
        )
        cols = {r[0] for r in cur.fetchall()}
        if 'max_chat_id' in cols:
            cur.execute(f"SELECT max_chat_id FROM {SCHEMA}.pchat_clients WHERE phone=%s", (phone,))
            r = cur.fetchone()
            cur.close(); conn.close()
            return r[0] if r and r[0] else None
        if 'max_user_id' in cols:
            cur.execute(f"SELECT max_user_id FROM {SCHEMA}.pchat_clients WHERE phone=%s", (phone,))
            r = cur.fetchone()
            cur.close(); conn.close()
            return r[0] if r and r[0] else None
        cur.close(); conn.close()
    except Exception:
        pass
    return None


# ─────────────────────────── actions ────────────────────────────────

def action_create_invite(event, body):
    if not auth_staff(event):
        return _err(401, 'Auth required')
    phone = (body.get('phone') or '').strip()
    name = (body.get('name') or '').strip()
    lead_id = body.get('lead_id')
    repair_order_id = body.get('repair_order_id')
    device = (body.get('device') or '').strip()
    digits = _normalize_phone(phone)
    if len(digits) < 11:
        return _err(400, 'Bad phone')

    staff = get_staff_info(event)
    try:
        client = _get_or_create_client(digits, name)
        room_id = _get_or_create_direct_room(client['id'], name or client.get('display_name') or '')
    except ValueError:
        return _err(400, 'Bad phone')

    token = _gen_token(32)
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_invites "
        f"(token, phone, name, lead_id, created_by_chat_id, expires_at) "
        f"VALUES (%s, %s, %s, %s, %s, NOW() + INTERVAL '{INVITE_TTL_HOURS} hours')",
        (token, digits, name or None,
         int(lead_id) if lead_id else None,
         str(staff.get('id') or '') or None)
    )
    conn.commit()

    # Системное сообщение в комнату
    sys_text = f'🔗 Менеджер {staff["name"]} пригласил клиента в чат'
    if device:
        sys_text += f' (устройство: {device})'
    if repair_order_id:
        sys_text += f' [ремонт #{repair_order_id}]'
    if lead_id:
        sys_text += f' [заявка #{lead_id}]'
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_messages "
        f"(room_id, author_type, author_id, author_name, text, is_system) "
        f"VALUES (%s, 'system', 0, 'Система', %s, TRUE)",
        (room_id, sys_text)
    )
    conn.commit(); cur.close(); conn.close()

    invite_url = f'{SITE_BASE}/chat?inv={token}'
    return _ok({
        'ok': True,
        'invite_url': invite_url,
        'client_id': client['id'],
        'room_id': room_id,
        'token': token,
        'expires_in_hours': INVITE_TTL_HOURS,
    })


def action_auth(event, body):
    token = (body.get('token') or '').strip()
    phone = (body.get('phone') or '').strip()
    code = (body.get('code') or '').strip()
    if token:
        return _auth_by_invite(token)
    if phone and code:
        return _auth_by_otp(phone, code)
    return _err(400, 'token or (phone, code) required')


def _auth_by_invite(token: str):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, token, phone, name, lead_id, used_at, expires_at "
        f"FROM {SCHEMA}.pchat_invites WHERE token=%s LIMIT 1",
        (token,)
    )
    inv = cur.fetchone()
    if not inv:
        cur.close(); conn.close()
        return _err(404, 'Invite not found')
    # used_at не блокирует — клиент может зайти повторно по той же ссылке
    from datetime import datetime
    exp = inv.get('expires_at')
    if exp:
        try:
            now = datetime.now(exp.tzinfo) if getattr(exp, 'tzinfo', None) else datetime.utcnow()
            if exp < now:
                cur.close(); conn.close()
                return _err(410, 'Invite expired')
        except Exception:
            pass

    phone = inv['phone']
    name = inv.get('name') or ''
    cur.close(); conn.close()

    try:
        client = _get_or_create_client(phone, name)
    except ValueError:
        return _err(400, 'Bad phone in invite')

    room_id = _get_or_create_direct_room(client['id'], name or client.get('display_name') or '')

    # помечаем invite использованным (если ещё не)
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_invites SET used_at=COALESCE(used_at, NOW()) WHERE token=%s",
            (token,)
        )
        conn.commit(); cur.close(); conn.close()
    except Exception:
        pass

    return _ok({
        'ok': True,
        'client': {'id': client['id'], 'name': client.get('display_name') or '', 'phone': client['phone']},
        'room_id': room_id,
        'auth_token': client['auth_token'],
    })


def _auth_by_otp(phone: str, code: str):
    """Простая проверка OTP — если код найден в pchat_otp, не использован, не истёк."""
    digits = _normalize_phone(phone)
    if len(digits) < 11:
        return _err(400, 'Bad phone')
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, code, used, expires_at FROM {SCHEMA}.pchat_otp "
        f"WHERE phone=%s ORDER BY id DESC LIMIT 1",
        (digits,)
    )
    r = cur.fetchone()
    if not r:
        cur.close(); conn.close()
        return _err(404, 'No OTP issued')
    if r['used'] or r['code'] != code:
        cur.close(); conn.close()
        return _err(403, 'Invalid code')
    from datetime import datetime
    if r['expires_at'] and r['expires_at'] < datetime.utcnow():
        cur.close(); conn.close()
        return _err(410, 'Code expired')
    cur.execute(f"UPDATE {SCHEMA}.pchat_otp SET used=TRUE WHERE id=%s", (r['id'],))
    conn.commit(); cur.close(); conn.close()
    try:
        client = _get_or_create_client(digits, '')
    except ValueError:
        return _err(400, 'Bad phone')
    room_id = _get_or_create_direct_room(client['id'])
    return _ok({
        'ok': True,
        'client': {'id': client['id'], 'name': client.get('display_name') or '', 'phone': client['phone']},
        'room_id': room_id,
        'auth_token': client['auth_token'],
    })


def action_room(event, qp):
    room_id_raw = qp.get('room_id')
    try:
        room_id = int(room_id_raw or 0)
    except Exception:
        return _err(400, 'Bad room_id')
    if not room_id:
        return _err(400, 'room_id required')

    is_staff = auth_staff(event)
    client = None if is_staff else auth_client(event)
    if not is_staff and not client:
        return _err(401, 'Auth required')

    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, type, title, client_id, last_message_at, last_message_text, is_archived, created_at "
        f"FROM {SCHEMA}.pchat_rooms WHERE id=%s LIMIT 1",
        (room_id,)
    )
    room = cur.fetchone()
    if not room:
        cur.close(); conn.close()
        return _err(404, 'Room not found')
    if not is_staff and room.get('client_id') != client['id']:
        cur.close(); conn.close()
        return _err(403, 'Forbidden')

    cur.execute(
        f"SELECT id, author_type, author_id, author_name, text, photo_url, is_system, created_at "
        f"FROM {SCHEMA}.pchat_messages WHERE room_id=%s ORDER BY id DESC LIMIT 100",
        (room_id,)
    )
    msgs = [dict(r) for r in cur.fetchall()][::-1]

    client_row = None
    if room.get('client_id'):
        cur.execute(
            f"SELECT id, phone, display_name, last_seen_at FROM {SCHEMA}.pchat_clients WHERE id=%s",
            (room['client_id'],)
        )
        c = cur.fetchone()
        if c:
            client_row = dict(c)

    cur.close(); conn.close()
    return _ok({
        'ok': True,
        'room': dict(room),
        'messages': msgs,
        'client': client_row,
    })


def action_send(event, body):
    is_staff = auth_staff(event)
    client = None if is_staff else auth_client(event)
    if not is_staff and not client:
        return _err(401, 'Auth required')
    try:
        room_id = int(body.get('room_id') or 0)
    except Exception:
        return _err(400, 'Bad room_id')
    text = (body.get('text') or '').strip()
    photo_b64 = (body.get('photo_base64') or '').strip()
    photo_mime = (body.get('photo_mime') or 'image/jpeg').strip()
    if not room_id:
        return _err(400, 'room_id required')
    if not text and not photo_b64:
        return _err(400, 'text or photo_base64 required')

    photo_url = None
    if photo_b64:
        try:
            photo_url = _upload_chat_photo(photo_b64, photo_mime)
        except ValueError as ve:
            return _err(400, f'photo: {ve}')
        except Exception as e:
            return _err(500, f'photo upload failed: {e}')

    # Проверка доступа
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, client_id, type, title FROM {SCHEMA}.pchat_rooms WHERE id=%s LIMIT 1",
        (room_id,)
    )
    room = cur.fetchone()
    if not room:
        cur.close(); conn.close()
        return _err(404, 'Room not found')
    if not is_staff and room.get('client_id') != client['id']:
        cur.close(); conn.close()
        return _err(403, 'Forbidden')

    # client_phone (для дублирования)
    client_phone = None
    client_name = ''
    if room.get('client_id'):
        cur.execute(
            f"SELECT phone, display_name FROM {SCHEMA}.pchat_clients WHERE id=%s",
            (room['client_id'],)
        )
        c = cur.fetchone()
        if c:
            client_phone = c['phone']
            client_name = c.get('display_name') or ''
    cur.close(); conn.close()

    if is_staff:
        staff = get_staff_info(event)
        author_type = 'staff'
        author_id = staff['id']
        author_name = staff['name']
    else:
        author_type = 'client'
        author_id = client['id']
        author_name = client.get('display_name') or client['phone']

    msg = _post_message(room_id, author_type, author_id, author_name, text, photo_url=photo_url)

    # Дублирование
    try:
        if author_type == 'staff' and client_phone:
            max_id = _max_chat_id_by_phone(client_phone)
            if max_id:
                _notify_max_client(client_phone, f'💬 *{author_name}*:\n{text}')
        elif author_type == 'client':
            msg_preview = text[:1000] if text else ('📷 Фото' if photo_url else '—')
            tg_text = (
                f'💬 *Новое сообщение в чате*\n\n'
                f'👤 {client_name or client_phone or "клиент"}\n'
                f'📞 {client_phone or "—"}\n'
                f'🗨 {msg_preview}\n\n'
                f'_Комната #{room_id}_'
            )
            _notify_telegram_staff(tg_text)
            max_text = (
                f'💬 Новое сообщение в чате с сайта\n'
                f'👤 {client_name or "клиент"} · {client_phone or ""}\n'
                f'🗨 {msg_preview}\n\n'
                f'_Чтобы ответить напишите: >{room_id} текст_'
            )
            _notify_max_staff_group(max_text, f'{SITE_CHAT_URL}?tab=sitechat#room-{room_id}')
    except Exception as e:
        print(f'[public-chat][notify] {e}')

    return _ok({
        'ok': True,
        'message_id': msg['id'],
        'created_at': msg['created_at'],
    })


def action_poll(event, qp):
    is_staff = auth_staff(event)
    client = None if is_staff else auth_client(event)
    if not is_staff and not client:
        return _err(401, 'Auth required')
    try:
        room_id = int(qp.get('room_id') or 0)
        since = int(qp.get('since') or 0)
    except Exception:
        return _err(400, 'Bad params')
    if not room_id:
        return _err(400, 'room_id required')

    # Проверим доступ
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, client_id FROM {SCHEMA}.pchat_rooms WHERE id=%s LIMIT 1",
        (room_id,)
    )
    room = cur.fetchone()
    if not room:
        cur.close(); conn.close()
        return _err(404, 'Room not found')
    if not is_staff and room.get('client_id') != client['id']:
        cur.close(); conn.close()
        return _err(403, 'Forbidden')

    cur.execute(
        f"SELECT id, author_type, author_id, author_name, text, photo_url, is_system, created_at "
        f"FROM {SCHEMA}.pchat_messages WHERE room_id=%s AND id > %s "
        f"ORDER BY id ASC LIMIT 200",
        (room_id, since)
    )
    msgs = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'ok': True, 'messages': msgs})


def action_register(body: dict):
    """Самостоятельная регистрация клиента по имени и телефону — без инвайта от менеджера."""
    phone = (body.get('phone') or '').strip()
    name = (body.get('name') or '').strip()
    if not phone or not name:
        return _err(400, 'phone and name required')
    try:
        client = _get_or_create_client(phone, name)
    except ValueError:
        return _err(400, 'Неверный номер телефона')
    room_id = _get_or_create_direct_room(client['id'], name or client.get('display_name') or '')
    # Системное сообщение — только для новых комнат (если нет сообщений)
    conn = _conn(); cur = conn.cursor()
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.pchat_messages WHERE room_id=%s", (room_id,))
    count = cur.fetchone()[0]
    if count == 0:
        sys_text = f'💬 {name} начал чат с сайта'
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_messages "
            f"(room_id, author_type, author_id, author_name, text, is_system) "
            f"VALUES (%s, 'system', 0, 'Система', %s, TRUE)",
            (room_id, sys_text)
        )
        conn.commit()
        # Автоответ вне рабочих часов (10:00–22:00 МСК = UTC+3)
        from datetime import datetime, timezone, timedelta
        msk = datetime.now(timezone(timedelta(hours=3)))
        is_off_hours = msk.hour < 10 or msk.hour >= 22
        if is_off_hours:
            auto_text = (
                f'Здравствуйте, {name}! 👋\n\n'
                f'Наши менеджеры работают с 10:00 до 22:00 по московскому времени.\n'
                f'Мы увидим ваше сообщение и ответим, как только откроемся.\n\n'
                f'Срочно? Звоните: 8 (800) 600-68-33 (бесплатно) или +7 (992) 999-03-33'
            )
            cur.execute(
                f"INSERT INTO {SCHEMA}.pchat_messages "
                f"(room_id, author_type, author_id, author_name, text, is_system) "
                f"VALUES (%s, 'staff', 0, 'Скупка24', %s, FALSE)",
                (room_id, auto_text)
            )
            conn.commit()
        notify_text = f'💬 Новый чат с сайта\nКлиент: {name}\nТелефон: +{_normalize_phone(phone)}'
        _notify_telegram_staff(notify_text)
        _notify_max_staff_group(
            f'🆕 Новый клиент в чате с сайта\n👤 {name} · +{_normalize_phone(phone)}',
            f'{SITE_CHAT_URL}?tab=sitechat#room-{room_id}'
        )
    cur.close(); conn.close()
    return _ok({
        'ok': True,
        'auth_token': client['auth_token'],
        'room_id': room_id,
        'client': {'name': client.get('display_name') or name},
    })


def action_staff_rooms(event):
    if not auth_staff(event):
        return _err(401, 'Auth required')
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT r.id, r.type, r.title, r.client_id, r.last_message_at, r.last_message_text, "
        f"c.phone AS client_phone, c.display_name AS client_name, "
        f"(SELECT COUNT(*) FROM {SCHEMA}.pchat_messages m "
        f" WHERE m.room_id=r.id AND m.author_type='client' "
        f" AND m.id > COALESCE(("
        f"   SELECT MAX(last_read_msg_id) FROM {SCHEMA}.pchat_reads pr "
        f"   WHERE pr.room_id=r.id AND pr.reader_type='staff'"
        f" ), 0)"
        f") AS unread_count "
        f"FROM {SCHEMA}.pchat_rooms r "
        f"LEFT JOIN {SCHEMA}.pchat_clients c ON c.id=r.client_id "
        f"WHERE r.type='direct' AND r.is_archived=FALSE "
        f"ORDER BY r.last_message_at DESC NULLS LAST, r.id DESC LIMIT 200"
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'ok': True, 'rooms': rows})


# ─────────────────────────── handler ────────────────────────────────

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    qp = event.get('queryStringParameters') or {}
    action = (qp.get('action') or '').strip()
    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        body = {}

    try:
        if method == 'POST' and action == 'create_invite':
            return action_create_invite(event, body)
        if method == 'POST' and action == 'auth':
            return action_auth(event, body)
        if method == 'POST' and action == 'register':
            return action_register(body)
        if method == 'GET' and action == 'room':
            return action_room(event, qp)
        if method == 'POST' and action == 'send':
            return action_send(event, body)
        if method == 'GET' and action == 'poll':
            return action_poll(event, qp)
        if method == 'GET' and action == 'staff_rooms':
            return action_staff_rooms(event)
        return _err(400, f'Unknown action: {action} (method={method})')
    except Exception as e:
        return _err(500, f'{type(e).__name__}: {e}')