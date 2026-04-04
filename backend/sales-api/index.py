import json
import os
from datetime import datetime, date
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f"SELECT id, full_name, role FROM {SCHEMA}.employees WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true", (token,))
    row = cur.fetchone(); cur.close(); conn.close()
    return {'id': row[0], 'full_name': row[1], 'role': row[2]} if row else None


def handler(event: dict, context) -> dict:
    """Продажи, договоры, аналитика выручки по магазину и ремонту"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token'}, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    emp = get_employee(emp_token)
    if not emp:
        return _err(401, 'Требуется авторизация сотрудника')

    # GET /analytics — сводная аналитика
    if method == 'GET' and params.get('action') == 'analytics':
        period = params.get('period', 'month')  # today | week | month | year
        conn = get_conn(); cur = conn.cursor()
        if period == 'today':
            date_filter = "created_at::date = CURRENT_DATE"
        elif period == 'week':
            date_filter = "created_at >= NOW() - INTERVAL '7 days'"
        elif period == 'year':
            date_filter = "created_at >= NOW() - INTERVAL '1 year'"
        else:
            date_filter = "created_at >= NOW() - INTERVAL '30 days'"

        # Выручка по типам
        cur.execute(f"""SELECT type, SUM(amount_final), COUNT(*) FROM {SCHEMA}.sales
                       WHERE {date_filter} GROUP BY type""")
        revenue_by_type = {r[0]: {'sum': r[1], 'count': r[2]} for r in cur.fetchall()}

        # Мотивация сотрудников
        cur.execute(f"""SELECT e.full_name, COUNT(s.id), SUM(s.amount_final)
                       FROM {SCHEMA}.sales s JOIN {SCHEMA}.employees e ON s.employee_id=e.id
                       WHERE {date_filter} GROUP BY e.id, e.full_name ORDER BY SUM(s.amount_final) DESC""")
        staff_stats = [{'name': r[0], 'deals': r[1], 'revenue': r[2]} for r in cur.fetchall()]

        # Динамика по дням (последние 30 дней)
        cur.execute(f"""SELECT created_at::date as day, SUM(amount_final)
                       FROM {SCHEMA}.sales WHERE created_at >= NOW() - INTERVAL '30 days'
                       GROUP BY day ORDER BY day""")
        daily = [{'date': str(r[0]), 'sum': r[1]} for r in cur.fetchall()]

        # Итого
        cur.execute(f"SELECT SUM(amount_final), COUNT(*) FROM {SCHEMA}.sales WHERE {date_filter}")
        total_row = cur.fetchone()
        cur.close(); conn.close()

        return _ok({
            'total_revenue': total_row[0] or 0,
            'total_deals': total_row[1] or 0,
            'by_type': revenue_by_type,
            'staff_stats': staff_stats,
            'daily': daily,
        })

    # GET /list — список продаж
    if method == 'GET' and params.get('action') == 'list':
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""SELECT s.id, s.type, s.amount_final, s.payment_method, s.contract_number,
                        s.created_at, c.full_name, c.phone, e.full_name as emp_name
                        FROM {SCHEMA}.sales s
                        LEFT JOIN {SCHEMA}.clients c ON s.client_id=c.id
                        LEFT JOIN {SCHEMA}.employees e ON s.employee_id=e.id
                        ORDER BY s.created_at DESC LIMIT 100""")
        rows = cur.fetchall(); cur.close(); conn.close()
        sales = [{'id': r[0], 'type': r[1], 'amount': r[2], 'payment': r[3],
                  'contract': r[4], 'date': r[5].isoformat() if r[5] else None,
                  'client': r[6], 'phone': r[7], 'employee': r[8]} for r in rows]
        return _ok({'sales': sales})

    # POST /sell — оформить продажу
    if method == 'POST' and body.get('action') == 'sell':
        good_id = body.get('good_id')
        client_id = body.get('client_id')
        amount = body.get('amount')
        discount_pct = body.get('discount_pct', 0)
        payment = body.get('payment_method', 'cash')
        notes = body.get('notes', '')

        if not good_id or not amount:
            return _err(400, 'good_id и amount обязательны')

        amount_final = int(amount) - int(int(amount) * int(discount_pct) / 100)
        conn = get_conn(); cur = conn.cursor()

        # Генерируем номер договора
        cur.execute(f"SELECT COUNT(*)+1 FROM {SCHEMA}.sales")
        num = cur.fetchone()[0]
        contract_number = f"КП-{datetime.now().strftime('%Y%m')}-{num:04d}"

        cur.execute(f"""INSERT INTO {SCHEMA}.sales
            (type, good_id, client_id, employee_id, amount, discount_pct, amount_final, payment_method, contract_number, notes)
            VALUES ('goods',%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (int(good_id), client_id, emp['id'], int(amount), int(discount_pct), amount_final, payment, contract_number, notes))
        sale_id = cur.fetchone()[0]

        # Помечаем товар проданным
        cur.execute(f"UPDATE {SCHEMA}.goods SET status='sold', sold_at=NOW() WHERE id=%s", (int(good_id),))

        # Начисляем баллы клиенту (1% от суммы)
        if client_id:
            points = max(1, amount_final // 100)
            cur.execute(f"UPDATE {SCHEMA}.clients SET loyalty_points=loyalty_points+%s WHERE id=%s", (points, client_id))
            # Повышаем скидку при накоплении
            cur.execute(f"UPDATE {SCHEMA}.clients SET discount_pct=LEAST(10, 3 + loyalty_points/500) WHERE id=%s", (client_id,))

        conn.commit(); cur.close(); conn.close()
        return _ok({'sale_id': sale_id, 'contract_number': contract_number, 'amount_final': amount_final})

    # POST /purchase — оформить закупку у клиента
    if method == 'POST' and body.get('action') == 'purchase':
        client_id = body.get('client_id')
        amount = body.get('amount')
        notes = body.get('notes', '')
        repair_id = body.get('repair_order_id')
        if not amount:
            return _err(400, 'amount обязателен')
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*)+1 FROM {SCHEMA}.sales")
        num = cur.fetchone()[0]
        contract_number = f"ДКП-{datetime.now().strftime('%Y%m')}-{num:04d}"
        cur.execute(f"""INSERT INTO {SCHEMA}.sales
            (type, repair_order_id, client_id, employee_id, amount, discount_pct, amount_final, payment_method, contract_number, notes)
            VALUES ('purchase',%s,%s,%s,%s,0,%s,'cash',%s,%s) RETURNING id""",
            (repair_id, client_id, emp['id'], int(amount), int(amount), contract_number, notes))
        sale_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return _ok({'sale_id': sale_id, 'contract_number': contract_number})

    return _err(404, 'Не найдено')


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False)}
