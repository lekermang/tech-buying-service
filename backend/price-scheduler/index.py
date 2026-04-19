"""
Автоматическая отправка прайса в Telegram-группу + ping sitemap в Яндекс.Вебмастер + автопостинг новостей. v10
- ?action=send_now — немедленная отправка прайса (для теста)
- ?action=ping_sitemap — отправить sitemap прямо сейчас (для теста)
- ?action=post_news_now — немедленно опубликовать новость (для теста)
- ?action=send_master_report — немедленно отправить отчёт мастеру (для теста)
- ?action=schedule_check — проверка расписания (вызывается каждые 5 мин)
Расписание: 10:00 МСК — прайс + ping sitemap; 20:00 МСК — отчёт мастера; каждый час — новость
"""

import json
import os
import threading
import base64
import xml.etree.ElementTree as ET
import psycopg2
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {'Access-Control-Allow-Origin': '*'}
FEED_URL = 'https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/'
SYNC_HOUR = 3  # 3:00 МСК — синхронизация инструментов
CONTACT_PHONE = '+7 992 990-33-33'
GROUP_CHAT_ID = os.environ.get('PRICE_GROUP_CHAT_ID', '')
MSK = timezone(timedelta(hours=3))
SEND_HOUR = 10
MASTER_REPORT_HOUR = 20

SITE_URL = 'https://skypka24.com'
SITEMAP_URL = 'https://skypka24.com/sitemap.xml'
YM_API = 'https://api.webmaster.yandex.net/v4'

NEWS_TOPICS = [
    "Новые функции последней версии iOS",
    "Чем отличается OLED от AMOLED дисплей в смартфонах",
    "Зачем нужен быстрый процессор в смартфоне",
    "Советы по уходу за аккумулятором iPhone",
    "Что такое 5G и стоит ли переходить",
    "Как выбрать смартфон для игр",
    "Лучшие камеры в смартфонах 2024–2025",
    "Чем хорош iPhone 15 Pro Max",
    "Samsung Galaxy S25 — что нового",
    "Xiaomi 14 Ultra: флагман за разумные деньги",
    "Зачем покупать б/у iPhone вместо нового",
    "Как правильно заряжать смартфон",
    "Что такое IP68 и зачем это нужно",
    "Беспроводные наушники: AirPods vs конкуренты",
    "MacBook vs Windows ноутбук — что выбрать",
    "iPad для работы и учёбы — стоит ли брать",
    "Apple Watch: зачем умные часы в 2025 году",
    "Как перенести данные со старого смартфона",
    "Face ID vs сканер отпечатка — что надёжнее",
    "Топ аксессуаров для iPhone",
    "Почему смартфоны из США и Европы ценятся выше",
    "Что нужно проверить при покупке б/у смартфона",
    "Облачные хранилища: iCloud, Google Drive, Яндекс.Диск",
    "Как смартфоны снимают видео 4K и зачем это",
    "Snapdragon 8 Elite — самый мощный чип 2025 года",
]


REPAIR_PARTS_API = 'https://b2b.moysklad.ru/desktop-api/public/wIIpnHFmddpo/products.json'
REPAIR_PART_TYPE_RULES = [
    ('battery',      ['аккумулятор', 'акб']),
    ('camera_glass', ['стекл', 'камер']),
    ('glass',        ['стекло', 'тачскрин', 'переклейк']),
    ('flex_board',   ['шлейф', 'плат']),
    ('display',      ['дисплей', 'экран', 'lcd', 'oled', 'amoled']),
    ('accessory',    ['аксессуар', 'динамик', 'звонок', 'вибро', 'корпус', 'рамка', 'крышка', 'прочее']),
]
REPAIR_QUALITY_RULES = [
    ('ORIG', ['orig', 'оригинал', 'original']),
    ('AAA',  ['aaa', 'ааа']),
    ('AA',   ['aa', 'аа', 'премиум', 'premium']),
    ('A',    ['копия', 'copy']),
]
REPAIR_LABOR_COSTS = {
    'display': 2000, 'battery': 1000, 'glass': 700,
    'accessory': 500, 'camera_glass': 1000, 'flex_board': 1200,
}


def _rp_detect_type(category, name):
    text = (category + ' ' + name).lower()
    for ptype, kws in REPAIR_PART_TYPE_RULES:
        for kw in kws:
            if kw in text:
                return ptype
    return 'accessory'


