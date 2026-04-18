import json
import os
import io
import base64
import psycopg2
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token',
}

YM_HEADERS = ['Название', 'Идентификатор', 'Описание', 'Короткое описание',
              'Категория', 'Фото', 'Цена товара', 'В наличии',
              'Количество', 'Единицы измерения', 'Ссылка']


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_auth(event):
    hdrs = event.get('headers', {})
    token = hdrs.get('X-Admin-Token') or hdrs.get('X-Employee-Token')
    if not token:
        return False
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SCHEMA}.employees WHERE auth_token='{token}' AND token_expires_at>NOW() AND is_active=true"
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    return row is not None


def style_header(ws, fill_color):
    fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type='solid')
    font = Font(bold=True, color='FFFFFF', size=10)
    for col in range(1, len(YM_HEADERS) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[1].height = 30


def auto_width(ws):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                max_len = max(max_len, len(str(cell.value or '')))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max(max_len + 2, 10), 50)


def sheet_catalog(wb, conn):
    ws = wb.create_sheet('Каталог электроники')
    ws.append(YM_HEADERS)
    style_header(ws, '1565C8')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, category, brand, model, color, storage, ram,
               region, sim_type, availability, price, description, photo_url
        FROM {SCHEMA}.catalog
        WHERE is_active = true
        ORDER BY category, brand, model
    """)
    for r in cur.fetchall():
        item_id, category, brand, model, color, storage, ram, region, sim_type, availability, price, description, photo_url = r

        parts = [x for x in [brand, model, storage, color, region] if x]
        name = ' '.join(parts)

        short_parts = [x for x in [brand, model, storage] if x]
        short_desc = ' '.join(short_parts)

        full_desc = description or short_desc

        in_stock = 'Да' if availability == 'in_stock' else 'Нет'
        qty = 1 if availability == 'in_stock' else 0

        ws.append([
            name,
            str(item_id),
            full_desc,
            short_desc,
            category,
            photo_url or '',
            price or '',
            in_stock,
            qty,
            'шт',
            photo_url or '',
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'


def sheet_goods(wb, conn):
    ws = wb.create_sheet('Товары на складе')
    ws.append(YM_HEADERS)
    style_header(ws, '27AE60')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, title, category, brand, model, condition, color,
               storage, sell_price, status, description, photo_url
        FROM {SCHEMA}.goods
        WHERE status = 'available'
        ORDER BY added_at DESC
    """)
    for r in cur.fetchall():
        item_id, title, category, brand, model, condition, color, storage, sell_price, status, description, photo_url = r

        name = title or ' '.join(x for x in [brand, model, storage, color] if x)
        short_desc = ' '.join(x for x in [brand, model, storage, condition] if x)
        full_desc = description or short_desc

        in_stock = 'Да' if status == 'available' else 'Нет'

        ws.append([
            name,
            str(item_id),
            full_desc,
            short_desc,
            category,
            photo_url or '',
            sell_price or '',
            in_stock,
            1,
            'шт',
            photo_url or '',
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'


def sheet_tools(wb, conn):
    ws = wb.create_sheet('Инструменты')
    ws.append(YM_HEADERS)
    style_header(ws, 'E67E22')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT article, name, brand, category,
               my_price, base_price, amount, image_url
        FROM {SCHEMA}.tools_products
        ORDER BY category, name
    """)
    for r in cur.fetchall():
        article, name, brand, category, my_price, base_price, amount, image_url = r

        price = float(my_price) if my_price and float(my_price) > 0 else (float(base_price) if base_price else '')
        in_stock = 'Да' if amount and 'наличи' in amount.lower() else 'Нет'
        qty = 1 if in_stock == 'Да' else 0

        short_desc = ' '.join(x for x in [brand, name] if x)

        ws.append([
            name,
            article,
            short_desc,
            short_desc,
            category or '',
            image_url or '',
            price,
            in_stock,
            qty,
            'шт',
            image_url or '',
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'


def handler(event: dict, context) -> dict:
    """Экспорт товаров в XLSX формате Яндекс Маркета: каталог электроники, товары на складе, инструменты"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if not check_auth(event):
        return {'statusCode': 401, 'headers': HEADERS,
                'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    conn = get_conn()
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    sheet_catalog(wb, conn)
    sheet_goods(wb, conn)
    sheet_tools(wb, conn)
    conn.close()

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    xlsx_b64 = base64.b64encode(buf.read()).decode()

    return {
        'statusCode': 200,
        'headers': {
            **HEADERS,
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="yandex_market_export.xlsx"',
        },
        'body': xlsx_b64,
        'isBase64Encoded': True,
    }
