"""
Business: API расчёта зарплаты сотрудников.
         Сотрудник видит только свою смену и итоговую зарплату.
         Владелец видит всех, настраивает % и ставку, отмечает выходные и выплаты.
Args: event - dict с httpMethod, queryStringParameters, body, headers (X-Employee-Token)
      context - объект с request_id, function_name
Returns: HTTP-ответ с JSON
"""
import json
import os
from datetime import datetime, date, timezone
from decimal import Decimal

import psycopg2
import psycopg2.extras

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}
SCHEMA = 't_p31606708_tech_buying_service'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(status, body):
    return {
        'statusCode': status,
        'headers': HEADERS,
        'isBase64Encoded': False,
        'body': json.dumps(body, default=str, ensure_ascii=False),
    }


def get_header(headers, name):
    if not headers:
        return None
    target = name.lower()
    for k, v in headers.items():
        if k.lower() == target:
            return v
    return None


def auth_employee(token):
    """Возвращает (employee_id, role, full_name) или None."""
    if not token:
        return None
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT id, role, full_name FROM {SCHEMA}.employees "
            f"WHERE auth_token = %s AND is_active = true "
            f"AND (token_expires_at IS NULL OR token_expires_at > NOW())",
            (token,),
        )
        row = cur.fetchone()
    return row


