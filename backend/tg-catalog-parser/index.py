import json
import os
import re
import urllib.request
import urllib.parse
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
CHANNEL = 'appledysonphoto'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def tg_api(method, params=None):
    token = os.environ['CATALOG_BOT_TOKEN']
    url = f'https://api.telegram.org/bot{token}/{method}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=15) as r:
        return json.loads(r.read())


def tg_file_url(file_id):
    token = os.environ['CATALOG_BOT_TOKEN']
    res = tg_api('getFile', {'file_id': file_id})
    if not res.get('ok'):
        return None
    path = res['result']['file_path']
    return f'https://api.telegram.org/file/bot{token}/{path}'


def parse_caption(text):
    """
    Парсит подпись поста из канала в структуру товара.
    Формат: первая строка — название товара (бренд + модель),
    далее строки: Цена: XXXXX, Цвет: ..., Память: ..., RAM: ..., Регион: ..., Наличие: ...
    """
    if not text:
        return None

    lines = [l.strip() for l in text.strip().split('\n') if l.strip()]
    if not lines:
        return None

    item = {
        'brand': None,
        'model': None,
        'category': None,
        'color': None,
        'storage': None,
        'ram': None,
        'region': None,
        'availability': 'in_stock',
        'price': None,
    }

    # Первая строка — название товара
    title = lines[0]
    brand_map = {
        'iphone': ('Apple', 'iPhone'),
        'ipad': ('Apple', 'iPad'),
        'macbook': ('Apple', 'MacBook'),
        'airpods': ('Apple', 'AirPods'),
        'apple watch': ('Apple', 'Apple Watch'),
        'samsung': ('Samsung', 'Samsung'),
        'xiaomi': ('Xiaomi', 'Xiaomi'),
        'dyson': ('Dyson', 'Dyson'),
        'sony': ('Sony', 'Sony'),
    }
    title_lower = title.lower()
    for key, (brand, _) in brand_map.items():
        if key in title_lower:
            item['brand'] = brand
            item['model'] = title
            break

    if not item['brand']:
        parts = title.split(' ', 1)
        item['brand'] = parts[0]
        item['model'] = title

    # Категория по бренду/модели
    cat_map = {
        'iphone': 'Смартфоны',
        'ipad': 'Планшеты',
        'macbook': 'Ноутбуки',
        'airpods': 'Наушники',
        'apple watch': 'Умные часы',
        'samsung': 'Смартфоны',
        'xiaomi': 'Смартфоны',
        'dyson': 'Техника',
        'sony': 'Техника',
    }
    for key, cat in cat_map.items():
        if key in title_lower:
            item['category'] = cat
            break
    if not item['category']:
        item['category'] = 'Прочее'

    # Парсим остальные поля
    for line in lines[1:]:
        line_lower = line.lower()
        m = re.search(r'цена[:\s]+(\d[\d\s]*)', line_lower)
        if m:
            item['price'] = int(re.sub(r'\s', '', m.group(1)))
            continue
        m = re.search(r'цвет[:\s]+(.+)', line, re.IGNORECASE)
        if m:
            item['color'] = m.group(1).strip()
            continue
        m = re.search(r'память[:\s]+(.+)', line, re.IGNORECASE)
        if m:
            item['storage'] = m.group(1).strip()
            continue
        m = re.search(r'ram[:\s]+(.+)', line, re.IGNORECASE)
        if m:
            item['ram'] = m.group(1).strip()
            continue
        m = re.search(r'регион[:\s]+(.+)', line, re.IGNORECASE)
        if m:
            item['region'] = m.group(1).strip()
            continue
        if 'под заказ' in line_lower or 'on_order' in line_lower:
            item['availability'] = 'on_order'
        elif 'в наличии' in line_lower or 'in_stock' in line_lower:
            item['availability'] = 'in_stock'

        # storage из названия (256GB, 512GB, 1TB, 128GB)
        if not item['storage']:
            sm = re.search(r'(\d+\s*(gb|tb))', title_lower)
            if sm:
                item['storage'] = sm.group(1).upper().replace(' ', '')

    return item


def get_channel_posts(limit=50):
    """Получаем последние посты из публичного канала через getUpdates или channel history"""
    try:
        res = tg_api('getUpdates', {'limit': 100, 'allowed_updates': json.dumps(['channel_post'])})
        if not res.get('ok'):
            return []
        posts = []
        for upd in res.get('result', []):
            cp = upd.get('channel_post') or upd.get('message')
            if cp:
                chat = cp.get('chat', {})
                username = chat.get('username', '')
                if username.lower() == CHANNEL.lower():
                    posts.append(cp)
        return posts[-limit:]
    except Exception:
        return []


def upsert_item(cur, item, photo_url=None):
    """Добавляем или обновляем товар по модели+цвету+памяти"""
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.catalog
            WHERE brand=%s AND model=%s AND (color IS NULL OR color=%s) AND (storage IS NULL OR storage=%s)
            LIMIT 1""",
        (item['brand'], item['model'], item.get('color') or '', item.get('storage') or '')
    )
    row = cur.fetchone()
    if row:
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                price=%s, availability=%s, region=%s, ram=%s,
                photo_url=COALESCE(%s, photo_url),
                has_photo=CASE WHEN %s IS NOT NULL THEN true ELSE has_photo END,
                updated_at=now(), is_active=true
                WHERE id=%s""",
            (item.get('price'), item['availability'], item.get('region'),
             item.get('ram'), photo_url, photo_url, row[0])
        )
        return 'updated', row[0]
    else:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog
                (category, brand, model, color, storage, ram, region, availability, price, has_photo, photo_url)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (item['category'], item['brand'], item['model'],
             item.get('color'), item.get('storage'), item.get('ram'),
             item.get('region'), item['availability'], item.get('price'),
             bool(photo_url), photo_url)
        )
        new_id = cur.fetchone()[0]
        return 'inserted', new_id


def handler(event: dict, context) -> dict:
    """Парсер Telegram канала appledysonphoto — получает посты и обновляет каталог товаров"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'POST')
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')

    if admin_token != os.environ.get('ADMIN_TOKEN', ''):
        return err(403, 'Нет доступа')

    posts = get_channel_posts(limit=100)

    if not posts:
        # Fallback: попробуем получить через forwardFrom или напрямую
        return ok({'parsed': 0, 'updated': 0, 'inserted': 0, 'message': 'Постов не найдено. Перешли боту несколько постов из канала @appledysonphoto'})

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    stats = {'parsed': 0, 'updated': 0, 'inserted': 0, 'skipped': 0}

    for post in posts:
        caption = post.get('caption') or post.get('text') or ''
        item = parse_caption(caption)
        if not item or not item.get('model'):
            stats['skipped'] += 1
            continue

        # Фото
        photo_url = None
        photos = post.get('photo')
        if photos:
            best = sorted(photos, key=lambda p: p.get('file_size', 0), reverse=True)[0]
            photo_url = tg_file_url(best['file_id'])

        action, item_id = upsert_item(cur, item, photo_url)
        stats['parsed'] += 1
        stats[action] += 1

    conn.commit()
    cur.close()
    conn.close()

    return ok(stats)