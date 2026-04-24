import json
import os
import re
import requests
import psycopg2

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token, Authorization',
}
SCHEMA = 't_p31606708_tech_buying_service'
API_URL = 'https://b2b.moysklad.ru/desktop-api/public/wIIpnHFmddpo/products.json'
MOBA_BASE = 'https://kaluga.moba.ru'
MOBA_PAGE_SIZE = 50

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


PAGE_SIZE = 100


# ─── MOBA.RU (Битрикс-парсинг через куки браузера) ──────────────────────────

import re as _re

# Категории каталога для полного обхода
MOBA_CATALOG_SECTIONS = [
    '/catalog/displei/',
    '/catalog/akkumulyatory/',
    '/catalog/steklo-kamer/',
    '/catalog/shleyfy/',
    '/catalog/dinamiki-i-mikrofony/',
    '/catalog/vibromotory/',
    '/catalog/zadnie-kryshki/',
]


def moba_session() -> requests.Session:
    """Создаёт сессию и авторизуется на moba.ru через Битрикс-форму."""
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru,en;q=0.9',
    })
    login = os.environ.get('MOBA_LOGIN', '')
    password = os.environ.get('MOBA_PASSWORD', '')

    # Шаг 1: получаем начальные куки (PHPSESSID) через главную страницу
    try:
        session.get(f'{MOBA_BASE}/?login=yes', timeout=15, allow_redirects=True)
    except Exception as e:
        print(f'[MOBA] get main error: {e}')

    # Шаг 2: авторизуемся через ajax/form.php (Битрикс)
    try:
        resp = session.post(
            f'{MOBA_BASE}/ajax/form.php',
            params={'type': 'auth', 'backurl': '/?login=yes', 'auth': 'Y'},
            data={
                'AUTH_FORM': 'Y',
                'TYPE': 'AUTH',
                'backurl': '/?login=yes',
                'USER_LOGIN': login,
                'USER_PASSWORD': password,
                'USER_REMEMBER': 'Y',
            },
            headers={
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': f'{MOBA_BASE}/?login=yes',
                'x-requested-with': 'XMLHttpRequest',
                'bx-ajax': 'true',
            },
            timeout=15,
            allow_redirects=True,
        )
        print(f'[MOBA] auth status={resp.status_code} cookies={list(session.cookies.keys())}')
    except Exception as e:
        print(f'[MOBA] auth error: {e}')

    return session


def moba_search_html(session: requests.Session, query: str) -> list:
    """Ищет товары через /ajax/search_title.php (Битрикс-поиск)."""
    try:
        resp = session.post(
            f'{MOBA_BASE}/ajax/search_title.php',
            data={'ajax_call': 'y', 'q': query, 'l': '1', 'INPUT_ID': 'title-search-input_fixed'},
            headers={'Content-Type': 'application/x-www-form-urlencoded', 'Referer': MOBA_BASE + '/'},
            timeout=15
        )
        if resp.status_code != 200:
            print(f'[MOBA] search {query!r}: status={resp.status_code}')
            return []
        html = resp.text
        return moba_parse_search(html, query)
    except Exception as e:
        print(f'[MOBA] search error: {e}')
        return []


def moba_parse_search(html: str, query: str) -> list:
    """Парсит HTML ответа поиска — извлекает товары."""
    products = []
    # Ищем блоки товаров: id, название, цену
    ids = _re.findall(r'data-id=["\']?(\d+)["\']?', html)
    names = _re.findall(r'<a[^>]+class=["\'][^"\']*name[^"\']*["\'][^>]*>([^<]+)<', html)
    prices = _re.findall(r'(\d[\d\s]{2,8})\s*[₽руб]', html)
    # Более простой подход — ищем элементы каталога
    items = _re.findall(
        r'data-id=["\']?(\d+)["\']?[^>]*>.*?<[^>]+class=["\'][^"\']*(?:name|title)["\'][^>]*>\s*([^<]{5,120})',
        html, _re.DOTALL
    )
    if items:
        for pid, name in items[:50]:
            name = name.strip()
            if len(name) < 4:
                continue
            products.append({'id': pid, 'name': name, 'category': query, 'price': 0, 'stock': 1})
    return products