def calc_personal_profit(cur, employee_id, started_at, ended_at):
    """Чистая прибыль сотрудника за период: SUM(sales.amount_final - goods.purchase_price)."""
    cur.execute(
        f"""
        SELECT COALESCE(SUM(s.amount_final - g.purchase_price), 0) AS profit
        FROM {SCHEMA}.sales s
        JOIN {SCHEMA}.goods g ON g.id = s.good_id
        WHERE s.employee_id = %s
          AND s.type = 'goods'
          AND s.created_at >= %s
          AND s.created_at <= %s
        """,
        (employee_id, started_at, ended_at),
    )
    return int(cur.fetchone()[0] or 0)


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return resp(200, {})

    headers = event.get('headers') or {}
    token = get_header(headers, 'X-Employee-Token')
    user = auth_employee(token)
    if not user:
        return resp(401, {'error': 'unauthorized'})
    user_id, role, full_name = user

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # =====================================================
    # СОТРУДНИК: видит только свою смену
    # =====================================================
    if action == 'my_today':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            today = date.today()
            cur.execute(
                f"SELECT daily_rate, bonus_percent, min_hours_for_rate "
                f"FROM {SCHEMA}.employee_salary_config WHERE employee_id = %s",
                (user_id,),
            )
            cfg = cur.fetchone() or {'daily_rate': 2000, 'bonus_percent': 3.0, 'min_hours_for_rate': 10.0}

            cur.execute(
                f"SELECT id, started_at, ended_at, status FROM {SCHEMA}.employee_shifts "
                f"WHERE employee_id = %s AND shift_date = %s",
                (user_id, today),
            )
            shift = cur.fetchone()

            today_total = None
            if shift and shift['status'] == 'closed':
                cur.execute(
                    f"SELECT total FROM {SCHEMA}.employee_salary_log WHERE shift_id = %s",
                    (shift['id'],),
                )
                row = cur.fetchone()
                today_total = row['total'] if row else None

            return resp(200, {
                'employee': {'id': user_id, 'name': full_name},
                'config': {
                    'daily_rate': cfg['daily_rate'],
                    'bonus_percent': float(cfg['bonus_percent']),
                },
                'shift': shift,
                'today_total': today_total,
            })

    if action == 'shift_start' and method == 'POST':
        today = date.today()
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"SELECT status FROM {SCHEMA}.employee_shifts "
                f"WHERE employee_id = %s AND shift_date = %s",
                (user_id, today),
            )
            existing = cur.fetchone()
            if existing:
                status = existing[0]
                if status == 'dayoff':
                    return resp(403, {'error': 'dayoff', 'message': 'Сегодня выходной'})
                if status == 'open':
                    return resp(200, {'ok': True, 'message': 'Смена уже открыта'})
                if status == 'closed':
                    return resp(403, {'error': 'closed', 'message': 'Смена сегодня уже закрыта'})

            cur.execute(
                f"INSERT INTO {SCHEMA}.employee_shifts (employee_id, shift_date, status) "
                f"VALUES (%s, %s, 'open') RETURNING id, started_at",
                (user_id, today),
            )
            shift_id, started = cur.fetchone()
            conn.commit()
            return resp(200, {'ok': True, 'shift_id': shift_id, 'started_at': started.isoformat()})

    if action == 'shift_end' and method == 'POST':
        today = date.today()
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, started_at, status FROM {SCHEMA}.employee_shifts "
                f"WHERE employee_id = %s AND shift_date = %s",
                (user_id, today),
            )
            shift = cur.fetchone()
            if not shift or shift['status'] != 'open':
                return resp(400, {'error': 'no_open_shift', 'message': 'Нет открытой смены'})

            cur.execute(
                f"SELECT daily_rate, bonus_percent, min_hours_for_rate "
                f"FROM {SCHEMA}.employee_salary_config WHERE employee_id = %s",
                (user_id,),
            )
            cfg = cur.fetchone() or {
                'daily_rate': 2000,
                'bonus_percent': Decimal('3.0'),
                'min_hours_for_rate': Decimal('10.0'),
            }

            started_at = shift['started_at']
            tz = started_at.tzinfo or timezone.utc
            now = datetime.now(tz)
            hours = Decimal((now - started_at).total_seconds()) / Decimal(3600)
            hours = hours.quantize(Decimal('0.01'))

            min_hours = Decimal(str(cfg['min_hours_for_rate']))
            base_rate = int(cfg['daily_rate']) if hours >= min_hours else 0

            profit = calc_personal_profit(cur, user_id, started_at, now)
            percent = Decimal(str(cfg['bonus_percent']))
            bonus = int(Decimal(profit) * percent / Decimal(100))
            total = base_rate + bonus

            cur.execute(
                f"UPDATE {SCHEMA}.employee_shifts SET ended_at = %s, status = 'closed' WHERE id = %s",
                (now, shift['id']),
            )
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.employee_salary_log
                  (shift_id, employee_id, shift_date, hours_worked, base_rate,
                   personal_profit, bonus_percent_at_time, bonus_amount, total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (shift['id'], user_id, today, hours, base_rate, profit, percent, bonus, total),
            )
            conn.commit()
            return resp(200, {
                'ok': True,
                'hours_worked': float(hours),
                'total': total,
                'reached_minimum': base_rate > 0,
            })

    if action == 'my_history':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT shift_date, hours_worked, total, is_paid, paid_at
                FROM {SCHEMA}.employee_salary_log
                WHERE employee_id = %s
                ORDER BY shift_date DESC LIMIT 60
                """,
                (user_id,),
            )
            return resp(200, {'history': cur.fetchall()})

    # =====================================================
    # ВЛАДЕЛЕЦ: видит всё, управляет
    # =====================================================
    if role != 'owner':
        return resp(403, {'error': 'forbidden', 'message': 'Только для владельца'})

    if action == 'owner_overview':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            today = date.today()
            cur.execute(
                f"""
                SELECT
                  e.id, e.full_name, e.login, e.position, e.role,
                  COALESCE(cfg.daily_rate, 2000) AS daily_rate,
                  COALESCE(cfg.bonus_percent, 3.0) AS bonus_percent,
                  COALESCE(cfg.min_hours_for_rate, 10.0) AS min_hours_for_rate,
                  sh.id AS shift_id, sh.status AS shift_status,
                  sh.started_at, sh.ended_at,
                  (SELECT COALESCE(SUM(total), 0)
                     FROM {SCHEMA}.employee_salary_log
                     WHERE employee_id = e.id AND is_paid = false) AS unpaid_total
                FROM {SCHEMA}.employees e
                LEFT JOIN {SCHEMA}.employee_salary_config cfg ON cfg.employee_id = e.id
                LEFT JOIN {SCHEMA}.employee_shifts sh ON sh.employee_id = e.id AND sh.shift_date = %s
                WHERE e.is_active = true AND e.role IN ('staff', 'admin')
                ORDER BY e.full_name
                """,
                (today,),
            )
            return resp(200, {'employees': cur.fetchall()})

    if action == 'owner_employee_detail':
        try:
            emp_id = int(params.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        if not emp_id:
            return resp(400, {'error': 'employee_id required'})
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT
                  sl.id, sl.shift_date, sl.hours_worked, sl.base_rate,
                  sl.personal_profit, sl.bonus_percent_at_time, sl.bonus_amount,
                  sl.total, sl.is_paid, sl.paid_at, sl.created_at
                FROM {SCHEMA}.employee_salary_log sl
                WHERE sl.employee_id = %s
                ORDER BY sl.shift_date DESC LIMIT 90
                """,
                (emp_id,),
            )
            history = cur.fetchall()

            cur.execute(
                f"""
                SELECT shift_date, status FROM {SCHEMA}.employee_shifts
                WHERE employee_id = %s AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
                ORDER BY shift_date DESC
                """,
                (emp_id,),
            )
            calendar = cur.fetchall()
            return resp(200, {'history': history, 'calendar': calendar})

    if action == 'owner_set_config' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            emp_id = int(body.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        if not emp_id:
            return resp(400, {'error': 'employee_id required'})
        daily_rate = int(body.get('daily_rate', 2000))
        bonus_percent = float(body.get('bonus_percent', 3.0))
        min_hours = float(body.get('min_hours_for_rate', 10.0))

        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.employee_salary_config
                  (employee_id, daily_rate, bonus_percent, min_hours_for_rate, updated_by)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (employee_id) DO UPDATE
                SET daily_rate = EXCLUDED.daily_rate,
                    bonus_percent = EXCLUDED.bonus_percent,
                    min_hours_for_rate = EXCLUDED.min_hours_for_rate,
                    updated_at = NOW(),
                    updated_by = EXCLUDED.updated_by
                """,
                (emp_id, daily_rate, bonus_percent, min_hours, user_id),
            )
            conn.commit()
            return resp(200, {'ok': True})

    if action == 'owner_mark_dayoff' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            emp_id = int(body.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        day = body.get('date')
        is_dayoff = bool(body.get('is_dayoff', True))
        if not emp_id or not day:
            return resp(400, {'error': 'employee_id and date required'})

        with get_conn() as conn, conn.cursor() as cur:
            if is_dayoff:
                cur.execute(
                    f"""
                    INSERT INTO {SCHEMA}.employee_shifts (employee_id, shift_date, status, started_at)
                    VALUES (%s, %s, 'dayoff', NOW())
                    ON CONFLICT (employee_id, shift_date) DO UPDATE
                    SET status = 'dayoff'
                    WHERE {SCHEMA}.employee_shifts.status != 'closed'
                    """,
                    (emp_id, day),
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.employee_shifts SET status = 'open' "
                    f"WHERE employee_id = %s AND shift_date = %s AND status = 'dayoff'",
                    (emp_id, day),
                )
            conn.commit()
            return resp(200, {'ok': True})

    if action == 'owner_mark_paid' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            log_id = int(body.get('log_id') or 0)
        except (TypeError, ValueError):
            log_id = 0
        if not log_id:
            return resp(400, {'error': 'log_id required'})
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.employee_salary_log "
                f"SET is_paid = true, paid_at = NOW() WHERE id = %s",
                (log_id,),
            )
            conn.commit()
            return resp(200, {'ok': True})

    return resp(404, {'error': 'unknown_action', 'action': action})
