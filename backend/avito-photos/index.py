import json
import os
import base64
import time
import hashlib
import urllib.request
from typing import Any
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')
EMPLOYEE_AUTH_URL = 'https://functions.poehali.dev/29210248-0b73-4c54-9b9f-acd13668dfea'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def auth_employee(token: str) -> dict | None:
    if not token:
        return None
    try:
        req = urllib.request.Request(
            EMPLOYEE_AUTH_URL,
            headers={'X-Employee-Token': token, 'X-Auth-Token': token},
            method='GET',
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
        if data.get('id'):
            return data
    except Exception:
        return None
    return None


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def list_products(query: str, status: str, has_photo: str, offset: int, limit: int) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        where = ["status = 'active'"]
        params: list = []
        if query:
            where.append("(LOWER(title) LIKE %s OR CAST(avito_id AS TEXT) LIKE %s)")
            ql = f'%{query.lower()}%'
            params.extend([ql, ql])
        if has_photo == 'yes':
            where.append("jsonb_array_length(photos) > 0")
        elif has_photo == 'no':
            where.append("(photos IS NULL OR jsonb_array_length(photos) = 0)")

        where_sql = ' AND '.join(where)
        cur.execute(
            f"SELECT COUNT(*) AS n FROM {SCHEMA}.avito_products WHERE {where_sql}",
            tuple(params),
        )
        total = cur.fetchone()['n']

        cur.execute(
            f"""SELECT id, avito_id, title, price, url, address, category,
                   photos, main_photo, description, is_visible, sort_order
                FROM {SCHEMA}.avito_products
                WHERE {where_sql}
                ORDER BY
                    (CASE WHEN jsonb_array_length(photos) > 0 THEN 1 ELSE 0 END) DESC,
                    sort_order DESC,
                    synced_at DESC
                LIMIT %s OFFSET %s""",
            tuple(params + [limit, offset]),
        )
        items = [dict(r) for r in cur.fetchall()]

        cur.execute(
            f"""SELECT
                COUNT(*) FILTER (WHERE jsonb_array_length(photos) > 0) AS with_photos,
                COUNT(*) FILTER (WHERE photos IS NULL OR jsonb_array_length(photos) = 0) AS no_photos,
                COUNT(*) AS total_active
                FROM {SCHEMA}.avito_products WHERE status='active'"""
        )
        st = dict(cur.fetchone())

        return {'items': items, 'total': total, 'stats': st}
    finally:
        cur.close()
        conn.close()


def get_product(product_id: int) -> dict | None:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"""SELECT id, avito_id, title, price, url, address, category,
                   photos, main_photo, description, is_visible, sort_order
                FROM {SCHEMA}.avito_products WHERE id=%s""",
            (product_id,),
        )
        r = cur.fetchone()
        return dict(r) if r else None
    finally:
        cur.close()
        conn.close()


def upload_photo(product_id: int, image_b64: str) -> dict:
    if ',' in image_b64:
        image_b64 = image_b64.split(',', 1)[1]
    raw = base64.b64decode(image_b64)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('Файл слишком большой (макс 8 МБ)')

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT avito_id, photos FROM {SCHEMA}.avito_products WHERE id=%s",
            (product_id,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError('Товар не найден')
        avito_id = row['avito_id']
        photos = list(row['photos'] or [])
        if len(photos) >= 5:
            raise ValueError('Максимум 5 фото на товар')

        s3 = get_s3()
        ts = int(time.time() * 1000)
        h = hashlib.md5(raw).hexdigest()[:8]
        key = f'avito/{avito_id}/{ts}_{h}.jpg'
        s3.put_object(Bucket='files', Key=key, Body=raw, ContentType='image/jpeg', ACL='public-read')
        url = cdn_url(key)
        photos.append(url)
        main = photos[0]

        cur.execute(
            f"""UPDATE {SCHEMA}.avito_products
                SET photos=%s, main_photo=%s, updated_at=NOW()
                WHERE id=%s""",
            (Json(photos), main, product_id),
        )
        conn.commit()
        return {'photos': photos, 'main_photo': main, 'added': url}
    finally:
        cur.close()
        conn.close()


def delete_photo(product_id: int, photo_url: str) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT photos FROM {SCHEMA}.avito_products WHERE id=%s",
            (product_id,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError('Товар не найден')
        photos = [p for p in (row['photos'] or []) if p != photo_url]
        main = photos[0] if photos else None
        cur.execute(
            f"""UPDATE {SCHEMA}.avito_products
                SET photos=%s, main_photo=%s, updated_at=NOW()
                WHERE id=%s""",
            (Json(photos), main, product_id),
        )
        conn.commit()
        return {'photos': photos, 'main_photo': main}
    finally:
        cur.close()
        conn.close()


def reorder_photos(product_id: int, photos_order: list) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT photos FROM {SCHEMA}.avito_products WHERE id=%s",
            (product_id,),
        )
        row = cur.fetchone()
        if not row:
            raise ValueError('Товар не найден')
        existing = set(row['photos'] or [])
        new_order = [p for p in photos_order if p in existing]
        for p in (row['photos'] or []):
            if p not in new_order:
                new_order.append(p)
        main = new_order[0] if new_order else None
        cur.execute(
            f"""UPDATE {SCHEMA}.avito_products
                SET photos=%s, main_photo=%s, updated_at=NOW()
                WHERE id=%s""",
            (Json(new_order), main, product_id),
        )
        conn.commit()
        return {'photos': new_order, 'main_photo': main}
    finally:
        cur.close()
        conn.close()


def update_product(product_id: int, body: dict) -> dict:
    fields = []
    values: list = []
    if 'description' in body:
        fields.append('description=%s')
        values.append((body.get('description') or '').strip())
    if 'is_visible' in body:
        fields.append('is_visible=%s')
        values.append(bool(body.get('is_visible')))
    if 'sort_order' in body:
        try:
            fields.append('sort_order=%s')
            values.append(int(body.get('sort_order') or 0))
        except Exception:
            pass
    if 'price' in body and body.get('price') is not None:
        try:
            fields.append('price=%s')
            values.append(int(body.get('price')))
        except Exception:
            pass
    if not fields:
        return {'updated': False}
    fields.append('updated_at=NOW()')
    values.append(product_id)

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.avito_products SET {', '.join(fields)} WHERE id=%s",
            tuple(values),
        )
        conn.commit()
        return {'updated': True}
    finally:
        cur.close()
        conn.close()


