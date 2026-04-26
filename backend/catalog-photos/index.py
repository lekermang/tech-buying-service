"""Catalog photos API: загрузка/чтение/удаление фото товаров каталога.

Хранит файлы в S3 (bucket=files, prefix=catalog/{item_id}/), метаданные в catalog_photos.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
BUCKET = 'files'
PREFIX = 'catalog'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def cdn_url(key: str) -> str:
    aki = os.environ['AWS_ACCESS_KEY_ID']
    return f"https://cdn.poehali.dev/projects/{aki}/bucket/{key}"


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def is_admin(headers_in: dict) -> bool:
    token = headers_in.get('x-admin-token', '') or headers_in.get('x-employee-token', '')
    if not token:
        return False
    return token == os.environ.get('ADMIN_TOKEN', '') or bool(token)


def check_employee(headers_in: dict) -> bool:
    """Простая проверка employee-token: непустой токен с действующей записью в БД."""
    et = headers_in.get('x-employee-token', '')
    if not et:
        return False
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token=%s AND is_active=true LIMIT 1",
            (et,),
        )
        ok_row = cur.fetchone() is not None
        cur.close()
        conn.close()
        return ok_row
    except Exception:
        return False


def has_access(headers_in: dict) -> bool:
    at = headers_in.get('x-admin-token', '')
    if at and at == os.environ.get('ADMIN_TOKEN', ''):
        return True
    return check_employee(headers_in)


def update_item_counters(cur, item_id: int):
    cur.execute(
        f"SELECT COUNT(*), COUNT(*) FILTER (WHERE is_valid) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s",
        (item_id,),
    )
    total, valid = cur.fetchone()
    has_photo = total > 0
    cur.execute(
        f"""SELECT url FROM {SCHEMA}.catalog_photos
            WHERE catalog_item_id=%s ORDER BY sort_order ASC, id ASC LIMIT 1""",
        (item_id,),
    )
    row = cur.fetchone()
    first_url = row[0] if row else None
    cur.execute(
        f"""UPDATE {SCHEMA}.catalog SET
                photos_count=%s, has_photo=%s, photo_url=%s, updated_at=now()
            WHERE id=%s""",
        (total, has_photo, first_url, item_id),
    )


def handler(event: dict, context) -> dict:
    """Управление фото товаров каталога: загрузка, список, удаление."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    params = event.get('queryStringParameters') or {}

    # GET: список фото товара (публичный)
    if method == 'GET':
        item_id_str = params.get('item_id', '')
        if not item_id_str:
            return err(400, 'item_id required')
        try:
            item_id = int(item_id_str)
        except ValueError:
            return err(400, 'item_id must be int')

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, photo_type, file_name, url, sort_order, is_valid
                FROM {SCHEMA}.catalog_photos
                WHERE catalog_item_id=%s
                ORDER BY sort_order ASC, id ASC""",
            (item_id,),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        photos = [
            {'id': r[0], 'photo_type': r[1], 'file_name': r[2], 'url': r[3],
             'sort_order': r[4], 'is_valid': r[5]}
            for r in rows
        ]
        return ok({'photos': photos})

    # POST: загрузить фото (только admin/employee)
    if method == 'POST':
        if not has_access(headers_in):
            return err(403, 'forbidden')
        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}

        item_id = body.get('item_id')
        sku = body.get('sku') or f"SKY{item_id}"
        product_name = body.get('product_name', '')
        photo_type = body.get('photo_type', 'front')
        file_name = body.get('file_name', 'photo.jpg')
        file_b64 = body.get('file_b64', '')
        content_type = body.get('content_type', 'image/jpeg')

        if not item_id or not file_b64:
            return err(400, 'item_id and file_b64 required')

        try:
            file_bytes = base64.b64decode(file_b64)
        except Exception:
            return err(400, 'invalid base64')

        if len(file_bytes) > 10 * 1024 * 1024:
            return err(400, 'file too large (max 10 MB)')

        ext = (file_name.rsplit('.', 1)[-1] if '.' in file_name else 'jpg').lower()
        if ext not in ('jpg', 'jpeg', 'png', 'webp'):
            ext = 'jpg'

        unique = uuid.uuid4().hex[:10]
        key = f"{PREFIX}/{item_id}/{photo_type}_{unique}.{ext}"

        s3 = get_s3()
        s3.put_object(
            Bucket=BUCKET, Key=key, Body=file_bytes,
            ContentType=content_type, ACL='public-read',
        )

        url = cdn_url(key)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.catalog_photos
                WHERE catalog_item_id=%s""",
            (item_id,),
        )
        sort_order = cur.fetchone()[0]
        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog_photos
                (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (item_id, sku, product_name, photo_type, file_name, url, sort_order, True),
        )
        photo_id = cur.fetchone()[0]
        update_item_counters(cur, item_id)
        conn.commit()
        cur.close()
        conn.close()

        return ok({'id': photo_id, 'url': url, 'is_valid': True})

    # DELETE: удалить фото (только admin/employee)
    if method == 'DELETE':
        if not has_access(headers_in):
            return err(403, 'forbidden')
        photo_id = params.get('id')
        if not photo_id:
            return err(400, 'id required')

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT catalog_item_id, url FROM {SCHEMA}.catalog_photos WHERE id=%s",
            (photo_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err(404, 'not found')
        item_id, url = row

        # Удалить из S3 (best-effort)
        try:
            aki = os.environ['AWS_ACCESS_KEY_ID']
            prefix_str = f"https://cdn.poehali.dev/projects/{aki}/bucket/"
            if url and url.startswith(prefix_str):
                key = url[len(prefix_str):]
                s3 = get_s3()
                s3.delete_object(Bucket=BUCKET, Key=key)
        except Exception:
            pass

        cur.execute(f"DELETE FROM {SCHEMA}.catalog_photos WHERE id=%s", (photo_id,))
        update_item_counters(cur, item_id)
        conn.commit()
        cur.close()
        conn.close()
        return ok({'deleted': True})

    return err(405, 'method not allowed')
