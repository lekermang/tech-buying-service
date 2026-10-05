"""
Импорт прайса из Telegram через бота @Skypkaklgbot. v2 — группа + пересылка в личку, ответы через webhook
Webhook:  POST /  (Update от Telegram)
Привязка (делается с телефона/компьютера, т.к. сервер не видит api.telegram.org): открыть в браузере
  https://api.telegram.org/bot<ТОКЕН>/setWebhook?url=<адрес функции>?key=<WEBHOOK_KEY>
?action=parse        POST {admin_token, text, apply?}  — проверить разбор текста (apply=true — записать в каталог)
Формат строки: "🇪🇺 17 Pro 512 Blue - 121900 ✅📸"  (✅ в наличии, 🚗 под заказ)
Секреты: SKYPKA_PRICE_BOT_TOKEN (токен @Skypkaklgbot), PRICE_SOURCE_CHAT_ID (разрешённый чат)
"""
import json, os, re, urllib.request
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
ADMIN = 'Mark2015N'
MARKUP = 3000
CACHE_KEY = 'smartbery_products_cache'
WEBHOOK_KEY = 'wym5IyJBNPx1OWlEVLTTUuSGvjto8JoA'
BOT_PASS = '838B355C'
CORS = {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'}

FLAGS = {'🇪🇺': 'EU', '🇺🇸': 'US', '🇷🇺': 'RU', '🇨🇳': 'CN', '🇦🇪': 'AE', '🇭🇰': 'HK', '🇯🇵': 'JP'}
LINE_RE = re.compile(
    r'^\s*(?P<flag>[\U0001F1E6-\U0001F1FF]{2})?\s*(?P<name>.+?)\s+[-–—]\s*'
    r'(?:(?P<price>\d[\d\s.]{2,9})\b|(?P<ask>Цену\s+уточняйте))(?P<tail>.*)$')

HEADER_CATS = [
    ('iphone', 'iPhone'), ('xiaomi', 'Xiaomi'), ('poco', 'Xiaomi'),
    ('realme', 'Realme / OnePlus / Nothing'), ('vivo', 'Vivo / Tecno / Infinix'),
    ('honor', 'Honor'), ('samsung', 'Samsung'), ('dyson', 'Dyson'), ('garmin', 'Garmin'),
    ('sony', 'Игровые консоли'), ('gopro', 'Камеры и экшн-камеры'), ('ray-ban', 'Гаджеты'),
    ('яндекс', 'Колонки и аудио'), ('airpods', 'AirPods'), ('ipad', 'iPad'),
    ('macbook', 'MacBook'), ('watch', 'Apple Watch'),
]
APPLE_ACC = ('airtag', 'magsafe', 'power adapter', 'кабель', 'стекло', 'чехол', 'pencil',
             'magic keyboard', 'magic mouse', 'macbook air m', 'iphone')


def resp(code, data):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def header_category(line):
    low = line.lower()
    if not low.strip().startswith('категория'):
        return None
    for key, cat in HEADER_CATS:
        if key in low:
            return cat
    return None


def refine_category(name, cat):
    n = name.lower()
    if n.startswith('earpods'):
        return 'Наушники'
    if n.startswith('airpods'):
        return 'AirPods'
    if cat in ('AirPods', 'iPad', 'MacBook') and any(k in n for k in APPLE_ACC) and not n.startswith('ipad'):
        return 'Аксессуары Apple'
    return cat


def guess_category(name):
    parts = name.split()
    first = parts[0] if parts else ''
    if re.fullmatch(r'\d{1,2}e?', first) or first in ('Air', 'SE2', 'SE3'):
        return 'iPhone'
    n = name.lower()
    for key, cat in (('galaxy', 'Samsung'), ('redmi', 'Xiaomi'), ('poco', 'Xiaomi'), ('xiaomi', 'Xiaomi'),
                     ('honor', 'Honor'), ('ipad', 'iPad'), ('airpods', 'AirPods'), ('macbook', 'MacBook'),
                     ('ps5', 'Игровые консоли'), ('jbl', 'Колонки и аудио'), ('яндекс', 'Колонки и аудио')):
        if n.startswith(key):
            return cat
    return None


def parse_text(text):
    items, cat = [], None
    for raw in (text or '').splitlines():
        hc = header_category(raw)
        if hc:
            cat = hc
            continue
        m = LINE_RE.match(raw)
        if not m:
            continue
        name = re.sub(r'\s+', ' ', m.group('name')).strip()
        if len(name) < 2 or name.lower() in ('4 pack',):
            continue
        price = None
        if m.group('price'):
            price = int(re.sub(r'\D', '', m.group('price')))
            if price < 500:
                continue
        tail = m.group('tail') or ''
        avail = 'on_order' if '🚗' in tail else 'in_stock'
        items.append({
            'name': name, 'price': price, 'availability': avail,
            'region': FLAGS.get(m.group('flag') or '', None),
            'category': refine_category(name, cat or guess_category(name)),
            'sku': 'smartbery_' + name.replace(' ', '_').lower(),
        })
    return items


def _key(name, region):
    return f'{name}|{region or ""}'


def set_setting_raw(key, value, desc=''):
    conn = db(); cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.settings (key, value, description, updated_at) VALUES (%s, %s, %s, NOW()) "
            f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()", (key, value, desc))
        conn.commit()
    finally:
        cur.close(); conn.close()


def save_to_cache(items, replace=False):
    """Запасной прайс для /apple. replace=True — полностью заменить (свежий полный прайс), иначе слияние."""
    cache = []
    if not replace:
        conn = db(); cur = conn.cursor()
        try:
            cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key=%s", (CACHE_KEY,))
            row = cur.fetchone()
            try:
                cache = json.loads(row[0]) if row and row[0] else []
            except Exception:
                cache = []
            if not cache:
                cur.execute(
                    f"SELECT model, storage, color, region, availability, price, photo_url "
                    f"FROM {SCHEMA}.catalog WHERE sku LIKE 'smartbery_%%' AND is_active = true AND price IS NOT NULL")
                for model, storage, color, region, avail, price, photo in cur.fetchall():
                    nm = " ".join(x for x in [(model or '').replace('iPhone ', '', 1), (storage or '').replace('GB', ''), color or ''] if x).strip()
                    cache.append({'availability': avail == 'in_stock', 'country': region, 'name': nm,
                                  'photo_tg': None, 'price': price})
        finally:
            cur.close(); conn.close()
    by_key = {_key(c.get('name'), c.get('country')): c for c in cache if isinstance(c, dict)}
    for it in items:
        k = _key(it['name'], it['region'])
        old = by_key.get(k, {})
        by_key[k] = {
            'availability': it['availability'] == 'in_stock',
            'country': it['region'],
            'name': it['name'],
            'photo_tg': old.get('photo_tg'),
            'price': it['price'],
            'category': it.get('category') or old.get('category'),
        }
    set_setting_raw(CACHE_KEY, json.dumps(list(by_key.values()), ensure_ascii=False), 'Запасной прайс для /apple')
    return len(by_key)


def _storage(parts):
    for i, p in enumerate(parts):
        if p.isdigit() and int(p) in (64, 128, 256, 512, 1024, 2048):
            return i, f'{p}GB'
        if re.fullmatch(r'(?i)\d+tb', p):
            return i, p.upper()
    return None, None


def apply_items(items, replace=False):
    """Пакетное обновление каталога (один запрос на всё), затем запасной прайс для /apple."""
    from psycopg2.extras import execute_values
    priced = [i for i in items if i['price'] is not None]
    priced.sort(key=lambda i: i['region'] == 'EU')
    by_sku = {}
    for it in priced:
        by_sku[it['sku']] = it
    rows = [(it['sku'], it['price'], it['price'] + MARKUP, it['availability'], it['region'])
            for it in by_sku.values()]
    updated_skus = set()
    inserted, unknown = 0, []
    conn = db(); cur = conn.cursor()
    try:
        if rows:
            res = execute_values(
                cur,
                f"UPDATE {SCHEMA}.catalog c SET price=v.price, retail_price=v.retail, availability=v.avail, "
                f"region=COALESCE(v.region, c.region), is_active=true, updated_at=NOW() "
                f"FROM (VALUES %s) AS v(sku, price, retail, avail, region) WHERE c.sku=v.sku RETURNING c.sku",
                rows, template="(%s, %s::int, %s::int, %s, %s)", fetch=True)
            updated_skus = {r[0] for r in res}
        new_rows = []
        for it in by_sku.values():
            if it['sku'] in updated_skus:
                continue
            parts = it['name'].split()
            if it.get('category') == 'iPhone' and parts:
                idx, st = _storage(parts)
                if idx is None:
                    unknown.append(it['name']); continue
                new_rows.append(('iPhone', 'Apple', 'iPhone ' + ' '.join(parts[:idx]), ' '.join(parts[idx + 1:]) or None,
                                 st, it['region'], it['availability'], it['price'], it['price'] + MARKUP, it['sku']))
            else:
                unknown.append(it['name'])
        if new_rows:
            execute_values(
                cur,
                f"INSERT INTO {SCHEMA}.catalog (category, brand, model, color, storage, region, availability, "
                f"price, retail_price, sku, is_active) VALUES %s",
                new_rows, template="(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)")
            inserted = len(new_rows)
        conn.commit()
    finally:
        cur.close(); conn.close()
    cached = save_to_cache(items, replace=replace)
    return {'updated': len(updated_skus), 'inserted': inserted, 'unknown_count': len(unknown),
            'unknown': unknown[:15], 'price_list_size': cached}


def get_setting(key):
    conn = db(); cur = conn.cursor()
    try:
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key=%s", (key,))
        r = cur.fetchone()
        return r[0] if r else ''
    finally:
        cur.close(); conn.close()


def set_setting(key, value, desc=''):
    set_setting_raw(key, value, desc)


def note_update(chat_id, ctype, title, uid, username, text):
    """Запоминаем последнее, что увидел бот, чтобы можно было проверить, доходят ли сообщения."""
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone(timedelta(hours=3))).strftime('%d.%m %H:%M МСК')
    sample = (text or '').replace('\n', ' ')[:80]
    set_setting('price_bot_last_update',
                f"{now} | чат {chat_id} ({ctype}) {title} | от {uid} @{username} | {sample}",
                'Последнее сообщение, которое получил бот прайса')
    try:
        seen = json.loads(get_setting('price_bot_seen_chats') or '{}')
    except Exception:
        seen = {}
    if chat_id not in seen:
        seen[chat_id] = title or ctype
        if len(seen) > 12:
            seen.pop(next(iter(seen)))
        set_setting('price_bot_seen_chats', json.dumps(seen, ensure_ascii=False), 'Чаты, откуда писал бот прайса')


