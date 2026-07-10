"""
План продаж: факт по ремонту, б/у технике и золоту за день и месяц.
Для владельца — дневная разбивка, прогноз, статус горячих точек.
"""
import os
import json
import calendar
import psycopg2
from datetime import date, timedelta

SCHEMA = "t_p31606708_tech_buying_service"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Employee-Token",
}

DAILY_MIN_REVENUE  = 30_000
DAILY_BREAK_EVEN   = 10_000
DAILY_MIN_PURCHASE = 40_000
DAILY_MIN_SALES    = 60_000
MONTHLY_DAYS       = 30
HOT_ALERT_DAYS     = 5   # за сколько дней до точки показывать баннер

HOT_POINTS = [
    {"day": 4,  "label": "Дебиторка",   "amount": 25_000,  "color": "orange"},
    {"day": 10, "label": "Аренда + ЗП", "amount": 180_000, "color": "red"},
    {"day": 25, "label": "Аренда",      "amount": 95_000,  "color": "red"},
]


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_employee(cur, token):
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

    is_owner = emp["role"] == "owner"
    today      = date.today()
    month_from = today.replace(day=1)
    day_num    = today.day

    # ── Ремонт сегодня и за месяц ───────────────────────────────
    cur.execute(f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE((picked_up_at + interval '3 hours')) = %s THEN repair_amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE((picked_up_at + interval '3 hours')) >= %s THEN repair_amount ELSE 0 END), 0)
        FROM {SCHEMA}.repair_orders
        WHERE status='выдан' AND repair_amount IS NOT NULL
    """, (today, month_from))
    r = cur.fetchone()
    repair_today, repair_month = int(r[0]), int(r[1])

    # ── Продажи б/у сегодня и за месяц ──────────────────────────
    cur.execute(f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE((created_at + interval '3 hours')) = %s THEN amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE((created_at + interval '3 hours')) >= %s THEN amount ELSE 0 END), 0)
        FROM {SCHEMA}.slshop_cash_movements
        WHERE category='Продажа товара' AND direction='in'
    """, (today, month_from))
    r = cur.fetchone()
    sales_today, sales_month = int(r[0]), int(r[1])

    # ── Закупки б/у сегодня и за месяц ──────────────────────────
    cur.execute(f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE((created_at + interval '3 hours')) = %s THEN amount ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE((created_at + interval '3 hours')) >= %s THEN amount ELSE 0 END), 0)
        FROM {SCHEMA}.slshop_cash_movements
        WHERE category='Скупка товара' AND direction='out'
    """, (today, month_from))
    r = cur.fetchone()
    purchase_today, purchase_month = int(r[0]), int(r[1])

    # ── Золото сегодня и за месяц ────────────────────────────────
    cur.execute(f"""
        SELECT
          COALESCE(SUM(CASE WHEN DATE((completed_at + interval '3 hours')) = %s THEN sell_price ELSE 0 END), 0),
          COALESCE(SUM(CASE WHEN DATE((completed_at + interval '3 hours')) >= %s THEN sell_price ELSE 0 END), 0)
        FROM {SCHEMA}.gold_orders
        WHERE status='done' AND sell_price IS NOT NULL
    """, (today, month_from))
    r = cur.fetchone()
    gold_today, gold_month = int(r[0]), int(r[1])

    # ── Дневная разбивка для владельца (каждый день текущего месяца) ──
    daily_chart = []
    if is_owner:
        cur.execute(f"""
            SELECT DATE((picked_up_at + interval '3 hours')) as d,
                   COALESCE(SUM(repair_amount), 0)
            FROM {SCHEMA}.repair_orders
            WHERE status='выдан' AND repair_amount IS NOT NULL
              AND DATE((picked_up_at + interval '3 hours')) >= %s
            GROUP BY d
        """, (month_from,))
        repair_by_day = {str(row[0]): int(row[1]) for row in cur.fetchall()}

        cur.execute(f"""
            SELECT DATE((created_at + interval '3 hours')) as d,
                   COALESCE(SUM(amount), 0)
            FROM {SCHEMA}.slshop_cash_movements
            WHERE category='Продажа товара' AND direction='in'
              AND DATE((created_at + interval '3 hours')) >= %s
            GROUP BY d
        """, (month_from,))
        sales_by_day = {str(row[0]): int(row[1]) for row in cur.fetchall()}

        cur.execute(f"""
            SELECT DATE((completed_at + interval '3 hours')) as d,
                   COALESCE(SUM(sell_price), 0)
            FROM {SCHEMA}.gold_orders
            WHERE status='done' AND sell_price IS NOT NULL
              AND DATE((completed_at + interval '3 hours')) >= %s
            GROUP BY d
        """, (month_from,))
        gold_by_day = {str(row[0]): int(row[1]) for row in cur.fetchall()}

        for i in range(1, day_num + 1):
            d = str(month_from.replace(day=i))
            r_val = repair_by_day.get(d, 0)
            s_val = sales_by_day.get(d, 0)
            g_val = gold_by_day.get(d, 0)
            daily_chart.append({
                "day": i,
                "date": d,
                "repair": r_val,
                "sales":  s_val,
                "gold":   g_val,
                "total":  r_val + s_val + g_val,
                "plan":   DAILY_MIN_REVENUE,
            })

    cur.close(); conn.close()

    # ── Агрегация ────────────────────────────────────────────────
    total_today = repair_today + sales_today + gold_today
    total_month = repair_month + sales_month + gold_month

    day_pct     = min(round(total_today / DAILY_MIN_REVENUE * 100), 999)
    monthly_target = DAILY_MIN_REVENUE * MONTHLY_DAYS
    month_pct   = min(round(total_month / monthly_target * 100), 999)
    forecast    = round(total_month / day_num * MONTHLY_DAYS) if day_num else 0

    # ── Горячие точки ────────────────────────────────────────────
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    upcoming_hot  = []
    for hp in HOT_POINTS:
        hp_day = hp["day"]
        if hp_day >= day_num:
            days_left = hp_day - day_num
        else:
            days_left = (days_in_month - day_num) + hp_day

        # нужно ли показывать баннер: план не выполнен И точка ≤ 5 дней
        needed       = hp["amount"]
        gap          = needed - total_month   # сколько не хватает к точке
        show_alert   = days_left <= HOT_ALERT_DAYS and gap > 0
        # накоплено нарастающим итогом до дня точки (для владельца)
        accumulated  = total_month

        upcoming_hot.append({
            **hp,
            "days_left":   days_left,
            "is_today":    days_left == 0,
            "show_alert":  show_alert,
            "gap":         max(gap, 0),
            "covered":     accumulated >= needed,
        })

    upcoming_hot.sort(key=lambda x: x["days_left"])

    result = {
        "today":   today.isoformat(),
        "day_num": day_num,

        "day": {
            "repair": repair_today,
            "sales":  sales_today,
            "gold":   gold_today,
            "total":  total_today,
            "target": DAILY_MIN_REVENUE,
            "pct":    day_pct,
            "status": "danger"  if total_today < DAILY_BREAK_EVEN
                      else "warning" if total_today < DAILY_MIN_REVENUE
                      else "ok",
        },

        "month": {
            "repair":        repair_month,
            "sales":         sales_month,
            "gold":          gold_month,
            "purchase":      purchase_month,
            "total":         total_month,
            "target":        monthly_target,
            "pct":           month_pct,
            "forecast":      forecast,
            "days_passed":   day_num,
        },

        "norms": {
            "purchase_today": purchase_today,
            "purchase_min":   DAILY_MIN_PURCHASE,
            "purchase_ok":    purchase_today >= DAILY_MIN_PURCHASE,
            "sales_today":    sales_today,
            "sales_min":      DAILY_MIN_SALES,
            "sales_ok":       sales_today >= DAILY_MIN_SALES,
        },

        "hot_points":  upcoming_hot,
        "daily_chart": daily_chart,  # только для owner
    }

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(result, ensure_ascii=False),
    }
