"""
Public Chat — публичный чат Скупка24 LIVE.

Действия (?action=...):
  ── для клиентов (не требуют токена сотрудника) ──
  request_otp     — POST {phone}              → отправить код по SMS
  verify_otp      — POST {phone, code, name?} → проверить код, выдать auth_token
  invite_open     — POST {invite_token}       → войти по приглашению (без SMS)
  rooms           — GET  ?token=...           → список доступных комнат + непрочитанные
  poll            — POST {room_id, after_id, token (X-Pchat-Token хедер)} → новые сообщения
  send            — POST {room_id, text?, photo_url?} с X-Pchat-Token
  upload_photo    — POST {photo_b64} с X-Pchat-Token | X-Employee-Token
  mark_read       — POST {room_id, msg_id}

  ── для сотрудников (X-Employee-Token) ──
  staff_rooms     — GET  → список диалогов с клиентами + общий канал
  staff_send      — POST {room_id, text?, photo_url?}
  staff_poll      — POST {room_id, after_id}
  staff_unread    — GET  → суммарное число непрочитанных
  invite_create   — POST {phone, name?, lead_id?} → создать invite-token, отправить SMS клиенту
"""
import base64
import json
import os
import re
import secrets
import string
from datetime import datetime, timedelta

import boto3
import psycopg2
import psycopg2.extras
import requests

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Employee-Token, X-Pchat-Token',
    'Content-Type': 'application/json'
}
PUBLIC_ROOM_ID = 1
SITE_URL = os.environ.get('SITE_URL', 'https://skypka24.com')


def _ok(d, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(d, ensure_ascii=False, default=str)}


def _err(status, msg):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'ok': False, 'error': msg})}


def _esc(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _normalize_phone(phone):
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    return digits


def _gen_token(n=32):
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(n))


def _gen_code():
    return ''.join(secrets.choice(string.digits) for _ in range(4))


# ───────── SMS ─────────
def send_sms(phone, text):
    """Отправка SMS через sms.ru. Возвращает (ok, info_dict)."""
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        print('[SMS] SMSRU_API_ID is not set')
        return False, {'error': 'no_api_id'}
    digits = _normalize_phone(phone)
    if not digits or len(digits) < 11:
        print(f'[SMS] bad phone: {phone}')
        return False, {'error': 'bad_phone'}
    try:
        sender = os.environ.get('SMSRU_FROM', 'IPMamedov')
        r = requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': digits, 'msg': text, 'from': sender, 'json': 1},
            timeout=10,
        )
        try:
            d = r.json()
        except Exception:
            print(f'[SMS] non-json response: {r.text[:300]}')
            return False, {'error': 'non_json', 'raw': r.text[:300]}
        # sms.ru: status="OK" / status_code=100 — успех
        status = d.get('status')
        sms_obj = (d.get('sms') or {}).get(digits) or {}
        sms_status = sms_obj.get('status')
        sms_status_code = sms_obj.get('status_code')
        sms_status_text = sms_obj.get('status_text')
        ok = status == 'OK' and sms_status == 'OK'
        # Полный ответ возвращаем наружу — чтобы было видно в Network
        print(f'[SMS] to={digits} ok={ok} full_response={json.dumps(d, ensure_ascii=False)}')
        return ok, {
            'status': status,
            'status_code': d.get('status_code'),
            'status_text': d.get('status_text'),
            'sms_status': sms_status,
            'sms_status_code': sms_status_code,
            'sender': sender,
            'full_response': d,
            'sms_status_text': sms_status_text,
            'balance': d.get('balance'),
        }
    except Exception as e:
        print(f'[SMS] exception: {e}')
        return False, {'error': str(e)}


# ───────── Auth helpers ─────────
def get_client_by_token(token):
    if not token:
        return None
    try:
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT id, phone, display_name, is_blocked FROM {SCHEMA}.pchat_clients "
            f"WHERE auth_token={_esc(token)} LIMIT 1"
        )
        row = cur.fetchone()
        if row:
            cur.execute(
                f"UPDATE {SCHEMA}.pchat_clients SET last_seen_at=NOW() WHERE id={int(row['id'])}"
            )
            conn.commit()
        cur.close(); conn.close()
        return dict(row) if row else None
    except Exception:
        return None


