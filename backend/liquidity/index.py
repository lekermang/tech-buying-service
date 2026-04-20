"""
Учёт ликвидности: золото, ремонт, продажи телефонов, аренда.
Два магазина: kirova7 (Кирова 7), kirova11 (Кирова 11).
"""
import json
import os
from datetime import date, datetime, timedelta
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p31606708_tech_buying_service")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg: str, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def check_auth(event: dict) -> bool:
    token = os.environ.get("ADMIN_TOKEN", "")
    h = event.get("headers", {})
    return h.get("X-Admin-Token") == token or h.get("x-admin-token") == token


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if not check_auth(event):
        return err("Unauthorized", 401)

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    action = params.get("action") or body.get("action", "")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── GET: аналитика / данные ──────────────────────────────────────────
        if method == "GET":

            # Сводка за сегодня
            if action == "today":
                today = date.today().isoformat()
                cur.execute(f"""
                    SELECT category, SUM(amount) as total
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date = %s
                    GROUP BY category
                """, (today,))
                rows = cur.fetchall()
                by_cat = {r[0]: float(r[1]) for r in rows}

                # Остаток золота
                cur.execute(f"SELECT grams FROM {SCHEMA}.liquidity_gold_stock LIMIT 1")
                gold_row = cur.fetchone()
                gold_stock = float(gold_row[0]) if gold_row else 0.0

                return ok({
                    "date": today,
                    "gold_profit": by_cat.get("gold_sell", 0) - by_cat.get("gold_buy", 0),
                    "gold_buy": by_cat.get("gold_buy", 0),
                    "gold_sell": by_cat.get("gold_sell", 0),
                    "repair_profit": by_cat.get("repair", 0),
                    "phone_profit": by_cat.get("phone_sale", 0),
                    "rent_expense": abs(by_cat.get("rent", 0)),
                    "other_expense": abs(by_cat.get("other_expense", 0)),
                    "total": sum(by_cat.values()),
                    "gold_stock_grams": gold_stock,
                })

            # Аналитика за период
            if action == "analytics":
                period = params.get("period", "week")
                date_from = params.get("date_from")
                date_to = params.get("date_to")

                today = date.today()
                if date_from and date_to:
                    d_from = date_from
                    d_to = date_to
                elif period == "day":
                    d_from = d_to = today.isoformat()
                elif period == "week":
                    d_from = (today - timedelta(days=6)).isoformat()
                    d_to = today.isoformat()
                elif period == "month":
                    d_from = (today - timedelta(days=29)).isoformat()
                    d_to = today.isoformat()
                else:
                    d_from = (today - timedelta(days=6)).isoformat()
                    d_to = today.isoformat()

                # Итого по категориям
                cur.execute(f"""
                    SELECT category, shop, SUM(amount) as total
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date BETWEEN %s AND %s
                    GROUP BY category, shop
                    ORDER BY category, shop
                """, (d_from, d_to))
                rows = cur.fetchall()

                totals = {}
                by_shop = {"kirova7": {}, "kirova11": {}}
                for cat, shop, total in rows:
                    totals[cat] = totals.get(cat, 0) + float(total)
                    by_shop[shop][cat] = float(total)

                # По дням
                cur.execute(f"""
                    SELECT entry_date, category, SUM(amount) as total
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date BETWEEN %s AND %s
                    GROUP BY entry_date, category
                    ORDER BY entry_date
                """, (d_from, d_to))
                daily_rows = cur.fetchall()
                daily = {}
                for entry_date, cat, total in daily_rows:
                    ds = str(entry_date)
                    if ds not in daily:
                        daily[ds] = {}
                    daily[ds][cat] = float(total)

                daily_list = [{"date": d, **v} for d, v in sorted(daily.items())]

                return ok({
                    "period": period,
                    "date_from": d_from,
                    "date_to": d_to,
                    "totals": totals,
                    "by_shop": by_shop,
                    "daily": daily_list,
                    "total_income": sum(v for v in totals.values() if v > 0),
                    "total_expense": abs(sum(v for v in totals.values() if v < 0)),
                    "net_profit": sum(totals.values()),
                })

            # Список записей
            if action == "entries":
                d_from = params.get("date_from", (date.today() - timedelta(days=6)).isoformat())
                d_to = params.get("date_to", date.today().isoformat())
                shop = params.get("shop")
                cat = params.get("category")

                q = f"""
                    SELECT id, entry_date, shop, category, amount, comment, gold_grams, gold_price_per_gram, source, created_at
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date BETWEEN %s AND %s
                """
                args = [d_from, d_to]
                if shop:
                    q += " AND shop = %s"; args.append(shop)
                if cat:
                    q += " AND category = %s"; args.append(cat)
                q += " ORDER BY created_at DESC LIMIT 200"

                cur.execute(q, args)
                cols = ["id", "entry_date", "shop", "category", "amount", "comment", "gold_grams", "gold_price_per_gram", "source", "created_at"]
                entries = [dict(zip(cols, r)) for r in cur.fetchall()]
                return ok({"entries": entries})

            # Настройки аренды
            if action == "rent_settings":
                cur.execute(f"SELECT shop, amount, day_of_month FROM {SCHEMA}.liquidity_rent")
                rows = cur.fetchall()
                rent = {r[0]: {"amount": float(r[1]), "day_of_month": r[2]} for r in rows}
                return ok({"rent": rent})

            # Остаток золота
            if action == "gold_stock":
                cur.execute(f"SELECT grams, updated_at FROM {SCHEMA}.liquidity_gold_stock LIMIT 1")
                r = cur.fetchone()
                return ok({"grams": float(r[0]) if r else 0, "updated_at": str(r[1]) if r else None})

            # Данные за сегодня + аналитика за неделю (dashboard)
            if action == "dashboard" or not action:
                today = date.today().isoformat()
                week_from = (date.today() - timedelta(days=6)).isoformat()

                cur.execute(f"""
                    SELECT category, SUM(amount) as total
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date = %s
                    GROUP BY category
                """, (today,))
                today_rows = cur.fetchall()
                today_cats = {r[0]: float(r[1]) for r in today_rows}

                cur.execute(f"""
                    SELECT entry_date, category, SUM(amount) as total
                    FROM {SCHEMA}.liquidity_entries
                    WHERE entry_date BETWEEN %s AND %s
                    GROUP BY entry_date, category
                    ORDER BY entry_date
                """, (week_from, today))
                week_rows = cur.fetchall()
                daily = {}
                for entry_date, cat, total in week_rows:
                    ds = str(entry_date)
                    if ds not in daily:
                        daily[ds] = {}
                    daily[ds][cat] = float(total)

                cur.execute(f"SELECT grams FROM {SCHEMA}.liquidity_gold_stock LIMIT 1")
                gold_row = cur.fetchone()

                cur.execute(f"SELECT shop, amount, day_of_month FROM {SCHEMA}.liquidity_rent")
                rent_rows = cur.fetchall()
                rent = {r[0]: {"amount": float(r[1]), "day_of_month": r[2]} for r in rent_rows}

                return ok({
                    "today": {
                        "date": today,
                        "gold_buy": today_cats.get("gold_buy", 0),
                        "gold_sell": today_cats.get("gold_sell", 0),
                        "repair": today_cats.get("repair", 0),
                        "phone_sale": today_cats.get("phone_sale", 0),
                        "rent": today_cats.get("rent", 0),
                        "other_expense": today_cats.get("other_expense", 0),
                        "total": sum(today_cats.values()),
                    },
                    "weekly_daily": [{"date": d, **v} for d, v in sorted(daily.items())],
                    "gold_stock_grams": float(gold_row[0]) if gold_row else 0.0,
                    "rent": rent,
                })

        # ── POST: создать запись / обновить настройки ─────────────────────────
        if method == "POST":

            # Добавить запись о покупке золота
            if action == "add_gold_buy":
                grams = float(body.get("grams", 0))
                price_per_gram = float(body.get("price_per_gram", 0))
                shop = body.get("shop", "kirova7")
                entry_date = body.get("date", date.today().isoformat())
                comment = body.get("comment", "")
                total = grams * price_per_gram

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.liquidity_entries
                        (entry_date, shop, category, amount, comment, gold_grams, gold_price_per_gram, source)
                    VALUES (%s, %s, 'gold_buy', %s, %s, %s, %s, 'manual')
                    RETURNING id
                """, (entry_date, shop, -total, comment, grams, price_per_gram))
                new_id = cur.fetchone()[0]

                # Увеличиваем остаток золота
                cur.execute(f"UPDATE {SCHEMA}.liquidity_gold_stock SET grams = grams + %s, updated_at = now()", (grams,))
                conn.commit()
                return ok({"id": new_id, "total": total, "grams": grams})

            # Продать золото
            if action == "sell_gold":
                grams = float(body.get("grams", 0))
                price_per_gram = float(body.get("price_per_gram", 0))
                shop = body.get("shop", "kirova7")
                entry_date = body.get("date", date.today().isoformat())
                comment = body.get("comment", "Инкассо / продажа золота")
                total = grams * price_per_gram

                # Проверяем остаток
                cur.execute(f"SELECT grams FROM {SCHEMA}.liquidity_gold_stock LIMIT 1")
                stock = cur.fetchone()
                stock_grams = float(stock[0]) if stock else 0.0
                if grams > stock_grams + 0.001:
                    return err(f"Недостаточно золота на остатке: есть {stock_grams:.3f} г, продаёте {grams:.3f} г")

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.liquidity_entries
                        (entry_date, shop, category, amount, comment, gold_grams, gold_price_per_gram, source)
                    VALUES (%s, %s, 'gold_sell', %s, %s, %s, %s, 'manual')
                    RETURNING id
                """, (entry_date, shop, total, comment, grams, price_per_gram))
                new_id = cur.fetchone()[0]

                # Уменьшаем остаток золота
                cur.execute(f"UPDATE {SCHEMA}.liquidity_gold_stock SET grams = grams - %s, updated_at = now()", (grams,))
                conn.commit()
                return ok({"id": new_id, "total": total, "grams": grams, "gold_stock_remaining": stock_grams - grams})

            # Добавить продажу телефона
            if action == "add_phone_sale":
                amount = float(body.get("amount", 0))
                shop = body.get("shop", "kirova7")
                entry_date = body.get("date", date.today().isoformat())
                comment = body.get("comment", "")

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.liquidity_entries
                        (entry_date, shop, category, amount, comment, source)
                    VALUES (%s, %s, 'phone_sale', %s, %s, 'manual')
                    RETURNING id
                """, (entry_date, shop, amount, comment))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            # Добавить произвольную запись (расход/доход)
            if action == "add_entry":
                amount = float(body.get("amount", 0))
                shop = body.get("shop", "kirova7")
                category = body.get("category", "other_expense")
                entry_date = body.get("date", date.today().isoformat())
                comment = body.get("comment", "")

                cur.execute(f"""
                    INSERT INTO {SCHEMA}.liquidity_entries
                        (entry_date, shop, category, amount, comment, source)
                    VALUES (%s, %s, %s, %s, %s, 'manual')
                    RETURNING id
                """, (entry_date, shop, category, amount, comment))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id})

            # Обновить сумму аренды
            if action == "update_rent":
                shop = body.get("shop")
                amount = float(body.get("amount", 0))
                if shop not in ("kirova7", "kirova11"):
                    return err("Неверный магазин")
                cur.execute(f"""
                    UPDATE {SCHEMA}.liquidity_rent SET amount = %s, updated_at = now() WHERE shop = %s
                """, (amount, shop))
                conn.commit()
                return ok({"ok": True})

            # Списать аренду вручную
            if action == "charge_rent":
                shop = body.get("shop")
                entry_date = body.get("date", date.today().isoformat())
                if shop not in ("kirova7", "kirova11"):
                    return err("Неверный магазин")
                cur.execute(f"SELECT amount FROM {SCHEMA}.liquidity_rent WHERE shop = %s", (shop,))
                r = cur.fetchone()
                if not r or float(r[0]) == 0:
                    return err("Сумма аренды не задана")
                amount = float(r[0])
                label = "Кирова 7" if shop == "kirova7" else "Кирова 11"
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.liquidity_entries
                        (entry_date, shop, category, amount, comment, source)
                    VALUES (%s, %s, 'rent', %s, %s, 'manual')
                    RETURNING id
                """, (entry_date, shop, -amount, f"Аренда {label}"))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"id": new_id, "amount": amount})

            # Удалить запись
            if action == "delete_entry":
                entry_id = body.get("id")
                if not entry_id:
                    return err("Нет id")
                # Если это покупка/продажа золота — корректируем остаток
                cur.execute(f"SELECT category, gold_grams FROM {SCHEMA}.liquidity_entries WHERE id = %s", (entry_id,))
                row = cur.fetchone()
                if row:
                    cat, grams = row
                    if cat == "gold_buy" and grams:
                        cur.execute(f"UPDATE {SCHEMA}.liquidity_gold_stock SET grams = grams - %s", (float(grams),))
                    elif cat == "gold_sell" and grams:
                        cur.execute(f"UPDATE {SCHEMA}.liquidity_gold_stock SET grams = grams + %s", (float(grams),))
                cur.execute(f"DELETE FROM {SCHEMA}.liquidity_entries WHERE id = %s", (entry_id,))
                conn.commit()
                return ok({"ok": True})

            # Синхронизировать доход с ремонта из repair_orders
            if action == "sync_repair":
                entry_date = body.get("date", date.today().isoformat())
                shop = body.get("shop", "kirova7")

                # Моя доля = repair_amount - master_income - purchase_amount
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
                """, (entry_date,))
                my_profit = float(cur.fetchone()[0])

                if my_profit > 0:
                    # Удаляем старую авто-запись за эту дату, если есть
                    cur.execute(f"""
                        DELETE FROM {SCHEMA}.liquidity_entries
                        WHERE entry_date = %s AND shop = %s AND category = 'repair' AND source = 'auto_repair'
                    """, (entry_date, shop))
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.liquidity_entries
                            (entry_date, shop, category, amount, comment, source)
                        VALUES (%s, %s, 'repair', %s, 'Авто: моя доля с ремонта', 'auto_repair')
                        RETURNING id
                    """, (entry_date, shop, my_profit))
                    conn.commit()
                    return ok({"synced": True, "amount": my_profit})
                return ok({"synced": False, "amount": 0})

        return err("Неизвестный запрос")

    finally:
        cur.close()
        conn.close()