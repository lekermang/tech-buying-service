"""
Каталог инструментов: товары из БД (tools_products) + цены из API instrument.ru.
Показываем только товары, которые есть в таблице (загружены из CSV).
"""
import json
import os
import urllib.request
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

BASE_API_URL = "https://instrument.ru/api.php"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def fetch_prices_for_articles(token: str, articles: list) -> dict:
    """Получает цены из API instrument.ru для списка артикулов. Возвращает {article: {base_price, discount_price, amount}}"""
    if not articles or not token:
        return {}
    try:
        payload = json.dumps({"access_token": token, "format": "json", "articles": articles}).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_API_URL}/get.products.list",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
        if not isinstance(raw, dict) or raw.get("result") == "error":
            return {}
        result = {}
        for pid, data in raw.items():
            art = data.get("ARTICLE", "")
            if art:
                result[art] = {
                    "base_price": float(data.get("BASE_PRICE", 0) or 0),
                    "discount_price": float(data.get("DISCOUNT_PRICE", 0) or 0),
                    "amount": data.get("AMOUNT", ""),
                }
        return result
    except Exception:
        return {}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "products")
    limit = min(int(params.get("limit", 50)), 200)
    offset = int(params.get("offset", 0))
    search = params.get("search", "").strip()
    category_filter = params.get("category", "").strip()
    brand_filter = params.get("brand", "").strip()

    conn = get_conn()
    cur = conn.cursor()

    if action == "meta":
        cur.execute(
            f"SELECT DISTINCT split_part(category, '/', 1) FROM {SCHEMA}.tools_products "
            f"WHERE category IS NOT NULL AND category != '' ORDER BY 1"
        )
        top_cats = [r[0] for r in cur.fetchall()]
        cur.execute(
            f"SELECT DISTINCT brand FROM {SCHEMA}.tools_products "
            f"WHERE brand IS NOT NULL AND brand != '' ORDER BY 1"
        )
        brands = [r[0] for r in cur.fetchall()]
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"brands": brands, "categories": top_cats}, ensure_ascii=False),
        }

    # Строим запрос с фильтрами
    conditions = []
    args = []

    if search:
        conditions.append("(article ILIKE %s OR name ILIKE %s)")
        args += [f"%{search}%", f"%{search}%"]

    if category_filter:
        conditions.append("(category ILIKE %s OR split_part(category, '/', 1) = %s)")
        args += [f"{category_filter}%", category_filter]

    if brand_filter:
        conditions.append("brand ILIKE %s")
        args.append(f"%{brand_filter}%")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.tools_products {where}",
        args
    )
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT article, name, brand, category FROM {SCHEMA}.tools_products "
        f"{where} ORDER BY category, name LIMIT %s OFFSET %s",
        args + [limit, offset]
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    articles = [r[0] for r in rows]
    token = os.environ.get("INSTRUMENT_API_TOKEN", "")
    prices = fetch_prices_for_articles(token, articles)

    items = []
    for article, name, brand, category in rows:
        price_info = prices.get(article, {})
        items.append({
            "article": article,
            "name": name,
            "brand": brand or "",
            "category": category or "",
            "base_price": price_info.get("base_price", 0),
            "discount_price": price_info.get("discount_price", 0),
            "amount": price_info.get("amount", ""),
        })

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "items": items,
            "total": total,
            "offset": offset,
            "has_more": offset + len(items) < total,
        }, ensure_ascii=False),
    }
