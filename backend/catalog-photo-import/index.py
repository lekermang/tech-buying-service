"""Импорт фото в каталог с внешнего URL с наложением брендовой заставки Скупки24.

Действия:
- action=list   — товары без фото (по бренду/модели)
- action=import — скачать фото с URL, наложить заставку, сохранить в S3, обновить catalog
- action=batch  — массовый импорт по списку [{item_id, photo_url}]
"""
import json
import os
import uuid
import io
import base64
import urllib.request
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
BUCKET = 'files'
PREFIX = 'catalog'

WATERMARK_URL = 'https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/e8e1312b-1620-4239-b89f-9b88afd67d1a.jpeg'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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


def has_access(headers_in: dict) -> bool:
    token = headers_in.get('x-admin-token', '') or headers_in.get('x-employee-token', '')
    return bool(token)


def fetch_image_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; CatalogBot/1.0)',
        'Referer': 'https://kaluga.istudio-shop.ru/',
    })
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read()


def process_image(photo_bytes: bytes, watermark_bytes: bytes) -> bytes:
    """Накладывает заставку Скупки24 на экран телефона на фото.

    Алгоритм:
    1. Открываем исходное фото
    2. Определяем примерную область экрана (центральная ~35% ширины, ~55% высоты)
    3. Масштабируем заставку под размер экрана
    4. Накладываем с прозрачностью 0.55 — выглядит как настоящая заставка
    5. Возвращаем JPEG байты
    """
    from PIL import Image, ImageEnhance

    # Открываем исходное фото
    img = Image.open(io.BytesIO(photo_bytes)).convert('RGBA')
    w, h = img.size

    # Открываем заставку
    wm = Image.open(io.BytesIO(watermark_bytes)).convert('RGBA')

    # Область экрана телефона: примерно центральная часть
    # Для фото с istudio-shop экран занимает ~центр изображения
    screen_x = int(w * 0.33)
    screen_y = int(h * 0.10)
    screen_w = int(w * 0.35)
    screen_h = int(h * 0.62)

    # Масштабируем заставку под экран
    wm_resized = wm.resize((screen_w, screen_h), Image.LANCZOS)

    # Делаем заставку полупрозрачной (0.55 opacity — выглядит естественно)
    r, g, b, a = wm_resized.split()
    a = ImageEnhance.Brightness(a).enhance(0.55)
    wm_resized = Image.merge('RGBA', (r, g, b, a))

    # Накладываем на исходное изображение
    img.paste(wm_resized, (screen_x, screen_y), wm_resized)

    # Конвертируем в RGB и сохраняем как JPEG
    result = img.convert('RGB')
    buf = io.BytesIO()
    result.save(buf, format='JPEG', quality=92, optimize=True)
    return buf.getvalue()


def import_single(item_id: int, photo_url: str, watermark_bytes: bytes) -> dict:
    """Скачивает, обрабатывает и сохраняет одно фото."""
    photo_bytes = fetch_image_bytes(photo_url)

    # Накладываем заставку
    processed = process_image(photo_bytes, watermark_bytes)

    # Загружаем в S3
    unique = uuid.uuid4().hex[:10]
    key = f"{PREFIX}/{item_id}/front_{unique}.jpg"
    s3 = get_s3()
    s3.put_object(Bucket=BUCKET, Key=key, Body=processed, ContentType='image/jpeg', ACL='public-read')
    url = cdn_url(key)

    # Сохраняем в catalog_photos и обновляем catalog
    conn = get_conn()
    cur = conn.cursor()

    # Получаем данные товара
    cur.execute(f"SELECT brand, model FROM {SCHEMA}.catalog WHERE id=%s", (item_id,))
    row = cur.fetchone()
    product_name = f"{row[0]} {row[1]}" if row else ''

    # sort_order
    cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s", (item_id,))
    sort_order = cur.fetchone()[0]

    cur.execute(
        f"""INSERT INTO {SCHEMA}.catalog_photos
            (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (item_id, f"SKY{item_id}", product_name, 'front', f"front_{unique}.jpg", url, sort_order, True),
    )

    # Обновляем счётчики в catalog
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s", (item_id,))
    total = cur.fetchone()[0]
    cur.execute(
        f"UPDATE {SCHEMA}.catalog SET photos_count=%s, has_photo=true, photo_url=%s, updated_at=now() WHERE id=%s",
        (total, url, item_id),
    )
    conn.commit()
    cur.close()
    conn.close()
    return {'item_id': item_id, 'url': url, 'ok': True}


def handler(event: dict, context) -> dict:
    """Импорт фото каталога с внешних URL с наложением заставки Скупки24."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'list')

    # ── GET list: товары без фото ─────────────────────────────────────────
    if method == 'GET' and action == 'list':
        brand = params.get('brand', 'Apple')
        limit = min(int(params.get('limit', '100')), 500)
        offset = int(params.get('offset', '0'))

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, category, brand, model, color, storage, sim_type, photo_url, has_photo
                FROM {SCHEMA}.catalog
                WHERE brand=%s AND is_active=true AND (photo_url IS NULL OR photo_url='')
                ORDER BY model, color
                LIMIT %s OFFSET %s""",
            (brand, limit, offset),
        )
        rows = cur.fetchall()
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog WHERE brand=%s AND is_active=true AND (photo_url IS NULL OR photo_url='')",
            (brand,),
        )
        total = cur.fetchone()[0]
        cur.close()
        conn.close()

        items = [
            {'id': r[0], 'category': r[1], 'brand': r[2], 'model': r[3],
             'color': r[4], 'storage': r[5], 'sim_type': r[6], 'photo_url': r[7], 'has_photo': r[8]}
            for r in rows
        ]
        return ok({'items': items, 'total': total})

    # ── POST import: одно фото ────────────────────────────────────────────
    if method == 'POST' and action == 'import':
        if not has_access(headers_in):
            return err(403, 'forbidden')

        raw = event.get('body', '') or ''
        body = json.loads(raw) if raw else {}
        item_id = body.get('item_id')
        photo_url = body.get('photo_url', '').strip()

        if not item_id or not photo_url:
            return err(400, 'item_id and photo_url required')

        # Загружаем заставку
        watermark_bytes = fetch_image_bytes(WATERMARK_URL)

        result = import_single(int(item_id), photo_url, watermark_bytes)
        return ok(result)

    # ── POST batch: массовый импорт ───────────────────────────────────────
    if method == 'POST' and action == 'batch':
        if not has_access(headers_in):
            return err(403, 'forbidden')

        raw = event.get('body', '') or ''
        body = json.loads(raw) if raw else {}
        items = body.get('items', [])  # [{item_id, photo_url}]

        if not items:
            return err(400, 'items array required')

        # Загружаем заставку один раз
        watermark_bytes = fetch_image_bytes(WATERMARK_URL)

        results = []
        for item in items[:50]:  # Максимум 50 за раз
            try:
                r = import_single(int(item['item_id']), item['photo_url'], watermark_bytes)
                results.append(r)
            except Exception as e:
                results.append({'item_id': item.get('item_id'), 'ok': False, 'error': str(e)})

        success = sum(1 for r in results if r.get('ok'))
        return ok({'results': results, 'success': success, 'total': len(results)})

    return err(405, 'method not allowed')
