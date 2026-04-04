import json
import os
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')


def auth(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    return headers.get('x-admin-token', '') == ADMIN_TOKEN and bool(ADMIN_TOKEN)


def handler(event: dict, context) -> dict:
    """Получение и обновление прайса на ремонт и закупку (GET — публично, POST/PUT/DELETE — только админ)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token'},
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # GET — публичный, возвращает весь прайс
    if method == 'GET':
        cur.execute(f"SELECT id, category, name, price_from, price_to, unit, sort_order FROM {SCHEMA}.repair_prices ORDER BY sort_order, id")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        items = [{'id': r[0], 'category': r[1], 'name': r[2], 'price_from': r[3], 'price_to': r[4], 'unit': r[5], 'sort_order': r[6]} for r in rows]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'items': items}, ensure_ascii=False)}

    # Все остальные методы — только для админа
    if not auth(event):
        cur.close()
        conn.close()
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})

    # POST — добавить новую позицию
    if method == 'POST':
        category = body.get('category', '').strip()
        name = body.get('name', '').strip()
        price_from = body.get('price_from')
        price_to = body.get('price_to')
        unit = body.get('unit', 'шт').strip()
        sort_order = body.get('sort_order', 0)

        if not category or not name or price_from is None:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'category, name, price_from обязательны'}, ensure_ascii=False)}

        cur.execute(
            f"INSERT INTO {SCHEMA}.repair_prices (category, name, price_from, price_to, unit, sort_order) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (category, name, int(price_from), int(price_to) if price_to else None, unit, int(sort_order))
        )
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'id': new_id}, ensure_ascii=False)}

    # PUT — обновить позицию
    if method == 'PUT':
        item_id = body.get('id')
        if not item_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'id обязателен'}, ensure_ascii=False)}

        fields = []
        values = []
        for field in ('category', 'name', 'unit'):
            if field in body:
                fields.append(f"{field} = %s")
                values.append(body[field])
        for field in ('price_from', 'price_to', 'sort_order'):
            if field in body:
                fields.append(f"{field} = %s")
                values.append(int(body[field]) if body[field] is not None else None)

        if not fields:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Нет полей для обновления'}, ensure_ascii=False)}

        fields.append("updated_at = NOW()")
        values.append(int(item_id))
        cur.execute(f"UPDATE {SCHEMA}.repair_prices SET {', '.join(fields)} WHERE id = %s RETURNING id", values)
        updated = cur.fetchone()
        conn.commit(); cur.close(); conn.close()

        if not updated:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Позиция не найдена'}, ensure_ascii=False)}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    # DELETE — удалить позицию
    if method == 'DELETE':
        item_id = body.get('id')
        if not item_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'id обязателен'}, ensure_ascii=False)}

        cur.execute(f"DELETE FROM {SCHEMA}.repair_prices WHERE id = %s RETURNING id", (int(item_id),))
        deleted = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        if not deleted:
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Позиция не найдена'}, ensure_ascii=False)}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    cur.close(); conn.close()
    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}
