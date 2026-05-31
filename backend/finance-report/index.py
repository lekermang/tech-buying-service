"""
Финансовый аналитик-отчёт: банковские выписки + данные склада → ИИ-резюме.
Принимает тексты выписок (дебетовая карта, накопительный счёт)
и автоматически подтягивает складские данные из БД.
Возвращает структурированный отчёт по шаблону ДДС.
"""
import json
import os
import urllib.request
import psycopg2
import psycopg2.extras
from datetime import datetime

DB = os.environ["DATABASE_URL"]
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
OPENAI_KEY = os.environ.get("POLZA_AI_API_KEY", "")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Employee-Token",
}


def handler(event: dict, context) -> dict:
    """Принимает банковские выписки, возвращает ИИ-финотчёт по шаблону ДДС."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    token = (event.get("headers") or {}).get("x-employee-token", "")
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "analyze")

    if action == "analyze":
        return analyze(body)
    if action == "get_stock":
        return get_stock_summary()

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}


def get_stock_summary() -> dict:
    """Вытаскивает сводку склада из БД."""
    try:
        conn = psycopg2.connect(DB)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(f"""
            SELECT
                COUNT(*) FILTER (WHERE status IN ('stock','showcase','consignment')) AS in_stock,
                COALESCE(SUM(buy_price) FILTER (WHERE status IN ('stock','showcase','consignment')), 0) AS stock_value,
                COALESCE(SUM(sell_price) FILTER (WHERE status IN ('stock','showcase','consignment')), 0) AS stock_sell_value,
                COALESCE(SUM(sell_price - buy_price) FILTER (WHERE status = 'sold'), 0) AS total_profit,
                COALESCE(SUM(buy_price), 0) AS total_invested,
                COALESCE(SUM(sell_price) FILTER (WHERE status = 'sold'), 0) AS total_revenue,
                COUNT(*) FILTER (WHERE status = 'sold') AS sold_count,
                MIN(created_at) AS started_at
            FROM {SCHEMA}.slshop_items
        """)
        row = dict(cur.fetchone())

        # Расходы за последние 30 дней (скупка)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(buy_price), 0) AS last30_buy,
                COUNT(*) AS last30_count
            FROM {SCHEMA}.slshop_items
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """)
        last30 = dict(cur.fetchone())

        # Доходы за последние 30 дней (продажи)
        cur.execute(f"""
            SELECT
                COALESCE(SUM(sell_price), 0) AS last30_revenue,
                COALESCE(SUM(sell_price - buy_price), 0) AS last30_profit,
                COUNT(*) AS last30_sold
            FROM {SCHEMA}.slshop_items
            WHERE status = 'sold' AND sell_at >= NOW() - INTERVAL '30 days'
        """)
        last30_sell = dict(cur.fetchone())

        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "in_stock": int(row.get("in_stock") or 0),
                "stock_value": float(row.get("stock_value") or 0),
                "stock_sell_value": float(row.get("stock_sell_value") or 0),
                "total_profit": float(row.get("total_profit") or 0),
                "total_invested": float(row.get("total_invested") or 0),
                "total_revenue": float(row.get("total_revenue") or 0),
                "sold_count": int(row.get("sold_count") or 0),
                "started_at": row["started_at"].isoformat() if row.get("started_at") else None,
                "last30_buy": float(last30.get("last30_buy") or 0),
                "last30_count": int(last30.get("last30_count") or 0),
                "last30_revenue": float(last30_sell.get("last30_revenue") or 0),
                "last30_profit": float(last30_sell.get("last30_profit") or 0),
                "last30_sold": int(last30_sell.get("last30_sold") or 0),
            }, ensure_ascii=False),
        }
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)})}