def reply(chat_id, text, reply_to=None):
    """Ответ прямо в ответе на webhook — исходящая связь с Telegram не нужна."""
    body = {'method': 'sendMessage', 'chat_id': chat_id, 'text': text}
    if reply_to:
        body['reply_to_message_id'] = reply_to
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
            'body': json.dumps(body, ensure_ascii=False)}


def tg(method, payload):
    token = os.environ.get('SKYPKA_PRICE_BOT_TOKEN', '')
    req = urllib.request.Request(f'https://api.telegram.org/bot{token}/{method}',
                                 data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=3.5) as r:
        return json.loads(r.read())


def handler(event, context):
    """Приём прайса из закрытого чата Telegram и обновление каталога."""
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')
    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    is_admin = hdrs.get('x-admin-token') == ADMIN or body.get('admin_token') == ADMIN

    if action == 'status':
        if not is_admin:
            return resp(403, {'error': 'Forbidden'})
        try:
            seen = json.loads(get_setting('price_bot_seen_chats') or '{}')
        except Exception:
            seen = {}
        allowed = os.environ.get('PRICE_SOURCE_CHAT_ID', '').strip()
        extra = [c for c in (get_setting('price_bot_chats') or '').split(',') if c]
        try:
            cache = json.loads(get_setting('smartbery_products_cache') or '[]')
        except Exception:
            cache = []
        conn = db(); cur = conn.cursor()
        try:
            cur.execute(f"SELECT updated_at FROM {SCHEMA}.settings WHERE key='smartbery_products_cache'")
            r = cur.fetchone()
        finally:
            cur.close(); conn.close()
        return resp(200, {
            'last_update': get_setting('price_bot_last_update'),
            'seen_chats': seen,
            'allowed_chat_matches_seen': bool(allowed and allowed in seen),
            'extra_allowed_chats': extra,
            'private_users': len([u for u in (get_setting('price_bot_users') or '').split(',') if u]),
            'price_items': len(cache),
            'price_updated_at': str(r[0]) if r else None,
        })

    if action == 'allow_chat':
        if not is_admin:
            return resp(403, {'error': 'Forbidden'})
        cid = str(body.get('chat_id', '')).strip()
        if not re.fullmatch(r'-?\d{5,20}', cid):
            return resp(400, {'error': 'chat_id required'})
        extra = [c for c in (get_setting('price_bot_chats') or '').split(',') if c]
        if cid not in extra:
            extra.append(cid)
            set_setting('price_bot_chats', ','.join(extra), 'Чаты, из которых бот принимает прайс')
        return resp(200, {'ok': True, 'extra_allowed_chats': extra})

    if action == 'info':
        if not is_admin:
            return resp(403, {'error': 'Forbidden'})
        try:
            me = tg('getMe', {})
            wh = tg('getWebhookInfo', {})
        except Exception as e:
            return resp(200, {'ok': False, 'error': f'Telegram недоступен: {e}',
                              'token_set': bool(os.environ.get('SKYPKA_PRICE_BOT_TOKEN'))})
        return resp(200, {'bot': me.get('result', {}).get('username'), 'webhook_url': wh.get('result', {}).get('url'),
                          'pending': wh.get('result', {}).get('pending_update_count'),
                          'last_error': wh.get('result', {}).get('last_error_message')})

    if action == 'set_webhook':
        if not is_admin:
            return resp(403, {'error': 'Forbidden'})
        url = body.get('url', '')
        if not url:
            return resp(400, {'error': 'url required'})
        return resp(200, tg('setWebhook', {'url': url, 'allowed_updates': ['message', 'edited_message', 'channel_post', 'edited_channel_post']}))

    if action == 'parse':
        if not is_admin:
            return resp(403, {'error': 'Forbidden'})
        items = parse_text(body.get('text', ''))
        result = {'count': len(items), 'with_price': sum(1 for i in items if i['price'] is not None)}
        if not body.get('apply'):
            result['items'] = items[:40]
        else:
            result.update(apply_items(items, replace=bool(body.get('replace'))))
        return resp(200, result)

    # Webhook от Telegram (только с верным ключом в адресе)
    if qs.get('key') != WEBHOOK_KEY:
        return resp(403, {'error': 'Forbidden'})
    msg = body.get('message') or body.get('edited_message') or body.get('channel_post') or body.get('edited_channel_post')
    if not msg:
        return resp(200, {'ok': True})
    chat = msg.get('chat') or {}
    chat_id = str(chat.get('id', ''))
    ctype = chat.get('type', '')
    frm = msg.get('from') or {}
    uid = str(frm.get('id', ''))
    text = msg.get('text') or msg.get('caption') or ''
    mid = msg.get('message_id')
    is_private = ctype == 'private'
    try:
        note_update(chat_id, ctype, chat.get('title') or chat.get('username') or '', uid, frm.get('username') or '', text)
    except Exception as e:
        print(f'note_update error {e}')

    users = [u for u in (get_setting('price_bot_users') or '').split(',') if u]

    if is_private and text.startswith('/auth'):
        parts = text.split(None, 1)
        if len(parts) > 1 and parts[1].strip() == BOT_PASS:
            if uid not in users:
                users.append(uid)
                set_setting('price_bot_users', ','.join(users), 'Кому разрешено присылать прайс боту в личку')
            return reply(chat_id, '✅ Готово. Теперь пересылайте мне сообщения с прайсом — я обновлю цены на сайте.')
        return reply(chat_id, '❌ Неверный код.')

    if is_private and text.startswith('/start'):
        return reply(chat_id, 'Бот прайса Скупка24. Чтобы пересылать мне прайс, отправьте: /auth КОД\nВаш ID: ' + uid)

    extra_chats = [c for c in (get_setting('price_bot_chats') or '').split(',') if c]
    allowed = os.environ.get('PRICE_SOURCE_CHAT_ID', '').strip()
    chat_ok = chat_id == allowed or chat_id in extra_chats
    user_ok = is_private and uid in users
    if not (chat_ok or user_ok):
        print(f'ignored chat {chat_id} type {ctype} user {uid}')
        if is_private:
            return reply(chat_id, 'Доступ не открыт. Отправьте: /auth КОД')
        return resp(200, {'ok': True, 'ignored': True})

    items = parse_text(text)
    if not items:
        if is_private:
            return reply(chat_id, 'Не нашёл строк прайса. Формат: 🇪🇺 17 Pro 512 Blue - 121900 ✅')
        return resp(200, {'ok': True, 'items': 0})
    res = apply_items(items)
    print(f'price import: {res}')
    if is_private:
        note = f"✅ Прайс обновлён: {len(items)} позиций (в каталоге обновлено {res['updated']}, добавлено {res['inserted']}). Сайт /apple показывает новые цены."
        if res['unknown']:
            note += '\nТолько в прайс /apple (без каталога): ' + ', '.join(res['unknown'][:8])
        return reply(chat_id, note, mid)
    return resp(200, {'ok': True, **res})
