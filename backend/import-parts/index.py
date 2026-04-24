import json
import os
import base64
import io
import re
import uuid
import psycopg2
import boto3
from botocore.client import Config as BotoConfig

S3_ENDPOINT = 'https://bucket.poehali.dev'
S3_BUCKET = 'files'
S3_PREFIX = 'import-parts/'


def _s3_client():
    return boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )


def handler(event: dict, context) -> dict:
    """Импорт запчастей из Excel-файла. Поддерживает два режима: base64 в теле и загрузку через S3 (presigned URL). Парсит колонки: название, категория, цена, остаток, качество."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-User-Id, X-Auth-Token, X-Admin-Token',
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

    if action == 'upload-url':
        return _upload_url(body, cors)
    elif action == 'preview':
        return _preview(body, cors)
    elif action == 'import':
        return _import(body, cors)
    elif action == 'list-categories':
        return _list_categories(cors)
    elif action == 'save-markup':
        return _save_markup(body, cors)
    elif action == 'save-markup-all':
        return _save_markup_all(body, cors)
    else:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'unknown action'})}


def _save_markup_all(body: dict, cors: dict) -> dict:
    """Применяет одну наценку ко всем категориям разом — один SQL-запрос."""
    try:
        markup = float(body.get('markup_percent', 0))
    except (TypeError, ValueError):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'неверная наценка'}, ensure_ascii=False)}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Берём все категории, которые есть в прайсе
    cur.execute("SELECT DISTINCT category FROM repair_parts WHERE category IS NOT NULL AND category != ''")
    cats = [r[0] for r in cur.fetchall()]

    # Массовый upsert наценки по каждой категории
    for c in cats:
        cur.execute("""
            INSERT INTO repair_parts_markup (category, markup_percent, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (category) DO UPDATE SET markup_percent = EXCLUDED.markup_percent, updated_at = NOW()
        """, (c, markup))

    # Один UPDATE на всю таблицу — пересчёт итоговых цен
    cur.execute("""
        UPDATE repair_parts
        SET price = ROUND(COALESCE(supplier_price, price) * (1 + %s / 100.0), 2),
            updated_at = NOW()
        WHERE supplier_price IS NOT NULL
    """, (markup,))
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True, 'updated': updated, 'categories': len(cats), 'markup_percent': markup}, ensure_ascii=False)
    }


def _list_categories(cors: dict) -> dict:
    """Возвращает список категорий из последнего загруженного прайса с наценкой и статистикой."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Последний batch
    cur.execute("SELECT price_batch_id FROM repair_parts WHERE price_batch_id IS NOT NULL ORDER BY updated_at DESC LIMIT 1")
    row = cur.fetchone()
    latest_batch = row[0] if row else None

    cur.execute("""
        SELECT
            rp.category,
            COUNT(*) AS parts_count,
            AVG(rp.supplier_price)::numeric(10,2) AS avg_supplier_price,
            MIN(rp.supplier_price)::numeric(10,2) AS min_supplier_price,
            MAX(rp.supplier_price)::numeric(10,2) AS max_supplier_price,
            COALESCE(m.markup_percent, 0) AS markup_percent,
            MAX(CASE WHEN rp.price_batch_id = %s THEN 1 ELSE 0 END) AS is_latest
        FROM repair_parts rp
        LEFT JOIN repair_parts_markup m ON m.category = rp.category
        WHERE rp.category IS NOT NULL AND rp.category <> '' AND rp.supplier_price IS NOT NULL
        GROUP BY rp.category, m.markup_percent
        ORDER BY parts_count DESC
    """, (latest_batch,))
    cats = []
    for r in cur.fetchall():
        cats.append({
            'category': r[0],
            'parts_count': r[1],
            'avg_supplier_price': float(r[2] or 0),
            'min_supplier_price': float(r[3] or 0),
            'max_supplier_price': float(r[4] or 0),
            'markup_percent': float(r[5] or 0),
            'is_latest': bool(r[6]),
        })
    cur.close()
    conn.close()
    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'categories': cats, 'latest_batch': latest_batch}, ensure_ascii=False)
    }


