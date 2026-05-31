"""
ИИ-оценщик устройств для ломбарда.
Смотрит историю наших продаж из БД + анализирует рынок через GPT-4o.
Поддерживает распознавание текста с фото (base64).
"""
import json
import os
import psycopg2
import urllib.request
import urllib.error
import base64
import re

DB = os.environ["DATABASE_URL"]
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
OPENAI_KEY = os.environ.get("POLZA_AI_API_KEY", "")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Employee-Token, X-Admin-Token",
}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "evaluate")

    if action == "evaluate":
        return evaluate(body)
    if action == "recognize_photo":
        return recognize_photo(body)
    if action == "history":
        return get_history()

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown action"})}


def get_db_stats(model_query: str) -> dict:
    """Берём статистику продаж похожих товаров из нашей БД."""
    try:
        conn = psycopg2.connect(DB)
        cur = conn.cursor()

        # Ищем похожие товары по названию (sold за последние 90 дней)
        words = [w for w in re.split(r"[\s/,]+", model_query.lower()) if len(w) > 2]
        if not words:
            return {}

        like_clauses = " OR ".join([f"LOWER(title) LIKE %s" for w in words[:3]])
        params = [f"%{w}%" for w in words[:3]]

        cur.execute(f"""
            SELECT title, buy_price, sell_price,
                   ROUND((sell_price - buy_price) / NULLIF(buy_price, 0) * 100) as margin_pct,
                   created_at
            FROM {SCHEMA}.slshop_items
            WHERE status = 'sold'
              AND created_at > NOW() - INTERVAL '90 days'
              AND ({like_clauses})
            ORDER BY created_at DESC
            LIMIT 10
        """, params)

        rows = cur.fetchall()
        conn.close()

        if not rows:
            return {}

        buy_prices = [float(r[1]) for r in rows if r[1]]
        sell_prices = [float(r[2]) for r in rows if r[2]]

        return {
            "found": len(rows),
            "our_avg_buy": round(sum(buy_prices) / len(buy_prices)) if buy_prices else None,
            "our_avg_sell": round(sum(sell_prices) / len(sell_prices)) if sell_prices else None,
            "our_min_sell": round(min(sell_prices)) if sell_prices else None,
            "our_max_sell": round(max(sell_prices)) if sell_prices else None,
            "samples": [{"title": r[0], "buy": float(r[1] or 0), "sell": float(r[2] or 0)} for r in rows[:5]],
        }
    except Exception as e:
        return {"error": str(e)}


