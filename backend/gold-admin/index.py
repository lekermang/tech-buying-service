import json
import os

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
    'Content-Type': 'application/json',
}

import psycopg2
import requests

SCHEMA = 't_p31606708_tech_buying_service'

VALID_STATUSES = ['new', 'in_progress', 'done', 'cancelled']

STATUS_LABELS = {
    'new': '🟡 Принята',
    'in_progress': '🔄 В обработке',
    'done': '✅ Выкуплено',
    'cancelled': '❌ Отменено',
}

PURITY_LABELS = {
    '999': '999 (24K)',
    '958': '958 (23K)',
    '916': '916 (22K)',
    '875': '875 (21K)',
    '750': '750 (18K)',
    '585': '585 (14K)',
    '500': '500 (12K)',
    '375': '375 (9K)',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_token(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return False
    token_safe = token.replace("'", "''")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT role FROM {SCHEMA}.employees WHERE auth_token='{token_safe}' AND token_expires_at>NOW() AND is_active=true"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return False
    return row[0] in ('owner', 'admin')


def handler(event: dict, context) -> dict:
    """Управление заявками на скупку золота — CRUD + аналитика. Только для owner/admin."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    if not check_token(event):
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    # ─── GET ──────────────────────────────────────────────────────────────────
    if method == 'GET':
        action = params.get('action', '')

        # Аналитика за период
        if action == 'analytics':
            period = params.get('period', 'month')
            # Календарный день МСК: 00:00–23:59 (UTC+3)
            # Старт сегодня в МСК = DATE_TRUNC('day', NOW()+3h) - 3h (в UTC)
            if period == 'yesterday':
                period_where = """
                    COALESCE(status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '1 day'
                    )
                    AND COALESCE(status_updated_at, created_at) < (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours'
                    )
                """
            elif period == 'day':
                period_where = """
                    COALESCE(status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours'
                    )
                """
            elif period == 'week':
                period_where = """
                    COALESCE(status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '6 days'
                    )
                """
            else:
                period_where = """
                    COALESCE(status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '29 days'
                    )
                """

            cur.execute(f"""
                SELECT
                    COUNT(*) FILTER (WHERE status = 'done') as done,
                    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
                    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
                    COUNT(*) FILTER (WHERE status = 'new') as new_count,
                    COALESCE(SUM(buy_price) FILTER (WHERE status = 'done'), 0) as total_buy,
                    COALESCE(SUM(sell_price) FILTER (WHERE status = 'done'), 0) as total_sell,
                    COALESCE(SUM(profit) FILTER (WHERE status = 'done'), 0) as total_profit,
                    COUNT(*) as total,
                    COALESCE(SUM(weight) FILTER (WHERE status = 'done'), 0) as total_weight
                FROM {SCHEMA}.gold_orders
                WHERE {period_where}
            """)
            row = cur.fetchone()
            total_buy = int(row[4]) if row[4] else 0
            total_sell = int(row[5]) if row[5] else 0
            total_profit = int(row[6]) if row[6] else 0

            cur.execute(f"""
                SELECT
                    COALESCE(SUM(weight), 0) as stock_weight,
                    COALESCE(SUM(buy_price), 0) as stock_buy_sum,
                    COUNT(*) as stock_count
                FROM {SCHEMA}.gold_orders
                WHERE status = 'new'
            """)
            stock_row = cur.fetchone()
            stock_weight = float(stock_row[0]) if stock_row[0] else 0
            stock_buy_sum = int(stock_row[1]) if stock_row[1] else 0
            stock_count = int(stock_row[2]) if stock_row[2] else 0

            cur.execute(f"""
                SELECT
                    COALESCE(purity, '—') as purity,
                    COALESCE(SUM(weight), 0) as weight,
                    COALESCE(SUM(buy_price), 0) as buy_sum,
                    COUNT(*) as cnt
                FROM {SCHEMA}.gold_orders
                WHERE status = 'new'
                GROUP BY purity
                ORDER BY weight DESC
            """)
            purity_rows = cur.fetchall()

            # Период по дате ЗАКУПКИ (created_at) — для прогноза прибыли
            if period == 'yesterday':
                buy_period_where = """
                    created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '1 day')
                    AND created_at < (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')
                """
            elif period == 'day':
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')"
            elif period == 'week':
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '6 days')"
            else:
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '29 days')"

            cur.execute(f"""
                SELECT
                    COALESCE(SUM(buy_price), 0) as buy_sum,
                    COALESCE(SUM(weight * (CAST(NULLIF(purity, '') AS NUMERIC) / 585.0)), 0) as weight_585,
                    COUNT(*) as cnt
                FROM {SCHEMA}.gold_orders
                WHERE status <> 'cancelled' AND {buy_period_where}
            """)
            period_buy_row = cur.fetchone()
            period_buy_sum = int(period_buy_row[0]) if period_buy_row[0] else 0
            period_weight585 = float(period_buy_row[1]) if period_buy_row[1] else 0
            period_buy_count = int(period_buy_row[2]) if period_buy_row[2] else 0

            stock_by_purity = [
                {
                    'purity': r[0] or '—',
                    'weight': float(r[1]) if r[1] else 0,
                    'buy_sum': int(r[2]) if r[2] else 0,
                    'count': int(r[3]) if r[3] else 0,
                }
                for r in purity_rows
            ]

            cur.execute(f"""
                SELECT
                    DATE(COALESCE(status_updated_at, created_at) + INTERVAL '3 hours') as work_day,
                    COUNT(*) as done,
                    COALESCE(SUM(buy_price), 0) as total_buy,
                    COALESCE(SUM(sell_price), 0) as total_sell,
                    COALESCE(SUM(profit), 0) as total_profit,
                    COALESCE(SUM(weight), 0) as total_weight
                FROM {SCHEMA}.gold_orders
                WHERE status = 'done' AND {period_where}
                GROUP BY work_day ORDER BY work_day ASC
            """)
            daily_rows = cur.fetchall()
            daily = [
                {
                    'day': str(r[0]),
                    'done': r[1],
                    'buy': int(r[2]),
                    'sell': int(r[3]),
                    'profit': int(r[4]),
                    'weight': float(r[5]) if r[5] else 0,
                }
                for r in daily_rows
            ]
            cur.close(); conn.close()
            return {
                'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'period': period,
                    'done': row[0], 'cancelled': row[1],
                    'in_progress': row[2], 'new': row[3],
                    'total': row[7], 'total_weight': float(row[8]) if row[8] else 0,
                    'total_buy': total_buy,
                    'total_sell': total_sell,
                    'total_profit': total_profit,
                    'stock_weight': stock_weight,
                    'stock_buy_sum': stock_buy_sum,
                    'stock_count': stock_count,
                    'stock_by_purity': stock_by_purity,
                    'period_buy_sum': period_buy_sum,
                    'period_weight585': period_weight585,
                    'period_buy_count': period_buy_count,
                    'daily': daily,
                }, ensure_ascii=False)
            }

        # Статистика за 30 дней (таблица)
        if action == 'daily_stats':
            cur.execute(f"""
                SELECT
                    DATE(COALESCE(status_updated_at, created_at) + INTERVAL '3 hours') as work_day,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'done') as done,
                    COALESCE(SUM(buy_price) FILTER (WHERE status = 'done'), 0) as total_buy,
                    COALESCE(SUM(sell_price) FILTER (WHERE status = 'done'), 0) as total_sell,
                    COALESCE(SUM(profit) FILTER (WHERE status = 'done'), 0) as total_profit,
                    COALESCE(SUM(weight) FILTER (WHERE status = 'done'), 0) as total_weight
                FROM {SCHEMA}.gold_orders
                WHERE COALESCE(status_updated_at, created_at) >= NOW() - INTERVAL '31 days'
                GROUP BY work_day ORDER BY work_day DESC
            """)
            rows = cur.fetchall()
            cur.close(); conn.close()
            stats = [
                {
                    'day': str(r[0]), 'total': r[1], 'done': r[2],
                    'buy': int(r[3]), 'sell': int(r[4]),
                    'profit': int(r[5]),
                    'weight': float(r[6]) if r[6] else 0,
                }
                for r in rows
            ]
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'stats': stats}, ensure_ascii=False)}

        # Список заявок
        status_filter = params.get('status', '')
        search = params.get('search', '')
        date_from = params.get('date_from', '')
        date_to = params.get('date_to', '')

        wheres = []
        if status_filter and status_filter != 'all':
            wheres.append(f"status = '{status_filter}'")
        if search:
            s = search.replace("'", "''")
            wheres.append(f"(name ILIKE '%{s}%' OR phone ILIKE '%{s}%' OR item_name ILIKE '%{s}%')")
        if date_from:
            wheres.append(f"DATE(created_at + INTERVAL '3 hours') >= '{date_from}'")
        if date_to:
            wheres.append(f"DATE(created_at + INTERVAL '3 hours') <= '{date_to}'")

        where_clause = ('WHERE ' + ' AND '.join(wheres)) if wheres else ''
        cur.execute(f"""
            SELECT id, name, phone, item_name, weight, purity, buy_price, sell_price, profit,
                   comment, status, status_updated_at, created_at, admin_note, completed_at, payment_method,
                   sell_price_per_gram
            FROM {SCHEMA}.gold_orders
            {where_clause}
            ORDER BY created_at DESC
            LIMIT 200
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()

        orders = []
        for r in rows:
            orders.append({
                'id': r[0], 'name': r[1], 'phone': r[2],
                'item_name': r[3], 'weight': float(r[4]) if r[4] else None,
                'purity': r[5], 'buy_price': r[6], 'sell_price': r[7], 'profit': r[8],
                'comment': r[9], 'status': r[10],
                'status_updated_at': r[11].isoformat() if r[11] else None,
                'created_at': r[12].isoformat() if r[12] else None,
                'admin_note': r[13],
                'completed_at': r[14].isoformat() if r[14] else None,
                'payment_method': r[15],
                'sell_price_per_gram': float(r[16]) if r[16] is not None else None,
            })
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    # ─── POST ─────────────────────────────────────────────────────────────────
    if method == 'POST':
        action = body.get('action', '')

        # Удалить заявку
        if action == 'delete':
            order_id = int(body.get('id', 0))
            cur.execute(f"DELETE FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # Создать заявку
        if action == 'create':
            name = str(body.get('name', '')).strip()
            phone = str(body.get('phone', '')).strip()
            if not name or not phone:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False)}

            item_name = str(body.get('item_name', '') or '').replace("'", "''")
            weight = body.get('weight')
            purity = str(body.get('purity', '') or '').replace("'", "''")
            buy_price = body.get('buy_price')
            sell_price = body.get('sell_price')
            sell_price_per_gram = body.get('sell_price_per_gram')
            comment = str(body.get('comment', '') or '').replace("'", "''")

            # Если задана цена за грамм и вес — считаем общую сумму продажи
            if sell_price_per_gram is not None and weight:
                try:
                    sell_price = int(round(float(sell_price_per_gram) * float(weight)))
                except Exception:
                    pass

            profit_val = None
            if buy_price is not None and sell_price is not None:
                profit_val = int(sell_price) - int(buy_price)

            name_e = name.replace("'", "''")
            phone_e = phone.replace("'", "''")
            weight_sql = str(float(weight)) if weight else 'NULL'
            buy_sql = str(int(buy_price)) if buy_price is not None else 'NULL'
            sell_sql = str(int(sell_price)) if sell_price is not None else 'NULL'
            spg_sql = str(float(sell_price_per_gram)) if sell_price_per_gram not in (None, '', 0) else 'NULL'
            profit_sql = str(profit_val) if profit_val is not None else 'NULL'

            cur.execute(f"""
                INSERT INTO {SCHEMA}.gold_orders
                    (name, phone, item_name, weight, purity, buy_price, sell_price, sell_price_per_gram, profit, comment)
                VALUES
                    ('{name_e}', '{phone_e}',
                     '{item_name}', {weight_sql}, '{purity}',
                     {buy_sql}, {sell_sql}, {spg_sql}, {profit_sql}, '{comment}')
                RETURNING id
            """)
            order_id = cur.fetchone()[0]
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'order_id': order_id}, ensure_ascii=False)}

        # Обновить заявку
        order_id = int(body.get('id', 0))
        new_status = body.get('status', '')
        admin_note = body.get('admin_note')
        buy_price = body.get('buy_price')
        sell_price = body.get('sell_price')
        sell_price_per_gram = body.get('sell_price_per_gram')
        item_name = body.get('item_name')
        weight = body.get('weight')
        purity = body.get('purity')
        comment = body.get('comment')
        payment_method = body.get('payment_method')
        upd_name = body.get('name')
        upd_phone = body.get('phone')

        if new_status and new_status not in VALID_STATUSES:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный статус'}, ensure_ascii=False)}

        # Если пришла цена за грамм — пересчитаем sell_price от текущего/нового веса
        if sell_price_per_gram is not None:
            try:
                spg_f = float(sell_price_per_gram) if sell_price_per_gram != '' else 0.0
            except Exception:
                spg_f = 0.0
            # вес: если передан в этом же запросе — берём из body, иначе — из БД
            if weight is not None:
                try:
                    w_f = float(weight) if weight else 0.0
                except Exception:
                    w_f = 0.0
            else:
                cur.execute(f"SELECT weight FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
                wrow = cur.fetchone()
                w_f = float(wrow[0]) if wrow and wrow[0] is not None else 0.0
            if spg_f > 0 and w_f > 0:
                sell_price = int(round(spg_f * w_f))

        sets = []
        if new_status:
            sets.append(f"status = '{new_status}'")
            sets.append("status_updated_at = NOW()")
            if new_status == 'done':
                sets.append("completed_at = NOW()")
        if admin_note is not None:
            sets.append(f"admin_note = '{str(admin_note).replace(chr(39), chr(39)*2)}'")
        if buy_price is not None:
            sets.append(f"buy_price = {int(buy_price)}")
        if sell_price is not None:
            sets.append(f"sell_price = {int(sell_price)}")
        if sell_price_per_gram is not None:
            if sell_price_per_gram in ('', 0, '0'):
                sets.append("sell_price_per_gram = NULL")
            else:
                try:
                    sets.append(f"sell_price_per_gram = {float(sell_price_per_gram)}")
                except Exception:
                    pass
        if buy_price is not None or sell_price is not None:
            cur.execute(f"SELECT buy_price, sell_price FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
            cur_row = cur.fetchone()
            bp = int(buy_price) if buy_price is not None else (cur_row[0] or 0)
            sp = int(sell_price) if sell_price is not None else (cur_row[1] or 0)
            sets.append(f"profit = {sp - bp}")
        if item_name is not None:
            sets.append(f"item_name = '{str(item_name).replace(chr(39), chr(39)*2)}'")
        if weight is not None:
            sets.append(f"weight = {float(weight)}" if weight else "weight = NULL")
        if purity is not None:
            sets.append(f"purity = '{str(purity).replace(chr(39), chr(39)*2)}'")
        if comment is not None:
            sets.append(f"comment = '{str(comment).replace(chr(39), chr(39)*2)}'")
        if payment_method is not None:
            sets.append(f"payment_method = '{str(payment_method).replace(chr(39), chr(39)*2)}'" if payment_method else "payment_method = NULL")
        if upd_name is not None:
            sets.append(f"name = '{str(upd_name).replace(chr(39), chr(39)*2)}'")
        if upd_phone is not None:
            sets.append(f"phone = '{str(upd_phone).replace(chr(39), chr(39)*2)}'")

        if not sets:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Нет данных для обновления'}, ensure_ascii=False)}

        cur.execute(f"UPDATE {SCHEMA}.gold_orders SET {', '.join(sets)} WHERE id = {order_id} RETURNING id, name, phone")
        row = cur.fetchone()
        conn.commit()

        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        # Telegram при смене статуса
        if new_status:
            try:
                tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
                chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
                pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
                status_lbl = STATUS_LABELS.get(new_status, new_status)
                msg = (
                    f"🥇 *Золото #{order_id} — Статус изменён*\n\n"
                    f"👤 *Клиент:* {row[1]}\n"
                    f"📞 *Телефон:* {row[2]}\n"
                    f"📌 *Статус:* {status_lbl}"
                )
                for cid in filter(None, [chat_id, pluxan]):
                    requests.post(
                        f'https://api.telegram.org/bot{tg_token}/sendMessage',
                        json={'chat_id': cid, 'text': msg, 'parse_mode': 'Markdown'},
                        timeout=8
                    )
            except Exception:
                pass

        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}