def _rp_detect_quality(name):
    text = name.lower()
    for q, kws in REPAIR_QUALITY_RULES:
        for kw in kws:
            if kw in text:
                return q
    return 'A'


def _rp_keywords(name):
    import re as _re
    brackets = _re.findall(r'\(([^)]+)\)', name)
    models = []
    for b in brackets:
        parts = _re.split(r'[/,;]+', b)
        models.extend([p.strip().lower() for p in parts if p.strip()])
    models.append(name.lower())
    return ' | '.join(dict.fromkeys(models))


def sync_repair_parts():
    """Загружает все запчасти из МойСклад и обновляет repair_parts в БД."""
    import urllib.request as _req
    all_products = []
    offset = 0
    limit = 100
    while True:
        url = (REPAIR_PARTS_API +
               f'?category=&category_id=&limit={limit}&offset={offset}&search=')
        try:
            with _req.urlopen(url, timeout=30) as r:
                data = json.loads(r.read())
        except Exception:
            break
        products = data.get('products', [])
        if not products:
            break
        all_products.extend(products)
        if len(products) < limit:
            break
        offset += limit

    if not all_products:
        return

    conn = get_conn()
    cur = conn.cursor()
    for p in all_products:
        pid = p.get('id', '')
        name = p.get('name', '')
        category = p.get('category', '')
        ptype = _rp_detect_type(category, name)
        quality = _rp_detect_quality(name)
        keywords = _rp_keywords(name)
        labor = REPAIR_LABOR_COSTS.get(ptype, 500)
        cur.execute(f"""
            INSERT INTO {SCHEMA}.repair_parts
                (id, code, name, category, category_id, price, stock, available,
                 quality, part_type, model_keywords, labor_cost, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (id) DO UPDATE SET
                name=EXCLUDED.name, category=EXCLUDED.category,
                price=EXCLUDED.price, stock=EXCLUDED.stock,
                available=EXCLUDED.available, quality=EXCLUDED.quality,
                part_type=EXCLUDED.part_type, model_keywords=EXCLUDED.model_keywords,
                labor_cost=EXCLUDED.labor_cost, updated_at=NOW()
        """, (pid, p.get('code', ''), name, category, p.get('categoryId', ''),
              p.get('price') or 0, p.get('stock') or 0, p.get('available', True),
              quality, ptype, keywords, labor))
    conn.commit()
    cur.close()
    conn.close()


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_price_markup():
    """Читает наценку из таблицы settings, fallback = 5500."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='price_markup'")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return int(row[0]) if row else 5500
    except Exception:
        return 5500


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def get_catalog():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT category, brand, model, storage, color, region, availability, price"
        " FROM " + SCHEMA + ".catalog"
        " WHERE is_active = true"
        " ORDER BY category, availability DESC, brand, model, price ASC NULLS LAST"
        " LIMIT 500"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            'category': r[0], 'brand': r[1], 'model': r[2],
            'storage': r[3], 'color': r[4], 'region': r[5],
            'availability': r[6], 'price': r[7]
        }
        for r in rows
    ]


AVAIL_ICON = {'in_stock': '✅', 'on_order': '🚗'}
REG_FLAG = {
    'EU': '🇪🇺', 'US': '🇺🇸', 'RU': '🇷🇺', 'CN': '🇨🇳',
    'HK': '🇭🇰', 'UK': '🇬🇧', 'JP': '🇯🇵', 'KZ': '🇰🇿',
}


def format_category_message(cat, cat_items, date_str, markup=5500):
    lines = [f'📋 <b>{cat}</b>  —  {date_str}\n']
    for it in cat_items:
        avail = AVAIL_ICON.get(it['availability'], '?')
        reg = REG_FLAG.get((it['region'] or '').upper(), '')
        parts = [it['model'] or it['brand'] or '']
        if it['storage']:
            parts.append(it['storage'])
        if it['color']:
            parts.append(it['color'])
        name = ' '.join(parts)
        if it['price']:
            price_str = '{:,}₽'.format(int(it['price']) + markup).replace(',', '\u00a0')
        else:
            price_str = 'по запросу'
        lines.append(f'{avail} {reg} {name} — <b>{price_str}</b>')
    text = '\n'.join(lines)
    wa_number = CONTACT_PHONE.replace('+', '').replace(' ', '').replace('-', '')
    order_button = {'inline_keyboard': [[
        {'text': '💬 WhatsApp', 'url': f'https://wa.me/{wa_number}'},
        {'text': '✍️ Написать менеджеру', 'url': 'https://t.me/skypka24'},
    ]]}
    return text, order_button


def send_tg_message(chat_id, text, reply_markup=None):
    token = os.environ.get('CATALOG_BOT_TOKEN', '')
    if not token:
        raise ValueError('CATALOG_BOT_TOKEN not set')

    payload_dict = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True,
    }
    if reply_markup:
        payload_dict['reply_markup'] = reply_markup

    url = 'https://api.telegram.org/bot' + token + '/sendMessage'
    payload = json.dumps(payload_dict).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        raise ValueError(f'Telegram API {e.code}: {body}')


def format_price_messages(items):
    if not items:
        return []
    now_msk = datetime.now(MSK)
    date_str = now_msk.strftime('%d.%m.%Y')
    by_cat = {}
    for it in items:
        cat = it['category'] or 'Другое'
        by_cat.setdefault(cat, []).append(it)
    return by_cat, date_str


def check_already_sent_today():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT 1 FROM " + SCHEMA + ".price_scheduler_log WHERE sent_at::date = NOW()::date LIMIT 1"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row is not None


def mark_sent():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("INSERT INTO " + SCHEMA + ".price_scheduler_log (sent_at) VALUES (NOW())")
    conn.commit()
    cur.close()
    conn.close()


def get_channel_username():
    token = os.environ.get('CATALOG_BOT_TOKEN', '')
    chat_id = os.environ.get('PRICE_GROUP_CHAT_ID', '')
    if not token or not chat_id:
        return None
    try:
        url = f'https://api.telegram.org/bot{token}/getChat'
        payload = json.dumps({'chat_id': chat_id}).encode('utf-8')
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        return data.get('result', {}).get('username')
    except Exception:
        return None


def do_send_price(chat_id):
    items = get_catalog()
    if not items:
        return {'sent': False, 'reason': 'catalog_empty'}

    markup = get_price_markup()
    now_msk = datetime.now(MSK)
    date_str = now_msk.strftime('%d.%m.%Y')

    by_cat = {}
    for it in items:
        cat = it['category'] or 'Другое'
        by_cat.setdefault(cat, []).append(it)

    channel_username = get_channel_username()

    # Отправляем каждую категорию отдельным сообщением, запоминаем message_id
    cat_message_ids = {}
    for cat, cat_items in by_cat.items():
        text, order_button = format_category_message(cat, cat_items, date_str, markup)
        result = send_tg_message(chat_id, text, reply_markup=order_button)
        msg_id = result.get('result', {}).get('message_id')
        if msg_id:
            cat_message_ids[cat] = msg_id

    # Формируем inline-кнопки навигации (2 в ряд)
    cats = list(cat_message_ids.keys())
    keyboard_rows = []
    for i in range(0, len(cats), 2):
        row = []
        for cat in cats[i:i+2]:
            mid = cat_message_ids[cat]
            if channel_username:
                url = f'https://t.me/{channel_username}/{mid}'
            else:
                # Для приватных групп используем tg://
                cid = str(chat_id).replace('-100', '')
                url = f'https://t.me/c/{cid}/{mid}'
            row.append({'text': cat, 'url': url})
        keyboard_rows.append(row)

    now_msk = datetime.now(MSK)
    menu_text = (
        f'📲 <b>Прайс-лист Скупки24</b>\n'
        f'Обновлён: {date_str}\n\n'
        f'Выбери категорию 👇'
    )
    reply_markup = {'inline_keyboard': keyboard_rows}
    send_tg_message(chat_id, menu_text, reply_markup=reply_markup)

    return {'sent': True, 'categories': len(by_cat), 'items': len(items)}


def check_tools_synced_today():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.tools_sync_log WHERE started_at::date = NOW()::date AND status='done' LIMIT 1"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row is not None


def check_tools_syncing_now():
    """Проверяет, идёт ли уже синхронизация прямо сейчас (запущена в последние 10 минут)."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT 1 FROM {SCHEMA}.tools_sync_log WHERE status='running' AND started_at > NOW() - INTERVAL '10 minutes' LIMIT 1"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row is not None


