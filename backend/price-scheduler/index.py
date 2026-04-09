"""
Автоматическая отправка прайса в Telegram-группу + ping sitemap в Яндекс.Вебмастер + автопостинг новостей. v9
- ?action=send_now — немедленная отправка прайса (для теста)
- ?action=ping_sitemap — отправить sitemap прямо сейчас (для теста)
- ?action=post_news_now — немедленно опубликовать новость (для теста)
- ?action=schedule_check — проверка расписания (вызывается каждые 5 мин)
Расписание: 10:00 МСК — прайс + ping sitemap; каждый час — новость в новостную группу
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
        {'text': '✍️ Написать менеджеру', 'url': 'https://t.me/KalygaSkypka24'},
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

        # Автопостинг новостей — каждый час, только с 9:00 до 22:00 МСК
        if 9 <= now_msk.hour < 22 and not check_news_already_posted_this_hour():
            threading.Thread(target=do_post_news, daemon=False).start()

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