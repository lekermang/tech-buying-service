import json
import os
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

STATUS_LABELS = {
    'new': 'Заявка принята',
    'accepted': 'Принят мастером',
    'in_progress': 'В работе',
    'waiting_parts': 'Ожидаем запчасть',
    'ready': 'Готово — можно забирать!',
    'done': 'Выдано',
    'warranty': 'На гарантии',
    'cancelled': 'Отменено',
}


def row_to_dict(row):
    oid, name, model, repair_type, price, status, admin_note, created_at = row
    return {
        'id': oid,
        'name': name,
        'model': model,
        'repair_type': repair_type,
        'price': price,
        'status': status,
        'status_label': STATUS_LABELS.get(status, status),
        'admin_note': admin_note,
        'created_at': created_at.isoformat() if created_at else None,
    }


def handler(event: dict, context) -> dict:
    """Получение статуса заявки на ремонт по ID или по номеру телефона (для клиента)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
            'body': '',
        }

    params = event.get('queryStringParameters') or {}
    order_id = params.get('id', '').strip()
    phone = params.get('phone', '').strip()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Поиск по номеру телефона — возвращает список
    if phone:
        phone_clean = ''.join(c for c in phone if c.isdigit())
        cur.execute(
            f"""SELECT id, name, model, repair_type, price, status, admin_note, created_at
                FROM {SCHEMA}.repair_orders
                WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s
                  AND status != 'cancelled'
                ORDER BY created_at DESC LIMIT 10""",
            ('%' + phone_clean[-7:] + '%',)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявки по этому номеру не найдены'}, ensure_ascii=False)}

        return {
            'statusCode': 200,
            'headers': HEADERS,
            'body': json.dumps({'orders': [row_to_dict(r) for r in rows]}, ensure_ascii=False),
        }

    # Поиск по ID
    if not order_id or not order_id.isdigit():
        cur.close()
        conn.close()
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Укажите ID заявки или номер телефона'}, ensure_ascii=False)}

    cur.execute(
        f"SELECT id, name, model, repair_type, price, status, admin_note, created_at FROM {SCHEMA}.repair_orders WHERE id = %s",
        (int(order_id),)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps(row_to_dict(row), ensure_ascii=False),
    }
