"""
Импорт прайса из закрытого Telegram-чата (DanEL bot) через бота @Skypkaklgbot. v1
Webhook:  POST /  (Update от Telegram)
?action=set_webhook  POST {admin_token}   — привязать бота к этой функции
?action=parse        POST {admin_token, text, apply?}  — проверить разбор текста (apply=true — записать в каталог)
Формат строки: "🇪🇺 17 Pro 512 Blue - 121900 ✅📸"  (✅ в наличии, 🚗 под заказ)
Секреты: SKYPKA_PRICE_BOT_TOKEN (токен @Skypkaklgbot), PRICE_SOURCE_CHAT_ID (разрешённый чат)
"""
import json, os, re, urllib.request
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
ADMIN = 'Mark2015N'
MARKUP = 3000
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
    return {'updated': updated, 'inserted': inserted, 'unknown': unknown}


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

    # Webhook от Telegram
    msg = body.get('message') or body.get('edited_message') or body.get('channel_post') or body.get('edited_channel_post')
    if not msg:
        return resp(200, {'ok': True})
    allowed = os.environ.get('PRICE_SOURCE_CHAT_ID', '').strip()
    chat_id = str(msg.get('chat', {}).get('id', ''))
    if not allowed or chat_id != allowed:
        print(f'ignored chat {chat_id}')
        return resp(200, {'ok': True, 'ignored': True})
    text = msg.get('text') or msg.get('caption') or ''
    items = parse_text(text)
    if not items:
        return resp(200, {'ok': True, 'items': 0})
    res = apply_items(items)
    print(f'price import: {res}')
    try:
        note = f"✅ Прайс обновлён: {res['updated']} обновлено, {res['inserted']} добавлено"
        if res['unknown']:
            note += '\n⚠️ Не найдены: ' + ', '.join(res['unknown'][:10])
        tg('sendMessage', {'chat_id': chat_id, 'text': note, 'reply_to_message_id': msg.get('message_id')})
    except Exception as e:
        print(f'notify error {e}')
    return resp(200, {'ok': True, **res})