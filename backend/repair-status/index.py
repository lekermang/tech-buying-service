import json
import os
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

STATUS_LABELS = {
    'new': 'Заявка принята',
    'in_progress': 'В работе',
    'waiting_parts': 'Ожидаем запчасть',
    'ready': 'Готово — можно забирать!',
    'done': 'Выдано',
    'cancelled': 'Отменено',
}


def handler(event: dict, context) -> dict:
    """Получение статуса заявки на ремонт по ID (для клиента)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    order_id = params.get('id', '').strip()

    if not order_id or not order_id.isdigit():
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите ID заявки'}, ensure_ascii=False)}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, name, model, repair_type, price, status, admin_note, created_at FROM {SCHEMA}.repair_orders WHERE id = %s",
        (int(order_id),)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

    oid, name, model, repair_type, price, status, admin_note, created_at = row
    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({
            'id': oid,
            'name': name,
            'model': model,
            'repair_type': repair_type,
            'price': price,
            'status': status,
            'status_label': STATUS_LABELS.get(status, status),
            'admin_note': admin_note,
            'created_at': created_at.isoformat() if created_at else None,
        }, ensure_ascii=False),
    }
