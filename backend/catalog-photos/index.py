import json
import os
import re
import base64
import boto3
import psycopg2
import uuid

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}
VALID_TYPES = ('front', 'detail', 'packaging', 'other')


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


def normalize(text: str) -> str:
    """Нормализует название: нижний регистр, только буквы/цифры, пробелы → _"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', '_', text)
    return text


def validate_filename(filename: str, product_name: str) -> bool:
    """Проверяет, что имя файла содержит нормализованное название товара"""
    norm_filename = normalize(filename.replace('-', '_').rsplit('.', 1)[0])
    norm_product = normalize(product_name)
    return norm_product in norm_filename


def handler(event: dict, context) -> dict:
    """API для управления фотографиями SKY-товаров в каталоге: загрузка, валидация, просмотр"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')

    def check_admin():
        return admin_token == os.environ.get('ADMIN_TOKEN', '')

    # GET — список фото для товара или всех SKY-товаров
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
                    ORDER BY sort_order, photo_type""",
                (item_id,)
            )
        else:
            # Все SKY-товары с количеством фото
            cur.execute(
                f"""SELECT c.id, c.sku, c.brand, c.model, c.category, c.price,
                           c.availability, c.photos_count,
                           COUNT(p.id) as real_count,
                           SUM(CASE WHEN p.is_valid THEN 1 ELSE 0 END) as valid_count
                    FROM {SCHEMA}.catalog c
                    LEFT JOIN {SCHEMA}.catalog_photos p ON p.catalog_item_id = c.id
                    WHERE c.category = 'SKY' AND c.is_active = true
                    GROUP BY c.id, c.sku, c.brand, c.model, c.category, c.price,
                             c.availability, c.photos_count
                    ORDER BY c.id DESC""",
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            items = [{
                'id': r[0], 'sku': r[1], 'brand': r[2], 'model': r[3],
                'category': r[4], 'price': r[5], 'availability': r[6],
                'photos_count': r[7] or 0,
                'real_count': r[8] or 0,
                'valid_count': r[9] or 0,
                'is_valid': (r[9] or 0) >= 3,
            } for r in rows]
            return ok({'items': items})

        rows = cur.fetchall()
        cur.close()
        conn.close()
        photos = [{
            'id': r[0], 'catalog_item_id': r[1], 'sku': r[2], 'product_name': r[3],
            'photo_type': r[4], 'file_name': r[5], 'url': r[6],
            'sort_order': r[7], 'is_valid': r[8], 'created_at': r[9],
        } for r in rows]

        # Валидация: минимум 3 валидных фото
        is_ok = len([p for p in photos if p['is_valid']]) >= 3
        return ok({'photos': photos, 'is_valid': is_ok, 'count': len(photos)})

    # POST — загрузить фото
    if method == 'POST':
        if not check_admin():
            return err(403, 'Нет доступа')

        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}

        item_id = body.get('item_id')
        sku = body.get('sku', '').strip().upper()
        product_name = body.get('product_name', '').strip()
        photo_type = body.get('photo_type', 'front')
        file_name = body.get('file_name', '')
        file_b64 = body.get('file_b64', '')
        content_type = body.get('content_type', 'image/jpeg')

        if not all([item_id, sku, product_name, file_name, file_b64]):
            return err(400, 'Не хватает полей: item_id, sku, product_name, file_name, file_b64')

        if photo_type not in VALID_TYPES:
            photo_type = 'other'

        # Валидируем имя файла
        is_valid = validate_filename(file_name, product_name)

        # Генерируем правильное имя по шаблону
        ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
        norm_name = normalize(product_name)
        sort_order = 1

        # Считаем текущее кол-во фото этого типа для нумерации
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id = %s AND photo_type = %s",
            (item_id, photo_type)
        )
        count = cur.fetchone()[0]
        sort_order = count + 1

        canonical_name = f"{sku}_{norm_name}_{photo_type}_{sort_order:02d}.{ext}"

        # Загружаем в S3
        try:
            s3 = get_s3()
            file_data = base64.b64decode(file_b64)
            s3_key = f"catalog/sky/{sku}/{canonical_name}"
            s3.put_object(
                Bucket='files',
                Key=s3_key,
                Body=file_data,
                ContentType=content_type,
            )
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
        except Exception as e:
            cur.close()
            conn.close()
            return err(500, f'Ошибка загрузки фото: {str(e)}')

        # Сохраняем в БД
        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog_photos
                (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (item_id, sku, product_name, photo_type, canonical_name, cdn_url, sort_order, is_valid)
        )
        new_id = cur.fetchone()[0]

        # Обновляем photos_count и photo_url у товара
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog
                SET photos_count = (SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id = %s),
                    has_photo = true,
                    photo_url = CASE WHEN photo_url IS NULL THEN %s ELSE photo_url END,
                    updated_at = now()
                WHERE id = %s""",
            (item_id, cdn_url, item_id)
        )
        conn.commit()

        # Проверяем итоговую валидность (>=3 валидных фото)
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id = %s AND is_valid = true",
            (item_id,)
        )
        valid_count = cur.fetchone()[0]
        cur.close()
        conn.close()

        return ok({
            'id': new_id,
            'url': cdn_url,
            'file_name': canonical_name,
            'is_valid': is_valid,
            'valid_count': valid_count,
            'item_is_valid': valid_count >= 3,
            'warning': None if is_valid else f'Имя файла не содержит название товара "{product_name}". Фото принято, но помечено как невалидное.',
        })

    return err(400, 'Неизвестный метод')
