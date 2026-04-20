import json
import os
import base64
import io
import re
import psycopg2

def handler(event: dict, context) -> dict:
    """Импорт запчастей из Excel-файла (base64). Парсит колонки: название, категория, цена, остаток, качество."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id, X-Auth-Token',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'status': 'ok', 'description': 'Import parts from Excel'})
        }

    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'import')

    if action == 'preview':
        return _preview(body, cors)
    elif action == 'import':
        return _import(body, cors)
    else:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'unknown action'})}


def _parse_excel(file_b64: str):
    """Парсит Excel из base64, возвращает list[dict] строк."""
    try:
        import openpyxl
    except ImportError:
        raise RuntimeError('openpyxl не установлен')

    data = base64.b64decode(file_b64)
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    ws = wb.active

    rows = []
    for row in ws.iter_rows(values_only=True):
        rows.append([str(c).strip() if c is not None else '' for c in row])

    wb.close()
    return rows


def _detect_columns(header_row: list) -> dict:
    """Автоопределяет индексы колонок по заголовкам."""
    mapping = {}
    patterns = {
        'name':     r'наименован|название|товар|name',
        'category': r'категори|раздел|группа|categ',
        'price':    r'цена|price|стоимость',
        'stock':    r'остат|кол.во|количество|stock|наличие',
        'quality':  r'качест|grade|сорт|тип',
        'code':     r'артикул|код|sku|code|art',
    }
    for i, cell in enumerate(header_row):
        cell_l = cell.lower()
        for field, pat in patterns.items():
            if field not in mapping and re.search(pat, cell_l):
                mapping[field] = i
    return mapping


def _parse_price(v: str) -> float:
    if not v:
        return 0.0
    clean = re.sub(r'[^\d.,]', '', v).replace(',', '.')
    try:
        return float(clean)
    except Exception:
        return 0.0


def _detect_quality(name: str, quality_str: str) -> str:
    combined = (name + ' ' + quality_str).upper()
    if re.search(r'\bORIG(INAL)?\b|ОРИГИНАЛ', combined):
        return 'ORIG'
    if 'AAA' in combined:
        return 'AAA'
    if re.search(r'\bAA\b', combined):
        return 'AA'
    if re.search(r'\bA\b|КОПИ|COPY|OEM', combined):
        return 'A'
    return 'AAA'


def _detect_part_type(name: str, category: str) -> str:
    combined = (name + ' ' + category).lower()
    if re.search(r'дисплей|экран|display|screen|lcd|oled', combined):
        return 'display'
    if re.search(r'аккумул|батаре|акб|battery|batt', combined):
        if re.search(r'iphone|айфон', combined):
            return 'battery_iphone'
        return 'battery_other'
    if re.search(r'заднее стекло|задн.*стекл|back glass|rear glass', combined):
        return 'rear_glass'
    if re.search(r'стекл.*камер|camera glass|линза камер', combined):
        return 'camera_glass'
    if re.search(r'шлейф|плата|flex|board', combined):
        return 'flex_board'
    if re.search(r'слухов.*динам|earpiece|ear speaker', combined):
        return 'speaker_ear'
    if re.search(r'громк.*динам|loud.*speaker|buzzer', combined):
        return 'speaker_loud'
    if re.search(r'вибро|vibr', combined):
        return 'vibro'
    if re.search(r'задняя крышк|корпус|рамка|back cover|housing', combined):
        return 'back_cover'
    return 'accessory'


def _rows_to_parts(rows: list, col_map: dict, header_row_idx: int) -> list:
    parts = []
    for i, row in enumerate(rows):
        if i <= header_row_idx:
            continue
        if not any(row):
            continue

        name = row[col_map['name']] if 'name' in col_map and col_map['name'] < len(row) else ''
        if not name or len(name) < 3:
            continue

        category = row[col_map['category']] if 'category' in col_map and col_map['category'] < len(row) else ''
        price_str = row[col_map['price']] if 'price' in col_map and col_map['price'] < len(row) else ''
        stock_str = row[col_map['stock']] if 'stock' in col_map and col_map['stock'] < len(row) else ''
        quality_str = row[col_map['quality']] if 'quality' in col_map and col_map['quality'] < len(row) else ''
        code = row[col_map['code']] if 'code' in col_map and col_map['code'] < len(row) else ''

        price = _parse_price(price_str)
        stock = _parse_price(stock_str)
        quality = _detect_quality(name, quality_str)
        part_type = _detect_part_type(name, category)

        parts.append({
            'code': code[:32] if code else '',
            'name': name[:500],
            'category': category[:200],
            'price': price,
            'stock': stock,
            'quality': quality,
            'part_type': part_type,
        })
    return parts


def _find_header_row(rows: list) -> tuple[int, dict]:
    """Ищет строку заголовка среди первых 10 строк."""
    for i, row in enumerate(rows[:10]):
        col_map = _detect_columns(row)
        if 'name' in col_map and 'price' in col_map:
            return i, col_map
    for i, row in enumerate(rows[:10]):
        col_map = _detect_columns(row)
        if 'name' in col_map:
            return i, col_map
    return 0, {}


def _preview(body: dict, cors: dict) -> dict:
    file_b64 = body.get('file')
    if not file_b64:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'нет файла'})}

    rows = _parse_excel(file_b64)
    header_idx, col_map = _find_header_row(rows)
    parts = _rows_to_parts(rows, col_map, header_idx)

    sample = parts[:5]
    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'total_rows': len(rows),
            'header_row': header_idx,
            'columns_detected': col_map,
            'parts_found': len(parts),
            'sample': sample,
        }, ensure_ascii=False)
    }


def _import(body: dict, cors: dict) -> dict:
    file_b64 = body.get('file')
    if not file_b64:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'нет файла'})}

    rows = _parse_excel(file_b64)
    header_idx, col_map = _find_header_row(rows)
    parts = _rows_to_parts(rows, col_map, header_idx)

    if not parts:
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'imported': 0, 'skipped': 0, 'error': 'Не найдено ни одной строки с товаром. Проверьте формат файла.'}, ensure_ascii=False)
        }

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    imported = 0
    skipped = 0
    for p in parts:
        if p['price'] <= 0:
            skipped += 1
            continue
        cur.execute("""
            INSERT INTO repair_parts (id, code, name, category, price, stock, quality, part_type, available, updated_at)
            VALUES (
                md5(%(name)s || %(quality)s || COALESCE(%(code)s, '')),
                %(code)s, %(name)s, %(category)s,
                %(price)s, %(stock)s, %(quality)s, %(part_type)s,
                true, NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price = EXCLUDED.price,
                stock = EXCLUDED.stock,
                quality = EXCLUDED.quality,
                part_type = EXCLUDED.part_type,
                available = true,
                updated_at = NOW()
        """, p)
        imported += 1

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'imported': imported, 'skipped': skipped}, ensure_ascii=False)
    }
