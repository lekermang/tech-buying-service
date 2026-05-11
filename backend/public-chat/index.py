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
def _try_send_sms(api_id, digits, text, sender):
    """Один попытка отправить SMS через sms.ru. Возвращает (ok, response_dict)."""
    params = {'api_id': api_id, 'to': digits, 'msg': text, 'json': 1}
    if sender:
        params['from'] = sender
    r = requests.get('https://sms.ru/sms/send', params=params, timeout=10)
    try:
        d = r.json()
    except Exception:
        return False, {'error': 'non_json', 'raw': r.text[:300]}
    sms_obj = (d.get('sms') or {}).get(digits) or {}
    ok = d.get('status') == 'OK' and sms_obj.get('status') == 'OK'
    return ok, d


def send_sms(phone, text):
    """Отправка SMS через sms.ru с fallback. Возвращает (ok, info_dict)."""
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        print('[SMS] SMSRU_API_ID is not set')
        return False, {'error': 'no_api_id'}
    digits = _normalize_phone(phone)
    if not digits or len(digits) < 11:
        print(f'[SMS] bad phone: {phone}')
        return False, {'error': 'bad_phone'}
    try:
        # Список отправителей с fallback: пробуем по очереди
        # 1) одобренный бренд из секрета (или дефолтный IPMamedov)
        # 2) пустое имя — sms.ru сам выберет
        # 3) системное "sms_ru" — почти всегда работает
        primary = os.environ.get('SMSRU_FROM', 'IPMamedov')
        senders_to_try = [primary, '', 'sms_ru']
        attempts = []
        last_d = None
        for sender in senders_to_try:
            ok, d = _try_send_sms(api_id, digits, text, sender)
            last_d = d
            sms_obj = (d.get('sms') or {}).get(digits) or {}
            sms_status_text = sms_obj.get('status_text', '')
            attempts.append({
                'sender': sender or '(default)',
                'ok': ok,
                'status_text': sms_status_text,
                'status_code': sms_obj.get('status_code'),
            })
            print(f'[SMS] try sender="{sender}" to={digits} ok={ok} status_text="{sms_status_text}"')
            if ok:
                return True, {
                    'sent_with': sender or '(default)',
                    'attempts': attempts,
                    'balance': d.get('balance'),
                }
            # Если ошибка не "оператор не подключен" — нет смысла пробовать другие имена
            if 'оператор' not in (sms_status_text or '').lower() and 'отправитель' not in (sms_status_text or '').lower():
                # Прочая ошибка (баланс, лимит, чёрный список) — выходим
                break
        return False, {
            'attempts': attempts,
            'last_response': last_d,
            'balance': (last_d or {}).get('balance'),
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
    try:
        conn = _conn(); cur = conn.cursor()
        cli_id = int(cli['id'])
        # Простой режим: всем клиентам — только общий канал «Скупка24 LIVE».
        # Считаем max_id и непрочитанные для общего канала.
        cur.execute(f"SELECT COALESCE(MAX(id),0) FROM {SCHEMA}.pchat_messages WHERE room_id={PUBLIC_ROOM_ID}")
        max_id = int(cur.fetchone()[0] or 0)
        cur.execute(
            f"SELECT last_read_msg_id FROM {SCHEMA}.pchat_reads "
            f"WHERE room_id={PUBLIC_ROOM_ID} AND reader_type='client' AND reader_id={cli_id} LIMIT 1"
        )
        rr = cur.fetchone()
        last_read = int(rr[0]) if rr else 0
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.pchat_messages "
            f"WHERE room_id={PUBLIC_ROOM_ID} AND id > {last_read} AND author_type <> 'client'"
        )
        unread = int(cur.fetchone()[0] or 0)
        cur.close(); conn.close()
        rooms = [{
            'id': PUBLIC_ROOM_ID,
            'type': 'public',
            'title': 'Скупка24 LIVE',
            'max_id': max_id,
            'unread': unread,
        }]
        return _ok({
            'ok': True,
            'rooms': rooms,
            'me': {'id': cli_id, 'name': cli.get('display_name') or 'Клиент'},
        })
    except Exception as e:
        import traceback
        print(f'[ROOMS] error: {e}\n{traceback.format_exc()}')
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
            'ok': False, 'error': f'Не удалось загрузить комнаты: {type(e).__name__}: {e}',
        }, ensure_ascii=False)}


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
        f"SELECT m.id, m.author_type, m.author_id, m.author_name, m.author_avatar, "
        f"m.text, m.photo_url, m.is_system, m.created_at, "
        f"CASE WHEN m.author_type='client' "
        f"AND c.phone IS NOT NULL "
        f"AND c.phone NOT LIKE 'guest:%' "
        f"AND c.phone NOT LIKE 'tg:%' "
        f"THEN c.phone ELSE NULL END AS author_phone "
        f"FROM {SCHEMA}.pchat_messages m "
        f"LEFT JOIN {SCHEMA}.pchat_clients c "
        f"  ON c.id = m.author_id AND m.author_type='client' "
        f"WHERE m.room_id={room_id} AND m.id > {after_id} "
        f"ORDER BY m.id ASC LIMIT {limit}"
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
    # Читаем MAX-ссылку из настроек (если задана — добавим в SMS и вернём фронту)
    max_invite_link = ''
    try:
        c2 = conn.cursor()
        c2.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='max_invite_link' LIMIT 1")
        rr2 = c2.fetchone()
        if rr2 and rr2[0]:
            max_invite_link = str(rr2[0]).strip()
        c2.close()
    except Exception:
        pass
    conn.commit(); cur.close(); conn.close()
    invite_url = f'{SITE_URL}/chat?invite={token}'
    max_part = f" Или MAX: {max_invite_link}" if max_invite_link else ''
    sms_text = (
        f"Скупка24: ваш персональный чат с менеджером — {invite_url}"
        f"{max_part} (вход без регистрации, ответим за минуту)"
    )
    sent, sms_info = send_sms(phone, sms_text)
    # Параллельно пробуем отправить через Telegram (если у клиента уже был tg_id) и WhatsApp-ссылку
    tg_sent = False
    try:
        digits = _normalize_phone(phone)
        cn = _conn(); cu = cn.cursor()
        cu.execute(f"SELECT telegram_id FROM {SCHEMA}.pchat_clients WHERE phone={_esc(digits)} AND telegram_id IS NOT NULL LIMIT 1")
        rr = cu.fetchone()
        cu.close(); cn.close()
        if rr and rr[0]:
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            if bot_token:
                requests.post(
                    f'https://api.telegram.org/bot{bot_token}/sendMessage',
                    json={'chat_id': rr[0],
                          'text': f"💬 Скупка24: вас приглашают в персональный чат с менеджером.\nОткройте: {invite_url}",
                          'disable_web_page_preview': False},
                    timeout=8,
                )
                tg_sent = True
    except Exception:
        pass
    digits = _normalize_phone(phone)
    wa_url = f'https://wa.me/{digits}?text=' + requests.utils.quote(
        f"Здравствуйте! Это Скупка24. Ваш персональный чат с менеджером: {invite_url}"
    )
    # MAX: если у компании есть публичная ссылка — отдаём её, иначе фолбек — диплинк по номеру.
    max_url = max_invite_link if max_invite_link else f'max://u/+{digits}'
    return _ok({
        'ok': True,
        'invite_token': token,
        'url': invite_url,
        'sms_sent': bool(sent), 'sms_info': sms_info,
        'tg_sent': tg_sent,
        'wa_url': wa_url,
        'max_url': max_url,
        'max_invite_link': max_invite_link,
    })


