import json
import os
import re
import urllib.request
import urllib.parse
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
PRICE_MARKUP = 3500

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
}

# Флаги регионов
REGION_FLAGS = {
    '🇷🇺': 'RU', '🇺🇸': 'US', '🇪🇺': 'EU', '🇨🇳': 'CN',
    '🇭🇰': 'HK', '🇯🇵': 'JP', '🇰🇷': 'KR', '🇦🇪': 'AE',
    '🇬🇧': 'GB', '🇹🇼': 'TW',
}

# Определение бренда/категории по ключевым словам в модели
BRAND_RULES = [
    (['iphone'],               'Apple',   'iPhone',       'Смартфоны'),
    (['ipad'],                 'Apple',   'iPad',         'Планшеты'),
    (['macbook'],              'Apple',   'MacBook',      'Ноутбуки'),
    (['airpods'],              'Apple',   'AirPods',      'Наушники'),
    (['apple watch', 'watch'], 'Apple',   'Apple Watch',  'Умные часы'),
    (['mac mini'],             'Apple',   'Mac Mini',     'Компьютеры'),
    (['imac'],                 'Apple',   'iMac',         'Компьютеры'),
    (['samsung'],              'Samsung', 'Samsung',      'Смартфоны'),
    (['xiaomi', 'redmi'],      'Xiaomi',  'Xiaomi',       'Смартфоны'),
    (['poco'],                 'Xiaomi',  'POCO',         'Смартфоны'),
    (['realme'],               'Realme',  'Realme',       'Смартфоны'),
    (['oneplus'],              'OnePlus', 'OnePlus',      'Смартфоны'),
    (['honor'],                'Honor',   'Honor',        'Смартфоны'),
    (['pixel'],                'Google',  'Pixel',        'Смартфоны'),
    (['dyson'],                'Dyson',   'Dyson',        'Техника'),
    (['sony'],                 'Sony',    'Sony',         'Техника'),
    (['garmin'],               'Garmin',  'Garmin',       'Умные часы'),
    (['jbl'],                  'JBL',     'JBL',          'Наушники'),
    (['xbox'],                 'Microsoft', 'Xbox',       'Игровые консоли'),
    (['gopro'],                'GoPro',   'GoPro',        'Камеры'),
]


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def tg_api(method, params=None):
    token = os.environ['CATALOG_BOT_TOKEN']
    url = f'https://api.telegram.org/bot{token}/{method}'
    if params:
        url += '?' + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=20) as r:
        return json.loads(r.read())


def tg_file_url(file_id):
    token = os.environ['CATALOG_BOT_TOKEN']
    res = tg_api('getFile', {'file_id': file_id})
    if not res.get('ok'):
        return None
    path = res['result']['file_path']
    return f'https://api.telegram.org/file/bot{token}/{path}'


def detect_brand(text):
    """Определяет бренд, базовую модель и категорию по тексту"""
    tl = text.lower()
    for keywords, brand, base_model, category in BRAND_RULES:
        if any(kw in tl for kw in keywords):
            return brand, base_model, category
    return None, None, 'Прочее'


