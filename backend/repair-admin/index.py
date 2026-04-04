import json
import os
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')

VALID_STATUSES = ['new', 'in_progress', 'waiting_parts', 'ready', 'done', 'cancelled']


def auth(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-admin-token', '')
    return token == ADMIN_TOKEN and bool(ADMIN_TOKEN)


def handler(event: dict, context) -> dict:
    """Управление заявками на ремонт: список, создание, смена статуса (только для администратора)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'},
            'body': '',
        }

    if not auth(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    method = event.get('httpMethod', 'GET')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        status_filter = params.get('status', '')
        if status_filter:
            cur.execute(
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at, comment FROM {SCHEMA}.repair_orders WHERE status = %s ORDER BY created_at DESC",
                (status_filter,)
            )
        else:
            cur.execute(
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at, comment FROM {SCHEMA}.repair_orders ORDER BY created_at DESC LIMIT 200"
            )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        orders = [
            {
                'id': r[0], 'name': r[1], 'phone': r[2], 'model': r[3],
                'repair_type': r[4], 'price': r[5], 'status': r[6],
                'admin_note': r[7], 'created_at': r[8].isoformat() if r[8] else None,
                'comment': r[9],
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    if method == 'POST':
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
        action = body.get('action', 'update_status')

        if action == 'create':
            name = (body.get('name') or '').strip()
            phone = (body.get('phone') or '').strip()
            model = (body.get('model') or '').strip() or None
            repair_type = (body.get('repair_type') or '').strip() or None
            price = body.get('price') or None
            comment = (body.get('comment') or '').strip() or None

            if not name or not phone:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите имя и телефон'}, ensure_ascii=False)}

            cur.execute(
                f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment, status) VALUES (%s, %s, %s, %s, %s, %s, 'new') RETURNING id",
                (name, phone, model, repair_type, int(price) if price else None, comment)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.close(); conn.close()

            notify_telegram(new_id, name, phone, model, repair_type, price, comment)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'id': new_id}, ensure_ascii=False)}

        order_id = body.get('id')
        new_status = body.get('status', '').strip()
        admin_note = body.get('admin_note', '').strip()

        if not order_id or new_status not in VALID_STATUSES:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id и корректный статус'}, ensure_ascii=False)}

        cur.execute(
            f"UPDATE {SCHEMA}.repair_orders SET status = %s, admin_note = %s, status_updated_at = NOW() WHERE id = %s RETURNING id",
            (new_status, admin_note or None, int(order_id))
        )
        updated = cur.fetchone()
        conn.commit()
        cur.close(); conn.close()

        if not updated:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        notify_client(int(order_id), new_status, admin_note)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    cur.close(); conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}


def notify_client(order_id: int, status: str, note: str):
    STATUS_LABELS = {
        'new': '📋 Заявка принята',
        'in_progress': '🔧 В работе',
        'waiting_parts': '📦 Ожидаем запчасть',
        'ready': '✅ Готово — можно забирать!',
        'done': '🏁 Выдано',
        'cancelled': '❌ Отменено',
    }
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    label = STATUS_LABELS.get(status, status)
    text = f"🔄 *Статус заявки #{order_id} обновлён*\n{label}" + (f"\n📝 {note}" if note else "")
    import requests
    requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
        timeout=10,
    )


def notify_telegram(order_id: int, name: str, phone: str, model, repair_type, price, comment):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not token or not chat_id:
        return
    lines = [f"📋 *Новая заявка #{order_id}* (из админки)"]
    lines.append(f"👤 {name} | 📞 {phone}")
    if model:
        lines.append(f"📱 {model}")
    if repair_type:
        lines.append(f"🔧 {repair_type}")
    if price:
        lines.append(f"💰 {int(price):,} ₽".replace(',', ' '))
    if comment:
        lines.append(f"💬 {comment}")
    import requests
    requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={'chat_id': chat_id, 'text': '\n'.join(lines), 'parse_mode': 'Markdown'},
        timeout=10,
    )