# ═══════════════════ TELEGRAM LOGIN WIDGET ═══════════════════
import hashlib
import hmac as hmac_module


def _verify_tg_widget(payload: dict, bot_token: str) -> bool:
    """Проверка подписи Telegram Login Widget по HMAC-SHA256 от bot_token."""
    auth_hash = payload.get('hash')
    if not auth_hash or not bot_token:
        return False
    data_check = '\n'.join(
        f'{k}={v}' for k, v in sorted(payload.items()) if k != 'hash' and v is not None
    )
    secret = hashlib.sha256(bot_token.encode()).digest()
    calc_hash = hmac_module.new(secret, data_check.encode(), hashlib.sha256).hexdigest()
    return hmac_module.compare_digest(calc_hash, auth_hash)


def action_verify_telegram(body):
    """Вход через Telegram Login Widget. Принимает: id, first_name, last_name?, username?, photo_url?, auth_date, hash."""
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        return _err(500, 'TELEGRAM_BOT_TOKEN not configured')
    payload = body.get('tg') or body
    if not _verify_tg_widget(payload, bot_token):
        return _err(401, 'Telegram signature invalid')
    try:
        auth_date = int(payload.get('auth_date') or 0)
    except Exception:
        auth_date = 0
    if not auth_date or (datetime.utcnow().timestamp() - auth_date) > 86400:
        return _err(401, 'Auth-data слишком старая')
    tg_id = int(payload.get('id') or 0)
    first = (payload.get('first_name') or '').strip()
    last = (payload.get('last_name') or '').strip()
    username = (payload.get('username') or '').strip() or None
    photo = (payload.get('photo_url') or '').strip() or None
    name = (first + ' ' + last).strip() or username or 'Клиент TG'
    if not tg_id:
        return _err(400, 'No tg id')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT id, phone FROM {SCHEMA}.pchat_clients WHERE telegram_id={tg_id} LIMIT 1")
    existing = cur.fetchone()
    auth = _gen_token()
    if existing:
        cid = int(existing['id'])
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET auth_token={_esc(auth)}, display_name={_esc(name)}, "
            f"telegram_username={_esc(username)}, avatar_url={_esc(photo)}, "
            f"auth_method='telegram', last_seen_at=NOW() WHERE id={cid}"
        )
    else:
        # Используем псевдо-телефон вида tg:<id>, чтобы соблюсти NOT NULL
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at, "
            f"telegram_id, telegram_username, avatar_url, auth_method) "
            f"VALUES ({_esc('tg:' + str(tg_id))}, {_esc(name)}, {_esc(auth)}, NOW(), "
            f"{tg_id}, {_esc(username)}, {_esc(photo)}, 'telegram') RETURNING id"
        )
        cid = cur.fetchone()['id']
    conn.commit(); cur.close(); conn.close()
    room_id = get_or_create_direct_room(cid, name)
    return _ok({'ok': True, 'token': auth, 'client_id': cid, 'name': name, 'direct_room_id': room_id, 'method': 'telegram'})