def create_sync_job():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"INSERT INTO {SCHEMA}.tools_sync_log (status) VALUES ('running') RETURNING id")
    job_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return job_id


def finish_sync_job(job_id, imported=None, error=None):
    conn = get_conn()
    cur = conn.cursor()
    status = 'done' if error is None else 'error'
    cur.execute(
        f"UPDATE {SCHEMA}.tools_sync_log SET status=%s, finished_at=NOW(), imported=%s, error=%s WHERE id=%s",
        (status, imported, error, job_id)
    )
    conn.commit()
    cur.close()
    conn.close()


def sync_tools_feed(job_id):
    """Постраничная синхронизация каталога: вызывает sync_chunk по одному чанку за раз."""
    tools_sync_url = 'https://functions.poehali.dev/8e9219e9-9dcf-4726-a272-69c6ce976b80'
    offset = 0
    total = 0
    try:
        while True:
            url = f'{tools_sync_url}?action=sync_chunk&offset={offset}'
            req = urllib.request.Request(url, headers={'User-Agent': 'price-scheduler/1.0'})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read())
            total += data.get('saved', 0)
            if not data.get('has_more'):
                break
            offset = data['next_offset']
        finish_sync_job(job_id, imported=total)
    except Exception as e:
        finish_sync_job(job_id, error=str(e)[:500])