def get_employee_by_token(token):
    if not token:
        return None
    try:
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT id, full_name, role, avatar_url, is_active FROM {SCHEMA}.employees "
            f"WHERE auth_token={_esc(token)} LIMIT 1"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row or not row.get('is_active'):
            return None
        return dict(row)
    except Exception:
        return None


def get_or_create_direct_room(client_id, client_name):
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.pchat_rooms WHERE type='direct' AND client_id={int(client_id)} LIMIT 1"
    )
    row = cur.fetchone()
    if row:
        rid = row[0]
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_rooms (type, title, client_id) "
            f"VALUES ('direct', {_esc('Диалог · ' + (client_name or ''))}, {int(client_id)}) RETURNING id"
        )
        rid = cur.fetchone()[0]
        # системное приветствие
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_messages (room_id, author_type, author_id, author_name, text, is_system) "
            f"VALUES ({rid}, 'system', 0, 'Скупка24', "
            f"{_esc('👋 Здравствуйте! Это личный чат с менеджером. Напишите ваш вопрос — ответим в течение нескольких минут.')}, TRUE)"
        )
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text='👋 Личный чат начат' WHERE id={rid}"
        )
    conn.commit(); cur.close(); conn.close()
    return rid


# ───────── Notifications to staff ─────────
def notify_staff_new_message(room_id, author_name, text, room_type):
    """Толкнуть в leads-monitor ленту? Для простоты пишем в Telegram-чат сотрудников"""
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    label = 'Общий канал' if room_type == 'public' else 'Личный диалог'
    snippet = (text or '📷 Фото')[:160]
    msg = f"💬 *{label} · {author_name}*\n{snippet}\n\n_Открыть в Staff: вкладка «Клиенты Live»_"
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': msg, 'parse_mode': 'Markdown'},
            timeout=8,
        )
    except Exception:
        pass


# ───────── ACTIONS: client auth ─────────
def action_request_otp(body):
    phone = _normalize_phone(body.get('phone') or '')
    if len(phone) != 11:
        return _err(400, 'Неверный номер')
    # rate-limit: не больше 3 SMS за 10 минут
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.pchat_otp "
        f"WHERE phone={_esc(phone)} AND created_at > NOW() - INTERVAL '10 minutes'"
    )
    if cur.fetchone()[0] >= 3:
        cur.close(); conn.close()
        return _err(429, 'Слишком много попыток. Попробуйте через 10 минут.')
    code = _gen_code()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_otp (phone, code, expires_at) "
        f"VALUES ({_esc(phone)}, {_esc(code)}, NOW() + INTERVAL '10 minutes')"
    )
    conn.commit(); cur.close(); conn.close()
    sent, info = send_sms(phone, f'Скупка24: код входа в чат — {code}')
    return _ok({'ok': True, 'sent': bool(sent), 'sms_info': info})


def action_verify_otp(body):
    phone = _normalize_phone(body.get('phone') or '')
    code = (body.get('code') or '').strip()
    name = (body.get('name') or '').strip() or None
    if len(phone) != 11 or len(code) != 4:
        return _err(400, 'Введите номер и 4-значный код')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, code, attempts, used, expires_at FROM {SCHEMA}.pchat_otp "
        f"WHERE phone={_esc(phone)} ORDER BY id DESC LIMIT 1"
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return _err(400, 'Сначала запросите код')
    if row['used'] or row['attempts'] >= 5 or row['expires_at'] < datetime.utcnow():
        cur.close(); conn.close()
        return _err(400, 'Код истёк или превышено число попыток')
    if str(row['code']) != code:
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_otp SET attempts=attempts+1 WHERE id={int(row['id'])}"
        )
        conn.commit(); cur.close(); conn.close()
        return _err(400, 'Неверный код')
    cur.execute(f"UPDATE {SCHEMA}.pchat_otp SET used=TRUE WHERE id={int(row['id'])}")
    # клиент: либо обновляем токен, либо создаём
    cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur2.execute(f"SELECT id, display_name FROM {SCHEMA}.pchat_clients WHERE phone={_esc(phone)} LIMIT 1")
    existing = cur2.fetchone()
    auth = _gen_token()
    if existing:
        cid = int(existing['id'])
        new_name = name or existing['display_name'] or 'Клиент'
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET auth_token={_esc(auth)}, display_name={_esc(new_name)}, "
            f"last_seen_at=NOW() WHERE id={cid}"
        )
    else:
        new_name = name or 'Клиент'
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at) "
            f"VALUES ({_esc(phone)}, {_esc(new_name)}, {_esc(auth)}, NOW()) RETURNING id"
        )
        cid = cur.fetchone()[0]
    conn.commit(); cur.close(); cur2.close(); conn.close()
    # Создадим личный диалог
    room_id = get_or_create_direct_room(cid, new_name)
    return _ok({'ok': True, 'token': auth, 'client_id': cid, 'name': new_name, 'direct_room_id': room_id})


