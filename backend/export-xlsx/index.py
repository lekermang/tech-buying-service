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


def style_header(ws, col_count, fill_color):
    fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type='solid')
    font = Font(bold=True, color='FFFFFF', size=10)
    for col in range(1, col_count + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)


def auto_width(ws):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            try:
                max_len = max(max_len, len(str(cell.value or '')))
            except Exception:
                pass
        ws.column_dimensions[col_letter].width = min(max(max_len + 2, 8), 45)


def sheet_catalog(wb, conn):
    ws = wb.create_sheet('Каталог электроники')
    headers = ['ID', 'Категория', 'Бренд', 'Модель', 'Цвет', 'Память', 'RAM',
               'Регион', 'SIM', 'Наличие', 'Цена (₽)', 'Описание']
    ws.append(headers)
    style_header(ws, len(headers), '1565C8')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, category, brand, model, color, storage, ram, region,
               sim_type, availability, price, description
        FROM {SCHEMA}.catalog
        WHERE is_active = true
        ORDER BY category, brand, model
    """)
    avail_map = {'in_stock': 'В наличии', 'on_order': 'Под заказ'}
    for r in cur.fetchall():
        ws.append([
            r[0], r[1], r[2], r[3],
            r[4] or '', r[5] or '', r[6] or '', r[7] or '',
            r[8] or '', avail_map.get(r[9], r[9] or ''),
            r[10] or '', r[11] or ''
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30


def sheet_goods(wb, conn):
    ws = wb.create_sheet('Товары на складе')
    headers = ['ID', 'Название', 'Категория', 'Бренд', 'Модель', 'Состояние',
               'Цвет', 'Память', 'IMEI', 'Цена продажи (₽)', 'Цена закупки (₽)',
               'Статус', 'Описание', 'Дата добавления']
    ws.append(headers)
    style_header(ws, len(headers), '27AE60')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, title, category, brand, model, condition, color, storage,
               imei, sell_price, purchase_price, status, description, added_at
        FROM {SCHEMA}.goods
        ORDER BY added_at DESC
    """)
    status_map = {'available': 'В наличии', 'sold': 'Продано', 'reserved': 'Резерв'}
    for r in cur.fetchall():
        ws.append([
            r[0], r[1], r[2], r[3] or '', r[4] or '',
            r[5] or '', r[6] or '', r[7] or '', r[8] or '',
            r[9] or '', r[10] or '',
            status_map.get(r[11], r[11] or ''),
            r[12] or '',
            str(r[13])[:10] if r[13] else ''
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30


def sheet_tools(wb, conn):
    ws = wb.create_sheet('Инструменты')
    headers = ['Артикул', 'Название', 'Бренд', 'Категория',
               'Базовая цена (₽)', 'Моя цена (₽)', 'Наличие']
    ws.append(headers)
    style_header(ws, len(headers), 'E67E22')

    cur = conn.cursor()
    cur.execute(f"""
        SELECT article, name, brand, category,
               base_price, my_price, amount
        FROM {SCHEMA}.tools_products
        ORDER BY category, name
    """)
    for r in cur.fetchall():
        ws.append([
            r[0], r[1], r[2] or '', r[3] or '',
            float(r[4]) if r[4] else 0,
            float(r[5]) if r[5] else 0,
            r[6] or ''
        ])
    cur.close()
    auto_width(ws)
    ws.freeze_panes = 'A2'
    ws.row_dimensions[1].height = 30


def handler(event: dict, context) -> dict:
    """Экспорт товаров в XLSX: каталог электроники, товары на складе, инструменты"""
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
            'Content-Disposition': 'attachment; filename="skypka24_export.xlsx"',
        },
        'body': xlsx_b64,
        'isBase64Encoded': True,
    }