def moba_catalog_page(session: requests.Session, section: str, page: int = 1) -> list:
    """Получает страницу каталога и парсит товары."""
    url = f'{MOBA_BASE}{section}'
    params = {'PAGEN_1': page} if page > 1 else {}
    try:
        resp = session.get(url, params=params, timeout=20, allow_redirects=True,
                           headers={'Accept': 'text/html', 'Referer': MOBA_BASE + '/'})
        print(f'[MOBA] catalog {section} p{page}: status={resp.status_code} url={resp.url} html_len={len(resp.text)} snippet={resp.text[:300]!r}')
        if resp.status_code != 200:
            return []
        return moba_parse_catalog(resp.text, section)
    except Exception as e:
        print(f'[MOBA] catalog error {section}: {e}')
        return []


def moba_parse_catalog(html: str, section: str) -> list:
    """Парсит страницу каталога moba.ru (1С-Битрикс aspro_next)."""
    products = []
    # Ищем карточки товаров: data-id + название + цена
    # Битрикс обычно ставит data-id на .catalog-item или similar
    blocks = _re.findall(
        r'<div[^>]+data-id=["\'](\d+)["\'][^>]*>(.*?)</div>\s*</div>',
        html, _re.DOTALL
    )
    category = section.strip('/').split('/')[-1]
    for pid, block in blocks[:60]:
        # Название
        name_m = _re.search(r'<a[^>]+title=["\']([^"\']{5,150})["\']', block)
        if not name_m:
            name_m = _re.search(r'class=["\'][^"\']*item-title[^"\']*["\'][^>]*>\s*<a[^>]*>([^<]{5,150})', block)
        name = name_m.group(1).strip() if name_m else ''
        if not name:
            continue
        # Цена
        price_m = _re.search(r'(\d[\d\s]{1,7})\s*(?:₽|руб)', block)
        price = float(_re.sub(r'\s', '', price_m.group(1))) if price_m else 0
        # Наличие
        in_stock = 'в наличии' in block.lower() or 'item-in-stock' in block
        products.append({
            'id': pid,
            'name': name,
            'category': category,
            'price': price,
            'stock': 1 if in_stock else 0,
        })
    return products


def moba_normalize(p: dict) -> dict:
    name = str(p.get('name') or '')
    category = str(p.get('category') or '')
    price = float(p.get('price') or 0)
    stock = float(p.get('stock') or 0)
    pid = str(p.get('id') or '')
    return {
        'id': f'moba_{pid}',
        'code': pid,
        'name': name,
        'category': category,
        'price': price,
        'stock': stock,
        'available': stock > 0 or price > 0,
        'quality': detect_quality(name),
        'part_type': detect_part_type(category, name),
        'model_keywords': extract_model_keywords(name),
    }


