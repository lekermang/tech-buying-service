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
LINE_RE = re.compile(r'^\s*(?P<flag>[\U0001F1E6-\U0001F1FF]{2})?\s*(?P<name>.+?)\s+[-–—:]\s*(?P<price>\d[\d\s.]{2,9})\b(?P<tail>.*)$')


def resp(code, data):
    return {'statusCode': code, 'headers': CORS, 'body': json.dumps(data, ensure_ascii=False)}


def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def parse_text(text):
    items = []
    for raw in (text or '').splitlines():
        m = LINE_RE.match(raw)
        if not m:
            continue
        name = re.sub(r'\s+', ' ', m.group('name')).strip()
        name = re.sub(r'(?i)\b(\d+)\s?tb\b', lambda x: str(int(x.group(1)) * 1024), name)
        name = re.sub(r'(?i)\b(\d+)\s?gb\b', r'\1', name)
        price = int(re.sub(r'\D', '', m.group('price')))
        if price < 500:
            continue
        tail = m.group('tail')
        avail = 'on_order' if '🚗' in tail else 'in_stock'
        items.append({
            'name': name, 'price': price, 'availability': avail,
            'region': FLAGS.get(m.group('flag') or '', None),
            'sku': 'smartbery_' + name.replace(' ', '_').lower(),
        })
    return items


def save_to_cache(items):
    """Кладёт позиции в запасной прайс, из которого /apple берёт данные, когда поставщик недоступен."""
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
                              'photo_tg': photo if photo and 't.me' in photo else None, 'price': price})
        by_name = {c.get('name'): c for c in cache if isinstance(c, dict)}
        for it in items:
            old = by_name.get(it['name'], {})
            by_name[it['name']] = {
                'availability': it['availability'] == 'in_stock',
                'country': it['region'],
                'name': it['name'],
                'photo_tg': old.get('photo_tg'),
                'price': it['price'],
            }
        payload = json.dumps(list(by_name.values()), ensure_ascii=False).replace("'", "''")
        cur.execute(
            f"INSERT INTO {SCHEMA}.settings (key, value, description, updated_at) VALUES "
            f"('{CACHE_KEY}', '{payload}', 'Запасной прайс для /apple', NOW()) "
            f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()")
        conn.commit()
        return len(by_name)
    finally:
        cur.close(); conn.close()


def apply_items(items):
    conn = db(); cur = conn.cursor()
    updated, inserted, unknown = 0, 0, []
    try:
        for it in items:
            retail = it['price'] + MARKUP
            cur.execute(
                f"UPDATE {SCHEMA}.catalog SET price=%s, retail_price=%s, availability=%s, "
                f"region=COALESCE(%s, region), is_active=true, updated_at=NOW() WHERE sku=%s",
                (it['price'], retail, it['availability'], it['region'], it['sku']))
            if cur.rowcount:
                updated += 1
                continue
            parts = it['name'].split()
            if parts and (re.fullmatch(r'\d+e?', parts[0]) or parts[0] in ('Air', 'SE2', 'SE3')):
                st = next((p for p in parts if p.isdigit() and int(p) in (64, 128, 256, 512, 1024, 2048)), None)
                idx = parts.index(st) if st else len(parts) - 1
                model = 'iPhone ' + ' '.join(parts[:idx] if st else parts[:-1])
                color = ' '.join(parts[idx + 1:]) if st else parts[-1]
                cur.execute(
                    f"INSERT INTO {SCHEMA}.catalog (category, brand, model, color, storage, region, availability, "
                    f"price, retail_price, sku, is_active) VALUES ('iPhone','Apple',%s,%s,%s,%s,%s,%s,%s,%s,true)",
                    (model, color or None, f'{st}GB' if st else None, it['region'], it['availability'],
                     it['price'], retail, it['sku']))
                inserted += 1
            else:
                unknown.append(it['name'])
        conn.commit()
    finally:
        cur.close(); conn.close()
    cached = save_to_cache(items)
    return {'updated': updated, 'inserted': inserted, 'unknown': unknown, 'price_list_size': cached}


def get_setting(key):
    conn = db(); cur = conn.cursor()
    try:
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key=%s", (key,))
        r = cur.fetchone()
        return r[0] if r else ''
    finally:
        cur.close(); conn.close()


def set_setting(key, value, desc=''):
    conn = db(); cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.settings (key, value, description, updated_at) VALUES (%s, %s, %s, NOW()) "
            f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW()",
            (key, value, desc))
        conn.commit()
    finally:
        cur.close(); conn.close()


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
        result = {'items': items}
        if body.get('apply'):
            result.update(apply_items(items))
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