def strip_emojis(text):
    """Убирает emoji из строки"""
    emoji_pattern = re.compile(
        "[\U00002600-\U000027BF"
        "\U0001F300-\U0001F9FF"
        "\U00002702-\U000027B0"
        "\U0000FE00-\U0000FE0F"
        "\U00010000-\U0010FFFF"
        "\u200d\u2640\u2642\ufe0f\u20e3"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub('', text).strip()


def parse_price_line(line, current_model):
    """
    Парсит одну строку прайса формата:
    🇪🇺  17 Pro Max 512 Orange – 131200 🚗📸
    или (с явным брендом в строке):
    🇪🇺 iPhone 16 128 Black – 75000 ✅📸

    current_model — заголовок блока (например "iPhone 17 Pro Max")
    """
    # Регион из флага
    region = None
    for flag, code in REGION_FLAGS.items():
        if flag in line:
            region = code
            break

    # Наличие: ✅ = in_stock, 🚗 = on_order (по умолчанию on_order если нет ✅)
    availability = 'in_stock' if '✅' in line else 'on_order'

    # Есть фото?
    has_photo_marker = '📸' in line or '📷' in line

    # Убираем emoji для дальнейшего парсинга
    clean = strip_emojis(line)
    # Убираем лишние пробелы
    clean = re.sub(r'\s+', ' ', clean).strip()

    # Ищем цену после тире: – ЧИСЛО или - ЧИСЛО
    price_match = re.search(r'[-–—]\s*(\d[\d\s]{2,})', clean)
    if not price_match:
        return None
    price_raw = re.sub(r'\s', '', price_match.group(1))
    try:
        price = int(price_raw) + PRICE_MARKUP
    except ValueError:
        return None

    # Убираем цену и тире из строки, оставляем только описание товара
    desc = clean[:price_match.start()].strip()

    # Пытаемся вычленить память (512, 1TB, 256GB, 128 и т.д.) и цвет
    # Формат обычно: [модель частично] ПАМЯТЬ ЦВЕТ
    # или просто: ПАМЯТЬ ЦВЕТ (если модель в заголовке блока)

    storage = None
    color = None

    # Ищем storage: число + GB/TB или просто большое число кратное 64/128/256/512/1000/2000
    storage_match = re.search(r'\b(\d+)\s*(GB|TB|gb|tb)\b', desc)
    if storage_match:
        storage = storage_match.group(1) + storage_match.group(2).upper()
        desc_no_storage = desc[:storage_match.start()] + desc[storage_match.end():]
    else:
        # Число без единиц (128, 256, 512, 1024, 2048, 64)
        storage_num_match = re.search(r'\b(64|128|256|512|1024|2048|1|2)\s*(?:TB|tb)?\b', desc)
        if storage_num_match:
            val = storage_num_match.group(1)
            if val in ('1', '2') and re.search(r'(?:TB|tb)', desc[storage_num_match.start():storage_num_match.start()+5]):
                storage = val + 'TB'
            elif int(val) >= 64:
                storage = val + 'GB'
            desc_no_storage = desc[:storage_num_match.start()] + desc[storage_num_match.end():]
        else:
            desc_no_storage = desc

    desc_no_storage = re.sub(r'\s+', ' ', desc_no_storage).strip()

    # Определяем модель и цвет
    # current_model задаёт контекст (например "iPhone 17 Pro Max")
    # В desc_no_storage может остаться: цвет, или "Pro Max Orange", или просто "Orange"
    brand, base_model, category = detect_brand(current_model or desc_no_storage)

    if not brand:
        brand, base_model, category = detect_brand(desc_no_storage)

    # Определяем полную модель
    full_model = None
    if current_model:
        full_model = current_model.strip()
    else:
        # Убираем цвет-слова и пробуем взять модель из desc
        # Цвета обычно в конце строки — одно-два слова
        full_model = desc_no_storage

    # Цвет — последнее слово (или два) после хранения и модели
    # Убираем из desc_no_storage часть совпадающую с full_model
    color_part = desc_no_storage
    if full_model:
        # Убираем слова модели из desc_no_storage
        model_words = full_model.lower().split()
        for w in model_words:
            color_part = re.sub(r'\b' + re.escape(w) + r'\b', '', color_part, flags=re.IGNORECASE)
    color_part = re.sub(r'\s+', ' ', color_part).strip()
    if color_part:
        color = color_part

    if not full_model or not brand:
        return None

    return {
        'brand': brand,
        'model': full_model,
        'category': category,
        'color': color if color else None,
        'storage': storage,
        'ram': None,
        'region': region,
        'availability': availability,
        'price': price,
        'has_photo_marker': has_photo_marker,
    }


def parse_price_message(text):
    """
    Парсит целое сообщение прайса из @Bas713bot.
    Сообщение содержит блоки: заголовок модели + строки с позициями.
    Пример:
        iPhone 17 Pro Max
        🇪🇺  17 Pro Max 512 Orange – 131200 🚗📸
        🇪🇺  17 Pro Max 512 Blue – 133200 ✅📸
    """
    if not text:
        return []

    lines = text.split('\n')
    items = []
    current_model = None

    # Паттерн строки с ценой: содержит – и число
    price_line_re = re.compile(r'[-–—]\s*\d[\d\s]{2,}')

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if price_line_re.search(line):
            # Это строка с позицией товара
            item = parse_price_line(line, current_model)
            if item:
                items.append(item)
        else:
            # Возможно заголовок модели — проверяем что это не служебный текст
            clean_line = strip_emojis(line).strip()
            # Заголовок модели: содержит слово бренда или модели
            brand, _, _ = detect_brand(clean_line)
            if brand and len(clean_line) > 2:
                current_model = clean_line
            elif re.search(r'\b(Pro|Max|Plus|Ultra|Mini|Air|SE|Pro Max)\b', clean_line, re.IGNORECASE) and len(clean_line) < 60:
                current_model = clean_line

    return items


def get_bot_messages(limit=100):
    """Получаем последние сообщения бота через getUpdates"""
    try:
        res = tg_api('getUpdates', {'limit': limit, 'allowed_updates': json.dumps(['message', 'channel_post'])})
        if not res.get('ok'):
            return []
        messages = []
        for upd in res.get('result', []):
            msg = upd.get('message') or upd.get('channel_post')
            if msg and (msg.get('text') or msg.get('caption')):
                messages.append(msg)
        return messages
    except Exception:
        return []


def find_channel_photo(model, color, storage, region):
    """
    Ищет фото в канале @appledysonphoto через пересланные боту сообщения.
    Бот должен получить пересланные посты из канала.
    """
    try:
        res = tg_api('getUpdates', {'limit': 100, 'allowed_updates': json.dumps(['message'])})
        if not res.get('ok'):
            return None
        for upd in reversed(res.get('result', [])):
            msg = upd.get('message', {})
            # Ищем сообщения с фото (пересланные из канала)
            if not msg.get('photo'):
                continue
            caption = msg.get('caption', '') or ''
            fwd = msg.get('forward_from_chat', {})
            if fwd.get('username', '').lower() == 'appledysonphoto':
                # Проверяем совпадение по тексту подписи
                cap_lower = caption.lower()
                model_lower = (model or '').lower()
                color_lower = (color or '').lower()
                storage_lower = (storage or '').lower().replace('gb', '').replace('tb', '').strip()
                if model_lower and model_lower[:6] in cap_lower:
                    photos = msg['photo']
                    best = sorted(photos, key=lambda p: p.get('file_size', 0), reverse=True)[0]
                    return tg_file_url(best['file_id'])
    except Exception:
        pass
    return None


def upsert_item(cur, item, photo_url=None):
    """Добавляем или обновляем товар. Ищем по brand+model+color+storage+region"""
    cur.execute(
        f"""SELECT id FROM {SCHEMA}.catalog
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
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                price=%s, availability=%s,
                photo_url=COALESCE(%s, photo_url),
                has_photo=CASE WHEN %s IS NOT NULL THEN true ELSE has_photo END,
                updated_at=now(), is_active=true
                WHERE id=%s""",
            (item.get('price'), item['availability'],
             photo_url, photo_url, row[0])
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
    """
    Парсер прайса @Bas713bot + фото из @appledysonphoto.
    Читает сообщения бота, парсит строки товаров, обновляет каталог.
    Цена = оптовая + 3500 руб наценка.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')

    if admin_token != os.environ.get('ADMIN_TOKEN', ''):
        return err(403, 'Нет доступа')

    # Получаем сообщения
    messages = get_bot_messages(limit=100)

    if not messages:
        return ok({
            'parsed': 0, 'updated': 0, 'inserted': 0, 'skipped': 0,
            'message': 'Сообщений не найдено. Перешли боту прайс из @Bas713bot и посты с фото из @appledysonphoto'
        })

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    stats = {'parsed': 0, 'updated': 0, 'inserted': 0, 'skipped': 0}
    all_items = []

    for msg in messages:
        text = msg.get('text') or msg.get('caption') or ''
        parsed = parse_price_message(text)
        for item in parsed:
            # Фото из пересланных постов канала
            photo_url = None
            if item.get('has_photo_marker'):
                photo_url = find_channel_photo(
                    item['model'], item.get('color'),
                    item.get('storage'), item.get('region')
                )
            # Также проверяем фото прямо в сообщении
            if not photo_url and msg.get('photo'):
                photos = msg['photo']
                best = sorted(photos, key=lambda p: p.get('file_size', 0), reverse=True)[0]
                photo_url = tg_file_url(best['file_id'])

            all_items.append((item, photo_url))

    for item, photo_url in all_items:
        action, _ = upsert_item(cur, item, photo_url)
        stats['parsed'] += 1
        stats[action] += 1

    if not all_items:
        stats['message'] = 'Строки с ценами не найдены. Убедись что переслал боту прайс из @Bas713bot'

    conn.commit()
    cur.close()
    conn.close()

    return ok(stats)
