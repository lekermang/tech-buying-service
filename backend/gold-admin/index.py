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


def employee_role(event: dict):
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return None
    token_safe = token.replace("'", "''")
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT role FROM {SCHEMA}.employees WHERE auth_token='{token_safe}' AND token_expires_at>NOW() AND is_active=true"
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row[0] if row else None


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


def _investor_public(conn, cur, share_token: str) -> dict:
    """Публичные данные для инвестора по share_token (без авторизации)."""
    t = ''.join(ch for ch in (share_token or '') if ch.isalnum())[:64]
    if not t:
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'error': 'Нужен token'}, ensure_ascii=False)}
    cur.execute(
        f"SELECT id, investor_name, money_in_safe, default_profit_per_gram, share_token "
        f"FROM {SCHEMA}.gold_investor_settings WHERE share_token='{t}' AND is_active=TRUE LIMIT 1"
    )
    s = cur.fetchone()
    if not s:
        return {'statusCode': 404, 'headers': HEADERS,
                'body': json.dumps({'error': 'Ссылка недействительна'}, ensure_ascii=False)}
    settings = {
        'investor_name': s[1],
        'money_in_safe': float(s[2] or 0),
        'default_profit_per_gram': float(s[3] or 0),
        'share_token': s[4],
    }
    # Все сделки, отмеченные инвестором
    cur.execute(f"""
        SELECT id, item_name, weight, purity, buy_price, sell_price, sell_price_per_gram,
               investor_profit_per_gram, status, created_at, completed_at
        FROM {SCHEMA}.gold_orders
        WHERE is_investor_money = TRUE
        ORDER BY created_at DESC
    """)
    rows = cur.fetchall()
    deals = []
    total_grams = 0.0
    total_spent = 0
    total_profit_locked = 0  # отложенная прибыль (по покупке)
    total_sold_profit = 0    # прибыль по реально проданным
    for r in rows:
        w = float(r[2]) if r[2] is not None else 0.0
        bp = int(r[4] or 0)
        spg = float(r[6]) if r[6] is not None else None
        ipg = float(r[7]) if r[7] is not None else 0.0
        profit = int(round(w * ipg))
        deals.append({
            'id': r[0],
            'item_name': r[1],
            'weight': w,
            'purity': r[3],
            'buy_price': bp,
            'sell_price': r[5],
            'sell_price_per_gram': spg,
            'investor_profit_per_gram': ipg,
            'profit': profit,
            'status': r[8],
            'created_at': r[9].isoformat() if r[9] else None,
            'completed_at': r[10].isoformat() if r[10] else None,
        })
        total_grams += w
        total_spent += bp
        total_profit_locked += profit
        if r[8] == 'done':
            total_sold_profit += profit
    # Аналитика по датам (последние 30 дней)
    cur.execute(f"""
        SELECT
            DATE(COALESCE(completed_at, created_at) + INTERVAL '3 hours') AS d,
            COALESCE(SUM(weight), 0) AS grams,
            COALESCE(SUM(buy_price), 0) AS spent,
            COALESCE(SUM(weight * investor_profit_per_gram), 0) AS profit
        FROM {SCHEMA}.gold_orders
        WHERE is_investor_money = TRUE
          AND COALESCE(completed_at, created_at) >= NOW() - INTERVAL '30 days'
        GROUP BY d
        ORDER BY d
    """)
    daily = []
    for dr in cur.fetchall():
        daily.append({
            'date': dr[0].isoformat() if dr[0] else None,
            'grams': float(dr[1] or 0),
            'spent': int(dr[2] or 0),
            'profit': int(dr[3] or 0),
        })
    return {
        'statusCode': 200, 'headers': HEADERS,
        'body': json.dumps({
            'settings': settings,
            'totals': {
                'grams': round(total_grams, 3),
                'spent': total_spent,
                'profit_total': total_profit_locked,
                'profit_realized': total_sold_profit,
                'in_safe': settings['money_in_safe'],
                'invested_now': total_spent,  # деньги сейчас в металле
            },
            'deals': deals,
            'daily': daily,
        }, ensure_ascii=False, default=str)
    }


MAX_BOT_URL = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'


def _rub(v) -> str:
    return f"{int(round(float(v or 0))):,}".replace(',', '\u00a0') + ' ₽'


def _g(v) -> str:
    return f"{float(v or 0):.2f}".rstrip('0').rstrip('.').replace('.', ',') + ' г'


def _employee_name(event: dict) -> str:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (headers.get('x-employee-token', '') or '').replace("'", "''")
    if not token:
        return ''
    try:
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT full_name FROM {SCHEMA}.employees WHERE auth_token='{token}' AND is_active=true")
        row = cur.fetchone(); cur.close(); conn.close()
        return (row[0] if row and row[0] else '') or ''
    except Exception:
        return ''