def action_invite_open(body):
    invite_token = (body.get('invite_token') or '').strip()
    if not invite_token:
        return _err(400, 'invite_token required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.pchat_invites WHERE token={_esc(invite_token)} LIMIT 1"
    )
    inv = cur.fetchone()
    if not inv:
        cur.close(); conn.close()
        return _err(404, 'Приглашение не найдено')
    if inv['expires_at'] < datetime.utcnow():
        cur.close(); conn.close()
        return _err(400, 'Приглашение истекло')
    phone = _normalize_phone(inv['phone'])
    name = inv['name'] or 'Клиент'
    # клиент: либо обновляем токен, либо создаём
    cur.execute(f"SELECT id FROM {SCHEMA}.pchat_clients WHERE phone={_esc(phone)} LIMIT 1")
    existing = cur.fetchone()
    auth = _gen_token()
    if existing:
        cid = int(existing['id'])
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET auth_token={_esc(auth)}, display_name={_esc(name)}, "
            f"invite_lead_id={('NULL' if inv.get('lead_id') is None else int(inv['lead_id']))}, last_seen_at=NOW() WHERE id={cid}"
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at, invite_lead_id) "
            f"VALUES ({_esc(phone)}, {_esc(name)}, {_esc(auth)}, NOW(), "
            f"{('NULL' if inv.get('lead_id') is None else int(inv['lead_id']))}) RETURNING id"
        )
        cid = cur.fetchone()[0]
    cur.execute(f"UPDATE {SCHEMA}.pchat_invites SET used_at=NOW() WHERE id={int(inv['id'])}")
    conn.commit(); cur.close(); conn.close()
    room_id = get_or_create_direct_room(cid, name)
    return _ok({'ok': True, 'token': auth, 'client_id': cid, 'name': name, 'direct_room_id': room_id})


# ───────── ACTIONS: client rooms / poll / send ─────────
def action_client_rooms(qp):
    token = qp.get('token') or ''
    cli = get_client_by_token(token)
    if not cli:
        return _err(401, 'Auth required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    direct_id = get_or_create_direct_room(cli['id'], cli.get('display_name'))
    rooms = [
        {'id': PUBLIC_ROOM_ID, 'type': 'public', 'title': 'Скупка24 LIVE'},
        {'id': direct_id, 'type': 'direct', 'title': 'Менеджер Скупка24'},
    ]
    # подсчёт непрочитанных для каждой
    out = []
    for r in rooms:
        cur.execute(f"SELECT COALESCE(MAX(id),0) FROM {SCHEMA}.pchat_messages WHERE room_id={int(r['id'])}")
        max_id = cur.fetchone()[0] or 0
        cur.execute(
            f"SELECT last_read_msg_id FROM {SCHEMA}.pchat_reads "
            f"WHERE room_id={int(r['id'])} AND reader_type='client' AND reader_id={int(cli['id'])} LIMIT 1"
        )
        rr = cur.fetchone()
        last_read = rr['last_read_msg_id'] if rr else 0
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.pchat_messages "
            f"WHERE room_id={int(r['id'])} AND id > {int(last_read)} AND author_type <> 'client'"
        )
        unread = cur.fetchone()[0] or 0
        r['unread'] = int(unread)
        r['max_id'] = int(max_id)
        out.append(r)
    cur.close(); conn.close()
    return _ok({'ok': True, 'rooms': out, 'me': {'id': cli['id'], 'name': cli.get('display_name')}})


