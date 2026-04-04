import json
import os
import re
import base64
import urllib.request
import urllib.parse
import psycopg2
import boto3

SCHEMA = 't_p31606708_tech_buying_service'
PRICE_MARKUP = 3500
MAX_PHOTOS = 5

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Telegram-Bot-Api-Secret-Token',
}

REGION_FLAGS = {
    '🇷🇺': 'RU', '🇺🇸': 'US', '🇪🇺': 'EU', '🇨🇳': 'CN',
    '🇭🇰': 'HK', '🇯🇵': 'JP', '🇰🇷': 'KR', '🇦🇪': 'AE',
    '🇬🇧': 'GB', '🇹🇼': 'TW',
}

BRAND_RULES = [
    (['iphone'],               'Apple',     'iPhone',       'Смартфоны'),
    (['ipad'],                 'Apple',     'iPad',         'Планшеты'),
    (['macbook'],              'Apple',     'MacBook',      'Ноутбуки'),
    (['airpods'],              'Apple',     'AirPods',      'Наушники'),
    (['apple watch', 'watch'], 'Apple',     'Apple Watch',  'Умные часы'),
    (['mac mini'],             'Apple',     'Mac Mini',     'Компьютеры'),
    (['imac'],                 'Apple',     'iMac',         'Компьютеры'),
    (['samsung'],              'Samsung',   'Samsung',      'Смартфоны'),
    (['xiaomi', 'redmi'],      'Xiaomi',    'Xiaomi',       'Смартфоны'),
    (['poco'],                 'Xiaomi',    'POCO',         'Смартфоны'),
    (['realme'],               'Realme',    'Realme',       'Смартфоны'),
    (['oneplus'],              'OnePlus',   'OnePlus',      'Смартфоны'),
    (['honor'],                'Honor',     'Honor',        'Смартфоны'),
    (['pixel'],                'Google',    'Pixel',        'Смартфоны'),
    (['dyson'],                'Dyson',     'Dyson',        'Техника'),
    (['sony'],                 'Sony',      'Sony',         'Техника'),
    (['garmin'],               'Garmin',    'Garmin',       'Умные часы'),
    (['jbl'],                  'JBL',       'JBL',          'Наушники'),
    (['xbox'],                 'Microsoft', 'Xbox',         'Игровые консоли'),
    (['gopro'],                'GoPro',     'GoPro',        'Камеры'),
]


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def tg_api(method, params=None, data=None):
    token = os.environ['CATALOG_BOT_TOKEN']
    url = f'https://api.telegram.org/bot{token}/{method}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    req = urllib.request.Request(url)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode()
        with urllib.request.urlopen(req, body, timeout=20) as r:
            return json.loads(r.read())
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


def tg_download(file_id):
    """Скачивает файл из Telegram, возвращает bytes"""
    token = os.environ['CATALOG_BOT_TOKEN']
    res = tg_api('getFile', {'file_id': file_id})
    if not res.get('ok'):
        return None, None
    path = res['result']['file_path']
    file_url = f'https://api.telegram.org/file/bot{token}/{path}'
    ext = path.rsplit('.', 1)[-1].lower() if '.' in path else 'jpg'
    with urllib.request.urlopen(file_url, timeout=30) as r:
        return r.read(), ext


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def upload_photo_s3(file_data, ext, item_id, sort_order):
    """Загружает фото в S3, возвращает CDN URL"""
    s3 = get_s3()
    key = f"catalog/items/{item_id}/photo_{sort_order:02d}.{ext}"
    content_type = 'image/jpeg' if ext in ('jpg', 'jpeg') else f'image/{ext}'
    s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url


def strip_emojis(text):
    emoji_pattern = re.compile(
        "[\U00002600-\U000027BF\U0001F300-\U0001F9FF"
        "\U00002702-\U000027B0\U0000FE00-\U0000FE0F"
        "\U00010000-\U0010FFFF\u200d\u2640\u2642\ufe0f\u20e3]+",
        flags=re.UNICODE)
    return emoji_pattern.sub('', text).strip()


def detect_brand(text):
    tl = text.lower()
    for keywords, brand, base_model, category in BRAND_RULES:
        if any(kw in tl for kw in keywords):
            return brand, base_model, category
    return None, None, 'Прочее'