def _save_markup(body: dict, cors: dict) -> dict:
    """Сохраняет наценку для категории и пересчитывает итоговые цены (price = supplier_price * (1 + markup/100))."""
    category = (body.get('category') or '').strip()
    try:
        markup = float(body.get('markup_percent', 0))
    except (TypeError, ValueError):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'неверная наценка'}, ensure_ascii=False)}

    if not category:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'нет категории'}, ensure_ascii=False)}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO repair_parts_markup (category, markup_percent, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (category) DO UPDATE SET markup_percent = EXCLUDED.markup_percent, updated_at = NOW()
    """, (category, markup))
    cur.execute("""
        UPDATE repair_parts
        SET price = ROUND(COALESCE(supplier_price, price) * (1 + %s / 100.0), 2),
            updated_at = NOW()
        WHERE category = %s AND supplier_price IS NOT NULL
    """, (markup, category))
    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True, 'updated': updated, 'markup_percent': markup}, ensure_ascii=False)
    }


def _upload_url(body: dict, cors: dict) -> dict:
    """Выдаёт presigned URL для загрузки файла напрямую в S3 из браузера."""
    filename = body.get('filename', 'price.xlsx')
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else 'xlsx'
    if ext not in ('xlsx', 'xlsm', 'xls'):
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'только .xlsx / .xls'}, ensure_ascii=False)}

    key = f"{S3_PREFIX}{uuid.uuid4().hex}.{ext}"
    s3 = _s3_client()
    try:
        url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': S3_BUCKET, 'Key': key},
            ExpiresIn=600,
        )
    except Exception as e:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': f'не удалось создать ссылку: {e}'}, ensure_ascii=False)}

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'upload_url': url, 's3_key': key}, ensure_ascii=False),
    }


def _load_excel_bytes(body: dict) -> bytes:
    """Загружает байты Excel либо из base64, либо из S3."""
    s3_key = body.get('s3_key')
    if s3_key:
        s3 = _s3_client()
        obj = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
        return obj['Body'].read()
    file_b64 = body.get('file')
    if not file_b64:
        raise RuntimeError('нет файла (ни base64, ни s3_key)')
    return base64.b64decode(file_b64)


MAX_ROWS = 20000  # жёсткий лимит: 20k позиций — более чем достаточно для любого прайса


def _parse_excel(data: bytes, filename: str = ''):
    """Парсит Excel (.xlsx/.xlsm/.xls) из bytes. Идёт по листам лениво, возвращает первый лист, где удалось найти шапку с name+price."""
    is_old_xls = filename.lower().endswith('.xls') and not filename.lower().endswith('.xlsx')
    if not is_old_xls and len(data) >= 4 and data[:4] == b'\xd0\xcf\x11\xe0':
        is_old_xls = True

    def _pick_best(sheet_iter):
        """Идёт по листам лениво: возвращает первый лист с name+price или самый «жирный», если шапки нет нигде."""
        fallback = None
        for rows in sheet_iter:
            if not rows:
                continue
            _, col_map = _find_header_row(rows)
            if 'name' in col_map and 'price' in col_map:
                return rows
            if fallback is None or len(rows) > len(fallback):
                fallback = rows
        return fallback or []

    if is_old_xls:
        try:
            import xlrd
        except ImportError:
            raise RuntimeError('для старого .xls нужен xlrd. Пересохрани файл в .xlsx')
        try:
            wb = xlrd.open_workbook(file_contents=data)
        except Exception as e:
            raise RuntimeError(f'не удалось открыть .xls: {e}')

        def xls_sheets():
            for sh in wb.sheets():
                rows = []
                limit = min(sh.nrows, MAX_ROWS)
                for ri in range(limit):
                    row = []
                    for ci in range(sh.ncols):
                        v = sh.cell_value(ri, ci)
                        row.append(str(v).strip() if v not in (None, '') else '')
                    rows.append(row)
                yield rows

        best = _pick_best(xls_sheets())
    else:
        try:
            import openpyxl
        except ImportError:
            raise RuntimeError('openpyxl не установлен')
        try:
            wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        except Exception as e:
            raise RuntimeError(f'не удалось открыть .xlsx: {e}. Убедись, что файл не повреждён и не запаролен')

        def xlsx_sheets():
            for ws in wb.worksheets:
                rows = []
                for row in ws.iter_rows(values_only=True):
                    rows.append([str(c).strip() if c is not None else '' for c in row])
                    if len(rows) >= MAX_ROWS:
                        break
                yield rows

        try:
            best = _pick_best(xlsx_sheets())
        finally:
            wb.close()

    if not best:
        raise RuntimeError('в файле нет листов с данными')
    return best


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


PART_TYPE_CATEGORY_RU = {
    'display': 'Дисплеи',
    'battery_iphone': 'Аккумуляторы iPhone',
    'battery_other': 'Аккумуляторы',
    'rear_glass': 'Задние стёкла',
    'camera_glass': 'Стёкла камер',
    'flex_board': 'Шлейфы и платы',
    'speaker_ear': 'Слуховые динамики',
    'speaker_loud': 'Громкие динамики',
    'vibro': 'Вибромоторы',
    'back_cover': 'Корпуса и крышки',
    'accessory': 'Прочее',
}


def _extract_model_keywords(name: str, category: str) -> str:
    """Собирает ключевые слова модели для поиска: iphone/samsung/redmi/13/pro/max и т.п. из имени и скобок."""
    text = f"{name} {category}".lower()
    # Вытаскиваем содержимое скобок (часто там перечисление моделей)
    brackets = re.findall(r'\(([^)]+)\)', name.lower())
    tokens: list[str] = []
    for b in brackets:
        for p in re.split(r'[/,;+]+', b):
            p = p.strip()
            if p:
                tokens.append(p)
    # Добавляем значимые слова из имени и категории
    for w in re.findall(r'[a-zа-я0-9]+', text):
        if len(w) >= 2:
            tokens.append(w)
    # Уникализация с сохранением порядка
    seen = set()
    uniq = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            uniq.append(t)
    return ' '.join(uniq)[:1000]


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

        # Если категория не указана в файле — берём русскую по типу запчасти,
        # чтобы в Staff отображалась таблица с наценкой по категориям
        if not category or not category.strip():
            category = PART_TYPE_CATEGORY_RU.get(part_type, 'Прочее')

        model_keywords = _extract_model_keywords(name, category)

        parts.append({
            'code': code[:32] if code else '',
            'name': name[:500],
            'category': category[:200],
            'price': price,
            'stock': stock,
            'quality': quality,
            'part_type': part_type,
            'model_keywords': model_keywords,
        })
    return parts


def _find_header_row(rows: list) -> tuple[int, dict]:
    """Ищет строку заголовка среди первых 30 строк (шапка часто ниже из-за логотипов/описаний)."""
    scan = min(30, len(rows))
    for i in range(scan):
        col_map = _detect_columns(rows[i])
        if 'name' in col_map and 'price' in col_map:
            return i, col_map
    for i in range(scan):
        col_map = _detect_columns(rows[i])
        if 'name' in col_map:
            return i, col_map
    return 0, {}


def _preview(body: dict, cors: dict) -> dict:
    filename = body.get('filename', '')
    try:
        data = _load_excel_bytes(body)
    except Exception as e:
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': f'не удалось загрузить файл: {e}'}, ensure_ascii=False)}

    size_mb = len(data) / 1024 / 1024

    try:
        rows = _parse_excel(data, filename)
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False)
        }

    header_idx, col_map = _find_header_row(rows)
    parts = _rows_to_parts(rows, col_map, header_idx)

    if not col_map:
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Не нашли колонку «Наименование». Проверь, что в первых 30 строках есть шапка с названиями колонок',
                'total_rows': len(rows),
            }, ensure_ascii=False)
        }

    sample = parts[:5]
    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({
            'total_rows': len(rows),
            'file_size_mb': round(size_mb, 2),
            'header_row': header_idx,
            'columns_detected': col_map,
            'parts_found': len(parts),
            'sample': sample,
        }, ensure_ascii=False)
    }


def _import(body: dict, cors: dict) -> dict:
    filename = body.get('filename', '')
    try:
        data = _load_excel_bytes(body)
    except Exception as e:
        return {'statusCode': 200, 'headers': {**cors, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': f'не удалось загрузить файл: {e}'}, ensure_ascii=False)}

    try:
        rows = _parse_excel(data, filename)
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {**cors, 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}, ensure_ascii=False)
        }
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

    # Загружаем существующие наценки по категориям, чтобы применить их к новому прайсу
    cur.execute("SELECT category, markup_percent FROM repair_parts_markup")
    markup_map = {row[0]: float(row[1] or 0) for row in cur.fetchall()}

    batch_id = uuid.uuid4().hex

    # Готовим кортежи для batch-insert
    import hashlib
    from psycopg2.extras import execute_values

    tuples = []
    skipped = 0
    seen_ids = set()
    for p in parts:
        supplier = p['price']
        if supplier <= 0:
            skipped += 1
            continue
        markup = markup_map.get(p['category'], 0.0)
        final_price = round(supplier * (1 + markup / 100.0), 2)
        key = (p['name'] + p['quality'] + (p.get('code') or '')).encode('utf-8')
        pid = hashlib.md5(key).hexdigest()
        if pid in seen_ids:
            skipped += 1
            continue
        seen_ids.add(pid)
        tuples.append((
            pid, p.get('code') or '', p['name'], p['category'],
            final_price, supplier, p['stock'], p['quality'], p['part_type'],
            p.get('model_keywords') or '',
            batch_id,
        ))

    imported = 0
    if tuples:
        # Пакетная вставка — в 50-100 раз быстрее, чем INSERT в цикле
        execute_values(
            cur,
            """
            INSERT INTO repair_parts
                (id, code, name, category, price, supplier_price, stock, quality, part_type, model_keywords, available, updated_at, price_batch_id)
            VALUES %s
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                price = EXCLUDED.price,
                supplier_price = EXCLUDED.supplier_price,
                stock = EXCLUDED.stock,
                quality = EXCLUDED.quality,
                part_type = EXCLUDED.part_type,
                model_keywords = EXCLUDED.model_keywords,
                available = true,
                updated_at = NOW(),
                price_batch_id = EXCLUDED.price_batch_id
            """,
            tuples,
            template="(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, NOW(), %s)",
            page_size=500,
        )
        imported = len(tuples)

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {**cors, 'Content-Type': 'application/json'},
        'body': json.dumps({'imported': imported, 'skipped': skipped, 'batch_id': batch_id}, ensure_ascii=False)
    }