def analyze(body: dict) -> dict:
    """Основной action: принимает выписки, берёт склад из БД, отправляет в GPT-4o."""
    debit_text = (body.get("debit_text") or "").strip()
    savings_text = (body.get("savings_text") or "").strip()
    period = (body.get("period") or "текущий месяц").strip()

    if not debit_text and not savings_text:
        return {
            "statusCode": 400,
            "headers": CORS,
            "body": json.dumps({"error": "Нужна хотя бы одна выписка"}, ensure_ascii=False),
        }

    # Берём данные склада
    stock_resp = get_stock_summary()
    stock_data = json.loads(stock_resp["body"])

    stock_context = f"""ДАННЫЕ СКЛАДА (из системы учёта, актуально на сегодня {datetime.now().strftime('%d.%m.%Y')}):
- Товаров на складе: {int(stock_data.get('in_stock', 0))} позиций
- Стоимость склада (закупочная): {stock_data.get('stock_value', 0):,.0f} руб
- Потенциальная выручка со склада: {stock_data.get('stock_sell_value', 0):,.0f} руб
- Прибыль с начала бизнеса: {stock_data.get('total_profit', 0):,.0f} руб
- Всего вложено в товар: {stock_data.get('total_invested', 0):,.0f} руб
- Всего выручки за всё время: {stock_data.get('total_revenue', 0):,.0f} руб
- Закупки за последние 30 дней: {stock_data.get('last30_buy', 0):,.0f} руб ({int(stock_data.get('last30_count', 0))} шт)
- Продажи за последние 30 дней: {stock_data.get('last30_revenue', 0):,.0f} руб ({int(stock_data.get('last30_sold', 0))} шт), прибыль: {stock_data.get('last30_profit', 0):,.0f} руб"""

    debit_section = f"ВЫПИСКА ПО ДЕБЕТОВОЙ КАРТЕ:\n{debit_text}" if debit_text else "ВЫПИСКА ПО ДЕБЕТОВОЙ КАРТЕ: не предоставлена"
    savings_section = f"ВЫПИСКА ПО НАКОПИТЕЛЬНОМУ СЧЁТУ:\n{savings_text}" if savings_text else "ВЫПИСКА ПО НАКОПИТЕЛЬНОМУ СЧЁТУ: не предоставлена"

    prompt = f"""Ты — финансовый аналитик. Период: {period}.

{stock_context}

{debit_section}

{savings_section}

Твоя задача — объединить все данные и выдать ОДИН краткий отчёт СТРОГО по шаблону ниже.
НЕ пиши общие фразы. НЕ учи вести учёт. ТОЛЬКО цифры и три действия.
Если данных не хватает для конкретной строки — напиши «нет данных» для этой строки, не додумывай.

ШАБЛОН (выдай строго в этом формате, с этими заголовками):

ДЕНЬГИ НА СЕГОДНЯ:
- Остаток на дебетовой карте: ХХХ руб
- Остаток на накопительном: ХХХ руб
- ИТОГО ДЕНЕГ: ХХХ руб

ПРИБЫЛЬ БИЗНЕСА:
- Прибыль с начала бизнеса (реальная): ХХХ руб
- Прибыль/убыток за отчётный период: ХХХ руб

РИСК КАССОВОГО РАЗРЫВА:
- Денег хватит на: X дней (при нулевых продажах)
- Порог безопасности: зелёный / жёлтый / красный

ГЛАВНАЯ ПРОБЛЕМА:
- (одна фраза, самое опасное)

ТРИ ДЕЙСТВИЯ ЗАВТРА:
1. ...
2. ...
3. ..."""

    try:
        data = json.dumps({
            "model": "gpt-4o",
            "max_tokens": 800,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}],
        }).encode()
        req = urllib.request.Request(
            "https://api.polza.ai/v1/chat/completions",
            data=data,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_KEY}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=40) as resp:
            result = json.loads(resp.read())
        report_text = result["choices"][0]["message"]["content"].strip()

        # Парсим структурированно для фронтенда
        parsed = parse_report(report_text)

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "report": report_text,
                "parsed": parsed,
                "stock": stock_data,
                "generated_at": datetime.now().isoformat(),
            }, ensure_ascii=False),
        }
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}


def parse_report(text: str) -> dict:
    """Извлекаем ключевые строки из текста отчёта для структурированного отображения."""
    lines = text.split("\n")
    result = {
        "debit_balance": None,
        "savings_balance": None,
        "total_money": None,
        "profit_total": None,
        "profit_period": None,
        "days_runway": None,
        "safety_level": None,
        "main_problem": None,
        "actions": [],
    }
    actions = []
    for line in lines:
        l = line.strip()
        lo = l.lower()
        if "дебетовой карте:" in lo:
            result["debit_balance"] = l.split(":", 1)[-1].strip()
        elif "накопительном:" in lo:
            result["savings_balance"] = l.split(":", 1)[-1].strip()
        elif "итого денег:" in lo:
            result["total_money"] = l.split(":", 1)[-1].strip()
        elif "с начала бизнеса" in lo:
            result["profit_total"] = l.split(":", 1)[-1].strip()
        elif "за отчётный период" in lo:
            result["profit_period"] = l.split(":", 1)[-1].strip()
        elif "денег хватит на:" in lo:
            result["days_runway"] = l.split(":", 1)[-1].strip()
        elif "порог безопасности:" in lo:
            val = l.split(":", 1)[-1].strip().lower()
            result["safety_level"] = "green" if "зелён" in val else "red" if "красн" in val else "yellow"
        elif lo.startswith("- ") and result.get("main_problem") is None and "главная проблема" not in lo:
            # Первая строка после ГЛАВНАЯ ПРОБЛЕМА
            pass
        if l.startswith("1.") or l.startswith("2.") or l.startswith("3."):
            actions.append(l[2:].strip())
    result["actions"] = actions[:3]

    # Ищем ГЛАВНАЯ ПРОБЛЕМА отдельным проходом
    found_problem = False
    for line in lines:
        l = line.strip()
        if "главная проблема" in l.lower():
            found_problem = True
            continue
        if found_problem and l.startswith("-") and not result["main_problem"]:
            result["main_problem"] = l[1:].strip()
            break

    return result
