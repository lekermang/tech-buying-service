import json
import os
import re
import requests
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
API_URL = 'https://b2b.moysklad.ru/desktop-api/public/wIIpnHFmddpo/products.json'

DEFAULT_LABOR = {
    'display': 1800, 'battery': 1000, 'battery_iphone': 1200, 'battery_other': 800,
    'glass': 700, 'accessory': 500, 'camera_glass': 800, 'flex_board': 1000,
    'rear_glass': 1200, 'speaker_ear': 700, 'speaker_loud': 700, 'vibro': 600, 'back_cover': 900,
}

PART_TYPE_RULES = [
    ('rear_glass',     ['заднее стекло', 'back glass']),
    ('camera_glass',   ['стекл', 'камер']),
    ('glass',          ['стекло', 'тачскрин', 'переклейк']),
    ('flex_board',     ['шлейф', 'плат']),
    ('display',        ['дисплей', 'экран', 'lcd', 'oled', 'amoled']),
    ('speaker_ear',    ['слуховой', 'earpiece', 'наушник']),
    ('speaker_loud',   ['динамик', 'звонок', 'speaker']),
    ('vibro',          ['вибро', 'vibrat']),
    ('back_cover',     ['корпус', 'рамка', 'крышка', 'back cover']),
    ('battery_iphone', ['аккумулятор', 'акб', 'батар']),
    ('accessory',      ['аксессуар', 'прочее']),
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


def get_labor_prices(cur) -> dict:
    """Загружает актуальные цены работ из БД."""
    try:
        cur.execute(f"SELECT part_type, price FROM {SCHEMA}.repair_labor_prices")
        return {r[0]: int(r[1]) for r in cur.fetchall()}
    except Exception:
        return DEFAULT_LABOR.copy()


def get_parts_markup(cur) -> int:
    """Загружает наценку на запчасти из settings."""
    try:
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key = 'parts_markup'")
        row = cur.fetchone()
        return int(row[0]) if row else 0
    except Exception:
        return 0


def get_extra_works(cur) -> list:
    """Загружает список активных доп. работ из БД."""
    try:
        cur.execute(f"SELECT id, label, price FROM {SCHEMA}.repair_extra_works WHERE is_active=true ORDER BY sort_order, id")
        return [{'id': r[0], 'label': r[1], 'price': int(r[2])} for r in cur.fetchall()]
    except Exception:
        return []


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
    labor = get_labor_prices(cur)
    for p in all_products:
        pid      = p.get('id', '')
        name     = p.get('name', '')
        category = p.get('category', '')
        part_type      = detect_part_type(category, name)
        quality        = detect_quality(name)
        model_keywords = extract_model_keywords(name)
        labor_cost     = labor.get(part_type, DEFAULT_LABOR.get(part_type, 500))

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


def get_client_discount(cur, phone: str) -> dict:
    """Проверяет клиента по телефону и возвращает скидку."""
    if not phone:
        return {'found': False, 'discount_pct': 0}
    clean = ''.join(c for c in phone if c.isdigit())
    if len(clean) < 10:
        return {'found': False, 'discount_pct': 0}
    # Нормализуем: берём последние 10 цифр для поиска
    suffix = clean[-10:]
    cur.execute(f"""
        SELECT id, full_name, discount_pct FROM {SCHEMA}.repair_clients
        WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}'
    """)
    row = cur.fetchone()
    if row:
        return {'found': True, 'client_id': row[0], 'full_name': row[1], 'discount_pct': row[2]}
    return {'found': False, 'discount_pct': 0}


def search_parts(conn, model: str, phone: str = '') -> tuple:
    words = [w for w in model.lower().split() if len(w) >= 2]
    if not words:
        return [], [], {}
    conditions = ' AND '.join([f"LOWER(model_keywords) LIKE '%%{w}%%'" for w in words])
    cur = conn.cursor()

    labor = get_labor_prices(cur)
    markup = get_parts_markup(cur)
    extra = get_extra_works(cur)
    client_info = get_client_discount(cur, phone)

    cur.execute(f"""
        SELECT id, name, category, price, stock, quality, part_type
        FROM {SCHEMA}.repair_parts
        WHERE available = true AND ({conditions})
        ORDER BY part_type, quality DESC, price ASC
        LIMIT 200
    """)
    rows = cur.fetchall()
    cur.close()
    parts = []
    for r in rows:
        pid, name, category, price, stock, quality, part_type = r
        raw_price = float(price or 0)
        marked_price = raw_price + markup
        labor_cost = labor.get(part_type, DEFAULT_LABOR.get(part_type, 500))
        total = marked_price + labor_cost
        parts.append({
            'id': pid,
            'name': name,
            'category': category,
            'price': marked_price,
            'raw_price': raw_price,
            'markup': markup,
            'stock': float(stock or 0),
            'quality': quality,
            'part_type': part_type,
            'labor_cost': labor_cost,
            'total': total,
        })
    return parts, extra, client_info


def handler(event: dict, context) -> dict:
    """
    GET ?model=iphone+13  — поиск запчастей (цены работ и наценка из БД).
    POST                   — синхронизация каталога из МойСклад.
    """

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    if event.get('httpMethod') == 'POST':
        try:
            synced = sync_catalog(conn)
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps({'ok': True, 'synced': synced})}
        except Exception as e:
            conn.close()
            print(f"[SYNC ERROR] {type(e).__name__}: {e}")
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'ok': False, 'error': str(e)})}

    params = event.get('queryStringParameters') or {}
    model = (params.get('model') or '').strip()
    phone = (params.get('phone') or '').strip()

    if not model or len(model) < 2:
        conn.close()
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'error': 'model обязателен'}, ensure_ascii=False)}

    parts, extra_works, client_info = search_parts(conn, model, phone)
    conn.close()

    return {'statusCode': 200, 'headers': HEADERS,
            'body': json.dumps({
                'parts': parts,
                'extra_works': extra_works,
                'client': client_info,
            }, ensure_ascii=False)}