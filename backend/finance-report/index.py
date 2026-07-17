"""
Финансовый аналитик-отчёт: PDF-выписки + склад → ИИ ДДС + дашборд расходов.
"""
import json
import os
import base64
import io
import re
import uuid
import urllib.request
import psycopg2
import psycopg2.extras
import boto3
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

    raw_body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8")
    body = json.loads(raw_body)

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
    if action == "get_upload_url":
        return get_upload_url(body)
    if action == "upload_chunk":
        return upload_chunk(body)
    if action == "assemble_pdf":
        return assemble_pdf(body)
    if action == "upload_pdf":
        return upload_pdf(body)
    if action == "parse_pdf":
        return parse_pdf(body)
    if action in ("cash_current", "cash_history", "cash_add"):
        return handle_cash_balance(action, body, token)

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}


# ── Касса по фактическому остатку (наличные ₽ + золото 585 г) ──────────────────
# Сотрудники дважды в день (10:00 / 19:00) вносят фактический остаток кассы.
# Таблица: cash_balance_checks (id, checked_at, check_date, slot, cash_amount,
# gold_585_grams, comment, employee_id, employee_name)

def _cash_get_employee(cur, token: str):
    cur.execute(
        f"SELECT id, role, full_name FROM {SCHEMA}.employees "
        "WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
        (token,),
    )
    row = cur.fetchone()
    return {"id": row[0], "role": row[1], "full_name": row[2]} if row else None


def _cash_current_slot() -> str:
    from datetime import timezone, timedelta
    msk = timezone(timedelta(hours=3))
    hour = datetime.now(msk).hour
    return "morning" if 7 <= hour < 15 else "evening"


def handle_cash_balance(action: str, body: dict, token: str) -> dict:
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    try:
        emp = _cash_get_employee(cur, token)
        if not emp:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

        if action == "cash_current":
            cur.execute(
                f"SELECT id, checked_at, check_date, slot, cash_amount, gold_585_grams, comment, employee_name "
                f"FROM {SCHEMA}.cash_balance_checks ORDER BY checked_at DESC LIMIT 1"
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"current": None})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"current": {
                "id": row[0], "checked_at": row[1].isoformat(), "check_date": str(row[2]),
                "slot": row[3], "cash_amount": float(row[4]), "gold_585_grams": float(row[5]),
                "comment": row[6], "employee_name": row[7],
            }}, ensure_ascii=False)}

        if action == "cash_history":
            limit = min(int(body.get("limit") or 30), 200)
            cur.execute(
                f"SELECT id, checked_at, check_date, slot, cash_amount, gold_585_grams, comment, employee_name "
                f"FROM {SCHEMA}.cash_balance_checks ORDER BY checked_at DESC LIMIT %s",
                (limit,)
            )
            items = [{
                "id": r[0], "checked_at": r[1].isoformat(), "check_date": str(r[2]),
                "slot": r[3], "cash_amount": float(r[4]), "gold_585_grams": float(r[5]),
                "comment": r[6], "employee_name": r[7],
            } for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"items": items}, ensure_ascii=False)}

        if action == "cash_add":
            cash_amount = body.get("cash_amount")
            gold_grams = body.get("gold_585_grams")
            if cash_amount is None or gold_grams is None:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "cash_amount и gold_585_grams обязательны"}, ensure_ascii=False)}
            try:
                cash_amount = float(cash_amount)
                gold_grams = float(gold_grams)
            except (TypeError, ValueError):
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "cash_amount и gold_585_grams должны быть числами"}, ensure_ascii=False)}
            if cash_amount < 0 or gold_grams < 0:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Остаток не может быть отрицательным"}, ensure_ascii=False)}
            slot = body.get("slot") or _cash_current_slot()
            if slot not in ("morning", "evening", "manual"):
                slot = "manual"
            comment = (body.get("comment") or "").strip()[:500] or None
            cur.execute(
                f"INSERT INTO {SCHEMA}.cash_balance_checks "
                f"(slot, cash_amount, gold_585_grams, comment, employee_id, employee_name) "
                f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, checked_at",
                (slot, cash_amount, gold_grams, comment, emp["id"], emp["full_name"])
            )
            new_id, checked_at = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": new_id, "checked_at": checked_at.isoformat()}, ensure_ascii=False)}

        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown cash action"})}
    finally:
        cur.close()
        conn.close()


