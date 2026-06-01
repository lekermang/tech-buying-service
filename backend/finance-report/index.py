"""
Финансовый аналитик-отчёт: PDF-выписки + склад → ИИ ДДС + дашборд расходов.
"""
import json
import os
import base64
import io
import re
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
    """Финансовый аналитик: PDF выписки + склад → ДДС + дашборд."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")

    # Токен принимаем из заголовка ИЛИ из тела запроса (PDF запросы могут обрезать заголовки)
    headers = event.get("headers") or {}
    token = (
        headers.get("x-employee-token")
        or headers.get("X-Employee-Token")
        or body.get("token")
        or ""
    )
    if not token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет токена"})}

    action = body.get("action", "analyze")

    if action == "analyze":
        return analyze(body)
    if action == "get_stock":
        return get_stock_summary()
    if action == "parse_pdf":
        return parse_pdf(body)

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}


# ── PDF парсинг ───────────────────────────────────────────────────────────────

def parse_pdf(body: dict) -> dict:
    """Извлекает текст из PDF (base64) с помощью pdfplumber."""
    pdf_b64 = body.get("pdf_base64", "")
    if not pdf_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "pdf_base64 обязателен"})}
    if "," in pdf_b64:
        pdf_b64 = pdf_b64.split(",", 1)[1]
    try:
        raw_bytes = base64.b64decode(pdf_b64)
    except Exception as e:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"base64 ошибка: {e}"})}
    try:
        import pdfplumber
        text_pages = []
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            total_pages = len(pdf.pages)
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text_pages.append(t.strip())
        full_text = "\n\n".join(text_pages)
        if not full_text.strip():
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"text": "", "pages": total_pages,
                                        "warning": "PDF не содержит текста — возможно, скан"}, ensure_ascii=False)}
        return {"statusCode": 200, "headers": CORS,
                "body": json.dumps({"text": full_text, "pages": total_pages}, ensure_ascii=False)}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": f"Ошибка PDF: {e}"}, ensure_ascii=False)}


# ── Данные склада из БД ───────────────────────────────────────────────────────

def get_stock_summary() -> dict:
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
        cur.execute(f"""
            SELECT COALESCE(SUM(buy_price), 0) AS last30_buy, COUNT(*) AS last30_count
            FROM {SCHEMA}.slshop_items WHERE created_at >= NOW() - INTERVAL '30 days'
        """)
        last30 = dict(cur.fetchone())
        cur.execute(f"""
            SELECT COALESCE(SUM(sell_price), 0) AS last30_revenue,
                   COALESCE(SUM(sell_price - buy_price), 0) AS last30_profit,
                   COUNT(*) AS last30_sold
            FROM {SCHEMA}.slshop_items
            WHERE status = 'sold' AND sell_at >= NOW() - INTERVAL '30 days'
        """)
        last30_sell = dict(cur.fetchone())
        cur.close(); conn.close()
        return {
            "statusCode": 200, "headers": CORS,
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


# ── Основной анализ ───────────────────────────────────────────────────────────

def analyze(body: dict) -> dict:
    debit_text = (body.get("debit_text") or "").strip()
    savings_text = (body.get("savings_text") or "").strip()
    period = (body.get("period") or "текущий месяц").strip()
    today = datetime.now()
    today_str = today.strftime("%d.%m.%Y")
    # Сколько дней прошло и осталось в месяце
    day_of_month = today.day
    import calendar
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    days_left = days_in_month - day_of_month

    if not debit_text and not savings_text:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "Нужна хотя бы одна выписка"}, ensure_ascii=False)}

    stock_resp = get_stock_summary()
    stock_data = json.loads(stock_resp["body"])

    stock_context = f"""ДАННЫЕ СКЛАДА (актуально на {today_str}):
