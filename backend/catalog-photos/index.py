import json
import os
import re
import base64
import boto3
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')
MAX_PHOTOS = 5
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
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


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """API управления фотографиями товаров каталога: загрузка до 5 фото, просмотр, удаление"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')

    def check_admin():
        return admin_token == os.environ.get('ADMIN_TOKEN', '')

    # GET ?item_id=X — фото конкретного товара
    # GET — список товаров с кол-вом фото (поиск по ?search=)
    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        item_id = params.get('item_id')

        if item_id:
            cur.execute(
                f"""SELECT id, catalog_item_id, sku, product_name, photo_type,
                           file_name, url, sort_order, is_valid, created_at
                    FROM {SCHEMA}.catalog_photos
                    WHERE catalog_item_id = %s
                    ORDER BY sort_order""",
                (item_id,)
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            photos = [{
                'id': r[0], 'catalog_item_id': r[1], 'sku': r[2], 'product_name': r[3],
                'photo_type': r[4], 'file_name': r[5], 'url': r[6],
                'sort_order': r[7], 'is_valid': r[8], 'created_at': r[9],
            } for r in rows]
            return ok({'photos': photos, 'count': len(photos), 'can_add': len(photos) < MAX_PHOTOS})

        # Список товаров
        search = params.get('search', '').strip()
        page = int(params.get('page', 1))
        limit = 50
        offset = (page - 1) * limit

        where = ["c.is_active = true"]
        args = []
        if search:
            where.append("(c.brand ILIKE %s OR c.model ILIKE %s OR c.color ILIKE %s)")
            s = f'%{search}%'
            args += [s, s, s]

        cur.execute(
            f"""SELECT c.id, c.brand, c.model, c.color, c.storage, c.region,
                       c.category, c.price, c.availability, c.photo_url,
                       COUNT(p.id) as photo_count
                FROM {SCHEMA}.catalog c
                LEFT JOIN {SCHEMA}.catalog_photos p ON p.catalog_item_id = c.id
                WHERE {' AND '.join(where)}
                GROUP BY c.id, c.brand, c.model, c.color, c.storage, c.region,
                         c.category, c.price, c.availability, c.photo_url
                ORDER BY photo_count ASC, c.brand, c.model
                LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        rows = cur.fetchall()

        cur.execute(
            f"""SELECT COUNT(DISTINCT c.id) FROM {SCHEMA}.catalog c
                WHERE {' AND '.join(where)}""",
            args
        )
        total = cur.fetchone()[0]
        cur.close()
        conn.close()

        items = [{
            'id': r[0], 'brand': r[1], 'model': r[2], 'color': r[3],
            'storage': r[4], 'region': r[5], 'category': r[6],
            'price': r[7], 'availability': r[8], 'photo_url': r[9],
            'photo_count': int(r[10]), 'can_add': int(r[10]) < MAX_PHOTOS,
        } for r in rows]
        return ok({'items': items, 'total': total, 'page': page, 'pages': (total + limit - 1) // limit})

    # POST — загрузить фото для товара
    if method == 'POST':
        if not check_admin():
            return err(403, 'Нет доступа')

        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}

        item_id = body.get('item_id')
        file_name = body.get('file_name', 'photo.jpg')
        file_b64 = body.get('file_b64', '')
        content_type = body.get('content_type', 'image/jpeg')

        if not item_id or not file_b64:
            return err(400, 'Нужны: item_id, file_b64')

        conn = get_conn()
        cur = conn.cursor()

        # Проверяем лимит
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s",
            (item_id,)
        )
        count = cur.fetchone()[0]
        if count >= MAX_PHOTOS:
            cur.close()
            conn.close()
            return err(400, f'Максимум {MAX_PHOTOS} фото на товар')

        # Инфо о товаре
        cur.execute(
            f"SELECT brand, model, color, storage FROM {SCHEMA}.catalog WHERE id=%s",
            (item_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err(404, 'Товар не найден')

        brand, model, color, storage = row
        product_name = f"{brand} {model}" + (f" {color}" if color else "") + (f" {storage}" if storage else "")

        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
        sort_order = count + 1
        s3_key = f"catalog/items/{item_id}/photo_{sort_order:02d}.{ext}"

        try:
            s3 = get_s3()
            file_data = base64.b64decode(file_b64)
            s3.put_object(Bucket='files', Key=s3_key, Body=file_data, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
        except Exception as e:
            cur.close()
            conn.close()
            return err(500, f'Ошибка S3: {str(e)}')

        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog_photos
                (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
                VALUES (%s, %s, %s, 'front', %s, %s, %s, true) RETURNING id""",
            (item_id, str(item_id), product_name, f"photo_{sort_order:02d}.{ext}", cdn_url, sort_order)
        )
        new_id = cur.fetchone()[0]

        # Обновляем основной photo_url если это первое фото
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                has_photo = true,
                photos_count = %s,
                photo_url = CASE WHEN photo_url IS NULL OR photo_url = '' THEN %s ELSE photo_url END,
                updated_at = now()
                WHERE id = %s""",
            (sort_order, cdn_url, item_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return ok({'id': new_id, 'url': cdn_url, 'sort_order': sort_order, 'total': sort_order})

    # DELETE ?photo_id=X — удалить фото
    if method == 'DELETE':
        if not check_admin():
            return err(403, 'Нет доступа')

        photo_id = params.get('photo_id')
        if not photo_id:
            return err(400, 'Нужен photo_id')

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT catalog_item_id, url, sort_order FROM {SCHEMA}.catalog_photos WHERE id=%s",
            (photo_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return err(404, 'Фото не найдено')

        item_id, url, _ = row

        # Удаляем из S3
        try:
            s3 = get_s3()
            key = url.split('/bucket/')[-1]
            s3.delete_object(Bucket='files', Key=key)
        except Exception:
            pass

        cur.execute(f"DELETE FROM {SCHEMA}.catalog_photos WHERE id=%s", (photo_id,))

        # Пересчитываем
        cur.execute(
            f"SELECT url FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s ORDER BY sort_order LIMIT 1",
            (item_id,)
        )
        first = cur.fetchone()
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s",
            (item_id,)
        )
        new_count = cur.fetchone()[0]

        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                photos_count=%s,
                has_photo=%s,
                photo_url=%s,
                updated_at=now()
                WHERE id=%s""",
            (new_count, new_count > 0, first[0] if first else None, item_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({'ok': True, 'remaining': new_count})

    return err(400, 'Неизвестный метод')
