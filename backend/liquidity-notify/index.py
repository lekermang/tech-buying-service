"""
Запускается по расписанию в 20:50 МСК (17:50 UTC) каждый день.
1. Синхронизирует мою долю с ремонта в liquidity_entries.
2. Отправляет итоговую сводку за день в Telegram.
"""
import json
import os
from datetime import date
import psycopg2
import urllib.request

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p31606708_tech_buying_service")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def tg_send(chat_id: str, text: str):
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not bot_token or not chat_id:
        return
    payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{bot_token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def fmt(n: float) -> str:
    return f"{round(n):,}".replace(",", " ")


def check_auth(event: dict) -> bool:
    token = os.environ.get("ADMIN_TOKEN", "")
    h = event.get("headers", {})
    return h.get("X-Admin-Token") == token or h.get("x-admin-token") == token


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    is_http = bool(event.get("httpMethod"))
    if is_http and not check_auth(event):
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}

    today = date.today().isoformat()

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── 1. Синхронизируем мою долю с ремонта ────────────────────────────
        cur.execute(f"""
            SELECT COALESCE(SUM(
                repair_amount
                - COALESCE(master_income, 0)
                - COALESCE(purchase_amount, 0)
            ), 0)
            FROM {SCHEMA}.repair_orders
            WHERE DATE(completed_at AT TIME ZONE 'Europe/Moscow') = %s
            AND status IN ('ready', 'done', 'picked_up')
            AND repair_amount IS NOT NULL
        """, (today,))
        repair_my = float(cur.fetchone()[0])

        if repair_my > 0:
            cur.execute(f"""
                DELETE FROM {SCHEMA}.liquidity_entries
                WHERE entry_date = %s AND category = 'repair' AND source = 'auto_repair'
            """, (today,))
            cur.execute(f"""
                INSERT INTO {SCHEMA}.liquidity_entries
                    (entry_date, shop, category, amount, comment, source)
                VALUES (%s, 'kirova7', 'repair', %s, 'Авто: моя доля с ремонта', 'auto_repair')
            """, (today, repair_my))
            conn.commit()

        # ── 2. Автоматическое списание аренды по числам ──────────────────────
        # kirova11 — 10-е число, kirova7 — 25-е число
        day_of_month = date.today().day
        rent_schedule = {'kirova11': 10, 'kirova7': 25}
        for shop, rent_day in rent_schedule.items():
            if day_of_month == rent_day:
                # Проверяем, не списали ли уже сегодня
                cur.execute(f"""
                    SELECT COUNT(*) FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date = %s AND shop = %s AND category = 'rent' AND source = 'auto_rent'
                """, (today, shop))
                already = cur.fetchone()[0]
                if not already:
                    cur.execute(f"SELECT amount FROM {SCHEMA}.liquidity_rent WHERE shop = %s", (shop,))
                    rent_row = cur.fetchone()
                    if rent_row and float(rent_row[0]) > 0:
                        rent_amount = float(rent_row[0])
                        label = 'Кирова 7' if shop == 'kirova7' else 'Кирова 11'
                        cur.execute(f"""
                            INSERT INTO {SCHEMA}.liquidity_entries
                                (entry_date, shop, category, amount, comment, source)
                            VALUES (%s, %s, 'rent', %s, %s, 'auto_rent')
                        """, (today, shop, -rent_amount, f'Авто: аренда {label}'))
                        conn.commit()

        # ── 4. Читаем итоги за день ──────────────────────────────────────────
        cur.execute(f"""
            SELECT category, SUM(amount) as total
            FROM {SCHEMA}.liquidity_entries
            WHERE entry_date = %s
            GROUP BY category
        """, (today,))
        cats = {r[0]: float(r[1]) for r in cur.fetchall()}

        cur.execute(f"SELECT grams FROM {SCHEMA}.liquidity_gold_stock LIMIT 1")
        gold_row = cur.fetchone()
        gold_stock = float(gold_row[0]) if gold_row else 0.0

    finally:
        cur.close()
        conn.close()

    # ── 3. Формируем и отправляем сообщение ─────────────────────────────────
    gold_sell   = cats.get("gold_sell", 0)
    gold_buy    = cats.get("gold_buy", 0)
    gold_profit = gold_sell - gold_buy
    repair      = cats.get("repair", 0)
    phone_sale  = cats.get("phone_sale", 0)
    rent        = cats.get("rent", 0)
    other       = cats.get("other_expense", 0)
    total       = gold_profit + repair + phone_sale + rent + other

    d_fmt = date.today().strftime("%d.%m.%Y")
    lines = [f"<b>📊 Итоги дня {d_fmt}</b>\n"]

    if gold_profit != 0:
        sign = "+" if gold_profit >= 0 else ""
        lines.append(f"💛 Золото: {sign}{fmt(gold_profit)} ₽")
        if gold_buy:
            lines.append(f"   ↳ куплено: {fmt(abs(gold_buy))} ₽")
        if gold_sell:
            lines.append(f"   ↳ продано: {fmt(gold_sell)} ₽")

    if repair > 0:
        lines.append(f"🔧 Ремонт (моя доля): +{fmt(repair)} ₽")

    if phone_sale > 0:
        lines.append(f"📱 Телефоны: +{fmt(phone_sale)} ₽")

    if rent < 0:
        lines.append(f"🏠 Аренда: {fmt(rent)} ₽")

    if other < 0:
        lines.append(f"📉 Расходы: {fmt(other)} ₽")

    lines.append("")
    sign = "+" if total >= 0 else ""
    lines.append(f"<b>💰 Итого: {sign}{fmt(total)} ₽</b>")
    lines.append(f"🥇 Золото на складе: {gold_stock:.2f} г")

    if not cats and gold_stock == 0:
        lines = [f"<b>📊 Итоги дня {d_fmt}</b>\n\nЗа сегодня записей не найдено."]

    text = "\n".join(lines)

    chat_id = os.environ.get("PLUXAN4IK_CHAT_ID") or os.environ.get("TELEGRAM_CHAT_ID", "")
    tg_send(chat_id, text)

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "date": today, "repair_synced": repair_my, "total": total}),
    }