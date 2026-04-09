import json
import os
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Admin-Token',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Каталог товаров: получение списка с фильтрацией по категориям, поиском и пагинацией"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    admin_token = headers_in.get('x-admin-token', '')

    # GET /catalog — публичный список
    if method == 'GET' and not params.get('action'):
        category = params.get('category', '')
        search = params.get('search', '').strip()
        availability = params.get('availability', '')
        sim_type = params.get('sim_type', '')
        limit = min(int(params.get('limit', 200)), 500)
        offset = int(params.get('offset', 0))

        where = [f"is_active = true"]
        args = []

        if category:
            where.append("category = %s")
            args.append(category)
        if availability in ('in_stock', 'on_order'):
            where.append("availability = %s")
            args.append(availability)
        if sim_type:
            where.append("sim_type = %s")
            args.append(sim_type)
        if search:
            where.append("(LOWER(brand) LIKE %s OR LOWER(model) LIKE %s OR LOWER(category) LIKE %s)")
            s = f"%{search.lower()}%"
            args += [s, s, s]

        where_sql = " AND ".join(where)
        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.catalog WHERE {where_sql}", args)
        total = cur.fetchone()[0]

        cur.execute(
            f"""SELECT id, category, brand, model, color, storage, ram, region,
                       availability, price, has_photo, photo_url, description, specs, sim_type
                FROM {SCHEMA}.catalog
                WHERE {where_sql}
                ORDER BY availability DESC, price ASC NULLS LAST
                LIMIT %s OFFSET %s""",
            args + [limit, offset]
        )
        rows = cur.fetchall()

        # Категории для фильтра
        cur.execute(f"SELECT DISTINCT category FROM {SCHEMA}.catalog WHERE is_active = true ORDER BY category")
        categories = [r[0] for r in cur.fetchall()]

        # Наценка из настроек
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key = 'price_markup' LIMIT 1")
        row_markup = cur.fetchone()
        markup = int(row_markup[0]) if row_markup else 3500

        cur.close()
        conn.close()

        items = [{
            'id': r[0], 'category': r[1], 'brand': r[2], 'model': r[3],
            'color': r[4], 'storage': r[5], 'ram': r[6], 'region': r[7],
            'availability': r[8], 'price': r[9], 'has_photo': r[10], 'photo_url': r[11],
            'description': r[12], 'specs': r[13], 'sim_type': r[14]
        } for r in rows]

        return ok({'items': items, 'total': total, 'categories': categories, 'markup': markup})

    # POST /catalog — добавить товар (admin)
    if method == 'POST':
        if not admin_token or admin_token != os.environ.get('ADMIN_TOKEN', ''):
            return err(403, 'Нет доступа')
        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""INSERT INTO {SCHEMA}.catalog
                (category, brand, model, color, storage, ram, region, availability, price, has_photo, photo_url)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (body['category'], body['brand'], body['model'], body.get('color'), body.get('storage'),
             body.get('ram'), body.get('region'), body.get('availability', 'in_stock'),
             body.get('price'), body.get('has_photo', False), body.get('photo_url'))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({'id': new_id})

    # PUT /catalog?id=X — обновить (admin)
    if method == 'PUT':
        if not admin_token or admin_token != os.environ.get('ADMIN_TOKEN', ''):
            return err(403, 'Нет доступа')
        item_id = params.get('id')
        raw = event.get('body', '')
        body = json.loads(raw) if raw else {}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""UPDATE {SCHEMA}.catalog SET
                category=%s, brand=%s, model=%s, color=%s, storage=%s, ram=%s,
                region=%s, availability=%s, price=%s, has_photo=%s, photo_url=%s,
                is_active=%s, updated_at=now() WHERE id=%s""",
            (body['category'], body['brand'], body['model'], body.get('color'), body.get('storage'),
             body.get('ram'), body.get('region'), body.get('availability', 'in_stock'),
             body.get('price'), body.get('has_photo', False), body.get('photo_url'),
             body.get('is_active', True), item_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({'ok': True})

    # DELETE /catalog?id=X (soft delete)
    if method == 'DELETE':
        if not admin_token or admin_token != os.environ.get('ADMIN_TOKEN', ''):
            return err(403, 'Нет доступа')
        item_id = params.get('id')
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.catalog SET is_active=false WHERE id=%s", (item_id,))
        conn.commit()
        cur.close()
        conn.close()
        return ok({'ok': True})

    return err(400, 'Неизвестный запрос')