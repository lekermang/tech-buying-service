"""Перенос данных между устройствами (без сторонних приложений).
Действия: create, status, find, mark_ready, upload, files, zip, file, mark_connected, cancel.
Данные хранятся 30 минут в S3, потом помечаются истёкшими.
"""
import json
import os
import io
import base64
import random
import string
import zipfile
import psycopg2
import psycopg2.extras
import boto3
from datetime import datetime, timezone

SCHEMA = 't_p31606708_tech_buying_service'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str), 'isBase64Encoded': False}


def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False), 'isBase64Encoded': False}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def gen_code():
    """Генерирует 6-значный код без неоднозначных символов (0/O, 1/I)."""
    alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    return ''.join(random.choice(alphabet) for _ in range(6))


def action_create(event):
    """Создаёт новую сессию переноса."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # Подбираем уникальный код
    for _ in range(10):
        code = gen_code()
        cur.execute(
            f"SELECT 1 FROM {SCHEMA}.transfer_sessions "
            f"WHERE code=%s AND expires_at > NOW()",
            (code,)
        )
        if not cur.fetchone():
            break
    else:
        cur.close(); conn.close()
        return _err(500, 'Не удалось сгенерировать код')

    ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp')
    cur.execute(
        f"INSERT INTO {SCHEMA}.transfer_sessions (code, ip_sender) "
        f"VALUES (%s, %s) RETURNING id, code, expires_at",
        (code, ip)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close(); conn.close()
    return _ok({
        'sessionId': str(row['id']),
        'code': row['code'],
        'expiresAt': row['expires_at'].isoformat(),
    })


def _get_session(cur, session_id=None, code=None):
    if session_id:
        cur.execute(
            f"SELECT * FROM {SCHEMA}.transfer_sessions WHERE id=%s",
            (session_id,)
        )
    elif code:
        cur.execute(
            f"SELECT * FROM {SCHEMA}.transfer_sessions "
            f"WHERE code=%s AND expires_at > NOW()",
            (code.upper(),)
        )
    else:
        return None
    return cur.fetchone()


def action_status(qs):
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    s = _get_session(cur, session_id=sid)
    cur.close(); conn.close()
    if not s:
        return _err(404, 'Сессия не найдена')
    expired = s['expires_at'] < datetime.now(timezone.utc)
    return _ok({
        'sessionId': str(s['id']),
        'code': s['code'],
        'status': 'expired' if expired else s['status'],
        'hasContacts': s['has_contacts'],
        'hasPhotos': s['has_photos'],
        'hasDocs': s['has_docs'],
        'receiverConnected': s['receiver_connected'],
        'downloadStarted': s['download_started'],
        'downloadCompleted': s['download_completed'],
        'filesCount': s['files_count'],
        'totalBytes': s['total_bytes'],
        'expiresAt': s['expires_at'].isoformat(),
    })


def action_find(qs):
    """Поиск сессии по коду."""
    code = (qs.get('code') or '').strip().upper()
    if not code:
        return _err(400, 'code required')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    s = _get_session(cur, code=code)
    cur.close(); conn.close()
    if not s:
        return _err(404, 'Сессия не найдена или истекла')
    return _ok({
        'sessionId': str(s['id']),
        'status': s['status'],
    })


def action_upload(body, qs):
    """Загрузка одного файла (base64). Аплоадим в S3."""
    sid = qs.get('id') or body.get('sessionId')
    if not sid:
        return _err(400, 'sessionId required')
    file_name = (body.get('fileName') or '').strip()
    mime = body.get('mimeType') or 'application/octet-stream'
    b64 = body.get('fileBase64') or ''
    kind = (body.get('kind') or 'docs').strip()
    if not file_name or not b64:
        return _err(400, 'fileName и fileBase64 обязательны')

    try:
        data = base64.b64decode(b64)
    except Exception:
        return _err(400, 'Некорректный base64')

    size = len(data)
    if size > 25 * 1024 * 1024:
        return _err(413, 'Файл слишком большой (максимум 25 МБ)')

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    s = _get_session(cur, session_id=sid)
    if not s:
        cur.close(); conn.close()
        return _err(404, 'Сессия не найдена')
    if s['status'] in ('expired', 'cancelled'):
        cur.close(); conn.close()
        return _err(400, 'Сессия завершена')

    # Уникальное имя в S3
    safe = ''.join(c if c.isalnum() or c in '._-' else '_' for c in file_name)
    s3_key = f"transfer/{sid}/{int(datetime.now().timestamp()*1000)}_{safe}"
    s3 = get_s3()
    s3.put_object(Bucket='files', Key=s3_key, Body=data, ContentType=mime)

    cur.execute(
        f"INSERT INTO {SCHEMA}.transfer_files (session_id, file_name, mime_type, size_bytes, s3_key) "
        f"VALUES (%s, %s, %s, %s, %s) RETURNING id",
        (sid, file_name, mime, size, s3_key)
    )
    file_id = cur.fetchone()['id']
    # Обновляем агрегаты в сессии и флаги
    flag_col = {
        'contacts': 'has_contacts',
        'photos': 'has_photos',
        'docs': 'has_docs',
    }.get(kind, 'has_docs')
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET "
        f"files_count = files_count + 1, "
        f"total_bytes = total_bytes + %s, "
        f"{flag_col} = TRUE "
        f"WHERE id=%s",
        (size, sid)
    )
    conn.commit()
    cur.close(); conn.close()
    return _ok({'fileId': file_id, 'size': size, 's3Key': s3_key})


def action_mark_ready(qs):
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET status='ready' "
        f"WHERE id=%s AND status='pending' RETURNING id",
        (sid,)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close(); conn.close()
    if not row:
        return _err(404, 'Сессия не найдена или уже готова')
    return _ok({'sessionId': sid, 'status': 'ready'})


def action_files(qs):
    """Список файлов сессии (для получателя)."""
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    s = _get_session(cur, session_id=sid)
    if not s:
        cur.close(); conn.close()
        return _err(404, 'Сессия не найдена')
    cur.execute(
        f"SELECT id, file_name, mime_type, size_bytes "
        f"FROM {SCHEMA}.transfer_files WHERE session_id=%s ORDER BY id",
        (sid,)
    )
    files = [
        {
            'id': r['id'],
            'name': r['file_name'],
            'mime': r['mime_type'],
            'size': int(r['size_bytes'] or 0),
        }
        for r in cur.fetchall()
    ]
    cur.close(); conn.close()
    return _ok({
        'files': files,
        'totalBytes': int(s['total_bytes'] or 0),
        'hasContacts': s['has_contacts'],
        'hasPhotos': s['has_photos'],
        'hasDocs': s['has_docs'],
    })


def action_mark_connected(qs):
    """Получатель подключился — поллит сюда."""
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET receiver_connected=TRUE "
        f"WHERE id=%s AND expires_at > NOW() RETURNING id",
        (sid,)
    )
    row = cur.fetchone()
    conn.commit()
    cur.close(); conn.close()
    if not row:
        return _err(404, 'Сессия не найдена или истекла')
    return _ok({'ok': True})


def action_zip(qs):
    """Скачивание ZIP-архива всех файлов."""
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    s = _get_session(cur, session_id=sid)
    if not s:
        cur.close(); conn.close()
        return _err(404, 'Сессия не найдена')
    cur.execute(
        f"SELECT file_name, mime_type, s3_key FROM {SCHEMA}.transfer_files "
        f"WHERE session_id=%s ORDER BY id",
        (sid,)
    )
    rows = cur.fetchall()
    # Помечаем что скачивание началось
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET download_started=TRUE, status='downloading' "
        f"WHERE id=%s",
        (sid,)
    )
    conn.commit()
    cur.close(); conn.close()

    if not rows:
        return _err(404, 'Файлов нет')

    # Собираем ZIP в памяти
    s3 = get_s3()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for r in rows:
            obj = s3.get_object(Bucket='files', Key=r['s3_key'])
            zf.writestr(r['file_name'], obj['Body'].read())
    zip_bytes = buf.getvalue()

    # Помечаем завершение
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET download_completed=TRUE, status='completed' "
        f"WHERE id=%s",
        (sid,)
    )
    conn.commit()
    cur.close(); conn.close()

    return {
        'statusCode': 200,
        'headers': {
            **HEADERS,
            'Content-Type': 'application/zip',
            'Content-Disposition': f'attachment; filename="transfer_{sid[:8]}.zip"',
        },
        'body': base64.b64encode(zip_bytes).decode('ascii'),
        'isBase64Encoded': True,
    }


def action_file(qs):
    """Скачать один файл (например vcf для контактов)."""
    sid = qs.get('id')
    file_id = qs.get('file_id')
    if not sid or not file_id:
        return _err(400, 'id и file_id обязательны')
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT file_name, mime_type, s3_key FROM {SCHEMA}.transfer_files "
        f"WHERE session_id=%s AND id=%s",
        (sid, file_id)
    )
    f = cur.fetchone()
    cur.close(); conn.close()
    if not f:
        return _err(404, 'Файл не найден')
    s3 = get_s3()
    obj = s3.get_object(Bucket='files', Key=f['s3_key'])
    data = obj['Body'].read()
    return {
        'statusCode': 200,
        'headers': {
            **HEADERS,
            'Content-Type': f['mime_type'] or 'application/octet-stream',
            'Content-Disposition': f'attachment; filename="{f["file_name"]}"',
        },
        'body': base64.b64encode(data).decode('ascii'),
        'isBase64Encoded': True,
    }


def action_cancel(qs):
    sid = qs.get('id')
    if not sid:
        return _err(400, 'id required')
    conn = get_conn(); cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.transfer_sessions SET status='cancelled' WHERE id=%s",
        (sid,)
    )
    conn.commit()
    cur.close(); conn.close()
    return _ok({'ok': True})


def handler(event: dict, context) -> dict:
    """Точка входа: ?action=create|status|find|upload|mark_ready|files|mark_connected|zip|file|cancel."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = (qs.get('action') or '').strip()

    body = {}
    raw = event.get('body') or ''
    if raw and method == 'POST':
        try:
            body = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except Exception:
            body = {}

    if method == 'GET':
        if action == 'status':
            return action_status(qs)
        if action == 'find':
            return action_find(qs)
        if action == 'files':
            return action_files(qs)
        if action == 'zip':
            return action_zip(qs)
        if action == 'file':
            return action_file(qs)
        return _err(400, f'Unknown GET action: {action}')

    if method == 'POST':
        if action == 'create':
            return action_create(event)
        if action == 'upload':
            return action_upload(body, qs)
        if action == 'mark_ready':
            return action_mark_ready(qs)
        if action == 'mark_connected':
            return action_mark_connected(qs)
        if action == 'cancel':
            return action_cancel(qs)
        return _err(400, f'Unknown POST action: {action}')

    return _err(405, 'Method not allowed')