def call_openai(messages: list, max_tokens: int = 1200) -> str:
    data = json.dumps({
        "model": "gpt-4o",
        "max_tokens": max_tokens,
        "messages": messages,
        "temperature": 0.3,
    }).encode()

    req = urllib.request.Request(
        "https://api.polza.ai/v1/chat/completions",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    return result["choices"][0]["message"]["content"]


def evaluate(body: dict) -> dict:
    model = body.get("model", "").strip()
    brand = body.get("brand", "").strip()
    category = body.get("category", "смартфон")
    storage = body.get("storage", "").strip()
    year = body.get("year", "").strip()
    condition = body.get("condition", "хорошее")
    kit = body.get("kit", "без коробки")
    region = body.get("region", "Калуга")
    notes = body.get("notes", "").strip()

    if not model:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "model required"})}

    full_name = f"{brand} {model}".strip()

    # 1. Берём статистику из нашей БД
    db_stats = get_db_stats(full_name)

    # 2. Формируем контекст нашей БД для ИИ
    db_context = ""
    if db_stats.get("found"):
        db_context = f"""
Данные нашего ломбарда (Скупка24, Калуга) — продажи за 90 дней:
- Найдено похожих продаж: {db_stats['found']} шт.
- Наша средняя цена закупки: {db_stats.get('our_avg_buy', '—')} ₽
- Наша средняя цена продажи: {db_stats.get('our_avg_sell', '—')} ₽
- Диапазон наших продаж: {db_stats.get('our_min_sell', '—')} — {db_stats.get('our_max_sell', '—')} ₽
- Примеры: {', '.join([f"{s['title']} (куплено {s['buy']}₽, продано {s['sell']}₽)" for s in db_stats.get('samples', [])[:3]])}
"""

    prompt = f"""Ты — эксперт по оценке б/у техники. Проанализируй рыночную стоимость на Авито (российский рынок, регион: {region}).

Устройство: {full_name}
Категория: {category}
{f"Память/конфиг: {storage}" if storage else ""}
{f"Год выпуска: {year}" if year else ""}
Состояние: {condition}
Комплектация: {kit}
{f"Дефекты/особенности: {notes}" if notes else ""}

{db_context}

Ответь СТРОГО только JSON без markdown. Структура:
{{
  "min_price": число (минимальная цена на Авито),
  "avg_price": число (средняя цена на Авито),
  "max_price": число (максимальная цена на Авито),
  "recommended_buy": число (рекомендуемая цена закупки у клиента для ломбарда),
  "recommended_sell": число (рекомендуемая цена продажи в ломбарде),
  "margin_pct": число (ожидаемая маржа в %),
  "liquidity": "высокая" | "средняя" | "низкая",
  "sell_days": число (среднее кол-во дней до продажи),
  "sell_time": "строка (например: 3-7 дней)",
  "tips": ["совет 1", "совет 2", "совет 3"],
  "factors": "краткий абзац о факторах цены",
  "ad_title": "готовый заголовок объявления для Авито",
  "risk": "низкий" | "средний" | "высокий" (риск не продать быстро)
}}"""

    try:
        raw = call_openai([{"role": "user", "content": prompt}])
        clean = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(clean)
        result["db_stats"] = db_stats
        result["query"] = {"model": full_name, "category": category, "condition": condition, "kit": kit, "region": region}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}


def recognize_photo(body: dict) -> dict:
    """Распознаём фото устройства и извлекаем модель/характеристики."""
    photo_b64 = body.get("photo_base64", "")
    if not photo_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "photo required"})}

    # Убираем data URL prefix если есть
    if "," in photo_b64:
        photo_b64 = photo_b64.split(",", 1)[1]

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{photo_b64}", "detail": "high"},
                },
                {
                    "type": "text",
                    "text": """Посмотри на фото и определи устройство. Это может быть коробка, экран настроек, задняя крышка или сам гаджет.
Извлеки всю возможную информацию о модели.

Ответь СТРОГО только JSON:
{
  "model": "точное название модели",
  "brand": "производитель",
  "category": "смартфон | ноутбук | планшет | игровая консоль | наушники | умные часы | фотоаппарат | другое",
  "storage": "объём памяти если виден",
  "year": "год выпуска если понятен",
  "color": "цвет если виден",
  "condition_hints": "видимые дефекты или состояние с фото",
  "confidence": "высокая | средняя | низкая",
  "notes": "дополнительная информация"
}""",
                },
            ],
        }
    ]

    try:
        raw = call_openai(messages, max_tokens=600)
        clean = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(clean)
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(result, ensure_ascii=False)}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}


def get_history() -> dict:
    """Последние 20 проданных товаров из нашей БД для справки."""
    try:
        conn = psycopg2.connect(DB)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT title, buy_price, sell_price, category_name, created_at
            FROM {SCHEMA}.slshop_items
            WHERE status = 'sold'
            ORDER BY created_at DESC
            LIMIT 20
        """)
        rows = cur.fetchall()
        conn.close()
        items = [{"title": r[0], "buy": float(r[1] or 0), "sell": float(r[2] or 0),
                  "category": r[3], "date": str(r[4])[:10]} for r in rows]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"items": items}, ensure_ascii=False)}
    except Exception as e:
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)}, ensure_ascii=False)}
