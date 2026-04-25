"""
Чат «СКУПКА24Vip» для сотрудников.

Действия (POST с action в JSON):
  - poll          : получить новые сообщения + список участников + счётчик непрочитанных
                    (одновременно обновляет last_seen_at сотрудника)
  - send          : отправить сообщение (text и/или photo_url)
  - upload_photo  : загрузить фото в S3 (base64), возвращает CDN URL
  - mark_read     : отметить последнее прочитанное сообщение
  - update_avatar : обновить avatar_url своего профиля
  - admin_set_avatar : (admin/owner) обновить avatar_url любого сотрудника
"""
import base64
import json
import os
import uuid
import psycopg2
import boto3
from botocore.client import Config as BotoConfig

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
    """Чат «СКУПКА24Vip»: групповая переписка сотрудников + загрузка фото в S3 + онлайн-статусы."""
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

    return _err(f'unknown action: {action}')


# ─────────────────────────────────────────────────────────────────────────────

def _action_poll(me: dict, body: dict) -> dict:
    """Получить последние сообщения + участники + непрочитанное."""
    after_id = int(body.get('after_id') or 0)
    limit    = max(1, min(int(body.get('limit') or 80), 200))

    conn = _connect()
    cur = conn.cursor()
    try:
        _touch_last_seen(cur, me['id'])

        # Сообщения (либо новые после after_id, либо последние limit)
        if after_id > 0:
            cur.execute(f"""
                SELECT m.id, m.employee_id, e.full_name, e.avatar_url, e.role,
                       m.text, m.photo_url, m.created_at
                FROM {SCHEMA}.vip_chat_messages m
                JOIN {SCHEMA}.employees e ON e.id = m.employee_id
                WHERE m.id > {after_id}
                ORDER BY m.id ASC
                LIMIT {limit}
            """)
        else:
            cur.execute(f"""
                SELECT * FROM (
                    SELECT m.id, m.employee_id, e.full_name, e.avatar_url, e.role,
                           m.text, m.photo_url, m.created_at
                    FROM {SCHEMA}.vip_chat_messages m
                    JOIN {SCHEMA}.employees e ON e.id = m.employee_id
                    ORDER BY m.id DESC
                    LIMIT {limit}
                ) t ORDER BY id ASC
            """)
        msgs = []
        for r in cur.fetchall():
            msgs.append({
                'id': r[0], 'employee_id': r[1], 'full_name': r[2],
                'avatar_url': r[3], 'role': r[4],
                'text': r[5], 'photo_url': r[6],
                'created_at': r[7].isoformat() if r[7] else None,
            })

        # Участники
        cur.execute(f"""
            SELECT id, full_name, role, avatar_url, last_seen_at, is_active
            FROM {SCHEMA}.employees
            WHERE is_active = true
            ORDER BY (CASE WHEN last_seen_at IS NULL THEN 1 ELSE 0 END), last_seen_at DESC
        """)
        members = []
        for r in cur.fetchall():
            members.append({
                'id': r[0], 'full_name': r[1], 'role': r[2],
                'avatar_url': r[3],
                'last_seen_at': r[4].isoformat() if r[4] else None,
                'is_active': r[5],
            })

        # Непрочитанные
        cur.execute(f"SELECT last_read_msg_id FROM {SCHEMA}.vip_chat_reads WHERE employee_id={me['id']}")
        rd = cur.fetchone()
        last_read = rd[0] if rd else 0
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.vip_chat_messages WHERE id > {last_read} AND employee_id <> {me['id']}")
        unread = cur.fetchone()[0]

        cur.execute(f"SELECT COALESCE(MAX(id), 0) FROM {SCHEMA}.vip_chat_messages")
        max_id = cur.fetchone()[0] or 0

        conn.commit()
        return _ok({
            'me': {'id': me['id'], 'role': me['role'], 'full_name': me['full_name']},
            'messages': msgs,
            'members': members,
            'unread': unread,
            'max_id': max_id,
        })
    except Exception as e:
        conn.rollback()
        return _err(f'poll failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _action_send(me: dict, body: dict) -> dict:
    text = (body.get('text') or '').strip()
    photo_url = (body.get('photo_url') or '').strip() or None
    if not text and not photo_url:
        return _err('Сообщение пустое')
    if text and len(text) > 4000:
        text = text[:4000]

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.vip_chat_messages (employee_id, text, photo_url) "
            f"VALUES (%s, %s, %s) RETURNING id, created_at",
            (me['id'], text or None, photo_url)
        )
        new_id, created_at = cur.fetchone()
        # Своё прочитанное двигаем
        cur.execute(f"""
            INSERT INTO {SCHEMA}.vip_chat_reads (employee_id, last_read_msg_id, updated_at)
            VALUES ({me['id']}, {new_id}, NOW())
            ON CONFLICT (employee_id) DO UPDATE
              SET last_read_msg_id = EXCLUDED.last_read_msg_id, updated_at = NOW()
        """)
        _touch_last_seen(cur, me['id'])
        conn.commit()
        return _ok({'ok': True, 'id': new_id, 'created_at': created_at.isoformat()})
    except Exception as e:
        conn.rollback()
        return _err(f'send failed: {e}', 500)
    finally:
        cur.close(); conn.close()


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
    msg_id = int(body.get('msg_id') or 0)
    if msg_id <= 0:
        return _err('msg_id обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.vip_chat_reads (employee_id, last_read_msg_id, updated_at)
            VALUES ({me['id']}, {msg_id}, NOW())
            ON CONFLICT (employee_id) DO UPDATE
              SET last_read_msg_id = GREATEST({SCHEMA}.vip_chat_reads.last_read_msg_id, EXCLUDED.last_read_msg_id),
                  updated_at = NOW()
        """)
        _touch_last_seen(cur, me['id'])
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