# ═══════════════════ TELEGRAM-БОТ КОД ═══════════════════
def action_bot_request_code(body):
    """Генерируем короткий код, клиент жмёт на ссылку t.me/botname?start=<code>, бот пишет ему /start с этим кодом."""
    bot_username = os.environ.get('TELEGRAM_BOT_USERNAME', '')
    if not bot_username:
        return _err(500, 'TELEGRAM_BOT_USERNAME not configured')
    name = (body.get('name') or '').strip() or None
    code = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(10))
    conn = _conn(); cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_bot_pending (code, intended_name, expires_at) "
        f"VALUES ({_esc(code)}, {_esc(name)}, NOW() + INTERVAL '15 minutes')"
    )
    conn.commit(); cur.close(); conn.close()
    return _ok({
        'ok': True,
        'code': code,
        'deep_link': f'https://t.me/{bot_username}?start={code}',
    })


def action_bot_check(body):
    """Polling: клиент опрашивает — нажал он /start в боте или нет. Если used=TRUE — выдаём auth_token."""
    code = (body.get('code') or '').strip()
    if not code:
        return _err(400, 'code required')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.pchat_bot_pending WHERE code={_esc(code)} LIMIT 1"
    )
    p = cur.fetchone()
    if not p:
        cur.close(); conn.close(); return _err(404, 'not found')
    if p['expires_at'] < datetime.utcnow():
        cur.close(); conn.close(); return _err(410, 'expired')
    if not p['used'] or not p['auth_token']:
        cur.close(); conn.close()
        return _ok({'ok': True, 'used': False})
    # Готов
    cur.execute(f"SELECT id, display_name FROM {SCHEMA}.pchat_clients WHERE auth_token={_esc(p['auth_token'])} LIMIT 1")
    cli = cur.fetchone()
    cur.close(); conn.close()
    if not cli:
        return _err(500, 'client not found')
    rid = get_or_create_direct_room(int(cli['id']), cli['display_name'])
    return _ok({'ok': True, 'used': True, 'token': p['auth_token'], 'name': cli['display_name'], 'client_id': cli['id'], 'direct_room_id': rid, 'method': 'tg_bot'})