def _stock_line(cur) -> str:
    """Остаток золота на складе (учёт веса): всё, что куплено и ещё не продано."""
    cur.execute(
        f"SELECT COALESCE(SUM(weight),0), COALESCE(SUM(buy_price),0), COUNT(*), "
        f"COALESCE(SUM(weight * (CAST(NULLIF(purity,'') AS NUMERIC) / 585.0)),0) "
        f"FROM {SCHEMA}.gold_orders WHERE status = 'new' AND weight > 0"
    )
    w, buy, cnt, w585 = cur.fetchone()
    return (
        f"📦 *Остаток на складе:* {_g(w)} ({int(cnt)} поз.), в 585 пробе {_g(w585)}\n"
        f"💵 Вложено в остаток: {_rub(buy)}"
    )


def _notify_max(text: str) -> None:
    try:
        requests.post(f'{MAX_BOT_URL}?action=staff_send', json={'text': text}, timeout=6)
    except Exception as e:
        print(f'[gold-admin][MAX] {e}')


def _safe_date(v: str) -> str:
    return ''.join(ch for ch in (v or '') if ch.isdigit() or ch == '-')[:10]


def _period_sql(period: str, date_from: str, date_to: str):
    """Возвращает (условие по дате продажи, условие по дате закупки) в часовом поясе МСК."""
    sold = "COALESCE(completed_at, status_updated_at, created_at)"
    buy = "created_at"
    day0 = "(DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')"
    if period == 'custom' and (date_from or date_to):
        df, dt = _safe_date(date_from), _safe_date(date_to)
        a, b = [], []
        if df:
            a.append(f"{sold} >= ('{df}'::date - INTERVAL '3 hours')")
            b.append(f"{buy} >= ('{df}'::date - INTERVAL '3 hours')")
        if dt:
            a.append(f"{sold} < (('{dt}'::date + INTERVAL '1 day') - INTERVAL '3 hours')")
            b.append(f"{buy} < (('{dt}'::date + INTERVAL '1 day') - INTERVAL '3 hours')")
        return (' AND '.join(a) or 'TRUE'), (' AND '.join(b) or 'TRUE')
    if period == 'all':
        return 'TRUE', 'TRUE'
    if period == 'year':
        y = "(DATE_TRUNC('year', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')"
        return f"{sold} >= {y}", f"{buy} >= {y}"
    if period == 'yesterday':
        return (f"{sold} >= ({day0} - INTERVAL '1 day') AND {sold} < {day0}",
                f"{buy} >= ({day0} - INTERVAL '1 day') AND {buy} < {day0}")
    if period == 'day':
        return f"{sold} >= {day0}", f"{buy} >= {day0}"
    if period == 'week':
        return f"{sold} >= ({day0} - INTERVAL '6 days')", f"{buy} >= ({day0} - INTERVAL '6 days')"
    return f"{sold} >= ({day0} - INTERVAL '29 days')", f"{buy} >= ({day0} - INTERVAL '29 days')"


W585 = "(weight * (CAST(NULLIF(purity, '') AS NUMERIC) / 585.0))"


def _f(v) -> float:
    return float(v) if v is not None else 0.0


