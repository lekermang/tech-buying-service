"""
Чат «СКУПКА24Vip» для сотрудников.

Действия (POST с action в JSON):
  - poll              : получить новые сообщения + список участников + счётчик непрочитанных
  - send              : отправить сообщение (text и/или photo_url) + push всем кроме автора
  - upload_photo      : загрузить фото в S3 (base64), возвращает CDN URL
  - mark_read         : отметить последнее прочитанное сообщение
  - update_avatar     : обновить avatar_url своего профиля
  - admin_set_avatar  : (admin/owner) обновить avatar_url любого сотрудника
  - vapid_public      : вернуть VAPID public key (без авторизации не требует, но проверяет токен)
  - push_subscribe    : сохранить web push подписку браузера
  - push_unsubscribe  : удалить web push подписку
"""
import base64
import json
import os
import uuid
import psycopg2
import boto3
from botocore.client import Config as BotoConfig

try:
    from pywebpush import webpush, WebPushException  # type: ignore
    HAS_WEBPUSH = True
except Exception:
    HAS_WEBPUSH = False

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
}

S3_ENDPOINT = 'https://bucket.poehali.dev'
S3_BUCKET = 'files'
S3_PREFIX = 'vip-chat/'
ALLOWED_IMAGE_MIMES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/heic': 'heic',
}
MAX_PHOTO_BYTES = 8 * 1024 * 1024  # 8 МБ


def _s3():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resolve_employee(event: dict):
    """Возвращает (employee_id, role, full_name) по X-Employee-Token / X-Admin-Token, иначе None."""
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (hdrs.get('x-employee-token') or hdrs.get('x-admin-token') or '').strip()
    if not token:
        return None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, role, full_name FROM {SCHEMA}.employees "
            f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (token,)
        )
        row = cur.fetchone()
        if row:
            return {'id': row[0], 'role': row[1], 'full_name': row[2]}
        # Fallback — ADMIN_TOKEN из env
        if token == os.environ.get('ADMIN_TOKEN', ''):
            cur.execute(f"SELECT id, role, full_name FROM {SCHEMA}.employees WHERE role='owner' LIMIT 1")
            r = cur.fetchone()
            if r:
                return {'id': r[0], 'role': r[1], 'full_name': r[2]}
        return None
    finally:
        cur.close(); conn.close()


def _touch_last_seen(cur, employee_id: int):
    cur.execute(f"UPDATE {SCHEMA}.employees SET last_seen_at=NOW() WHERE id={employee_id}")


def _ok(body: dict, code: int = 200) -> dict:
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _err(msg: str, code: int = 400) -> dict:
    return _ok({'error': msg}, code)