# ── S3 клиент ─────────────────────────────────────────────────────────────────

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


# ── Presigned URL для прямой загрузки с фронтенда ────────────────────────────

def get_upload_url(body: dict) -> dict:
    """Генерирует presigned PUT URL — фронтенд загружает PDF напрямую в S3."""
    key = f"finance-tmp/{uuid.uuid4()}.pdf"
    s3 = get_s3()
    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": "files", "Key": key, "ContentType": "application/pdf"},
        ExpiresIn=300,
    )
    return {"statusCode": 200, "headers": CORS,
            "body": json.dumps({"upload_url": upload_url, "s3_key": key})}


# ── Чанковая загрузка: принимаем по 50КБ, собираем в S3 ──────────────────────

def upload_chunk(body: dict) -> dict:
    """Принимает один base64-чанк файла, сохраняет в S3 как часть chunk_id/N."""
    file_id = body.get("file_id", "")
    chunk_index = body.get("chunk_index", 0)
    chunk_b64 = body.get("chunk_b64", "")
    if not file_id or not chunk_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "file_id и chunk_b64 обязательны"})}
    chunk_bytes = base64.b64decode(chunk_b64)
    key = f"finance-chunks/{file_id}/{chunk_index:04d}"
    s3 = get_s3()
    s3.put_object(Bucket="files", Key=key, Body=chunk_bytes)
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}


def assemble_pdf(body: dict) -> dict:
    """Собирает все чанки в один PDF-файл, возвращает s3_key для parse-pdf."""
    file_id = body.get("file_id", "")
    total_chunks = body.get("total_chunks", 0)
    if not file_id or not total_chunks:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "file_id и total_chunks обязательны"})}
    s3 = get_s3()
    parts = []
    for i in range(total_chunks):
        chunk_key = f"finance-chunks/{file_id}/{i:04d}"
        obj = s3.get_object(Bucket="files", Key=chunk_key)
        parts.append(obj["Body"].read())
        s3.delete_object(Bucket="files", Key=chunk_key)
    pdf_bytes = b"".join(parts)
    final_key = f"finance-tmp/{file_id}.pdf"
    s3.put_object(Bucket="files", Key=final_key, Body=pdf_bytes, ContentType="application/pdf")
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"s3_key": final_key})}


# ── PDF загрузка на S3 (через бэкенд, запасной вариант) ──────────────────────

def upload_pdf(body: dict) -> dict:
    """Принимает base64 PDF, сохраняет во временное хранилище S3, возвращает s3_key."""
    pdf_b64 = body.get("pdf_base64", "")
    if not pdf_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "pdf_base64 обязателен"})}
    if "," in pdf_b64:
        pdf_b64 = pdf_b64.split(",", 1)[1]
    try:
        raw_bytes = base64.b64decode(pdf_b64)
    except Exception as e:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"base64 ошибка: {e}"})}

    key = f"finance-tmp/{uuid.uuid4()}.pdf"
    s3 = get_s3()
    s3.put_object(Bucket="files", Key=key, Body=raw_bytes, ContentType="application/pdf")
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"s3_key": key})}


# ── PDF парсинг из S3 ─────────────────────────────────────────────────────────

def parse_pdf(body: dict) -> dict:
    """Читает PDF из S3 по s3_key, извлекает текст через pdfplumber."""
    s3_key = body.get("s3_key", "")
    if not s3_key:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "s3_key обязателен"})}
    try:
        s3 = get_s3()
        obj = s3.get_object(Bucket="files", Key=s3_key)
        raw_bytes = obj["Body"].read()
        # Удаляем временный файл после чтения
        s3.delete_object(Bucket="files", Key=s3_key)
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": f"S3 ошибка: {e}"}, ensure_ascii=False)}
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