def parse_price_line(line, current_model):
    region = None
    for flag, code in REGION_FLAGS.items():
        if flag in line:
            region = code
            break

    availability = 'in_stock' if '✅' in line else 'on_order'
    has_photo_marker = '📸' in line or '📷' in line
    clean = strip_emojis(line)
    clean = re.sub(r'\s+', ' ', clean).strip()

    price_match = re.search(r'[-–—]\s*(\d[\d\s]{2,})', clean)
    if not price_match:
        return None
    price_raw = re.sub(r'\s', '', price_match.group(1))
    try:
        price = int(price_raw) + PRICE_MARKUP
    except ValueError:
        return None

    desc = clean[:price_match.start()].strip()

    storage = None
    storage_match = re.search(r'\b(\d+)\s*(GB|TB|gb|tb)\b', desc)
    if storage_match:
        storage = storage_match.group(1) + storage_match.group(2).upper()
        desc_no_storage = desc[:storage_match.start()] + desc[storage_match.end():]
    else:
        storage_num_match = re.search(r'\b(64|128|256|512|1024|2048|1|2)\b', desc)
        if storage_num_match:
            val = storage_num_match.group(1)
            if int(val) in (1, 2) and 'tb' in desc[storage_num_match.start():storage_num_match.start()+5].lower():
                storage = val + 'TB'
            elif int(val) >= 64:
                storage = val + 'GB'
            desc_no_storage = desc[:storage_num_match.start()] + desc[storage_num_match.end():]
        else:
            desc_no_storage = desc

    desc_no_storage = re.sub(r'\s+', ' ', desc_no_storage).strip()

    brand, base_model, category = detect_brand(current_model or desc_no_storage)
    if not brand:
        brand, base_model, category = detect_brand(desc_no_storage)

    full_model = (current_model or desc_no_storage).strip()

    color_part = desc_no_storage
    if full_model:
        for w in full_model.lower().split():
            color_part = re.sub(r'\b' + re.escape(w) + r'\b', '', color_part, flags=re.IGNORECASE)
    color_part = re.sub(r'\s+', ' ', color_part).strip()

    if not full_model or not brand:
        return None

    return {
        'brand': brand,
        'model': full_model,
        'category': category,
        'color': color_part or None,
        'storage': storage,
        'ram': None,
        'region': region,
        'availability': availability,
        'price': price,
        'has_photo_marker': has_photo_marker,
    }


def parse_price_message(text):
    if not text:
        return []
    lines = text.split('\n')
    items = []
    current_model = None
    price_line_re = re.compile(r'[-–—]\s*\d[\d\s]{2,}')

    for line in lines:
        line = line.strip()
        if not line:
            continue
        if price_line_re.search(line):
            item = parse_price_line(line, current_model)
            if item:
                items.append(item)
        else:
            clean_line = strip_emojis(line).strip()
            brand, _, _ = detect_brand(clean_line)
            if brand and len(clean_line) > 2:
                current_model = clean_line
            elif re.search(r'\b(Pro|Max|Plus|Ultra|Mini|Air|SE)\b', clean_line, re.IGNORECASE) and len(clean_line) < 60:
                current_model = clean_line

    return items


def upsert_item(cur, item):
    """Upsert товара, возвращает (action, id, old_price)"""
    cur.execute(
        f"""SELECT id, price FROM {SCHEMA}.catalog
            WHERE brand=%s AND model=%s
              AND COALESCE(color,'') = COALESCE(%s,'')
              AND COALESCE(storage,'') = COALESCE(%s,'')
              AND COALESCE(region,'') = COALESCE(%s,'')
            LIMIT 1""",
        (item['brand'], item['model'],
         item.get('color') or '', item.get('storage') or '', item.get('region') or '')
    )
    row = cur.fetchone()
    if row:
        old_price = row[1]
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                price=%s, availability=%s, updated_at=now(), is_active=true
                WHERE id=%s""",
            (item.get('price'), item['availability'], row[0])
        )
        changed = (old_price != item.get('price'))
        return 'updated', row[0], changed
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog
                (category, brand, model, color, storage, ram, region, availability, price, has_photo, photo_url)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,false,null) RETURNING id""",
            (item['category'], item['brand'], item['model'],
             item.get('color'), item.get('storage'), item.get('ram'),
             item.get('region'), item['availability'], item.get('price'))
        )
        return 'inserted', cur.fetchone()[0], True


def save_photo(cur, item_id, cdn_url, sort_order):
    """Сохраняет фото в catalog_photos и обновляет основной photo_url"""
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s",
        (item_id,)
    )
    if cur.fetchone()[0] >= MAX_PHOTOS:
        return False

    cur.execute(
        f"""INSERT INTO {SCHEMA}.catalog_photos
            (catalog_item_id, sku, product_name, photo_type, file_name, url, sort_order, is_valid)
            VALUES (%s, %s, %s, 'front', %s, %s, %s, true)
            ON CONFLICT DO NOTHING""",
        (item_id, str(item_id), '', f'photo_{sort_order}.jpg', cdn_url, sort_order)
    )
    # Первое фото → основной photo_url
    if sort_order == 1:
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET has_photo=true, photo_url=%s,
                photos_count=(SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s),
                updated_at=now() WHERE id=%s""",
            (cdn_url, item_id, item_id)
        )
    else:
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET has_photo=true,
                photos_count=(SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s),
                updated_at=now() WHERE id=%s""",
            (item_id, item_id)
        )
    return True


def process_price_message(cur, text):
    """Парсит сообщение с ценами, возвращает статистику"""
    items = parse_price_message(text)
    stats = {'parsed': 0, 'updated': 0, 'inserted': 0, 'changed': 0}
    for item in items:
        action, _, changed = upsert_item(cur, item)
        stats['parsed'] += 1
        stats[action] += 1
        if changed:
            stats['changed'] += 1
    return stats


