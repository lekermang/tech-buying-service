import json
import os
from datetime import datetime, date, timedelta
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

PRESETS = {
    'today', 'yesterday', 'd7', 'd14', 'd30', 'd90',
    'mtd', 'prev_month', 'qtd', 'ytd', 'year', 'custom'
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def get_employee(token: str):
    if not token:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, full_name, role FROM {SCHEMA}.employees "
        f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {'id': row[0], 'full_name': row[1], 'role': row[2]} if row else None


def resolve_range(period: str, date_from: str = None, date_to: str = None):
    today = date.today()
    if period == 'today':
        return today, today
    if period == 'yesterday':
        y = today - timedelta(days=1)
        return y, y
    if period == 'd7':
        return today - timedelta(days=6), today
    if period == 'd14':
        return today - timedelta(days=13), today
    if period == 'd30':
        return today - timedelta(days=29), today
    if period == 'd90':
        return today - timedelta(days=89), today
    if period == 'mtd':
        return today.replace(day=1), today
    if period == 'prev_month':
        first_this = today.replace(day=1)
        last_prev = first_this - timedelta(days=1)
        first_prev = last_prev.replace(day=1)
        return first_prev, last_prev
    if period == 'qtd':
        q_first_month = ((today.month - 1) // 3) * 3 + 1
        return date(today.year, q_first_month, 1), today
    if period == 'ytd':
        return date(today.year, 1, 1), today
    if period == 'year':
        return today - timedelta(days=364), today
    if period == 'custom' and date_from and date_to:
        return (
            datetime.strptime(date_from, '%Y-%m-%d').date(),
            datetime.strptime(date_to, '%Y-%m-%d').date(),
        )
    return today - timedelta(days=29), today


def prev_range(d_from: date, d_to: date):
    span = (d_to - d_from).days + 1
    return d_from - timedelta(days=span), d_from - timedelta(days=1)


def compute_pl(cur, d_from: date, d_to: date):
    """Считает основные финансовые потоки за период по всем направлениям."""
    f = d_from.isoformat()
    t = d_to.isoformat()

    # Ремонт: выручка = repair_amount, COGS = purchase_amount (запчасти), мастер = master_income
    cur.execute(
        f"""SELECT
              COALESCE(SUM(repair_amount), 0) AS revenue,
              COALESCE(SUM(purchase_amount), 0) AS cogs,
              COALESCE(SUM(master_income), 0) AS labor,
              COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS done,
              COUNT(*) AS total
           FROM {SCHEMA}.repair_orders
           WHERE COALESCE(completed_at, created_at)::date BETWEEN '{f}' AND '{t}'"""
    )
    r = cur.fetchone()
    repair = {
        'revenue': float(r[0] or 0),
        'cogs': float(r[1] or 0),
        'labor': float(r[2] or 0),
        'done': int(r[3] or 0),
        'total': int(r[4] or 0),
    }

    # Золото: выручка = sell_price, COGS = buy_price
    cur.execute(
        f"""SELECT
              COALESCE(SUM(sell_price), 0),
              COALESCE(SUM(buy_price), 0),
              COALESCE(SUM(weight), 0),
              COUNT(*) FILTER (WHERE status='done'),
              COUNT(*)
           FROM {SCHEMA}.gold_orders
           WHERE COALESCE(completed_at, created_at)::date BETWEEN '{f}' AND '{t}'"""
    )
    r = cur.fetchone()
    gold = {
        'revenue': float(r[0] or 0),
        'cogs': float(r[1] or 0),
        'weight': float(r[2] or 0),
        'done': int(r[3] or 0),
        'total': int(r[4] or 0),
    }

    # Комиссионка б/у: проданное в период
    cur.execute(
        f"""SELECT
              COALESCE(SUM(sell_price), 0),
              COALESCE(SUM(buy_price), 0),
              COUNT(*)
           FROM {SCHEMA}.slshop_items
           WHERE status IN ('sold', 'returned_paid')
             AND sell_at::date BETWEEN '{f}' AND '{t}'"""
    )
    r = cur.fetchone()
    slshop = {
        'revenue': float(r[0] or 0),
        'cogs': float(r[1] or 0),
        'count': int(r[2] or 0),
    }

    # Договоры 14 дней: проценты как выручка, тело — не выручка
    cur.execute(
        f"""SELECT
              COALESCE(SUM(amount * (interest_rate/100) * term_days), 0) AS interest,
              COALESCE(SUM(amount), 0) AS principal,
              COUNT(*)
           FROM {SCHEMA}.contracts_14d
           WHERE created_at::date BETWEEN '{f}' AND '{t}'"""
    )
    r = cur.fetchone()
    pawn = {
        'revenue': float(r[0] or 0),
        'principal': float(r[1] or 0),
        'count': int(r[2] or 0),
    }

    # Продажи общие (sales таблица) — на случай, если есть пробитые goods/услуги
    cur.execute(
        f"""SELECT type, COALESCE(SUM(amount_final), 0), COUNT(*)
           FROM {SCHEMA}.sales
           WHERE created_at::date BETWEEN '{f}' AND '{t}'
           GROUP BY type"""
    )
    sales_by_type = {row[0]: {'sum': float(row[1] or 0), 'count': int(row[2] or 0)} for row in cur.fetchall()}

    # Зарплата за период (постоянные + переменные оклада)
    cur.execute(
        f"""SELECT COALESCE(SUM(total), 0), COALESCE(SUM(bonus_amount), 0), COALESCE(SUM(base_rate * hours_worked / 8), 0)
           FROM {SCHEMA}.employee_salary_log
           WHERE shift_date BETWEEN '{f}' AND '{t}'"""
    )
    r = cur.fetchone()
    salary = {
        'total': float(r[0] or 0),
        'bonus': float(r[1] or 0),
        'base': float(r[2] or 0),
    }

    # Кассовые расходы (slshop_cash_movements direction='out') — операционка
    cur.execute(
        f"""SELECT COALESCE(category, 'other'), COALESCE(SUM(amount), 0)
           FROM {SCHEMA}.slshop_cash_movements
           WHERE direction='out'
             AND created_at::date BETWEEN '{f}' AND '{t}'
           GROUP BY category"""
    )
    cash_out_by_cat = {row[0] or 'other': float(row[1] or 0) for row in cur.fetchall()}

    return {
        'repair': repair,
        'gold': gold,
        'slshop': slshop,
        'pawn': pawn,
        'sales': sales_by_type,
        'salary': salary,
        'cash_out_by_cat': cash_out_by_cat,
    }


def compute_daily(cur, d_from: date, d_to: date):
    """Дневная динамика для графиков и тепловой карты."""
    f = d_from.isoformat()
    t = d_to.isoformat()

    # Серия по дням
    cur.execute(
        f"""WITH dates AS (
              SELECT generate_series('{f}'::date, '{t}'::date, '1 day'::interval)::date AS d
            )
            SELECT d.d::text,
              COALESCE((SELECT SUM(repair_amount) FROM {SCHEMA}.repair_orders
                        WHERE COALESCE(completed_at, created_at)::date = d.d), 0) AS repair_rev,
              COALESCE((SELECT SUM(purchase_amount) FROM {SCHEMA}.repair_orders
                        WHERE COALESCE(completed_at, created_at)::date = d.d), 0) AS repair_cogs,
              COALESCE((SELECT SUM(master_income) FROM {SCHEMA}.repair_orders
                        WHERE COALESCE(completed_at, created_at)::date = d.d), 0) AS repair_labor,
              COALESCE((SELECT SUM(sell_price) FROM {SCHEMA}.gold_orders
                        WHERE COALESCE(completed_at, created_at)::date = d.d), 0) AS gold_rev,
              COALESCE((SELECT SUM(buy_price) FROM {SCHEMA}.gold_orders
                        WHERE COALESCE(completed_at, created_at)::date = d.d), 0) AS gold_cogs,
              COALESCE((SELECT SUM(sell_price) FROM {SCHEMA}.slshop_items
                        WHERE status IN ('sold','returned_paid') AND sell_at::date = d.d), 0) AS sl_rev,
              COALESCE((SELECT SUM(buy_price) FROM {SCHEMA}.slshop_items
                        WHERE status IN ('sold','returned_paid') AND sell_at::date = d.d), 0) AS sl_cogs,
              COALESCE((SELECT SUM(amount * interest_rate/100 * term_days)
                        FROM {SCHEMA}.contracts_14d
                        WHERE created_at::date = d.d), 0) AS pawn_int
            FROM dates d
            ORDER BY d.d"""
    )
    rows = []
    for r in cur.fetchall():
        repair_rev = float(r[1] or 0)
        repair_cogs = float(r[2] or 0)
        repair_labor = float(r[3] or 0)
        gold_rev = float(r[4] or 0)
        gold_cogs = float(r[5] or 0)
        sl_rev = float(r[6] or 0)
        sl_cogs = float(r[7] or 0)
        pawn_int = float(r[8] or 0)
        revenue = repair_rev + gold_rev + sl_rev + pawn_int
        cogs = repair_cogs + gold_cogs + sl_cogs
        gross = revenue - cogs
        profit = gross - repair_labor
        rows.append({
            'day': r[0],
            'revenue': round(revenue, 2),
            'cogs': round(cogs, 2),
            'gross': round(gross, 2),
            'profit': round(profit, 2),
            'repair_rev': round(repair_rev, 2),
            'gold_rev': round(gold_rev, 2),
            'sl_rev': round(sl_rev, 2),
            'pawn_int': round(pawn_int, 2),
        })
    return rows


def get_params(cur):
    cur.execute(f"SELECT key, value FROM {SCHEMA}.finance_params")
    return {row[0]: float(row[1] or 0) for row in cur.fetchall()}


def build_metrics(pl: dict, params: dict, d_from: date, d_to: date):
    days = (d_to - d_from).days + 1

    revenue = (
        pl['repair']['revenue'] + pl['gold']['revenue']
        + pl['slshop']['revenue'] + pl['pawn']['revenue']
    )
    cogs = pl['repair']['cogs'] + pl['gold']['cogs'] + pl['slshop']['cogs']
    gross = revenue - cogs

    # Операционные расходы: зарплата + кассовые out (кроме закупок) + доля постоянных
    cash_out = sum(pl['cash_out_by_cat'].values())
    # Чтобы не дублировать: исключим явные закупочные категории, если такие есть
    purchase_categories = {'gold_buy', 'item_buy', 'purchase', 'buyout', 'closure'}
    cash_opex = sum(v for k, v in pl['cash_out_by_cat'].items() if k not in purchase_categories)

    fixed_monthly = params.get('fixed_costs_monthly', 0)
    fixed_period = fixed_monthly * (days / 30.4375)

    salary_total = pl['salary']['total']
    # Зарплата уже учитывает мастеров частично (master_income), убираем двойной счёт
    # repair labor — это master_income; в salary_total часть мастеров уже сидит,
    # поэтому берём максимум: salary_total (журнал) либо master_income (по ремонту)
    labor_full = max(salary_total, pl['repair']['labor'])

    opex = cash_opex + fixed_period + (labor_full - pl['repair']['labor'])
    # repair labor оставляем отдельной строкой (себестоимость работ мастера)
    ebit = gross - pl['repair']['labor'] - opex

    interest_received = params.get('interest_received', 0)
    interest_paid = params.get('interest_paid', 0)
    ebt = ebit + interest_received - interest_paid

    tax_rate = params.get('tax_rate', 0) / 100
    # УСН-доходы платится с выручки, но для управленческого учёта берём с EBT
    tax = max(0, ebt) * tax_rate
    net = ebt - tax

    # Переменные/постоянные (авто-эвристика)
    variable = cogs + pl['repair']['labor']  # переменные = закупки + сдельная мастера
    fixed = fixed_period + (labor_full - pl['repair']['labor']) + cash_opex
    contribution = revenue - variable  # маржинальная прибыль
    contribution_margin = (contribution / revenue) if revenue else 0
    bep_money = (fixed / contribution_margin) if contribution_margin else 0
    safety_margin = ((revenue - bep_money) / revenue * 100) if revenue else 0
    dol = (contribution / ebit) if ebit else 0
    fixed_coverage = (contribution / fixed) if fixed else 0

    # Рентабельности
    gross_margin = (gross / revenue * 100) if revenue else 0
    op_margin = (ebit / revenue * 100) if revenue else 0
    net_margin = (net / revenue * 100) if revenue else 0

    total_assets = params.get('total_assets', 0)
    non_int_liab = params.get('non_interest_liab', 0)
    invested_capital = total_assets - non_int_liab
    equity = params.get('equity', 0)
    debt = params.get('debt', 0)

    # Аннуализируем чистую прибыль для ROA/ROE/ROIC (если период < года)
    annualize = (365 / days) if days > 0 else 1
    net_annual = net * annualize
    nopat = ebit * (1 - tax_rate) * annualize

    roa = (net_annual / total_assets * 100) if total_assets else 0
    roe = (net_annual / equity * 100) if equity else 0
    roic = (nopat / invested_capital * 100) if invested_capital else 0

    cost_total = cogs + pl['repair']['labor'] + opex
    cost_profitability = ((ebit) / cost_total * 100) if cost_total else 0

    cost_of_debt = params.get('cost_of_debt', 0) / 100
    cost_of_equity = params.get('cost_of_equity', 0) / 100
    total_cap = equity + debt
    wacc = 0
    if total_cap:
        wacc = (
            (equity / total_cap) * cost_of_equity
            + (debt / total_cap) * cost_of_debt * (1 - tax_rate)
        ) * 100

    shares = params.get('shares_outstanding', 0)
    eps = (net_annual / shares) if shares else 0

    dividends = params.get('dividends_paid', 0)
    retention_ratio = ((net - dividends) / net * 100) if net else 0

    # Циклы
    avg_inv = params.get('avg_inventory', 0)
    avg_rec = params.get('avg_receivables', 0)
    avg_pay = params.get('avg_payables', 0)
    inv_days = (avg_inv / cogs * days) if cogs else 0
    rec_days = (avg_rec / revenue * days) if revenue else 0
    pay_days = (avg_pay / cogs * days) if cogs else 0
    op_cycle = inv_days + rec_days
    fin_cycle = op_cycle - pay_days

    quality_of_profit = (ebit / net) if net else 0

    return {
        'period_days': days,
        'revenue': round(revenue, 2),
        'cogs': round(cogs, 2),
        'gross_profit': round(gross, 2),
        'opex': round(opex, 2),
        'labor_direct': round(pl['repair']['labor'], 2),
        'ebit': round(ebit, 2),
        'interest_paid': round(interest_paid, 2),
        'interest_received': round(interest_received, 2),
        'ebt': round(ebt, 2),
        'tax': round(tax, 2),
        'net_profit': round(net, 2),
        'variable_costs': round(variable, 2),
        'fixed_costs': round(fixed, 2),
        'contribution': round(contribution, 2),
        'contribution_margin_pct': round(contribution_margin * 100, 2),
        'bep_money': round(bep_money, 2),
        'safety_margin_pct': round(safety_margin, 2),
        'dol': round(dol, 4),
        'fixed_coverage': round(fixed_coverage, 4),
        'gross_margin_pct': round(gross_margin, 2),
        'operating_margin_pct': round(op_margin, 2),
        'net_margin_pct': round(net_margin, 2),
        'roa_pct': round(roa, 2),
        'roe_pct': round(roe, 2),
        'roic_pct': round(roic, 2),
        'wacc_pct': round(wacc, 2),
        'eps': round(eps, 2),
        'retention_ratio_pct': round(retention_ratio, 2),
        'cost_profitability_pct': round(cost_profitability, 2),
        'invested_capital': round(invested_capital, 2),
        'equity': round(equity, 2),
        'inventory_days': round(inv_days, 1),
        'receivables_days': round(rec_days, 1),
        'payables_days': round(pay_days, 1),
        'operating_cycle': round(op_cycle, 1),
        'financial_cycle': round(fin_cycle, 1),
        'quality_of_profit': round(quality_of_profit, 2),
        'breakdown': {
            'repair': pl['repair'],
            'gold': pl['gold'],
            'slshop': pl['slshop'],
            'pawn': pl['pawn'],
            'salary': pl['salary'],
            'cash_out_by_cat': pl['cash_out_by_cat'],
        },
    }


def _err(code: int, msg: str):
    return {
        'statusCode': code,
        'headers': {**HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps({'error': msg}, ensure_ascii=False),
    }


def _ok(data):
    return {
        'statusCode': 200,
        'headers': {**HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(data, ensure_ascii=False, default=str),
    }


def handler(event: dict, context) -> dict:
    """Финансовая аналитика: P&L, маржи, ROA/ROE/ROIC, циклы, тепловая карта по дням."""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                **HEADERS,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    emp_token = headers_in.get('x-employee-token', '').strip()

    emp = get_employee(emp_token)
    if not emp:
        return _err(401, 'Требуется авторизация сотрудника')

    action = params.get('action', 'analytics')

    # GET ?action=params — текущие ручные параметры
    if method == 'GET' and action == 'params':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT key, value, description, updated_at, updated_by "
            f"FROM {SCHEMA}.finance_params ORDER BY id"
        )
        items = [
            {
                'key': r[0],
                'value': float(r[1] or 0),
                'description': r[2],
                'updated_at': r[3].isoformat() if r[3] else None,
                'updated_by': r[4],
            }
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return _ok({'params': items})

    # PUT ?action=params — обновить
    if method in ('PUT', 'POST') and action == 'params':
        if emp.get('role') not in ('owner', 'admin'):
            return _err(403, 'Недостаточно прав')
        raw_body = event.get('body') or '{}'
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body
        updates = body.get('values') or {}
        if not isinstance(updates, dict):
            return _err(400, 'Ожидался объект values')
        conn = get_conn()
        cur = conn.cursor()
        for key, val in updates.items():
            try:
                v = float(val)
            except (TypeError, ValueError):
                continue
            key_safe = key.replace("'", "''")[:64]
            cur.execute(
                f"UPDATE {SCHEMA}.finance_params SET value=%s, updated_at=NOW(), updated_by=%s WHERE key=%s",
                (v, emp.get('full_name'), key_safe),
            )
        conn.commit()
        cur.close()
        conn.close()
        return _ok({'ok': True})

    # GET ?action=analytics — основная аналитика
    if method == 'GET' and action == 'analytics':
        period = params.get('period', 'd30')
        if period not in PRESETS:
            period = 'd30'
        date_from = params.get('date_from')
        date_to = params.get('date_to')
        compare = params.get('compare', '1') != '0'

        d_from, d_to = resolve_range(period, date_from, date_to)
        conn = get_conn()
        cur = conn.cursor()

        params_map = get_params(cur)
        pl = compute_pl(cur, d_from, d_to)
        metrics = build_metrics(pl, params_map, d_from, d_to)
        daily = compute_daily(cur, d_from, d_to)

        result = {
            'period': period,
            'date_from': d_from.isoformat(),
            'date_to': d_to.isoformat(),
            'metrics': metrics,
            'daily': daily,
        }

        if compare:
            p_from, p_to = prev_range(d_from, d_to)
            pl_prev = compute_pl(cur, p_from, p_to)
            metrics_prev = build_metrics(pl_prev, params_map, p_from, p_to)
            result['compare'] = {
                'date_from': p_from.isoformat(),
                'date_to': p_to.isoformat(),
                'metrics': metrics_prev,
            }

        cur.close()
        conn.close()
        return _ok(result)

    return _err(404, 'Неизвестный action')