def _gold_report(cur, period: str, date_from: str, date_to: str) -> dict:
    sold_w, buy_w = _period_sql(period, date_from, date_to)
    T = f"{SCHEMA}.gold_orders"
    SOLD_AT = "COALESCE(completed_at, status_updated_at, created_at)"

    cur.execute(f"""
        SELECT COALESCE(NULLIF(purity, ''), '—'),
               COUNT(*), COALESCE(SUM(weight),0), COALESCE(SUM({W585}),0),
               COALESCE(SUM(buy_price),0), COALESCE(SUM(sell_price),0), COALESCE(SUM(profit),0)
        FROM {T} WHERE status = 'done' AND {sold_w}
        GROUP BY 1 ORDER BY SUM(profit) DESC NULLS LAST
    """)
    sold_by_purity = []
    for r in cur.fetchall():
        w585 = _f(r[3]); buy = int(r[4]); sell = int(r[5]); prof = int(r[6])
        sold_by_purity.append({
            'purity': r[0], 'count': int(r[1]), 'weight': _f(r[2]), 'weight585': w585,
            'buy': buy, 'sell': sell, 'profit': prof,
            'margin_pct': round(prof / buy * 100, 1) if buy > 0 else 0,
            'profit_per_g585': round(prof / w585, 1) if w585 > 0 else 0,
        })

    cur.execute(f"""
        SELECT COALESCE(NULLIF(purity, ''), '—'),
               COUNT(*), COALESCE(SUM(weight),0), COALESCE(SUM({W585}),0), COALESCE(SUM(buy_price),0)
        FROM {T} WHERE status <> 'cancelled' AND {buy_w}
        GROUP BY 1 ORDER BY SUM(buy_price) DESC NULLS LAST
    """)
    bought_by_purity = []
    for r in cur.fetchall():
        w585 = _f(r[3]); buy = int(r[4])
        bought_by_purity.append({
            'purity': r[0], 'count': int(r[1]), 'weight': _f(r[2]), 'weight585': w585,
            'buy': buy, 'avg_price585': round(buy / w585, 1) if w585 > 0 else 0,
        })

    cur.execute(f"""
        SELECT DATE(created_at + INTERVAL '3 hours'), COUNT(*), COALESCE(SUM(weight),0),
               COALESCE(SUM({W585}),0), COALESCE(SUM(buy_price),0)
        FROM {T} WHERE status <> 'cancelled' AND {buy_w}
        GROUP BY 1 ORDER BY 1 DESC LIMIT 62
    """)
    bought_by_day = []
    for r in cur.fetchall():
        w585 = _f(r[3]); buy = int(r[4])
        bought_by_day.append({
            'day': str(r[0]), 'count': int(r[1]), 'weight': _f(r[2]), 'weight585': w585,
            'buy': buy, 'avg_price585': round(buy / w585, 1) if w585 > 0 else 0,
        })

    cur.execute(f"""
        SELECT COALESCE(NULLIF(payment_method, ''), '—'), COUNT(*), COALESCE(SUM(buy_price),0)
        FROM {T} WHERE status <> 'cancelled' AND {buy_w}
        GROUP BY 1 ORDER BY 3 DESC
    """)
    bought_by_payment = [{'method': r[0], 'count': int(r[1]), 'sum': int(r[2])} for r in cur.fetchall()]

    cur.execute(f"""
        SELECT COALESCE(SUM(buy_price),0), COALESCE(SUM(sell_price),0), COALESCE(SUM(profit),0),
               COUNT(*), COALESCE(SUM({W585}),0), COALESCE(SUM(weight),0),
               COALESCE(AVG(EXTRACT(EPOCH FROM ({SOLD_AT} - created_at))/86400.0),0),
               COALESCE(MAX(profit),0), COALESCE(MIN(profit),0),
               COUNT(*) FILTER (WHERE profit < 0)
        FROM {T} WHERE status = 'done' AND {sold_w}
    """)
    k = cur.fetchone()
    k_buy, k_sell, k_prof, k_cnt = int(k[0]), int(k[1]), int(k[2]), int(k[3])
    k_w585 = _f(k[4])

    cur.execute(f"""
        SELECT COUNT(*), COALESCE(SUM(buy_price),0), COALESCE(SUM({W585}),0), COALESCE(SUM(weight),0)
        FROM {T} WHERE status <> 'cancelled' AND {buy_w}
    """)
    b = cur.fetchone()
    b_cnt, b_sum, b_w585, b_w = int(b[0]), int(b[1]), _f(b[2]), _f(b[3])

    cur.execute(f"SELECT COUNT(*) FROM {T} WHERE status = 'cancelled' AND {buy_w}")
    cancelled = int(cur.fetchone()[0])

    kpi = {
        'sold_count': k_cnt, 'sold_buy': k_buy, 'sold_sell': k_sell, 'profit': k_prof,
        'sold_weight585': k_w585,
        'margin_pct': round(k_prof / k_buy * 100, 1) if k_buy > 0 else 0,
        'avg_profit_per_deal': round(k_prof / k_cnt) if k_cnt else 0,
        'profit_per_g585': round(k_prof / k_w585, 1) if k_w585 > 0 else 0,
        'avg_buy_price585_sold': round(k_buy / k_w585, 1) if k_w585 > 0 else 0,
        'avg_sell_price585': round(k_sell / k_w585, 1) if k_w585 > 0 else 0,
        'avg_days_to_sell': round(_f(k[6]), 1),
        'best_deal': int(k[7]), 'worst_deal': int(k[8]), 'loss_deals': int(k[9]),
        'bought_count': b_cnt, 'bought_sum': b_sum, 'bought_weight': b_w, 'bought_weight585': b_w585,
        'avg_buy_price585': round(b_sum / b_w585, 1) if b_w585 > 0 else 0,
        'cancelled': cancelled,
    }

    cur.execute(f"""
        SELECT id, item_name, weight, purity, buy_price, sell_price, profit, {SOLD_AT}, name
        FROM {T} WHERE status = 'done' AND {sold_w}
        ORDER BY profit DESC NULLS LAST LIMIT 5
    """)
    def _deal(r):
        return {'id': r[0], 'item_name': r[1] or '', 'weight': _f(r[2]), 'purity': r[3] or '',
                'buy': int(r[4] or 0), 'sell': int(r[5] or 0), 'profit': int(r[6] or 0),
                'at': r[7].isoformat() if r[7] else None, 'client': r[8] or ''}
    top_deals = [_deal(r) for r in cur.fetchall()]
    cur.execute(f"""
        SELECT id, item_name, weight, purity, buy_price, sell_price, profit, {SOLD_AT}, name
        FROM {T} WHERE status = 'done' AND {sold_w} AND profit < 0
        ORDER BY profit ASC LIMIT 5
    """)
    worst_deals = [_deal(r) for r in cur.fetchall()]

    cur.execute(f"""
        WITH m AS (
          SELECT TO_CHAR(DATE_TRUNC('month', created_at + INTERVAL '3 hours'), 'YYYY-MM') AS ym,
                 COUNT(*) AS bc, COALESCE(SUM(buy_price),0) AS bsum, COALESCE(SUM({W585}),0) AS bw
          FROM {T} WHERE status <> 'cancelled' GROUP BY 1
        ), s AS (
          SELECT TO_CHAR(DATE_TRUNC('month', {SOLD_AT} + INTERVAL '3 hours'), 'YYYY-MM') AS ym,
                 COUNT(*) AS sc, COALESCE(SUM(sell_price),0) AS ssum, COALESCE(SUM(profit),0) AS prof
          FROM {T} WHERE status = 'done' GROUP BY 1
        )
        SELECT COALESCE(m.ym, s.ym), COALESCE(bc,0), COALESCE(bsum,0), COALESCE(bw,0),
               COALESCE(sc,0), COALESCE(ssum,0), COALESCE(prof,0)
        FROM m FULL OUTER JOIN s ON m.ym = s.ym
        ORDER BY 1 DESC LIMIT 12
    """)
    by_month = [{
        'month': r[0], 'bought_count': int(r[1]), 'bought_sum': int(r[2]), 'bought_weight585': _f(r[3]),
        'sold_count': int(r[4]), 'sold_sum': int(r[5]), 'profit': int(r[6]),
    } for r in cur.fetchall()]

    cur.execute(f"""
        SELECT CASE
                 WHEN NOW() - created_at < INTERVAL '3 days' THEN '0-2 дня'
                 WHEN NOW() - created_at < INTERVAL '8 days' THEN '3-7 дней'
                 WHEN NOW() - created_at < INTERVAL '15 days' THEN '8-14 дней'
                 ELSE '15+ дней' END AS b,
               COUNT(*), COALESCE(SUM(weight),0), COALESCE(SUM({W585}),0), COALESCE(SUM(buy_price),0)
        FROM {T} WHERE status = 'new' GROUP BY 1
    """)
    order = {'0-2 дня': 0, '3-7 дней': 1, '8-14 дней': 2, '15+ дней': 3}
    stock_age = sorted([{
        'bucket': r[0], 'count': int(r[1]), 'weight': _f(r[2]), 'weight585': _f(r[3]), 'buy': int(r[4]),
    } for r in cur.fetchall()], key=lambda x: order.get(x['bucket'], 9))

    cur.execute(f"""
        SELECT COUNT(*), COALESCE(SUM(weight),0), COALESCE(SUM({W585}),0), COALESCE(SUM(buy_price),0),
               COALESCE(SUM(buy_price) FILTER (WHERE is_investor_money),0)
        FROM {T} WHERE status = 'new'
    """)
    st = cur.fetchone()
    stock = {
        'count': int(st[0]), 'weight': _f(st[1]), 'weight585': _f(st[2]),
        'buy_sum': int(st[3]), 'investor_buy_sum': int(st[4]),
        'avg_price585': round(int(st[3]) / _f(st[2]), 1) if _f(st[2]) > 0 else 0,
    }

    cur.execute(f"""
        SELECT COALESCE(SUM(profit) FILTER (WHERE status='done'),0),
               COALESCE(SUM(buy_price) FILTER (WHERE status <> 'cancelled'),0),
               COALESCE(SUM(sell_price) FILTER (WHERE status = 'done'),0)
        FROM {T}
    """)
    al = cur.fetchone()
    all_time = {'profit': int(al[0]), 'bought_sum': int(al[1]), 'sold_sum': int(al[2])}

    return {
        'period': period, 'kpi': kpi, 'sold_by_purity': sold_by_purity,
        'bought_by_purity': bought_by_purity, 'bought_by_day': bought_by_day,
        'bought_by_payment': bought_by_payment, 'top_deals': top_deals,
        'worst_deals': worst_deals, 'by_month': by_month, 'stock_age': stock_age,
        'stock': stock, 'all_time': all_time,
    }