def process_photo_message(cur, msg):
    """
    Обрабатывает сообщение с фото (пересланное из @appledysonphoto).
    Матчит по подписи к фото с товарами в каталоге.
    """
    photos = msg.get('photo')
    if not photos:
        return 0

    caption = msg.get('caption', '') or ''
    # Берём лучшее фото
    best = sorted(photos, key=lambda p: p.get('file_size', 0), reverse=True)[0]

    # Пробуем найти товар по подписи
    item_ids = find_items_by_caption(cur, caption)
    if not item_ids:
        return 0

    file_data, ext = tg_download(best['file_id'])
    if not file_data:
        return 0

    saved = 0
    for item_id in item_ids[:3]:
        # Проверяем сколько фото уже есть
        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.catalog_photos WHERE catalog_item_id=%s",
            (item_id,)
        )
        count = cur.fetchone()[0]
        if count >= MAX_PHOTOS:
            continue

        # Проверяем не загружали ли уже это фото
        sort_order = count + 1
        cdn_url = upload_photo_s3(file_data, ext, item_id, sort_order)
        save_photo(cur, item_id, cdn_url, sort_order)
        saved += 1

    return saved


def find_items_by_caption(cur, caption):
    """Ищет товары в каталоге по подписи к фото"""
    if not caption:
        return []

    caption_lower = caption.lower()

    # Вытаскиваем ключевые слова из подписи
    storage_m = re.search(r'\b(\d+)\s*(gb|tb)\b', caption_lower)
    storage = None
    if storage_m:
        storage = storage_m.group(1) + storage_m.group(2).upper()

    # Ищем цвет — слово с заглавной в конце строки
    words = caption.split()
    color_candidates = [w for w in words if w and w[0].isupper() and len(w) > 2 and w.isalpha()]

    brand, model_base, _ = detect_brand(caption)

    if not brand:
        return []

    conditions = ["brand=%s", "is_active=true"]
    args = [brand]

    if model_base:
        conditions.append("model ILIKE %s")
        args.append(f'%{model_base[:6]}%')

    if storage:
        conditions.append("COALESCE(storage,'') ILIKE %s")
        args.append(f'%{storage}%')

    sql = f"SELECT id FROM {SCHEMA}.catalog WHERE {' AND '.join(conditions)} LIMIT 5"
    cur.execute(sql, args)
    return [r[0] for r in cur.fetchall()]


def setup_webhook(self_url):
    """Устанавливает webhook на текущий URL функции"""
    res = tg_api('setWebhook', {'url': self_url, 'allowed_updates': json.dumps(['message', 'channel_post'])})
    return res


def handler(event: dict, context) -> dict:
    """
    Telegram webhook: автоматически принимает прайс от @Bas713bot и фото из @appledysonphoto.
    POST без токена — webhook от Telegram. POST с X-Admin-Token — управление.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'POST')
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')
    params = event.get('queryStringParameters') or {}

    # GET ?action=setup — регистрация webhook (нужен admin token)
    if method == 'GET' and params.get('action') == 'setup':
        if admin_token != os.environ.get('ADMIN_TOKEN', ''):
            return err(403, 'Нет доступа')
        self_url = params.get('url', '')
        if not self_url:
            return err(400, 'Передай ?url=https://... — URL этой функции')
        res = setup_webhook(self_url)
        return ok({'webhook': res})

    # GET ?action=status — статус webhook
    if method == 'GET' and params.get('action') == 'status':
        if admin_token != os.environ.get('ADMIN_TOKEN', ''):
            return err(403, 'Нет доступа')
        res = tg_api('getWebhookInfo')
        return ok(res)

    # POST — входящий webhook от Telegram
    if method == 'POST':
        raw = event.get('body', '')
        if not raw:
            return ok({'ok': True})

        try:
            update = json.loads(raw) if isinstance(raw, str) else raw
            if isinstance(update, str):
                update = json.loads(update)
        except Exception:
            return ok({'ok': True})

        if not isinstance(update, dict):
            return ok({'ok': True})

        msg = update.get('message') or update.get('channel_post')
        if not msg:
            return ok({'ok': True})

        text = msg.get('text') or msg.get('caption') or ''
        has_photo = bool(msg.get('photo'))

        # Проверяем есть ли строки с ценой (прайс от @Bas713bot)
        price_line_re = re.compile(r'[-–—]\s*\d[\d\s]{2,}')
        is_price_msg = bool(price_line_re.search(text))

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        stats = {'photos_saved': 0}

        if is_price_msg:
            price_stats = process_price_message(cur, text)
            stats.update(price_stats)

        if has_photo:
            saved = process_photo_message(cur, msg)
            stats['photos_saved'] += saved

        conn.commit()
        cur.close()
        conn.close()

        return ok({'ok': True, 'stats': stats})

    return ok({'ok': True})