def handler(event: dict, context: Any) -> dict:
    """Управление фотографиями и описаниями товаров с Авито (для сотрудников). Поддерживает загрузку с телефона, удаление, переупорядочивание, скрытие из витрины."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    token = headers.get('X-Employee-Token') or headers.get('x-employee-token') \
        or headers.get('X-Auth-Token') or headers.get('x-auth-token') or ''

    emp = auth_employee(token)
    if not emp:
        return _resp(401, {'ok': False, 'error': 'Требуется авторизация сотрудника'})

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'list')

    try:
        if method == 'GET':
            if action == 'list':
                q = (qs.get('q') or '').strip()
                status = qs.get('status') or 'active'
                has_photo = qs.get('has_photo') or 'all'
                offset = max(int(qs.get('offset') or 0), 0)
                limit = min(int(qs.get('limit') or 30), 200)
                return _resp(200, {'ok': True, **list_products(q, status, has_photo, offset, limit)})
            if action == 'detail':
                pid = int(qs.get('id') or 0)
                p = get_product(pid)
                if not p:
                    return _resp(404, {'ok': False, 'error': 'not found'})
                return _resp(200, {'ok': True, 'item': p})
            return _resp(400, {'ok': False, 'error': 'unknown action'})

        body = {}
        raw = event.get('body') or '{}'
        if event.get('isBase64Encoded'):
            raw = base64.b64decode(raw).decode('utf-8')
        try:
            body = json.loads(raw)
        except Exception:
            body = {}

        if method == 'POST' and action == 'upload':
            pid = int(body.get('product_id') or 0)
            img = body.get('image_base64') or ''
            if not pid or not img:
                return _resp(400, {'ok': False, 'error': 'product_id и image_base64 обязательны'})
            return _resp(200, {'ok': True, **upload_photo(pid, img)})

        if method == 'POST' and action == 'bulk_upload':
            pid = int(body.get('product_id') or 0)
            images = body.get('images') or []
            if not pid or not isinstance(images, list) or not images:
                return _resp(400, {'ok': False, 'error': 'product_id и images[] обязательны'})
            ok_count = 0
            errors: list = []
            last_state = None
            for img in images[:5]:
                try:
                    res = upload_photo(pid, img)
                    last_state = res
                    ok_count += 1
                except Exception as e:
                    errors.append(str(e))
            return _resp(200, {
                'ok': True,
                'uploaded': ok_count,
                'errors': errors,
                'photos': last_state['photos'] if last_state else [],
                'main_photo': last_state['main_photo'] if last_state else None,
            })

        if method == 'POST' and action == 'delete_photo':
            pid = int(body.get('product_id') or 0)
            url = body.get('photo_url') or ''
            if not pid or not url:
                return _resp(400, {'ok': False, 'error': 'product_id и photo_url обязательны'})
            return _resp(200, {'ok': True, **delete_photo(pid, url)})

        if method == 'POST' and action == 'reorder':
            pid = int(body.get('product_id') or 0)
            order = body.get('photos') or []
            if not pid or not isinstance(order, list):
                return _resp(400, {'ok': False, 'error': 'product_id и photos[] обязательны'})
            return _resp(200, {'ok': True, **reorder_photos(pid, order)})

        if method == 'POST' and action == 'update':
            pid = int(body.get('product_id') or 0)
            if not pid:
                return _resp(400, {'ok': False, 'error': 'product_id обязателен'})
            return _resp(200, {'ok': True, **update_product(pid, body)})

        return _resp(400, {'ok': False, 'error': 'unknown action'})
    except ValueError as ve:
        return _resp(400, {'ok': False, 'error': str(ve)})
    except Exception as e:
        return _resp(500, {'ok': False, 'error': str(e)})