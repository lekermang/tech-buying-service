import json
import os
import re
import requests
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
API_URL = 'https://b2b.moysklad.ru/desktop-api/public/wIIpnHFmddpo/products.json'

LABOR_COSTS = {
    'display':      2000,
    'battery':      1000,
    'glass':         700,
    'accessory':     500,
    'camera_glass': 1000,
    'flex_board':   1200,
}

PART_TYPE_RULES = [
    ('battery',      ['аккумулятор', 'акб']),
    ('camera_glass', ['стекл', 'камер']),
    ('glass',        ['стекло', 'тачскрин', 'переклейк']),
    ('flex_board',   ['шлейф', 'плат']),
    ('display',      ['дисплей', 'экран', 'lcd', 'oled', 'amoled']),
    ('accessory',    ['аксессуар', 'динамик', 'звонок', 'вибро', 'корпус', 'рамка', 'крышка', 'прочее']),
]

QUALITY_RULES = [
    ('ORIG', ['orig', 'оригинал', 'original']),
    ('AAA',  ['aaa', 'ааа']),
    ('AA',   ['aa', 'аа', 'премиум', 'premium']),
    ('A',    ['копия', 'copy']),
]


def detect_part_type(category: str, name: str) -> str:
    text = (category + ' ' + name).lower()
    for ptype, keywords in PART_TYPE_RULES:
        for kw in keywords:
            if kw in text:
                return ptype
    return 'accessory'


def detect_quality(name: str) -> str:
    text = name.lower()
    for quality, keywords in QUALITY_RULES:
        for kw in keywords:
            if kw in text:
                return quality
    return 'A'


def extract_model_keywords(name: str) -> str:
    brackets = re.findall(r'\(([^)]+)\)', name)
    models = []
    for b in brackets:
        parts = re.split(r'[/,;]+', b)
        models.extend([p.strip().lower() for p in parts if p.strip()])
    models.append(name.lower())
    return ' | '.join(dict.fromkeys(models))


def sync_catalog(conn) -> int:
    all_products = []
    offset = 0
    limit = 100
    while True:
        resp = requests.get(API_URL, params={
            'category': '', 'category_id': '', 'limit': limit, 'offset': offset, 'search': ''
        }, timeout=30)
        data = resp.json()
        products = data.get('products', [])
        if not products:
            break
        all_products.extend(products)
        if len(products) < limit:
            break
        offset += limit

    cur = conn.cursor()
    for p in all_products:
        pid      = p.get('id', '')
        name     = p.get('name', '')
        category = p.get('category', '')
        part_type      = detect_part_type(category, name)
        quality        = detect_quality(name)
        model_keywords = extract_model_keywords(name)
        labor_cost     = LABOR_COSTS.get(part_type, 500)

        cur.execute(f"""
            INSERT INTO {SCHEMA}.repair_parts
                (id, code, name, category, category_id, price, stock, available,
                 quality, part_type, model_keywords, labor_cost, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (id) DO UPDATE SET
                name=EXCLUDED.name, category=EXCLUDED.category,
                price=EXCLUDED.price, stock=EXCLUDED.stock,
                available=EXCLUDED.available, quality=EXCLUDED.quality,
                part_type=EXCLUDED.part_type, model_keywords=EXCLUDED.model_keywords,
                labor_cost=EXCLUDED.labor_cost, updated_at=NOW()
        """, (pid, p.get('code', ''), name, category, p.get('categoryId', ''),
              p.get('price') or 0, p.get('stock') or 0, p.get('available', True),
              quality, part_type, model_keywords, labor_cost))
    conn.commit()
    cur.close()
    return len(all_products)


def search_parts(conn, model: str) -> list:
    words = [w for w in model.lower().split() if len(w) >= 2]
    if not words:
        return []
    conditions = ' AND '.join([f"LOWER(model_keywords) LIKE '%%{w}%%'" for w in words])
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, name, category, price, stock, quality, part_type, labor_cost
        FROM {SCHEMA}.repair_parts
        WHERE available = true AND ({conditions})
        ORDER BY part_type, quality DESC, price ASC
        LIMIT 200
    """)
    rows = cur.fetchall()
    cur.close()
    parts = []
    for r in rows:
        pid, name, category, price, stock, quality, part_type, labor_cost = r
        parts.append({
            'id': pid,
            'name': name,
            'category': category,
            'price': float(price or 0),
            'stock': float(stock or 0),
            'quality': quality,
            'part_type': part_type,
            'labor_cost': labor_cost or 0,
            'total': float(price or 0) + (labor_cost or 0),
        })
    return parts


def handler(event: dict, context) -> dict:
    """
    GET ?model=iphone+13  — поиск запчастей по модели с ценой работ.
    POST (без тела)        — синхронизация каталога из МойСклад (запускать из админки).
    """

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    if event.get('httpMethod') == 'POST':
        synced = sync_catalog(conn)
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({'ok': True, 'synced': synced})}

    params = event.get('queryStringParameters') or {}
    model = (params.get('model') or '').strip()

    if not model or len(model) < 2:
        conn.close()
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'error': 'model обязателен'}, ensure_ascii=False)}

    parts = search_parts(conn, model)
    conn.close()

    return {'statusCode': 200, 'headers': HEADERS,
            'body': json.dumps({'parts': parts}, ensure_ascii=False)}
