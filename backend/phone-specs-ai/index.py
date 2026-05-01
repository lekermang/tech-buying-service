"""
Генерация подробных характеристик смартфонов через ИИ (Polza.ai GPT-4o).
Формат — компактный, под термоэтикетку 58×40 мм (5–6 строк).
- POST /?action=generate_one  body={item_id} — сгенерировать для одного товара
- POST /?action=generate_batch body={limit:30, only_empty:true} — пакетная генерация
- GET  /?action=status — статистика: сколько обработано / осталось
"""

import json
import os
import urllib.request
import urllib.error
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Content-Type': 'application/json',
}

PROMPT_TPL = (
    "Сгенерируй РЕАЛЬНЫЕ подробные характеристики смартфона компактно для термоэтикетки 58×40 мм.\n"
    "Модель: {title}\n\n"
    "Формат — РОВНО 4 строки, каждая — категория и параметры через запятую. Пример:\n"
    "Экран: 6,74″, IPS, 720×1600 пикс, 90 Гц.\n"
    "Память: 3 ГБ ОЗУ, 64 ГБ ПЗУ + слот для microSD (до 1 ТБ).\n"
    "Аккумулятор: 5000 мАч, зарядка 10 Вт; процессор: Unisoc Tiger T612 (8 ядер, 1,82 ГГц), ОС: Android 13.\n"
    "Камера: 50 Мп основная, 8 Мп фронт, вспышка LED.\n\n"
    "Требования:\n"
    "- Только реальные параметры этой модели, не выдумывай.\n"
    "- Если точная модификация неизвестна — укажи характеристики базовой версии.\n"
    "- Категории строго: Экран, Память, Аккумулятор, Камера.\n"
    "- Каждая строка ≤ 90 символов.\n"
    "- Без заголовков, эмодзи, маркировок.\n"
    "- Только сами 4 строки в ответе, ничего больше.\n"
    "- Также верни КРАТКОЕ описание одной строкой ≤ 60 символов в формате specs_short, например: '6.74\" 3/64GB 5000mAh'.\n\n"
    "Верни строго JSON: {{\"specs\": \"...4 строки через \\\\n...\", \"specs_short\": \"...\"}}"
)


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def call_polza(prompt: str) -> dict:
    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        raise ValueError('POLZA_AI_API_KEY not set')

    payload = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 500,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.polza.ai/v1/chat/completions',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = json.loads(resp.read())
    raw = data['choices'][0]['message']['content'].strip()
    # вычистить возможные ```json ... ```
    if raw.startswith('```'):
        raw = raw.strip('`')
        if raw.startswith('json'):
            raw = raw[4:]
        raw = raw.strip()
    parsed = json.loads(raw)
    specs = (parsed.get('specs') or '').strip()
    short = (parsed.get('specs_short') or '').strip()
    return {'specs': specs[:500], 'specs_short': short[:100]}


def generate_for_item(item_id: int) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, title, brand, model, storage FROM {SCHEMA}.slshop_items WHERE id=%s",
        (item_id,),
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return {'ok': False, 'error': 'item not found'}
    iid, title, brand, model, storage = row
    text = title or ''
    if brand or model:
        text = f"{brand or ''} {model or ''} {storage or ''}".strip() + (f' — {title}' if title else '')

    try:
        result = call_polza(PROMPT_TPL.format(title=text))
    except Exception as e:
        cur.close(); conn.close()
        return {'ok': False, 'error': f'AI error: {e}'}

    cur.execute(
        f"UPDATE {SCHEMA}.slshop_items SET specs=%s, specs_short=%s, updated_at=NOW() WHERE id=%s",
        (result['specs'], result['specs_short'], iid),
    )
    conn.commit()
    cur.close(); conn.close()
    return {'ok': True, 'item_id': iid, 'specs': result['specs'], 'specs_short': result['specs_short']}


def generate_batch(limit: int = 20, only_empty: bool = True) -> dict:
    conn = get_conn()
    cur = conn.cursor()
    where_empty = "AND (i.specs IS NULL OR i.specs = '')" if only_empty else ""
    cur.execute(
        f"""
        SELECT i.id FROM {SCHEMA}.slshop_items i
        LEFT JOIN {SCHEMA}.slshop_categories c ON c.id = i.category_id
        WHERE (c.slug IN ('mob_phones','techno_spark') OR c.name IN ('Мобильные телефоны','Смартфоны'))
        {where_empty}
        ORDER BY i.id
        LIMIT %s
        """,
        (limit,),
    )
    ids = [r[0] for r in cur.fetchall()]
    cur.close(); conn.close()

    done = 0
    errors = []
    for iid in ids:
        r = generate_for_item(iid)
        if r.get('ok'):
            done += 1
        else:
            errors.append({'id': iid, 'error': r.get('error')})
    return {'ok': True, 'processed': done, 'total_in_batch': len(ids), 'errors': errors}


def get_status() -> dict:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE i.specs IS NULL OR i.specs = '') AS empty
        FROM {SCHEMA}.slshop_items i
        LEFT JOIN {SCHEMA}.slshop_categories c ON c.id = i.category_id
        WHERE c.slug IN ('mob_phones','techno_spark') OR c.name IN ('Мобильные телефоны','Смартфоны')
        """
    )
    total, empty = cur.fetchone()
    cur.close(); conn.close()
    return {'ok': True, 'total': total, 'empty': empty, 'filled': total - empty}


def handler(event, context):
    """Генерация характеристик смартфонов через ИИ для термоэтикетки."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', 'status')

    try:
        if action == 'status':
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps(get_status(), ensure_ascii=False)}

        body_raw = event.get('body') or '{}'
        try:
            body = json.loads(body_raw) if isinstance(body_raw, str) else body_raw
        except Exception:
            body = {}

        if action == 'generate_one':
            iid = int(body.get('item_id') or 0)
            if not iid:
                return {'statusCode': 400, 'headers': HEADERS,
                        'body': json.dumps({'ok': False, 'error': 'item_id required'})}
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps(generate_for_item(iid), ensure_ascii=False)}

        if action == 'generate_batch':
            limit = int(body.get('limit') or 20)
            only_empty = bool(body.get('only_empty', True))
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps(generate_batch(limit, only_empty), ensure_ascii=False)}

        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'ok': False, 'error': 'unknown action'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'ok': False, 'error': str(e)}, ensure_ascii=False)}
