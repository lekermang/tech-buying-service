"""
Управление фото и описанием товаров Авито (витрина slAvitoShowcase).

Actions:
  POST ?action=upload           — загрузить фото товара (product_id, image_base64)
  POST ?action=delete_photo     — удалить фото (product_id, photo_url)
  POST ?action=reorder          — изменить порядок фото (product_id, photos[])
  POST ?action=update           — обновить описание / видимость (product_id, description?, is_visible?)
  POST ?action=bookmarklet_save — сохранить фото и описание с bookmarklet (token, avito_id, images[], description)
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
BUCKET = 'files'
PREFIX = 'avito'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token, X-Auth-Token',
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
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'ok': False, 'error': msg}, ensure_ascii=False)}


def has_access(headers_in: dict) -> bool:
    admin_token = headers_in.get('x-admin-token', '')
    if admin_token and admin_token == os.environ.get('ADMIN_TOKEN', ''):
        return True
    emp_token = headers_in.get('x-employee-token', '') or headers_in.get('x-auth-token', '')
    if not emp_token:
        return False
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token=%s AND is_active=true LIMIT 1",
            (emp_token,),
        )
        row_ok = cur.fetchone() is not None
        cur.close()
        conn.close()
        return row_ok
    except Exception:
        return False


def upload_image(product_id, b64_data: str) -> str:
    if ',' in b64_data and b64_data.startswith('data:'):
        b64_data = b64_data.split(',', 1)[1]
    file_bytes = base64.b64decode(b64_data)
    unique = uuid.uuid4().hex[:10]
    key = f"{PREFIX}/{product_id}/{unique}.jpg"
    s3 = get_s3()
    s3.put_object(Bucket=BUCKET, Key=key, Body=file_bytes, ContentType='image/jpeg', ACL='public-read')
    return cdn_url(key)


def handler(event: dict, context) -> dict:
    """Управление фото и описанием товаров Авито: загрузка, удаление, сортировка, bookmarklet."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    raw_body = event.get('body', '')
    try:
        body = json.loads(raw_body) if raw_body else {}
    except Exception:
        body = {}

    # bookmarklet_save имеет свою авторизацию через token в теле (employee auth_token)
    if action == 'bookmarklet_save':
        token = body.get('token', '')
        avito_id = body.get('avito_id')
        images = body.get('images') or []
        description = body.get('description', '')

        if not token:
            return err(403, 'forbidden')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id FROM {SCHEMA}.employees WHERE auth_token=%s AND is_active=true LIMIT 1",
            (token,),
        )
        if cur.fetchone() is None:
            cur.close()
            conn.close()
            return err(403, 'forbidden')

        if not avito_id or not images:
            cur.close()
            conn.close()
            return err(400, 'avito_id and images required')

        cur.execute(
            f"SELECT id, title FROM {SCHEMA}.avito_products WHERE avito_id=%s",
            (avito_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err(404, 'product not found')
        product_id, title = row

        photo_urls = []
        for img_b64 in images[:5]:
            try:
                photo_urls.append(upload_image(product_id, img_b64))
            except Exception:
                continue

        set_parts = ["photos=%s", "main_photo=%s", "updated_at=NOW()"]
        vals = [json.dumps(photo_urls), photo_urls[0] if photo_urls else None]
        if description:
            set_parts.append("description=%s")
            vals.append(description)
        vals.append(product_id)
        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET {', '.join(set_parts)} WHERE id=%s",
            tuple(vals),
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({'ok': True, 'added': len(photo_urls), 'title': title})

    if not has_access(headers_in):
        return err(403, 'forbidden')

    product_id = body.get('product_id')
    if not product_id:
        return err(400, 'product_id required')

    conn = get_conn()
    cur = conn.cursor()

    if action == 'upload':
        image_b64 = body.get('image_base64', '')
        if not image_b64:
            cur.close(); conn.close()
            return err(400, 'image_base64 required')
        cur.execute(f"SELECT photos FROM {SCHEMA}.avito_products WHERE id=%s", (product_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err(404, 'not found')
        photos = row[0] or []
        if len(photos) >= 5:
            cur.close(); conn.close()
            return err(400, 'max 5 photos')
        try:
            url = upload_image(product_id, image_b64)
        except Exception as e:
            cur.close(); conn.close()
            return err(400, f'upload failed: {e}')
        photos.append(url)
        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET photos=%s, main_photo=%s, updated_at=NOW() WHERE id=%s",
            (json.dumps(photos), photos[0], product_id),
        )
        conn.commit()
        cur.close(); conn.close()
        return ok({'ok': True, 'photos': photos, 'main_photo': photos[0]})

    if action == 'delete_photo':
        photo_url = body.get('photo_url', '')
        cur.execute(f"SELECT photos FROM {SCHEMA}.avito_products WHERE id=%s", (product_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err(404, 'not found')
        photos = [p for p in (row[0] or []) if p != photo_url]

        try:
            aki = os.environ['AWS_ACCESS_KEY_ID']
            prefix_str = f"https://cdn.poehali.dev/projects/{aki}/bucket/"
            if photo_url.startswith(prefix_str):
                key = photo_url[len(prefix_str):]
                get_s3().delete_object(Bucket=BUCKET, Key=key)
        except Exception:
            pass

        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET photos=%s, main_photo=%s, updated_at=NOW() WHERE id=%s",
            (json.dumps(photos), photos[0] if photos else None, product_id),
        )
        conn.commit()
        cur.close(); conn.close()
        return ok({'ok': True, 'photos': photos, 'main_photo': photos[0] if photos else None})

    if action == 'reorder':
        photos = body.get('photos') or []
        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET photos=%s, main_photo=%s, updated_at=NOW() WHERE id=%s",
            (json.dumps(photos), photos[0] if photos else None, product_id),
        )
        conn.commit()
        cur.close(); conn.close()
        return ok({'ok': True, 'photos': photos, 'main_photo': photos[0] if photos else None})

    if action == 'update':
        set_parts = ["updated_at=NOW()"]
        vals = []
        if 'description' in body:
            set_parts.append("description=%s")
            vals.append(body.get('description', ''))
        if 'is_visible' in body:
            set_parts.append("is_visible=%s")
            vals.append(bool(body.get('is_visible')))
        vals.append(product_id)
        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET {', '.join(set_parts)} WHERE id=%s",
            tuple(vals),
        )
        conn.commit()
        cur.close(); conn.close()
        return ok({'ok': True})

    cur.close(); conn.close()
    return err(400, 'unknown action')