def action_poll(body, headers):
    token = headers.get('X-Pchat-Token') or headers.get('x-pchat-token') or body.get('token') or ''
    cli = get_client_by_token(token)
    if not cli:
        return _err(401, 'Auth required')
    room_id = int(body.get('room_id') or 0)
    after_id = int(body.get('after_id') or -1)
    limit = min(int(body.get('limit') or 50), 100)
    if not room_id:
        return _err(400, 'room_id required')
    # Проверка доступа: public — открыт всем клиентам; direct — только своя
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT type, client_id FROM {SCHEMA}.pchat_rooms WHERE id={room_id} LIMIT 1")
    r = cur.fetchone()
    if not r:
        cur.close(); conn.close(); return _err(404, 'Комната не найдена')
    if r['type'] == 'direct' and int(r['client_id'] or 0) != int(cli['id']):
        cur.close(); conn.close(); return _err(403, 'Forbidden')
    cur.execute(
        f"SELECT id, author_type, author_id, author_name, author_avatar, text, photo_url, is_system, created_at "
        f"FROM {SCHEMA}.pchat_messages WHERE room_id={room_id} AND id > {after_id} "
        f"ORDER BY id ASC LIMIT {limit}"
    )
    msgs = [dict(x) for x in cur.fetchall()]
    cur.execute(f"SELECT COALESCE(MAX(id),0) FROM {SCHEMA}.pchat_messages WHERE room_id={room_id}")
    max_id = int(cur.fetchone()[0] or 0)
    cur.close(); conn.close()
    return _ok({'ok': True, 'messages': msgs, 'max_id': max_id})


def action_send(body, headers):
    token = headers.get('X-Pchat-Token') or headers.get('x-pchat-token') or body.get('token') or ''
    cli = get_client_by_token(token)
    if not cli:
        return _err(401, 'Auth required')
    if cli.get('is_blocked'):
        return _err(403, 'Заблокирован')
    room_id = int(body.get('room_id') or 0)
    text = (body.get('text') or '').strip()
    photo_url = (body.get('photo_url') or '').strip() or None
    if not room_id or (not text and not photo_url):
        return _err(400, 'Empty')
    if len(text) > 2000:
        text = text[:2000]
    conn = _conn(); cur = conn.cursor()
    cur.execute(f"SELECT type, client_id FROM {SCHEMA}.pchat_rooms WHERE id={room_id} LIMIT 1")
    r = cur.fetchone()
    if not r:
        cur.close(); conn.close(); return _err(404, 'Комната не найдена')
    rtype = r[0]
    if rtype == 'direct' and int(r[1] or 0) != int(cli['id']):
        cur.close(); conn.close(); return _err(403, 'Forbidden')
    name = cli.get('display_name') or 'Клиент'
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_messages (room_id, author_type, author_id, author_name, text, photo_url) "
        f"VALUES ({room_id}, 'client', {int(cli['id'])}, {_esc(name)}, "
        f"{_esc(text) if text else 'NULL'}, {_esc(photo_url) if photo_url else 'NULL'}) RETURNING id"
    )
    mid = cur.fetchone()[0]
    snippet = (text or '📷 Фото')[:160]
    cur.execute(
        f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text={_esc(snippet)} WHERE id={room_id}"
    )
    conn.commit(); cur.close(); conn.close()
    notify_staff_new_message(room_id, name, text or '📷 Фото', rtype)
    return _ok({'ok': True, 'id': mid})


def action_mark_read(body, headers):
    token = headers.get('X-Pchat-Token') or headers.get('x-pchat-token') or body.get('token') or ''
    cli = get_client_by_token(token)
    if not cli:
        return _err(401, 'Auth required')
    room_id = int(body.get('room_id') or 0)
    msg_id = int(body.get('msg_id') or 0)
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_reads (room_id, reader_type, reader_id, last_read_msg_id, updated_at) "
        f"VALUES ({room_id}, 'client', {int(cli['id'])}, {msg_id}, NOW()) "
        f"ON CONFLICT (room_id, reader_type, reader_id) DO UPDATE SET "
        f"last_read_msg_id=GREATEST({SCHEMA}.pchat_reads.last_read_msg_id, EXCLUDED.last_read_msg_id), updated_at=NOW()"
    )
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True})


