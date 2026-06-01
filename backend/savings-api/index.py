"""
Business: API накоплений и финансовых целей для сотрудника (мастера ремонтов).
          Позволяет создавать цели, пополнять/снимать средства, видеть историю,
          получать умные советы по накоплению на основе заработка.
Args: event - dict с httpMethod, queryStringParameters, body, headers (X-Employee-Token)
      context - объект с request_id
Returns: HTTP-ответ с JSON
"""
import json
import os
from datetime import date, datetime
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


def auth_employee(headers):
    token = None
    if headers:
        for k, v in headers.items():
            if k.lower() == 'x-employee-token':
                token = v
                break
    if not token:
        return None
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT id, role, full_name FROM {SCHEMA}.employees "
            f"WHERE auth_token = %s AND is_active = true "
            f"AND (token_expires_at IS NULL OR token_expires_at > NOW())",
            (token,),
        )
        return cur.fetchone()  # (id, role, full_name)


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    emp = auth_employee(event.get('headers', {}))
    if not emp:
        return resp(401, {'error': 'Unauthorized'})

    emp_id, emp_role, emp_name = emp[0], emp[1], emp[2]

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    # ── ПОЛУЧИТЬ ВСЕ ЦЕЛИ + ОБЩУЮ КОПИЛКУ ──────────────────────────────────
    if action == 'get_goals':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT g.*,
                  COALESCE((SELECT SUM(amount) FROM {SCHEMA}.savings_log
                            WHERE goal_id = g.id AND amount > 0), 0) AS deposited,
                  COALESCE((SELECT SUM(ABS(amount)) FROM {SCHEMA}.savings_log
                            WHERE goal_id = g.id AND amount < 0), 0) AS withdrawn,
                  (SELECT COUNT(*) FROM {SCHEMA}.savings_log WHERE goal_id = g.id) AS tx_count
                FROM {SCHEMA}.savings_goals g
                WHERE g.employee_id = %s
                ORDER BY
                  CASE g.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,
                  g.created_at DESC
                """,
                (emp_id,),
            )
            goals = cur.fetchall()

            # Общая сумма накоплений
            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.savings_log WHERE employee_id = %s",
                (emp_id,),
            )
            total_saved = int(cur.fetchone()[0] or 0)

            # Доход за последние 30 дней (для советов)
            cur.execute(
                f"""
                SELECT COALESCE(SUM(total), 0) AS earned_30d,
                       COUNT(*) AS days_worked
                FROM {SCHEMA}.employee_salary_log
                WHERE employee_id = %s
                  AND shift_date >= (CURRENT_DATE - INTERVAL '30 days')
                """,
                (emp_id,),
            )
            row30 = cur.fetchone()
            earned_30d = int(row30[0] or 0)
            days_worked = int(row30[1] or 0)

            # Последние транзакции
            cur.execute(
                f"""
                SELECT sl.id, sl.amount, sl.note, sl.source, sl.created_at,
                       g.title AS goal_title, g.emoji AS goal_emoji
                FROM {SCHEMA}.savings_log sl
                LEFT JOIN {SCHEMA}.savings_goals g ON g.id = sl.goal_id
                WHERE sl.employee_id = %s
                ORDER BY sl.created_at DESC
                LIMIT 20
                """,
                (emp_id,),
            )
            recent_tx = cur.fetchall()

        return resp(200, {
            'goals': goals,
            'total_saved': total_saved,
            'earned_30d': earned_30d,
            'days_worked': days_worked,
            'recent_tx': recent_tx,
        })

    # ── СОЗДАТЬ ЦЕЛЬ ────────────────────────────────────────────────────────
    if action == 'create_goal':
        title = (body.get('title') or '').strip()
        if not title:
            return resp(400, {'error': 'Нужно название цели'})
        target = int(body.get('target_amount') or 0)
        if target <= 0:
            return resp(400, {'error': 'Сумма должна быть больше 0'})

        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                INSERT INTO {SCHEMA}.savings_goals
                  (employee_id, title, description, target_amount, emoji, color,
                   deadline, auto_save_percent)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    emp_id,
                    title,
                    body.get('description') or None,
                    target,
                    body.get('emoji') or '🎯',
                    body.get('color') or '#FFD700',
                    body.get('deadline') or None,
                    int(body.get('auto_save_percent') or 0),
                ),
            )
            goal_id = cur.fetchone()[0]
            conn.commit()

        return resp(200, {'goal_id': goal_id, 'ok': True})

    # ── ОБНОВИТЬ ЦЕЛЬ ────────────────────────────────────────────────────────
    if action == 'update_goal':
        goal_id = int(body.get('goal_id') or 0)
        if not goal_id:
            return resp(400, {'error': 'goal_id обязателен'})

        with get_conn() as conn, conn.cursor() as cur:
            # Проверяем принадлежность
            cur.execute(
                f"SELECT id FROM {SCHEMA}.savings_goals WHERE id = %s AND employee_id = %s",
                (goal_id, emp_id),
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Цель не найдена'})

            fields, vals = [], []
            for col in ('title', 'description', 'emoji', 'color', 'deadline', 'status'):
                if col in body:
                    fields.append(f"{col} = %s")
                    vals.append(body[col] if body[col] != '' else None)
            for col in ('target_amount', 'auto_save_percent'):
                if col in body:
                    fields.append(f"{col} = %s")
                    vals.append(int(body[col]))
            if not fields:
                return resp(400, {'error': 'Нечего обновлять'})
            fields.append("updated_at = NOW()")
            vals.append(goal_id)
            cur.execute(
                f"UPDATE {SCHEMA}.savings_goals SET {', '.join(fields)} WHERE id = %s",
                vals,
            )
            conn.commit()

        return resp(200, {'ok': True})

    # ── ПОПОЛНИТЬ / СНЯТЬ ────────────────────────────────────────────────────
    if action == 'deposit' or action == 'withdraw':
        goal_id = int(body.get('goal_id') or 0)
        amount = int(body.get('amount') or 0)
        note = (body.get('note') or '').strip() or None

        if goal_id:
            with get_conn() as conn, conn.cursor() as cur:
                cur.execute(
                    f"SELECT id, current_amount, target_amount FROM {SCHEMA}.savings_goals "
                    f"WHERE id = %s AND employee_id = %s",
                    (goal_id, emp_id),
                )
                goal = cur.fetchone()
                if not goal:
                    return resp(403, {'error': 'Цель не найдена'})

                delta = amount if action == 'deposit' else -amount
                new_amount = int(goal[1]) + delta
                if new_amount < 0:
                    return resp(400, {'error': 'Недостаточно средств в цели'})

                cur.execute(
                    f"""
                    INSERT INTO {SCHEMA}.savings_log
                      (employee_id, goal_id, amount, note, source)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (emp_id, goal_id, delta, note, action),
                )
                # Обновляем текущую сумму и статус
                new_status = 'done' if new_amount >= int(goal[2]) and action == 'deposit' else None
                if new_status:
                    cur.execute(
                        f"UPDATE {SCHEMA}.savings_goals SET current_amount = %s, status = 'done', updated_at = NOW() WHERE id = %s",
                        (new_amount, goal_id),
                    )
                else:
                    cur.execute(
                        f"UPDATE {SCHEMA}.savings_goals SET current_amount = %s, updated_at = NOW() WHERE id = %s",
                        (new_amount, goal_id),
                    )
                conn.commit()
                return resp(200, {'ok': True, 'new_amount': new_amount, 'goal_reached': bool(new_status)})

        return resp(400, {'error': 'goal_id обязателен'})

    # ── ИСТОРИЯ ТРАНЗАКЦИЙ ПО ЦЕЛИ ───────────────────────────────────────────
    if action == 'goal_history':
        goal_id = int(params.get('goal_id') or 0)
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.savings_goals WHERE id = %s AND employee_id = %s",
                (goal_id, emp_id),
            )
            if not cur.fetchone():
                return resp(403, {'error': 'Цель не найдена'})
            cur.execute(
                f"""
                SELECT id, amount, note, source, created_at
                FROM {SCHEMA}.savings_log
                WHERE goal_id = %s
                ORDER BY created_at DESC
                """,
                (goal_id,),
            )
            return resp(200, {'history': cur.fetchall()})

    # ── СОВЕТЫ ПО НАКОПЛЕНИЮ ─────────────────────────────────────────────────
    if action == 'get_tips':
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"""
                SELECT COALESCE(SUM(total), 0), COUNT(*)
                FROM {SCHEMA}.employee_salary_log
                WHERE employee_id = %s AND shift_date >= (CURRENT_DATE - INTERVAL '30 days')
                """,
                (emp_id,),
            )
            row = cur.fetchone()
            earned_30d = int(row[0] or 0)
            days_worked = int(row[1] or 0)

            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.savings_log WHERE employee_id = %s",
                (emp_id,),
            )
            total_saved = int(cur.fetchone()[0] or 0)

            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.savings_goals WHERE employee_id = %s AND status = 'active'",
                (emp_id,),
            )
            active_goals = int(cur.fetchone()[0] or 0)

        avg_day = earned_30d // days_worked if days_worked > 0 else 0
        tips = []

        if earned_30d > 0:
            save_10 = int(earned_30d * 0.10)
            save_20 = int(earned_30d * 0.20)
            tips.append({
                'icon': '💡',
                'title': 'Правило 10%',
                'text': f'Откладывай хотя бы 10% от заработка. За последние 30 дней ты заработал {earned_30d:,} ₽ — это {save_10:,} ₽ в копилку. Кажется немного, но за год накопится {save_10 * 12:,} ₽!'.replace(',', ' '),
                'level': 'beginner',
            })
            tips.append({
                'icon': '🚀',
                'title': 'Метод 20%',
                'text': f'Агрессивное накопление: откладывай 20% каждый рабочий день сразу как получил деньги. За месяц это {save_20:,} ₽.'.replace(',', ' '),
                'level': 'advanced',
            })

        if avg_day > 0:
            tips.append({
                'icon': '📅',
                'title': 'Ежедневная привычка',
                'text': f'Твой средний доход за день — {avg_day:,} ₽. Попробуй откладывать фиксированную сумму каждый рабочий день — хотя бы {max(200, avg_day // 10):,} ₽. Это формирует дисциплину.'.replace(',', ' '),
                'level': 'beginner',
            })

        if total_saved > 0:
            tips.append({
                'icon': '🏦',
                'title': 'Ты уже копишь!',
                'text': f'У тебя уже {total_saved:,} ₽ в накоплениях. Не трогай эти деньги — пусть работают на цель. Каждый рубль приближает тебя к мечте.'.replace(',', ' '),
                'level': 'info',
            })
        else:
            tips.append({
                'icon': '🌱',
                'title': 'Начни с малого',
                'text': 'Первый шаг — самый важный. Создай цель и положи туда хотя бы 500 ₽ прямо сейчас. Главное — начать. Через месяц не узнаешь себя.',
                'level': 'beginner',
            })

        if active_goals == 0:
            tips.append({
                'icon': '🎯',
                'title': 'Создай цель',
                'text': 'Деньги без цели тратятся сами. Запиши, на что копишь: телефон, ноутбук, отпуск, подушка безопасности. Конкретная цель мотивирует в 3 раза лучше.',
                'level': 'beginner',
            })

        tips.append({
            'icon': '🛡️',
            'title': 'Подушка безопасности',
            'text': f'Финансовая цель №1 — накопить 3 месячных дохода про запас. При твоём заработке это около {earned_30d * 3:,} ₽. Это защита от любых неожиданностей.'.replace(',', ' '),
            'level': 'important',
        })
        tips.append({
            'icon': '🧠',
            'title': 'Принцип "Заплати себе первым"',
            'text': 'Как только получил деньги — сразу переложи нужную сумму в накопления. Не "сколько останется", а сначала отложи, потом трать остаток. Это меняет всё.',
            'level': 'important',
        })
        tips.append({
            'icon': '📊',
            'title': 'Конверт на расходы',
            'text': 'Раздели доход на 3 части: 50% — на жизнь (еда, транспорт), 30% — на желания, 20% — в накопления. Метод 50/30/20 работает для любого дохода.',
            'level': 'advanced',
        })

        return resp(200, {
            'tips': tips,
            'earned_30d': earned_30d,
            'avg_day': avg_day,
            'total_saved': total_saved,
        })

    # ── ВЛАДЕЛЕЦ: обзор накоплений всех сотрудников ─────────────────────────
    if action == 'owner_savings_overview':
        if emp_role not in ('admin', 'owner'):
            return resp(403, {'error': 'Нет доступа'})
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT e.id, e.full_name, e.position, e.role,
                  COALESCE(sl.total_saved, 0) AS total_saved,
                  COALESCE(goals.active_count, 0) AS active_goals,
                  COALESCE(goals.done_count, 0) AS done_goals,
                  COALESCE(goals.total_target, 0) AS total_target
                FROM {SCHEMA}.employees e
                LEFT JOIN (
                  SELECT employee_id, SUM(amount) AS total_saved
                  FROM {SCHEMA}.savings_log
                  GROUP BY employee_id
                ) sl ON sl.employee_id = e.id
                LEFT JOIN (
                  SELECT employee_id,
                    COUNT(*) FILTER (WHERE status = 'active') AS active_count,
                    COUNT(*) FILTER (WHERE status = 'done') AS done_count,
                    SUM(target_amount) FILTER (WHERE status = 'active') AS total_target
                  FROM {SCHEMA}.savings_goals
                  GROUP BY employee_id
                ) goals ON goals.employee_id = e.id
                WHERE e.is_active = true
                ORDER BY e.full_name
                """,
            )
            employees = cur.fetchall()

            # Итого по всем
            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.savings_log",
            )
            grand_total = int(cur.fetchone()[0] or 0)

        return resp(200, {'employees': employees, 'grand_total': grand_total})

    # ── ВЛАДЕЛЕЦ: цели конкретного сотрудника ────────────────────────────────
    if action == 'owner_employee_goals':
        if emp_role not in ('admin', 'owner'):
            return resp(403, {'error': 'Нет доступа'})
        target_id = int(params.get('employee_id') or 0)
        if not target_id:
            return resp(400, {'error': 'employee_id обязателен'})

        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"""
                SELECT g.*,
                  COALESCE((SELECT SUM(amount) FROM {SCHEMA}.savings_log
                            WHERE goal_id = g.id AND amount > 0), 0) AS deposited,
                  COALESCE((SELECT SUM(ABS(amount)) FROM {SCHEMA}.savings_log
                            WHERE goal_id = g.id AND amount < 0), 0) AS withdrawn,
                  (SELECT COUNT(*) FROM {SCHEMA}.savings_log WHERE goal_id = g.id) AS tx_count
                FROM {SCHEMA}.savings_goals g
                WHERE g.employee_id = %s
                ORDER BY
                  CASE g.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,
                  g.created_at DESC
                """,
                (target_id,),
            )
            goals = cur.fetchall()

            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.savings_log WHERE employee_id = %s",
                (target_id,),
            )
            total_saved = int(cur.fetchone()[0] or 0)

            cur.execute(
                f"""
                SELECT sl.id, sl.amount, sl.note, sl.source, sl.created_at,
                       g.title AS goal_title, g.emoji AS goal_emoji
                FROM {SCHEMA}.savings_log sl
                LEFT JOIN {SCHEMA}.savings_goals g ON g.id = sl.goal_id
                WHERE sl.employee_id = %s
                ORDER BY sl.created_at DESC
                LIMIT 30
                """,
                (target_id,),
            )
            recent_tx = cur.fetchall()

        return resp(200, {'goals': goals, 'total_saved': total_saved, 'recent_tx': recent_tx})

    return resp(400, {'error': f'Неизвестное действие: {action}'})