def handler(event: dict, context) -> dict:
    """Чат «СКУПКА24Vip»: групповая переписка сотрудников + загрузка фото в S3 + онлайн-статусы + Web Push."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    me = _resolve_employee(event)
    if not me:
        return _err('Unauthorized', 401)

    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        body = {}
    action = body.get('action', 'poll')

    if action == 'vapid_public':
        return _ok({'public_key': os.environ.get('VAPID_PUBLIC_KEY', '')})
    if action == 'push_subscribe':
        return _action_push_subscribe(me, body)
    if action == 'push_unsubscribe':
        return _action_push_unsubscribe(me, body)

    if action == 'poll':
        return _action_poll(me, body)
    if action == 'send':
        return _action_send(me, body)
    if action == 'upload_photo':
        return _action_upload_photo(me, body)
    if action == 'mark_read':
        return _action_mark_read(me, body)
    if action == 'update_avatar':
        return _action_update_avatar(me, body)
    if action == 'admin_set_avatar':
        return _action_admin_set_avatar(me, body)
    if action == 'dialogs':
        return _action_dialogs(me, body)

    return _err(f'unknown action: {action}')


# ─────────────────────────────────────────────────────────────────────────────

def _action_poll(me: dict, body: dict) -> dict:
    """Получить сообщения + участники + непрочитанные.
    peer_id: 0 (или нет) = общий чат, иначе ID собеседника (личка).
    """
    after_id = int(body.get('after_id') or body.get('last_id') or 0)
    limit    = max(1, min(int(body.get('limit') or 80), 200))
    peer_id  = int(body.get('peer_id') or 0)
    me_id    = int(me['id'])

    conn = _connect()
    cur = conn.cursor()
    try:
        _touch_last_seen(cur, me_id)

        # WHERE по типу чата
        if peer_id > 0:
            # Личка: сообщения между me и peer (в обе стороны), исключая удалённые
            where_chat = (
                f"((m.employee_id={me_id} AND m.recipient_id={peer_id}) "
                f" OR (m.employee_id={peer_id} AND m.recipient_id={me_id}))"
            )
        else:
            # Общий чат: recipient_id IS NULL
            where_chat = "m.recipient_id IS NULL"

        if after_id > 0:
            cur.execute(f"""
                SELECT m.id, m.employee_id, e.full_name, e.avatar_url, e.role,
                       m.text, m.photo_url, m.created_at, m.recipient_id
                FROM {SCHEMA}.vip_chat_messages m
                JOIN {SCHEMA}.employees e ON e.id = m.employee_id
                WHERE m.id > {after_id} AND {where_chat} AND m.erased_at IS NULL
                ORDER BY m.id ASC
                LIMIT {limit}
            """)
        else:
            cur.execute(f"""
                SELECT * FROM (
                    SELECT m.id, m.employee_id, e.full_name, e.avatar_url, e.role,
                           m.text, m.photo_url, m.created_at, m.recipient_id
                    FROM {SCHEMA}.vip_chat_messages m
                    JOIN {SCHEMA}.employees e ON e.id = m.employee_id
                    WHERE {where_chat} AND m.erased_at IS NULL
                    ORDER BY m.id DESC
                    LIMIT {limit}
                ) t ORDER BY id ASC
            """)
        msgs = []
        for r in cur.fetchall():
            msgs.append({
                'id': r[0],
                'employee_id': r[1], 'author_id': r[1],
                'full_name': r[2], 'author_name': r[2],
                'avatar_url': r[3], 'author_avatar': r[3],
                'role': r[4],
                'text': r[5], 'photo_url': r[6],
                'created_at': r[7].isoformat() if r[7] else None,
                'recipient_id': r[8],
            })

        # Участники: все активные сотрудники + считаем непрочитанные в личке от каждого
        cur.execute(f"""
            SELECT e.id, e.full_name, e.role, e.avatar_url, e.last_seen_at, e.is_active
            FROM {SCHEMA}.employees e
            WHERE e.is_active = true
            ORDER BY (CASE WHEN e.last_seen_at IS NULL THEN 1 ELSE 0 END), e.last_seen_at DESC
        """)
        members_raw = cur.fetchall()

        # Получаем last_read для всех диалогов me
        cur.execute(f"""
            SELECT peer_id, last_read_msg_id FROM {SCHEMA}.vip_chat_dialog_reads
            WHERE employee_id = {me_id}
        """)
        reads_map = {row[0]: row[1] for row in cur.fetchall()}

        # Считаем unread для каждого peer и общего чата
        members = []
        for r in members_raw:
            peer = r[0]
            if peer == me_id:
                unread_p = 0
            else:
                last_read_p = reads_map.get(peer, 0)
                cur.execute(f"""
                    SELECT COUNT(*) FROM {SCHEMA}.vip_chat_messages
                    WHERE employee_id={peer} AND recipient_id={me_id}
                      AND id > {last_read_p} AND erased_at IS NULL
                """)
                unread_p = cur.fetchone()[0]
            members.append({
                'id': r[0], 'full_name': r[1], 'role': r[2],
                'avatar_url': r[3],
                'last_seen_at': r[4].isoformat() if r[4] else None,
                'is_active': r[5],
                'unread': unread_p,
            })

        # Непрочитанные в ОБЩЕМ чате (peer_id=0)
        last_read_common = reads_map.get(0, 0)
        # Backfill из старой таблицы vip_chat_reads (для совместимости)
        if last_read_common == 0:
            cur.execute(f"SELECT last_read_msg_id FROM {SCHEMA}.vip_chat_reads WHERE employee_id={me_id}")
            rd = cur.fetchone()
            if rd:
                last_read_common = rd[0]
        cur.execute(f"""
            SELECT COUNT(*) FROM {SCHEMA}.vip_chat_messages
            WHERE recipient_id IS NULL AND id > {last_read_common}
              AND employee_id <> {me_id} AND erased_at IS NULL
        """)
        unread_common = cur.fetchone()[0]

        cur.execute(f"SELECT COALESCE(MAX(id), 0) FROM {SCHEMA}.vip_chat_messages")
        max_id = cur.fetchone()[0] or 0

        # last_id текущего диалога — для клиента
        if msgs:
            last_id_chat = msgs[-1]['id']
        else:
            last_id_chat = after_id

        conn.commit()
        return _ok({
            'me': {'id': me_id, 'role': me['role'], 'full_name': me['full_name']},
            'messages': msgs,
            'members': members,
            'participants': members,  # alias для старого фронта
            'unread': unread_common,
            'unread_common': unread_common,
            'max_id': max_id,
            'last_id': last_id_chat,
            'peer_id': peer_id,
        })
    except Exception as e:
        conn.rollback()
        return _err(f'poll failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_dialogs(me: dict, body: dict) -> dict:
    """Список диалогов + последнее сообщение + счётчик непрочитанных по каждому."""
    me_id = int(me['id'])
    conn = _connect()
    cur = conn.cursor()
    try:
        # Все сотрудники
        cur.execute(f"""
            SELECT id, full_name, role, avatar_url, last_seen_at, is_active
            FROM {SCHEMA}.employees
            WHERE is_active=true AND id<>{me_id}
            ORDER BY (CASE WHEN last_seen_at IS NULL THEN 1 ELSE 0 END), last_seen_at DESC
        """)
        users = cur.fetchall()

        # Карта прочитанного по диалогам
        cur.execute(f"""
            SELECT peer_id, last_read_msg_id FROM {SCHEMA}.vip_chat_dialog_reads
            WHERE employee_id={me_id}
        """)
        reads = {r[0]: r[1] for r in cur.fetchall()}

        dialogs = []
        for u in users:
            peer = u[0]
            # последнее сообщение
            cur.execute(f"""
                SELECT id, text, photo_url, created_at, employee_id
                FROM {SCHEMA}.vip_chat_messages
                WHERE erased_at IS NULL AND
                  ((employee_id={me_id} AND recipient_id={peer})
                    OR (employee_id={peer} AND recipient_id={me_id}))
                ORDER BY id DESC LIMIT 1
            """)
            last = cur.fetchone()
            last_read = reads.get(peer, 0)
            cur.execute(f"""
                SELECT COUNT(*) FROM {SCHEMA}.vip_chat_messages
                WHERE employee_id={peer} AND recipient_id={me_id}
                  AND id>{last_read} AND erased_at IS NULL
            """)
            unread = cur.fetchone()[0]
            dialogs.append({
                'peer_id': peer,
                'full_name': u[1], 'role': u[2], 'avatar_url': u[3],
                'last_seen_at': u[4].isoformat() if u[4] else None,
                'last_message': ({
                    'id': last[0],
                    'text': last[1],
                    'photo_url': last[2],
                    'created_at': last[3].isoformat() if last[3] else None,
                    'mine': last[4] == me_id,
                } if last else None),
                'unread': unread,
            })
        return _ok({'dialogs': dialogs})
    except Exception as e:
        return _err(f'dialogs failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_send(me: dict, body: dict) -> dict:
    text = (body.get('text') or '').strip()
    photo_url = (body.get('photo_url') or '').strip() or None
    recipient_id = int(body.get('recipient_id') or body.get('peer_id') or 0) or None
    if not text and not photo_url:
        return _err('Сообщение пустое')
    if text and len(text) > 4000:
        text = text[:4000]
    me_id = int(me['id'])

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.vip_chat_messages (employee_id, text, photo_url, recipient_id) "
            f"VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (me_id, text or None, photo_url, recipient_id)
        )
        new_id, created_at = cur.fetchone()
        # Своё прочитанное в этом диалоге двигаем
        peer_for_read = recipient_id if recipient_id else 0
        cur.execute(f"""
            INSERT INTO {SCHEMA}.vip_chat_dialog_reads (employee_id, peer_id, last_read_msg_id, updated_at)
            VALUES ({me_id}, {peer_for_read}, {new_id}, NOW())
            ON CONFLICT (employee_id, peer_id) DO UPDATE
              SET last_read_msg_id = EXCLUDED.last_read_msg_id, updated_at = NOW()
        """)
        # Совместимость со старой таблицей (для общего чата)
        if not recipient_id:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.vip_chat_reads (employee_id, last_read_msg_id, updated_at)
                VALUES ({me_id}, {new_id}, NOW())
                ON CONFLICT (employee_id) DO UPDATE
                  SET last_read_msg_id = EXCLUDED.last_read_msg_id, updated_at = NOW()
            """)
        _touch_last_seen(cur, me_id)
        conn.commit()
    except Exception as e:
        conn.rollback()
        cur.close(); conn.close()
        return _err(f'send failed: {e}', 500)
    cur.close(); conn.close()

    # Рассылка push
    preview = text[:120] if text else ('📷 Фото' if photo_url else 'Новое сообщение')
    if recipient_id:
        title = f"{me['full_name']} · личное"
        url = f"/staff?tab=chat&peer={recipient_id}"
    else:
        title = f"{me['full_name']} · СКУПКА24Vip"
        url = '/staff?tab=chat'
    payload = {
        'title': title,
        'body': preview,
        'url': url,
        'tag': f'vip-chat-{recipient_id or "all"}',
        'photo': photo_url,
        'msg_id': new_id,
    }
    try:
        if recipient_id:
            _send_push_to_employee(recipient_id, payload)
        else:
            _send_push_to_all_except(me_id, payload)
    except Exception:
        pass

    return _ok({'ok': True, 'id': new_id, 'created_at': created_at.isoformat()})