def action_tg_webhook(body):
    """Webhook от Telegram: ловим /start <code> и привязываем телеграм-юзера к pending-коду."""
    msg = body.get('message') or body.get('edited_message') or {}
    text = (msg.get('text') or '').strip()
    if not text.startswith('/start'):
        return _ok({'ok': True})
    parts = text.split(maxsplit=1)
    if len(parts) < 2:
        # Простой /start без параметра — обычное приветствие
        chat_id = (msg.get('chat') or {}).get('id')
        if chat_id:
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            if bot_token:
                try:
                    requests.post(
                        f'https://api.telegram.org/bot{bot_token}/sendMessage',
                        json={'chat_id': chat_id, 'text': '👋 Я бот Скупка24. Чтобы войти в чат с менеджером — откройте https://skypka24.com/chat и выберите «Войти через Telegram».'},
                        timeout=8,
                    )
                except Exception:
                    pass
        return _ok({'ok': True})
    code = parts[1].strip()
    user = msg.get('from') or {}
    tg_id = int(user.get('id') or 0)
    first = (user.get('first_name') or '').strip()
    last = (user.get('last_name') or '').strip()
    username = (user.get('username') or '').strip() or None
    name = (first + ' ' + last).strip() or username or 'Клиент TG'
    if not tg_id:
        return _ok({'ok': True})
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.pchat_bot_pending WHERE code={_esc(code)} AND used=FALSE LIMIT 1"
    )
    p = cur.fetchone()
    if not p or p['expires_at'] < datetime.utcnow():
        cur.close(); conn.close()
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        if bot_token:
            try:
                requests.post(
                    f'https://api.telegram.org/bot{bot_token}/sendMessage',
                    json={'chat_id': tg_id, 'text': '⚠️ Код неверный или устарел. Запросите новый на skypka24.com/chat.'},
                    timeout=8,
                )
            except Exception:
                pass
        return _ok({'ok': True})
    use_name = (p['intended_name'] or name).strip() or 'Клиент TG'
    # Создаём/обновляем клиента
    cur.execute(f"SELECT id FROM {SCHEMA}.pchat_clients WHERE telegram_id={tg_id} LIMIT 1")
    existing = cur.fetchone()
    auth = _gen_token()
    if existing:
        cid = int(existing['id'])
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET auth_token={_esc(auth)}, display_name={_esc(use_name)}, "
            f"telegram_username={_esc(username)}, auth_method='tg_bot', last_seen_at=NOW() WHERE id={cid}"
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at, "
            f"telegram_id, telegram_username, auth_method) "
            f"VALUES ({_esc('tg:' + str(tg_id))}, {_esc(use_name)}, {_esc(auth)}, NOW(), "
            f"{tg_id}, {_esc(username)}, 'tg_bot') RETURNING id"
        )
        cid = cur.fetchone()['id']
    cur.execute(
        f"UPDATE {SCHEMA}.pchat_bot_pending SET used=TRUE, auth_token={_esc(auth)}, telegram_id={tg_id} "
        f"WHERE id={int(p['id'])}"
    )
    conn.commit(); cur.close(); conn.close()
    # Подтверждение клиенту в TG
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if bot_token:
        try:
            requests.post(
                f'https://api.telegram.org/bot{bot_token}/sendMessage',
                json={'chat_id': tg_id, 'text': f'✅ Готово, {use_name}! Возвращайтесь на сайт — вы автоматически войдёте в чат.'},
                timeout=8,
            )
        except Exception:
            pass
    return _ok({'ok': True})


# ═══════════════════ ГОСТЕВОЙ ВХОД ═══════════════════
def action_guest_login(body):
    """Лёгкий вход — имя + телефон, без OTP. Доступ только к общему каналу.
    Если клиент с таким телефоном уже был — обновляем имя и выдаём новый токен."""
    name = (body.get('name') or '').strip()
    phone_raw = (body.get('phone') or '').strip()
    if not name or len(name) < 2:
        return _err(400, 'Имя обязательно')
    if len(name) > 40:
        name = name[:40]

    # нормализуем телефон до +7XXXXXXXXXX (11 цифр)
    digits = ''.join(ch for ch in phone_raw if ch.isdigit())
    if digits.startswith('8'):
        digits = '7' + digits[1:]
    if len(digits) != 11 or not digits.startswith('7'):
        return _err(400, 'Введите телефон полностью (11 цифр)')
    phone = '+' + digits

    auth = _gen_token()
    conn = _conn(); cur = conn.cursor()
    # UPSERT по телефону: если уже есть — обновляем имя/токен/метку времени
    cur.execute(
        f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at, "
        f"is_guest, auth_method) "
        f"VALUES ({_esc(phone)}, {_esc(name)}, {_esc(auth)}, NOW(), TRUE, 'guest') "
        f"ON CONFLICT (phone) DO UPDATE SET "
        f"display_name=EXCLUDED.display_name, auth_token=EXCLUDED.auth_token, "
        f"last_seen_at=NOW(), is_blocked=FALSE "
        f"RETURNING id"
    )
    cid = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True, 'token': auth, 'client_id': cid, 'name': name,
                'phone': phone, 'method': 'guest', 'guest_only': True})


