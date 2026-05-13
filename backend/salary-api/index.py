"""
Business: API зарплат. Владелец полностью управляет: сам проставляет дни (часы, ставку,
         бонус), отмечает выходные, фиксирует выплаты на конкретную дату.
         Сотрудник видит только: свою ставку, % с продаж, дневной доход, общий доход,
         сколько уже выплачено и остаток. Сотрудник НЕ закрывает смены сам.
         Прибыль для авто-бонуса берётся из Смарт-Ломбарда (slshop_operations + slshop_items).
Args: event - dict с httpMethod, queryStringParameters, body, headers (X-Employee-Token)
      context - объект с request_id, function_name
Returns: HTTP-ответ с JSON
"""
import json
import os
from datetime import date
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
    if not token:
        return None
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT id, role, full_name, auth_token FROM {SCHEMA}.employees "
            f"WHERE auth_token = %s AND is_active = true "
            f"AND (token_expires_at IS NULL OR token_expires_at > NOW())",
            (token,),
        )
        row = cur.fetchone()
    return row  # (id, role, full_name, auth_token)


def calc_slshop_profit_for_day(cur, employee_token, day):
    """Прибыль за день из Смарт-Ломбарда: SUM(op.amount - item.buy_price) для op_type='sale'
    где employee_token совпадает и created_at в этом дне."""
    if not employee_token:
        return 0
    cur.execute(
        f"""
        SELECT COALESCE(SUM(op.amount - COALESCE(i.buy_price, 0)), 0) AS profit
        FROM {SCHEMA}.slshop_operations op
        LEFT JOIN {SCHEMA}.slshop_items i ON i.id = op.item_id
        WHERE op.op_type = 'sale'
          AND op.employee_token = %s
          AND op.created_at::date = %s
        """,
        (employee_token, day),
    )
    return int(cur.fetchone()[0] or 0)


def ensure_shift(cur, employee_id, day, status='closed'):
    """Создаёт или обновляет запись смены на конкретный день. Возвращает id смены."""
    cur.execute(
        f"""
        INSERT INTO {SCHEMA}.employee_shifts (employee_id, shift_date, status, started_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (employee_id, shift_date) DO UPDATE
        SET status = EXCLUDED.status
        RETURNING id
        """,
        (employee_id, day, status),
    )
    return cur.fetchone()[0]