def moba_save(conn, products: list, labor: dict) -> int:
    cur = conn.cursor()
    saved = 0
    for p in products:
        if not p['id'] or p['id'] == 'moba_':
            continue
        labor_cost = labor.get(p['part_type'], DEFAULT_LABOR.get(p['part_type'], 500))
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
        """, (
            p['id'], p['code'], p['name'], p['category'], '',
            p['price'], p['stock'], p['available'],
            p['quality'], p['part_type'], p['model_keywords'], labor_cost
        ))
        saved += 1
    conn.commit()
    cur.close()
    return saved


def moba_sync_page(conn, offset: int) -> dict:
    """Синхронизирует одну секцию каталога moba.ru через парсинг HTML."""
    session = moba_session()
    idx = offset // 50   # номер секции
    page = (offset % 50) // 10 + 1  # страница внутри секции

    if idx >= len(MOBA_CATALOG_SECTIONS):
        return {'saved': 0, 'total': len(MOBA_CATALOG_SECTIONS) * 50, 'offset': offset,
                'next_offset': None, 'has_more': False, 'api_url': ''}

    section = MOBA_CATALOG_SECTIONS[idx]
    raw = moba_catalog_page(session, section, page)
    print(f'[MOBA] section={section} page={page} found={len(raw)}')

    cur = conn.cursor()
    labor = get_labor_prices(cur)
    cur.close()
    products = [moba_normalize(p) for p in raw if p.get('id')]
    saved = moba_save(conn, products, labor)

    total_est = len(MOBA_CATALOG_SECTIONS) * 50
    next_offset = offset + 10
    has_more = next_offset < total_est and (len(raw) >= 10 or page == 1)

    return {
        'saved': saved,
        'total': total_est,
        'offset': offset,
        'next_offset': next_offset if has_more else None,
        'has_more': has_more,
        'api_url': f'{MOBA_BASE}{section}?page={page}',
    }

# ─────────────────────────────────────────────────────────────────────────────


def sync_page(conn, offset: int) -> dict:
    """Синхронизирует одну страницу товаров из МойСклад."""
    resp = requests.get(API_URL, params={
        'category': '', 'category_id': '', 'limit': PAGE_SIZE, 'offset': offset, 'search': ''
    }, timeout=30)
    data = resp.json()
    products = data.get('products', [])
    total = data.get('total', 0)

    cur = conn.cursor()
    labor = get_labor_prices(cur)
    for p in products:
        pid           = p.get('id', '')
        name          = p.get('name', '')
        category      = p.get('category', '')
        part_type     = detect_part_type(category, name)
        quality       = detect_quality(name)
        model_keywords = extract_model_keywords(name)
        labor_cost    = labor.get(part_type, DEFAULT_LABOR.get(part_type, 500))
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

    saved = len(products)
    has_more = (offset + saved) < total and saved == PAGE_SIZE
    return {
        'saved': saved,
        'total': total,
        'offset': offset,
        'next_offset': offset + saved if has_more else None,
        'has_more': has_more,
    }


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
    # Ищем по model_keywords ИЛИ по name/category — чтобы работало даже для старых
    # записей без keywords и для только что загруженных Excel-прайсов
    conditions = ' AND '.join([
        f"(LOWER(COALESCE(model_keywords,'')) LIKE '%%{w}%%' OR LOWER(name) LIKE '%%{w}%%' OR LOWER(COALESCE(category,'')) LIKE '%%{w}%%')"
        for w in words
    ])
    cur = conn.cursor()

    labor = get_labor_prices(cur)
    extra = get_extra_works(cur)
    client_info = get_client_discount(cur, phone)

    # Последний batch загруженного прайса (для метки NEW)
    try:
        cur.execute(f"SELECT price_batch_id FROM {SCHEMA}.repair_parts WHERE price_batch_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1")
        row = cur.fetchone()
        latest_batch = row[0] if row else None
    except Exception:
        latest_batch = None

    cur.execute(f"""
        SELECT id, name, category, price, stock, quality, part_type, price_batch_id, supplier_price
        FROM {SCHEMA}.repair_parts
        WHERE available = true AND ({conditions})
        ORDER BY part_type, quality DESC, price ASC
        LIMIT 200
    """)
    rows = cur.fetchall()
    cur.close()
    parts = []
    for r in rows:
        pid, name, category, price, stock, quality, part_type, batch_id, supplier_price = r
        # price уже с наценкой (применяется при импорте по таблице repair_parts_markup per-category)
        final_price = float(price or 0)
        labor_cost = labor.get(part_type, DEFAULT_LABOR.get(part_type, 500))
        total = final_price + labor_cost
        sup = float(supplier_price) if supplier_price is not None else None
        parts.append({
            'id': pid,
            'name': name,
            'category': category,
            'price': final_price,
            'raw_price': sup if sup is not None else final_price,
            'supplier_price': sup,
            'markup': round(final_price - sup, 2) if sup else 0,
            'stock': float(stock or 0),
            'quality': quality,
            'part_type': part_type,
            'labor_cost': labor_cost,
            'total': total,
            'is_latest_batch': bool(latest_batch and batch_id == latest_batch),
        })
    return parts, extra, client_info


def handler(event: dict, context) -> dict:
    """
    GET ?model=iphone+13  — поиск запчастей (цены работ и наценка из БД).
    POST                   — синхронизация каталога из МойСклад.
    """

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])

    if event.get('httpMethod') == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', 'moysklad_sync')

            if action == 'moba_sync':
                offset = int(body.get('offset', 0))
                result = moba_sync_page(conn, offset)
                conn.close()
                return {'statusCode': 200, 'headers': HEADERS,
                        'body': json.dumps({'ok': True, **result}, ensure_ascii=False)}

            # default: МойСклад
            offset = int(body.get('offset', 0))
            result = sync_page(conn, offset)
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps({'ok': True, **result})}
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