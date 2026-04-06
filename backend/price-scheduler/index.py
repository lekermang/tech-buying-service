"""
Автоматическая отправка прайса в Telegram-группу + ping sitemap в Яндекс.Вебмастер. v8
- ?action=send_now — немедленная отправка прайса (для теста)
- ?action=ping_sitemap — отправить sitemap прямо сейчас (для теста)
- ?action=schedule_check — проверка расписания (вызывается каждые 5 мин)
Расписание: 10:00 МСК — прайс в Telegram + ping sitemap в Яндекс.Вебмастер
"""

import json
import os
import threading
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


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


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


def format_price_messages(items):
    if not items:
        return []

    now_msk = datetime.now(MSK)
    date_str = now_msk.strftime('%d.%m.%Y')

    by_cat = {}
    for it in items:
        cat = it['category'] or 'Другое'
        by_cat.setdefault(cat, []).append(it)

    avail_icon = {'in_stock': '\u2705', 'on_order': '\U0001F697'}
    reg_flag = {
        'EU': '\U0001F1EA\U0001F1FA', 'US': '\U0001F1FA\U0001F1F8',
        'RU': '\U0001F1F7\U0001F1FA', 'CN': '\U0001F1E8\U0001F1F3',
        'HK': '\U0001F1ED\U0001F1F0', 'UK': '\U0001F1EC\U0001F1E7',
        'JP': '\U0001F1EF\U0001F1F5', 'KZ': '\U0001F1F0\U0001F1FF',
    }

    lines = ['\U0001F4CB <b>\u041f\u0440\u0430\u0439\u0441-\u043b\u0438\u0441\u0442 ' + date_str + '</b>\n']

    for cat, cat_items in by_cat.items():
        lines.append('\n<b>\u2014 ' + cat + ' \u2014</b>')
        for it in cat_items:
            avail = avail_icon.get(it['availability'], '?')
            reg = reg_flag.get((it['region'] or '').upper(), '')
            parts = [it['model'] or it['brand'] or '']
            if it['storage']:
                parts.append(it['storage'])
            if it['color']:
                parts.append(it['color'])
            name = ' '.join(parts)
            if it['price']:
                price_str = '{:,}\u20bd'.format(int(it['price']) + 3500).replace(',', '\u00a0')
            else:
                price_str = '\u043f\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u0443'
            lines.append(avail + ' ' + reg + ' ' + name + ' \u2014 <b>' + price_str + '</b>')

    footer = '\n\n\U0001F4DE \u0414\u043b\u044f \u0437\u0430\u043a\u0430\u0437\u0430 \u0438\u043b\u0438 \u0443\u0442\u043e\u0447\u043d\u0435\u043d\u0438\u044f \u043d\u0430\u043b\u0438\u0447\u0438\u044f:\n<b>' + CONTACT_PHONE + '</b>'

    messages = []
    current = ''
    for line in lines:
        if len(current) + len(line) + 1 > 4000:
            messages.append(current)
            current = line
        else:
            current = (current + '\n' + line) if current else line

    if current:
        current += footer
        messages.append(current)
    elif messages:
        messages[-1] += footer

    return messages


def send_tg_message(chat_id, text):
    token = os.environ.get('CATALOG_BOT_TOKEN', '')
    if not token:
        raise ValueError('CATALOG_BOT_TOKEN not set')

    url = 'https://api.telegram.org/bot' + token + '/sendMessage'
    payload = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML',
        'disable_web_page_preview': True,
    }).encode('utf-8')

    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read())


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


def do_send_price(chat_id):
    items = get_catalog()
    if not items:
        return {'sent': False, 'reason': 'catalog_empty'}

    messages = format_price_messages(items)
    for msg in messages:
        send_tg_message(chat_id, msg)

    return {'sent': True, 'messages': len(messages), 'items': len(items)}


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
    """Найти host_id сайта в списке добавленных хостов."""
    req = urllib.request.Request(
        f'{YM_API}/user/{user_id}/hosts',
        headers={'Authorization': f'OAuth {token}'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    hosts = data.get('hosts', [])
    # Ищем по совпадению URL
    site_clean = site_url.rstrip('/').replace('https://', '').replace('http://', '')
    for h in hosts:
        if site_clean in h.get('unicode_host_url', ''):
            return h['host_id']
    # Если не нашли — берём первый
    if hosts:
        return hosts[0]['host_id']
    return None


def ym_add_sitemap(token, user_id, host_id, sitemap_url):
    """Отправить/обновить sitemap в Яндекс.Вебмастер через API v4.
    Используем PUT /sitemaps/{sitemap_url} — стандартный способ добавления sitemap.
    """
    sitemap_id = urllib.parse.quote(sitemap_url, safe='')
    url = f'{YM_API}/user/{user_id}/hosts/{host_id}/sitemaps/{sitemap_id}'
    req = urllib.request.Request(
        url,
        data=b'',
        headers={'Authorization': f'OAuth {token}', 'Content-Length': '0'},
    )
    req.get_method = lambda: 'PUT'
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read()
            result = json.loads(body) if body else {}
            return {'ok': True, 'method': 'PUT', 'status': resp.status, 'response': result}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {'ok': False, 'method': 'PUT', 'status': e.code, 'error': body}


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


def handler(event: dict, context) -> dict:
    """Отправка прайса в Telegram + ping sitemap в Яндекс.Вебмастер (10:00 МСК)"""
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

    if action == 'ping_sitemap':
        result = ping_sitemap_to_yandex()
        return ok(result)

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

        # Синхронизация инструментов в 3:00 МСК
        if now_msk.hour == SYNC_HOUR and not check_tools_synced_today():
            job_id = create_sync_job()
            t = threading.Thread(target=sync_tools_feed, args=(job_id,), daemon=False)
            t.start()

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