def _action_upload_photo(me: dict, body: dict) -> dict:
    """Принимает base64 + mime_type, валидирует, кладёт в S3, возвращает CDN URL."""
    b64 = (body.get('base64') or '').strip()
    mime = (body.get('mime_type') or '').strip().lower()
    if not b64:
        return _err('base64 пустой')
    ext = ALLOWED_IMAGE_MIMES.get(mime)
    if not ext:
        return _err('Допустимы только изображения (jpg, png, webp, gif, heic)')
    try:
        data = base64.b64decode(b64)
    except Exception:
        return _err('base64 не валиден')
    if len(data) > MAX_PHOTO_BYTES:
        return _err(f'Файл больше {MAX_PHOTO_BYTES // 1024 // 1024} МБ')

    key = f"{S3_PREFIX}{uuid.uuid4().hex}.{ext}"
    try:
        s3 = _s3()
        s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=mime)
    except Exception as e:
        return _err(f's3 error: {e}', 500)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    # обновим last_seen
    conn = _connect()
    cur = conn.cursor()
    try:
        _touch_last_seen(cur, me['id'])
        conn.commit()
    except Exception:
        conn.rollback()
    finally:
        cur.close(); conn.close()

    return _ok({'ok': True, 'photo_url': cdn_url})


def _action_mark_read(me: dict, body: dict) -> dict:
    msg_id = int(body.get('msg_id') or body.get('last_id') or 0)
    peer_id = int(body.get('peer_id') or 0)
    if msg_id <= 0:
        return _err('msg_id обязателен')
    me_id = int(me['id'])
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.vip_chat_dialog_reads (employee_id, peer_id, last_read_msg_id, updated_at)
            VALUES ({me_id}, {peer_id}, {msg_id}, NOW())
            ON CONFLICT (employee_id, peer_id) DO UPDATE
              SET last_read_msg_id = GREATEST({SCHEMA}.vip_chat_dialog_reads.last_read_msg_id, EXCLUDED.last_read_msg_id),
                  updated_at = NOW()
        """)
        if peer_id == 0:
            # совместимость со старой таблицей
            cur.execute(f"""
                INSERT INTO {SCHEMA}.vip_chat_reads (employee_id, last_read_msg_id, updated_at)
                VALUES ({me_id}, {msg_id}, NOW())
                ON CONFLICT (employee_id) DO UPDATE
                  SET last_read_msg_id = GREATEST({SCHEMA}.vip_chat_reads.last_read_msg_id, EXCLUDED.last_read_msg_id),
                      updated_at = NOW()
            """)
        _touch_last_seen(cur, me_id)
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'mark_read failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_update_avatar(me: dict, body: dict) -> dict:
    url = (body.get('avatar_url') or '').strip() or None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.employees SET avatar_url=%s WHERE id={me['id']}", (url,))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'avatar update failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_admin_set_avatar(me: dict, body: dict) -> dict:
    if me['role'] not in ('owner', 'admin'):
        return _err('Only admin/owner', 403)
    target_id = int(body.get('employee_id') or 0)
    url = (body.get('avatar_url') or '').strip() or None
    if not target_id:
        return _err('employee_id обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"UPDATE {SCHEMA}.employees SET avatar_url=%s WHERE id={target_id}", (url,))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'admin_set_avatar failed: {e}', 500)
    finally:
        cur.close(); conn.close()


# ─── Web Push ──────────────────────────────────────────────────────────────────

def _action_push_subscribe(me: dict, body: dict) -> dict:
    """Сохранить web push подписку браузера сотрудника."""
    sub = body.get('subscription') or {}
    endpoint = (sub.get('endpoint') or '').strip()
    keys = sub.get('keys') or {}
    p256dh = (keys.get('p256dh') or '').strip()
    auth = (keys.get('auth') or '').strip()
    user_agent = (body.get('user_agent') or '')[:500]
    if not endpoint or not p256dh or not auth:
        return _err('Нужны endpoint и keys.{p256dh,auth}')

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.vip_chat_push_subs (employee_id, endpoint, p256dh, auth, user_agent, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (endpoint) DO UPDATE SET
                employee_id = EXCLUDED.employee_id,
                p256dh = EXCLUDED.p256dh,
                auth   = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent,
                updated_at = NOW()
        """, (me['id'], endpoint, p256dh, auth, user_agent))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'push_subscribe failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_push_unsubscribe(me: dict, body: dict) -> dict:
    """Удалить подписку (логически — переводим на UPDATE на NULL endpoint)."""
    endpoint = (body.get('endpoint') or '').strip()
    if not endpoint:
        return _err('endpoint обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        # «Тушим» — затираем p256dh/auth, чтобы не получать на эту подписку
        cur.execute(f"""
            UPDATE {SCHEMA}.vip_chat_push_subs
               SET p256dh = '', auth = '', updated_at = NOW()
             WHERE endpoint = %s AND employee_id = %s
        """, (endpoint, me['id']))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'push_unsubscribe failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _send_push_to_all_except(author_id: int, payload: dict) -> int:
    """Рассылает push всем подписанным сотрудникам, кроме автора. Возвращает кол-во успешных доставок."""
    if not HAS_WEBPUSH:
        return 0
    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    if not private_key or not public_key:
        return 0

    vapid_claims = {'sub': 'mailto:lekermany@yandex.ru'}

    conn = _connect()
    cur = conn.cursor()
    sent = 0
    dead_endpoints: list[str] = []
    try:
        cur.execute(f"""
            SELECT endpoint, p256dh, auth FROM {SCHEMA}.vip_chat_push_subs
             WHERE employee_id <> %s AND p256dh <> '' AND auth <> ''
        """, (author_id,))
        rows = cur.fetchall()
        body_str = json.dumps(payload, ensure_ascii=False)
        for endpoint, p256dh, auth in rows:
            try:
                webpush(
                    subscription_info={
                        'endpoint': endpoint,
                        'keys': {'p256dh': p256dh, 'auth': auth},
                    },
                    data=body_str,
                    vapid_private_key=private_key,
                    vapid_claims=vapid_claims,
                    timeout=4,
                )
                sent += 1
            except WebPushException as e:
                code = getattr(e.response, 'status_code', 0) if e.response else 0
                if code in (404, 410):
                    dead_endpoints.append(endpoint)
            except Exception:
                pass
        # Чистим протухшие подписки
        if dead_endpoints:
            cur.executemany(
                f"UPDATE {SCHEMA}.vip_chat_push_subs SET p256dh='', auth='', updated_at=NOW() WHERE endpoint=%s",
                [(e,) for e in dead_endpoints]
            )
            conn.commit()
    except Exception:
        pass
    finally:
        cur.close(); conn.close()
    return sent


def _send_push_to_employee(employee_id: int, payload: dict) -> int:
    """Отправляет push конкретному сотруднику (для личных сообщений)."""
    if not HAS_WEBPUSH:
        return 0
    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    if not private_key or not public_key:
        return 0
    vapid_claims = {'sub': 'mailto:lekermany@yandex.ru'}
    conn = _connect()
    cur = conn.cursor()
    sent = 0
    dead: list[str] = []
    try:
        cur.execute(f"""
            SELECT endpoint, p256dh, auth FROM {SCHEMA}.vip_chat_push_subs
             WHERE employee_id = %s AND p256dh <> '' AND auth <> ''
        """, (employee_id,))
        body_str = json.dumps(payload, ensure_ascii=False)
        for endpoint, p256dh, auth in cur.fetchall():
            try:
                webpush(
                    subscription_info={'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth}},
                    data=body_str,
                    vapid_private_key=private_key,
                    vapid_claims=vapid_claims,
                    timeout=4,
                )
                sent += 1
            except WebPushException as e:
                code = getattr(e.response, 'status_code', 0) if e.response else 0
                if code in (404, 410):
                    dead.append(endpoint)
            except Exception:
                pass
        if dead:
            cur.executemany(
                f"UPDATE {SCHEMA}.vip_chat_push_subs SET p256dh='', auth='', updated_at=NOW() WHERE endpoint=%s",
                [(e,) for e in dead]
            )
            conn.commit()
    except Exception:
        pass
    finally:
        cur.close(); conn.close()
    return sent