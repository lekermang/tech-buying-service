"""Telegram channel photo importer (userbot via Telethon).

Читает историю канала @appledysonphoto, выгружает фото в S3 и привязывает к товарам в catalog_photos.

Запуск:
- POST {action: "scan", limit?: 200, offset_id?: 0} — сканирует N сообщений и пишет в S3
- POST {action: "status"} — текущий прогресс из таблицы tg_channel_import_log
- GET — последний лог импорта

Подбор товара: по тексту caption ищется brand+model+storage+color, бьётся с catalog
с приоритетом совпадения по нескольким полям.
"""
import json
import os
import re
import io
import asyncio
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
BUCKET = 'files'
PREFIX = 'catalog'
CHANNEL = '@appledysonphoto'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


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


# ---- Подбор товара по тексту ----

STORAGE_RE = re.compile(r'\b(64|128|256|512|1024|2048)\s*(GB|TB)?\b', re.IGNORECASE)
TB_RE = re.compile(r'\b([12])\s*TB\b', re.IGNORECASE)
PRICE_RE = re.compile(r'[-–—]\s*(\d[\d\s]{2,})')

BRAND_KEYWORDS = [
    ('iphone', 'Apple', 'iPhone'),
    ('ipad', 'Apple', 'iPad'),
    ('macbook', 'Apple', 'MacBook'),
    ('airpods', 'Apple', 'AirPods'),
    ('apple watch', 'Apple', 'Apple Watch'),
    ('apple pencil', 'Apple', 'Apple Pencil'),
    ('mac mini', 'Apple', 'Mac Mini'),
    ('imac', 'Apple', 'iMac'),
    ('samsung', 'Samsung', 'Samsung'),
    ('galaxy', 'Samsung', 'Samsung'),
    ('xiaomi', 'Xiaomi', 'Xiaomi'),
    ('redmi', 'Xiaomi', 'Xiaomi'),
    ('poco', 'Xiaomi', 'POCO'),
    ('huawei', 'Huawei', 'Huawei'),
    ('honor', 'Honor', 'Honor'),
    ('pixel', 'Google', 'Pixel'),
    ('oneplus', 'OnePlus', 'OnePlus'),
    ('realme', 'Realme', 'Realme'),
    ('nothing', 'Nothing', 'Nothing Phone'),
    ('dyson', 'Dyson', 'Dyson'),
    ('marshall', 'Marshall', 'Marshall'),
    ('jbl', 'JBL', 'JBL'),
    ('sony', 'Sony', 'Sony'),
    ('xbox', 'Microsoft', 'Xbox'),
    ('nintendo', 'Nintendo', 'Nintendo'),
    ('gopro', 'GoPro', 'GoPro'),
    ('insta 360', 'Insta360', 'Insta360'),
    ('garmin', 'Garmin', 'Garmin'),
    ('яндекс', 'Яндекс', 'Яндекс'),
    ('yandex', 'Яндекс', 'Яндекс'),
]


def detect_brand_model(text: str):
    if not text:
        return None, None
    tl = text.lower()
    for kw, brand, model in BRAND_KEYWORDS:
        if kw in tl:
            return brand, model
    return None, None


def extract_storage(text: str):
    if not text:
        return None
    tb = TB_RE.search(text)
    if tb:
        return tb.group(1) + 'TB'
    m = STORAGE_RE.search(text)
    if m:
        unit = (m.group(2) or 'GB').upper()
        return m.group(1) + unit
    return None


def extract_iphone_full(text: str):
    """Из 'iPhone 17 Pro Max' возвращает 'iPhone 17 Pro Max'."""
    m = re.search(r'iphone\s+(\d{1,2}\s*(?:pro\s*max|pro|plus|mini|air)?)', text or '', re.IGNORECASE)
    if m:
        return 'iPhone ' + re.sub(r'\s+', ' ', m.group(1).strip())
    return None