# ═══════════════════ ZVONOK.COM (звонок-пароль) ═══════════════════
def action_zvonok_request(body):
    """Заказывает звонок клиенту через Zvonok.com. Клиент вводит ПОСЛЕДНИЕ 4 ЦИФРЫ номера, с которого был звонок."""
    pub_key = os.environ.get('ZVONOK_PUBLIC_KEY', '')
    # Ищем Campaign ID в любом из заведённых секретов (приоритет: специальный OTP → LEAD → общий)
    campaign_id = (os.environ.get('ZVONOK_CAMPAIGN_OTP', '')
                   or os.environ.get('ZVONOK_CAMPAIGN_ID', '')
                   or os.environ.get('ZVONOK_CAMPAIGN_LEAD', ''))
    if not pub_key:
        return _err(500, 'Zvonok: не задан ZVONOK_PUBLIC_KEY')
    if not campaign_id:
        return _err(500, 'Zvonok: не задан Campaign ID')
    phone = _normalize_phone(body.get('phone') or '')
    if len(phone) != 11:
        return _err(400, 'Неверный номер')

    conn = None; cur = None
    try:
        conn = _conn(); cur = conn.cursor()
        # Rate-limit: не больше 3 за 10 минут
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.pchat_zvonok WHERE phone={_esc(phone)} "
            f"AND created_at > NOW() - INTERVAL '10 minutes'"
        )
        if cur.fetchone()[0] >= 3:
            return _err(429, 'Слишком много попыток. Попробуйте через 10 минут.')

        # Делаем вызов Zvonok (короткий таймаут, чтобы успеть в 30 сек лимит лямбды)
        try:
            r = requests.get(
                'https://zvonok.com/manager/cabapi_external/api/v1/phones/call/',
                params={
                    'public_key': pub_key,
                    'campaign_id': str(campaign_id),
                    'phone': '+' + phone,
                },
                timeout=10,
            )
        except requests.exceptions.Timeout:
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
                'ok': False, 'error': 'Zvonok не ответил за 10 сек (timeout)',
            }, ensure_ascii=False)}
        except Exception as req_err:
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
                'ok': False, 'error': f'Не удалось связаться со Zvonok: {req_err}',
            }, ensure_ascii=False)}
        d = {}
        try:
            d = r.json() if r.text else {}
        except Exception:
            d = {'raw': r.text[:300]}
        print(f'[ZVONOK REQUEST] phone={phone} campaign={campaign_id} status={r.status_code} resp={d}')

        # Извлекаем call_id и pincode (если кампания их возвращает)
        call_id = ''
        pincode = ''
        try:
            call_id = str(d.get('call_id') or d.get('id') or '')[:128]
            pincode = str(d.get('pincode') or d.get('pin') or '')[:32]
        except Exception:
            pass

        # Сохраняем запись (даже если Zvonok вернул ошибку — для отладки)
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.pchat_zvonok (phone, pincode, call_id, expires_at) "
                f"VALUES ({_esc(phone)}, {_esc(pincode)}, {_esc(call_id)}, NOW() + INTERVAL '10 minutes')"
            )
            conn.commit()
        except Exception as ie:
            print(f'[ZVONOK REQUEST] insert error: {ie}')

        # Если Zvonok вернул ошибку — переводим её в понятный текст для клиента
        if r.status_code != 200:
            raw_err = str(d.get('error') or d.get('message') or d.get('data') or d.get('raw') or f'HTTP {r.status_code}')
            err_lower = raw_err.lower()
            if 'duplicate' in err_lower:
                user_msg = 'Звонок уже запрошен. Дождитесь звонка или попробуйте через 5 минут.'
            elif 'audio' in err_lower or 'clip' in err_lower:
                user_msg = 'Сервис временно недоступен (нет аудио). Попробуйте другой способ входа.'
            elif 'balance' in err_lower or 'недостаточно' in err_lower:
                user_msg = 'Сервис временно недоступен. Попробуйте позже.'
            elif 'campaign' in err_lower:
                user_msg = 'Сервис настраивается. Попробуйте через минуту.'
            else:
                user_msg = f'Не удалось позвонить: {raw_err[:150]}'
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
                'ok': False, 'error': user_msg, 'zvonok_error': raw_err[:300],
            }, ensure_ascii=False)}

        return _ok({'ok': True, 'pin_known': bool(pincode), 'call_id': call_id, 'response': d})
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f'[ZVONOK REQUEST] exception: {e}\n{tb}')
        # Возвращаем 200 с подробной ошибкой, чтобы её точно увидел фронт
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
            'ok': False,
            'error': f'Ошибка вызова Zvonok: {type(e).__name__}: {e}',
            'traceback': tb[:1500],
        }, ensure_ascii=False)}
    finally:
        try:
            if cur: cur.close()
            if conn: conn.close()
        except Exception:
            pass


