"""
Возвращает план продаж на день и месяц: факт по ремонту, б/у технике и золоту,
горячие точки (аренда, зарплата, долг), прогресс к дневной и месячной цели.
"""
import os
import json
import psycopg2
from datetime import date, datetime

SCHEMA = "t_p31606708_tech_buying_service"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Employee-Token",
}

# ── Константы плана ──────────────────────────────────────────────
DAILY_MIN_REVENUE   = 30_000   # минимум выручки в день (магазин в 0)
DAILY_BREAK_EVEN    = 10_000   # ниже этого — убыток
DAILY_MIN_PURCHASE  = 40_000   # минимум закупки б/у
DAILY_MIN_SALES     = 60_000   # минимум продаж б/у

MONTHLY_DAYS        = 30

# Горячие точки: (день_месяца, метка, сумма, описание, цвет)
HOT_POINTS = [
    {"day": 4,  "label": "Дебиторка",    "amount": 25_000,  "desc": "Гасить дебиторскую задолженность",   "color": "orange"},
    {"day": 10, "label": "Аренда + ЗП",  "amount": 180_000, "desc": "Аренда 120 000 + ЗП сотрудника 60 000 + 10% с продаж", "color": "red"},
    {"day": 25, "label": "Аренда",       "amount": 95_000,  "desc": "Аренда второго помещения",           "color": "red"},
]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_employee(cur, token: str):
    cur.execute(
        f"SELECT id, role FROM {SCHEMA}.employees "
        "WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,),
    )
    row = cur.fetchone()
    return {"id": row[0], "role": row[1]} if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = event.get("headers", {}).get("X-Employee-Token", "")
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no token"})}

    conn = get_db()
    cur  = conn.cursor()

    emp = get_employee(cur, token)
    if not emp:
        cur.close(); conn.close()
        return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    today      = date.today()
    month_from = today.replace(day=1)
    day_num    = today.day

    # ── Ремонт: выданные заказы сегодня и за месяц ──────────────
    cur.execute(
        f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE(picked_up_at AT TIME ZONE 'Europe/Moscow') = %s THEN repair_amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE(picked_up_at AT TIME ZONE 'Europe/Moscow') >= %s THEN repair_amount ELSE 0 END), 0)
        FROM {SCHEMA}.repair_orders
        WHERE status='выдан' AND repair_amount IS NOT NULL
        """,
        (today, month_from),
    )
    r = cur.fetchone()
    repair_today, repair_month = int(r[0]), int(r[1])

    # ── Б/у техника: продажи (Продажа товара) ───────────────────
    cur.execute(
        f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'Europe/Moscow') = %s THEN amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'Europe/Moscow') >= %s THEN amount ELSE 0 END), 0)
        FROM {SCHEMA}.slshop_cash_movements
        WHERE category='Продажа товара' AND direction='in'
        """,
        (today, month_from),
    )
    r = cur.fetchone()
    sales_today, sales_month = int(r[0]), int(r[1])

    # ── Б/у техника: закупки (Скупка товара) ────────────────────
    cur.execute(
        f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'Europe/Moscow') = %s THEN amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE(created_at AT TIME ZONE 'Europe/Moscow') >= %s THEN amount ELSE 0 END), 0)
        FROM {SCHEMA}.slshop_cash_movements
        WHERE category='Скупка товара' AND direction='out'
        """,
        (today, month_from),
    )
    r = cur.fetchone()
    purchase_today, purchase_month = int(r[0]), int(r[1])

    # ── Золото: продажи ──────────────────────────────────────────
    cur.execute(
        f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE(completed_at AT TIME ZONE 'Europe/Moscow') = %s THEN sell_price ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE(completed_at AT TIME ZONE 'Europe/Moscow') >= %s THEN sell_price ELSE 0 END), 0)
        FROM {SCHEMA}.gold_orders
        WHERE status='done' AND sell_price IS NOT NULL
        """,
        (today, month_from),
    )
    r = cur.fetchone()
    gold_today, gold_month = int(r[0]), int(r[1])

    cur.close(); conn.close()

    # ── Агрегация ────────────────────────────────────────────────
    total_today = repair_today + sales_today + gold_today
    total_month = repair_month + sales_month + gold_month

    # Дневной прогресс к минимуму 30 000
    day_pct = min(round(total_today / DAILY_MIN_REVENUE * 100), 999)

    # Месячный прогресс (30 дней × 30 000)
    monthly_target = DAILY_MIN_REVENUE * MONTHLY_DAYS
    month_pct      = min(round(total_month / monthly_target * 100), 999)

    # Ожидаемый месячный факт по темпу (дней прошло)
    days_passed    = day_num
    expected_pace  = round(total_month / days_passed * MONTHLY_DAYS) if days_passed else 0

    # Горячие точки — ближайшие 10 дней
    upcoming_hot = []
    for hp in HOT_POINTS:
        hp_day = hp["day"]
        # текущий или следующий месяц
        if hp_day >= day_num:
            days_left = hp_day - day_num
        else:
            # уже прошло в этом месяце — следующий месяц
            import calendar
            days_in_month = calendar.monthrange(today.year, today.month)[1]
            days_left = (days_in_month - day_num) + hp_day
        upcoming_hot.append({**hp, "days_left": days_left, "is_today": days_left == 0})

    upcoming_hot.sort(key=lambda x: x["days_left"])

    result = {
        "today": today.isoformat(),
        "day_num": day_num,

        # Дневной факт
        "day": {
            "repair":   repair_today,
            "sales":    sales_today,
            "gold":     gold_today,
            "total":    total_today,
            "target":   DAILY_MIN_REVENUE,
            "pct":      day_pct,
            "status":   "danger" if total_today < DAILY_BREAK_EVEN
                        else "warning" if total_today < DAILY_MIN_REVENUE
                        else "ok",
        },

        # Месячный факт
        "month": {
            "repair":        repair_month,
            "sales":         sales_month,
            "gold":          gold_month,
            "purchase":      purchase_month,
            "total":         total_month,
            "target":        monthly_target,
            "pct":           month_pct,
            "expected_pace": expected_pace,
            "days_passed":   days_passed,
        },

        # Дневные нормы закупки/продаж б/у
        "norms": {
            "purchase_today": purchase_today,
            "purchase_min":   DAILY_MIN_PURCHASE,
            "purchase_ok":    purchase_today >= DAILY_MIN_PURCHASE,
            "sales_today":    sales_today,
            "sales_min":      DAILY_MIN_SALES,
            "sales_ok":       sales_today >= DAILY_MIN_SALES,
        },

        # Горячие точки
        "hot_points": upcoming_hot,
    }

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(result, ensure_ascii=False),
    }
