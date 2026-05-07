import json
import os
from typing import Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def handler(event: dict, context: Any) -> dict:
    """Выдача товаров с Авито для витрины сайта. Поддерживает поиск, пагинацию, получение детали товара."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    q = (qs.get('q') or '').strip()
    item_id = qs.get('id')
    limit = min(int(qs.get('limit') or 60), 200)
    offset = max(int(qs.get('offset') or 0), 0)
    category = (qs.get('category') or '').strip()

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if item_id:
            cur.execute(
                f"""SELECT id, avito_id, title, description, price, url, address,
                       category, photos, main_photo, avito_status, status, synced_at
                    FROM {SCHEMA}.avito_products
                    WHERE id=%s OR avito_id=%s""",
                (int(item_id) if item_id.isdigit() else 0, int(item_id) if item_id.isdigit() else 0),
            )
            row = cur.fetchone()
            if not row:
                return _resp(404, {'ok': False, 'error': 'not found'})
            return _resp(200, {'ok': True, 'item': dict(row)})

        where = ["status = 'active'", "is_visible = true"]
        params: list = []
        if q:
            where.append("(LOWER(title) LIKE %s OR LOWER(description) LIKE %s)")
            ql = f'%{q.lower()}%'
            params.extend([ql, ql])
        if category:
            where.append("category = %s")
            params.append(category)

        where_sql = ' AND '.join(where)

        cur.execute(
            f"SELECT COUNT(*) AS n FROM {SCHEMA}.avito_products WHERE {where_sql}",
            tuple(params),
        )
        total = cur.fetchone()['n']

        cur.execute(
            f"""SELECT id, avito_id, title, price, url, address, category,
                   main_photo, photos, avito_status
                FROM {SCHEMA}.avito_products
                WHERE {where_sql}
                ORDER BY sort_order DESC, synced_at DESC
                LIMIT %s OFFSET %s""",
            tuple(params + [limit, offset]),
        )
        items = [dict(r) for r in cur.fetchall()]

        cur.execute(
            f"""SELECT category, COUNT(*) AS n FROM {SCHEMA}.avito_products
                WHERE status='active' AND is_visible=true AND category IS NOT NULL AND category <> ''
                GROUP BY category ORDER BY n DESC LIMIT 30"""
        )
        categories = [{'name': r['category'], 'count': r['n']} for r in cur.fetchall()]

        return _resp(200, {
            'ok': True,
            'items': items,
            'total': total,
            'limit': limit,
            'offset': offset,
            'categories': categories,
        })
    finally:
        cur.close()
        conn.close()