def action_zvonok_verify(body):
    """Проверяет код, введённый клиентом. Если pincode у нас сохранён — сравниваем; иначе — берём последние 4 цифры из caller-id (call_id ответа Zvonok)."""
    phone = _normalize_phone(body.get('phone') or '')
    code = (body.get('code') or '').strip()
    name = (body.get('name') or '').strip() or None
    if len(phone) != 11 or len(code) < 4:
        return _err(400, 'Введите номер и код')
    conn = _conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.pchat_zvonok WHERE phone={_esc(phone)} AND used=FALSE "
        f"AND expires_at > NOW() ORDER BY id DESC LIMIT 1"
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return _err(400, 'Сначала запросите звонок')
    if row['attempts'] >= 5:
        cur.close(); conn.close()
        return _err(400, 'Превышено число попыток')
    expected = (row.get('pincode') or '').strip()
    # Если pincode у нас есть — сравниваем. Иначе пробуем тянуть caller_id из API Zvonok
    ok = False
    if expected and expected == code:
        ok = True
    else:
        # Возможно клиент ввёл последние 4 цифры — попытаемся узнать у Zvonok caller_number
        try:
            pub_key = os.environ.get('ZVONOK_PUBLIC_KEY', '')
            call_id = row.get('call_id')
            if pub_key and call_id:
                r = requests.get(
                    'https://zvonok.com/manager/cabapi_external/api/v1/phones/calls/',
                    params={'public_key': pub_key, 'call_id': call_id},
                    timeout=10,
                )
                d = r.json() if r.ok else {}
                caller = str(d.get('caller_number') or d.get('caller_id') or d.get('phone_from') or '')
                last4 = re.sub(r'\D', '', caller)[-4:] if caller else ''
                if last4 and last4 == code:
                    ok = True
        except Exception:
            pass
    if not ok:
        cur.execute(f"UPDATE {SCHEMA}.pchat_zvonok SET attempts=attempts+1 WHERE id={int(row['id'])}")
        conn.commit(); cur.close(); conn.close()
        return _err(400, 'Неверный код')
    cur.execute(f"UPDATE {SCHEMA}.pchat_zvonok SET used=TRUE WHERE id={int(row['id'])}")
    cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur2.execute(f"SELECT id, display_name FROM {SCHEMA}.pchat_clients WHERE phone={_esc(phone)} LIMIT 1")
    existing = cur2.fetchone()
    auth = _gen_token()
    new_name = name or (existing.get('display_name') if existing else None) or 'Клиент'
    if existing:
        cid = int(existing['id'])
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET auth_token={_esc(auth)}, display_name={_esc(new_name)}, "
            f"auth_method='zvonok', last_seen_at=NOW() WHERE id={cid}"
        )
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, last_seen_at, auth_method) "
            f"VALUES ({_esc(phone)}, {_esc(new_name)}, {_esc(auth)}, NOW(), 'zvonok') RETURNING id"
        )
        cid = cur.fetchone()[0]
    conn.commit(); cur.close(); cur2.close(); conn.close()
    rid = get_or_create_direct_room(cid, new_name)
    return _ok({'ok': True, 'token': auth, 'client_id': cid, 'name': new_name, 'direct_room_id': rid, 'method': 'zvonok'})


