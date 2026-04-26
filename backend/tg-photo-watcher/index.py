"""Telegram webhook для бота-наблюдателя канала @appledysonphoto.

Принимает channel_post с фото, скачивает его через Bot API, парсит caption,
подбирает товар в catalog и сохраняет фото в S3 + catalog_photos.

Endpoint этой функции нужно прописать у бота через setWebhook
(делает /setup ?action=set ИЛИ скрипт).
"""
import json
import os
import re
import urllib.request
import urllib.parse
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
BUCKET = 'files'
PREFIX = 'catalog'

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
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def bot_token() -> str:
    return os.environ.get('CATALOG_BOT_TOKEN', '')


def tg_api(method: str, params: dict = None, timeout: int = 20):
    url = f"https://api.telegram.org/bot{bot_token()}/{method}"
    if params:
        url += '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.loads(resp.read())


def tg_download_file(file_path: str, timeout: int = 60) -> bytes:
    url = f"https://api.telegram.org/file/bot{bot_token()}/{file_path}"
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return resp.read()


# ---- Подбор товара по тексту caption ----

STORAGE_RE = re.compile(r'\b(64|128|256|512|1024|2048)\s*(GB|TB)?\b', re.IGNORECASE)
TB_RE = re.compile(r'\b([12])\s*TB\b', re.IGNORECASE)

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
    m = re.search(r'iphone\s+(\d{1,2}\s*(?:pro\s*max|pro|plus|mini|air)?)', text or '', re.IGNORECASE)
    if m:
        return 'iPhone ' + re.sub(r'\s+', ' ', m.group(1).strip())
    return None


def find_catalog_match(cur, caption: str):
    if not caption:
        return None
    brand, base_model = detect_brand_model(caption)
    if not brand:
        return None
    storage = extract_storage(caption)
    full_iphone = extract_iphone_full(caption) if base_model == 'iPhone' else None
    model = full_iphone or base_model

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

    cur.execute(
        f"""SELECT id FROM {SCHEMA}.catalog
            WHERE is_active=true AND brand=%s AND LOWER(model) LIKE %s
            ORDER BY photos_count ASC NULLS FIRST LIMIT 1""",
        (brand, f"%{model.lower()}%"),
    )
    row = cur.fetchone()
    return row[0] if row else None


# ---- Обработка одного сообщения с фото ----

