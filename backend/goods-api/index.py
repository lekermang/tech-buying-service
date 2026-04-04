import json
import os
from datetime import datetime
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"SELECT id, full_name, role FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (token,))
    row = cur.fetchone(); cur.close(); conn.close()
    return {'id': row[0], 'full_name': row[1], 'role': row[2]} if row else None


def handler(event: dict, context) -> dict:
    """Управление б/у товарами: добавление, список, статус, ценник, поиск"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    # GET — публичный поиск товаров
    if method == 'GET':
        conn = get_conn(); cur = conn.cursor()
        q = params.get('q', '').strip()
        category = params.get('category', '').strip()
        status = params.get('status', 'available').strip()
        limit = min(int(params.get('limit', 50)), 200)

        conditions = ["status=%s"]
        values = [status]
        if q:
            conditions.append("(LOWER(title) LIKE %s OR LOWER(model) LIKE %s OR LOWER(brand) LIKE %s)")
            like = f'%{q.lower()}%'
            values += [like, like, like]
        if category:
            conditions.append("category=%s")
            values.append(category)

        cur.execute(f"""SELECT id, title, category, brand, model, condition, color, storage,
                        sell_price, status, description, photo_url, added_at
                        FROM {SCHEMA}.goods WHERE {' AND '.join(conditions)}
                        ORDER BY added_at DESC LIMIT %s""", values + [limit])
        rows = cur.fetchall(); cur.close(); conn.close()
        items = [{'id': r[0], 'title': r[1], 'category': r[2], 'brand': r[3], 'model': r[4],
                  'condition': r[5], 'color': r[6], 'storage': r[7], 'sell_price': r[8],
                  'status': r[9], 'description': r[10], 'photo_url': r[11],
                  'added_at': r[12].isoformat() if r[12] else None} for r in rows]
        return _ok({'items': items, 'total': len(items)})

    # POST — добавить товар (сотрудник)
    if method == 'POST' and body.get('action') == 'add':
        emp = get_employee(emp_token)
        if not emp:
            return _err(401, 'Требуется авторизация сотрудника')
        title = body.get('title', '').strip()
        purchase_price = body.get('purchase_price')
        sell_price = body.get('sell_price')
        if not title or purchase_price is None or sell_price is None:
            return _err(400, 'Название, цена закупки и цена продажи обязательны')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""INSERT INTO {SCHEMA}.goods
            (title, category, brand, model, condition, color, storage, imei,
             purchase_price, sell_price, description, photo_url, client_id, employee_id)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (title, body.get('category', 'Смартфон'), body.get('brand'), body.get('model'),
             body.get('condition', 'хорошее'), body.get('color'), body.get('storage'),
             body.get('imei'), int(purchase_price), int(sell_price),
             body.get('description'), body.get('photo_url'),
             body.get('client_id'), emp['id']))
        new_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return _ok({'id': new_id, 'ok': True})

    # PUT — изменить статус или цену
    if method == 'PUT':
        emp = get_employee(emp_token)
        if not emp:
            return _err(401, 'Требуется авторизация сотрудника')
        good_id = body.get('id')
        if not good_id:
            return _err(400, 'id обязателен')
        conn = get_conn(); cur = conn.cursor()
        fields, values = [], []
        for f in ('status', 'sell_price', 'purchase_price', 'description', 'condition', 'photo_url'):
            if f in body:
                fields.append(f"{f}=%s"); values.append(body[f])
        if body.get('status') == 'sold':
            fields.append("sold_at=NOW()")
        if fields:
            fields.append("updated_at=NOW()")
            values.append(int(good_id))
            cur.execute(f"UPDATE {SCHEMA}.goods SET {', '.join(fields)} WHERE id=%s RETURNING id", values)
            updated = cur.fetchone()
            conn.commit(); cur.close(); conn.close()
            if not updated:
                return _err(404, 'Товар не найден')
        return _ok({'ok': True})

    # GET /detail?id=N — детали товара для сотрудника (с ценой закупки)
    if method == 'GET' and params.get('action') == 'detail':
        emp = get_employee(emp_token)
        if not emp:
            return _err(401, 'Требуется авторизация')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""SELECT g.*, c.full_name as client_name, c.phone as client_phone,
                        e.full_name as employee_name
                        FROM {SCHEMA}.goods g
                        LEFT JOIN {SCHEMA}.clients c ON g.client_id=c.id
                        LEFT JOIN {SCHEMA}.employees e ON g.employee_id=e.id
                        WHERE g.id=%s""", (params['id'],))
        row = cur.fetchone()
        desc = [d[0] for d in cur.description]
        cur.close(); conn.close()
        if not row:
            return _err(404, 'Не найдено')
        return _ok(dict(zip(desc, [v.isoformat() if isinstance(v, datetime) else v for v in row])))

    return _err(404, 'Не найдено')


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}
