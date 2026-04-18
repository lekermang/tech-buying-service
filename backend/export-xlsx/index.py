import json
import os
import io
import boto3
import psycopg2
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token',
}

YM_HEADERS = ['Название', 'Идентификатор', 'Описание', 'Короткое описание',
              'Категория', 'Фото', 'Цена товара', 'В наличии',
              'Количество', 'Единицы измерения', 'Ссылка']

S3_KEY_CATALOG = 'exports/part_catalog.xlsx'
S3_KEY_GOODS   = 'exports/part_goods.xlsx'
S3_KEY_TOOLS   = 'exports/part_tools.xlsx'
S3_KEY_FINAL   = 'exports/yandex_market_export.xlsx'

COL_WIDTHS = [40, 15, 50, 30, 25, 50, 14, 12, 12, 18, 50]


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def check_auth(event):
    hdrs = event.get('headers', {})
    token = hdrs.get('X-Admin-Token') or hdrs.get('X-Employee-Token')
    if not token:
        return False
    # Фиксированный токен владельца
    if token == 'Mark2015N':
        return True
    # Проверка по токену сотрудника из БД
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.employees WHERE auth_token='{token}' AND token_expires_at>NOW() AND is_active=true"
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    return row is not None


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def style_header(ws, fill_color):
    fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type='solid')
    font = Font(bold=True, color='FFFFFF', size=10)
    for col in range(1, len(YM_HEADERS) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        ws.column_dimensions[get_column_letter(col)].width = COL_WIDTHS[col - 1]
    ws.row_dimensions[1].height = 30


def make_wb(sheet_name, fill_color, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_name
    ws.append(YM_HEADERS)
    style_header(ws, fill_color)
    for row in rows:
        ws.append(row)
    ws.freeze_panes = 'A2'
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf.read()


def build_catalog(conn):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, category, brand, model, color, storage,
               availability, price, description, photo_url
        FROM {SCHEMA}.catalog WHERE is_active = true
        ORDER BY category, brand, model
    """)
    rows = []
    for r in cur.fetchall():
        item_id, category, brand, model, color, storage, availability, price, description, photo_url = r
        name = ' '.join(x for x in [brand, model, storage, color] if x)
        short = ' '.join(x for x in [brand, model, storage] if x)
        desc = description or short
        in_stock = 'Да' if availability == 'in_stock' else 'Нет'
        rows.append([name, str(item_id), desc, short, category,
                     photo_url or '', price or '', in_stock, 1 if in_stock == 'Да' else 0, 'шт', photo_url or ''])
    cur.close()
    return make_wb('Каталог электроники', '1565C8', rows)


def build_goods(conn):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, title, category, brand, model, condition,
               color, storage, sell_price, description, photo_url
        FROM {SCHEMA}.goods WHERE status = 'available'
        ORDER BY added_at DESC
    """)
    rows = []
    for r in cur.fetchall():
        item_id, title, category, brand, model, condition, color, storage, sell_price, description, photo_url = r
        name = title or ' '.join(x for x in [brand, model, storage, color] if x)
        short = ' '.join(x for x in [brand, model, storage, condition] if x)
        desc = description or short
        rows.append([name, str(item_id), desc, short, category,
                     photo_url or '', sell_price or '', 'Да', 1, 'шт', photo_url or ''])
    cur.close()
    return make_wb('Товары на складе', '27AE60', rows)


def build_tools(conn):
    cur = conn.cursor()
    cur.execute(f"""
        SELECT article, name, brand, category,
               my_price, base_price, amount, image_url
        FROM {SCHEMA}.tools_products ORDER BY category, name
    """)
    rows = []
    for r in cur.fetchall():
        article, name, brand, category, my_price, base_price, amount, image_url = r
        price = float(my_price) if my_price and float(my_price) > 0 else (float(base_price) if base_price else '')
        in_stock = 'Да' if amount and 'наличи' in amount.lower() else 'Нет'
        short = ' '.join(x for x in [brand, name] if x)
        rows.append([name, article, short, short, category or '',
                     image_url or '', price, in_stock, 1 if in_stock == 'Да' else 0, 'шт', image_url or ''])
    cur.close()
    return make_wb('Инструменты', 'E67E22', rows)


def merge_parts(s3):
    wb_final = openpyxl.Workbook()
    wb_final.remove(wb_final.active)
    for key, fill, name in [
        (S3_KEY_CATALOG, '1565C8', 'Каталог электроники'),
        (S3_KEY_GOODS,   '27AE60', 'Товары на складе'),
        (S3_KEY_TOOLS,   'E67E22', 'Инструменты'),
    ]:
        obj = s3.get_object(Bucket='files', Key=key)
        part_wb = openpyxl.load_workbook(io.BytesIO(obj['Body'].read()))
        part_ws = part_wb.active
        ws = wb_final.create_sheet(name)
        for row in part_ws.iter_rows(values_only=True):
            ws.append(list(row))
        style_header(ws, fill)
        ws.freeze_panes = 'A2'
    buf = io.BytesIO()
    wb_final.save(buf)
    buf.seek(0)
    return buf.read()


def get_cdn_url():
    key_id = os.environ['AWS_ACCESS_KEY_ID']
    return f"https://cdn.poehali.dev/projects/{key_id}/bucket/{S3_KEY_FINAL}"


def s3_exists(s3, key):
    try:
        s3.head_object(Bucket='files', Key=key)
        return True
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """Экспорт XLSX Яндекс Маркет: пошаговая генерация каталога, товаров, инструментов"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if not check_auth(event):
        return err(401, 'Unauthorized')

    method = event.get('httpMethod', 'GET')
    body = {}
    if method == 'POST':
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            body = {}

    action = body.get('action') if method == 'POST' else 'status'

    s3 = get_s3()

    # GET — статус
    if action == 'status':
        exists = s3_exists(s3, S3_KEY_FINAL)
        parts = {
            'catalog': s3_exists(s3, S3_KEY_CATALOG),
            'goods':   s3_exists(s3, S3_KEY_GOODS),
            'tools':   s3_exists(s3, S3_KEY_TOOLS),
        }
        return ok({
            'status': 'ready' if exists else 'not_generated',
            'url': get_cdn_url() if exists else None,
            'parts': parts,
        })

    # POST action=catalog
    if action == 'catalog':
        conn = get_conn()
        data = build_catalog(conn)
        conn.close()
        s3.put_object(Bucket='files', Key=S3_KEY_CATALOG, Body=data,
                      ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return ok({'status': 'catalog_done'})

    # POST action=goods
    if action == 'goods':
        conn = get_conn()
        data = build_goods(conn)
        conn.close()
        s3.put_object(Bucket='files', Key=S3_KEY_GOODS, Body=data,
                      ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return ok({'status': 'goods_done'})

    # POST action=tools
    if action == 'tools':
        conn = get_conn()
        data = build_tools(conn)
        conn.close()
        s3.put_object(Bucket='files', Key=S3_KEY_TOOLS, Body=data,
                      ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        return ok({'status': 'tools_done'})

    # POST action=merge — объединить все части
    if action == 'merge':
        final_data = merge_parts(s3)
        s3.put_object(Bucket='files', Key=S3_KEY_FINAL, Body=final_data,
                      ContentType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      ContentDisposition='attachment; filename="yandex_market_export.xlsx"')
        return ok({'status': 'ready', 'url': get_cdn_url()})

    return err(400, 'Unknown action')