def handler(event, context):
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return resp(200, {})

    headers = event.get('headers') or {}
    token = get_header(headers, 'X-Employee-Token')
    user = auth_employee(token)
    if not user:
        return resp(401, {'error': 'unauthorized'})
    user_id, role, full_name, user_token = user

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # =====================================================
    # СОТРУДНИК: только просмотр
    # =====================================================
    if action == 'my_today':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            today = date.today()
            cur.execute(
                f"SELECT daily_rate, bonus_percent FROM {SCHEMA}.employee_salary_config "
                f"WHERE employee_id = %s",
                (user_id,),
            )
            cfg = cur.fetchone() or {'daily_rate': 2000, 'bonus_percent': 3.0}

            # Запись на сегодня (если владелец уже её проставил)
            cur.execute(
                f"SELECT total FROM {SCHEMA}.employee_salary_log "
                f"WHERE employee_id = %s AND shift_date = %s",
                (user_id, today),
            )
            r = cur.fetchone()
            today_total = r['total'] if r else None

            # Общий итог: начислено, выплачено (через payouts), остаток
            cur.execute(
                f"SELECT COALESCE(SUM(total), 0) AS total_earned "
                f"FROM {SCHEMA}.employee_salary_log WHERE employee_id = %s",
                (user_id,),
            )
            total_earned = int(cur.fetchone()['total_earned'] or 0)

            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) AS total_paid "
                f"FROM {SCHEMA}.employee_payouts WHERE employee_id = %s",
                (user_id,),
            )
            total_paid = int(cur.fetchone()['total_paid'] or 0)

            return resp(200, {
                'employee': {'id': user_id, 'name': full_name},
                'config': {
                    'daily_rate': cfg['daily_rate'],
                    'bonus_percent': float(cfg['bonus_percent']),
                },
                'today_total': today_total,
                'total_earned': total_earned,
                'total_paid': total_paid,
                'remaining': total_earned - total_paid,
            })

    if action == 'my_history':
        # Сотрудник видит дневные начисления (без расчёта прибыли) + выплаты
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT shift_date, hours_worked, total
                FROM {SCHEMA}.employee_salary_log
                WHERE employee_id = %s
                ORDER BY shift_date DESC LIMIT 90
                """,
                (user_id,),
            )
            days = cur.fetchall()

            cur.execute(
                f"""
                SELECT id, payout_date, amount, note
                FROM {SCHEMA}.employee_payouts
                WHERE employee_id = %s
                ORDER BY payout_date DESC LIMIT 90
                """,
                (user_id,),
            )
            payouts = cur.fetchall()
            return resp(200, {'days': days, 'payouts': payouts})

    # =====================================================
    # ВЛАДЕЛЕЦ
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
                  COALESCE((SELECT SUM(total) FROM {SCHEMA}.employee_salary_log
                            WHERE employee_id = e.id), 0)
                  - COALESCE((SELECT SUM(amount) FROM {SCHEMA}.employee_payouts
                              WHERE employee_id = e.id), 0) AS unpaid_total
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
        cal_from = params.get('from')
        cal_to = params.get('to')
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # История начислений (за выбранный диапазон если задан, иначе все)
            if cal_from and cal_to:
                cur.execute(
                    f"""
                    SELECT id, shift_date, hours_worked, base_rate, personal_profit,
                           bonus_percent_at_time, bonus_amount, total, owner_set, created_at
                    FROM {SCHEMA}.employee_salary_log
                    WHERE employee_id = %s AND shift_date >= %s AND shift_date <= %s
                    ORDER BY shift_date DESC
                    """,
                    (emp_id, cal_from, cal_to),
                )
            else:
                cur.execute(
                    f"""
                    SELECT id, shift_date, hours_worked, base_rate, personal_profit,
                           bonus_percent_at_time, bonus_amount, total, owner_set, created_at
                    FROM {SCHEMA}.employee_salary_log
                    WHERE employee_id = %s
                    ORDER BY shift_date DESC LIMIT 365
                    """,
                    (emp_id,),
                )
            history = cur.fetchall()

            # Календарь (все смены за период или последние 30 дней)
            if cal_from and cal_to:
                cur.execute(
                    f"""
                    SELECT shift_date, status FROM {SCHEMA}.employee_shifts
                    WHERE employee_id = %s AND shift_date >= %s AND shift_date <= %s
                    ORDER BY shift_date DESC
                    """,
                    (emp_id, cal_from, cal_to),
                )
            else:
                cur.execute(
                    f"""
                    SELECT shift_date, status FROM {SCHEMA}.employee_shifts
                    WHERE employee_id = %s AND shift_date >= CURRENT_DATE - INTERVAL '30 days'
                    ORDER BY shift_date DESC
                    """,
                    (emp_id,),
                )
            calendar = cur.fetchall()

            # Выплаты за тот же период (или все)
            if cal_from and cal_to:
                cur.execute(
                    f"""
                    SELECT id, payout_date, amount, note, created_at
                    FROM {SCHEMA}.employee_payouts
                    WHERE employee_id = %s AND payout_date >= %s AND payout_date <= %s
                    ORDER BY payout_date DESC
                    """,
                    (emp_id, cal_from, cal_to),
                )
            else:
                cur.execute(
                    f"""
                    SELECT id, payout_date, amount, note, created_at
                    FROM {SCHEMA}.employee_payouts
                    WHERE employee_id = %s
                    ORDER BY payout_date DESC LIMIT 365
                    """,
                    (emp_id,),
                )
            payouts = cur.fetchall()

            # Сводка общая
            cur.execute(
                f"SELECT COALESCE(SUM(total), 0) AS s FROM {SCHEMA}.employee_salary_log WHERE employee_id = %s",
                (emp_id,),
            )
            total_all = int(cur.fetchone()['s'] or 0)
            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) AS s FROM {SCHEMA}.employee_payouts WHERE employee_id = %s",
                (emp_id,),
            )
            total_paid = int(cur.fetchone()['s'] or 0)

            summary = {
                'total_all': total_all,
                'total_paid': total_paid,
                'total_unpaid': total_all - total_paid,
            }
            return resp(200, {
                'history': history,
                'calendar': calendar,
                'payouts': payouts,
                'summary': summary,
            })

    if action == 'owner_set_day' and method == 'POST':
        # Владелец вписывает начисление за конкретный день: часы + сумма (или авто-расчёт)
        body = json.loads(event.get('body') or '{}')
        try:
            emp_id = int(body.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        day = body.get('date')
        if not emp_id or not day:
            return resp(400, {'error': 'employee_id and date required'})

        hours = Decimal(str(body.get('hours_worked', 0) or 0))
        base_rate = int(body.get('base_rate', 0) or 0)
        # bonus: либо явно передан, либо auto=true → берём из Смарт-Ломбарда
        auto_bonus = bool(body.get('auto_bonus', False))
        bonus_amount = int(body.get('bonus_amount', 0) or 0)
        personal_profit = int(body.get('personal_profit', 0) or 0)

        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Конфиг для % по умолчанию
            cur.execute(
                f"SELECT daily_rate, bonus_percent FROM {SCHEMA}.employee_salary_config "
                f"WHERE employee_id = %s",
                (emp_id,),
            )
            cfg = cur.fetchone() or {'daily_rate': 2000, 'bonus_percent': Decimal('3.0')}
            percent = Decimal(str(cfg['bonus_percent']))

            # Токен сотрудника для расчёта slshop-прибыли
            cur.execute(f"SELECT auth_token FROM {SCHEMA}.employees WHERE id = %s", (emp_id,))
            emp_token_row = cur.fetchone()
            emp_token = emp_token_row['auth_token'] if emp_token_row else None

            if auto_bonus:
                personal_profit = calc_slshop_profit_for_day(cur, emp_token, day)
                bonus_amount = int(Decimal(personal_profit) * percent / Decimal(100))

            total = base_rate + bonus_amount

            # Создаём смену (status=closed для рабочего дня)
            shift_id = ensure_shift(cur, emp_id, day, status='closed')

            # UPSERT в лог по (employee_id, shift_date)
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.employee_salary_log
                  (shift_id, employee_id, shift_date, hours_worked, base_rate,
                   personal_profit, bonus_percent_at_time, bonus_amount, total,
                   is_paid, owner_set)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, false, true)
                ON CONFLICT (employee_id, shift_date) DO UPDATE
                SET hours_worked = EXCLUDED.hours_worked,
                    base_rate = EXCLUDED.base_rate,
                    personal_profit = EXCLUDED.personal_profit,
                    bonus_percent_at_time = EXCLUDED.bonus_percent_at_time,
                    bonus_amount = EXCLUDED.bonus_amount,
                    total = EXCLUDED.total,
                    owner_set = true,
                    shift_id = EXCLUDED.shift_id
                """,
                (shift_id, emp_id, day, hours, base_rate, personal_profit, percent,
                 bonus_amount, total),
            )
            conn.commit()
            return resp(200, {
                'ok': True,
                'total': total,
                'bonus_amount': bonus_amount,
                'personal_profit': personal_profit,
            })

    if action == 'owner_delete_day' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            emp_id = int(body.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        day = body.get('date')
        if not emp_id or not day:
            return resp(400, {'error': 'employee_id and date required'})
        with get_conn() as conn, conn.cursor() as cur:
            # Обнуляем запись лога (нельзя удалять данные)
            cur.execute(
                f"""
                UPDATE {SCHEMA}.employee_salary_log
                SET hours_worked = 0, base_rate = 0, personal_profit = 0,
                    bonus_amount = 0, total = 0, owner_set = true
                WHERE employee_id = %s AND shift_date = %s
                """,
                (emp_id, day),
            )
            conn.commit()
            return resp(200, {'ok': True})

    if action == 'owner_set_dayoff' and method == 'POST':
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
                # Обнуляем начисление, если было
                cur.execute(
                    f"""
                    UPDATE {SCHEMA}.employee_salary_log
                    SET hours_worked = 0, base_rate = 0, personal_profit = 0,
                        bonus_amount = 0, total = 0
                    WHERE employee_id = %s AND shift_date = %s
                    """,
                    (emp_id, day),
                )
                cur.execute(
                    f"""
                    INSERT INTO {SCHEMA}.employee_shifts (employee_id, shift_date, status, started_at)
                    VALUES (%s, %s, 'dayoff', NOW())
                    ON CONFLICT (employee_id, shift_date) DO UPDATE
                    SET status = 'dayoff'
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

    if action == 'owner_add_payout' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            emp_id = int(body.get('employee_id') or 0)
        except (TypeError, ValueError):
            emp_id = 0
        day = body.get('date')
        try:
            amount = int(body.get('amount') or 0)
        except (TypeError, ValueError):
            amount = 0
        note = body.get('note') or None
        if not emp_id or not day or amount <= 0:
            return resp(400, {'error': 'employee_id, date and positive amount required'})
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.employee_payouts
                  (employee_id, payout_date, amount, note, created_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (emp_id, day, amount, note, user_id),
            )
            payout_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {'ok': True, 'payout_id': payout_id})

    if action == 'owner_delete_payout' and method == 'POST':
        body = json.loads(event.get('body') or '{}')
        try:
            payout_id = int(body.get('payout_id') or 0)
        except (TypeError, ValueError):
            payout_id = 0
        if not payout_id:
            return resp(400, {'error': 'payout_id required'})
        with get_conn() as conn, conn.cursor() as cur:
            # Обнуляем сумму вместо удаления (DELETE заблокирован политикой)
            cur.execute(
                f"UPDATE {SCHEMA}.employee_payouts SET amount = 0, note = COALESCE(note,'') || ' [отменено]' "
                f"WHERE id = %s",
                (payout_id,),
            )
            conn.commit()
            return resp(200, {'ok': True})

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

    return resp(404, {'error': 'unknown_action', 'action': action})