# ───────── ACTIONS: photo upload (S3) ─────────
def action_upload_photo(body, headers):
    # авторизация — либо клиент, либо сотрудник
    pchat_token = headers.get('X-Pchat-Token') or headers.get('x-pchat-token') or ''
    emp_token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''
    if not get_client_by_token(pchat_token) and not get_employee_by_token(emp_token):
        return _err(401, 'Auth required')
    photo_b64 = body.get('photo_b64') or body.get('photo')
    if not photo_b64:
        return _err(400, 'photo_b64 required')
    try:
        if ',' in photo_b64:
            photo_b64 = photo_b64.split(',', 1)[1]
        data = base64.b64decode(photo_b64)
        if len(data) > 8 * 1024 * 1024:
            return _err(413, 'Файл слишком большой (макс 8 MB)')
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        key = f'pchat/{datetime.utcnow().strftime("%Y/%m/%d")}/{_gen_token(16)}.jpg'
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType='image/jpeg')
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return _ok({'ok': True, 'url': url})
    except Exception as e:
        return _err(500, f'Upload error: {e}')


# ───────── ACTIONS: staff side ─────────
def action_staff_rooms(_qp, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # все комнаты с активностью
    cur.execute(
        f"SELECT r.id, r.type, r.title, r.client_id, r.last_message_at, r.last_message_text, "
        f"c.phone AS client_phone, c.display_name AS client_name, c.last_seen_at AS client_last_seen "
        f"FROM {SCHEMA}.pchat_rooms r "
        f"LEFT JOIN {SCHEMA}.pchat_clients c ON c.id=r.client_id "
        f"WHERE r.is_archived = FALSE "
        f"ORDER BY (r.type='public') DESC, r.last_message_at DESC NULLS LAST LIMIT 100"
    )
    rooms = [dict(x) for x in cur.fetchall()]
    # подсчёт непрочитанных для сотрудника по каждой
    out = []
    total_unread = 0
    for r in rooms:
        rid = int(r['id'])
        cur.execute(
            f"SELECT last_read_msg_id FROM {SCHEMA}.pchat_reads "
            f"WHERE room_id={rid} AND reader_type='employee' AND reader_id={int(emp['id'])} LIMIT 1"
        )
        rr = cur.fetchone()
        last_read = rr['last_read_msg_id'] if rr else 0
        cur.execute(
            f"SELECT COUNT(*) AS c FROM {SCHEMA}.pchat_messages "
            f"WHERE room_id={rid} AND id > {int(last_read)} AND author_type='client'"
        )
        unread = int(cur.fetchone()['c'] or 0)
        r['unread'] = unread
        total_unread += unread
        out.append(r)
    cur.close(); conn.close()
    return _ok({'ok': True, 'rooms': out, 'total_unread': total_unread,
                'me': {'id': emp['id'], 'name': emp['full_name'], 'role': emp['role']}})


def action_staff_poll(body, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    room_id = int(body.get('room_id') or 0)
    after_id = int(body.get('after_id') or -1)
    limit = min(int(body.get('limit') or 50), 100)
    if not room_id:
        return _err(400, 'room_id required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, author_type, author_id, author_name, author_avatar, text, photo_url, is_system, created_at "
        f"FROM {SCHEMA}.pchat_messages WHERE room_id={room_id} AND id > {after_id} "
        f"ORDER BY id ASC LIMIT {limit}"
    )
    msgs = [dict(x) for x in cur.fetchall()]
    cur.execute(f"SELECT COALESCE(MAX(id),0) AS m FROM {SCHEMA}.pchat_messages WHERE room_id={room_id}")
    max_id = int(cur.fetchone()['m'] or 0)
    cur.close(); conn.close()
    return _ok({'ok': True, 'messages': msgs, 'max_id': max_id})


def action_staff_send(body, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    room_id = int(body.get('room_id') or 0)
    text = (body.get('text') or '').strip()
    photo_url = (body.get('photo_url') or '').strip() or None
    if not room_id or (not text and not photo_url):
        return _err(400, 'Empty')
    if len(text) > 4000:
        text = text[:4000]
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_messages (room_id, author_type, author_id, author_name, author_avatar, text, photo_url) "
        f"VALUES ({room_id}, 'employee', {int(emp['id'])}, {_esc(emp['full_name'])}, {_esc(emp.get('avatar_url'))}, "
        f"{_esc(text) if text else 'NULL'}, {_esc(photo_url) if photo_url else 'NULL'}) RETURNING id"
    )
    mid = cur.fetchone()[0]
    snippet = (text or '📷 Фото')[:160]
    cur.execute(
        f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text={_esc(snippet)} WHERE id={room_id}"
    )
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True, 'id': mid})