def _money_row(r) -> dict:
    return {
        'id': r[0], 'created_at': r[1].isoformat() if r[1] else None,
        'cash_register': _f(r[2]), 'safe_cash': _f(r[3]), 'bank_account': _f(r[4]),
        'other_money': _f(r[5]), 'investor_money': _f(r[6]), 'debts_owed_to_me': _f(r[7]),
        'start_capital': _f(r[8]), 'withdrawn': _f(r[9]), 'expenses': _f(r[10]),
        'gold_market_price_585': _f(r[11]), 'note': r[12] or '', 'author': r[13] or '',
    }


MONEY_COLS = ("id, created_at, cash_register, safe_cash, bank_account, other_money, investor_money, "
              "debts_owed_to_me, start_capital, withdrawn, expenses, gold_market_price_585, note, author")


def handler(event: dict, context) -> dict:
    """Управление заявками на скупку золота — CRUD + аналитика. Только для owner/admin."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    # Публичная страница инвестора — без авторизации (по share_token)
    params0 = event.get('queryStringParameters') or {}
    if event.get('httpMethod') == 'GET' and params0.get('action') == 'investor_public':
        conn = get_conn(); cur = conn.cursor()
        try:
            return _investor_public(conn, cur, params0.get('token', ''))
        finally:
            cur.close(); conn.close()

    _role = employee_role(event)
    if not _role:
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    if _role not in ('owner', 'admin'):
        _allowed = (method == 'POST' and body.get('action') == 'create') or \
                   (method == 'GET' and params.get('action') == 'today_summary')
        if not _allowed:
            return {'statusCode': 403, 'headers': HEADERS, 'body': json.dumps({'error': 'Нет доступа'}, ensure_ascii=False)}

    if method == 'GET' and params.get('action') == 'today_summary':
        _c = get_conn(); _cu = _c.cursor()
        _cu.execute(
            f"SELECT COUNT(*), COALESCE(SUM(weight),0), COALESCE(SUM(buy_price),0) FROM {SCHEMA}.gold_orders "
            f"WHERE (created_at AT TIME ZONE 'Europe/Moscow')::date = (NOW() AT TIME ZONE 'Europe/Moscow')::date"
        )
        _r = _cu.fetchone()
        _cu.close(); _c.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(
            {'ok': True, 'count': int(_r[0]), 'grams': float(_r[1]), 'sum': int(_r[2])}, ensure_ascii=False)}

    conn = get_conn()
    cur = conn.cursor()

    # ─── GET ──────────────────────────────────────────────────────────────────
    if method == 'GET':
        action = params.get('action', '')

        # Настройки инвестора (для админа)
        if action == 'investor_settings':
            cur.execute(
                f"SELECT id, share_token, investor_name, money_in_safe, default_profit_per_gram "
                f"FROM {SCHEMA}.gold_investor_settings ORDER BY id ASC LIMIT 1"
            )
            r = cur.fetchone()
            cur.close(); conn.close()
            if not r:
                return {'statusCode': 404, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Settings not found'}, ensure_ascii=False)}
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
                'settings': {
                    'id': r[0],
                    'share_token': r[1],
                    'investor_name': r[2],
                    'money_in_safe': float(r[3] or 0),
                    'default_profit_per_gram': float(r[4] or 0),
                }
            }, ensure_ascii=False)}

        if action == 'report':
            rep = _gold_report(cur, params.get('period', 'month'),
                               (params.get('date_from') or '').strip(), (params.get('date_to') or '').strip())
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(rep, ensure_ascii=False)}

        if action == 'money':
            cur.execute(f"SELECT {MONEY_COLS} FROM {SCHEMA}.gold_money_snapshots ORDER BY created_at DESC LIMIT 30")
            rows = [_money_row(r) for r in cur.fetchall()]
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(
                {'latest': rows[0] if rows else None, 'history': rows}, ensure_ascii=False)}

        # Аналитика за период
        if action == 'analytics':
            period = params.get('period', 'month')
            date_from = (params.get('date_from') or '').strip()
            date_to = (params.get('date_to') or '').strip()

            # Календарный день МСК: 00:00–23:59 (UTC+3).
            # Старт сегодня в МСК = DATE_TRUNC('day', NOW()+3h) - 3h (в UTC).
            def _safe_date(s: str) -> str:
                # YYYY-MM-DD only — фильтруем посторонние символы для Simple Query
                return ''.join(ch for ch in s if ch.isdigit() or ch == '-')[:10]

            if period == 'custom' and (date_from or date_to):
                df = _safe_date(date_from)
                dt = _safe_date(date_to)
                conds_p = []
                conds_b = []
                if df:
                    conds_p.append(f"COALESCE(completed_at, status_updated_at, created_at) >= ('{df}'::date - INTERVAL '3 hours')")
                    conds_b.append(f"created_at >= ('{df}'::date - INTERVAL '3 hours')")
                if dt:
                    # включаем весь день dt
                    conds_p.append(f"COALESCE(completed_at, status_updated_at, created_at) < (('{dt}'::date + INTERVAL '1 day') - INTERVAL '3 hours')")
                    conds_b.append(f"created_at < (('{dt}'::date + INTERVAL '1 day') - INTERVAL '3 hours')")
                period_where = ' AND '.join(conds_p) if conds_p else 'TRUE'
                buy_period_where = ' AND '.join(conds_b) if conds_b else 'TRUE'
            elif period == 'all':
                period_where = 'TRUE'
                buy_period_where = 'TRUE'
            elif period == 'year':
                period_where = """
                    COALESCE(completed_at, status_updated_at, created_at) >= (
                        DATE_TRUNC('year', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours'
                    )
                """
                buy_period_where = "created_at >= (DATE_TRUNC('year', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')"
            elif period == 'yesterday':
                period_where = """
                    COALESCE(completed_at, status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '1 day'
                    )
                    AND COALESCE(completed_at, status_updated_at, created_at) < (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours'
                    )
                """
                buy_period_where = """
                    created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '1 day')
                    AND created_at < (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')
                """
            elif period == 'day':
                period_where = """
                    COALESCE(completed_at, status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours'
                    )
                """
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours')"
            elif period == 'week':
                period_where = """
                    COALESCE(completed_at, status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '6 days'
                    )
                """
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '6 days')"
            else:
                # month — последние 30 дней
                period_where = """
                    COALESCE(completed_at, status_updated_at, created_at) >= (
                        DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '29 days'
                    )
                """
                buy_period_where = "created_at >= (DATE_TRUNC('day', NOW() + INTERVAL '3 hours') - INTERVAL '3 hours' - INTERVAL '29 days')"

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
                    COALESCE(SUM(weight) FILTER (WHERE status = 'done'), 0) as total_weight,
                    COALESCE(SUM(weight * (CAST(NULLIF(purity, '') AS NUMERIC) / 585.0)) FILTER (WHERE status = 'done'), 0) as total_weight_585
                FROM {SCHEMA}.gold_orders
                WHERE {period_where}
            """)
            row = cur.fetchone()
            total_buy = int(row[4]) if row[4] else 0
            total_sell = int(row[5]) if row[5] else 0
            total_profit = int(row[6]) if row[6] else 0
            total_weight_585 = float(row[9]) if len(row) > 9 and row[9] else 0.0

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
                    DATE(COALESCE(completed_at, status_updated_at, created_at) + INTERVAL '3 hours') as work_day,
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
            # Список проданных позиций за период (для модалки с деталями)
            cur.execute(f"""
                SELECT id, item_name, weight, purity,
                       buy_price, sell_price, profit,
                       COALESCE(completed_at, status_updated_at, created_at) AS sold_at,
                       created_at, name
                FROM {SCHEMA}.gold_orders
                WHERE status = 'done' AND {period_where}
                ORDER BY COALESCE(completed_at, status_updated_at, created_at) DESC
                LIMIT 200
            """)
            sold_rows = cur.fetchall()
            sold_items = [
                {
                    'id': r[0],
                    'item_name': r[1] or '',
                    'weight': float(r[2]) if r[2] else 0,
                    'purity': r[3] or '',
                    'buy_price': int(r[4]) if r[4] else 0,
                    'sell_price': int(r[5]) if r[5] else 0,
                    'profit': int(r[6]) if r[6] else 0,
                    'sold_at': r[7].isoformat() if r[7] else None,
                    'created_at': r[8].isoformat() if r[8] else None,
                    'client_name': r[9] or '',
                }
                for r in sold_rows
            ]
            cur.close(); conn.close()
            return {
                'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'period': period,
                    'done': row[0], 'cancelled': row[1],
                    'in_progress': row[2], 'new': row[3],
                    'total': row[7], 'total_weight': float(row[8]) if row[8] else 0,
                    'total_weight_585': total_weight_585,
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
                    'sold_items': sold_items,
                }, ensure_ascii=False)
            }

        # Статистика за 30 дней (таблица)
        if action == 'daily_stats':
            cur.execute(f"""
                SELECT
                    DATE(COALESCE(completed_at, status_updated_at, created_at) + INTERVAL '3 hours') as work_day,
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
                   sell_price_per_gram, is_investor_money, investor_profit_per_gram
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
                'is_investor_money': bool(r[17]),
                'investor_profit_per_gram': float(r[18]) if r[18] is not None else 200.0,
            })
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'orders': orders}, ensure_ascii=False)}

    # ─── POST ─────────────────────────────────────────────────────────────────
    if method == 'POST':
        action = body.get('action', '')

        # Обновить настройки инвестора (имя, деньги в сейфе, ставка по умолчанию)
        if action == 'investor_settings':
            sets = []
            if body.get('investor_name') is not None:
                v = str(body['investor_name']).replace("'", "''")[:200]
                sets.append(f"investor_name = '{v}'")
            if body.get('money_in_safe') is not None:
                try:
                    sets.append(f"money_in_safe = {float(body['money_in_safe'])}")
                except Exception:
                    pass
            if body.get('default_profit_per_gram') is not None:
                try:
                    sets.append(f"default_profit_per_gram = {float(body['default_profit_per_gram'])}")
                except Exception:
                    pass
            if body.get('regenerate_token'):
                # Перегенерация публичной ссылки
                sets.append("share_token = md5(random()::text || clock_timestamp()::text) || md5(random()::text)")
            if not sets:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Нет данных'}, ensure_ascii=False)}
            sets.append("updated_at = NOW()")
            cur.execute(
                f"UPDATE {SCHEMA}.gold_investor_settings SET {', '.join(sets)} "
                f"WHERE id = (SELECT id FROM {SCHEMA}.gold_investor_settings ORDER BY id ASC LIMIT 1) "
                f"RETURNING share_token, investor_name, money_in_safe, default_profit_per_gram"
            )
            r = cur.fetchone()
            conn.commit()
            cur.close(); conn.close()
            if not r:
                return {'statusCode': 404, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Settings not found'}, ensure_ascii=False)}
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({
                'ok': True,
                'settings': {
                    'share_token': r[0],
                    'investor_name': r[1],
                    'money_in_safe': float(r[2] or 0),
                    'default_profit_per_gram': float(r[3] or 0),
                }
            }, ensure_ascii=False)}

        if action == 'money_save':
            def _n(key):
                try:
                    return float(str(body.get(key) or 0).replace(',', '.').replace(' ', ''))
                except Exception:
                    return 0.0
            note = str(body.get('note') or '').replace("'", "''")[:500]
            author = _employee_name(event).replace("'", "''")[:100]
            cur.execute(f"""
                INSERT INTO {SCHEMA}.gold_money_snapshots
                  (cash_register, safe_cash, bank_account, other_money, investor_money, debts_owed_to_me,
                   start_capital, withdrawn, expenses, gold_market_price_585, note, author)
                VALUES ({_n('cash_register')}, {_n('safe_cash')}, {_n('bank_account')}, {_n('other_money')},
                        {_n('investor_money')}, {_n('debts_owed_to_me')}, {_n('start_capital')}, {_n('withdrawn')},
                        {_n('expenses')}, {_n('gold_market_price_585')}, '{note}', '{author}')
                RETURNING {MONEY_COLS}
            """)
            saved = _money_row(cur.fetchone())
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'saved': saved}, ensure_ascii=False)}

        # Удалить заявку
        if action == 'delete':
            order_id = int(body.get('id', 0))
            cur.execute(f"DELETE FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
            conn.commit()
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

        # ─── ПРОДАТЬ ВСЁ одним актом по цене за грамм 585-эквивалента ────────
        # Берём все строки status='new', считаем общую массу в эквиваленте 585,
        # умножаем на цену за грамм 585 → получаем общую выручку.
        # Распределяем выручку пропорционально весу_585 каждой позиции.
        if action == 'sell_all':
            try:
                price_per_gram_585 = float(body.get('price_per_gram_585') or body.get('price_per_gram') or 0)
            except Exception:
                price_per_gram_585 = 0.0
            payment_method = str(body.get('payment_method') or '').strip().replace("'", "''")
            if price_per_gram_585 <= 0:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Укажите цену за грамм (₽/г)'}, ensure_ascii=False)}

            # 1) Получаем все позиции в наличии
            cur.execute(f"""
                SELECT id, weight, COALESCE(NULLIF(purity, ''), '585') as purity, COALESCE(buy_price, 0) as buy_price
                FROM {SCHEMA}.gold_orders
                WHERE status = 'new' AND weight > 0
            """)
            rows = cur.fetchall()
            if not rows:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Нет позиций в наличии для продажи'}, ensure_ascii=False)}

            # 2) Считаем эквивалент 585 для каждой позиции и общий вес 585
            items = []
            total_weight_585 = 0.0
            total_weight_raw = 0.0
            total_buy = 0
            for r in rows:
                oid = r[0]
                w = float(r[1]) if r[1] is not None else 0.0
                purity_str = str(r[2]).strip()
                bp = int(r[3]) if r[3] is not None else 0
                try:
                    p_num = float(''.join(ch for ch in purity_str if ch.isdigit() or ch == '.') or '585')
                except Exception:
                    p_num = 585.0
                w_585 = w * (p_num / 585.0)
                items.append({'id': oid, 'w': w, 'w_585': w_585, 'buy': bp})
                total_weight_585 += w_585
                total_weight_raw += w
                total_buy += bp

            if total_weight_585 <= 0:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': HEADERS,
                        'body': json.dumps({'error': 'Общий вес = 0'}, ensure_ascii=False)}

            # 3) Общая выручка
            total_revenue = int(round(total_weight_585 * price_per_gram_585))

            # 4) Распределяем по позициям пропорционально w_585
            distributed = 0
            updates = []
            for idx, it in enumerate(items):
                if idx == len(items) - 1:
                    sell_price = total_revenue - distributed
                else:
                    sell_price = int(round(total_revenue * (it['w_585'] / total_weight_585)))
                    distributed += sell_price
                profit = sell_price - it['buy']
                # цена за грамм исходного веса этой позиции:
                spg = (sell_price / it['w']) if it['w'] > 0 else 0.0
                updates.append((it['id'], sell_price, profit, spg))

            # 5) Обновляем БД
            for oid, sell_price, profit, spg in updates:
                pm_clause = f", payment_method = '{payment_method}'" if payment_method else ''
                cur.execute(f"""
                    UPDATE {SCHEMA}.gold_orders
                    SET status = 'done', status_updated_at = NOW(), completed_at = NOW(),
                        sell_price = {int(sell_price)}, profit = {int(profit)},
                        sell_price_per_gram = {float(spg):.4f}
                        {pm_clause}
                    WHERE id = {int(oid)}
                """)
            conn.commit()
            total_profit = int(total_revenue - total_buy)
            try:
                _notify_max(
                    f"💰 *Продано золото* ({len(updates)} поз.)\n\n"
                    f"⚖️ *Вес: {_g(total_weight_raw)}*, в 585 пробе {_g(total_weight_585)}\n"
                    f"💵 *Выручка: {_rub(total_revenue)}* ({_rub(price_per_gram_585)}/г в 585)\n"
                    f"🛒 Куплено на: {_rub(total_buy)}\n"
                    f"📈 Прибыль: {_rub(total_profit)}"
                    + (f"\n👨‍💼 {_employee_name(event)}" if _employee_name(event) else "")
                    + "\n\n" + _stock_line(cur)
                )
            except Exception as ne:
                print(f'[gold-admin][sell_all notify] {ne}')
            cur.close(); conn.close()
            return {
                'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'ok': True,
                    'sold_count': len(updates),
                    'total_weight': round(total_weight_raw, 3),
                    'total_weight_585': round(total_weight_585, 3),
                    'price_per_gram_585': price_per_gram_585,
                    'total_revenue': total_revenue,
                    'total_buy': total_buy,
                    'total_profit': total_profit,
                }, ensure_ascii=False)
            }

        # Создать заявку
        if action == 'create':
            name = str(body.get('name', '')).strip()
            phone = str(body.get('phone', '')).strip()
            if body.get('strict') or _role not in ('owner', 'admin'):
                _digits = ''.join(ch for ch in phone if ch.isdigit())
                try:
                    _w = float(body.get('weight') or 0)
                except Exception:
                    _w = 0
                try:
                    _b = float(body.get('buy_price') or 0)
                except Exception:
                    _b = 0
                _errs = []
                if len(_digits) != 11:
                    _errs.append('номер телефона')
                if _w <= 0:
                    _errs.append('вес')
                if _b <= 0:
                    _errs.append('общая выданная сумма')
                if _errs:
                    cur.close(); conn.close()
                    return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps(
                        {'error': 'Заполните: ' + ', '.join(_errs)}, ensure_ascii=False)}
                if not name:
                    name = 'Клиент'
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
            is_inv = 'TRUE' if body.get('is_investor_money') else 'FALSE'
            try:
                ipg = float(body.get('investor_profit_per_gram')) if body.get('investor_profit_per_gram') not in (None, '') else 200.0
            except Exception:
                ipg = 200.0

            cur.execute(f"""
                INSERT INTO {SCHEMA}.gold_orders
                    (name, phone, item_name, weight, purity, buy_price, sell_price, sell_price_per_gram, profit, comment,
                     is_investor_money, investor_profit_per_gram)
                VALUES
                    ('{name_e}', '{phone_e}',
                     '{item_name}', {weight_sql}, '{purity}',
                     {buy_sql}, {sell_sql}, {spg_sql}, {profit_sql}, '{comment}',
                     {is_inv}, {ipg})
                RETURNING id
            """)
            order_id = cur.fetchone()[0]
            conn.commit()
            try:
                _w = float(weight) if weight else 0
                _bp = int(buy_price) if buy_price is not None else 0
                _text = (
                    f"🥇 *Куплено золото* #{order_id}\n\n"
                    f"📿 {str(body.get('item_name', '') or 'Золото')}"
                    + (f", проба {PURITY_LABELS.get(str(body.get('purity') or ''), body.get('purity'))}" if body.get('purity') else "")
                    + f"\n⚖️ *Вес: {_g(_w)}*\n"
                    + f"💵 *Сумма: {_rub(_bp)}*"
                    + (f" ({_rub(_bp / _w)}/г)" if _w > 0 and _bp > 0 else "")
                    + (f"\n👤 {name}" if name else "")
                    + (f"\n👨‍💼 {_employee_name(event)}" if _employee_name(event) else "")
                    + "\n\n" + _stock_line(cur)
                )
                _notify_max(_text)
            except Exception as ne:
                print(f'[gold-admin][create notify] {ne}')
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

        # При переводе в "Продано" — авто-пересчёт sell_price из ₽/г × вес,
        # если в запросе ни sell_price, ни sell_price_per_gram не пришли.
        if new_status == 'done' and sell_price is None and sell_price_per_gram is None:
            cur.execute(f"SELECT weight, sell_price_per_gram, sell_price FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
            r = cur.fetchone()
            if r:
                w_db = float(r[0]) if r[0] is not None else 0.0
                spg_db = float(r[1]) if r[1] is not None else 0.0
                cur_sell = r[2]
                if spg_db > 0 and w_db > 0:
                    sell_price = int(round(spg_db * w_db))
                elif cur_sell:
                    sell_price = int(cur_sell)

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
        if 'is_investor_money' in body:
            sets.append(f"is_investor_money = {'TRUE' if body.get('is_investor_money') else 'FALSE'}")
        if body.get('investor_profit_per_gram') is not None:
            try:
                sets.append(f"investor_profit_per_gram = {float(body['investor_profit_per_gram'])}")
            except Exception:
                pass

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

        if new_status in ('done', 'cancelled'):
            try:
                cur.execute(f"SELECT item_name, weight, purity, buy_price, sell_price FROM {SCHEMA}.gold_orders WHERE id = {order_id}")
                _it = cur.fetchone()
                if _it:
                    _head = '💰 *Продано золото*' if new_status == 'done' else '❌ *Золото — отмена*'
                    _notify_max(
                        f"{_head} #{order_id}\n\n"
                        f"📿 {_it[0] or 'Золото'}" + (f", проба {_it[2]}" if _it[2] else "") + "\n"
                        f"⚖️ *Вес: {_g(_it[1])}*\n"
                        + (f"💵 *Продано за: {_rub(_it[4])}*\n" if new_status == 'done' and _it[4] else "")
                        + (f"🛒 Куплено за: {_rub(_it[3])}\n" if _it[3] else "")
                        + (f"👨‍💼 {_employee_name(event)}\n" if _employee_name(event) else "")
                        + "\n" + _stock_line(cur)
                    )
            except Exception as ne:
                print(f'[gold-admin][status notify] {ne}')
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True}, ensure_ascii=False)}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)}