- Товаров на складе: {int(stock_data.get('in_stock', 0))} позиций
- Стоимость склада (закупочная): {stock_data.get('stock_value', 0):,.0f} руб
- Потенциальная выручка со склада: {stock_data.get('stock_sell_value', 0):,.0f} руб
- Прибыль с начала бизнеса: {stock_data.get('total_profit', 0):,.0f} руб
- Всего вложено: {stock_data.get('total_invested', 0):,.0f} руб
- Выручка за всё время: {stock_data.get('total_revenue', 0):,.0f} руб
- Закупки последние 30 дн.: {stock_data.get('last30_buy', 0):,.0f} руб ({int(stock_data.get('last30_count', 0))} шт)
- Продажи последние 30 дн.: {stock_data.get('last30_revenue', 0):,.0f} руб ({int(stock_data.get('last30_sold', 0))} шт), прибыль: {stock_data.get('last30_profit', 0):,.0f} руб"""

    debit_section = f"ВЫПИСКА ПО ДЕБЕТОВОЙ КАРТЕ:\n{debit_text}" if debit_text else "ВЫПИСКА ПО ДЕБЕТОВОЙ КАРТЕ: не предоставлена"
    savings_section = f"ВЫПИСКА ПО НАКОПИТЕЛЬНОМУ СЧЁТУ:\n{savings_text}" if savings_text else "ВЫПИСКА ПО НАКОПИТЕЛЬНОМУ СЧЁТУ: не предоставлена"

    prompt = f"""Ты — строгий финансовый аналитик. Сегодня {today_str}, период: {period}.
До конца месяца осталось {days_left} дней (из {days_in_month}).

{stock_context}

{debit_section}

{savings_section}

Проанализируй ВСЕ транзакции и верни ответ СТРОГО в формате JSON — без markdown, без пояснений, только JSON объект.

Структура JSON:
{{
  "debit_balance": "сумма руб или нет данных",
  "savings_balance": "сумма руб или нет данных",
  "total_money": "сумма руб",
  "profit_total": "сумма руб",
  "profit_period": "сумма руб (+ или -)",
  "days_runway": "X дней",
  "safety_level": "green|yellow|red",
  "main_problem": "одна фраза — самое опасное",
  "budget_today": "сколько можно потратить сегодня в рублях (число)",
  "budget_today_explain": "краткое объяснение откуда цифра (1 предложение)",
  "actions": ["действие 1", "действие 2", "действие 3"],
  "expense_categories": [
    {{"name": "Аренда", "amount": 15000, "percent": 22, "trend": "stable", "comment": "ежемесячный платёж"}},
    {{"name": "Закупка товара", "amount": 85000, "percent": 45, "trend": "up", "comment": "основная статья"}},
    ...до 8 категорий
  ],
  "income_categories": [
    {{"name": "Продажи б/у", "amount": 120000, "percent": 78}},
    ...до 5 категорий
  ],
  "top_expenses": [
    {{"date": "дд.мм", "desc": "название операции", "amount": 5000}},
    ...до 5 крупнейших расходов
  ],
  "savings_tips": [
    "На чём можно сэкономить 1 (конкретно, в рублях если возможно)",
    "На чём можно сэкономить 2",
    "На чём можно сэкономить 3"
  ],
  "cash_flow_summary": "2-3 предложения о движении денег: откуда приходят, куда уходят, что тревожит"
}}

Если данных нет для поля — ставь null. trend: up/down/stable. percent — от общей суммы расходов/доходов."""

    try:
        data = json.dumps({
            "model": "gpt-4o",
            "max_tokens": 2000,
            "temperature": 0.1,
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        }).encode()
        req = urllib.request.Request(
            "https://api.polza.ai/v1/chat/completions",
            data=data,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_KEY}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
        raw = result["choices"][0]["message"]["content"].strip()
        # Убираем markdown если вдруг есть
        if raw.startswith("```"):
            raw = re.sub(r"```\w*\n?", "", raw).strip()
        parsed = json.loads(raw)

        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "parsed": parsed,
                "stock": stock_data,
                "generated_at": datetime.now().isoformat(),
                "days_left_month": days_left,
                "day_of_month": day_of_month,
            }, ensure_ascii=False),
        }
    except Exception as e:
        return {"statusCode": 500, "headers": CORS,
                "body": json.dumps({"error": str(e)}, ensure_ascii=False)}