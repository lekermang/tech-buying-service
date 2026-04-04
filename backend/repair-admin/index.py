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
    """Управление заявками на ремонт: список заявок и смена статуса (только для администратора)"""

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
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at FROM {SCHEMA}.repair_orders WHERE status = %s ORDER BY created_at DESC",
                (status_filter,)
            )
        else:
            cur.execute(
                f"SELECT id, name, phone, model, repair_type, price, status, admin_note, created_at FROM {SCHEMA}.repair_orders ORDER BY created_at DESC LIMIT 100"
            )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        orders = [
            {
                'id': r[0], 'name': r[1], 'phone': r[2], 'model': r[3],
                'repair_type': r[4], 'price': r[5], 'status': r[6],
                'admin_note': r[7], 'created_at': r[8].isoformat() if r[8] else None,
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    if method == 'POST':
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
        order_id = body.get('id')
        new_status = body.get('status', '').strip()
        admin_note = body.get('admin_note', '').strip()

        if not order_id or new_status not in VALID_STATUSES:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите id и корректный статус'}, ensure_ascii=False)}

        cur.execute(
            f"UPDATE {SCHEMA}.repair_orders SET status = %s, admin_note = %s, status_updated_at = NOW() WHERE id = %s RETURNING id",
            (new_status, admin_note or None, int(order_id))
        )
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not updated:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        notify_client(int(order_id), new_status, admin_note)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    cur.close()
    conn.close()
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