def find_catalog_match(cur, caption: str):
    """Ищет товар в catalog по brand+model+storage. Возвращает id или None."""
    if not caption:
        return None
    brand, base_model = detect_brand_model(caption)
    if not brand:
        return None
    storage = extract_storage(caption)
    full_iphone = extract_iphone_full(caption) if base_model == 'iPhone' else None
    model = full_iphone or base_model

    # Точное: brand + model + storage
    if storage:
        cur.execute(
            f"""SELECT id FROM {SCHEMA}.catalog
                WHERE is_active=true AND brand=%s AND LOWER(model) LIKE %s AND storage=%s
                ORDER BY photos_count ASC NULLS FIRST LIMIT 1""",
            (brand, f"%{model.lower()}%", storage),
        )
        row = cur.fetchone()
        if row:
            return row[0]

    # Без storage
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.catalog
            WHERE is_active=true AND brand=%s AND LOWER(model) LIKE %s
            ORDER BY photos_count ASC NULLS FIRST LIMIT 1""",
        (brand, f"%{model.lower()}%"),
    )
    row = cur.fetchone()
    return row[0] if row else None


# ---- Telethon import ----

def telethon_available() -> bool:
    try:
        import telethon  # noqa: F401
        return True
    except ImportError:
        return False


async def import_photos_async(limit: int, offset_id: int, log_id: int):
    from telethon import TelegramClient
    from telethon.sessions import StringSession

    api_id = int(os.environ.get('TG_API_ID', '0'))
    api_hash = os.environ.get('TG_API_HASH', '')
    session = os.environ.get('TG_SESSION_STRING', '')

    if not (api_id and api_hash and session):
        return {'error': 'TG_API_ID / TG_API_HASH / TG_SESSION_STRING not set'}

    s3 = get_s3()
    conn = get_conn()
    cur = conn.cursor()

    matched = 0
    no_match = 0
    no_photo = 0
    last_id = offset_id
    errors = 0

    async with TelegramClient(StringSession(session), api_id, api_hash) as client:
        async for message in client.iter_messages(CHANNEL, limit=limit, offset_id=offset_id):
            try:
                last_id = message.id
                if not message.photo:
                    no_photo += 1
                    continue
                caption = (message.message or '').strip()
                if not caption:
                    no_match += 1
                    continue

                catalog_id = find_catalog_match(cur, caption)
                if not catalog_id:
                    no_match += 1
                    continue

                cur.execute(
                    f"""SELECT 1 FROM {SCHEMA}.catalog_photos
                        WHERE catalog_item_id=%s AND file_name=%s LIMIT 1""",
                    (catalog_id, f"tg_{message.id}.jpg"),
                )
                if cur.fetchone():
                    matched += 1
                    continue

                buf = io.BytesIO()
                await client.download_media(message, file=buf)
                data = buf.getvalue()
                if not data:
                    errors += 1
                    continue

                key = f"{PREFIX}/{catalog_id}/tg_{message.id}.jpg"
                s3.put_object(
                    Bucket=BUCKET, Key=key, Body=data,
                    ContentType='image/jpeg', ACL='public-read',
                )
                url = cdn_url(key)

                cur.execute(
                    f"""SELECT COALESCE(MAX(sort_order),0)+1 FROM {SCHEMA}.catalog_photos
                        WHERE catalog_item_id=%s""",
                    (catalog_id,),
                )
                sort_order = cur.fetchone()[0]
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.catalog_photos
                        (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (catalog_id, f"SKY{catalog_id}", caption[:200], 'front',
                     f"tg_{message.id}.jpg", url, sort_order, True),
                )
                cur.execute(
                    f"""UPDATE {SCHEMA}.catalog SET
                        photos_count = COALESCE(photos_count,0)+1,
                        has_photo = true,
                        photo_url = COALESCE(photo_url, %s),
                        updated_at = now()
                        WHERE id=%s""",
                    (url, catalog_id),
                )
                conn.commit()
                matched += 1
            except Exception as e:
                errors += 1
                print(f"[tg-channel-import] msg={message.id if message else '?'} error={e}")

    cur.execute(
        f"""UPDATE {SCHEMA}.tg_channel_import_log
            SET matched=%s, no_match=%s, no_photo=%s, errors=%s, last_id=%s, finished_at=now()
            WHERE id=%s""",
        (matched, no_match, no_photo, errors, last_id, log_id),
    )
    conn.commit()
    cur.close()
    conn.close()

    return {
        'matched': matched, 'no_match': no_match, 'no_photo': no_photo,
        'errors': errors, 'last_id': last_id,
    }


def handler(event: dict, context) -> dict:
    """Импорт фото из канала Telegram в каталог сайта (userbot Telethon)."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin = headers_in.get('x-admin-token', '')
    if admin != os.environ.get('ADMIN_TOKEN', ''):
        return err(403, 'forbidden')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, started_at, finished_at, matched, no_match, no_photo, errors, last_id
                FROM {SCHEMA}.tg_channel_import_log
                ORDER BY id DESC LIMIT 5"""
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return ok({'history': [
            {'id': r[0], 'started_at': r[1], 'finished_at': r[2],
             'matched': r[3], 'no_match': r[4], 'no_photo': r[5],
             'errors': r[6], 'last_id': r[7]}
            for r in rows
        ]})

    if method == 'POST':
        if not telethon_available():
            return err(500, 'telethon not installed')
        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}
        action = body.get('action', 'scan')

        if action == 'scan':
            limit = min(int(body.get('limit', 100)), 500)
            offset_id = int(body.get('offset_id', 0))

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.tg_channel_import_log
                    (channel, started_at, requested_limit, offset_id)
                    VALUES (%s, now(), %s, %s) RETURNING id""",
                (CHANNEL, limit, offset_id),
            )
            log_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            conn.close()

            try:
                result = asyncio.run(import_photos_async(limit, offset_id, log_id))
            except Exception as e:
                return err(500, f'import failed: {e}')
            result['log_id'] = log_id
            return ok(result)

        return err(400, 'unknown action')

    return err(405, 'method not allowed')