def ym_get_user_id(token):
    """Получить числовой user_id Яндекс.Вебмастер по OAuth-токену."""
    req = urllib.request.Request(
        f'{YM_API}/user',
        headers={'Authorization': f'OAuth {token}', 'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    return data['user_id']


def ym_get_host_id(token, user_id, site_url):
    """Найти host_id сайта. Приоритет: HTTPS verified > HTTP verified > любой."""
    req = urllib.request.Request(
        f'{YM_API}/user/{user_id}/hosts',
        headers={'Authorization': f'OAuth {token}'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    hosts = data.get('hosts', [])

    # 1. Ищем HTTPS подтверждённый
    for h in hosts:
        url = h.get('unicode_host_url', '')
        if url.startswith('https://') and h.get('verified'):
            return h['host_id']

    # 2. Ищем любой HTTPS
    for h in hosts:
        if h.get('unicode_host_url', '').startswith('https://'):
            return h['host_id']

    # 3. Берём первый подтверждённый
    for h in hosts:
        if h.get('verified'):
            return h['host_id']

    # 4. Берём первый
    if hosts:
        return hosts[0]['host_id']
    return None


def ym_add_sitemap(token, user_id, host_id, sitemap_url):
    """Пингуем sitemap через /recrawl/queue — добавляем sitemap.xml на переобход.
    Это надёжный способ сообщить Яндексу об обновлении сайта.
    """
    headers = {
        'Authorization': f'OAuth {token}',
        'Content-Type': 'application/json',
    }

    # Отправляем sitemap.xml на переобход
    url = f'{YM_API}/user/{user_id}/hosts/{host_id}/recrawl/queue'
    payload = json.dumps({'url': sitemap_url}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=headers)
    req.get_method = lambda: 'POST'
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read()
            result = json.loads(body) if body else {'queued': True}
            return {'ok': True, 'method': 'recrawl', 'status': resp.status, 'response': result}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {'ok': False, 'method': 'recrawl', 'status': e.code, 'error': body}


def ping_sitemap_to_yandex():
    """Полный флоу: получить user_id → host_id → отправить sitemap.
    Все ошибки перехватываются — функция никогда не падает из-за YM.
    """
    token = os.environ.get('YANDEX_WEBMASTER_TOKEN', '').strip()
    if not token:
        return {'ok': False, 'error': 'YANDEX_WEBMASTER_TOKEN not set'}

    try:
        user_id = ym_get_user_id(token)
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {
            'ok': False,
            'step': 'get_user_id',
            'http_status': e.code,
            'error': body,
            'hint': 'Check token: go to https://oauth.yandex.ru, create app with webmaster:hostinfo + webmaster:verify scopes, get fresh token',
        }
    except Exception as e:
        return {'ok': False, 'step': 'get_user_id', 'error': str(e)}

    try:
        host_id = ym_get_host_id(token, user_id, SITE_URL)
    except Exception as e:
        return {'ok': False, 'step': 'get_host_id', 'user_id': user_id, 'error': str(e)}

    if not host_id:
        return {
            'ok': False,
            'step': 'get_host_id',
            'user_id': user_id,
            'error': f'site {SITE_URL} not found — add it to webmaster.yandex.ru first',
        }

    result = ym_add_sitemap(token, user_id, host_id, SITEMAP_URL)
    result['user_id'] = user_id
    result['host_id'] = host_id
    return result


def get_used_news_topics():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT topic FROM {SCHEMA}.news_post_log WHERE posted_at > NOW() - INTERVAL '7 days' AND error IS NULL"
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    return {r[0] for r in rows}


def get_last_news_posted_hour():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT posted_at FROM {SCHEMA}.news_post_log WHERE error IS NULL ORDER BY posted_at DESC LIMIT 1"
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    return row[0] if row else None


def check_news_already_posted_this_hour():
    last = get_last_news_posted_hour()
    if not last:
        return False
    now_msk = datetime.now(MSK)
    last_msk = last.astimezone(MSK)
    return last_msk.date() == now_msk.date() and last_msk.hour == now_msk.hour


def log_news_post(topic, message_id=None, error=None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.news_post_log (topic, message_id, error) VALUES (%s, %s, %s)",
        (topic, message_id, error)
    )
    conn.commit()
    cur.close(); conn.close()


def pick_news_topic():
    used = get_used_news_topics()
    available = [t for t in NEWS_TOPICS if t not in used]
    if not available:
        available = NEWS_TOPICS
    now_msk = datetime.now(MSK)
    idx = (now_msk.hour + now_msk.day * 24) % len(available)
    return available[idx]


def generate_news_text(topic: str) -> str:
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        raise ValueError('POLZA_AI_API_KEY not set')

    prompt = (
        f"Напиши короткую интересную новость или полезный пост для Telegram-канала о технике на тему: «{topic}».\n"
        "Требования:\n"
        "- Длина 150–250 слов\n"
        "- Живой, разговорный стиль, без официоза\n"
        "- Используй 2–3 эмодзи в тексте\n"
        "- НЕ упоминай источники, издания, сайты\n"
        "- НЕ добавляй контакты, телефоны, ссылки\n"
        "- НЕ добавляй хэштеги\n"
        "- Текст должен быть законченным и полезным\n"
        "- Язык: русский\n"
        "Верни только текст поста, без предисловий."
    )

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 600,
        "temperature": 0.85,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/v1/chat/completions',
        data=payload,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data['choices'][0]['message']['content'].strip()


def generate_news_image(topic: str):
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return None

    image_prompt = (
        f"High quality product photo related to: {topic}. "
        "Modern smartphone or tech gadget, clean white background, professional photography, "
        "sharp focus, studio lighting, commercial style."
    )

    payload = json.dumps({
        "model": "flux-schnell",
        "prompt": image_prompt,
        "size": "1024x1024",
        "n": 1,
    }).encode('utf-8')

    try:
        req = urllib.request.Request(
            'https://api.polza.ai/v1/images/generations',
            data=payload,
            headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read())

        item = data['data'][0]
        img_url = item.get('url')
        b64 = item.get('b64_json')
        if img_url:
            with urllib.request.urlopen(img_url, timeout=30) as r:
                return r.read()
        elif b64:
            return base64.b64decode(b64)
    except Exception:
        pass
    return None


def send_tg_photo_caption(chat_id: str, photo_bytes: bytes, caption: str):
    token = os.environ.get('CATALOG_BOT_TOKEN', '')
    if not token:
        raise ValueError('CATALOG_BOT_TOKEN not set')

    boundary = 'FormBoundaryNewsPhoto'
    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="chat_id"\r\n\r\n'
        f'{chat_id}\r\n'
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="caption"\r\n\r\n'
        f'{caption}\r\n'
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="photo"; filename="news.jpg"\r\n'
        f'Content-Type: image/jpeg\r\n\r\n'
    ).encode('utf-8') + photo_bytes + f'\r\n--{boundary}--\r\n'.encode('utf-8')

    req = urllib.request.Request(
        f'https://api.telegram.org/bot{token}/sendPhoto',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def get_repair_today_stats():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT
            COUNT(*) FILTER (WHERE status = 'done') as done,
            COUNT(*) FILTER (WHERE status = 'new') as new_count,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'waiting_parts') as waiting_parts,
            COUNT(*) FILTER (WHERE status = 'ready') as ready,
            COALESCE(SUM(repair_amount) FILTER (WHERE status = 'done'), 0) as revenue,
            COALESCE(SUM(purchase_amount) FILTER (WHERE status = 'done'), 0) as costs,
            COALESCE(SUM(master_income) FILTER (WHERE status = 'done'), 0) as master_income_sum,
            COUNT(*) as total
        FROM {SCHEMA}.repair_orders
        WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') = (NOW() AT TIME ZONE 'Europe/Moscow')::date
    """)
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return None
    revenue = int(row[5])
    costs = int(row[6])
    profit = revenue - costs
    master_income = int(row[7]) if row[7] else max(0, round(profit * 0.5))
    return {
        'done': row[0], 'new': row[1], 'in_progress': row[2],
        'waiting_parts': row[3], 'ready': row[4],
        'revenue': revenue, 'costs': costs, 'profit': profit,
        'master_income': master_income, 'total': row[8],
    }


def master_report_already_sent():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT 1 FROM {SCHEMA}.repair_daily_master_income
        WHERE report_date = (NOW() AT TIME ZONE 'Europe/Moscow')::date LIMIT 1
    """)
    row = cur.fetchone()
    cur.close(); conn.close()
    return row is not None


def mark_master_report_sent(stats: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {SCHEMA}.repair_daily_master_income
            (report_date, total_revenue, total_costs, profit, master_income, orders_done)
        VALUES (
            (NOW() AT TIME ZONE 'Europe/Moscow')::date,
            {stats['revenue']}, {stats['costs']}, {stats['profit']},
            {stats['master_income']}, {stats['done']}
        )
        ON CONFLICT (report_date) DO UPDATE SET
            total_revenue = EXCLUDED.total_revenue,
            total_costs = EXCLUDED.total_costs,
            profit = EXCLUDED.profit,
            master_income = EXCLUDED.master_income,
            orders_done = EXCLUDED.orders_done,
            sent_at = NOW()
    """)
    conn.commit()
    cur.close(); conn.close()


def get_repair_recipients():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients
        WHERE is_active = true AND notify_repair = true
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [r[0] for r in rows if r[0]]


def format_master_report(stats: dict) -> str:
    now_msk = datetime.now(MSK)
    date_str = now_msk.strftime('%d.%m.%Y')
    lines = [
        f'🔧 <b>Отчёт по ремонту за {date_str}</b>',
        '',
        f'📦 Всего заявок: <b>{stats["total"]}</b>',
        f'✅ Выдано: <b>{stats["done"]}</b>  •  🆕 Новых: {stats["new"]}',
        f'🔨 В работе: {stats["in_progress"]}  •  ⏳ Ждём запчасть: {stats["waiting_parts"]}  •  🟡 Готово: {stats["ready"]}',
        '',
        '─────────────────────',
        f'💰 Выручка: <b>{stats["revenue"]:,} ₽</b>'.replace(',', '\u00a0'),
        f'🛒 Закупка запчастей: <b>{stats["costs"]:,} ₽</b>'.replace(',', '\u00a0'),
        f'📈 Прибыль: <b>{stats["profit"]:,} ₽</b>'.replace(',', '\u00a0'),
        '─────────────────────',
        f'🏆 Доход мастера (50%): <b>{stats["master_income"]:,} ₽</b>'.replace(',', '\u00a0'),
    ]
    return '\n'.join(lines)


def get_open_repairs():
    """Незакрытые ремонты (не выдано, не отменено)"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, name, phone, model, repair_type, status, created_at
        FROM {SCHEMA}.repair_orders
        WHERE status NOT IN ('done', 'cancelled')
        ORDER BY created_at ASC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    STATUS_LABELS_RU = {
        'new': 'Принята',
        'in_progress': 'В работе',
        'waiting_parts': 'Ждём запчасть',
        'ready': 'Готово к выдаче',
    }
    result = []
    for r in rows:
        result.append({
            'id': r[0], 'name': r[1], 'phone': r[2],
            'model': r[3], 'repair_type': r[4],
            'status': STATUS_LABELS_RU.get(r[5], r[5]),
            'created_at': r[6],
        })
    return result


def format_morning_reminder(orders: list) -> str:
    now_msk = datetime.now(MSK)
    date_str = now_msk.strftime('%d.%m.%Y')
    lines = [
        f'☀️ <b>Доброе утро! Незакрытые ремонты на {date_str}</b>',
        f'📋 Всего в работе: <b>{len(orders)}</b>',
        '',
    ]
    for o in orders:
        days_open = (datetime.now(MSK) - o['created_at'].replace(tzinfo=MSK if o['created_at'].tzinfo is None else o['created_at'].tzinfo)).days if o['created_at'] else 0
        device = o['model'] or o['repair_type'] or 'устройство'
        lines.append(
            f"🔧 <b>#{o['id']}</b> {o['name']} — {device}\n"
            f"   📌 {o['status']}  •  ⏱ {days_open} дн."
        )
    lines += ['', '⚡️ Займись незакрытыми заявками!']
    return '\n'.join(lines)


MORNING_REMINDER_HOUR = 10


def morning_reminder_already_sent():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT 1 FROM {SCHEMA}.settings
        WHERE key = 'morning_reminder_date'
        AND value = (NOW() AT TIME ZONE 'Europe/Moscow')::date::text
    """)
    row = cur.fetchone()
    cur.close(); conn.close()
    return row is not None


def mark_morning_reminder_sent():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        INSERT INTO {SCHEMA}.settings (key, value, description)
        VALUES ('morning_reminder_date', (NOW() AT TIME ZONE 'Europe/Moscow')::date::text, 'Дата последнего утреннего напоминания')
        ON CONFLICT (key) DO UPDATE SET value = (NOW() AT TIME ZONE 'Europe/Moscow')::date::text, updated_at = NOW()
    """)
    conn.commit()
    cur.close(); conn.close()


def do_send_morning_reminder():
    orders = get_open_repairs()
    if not orders:
        return {'sent': False, 'reason': 'no_open_repairs'}
    recipients = get_repair_recipients()
    pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    all_recipients = list(recipients)
    if pluxan and pluxan not in all_recipients:
        all_recipients.append(pluxan)
    if not all_recipients:
        return {'sent': False, 'reason': 'no_recipients'}
    text = format_morning_reminder(orders)
    sent_to = []
    for chat_id in all_recipients:
        try:
            send_tg_message(chat_id, text)
            sent_to.append(chat_id)
        except Exception:
            pass
    mark_morning_reminder_sent()
    return {'sent': True, 'sent_to': len(sent_to), 'open_count': len(orders)}


def do_send_master_report(force: bool = False):
    if not force and master_report_already_sent():
        return {'sent': False, 'reason': 'already_sent'}
    stats = get_repair_today_stats()
    if not stats:
        return {'sent': False, 'reason': 'no_data'}
    recipients = get_repair_recipients()
    if not recipients:
        return {'sent': False, 'reason': 'no_recipients'}
    text = format_master_report(stats)
    sent_to = []
    errors = []
    for chat_id in recipients:
        try:
            send_tg_message(chat_id, text)
            sent_to.append(chat_id)
        except Exception as e:
            errors.append({'chat_id': chat_id, 'error': str(e)})
    mark_master_report_sent(stats)
    return {'sent': True, 'sent_to': len(sent_to), 'errors': errors, 'stats': stats}


def do_post_news():
    news_chat_id = os.environ.get('NEWS_GROUP_CHAT_ID', '')
    if not news_chat_id:
        return {'ok': False, 'reason': 'NEWS_GROUP_CHAT_ID not set'}

    topic = pick_news_topic()

    try:
        text = generate_news_text(topic)
    except Exception as e:
        log_news_post(topic, error=str(e)[:500])
        return {'ok': False, 'topic': topic, 'reason': f'GPT error: {e}'}

    try:
        photo_bytes = generate_news_image(topic)
    except Exception:
        photo_bytes = None

    try:
        if photo_bytes:
            result = send_tg_photo_caption(news_chat_id, photo_bytes, text)
        else:
            result = send_tg_message(news_chat_id, text)
        msg_id = result.get('result', {}).get('message_id')
        log_news_post(topic, message_id=msg_id)
        return {'ok': True, 'topic': topic, 'message_id': msg_id, 'has_photo': photo_bytes is not None}
    except Exception as e:
        log_news_post(topic, error=str(e)[:500])
        return {'ok': False, 'topic': topic, 'reason': f'Telegram error: {e}'}


def handler(event: dict, context) -> dict:
    """Отправка прайса в Telegram + ping sitemap в Яндекс.Вебмастер (10:00 МСК) + автопостинг новостей каждый час"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'schedule_check')

    if action == 'send_now':
        chat_id = params.get('chat_id') or GROUP_CHAT_ID
        if not chat_id:
            return err(400, 'chat_id required')
        result = do_send_price(chat_id)
        return ok(result)

    if action == 'setup_webhook':
        webhook_url = 'https://functions.poehali.dev/79437e4a-387b-4d66-952b-a6e8e8d627a2'
        token = os.environ.get('CATALOG_BOT_TOKEN', '')
        req = urllib.request.Request(
            f'https://api.telegram.org/bot{token}/setWebhook',
            data=json.dumps({
                'url': webhook_url,
                'allowed_updates': ['message', 'channel_post'],
                'drop_pending_updates': True,
            }).encode(),
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        return ok({'webhook_set': result, 'url': webhook_url})

    if action == 'ping_sitemap':
        result = ping_sitemap_to_yandex()
        return ok(result)

    if action == 'post_news_now':
        result = do_post_news()
        return ok(result)

    if action == 'send_master_report':
        result = do_send_master_report(force=True)
        return ok(result)

    if action == 'send_morning_reminder':
        result = do_send_morning_reminder()
        return ok(result)

    if action == 'list_hosts':
        token = os.environ.get('YANDEX_WEBMASTER_TOKEN', '').strip()
        if not token:
            return err(400, 'no token')
        user_id = ym_get_user_id(token)
        req = urllib.request.Request(
            f'{YM_API}/user/{user_id}/hosts',
            headers={'Authorization': f'OAuth {token}'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        return ok({'user_id': user_id, 'hosts': data.get('hosts', [])})

    if action == 'token_debug':
        token = os.environ.get('YANDEX_WEBMASTER_TOKEN', '')
        return ok({
            'length': len(token),
            'prefix': token[:10] if token else '',
            'starts_with_y0': token.startswith('y0_'),
            'has_spaces': ' ' in token,
        })

    if action == 'schedule_check':
        now_msk = datetime.now(MSK)

        # Синхронизация инструментов каждый час (для актуальных цен и наличия)
        if not check_tools_syncing_now():
            job_id = create_sync_job()
            t = threading.Thread(target=sync_tools_feed, args=(job_id,), daemon=False)
            t.start()

        # Синхронизация каталога запчастей МойСклад каждый час
        threading.Thread(target=sync_repair_parts, daemon=False).start()

        # Автопостинг новостей — каждый час, только с 9:00 до 22:00 МСК
        if 9 <= now_msk.hour < 22 and not check_news_already_posted_this_hour():
            threading.Thread(target=do_post_news, daemon=False).start()

        # Ежедневный отчёт мастера в 20:00 МСК
        if now_msk.hour == MASTER_REPORT_HOUR and not master_report_already_sent():
            threading.Thread(target=do_send_master_report, daemon=False).start()

        # Утреннее напоминание о незакрытых ремонтах в 10:00 МСК
        if now_msk.hour == MORNING_REMINDER_HOUR and not morning_reminder_already_sent():
            threading.Thread(target=do_send_morning_reminder, daemon=False).start()

        if now_msk.hour != SEND_HOUR:
            return ok({'skipped': True, 'reason': 'not_time_' + str(now_msk.hour) + 'h'})

        if check_already_sent_today():
            return ok({'skipped': True, 'reason': 'already_sent_today'})

        chat_id = GROUP_CHAT_ID
        if not chat_id:
            return err(400, 'PRICE_GROUP_CHAT_ID not set')

        # Отправляем прайс в Telegram
        result = do_send_price(chat_id)
        if result.get('sent'):
            mark_sent()

        # Пингуем sitemap в Яндекс.Вебмастер (тот же час 10:00)
        # Ошибки YM не должны ломать отправку прайса
        try:
            sitemap_result = ping_sitemap_to_yandex()
        except Exception as e:
            sitemap_result = {'ok': False, 'error': str(e)}
        result['sitemap_ping'] = sitemap_result

        return ok(result)

    return err(400, 'unknown action: ' + action)