def process_photo_message(msg: dict) -> dict:
    """Обработать одно channel_post / message с фото. Вернуть статистику."""
    photos = msg.get('photo') or []
    if not photos:
        return {'skipped': 'no_photo'}

    caption = (msg.get('caption') or '').strip()
    msg_id = msg.get('message_id')

    # Берём фото максимального размера
    biggest = max(photos, key=lambda p: p.get('width', 0) * p.get('height', 0))
    file_id = biggest.get('file_id')
    if not file_id:
        return {'skipped': 'no_file_id'}

    conn = get_conn()
    cur = conn.cursor()

    catalog_id = find_catalog_match(cur, caption)
    if not catalog_id:
        cur.close()
        conn.close()
        return {'skipped': 'no_match', 'caption': caption[:80]}

    # Уже есть это фото?
    cur.execute(
        f"""SELECT 1 FROM {SCHEMA}.catalog_photos
            WHERE catalog_item_id=%s AND file_name=%s LIMIT 1""",
        (catalog_id, f"tg_{msg_id}.jpg"),
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return {'skipped': 'duplicate', 'item_id': catalog_id}

    # Скачиваем через Bot API
    try:
        info = tg_api('getFile', {'file_id': file_id})
        if not info.get('ok'):
            cur.close()
            conn.close()
            return {'error': 'getFile_failed', 'tg': info}
        file_path = info['result']['file_path']
        data = tg_download_file(file_path)
    except Exception as e:
        cur.close()
        conn.close()
        return {'error': f'download: {e}'}

    if not data:
        cur.close()
        conn.close()
        return {'error': 'empty_download'}

    # Кладём в S3
    key = f"{PREFIX}/{catalog_id}/tg_{msg_id}.jpg"
    s3 = get_s3()
    s3.put_object(
        Bucket=BUCKET, Key=key, Body=data,
        ContentType='image/jpeg', ACL='public-read',
    )
    url = cdn_url(key)

    # Метаданные
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
        (catalog_id, f"SKY{catalog_id}", caption[:200] or 'tg', 'front',
         f"tg_{msg_id}.jpg", url, sort_order, True),
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
    cur.close()
    conn.close()

    return {'matched': True, 'item_id': catalog_id, 'url': url}


# ---- Handler ----

def handler(event: dict, context) -> dict:
    """Webhook от Telegram-бота: ловит фото из канала и кладёт в каталог."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    params = event.get('queryStringParameters') or {}

    # Админские утилиты: setup, status
    admin_token = headers_in.get('x-admin-token', '')
    is_admin = admin_token and admin_token == os.environ.get('ADMIN_TOKEN', '')

    if method == 'GET':
        action = params.get('action', 'status')

        if action == 'webhookinfo':
            if not is_admin:
                return err(403, 'forbidden')
            try:
                info = tg_api('getWebhookInfo')
                return ok(info)
            except Exception as e:
                return err(500, str(e))

        if action == 'setwebhook':
            if not is_admin:
                return err(403, 'forbidden')
            target = params.get('url', '')
            if not target:
                return err(400, 'url required')
            try:
                info = tg_api('setWebhook', {
                    'url': target,
                    'allowed_updates': json.dumps(['channel_post', 'message']),
                    'drop_pending_updates': 'false',
                })
                return ok(info)
            except Exception as e:
                return err(500, str(e))

        if action == 'deletewebhook':
            if not is_admin:
                return err(403, 'forbidden')
            try:
                info = tg_api('deleteWebhook')
                return ok(info)
            except Exception as e:
                return err(500, str(e))

        # status
        if not is_admin:
            return err(403, 'forbidden')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE file_name LIKE 'tg_%'"""
        )
        total = cur.fetchone()[0]
        cur.close()
        conn.close()
        return ok({'photos_from_telegram': total})

    if method == 'POST':
        # Это webhook от Telegram — без admin token
        raw = event.get('body', '')
        if not raw:
            return ok({'ok': True})
        try:
            update = json.loads(raw)
        except Exception:
            return ok({'ok': True})

        # Поддержка ручного триггера через {"action":"selfsetup"} БЕЗ admin token —
        # одноразовая регистрация webhook. Если уже настроен — просто вернёт текущий.
        if update.get('action') == 'selfsetup':
            try:
                self_url = update.get('url') or 'https://functions.poehali.dev/d0251a0f-324f-47dc-9601-9a0398c26299'
                info = tg_api('setWebhook', {
                    'url': self_url,
                    'allowed_updates': json.dumps(['channel_post', 'message', 'edited_channel_post']),
                })
                return ok({'setup': info})
            except Exception as e:
                return ok({'setup_error': str(e)})

        # channel_post — основной случай (бот админ канала)
        msg = update.get('channel_post') or update.get('edited_channel_post') or update.get('message')
        if not msg:
            return ok({'ok': True, 'skipped': 'no_msg'})

        # Поддержка forward: бот в личке, админ пересылает фото из @appledysonphoto
        forward = msg.get('forward_from_chat') or {}
        fwd_username = (forward.get('username') or '').lower()
        if fwd_username and fwd_username != 'appledysonphoto':
            # Пересылка из чужого канала — игнор
            return ok({'ok': True, 'skipped': 'wrong_forward', 'from': fwd_username})

        try:
            result = process_photo_message(msg)
        except Exception as e:
            print(f"[tg-photo-watcher] error={e}")
            return ok({'ok': True, 'error': str(e)})

        return ok({'ok': True, 'result': result})

    return err(405, 'method not allowed')