# ───────── Диагностика Zvonok ─────────
def action_zvonok_diag(body):
    """Диагностика: проверить баланс и получить ответ Zvonok-API. Без авторизации, для отладки."""
    pub_key = os.environ.get('ZVONOK_PUBLIC_KEY', '')
    out = {
        'has_pub_key': bool(pub_key),
        'pub_key_len': len(pub_key) if pub_key else 0,
        'campaign_id': os.environ.get('ZVONOK_CAMPAIGN_ID', ''),
        'campaign_lead': os.environ.get('ZVONOK_CAMPAIGN_LEAD', ''),
        'campaign_ready': os.environ.get('ZVONOK_CAMPAIGN_READY', ''),
        'campaign_otp': os.environ.get('ZVONOK_CAMPAIGN_OTP', ''),
    }
    # Проверка статуса конкретного звонка по call_id
    test_call_id = (body or {}).get('check_call_id', '')
    if pub_key and test_call_id:
        # 1. Информация о звонке
        endpoints = [
            ('/manager/cabapi_external/api/v1/phones/calls/', {'public_key': pub_key, 'call_id': str(test_call_id)}),
            ('/manager/cabapi_external/api/v1/phones/call_by_id/', {'public_key': pub_key, 'call_id': str(test_call_id)}),
        ]
        for path, params in endpoints:
            try:
                rr = requests.get(f'https://zvonok.com{path}', params=params, timeout=8)
                key = path.split('/')[-2]
                out[f'call_check_{key}_status'] = rr.status_code
                try:
                    out[f'call_check_{key}'] = rr.json()
                except Exception:
                    out[f'call_check_{key}_raw'] = rr.text[:500]
            except Exception as e:
                out[f'call_check_{key}_err'] = str(e)
    # Если в body указан test_phone — пробуем отправить тестовый звонок
    test_phone = (body or {}).get('test_phone', '')
    test_campaign = (body or {}).get('test_campaign', '') or out['campaign_id']
    if pub_key and test_phone and test_campaign:
        try:
            digits = re.sub(r'\D', '', test_phone)
            if len(digits) == 11 and digits.startswith('8'):
                digits = '7' + digits[1:]
            r_test = requests.get(
                'https://zvonok.com/manager/cabapi_external/api/v1/phones/call/',
                params={'public_key': pub_key, 'campaign_id': str(test_campaign), 'phone': '+' + digits},
                timeout=10,
            )
            try:
                out['test_call_response'] = r_test.json()
            except Exception:
                out['test_call_raw'] = r_test.text[:500]
            out['test_call_status'] = r_test.status_code
            out['test_call_phone'] = '+' + digits
            out['test_call_campaign'] = str(test_campaign)
        except Exception as e:
            out['test_call_error'] = str(e)
    if not pub_key:
        return _ok({'ok': False, 'error': 'ZVONOK_PUBLIC_KEY не задан', **out})
    # 1. Проверим баланс
    try:
        r = requests.get(
            'https://zvonok.com/manager/cabapi_external/api/v1/users/balance/',
            params={'public_key': pub_key}, timeout=8,
        )
        out['balance_status'] = r.status_code
        try:
            out['balance'] = r.json()
        except Exception:
            out['balance_raw'] = r.text[:300]
    except Exception as e:
        out['balance_error'] = str(e)
    # 2. Проверим список кампаний
    try:
        r = requests.get(
            'https://zvonok.com/manager/cabapi_external/api/v1/campaigns/',
            params={'public_key': pub_key, 'mode': 'all'}, timeout=8,
        )
        out['campaigns_status'] = r.status_code
        try:
            out['campaigns'] = r.json()
        except Exception:
            out['campaigns_raw'] = r.text[:500]
    except Exception as e:
        out['campaigns_error'] = str(e)
    return _ok({'ok': True, **out})


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
    # Telegram webhook без action — определим по полю message/edited_message
    if not action and isinstance(body, dict) and (body.get('message') or body.get('edited_message')):
        action = 'tg_webhook'
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
        # альт. способы входа
        if action == 'verify_telegram': return action_verify_telegram(body)
        if action == 'bot_request_code': return action_bot_request_code(body)
        if action == 'bot_check':       return action_bot_check(body)
        if action == 'guest_login':     return action_guest_login(body)
        if action == 'zvonok_request':  return action_zvonok_request(body)
        if action == 'zvonok_verify':   return action_zvonok_verify(body)
        if action == 'zvonok_diag':     return action_zvonok_diag(body)
        if action == 'tg_webhook':      return action_tg_webhook(body)
        if action == 'bot_info':
            return _ok({
                'ok': True,
                'username': os.environ.get('TELEGRAM_BOT_USERNAME', ''),
            })
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