def action_staff_mark_read(body, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    room_id = int(body.get('room_id') or 0)
    msg_id = int(body.get('msg_id') or 0)
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_reads (room_id, reader_type, reader_id, last_read_msg_id, updated_at) "
        f"VALUES ({room_id}, 'employee', {int(emp['id'])}, {msg_id}, NOW()) "
        f"ON CONFLICT (room_id, reader_type, reader_id) DO UPDATE SET "
        f"last_read_msg_id=GREATEST({SCHEMA}.pchat_reads.last_read_msg_id, EXCLUDED.last_read_msg_id), updated_at=NOW()"
    )
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True})


def action_staff_unread(_qp, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # все комнаты + last_read для сотрудника
    cur.execute(
        f"SELECT r.id FROM {SCHEMA}.pchat_rooms r WHERE r.is_archived = FALSE"
    )
    rooms = [int(x['id']) for x in cur.fetchall()]
    total = 0
    for rid in rooms:
        cur.execute(
            f"SELECT last_read_msg_id FROM {SCHEMA}.pchat_reads "
            f"WHERE room_id={rid} AND reader_type='employee' AND reader_id={int(emp['id'])} LIMIT 1"
        )
        rr = cur.fetchone()
        lr = int(rr['last_read_msg_id']) if rr else 0
        cur.execute(
            f"SELECT COUNT(*) c FROM {SCHEMA}.pchat_messages "
            f"WHERE room_id={rid} AND id > {lr} AND author_type='client'"
        )
        total += int(cur.fetchone()['c'] or 0)
    cur.close(); conn.close()
    return _ok({'ok': True, 'unread': total})


def action_invite_create(body, headers):
    emp = get_employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    phone = _normalize_phone(body.get('phone') or '')
    name = (body.get('name') or '').strip() or None
    lead_id = body.get('lead_id')
    if len(phone) != 11:
        return _err(400, 'Неверный номер')
    token = _gen_token(20)
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_invites (token, phone, name, lead_id, created_by_chat_id, expires_at) "
        f"VALUES ({_esc(token)}, {_esc(phone)}, {_esc(name)}, "
        f"{('NULL' if not lead_id else int(lead_id))}, {_esc(str(emp['id']))}, NOW() + INTERVAL '14 days')"
    )
    conn.commit(); cur.close(); conn.close()
    invite_url = f'{SITE_URL}/chat?invite={token}'
    sms_text = (
        f"Скупка24: ваш персональный чат с менеджером — {invite_url} "
        f"(вход без регистрации, ответим за минуту)"
    )
    sent, sms_info = send_sms(phone, sms_text)
    return _ok({'ok': True, 'invite_token': token, 'url': invite_url, 'sms_sent': bool(sent), 'sms_info': sms_info})


# ───────── Handler ─────────
def handler(event, context):
    """Публичный чат Скупка24 LIVE: SMS-вход для клиентов + диалоги/общий канал + интеграция со Staff."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}
    qp = event.get('queryStringParameters') or {}
    headers = event.get('headers') or {}
    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        body = {}
    action = (qp.get('action') or body.get('action') or '').strip()
    try:
        # клиентские
        if action == 'request_otp':   return action_request_otp(body)
        if action == 'verify_otp':    return action_verify_otp(body)
        if action == 'invite_open':   return action_invite_open(body)
        if action == 'rooms':         return action_client_rooms(qp)
        if action == 'poll':          return action_poll(body, headers)
        if action == 'send':          return action_send(body, headers)
        if action == 'mark_read':     return action_mark_read(body, headers)
        if action == 'upload_photo':  return action_upload_photo(body, headers)
        # сотрудники
        if action == 'staff_rooms':   return action_staff_rooms(qp, headers)
        if action == 'staff_poll':    return action_staff_poll(body, headers)
        if action == 'staff_send':    return action_staff_send(body, headers)
        if action == 'staff_mark_read': return action_staff_mark_read(body, headers)
        if action == 'staff_unread':  return action_staff_unread(qp, headers)
        if action == 'invite_create': return action_invite_create(body, headers)
        return _err(400, f'Unknown action: {action}')
    except Exception as e:
        return _err(500, f'{type(e).__name__}: {e}')