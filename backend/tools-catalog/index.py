"""
Каталог инструментов: товары из БД (tools_products) + цены и картинки из API instrument.ru.
"""
import json
import os
import urllib.request
import urllib.parse
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
    """Получает цены и картинки из API instrument.ru."""
    if not articles or not token:
        return {}
    try:
        # Пробуем GET с параметрами (как в старом коде)
        params = urllib.parse.urlencode({
            "access_token": token,
            "format": "json",
        })
        # Артикулы передаём как article[]
        articles_params = "&".join(f"article[]={urllib.parse.quote(str(a))}" for a in articles[:50])
        url = f"{BASE_API_URL}/get.products.list?{params}&{articles_params}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = json.loads(resp.read().decode("utf-8"))

        if not isinstance(raw, dict):
            return {}
        if raw.get("result") == "error":
            return {}

        result = {}
        for pid, data in raw.items():
            if not isinstance(data, dict):
                continue
            art = str(data.get("ARTICLE", "")).strip()
            if not art:
                continue
            pics = data.get("PICTURES", [])
            main_pic = data.get("PICTURE", "") or (pics[0] if isinstance(pics, list) and pics else "")
            result[art] = {
                "base_price": float(data.get("BASE_PRICE", 0) or 0),
                "discount_price": float(data.get("DISCOUNT_PRICE", 0) or 0),
                "amount": data.get("AMOUNT", "") or "",
                "image_url": main_pic or "",
                "is_hit": bool(data.get("IS_HIT")),
                "is_new": bool(data.get("IS_NEW")),
            }
        return result
    except Exception as e:
        # Логируем ошибку в ответ для отладки
        print(f"API ERROR: {e}")
        return {"_error": str(e)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "products")
    limit = min(int(params.get("limit", 48)), 200)
    offset = int(params.get("offset", 0))
    search = params.get("search", "").strip()
    category_filter = params.get("category", "").strip()
    brand_filter = params.get("brand", "").strip()
    in_stock_only = params.get("in_stock", "") == "1"

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

    # Диагностика API
    if action == "debug_api":
        token = os.environ.get("INSTRUMENT_API_TOKEN", "")
        result = fetch_prices_for_articles(token, ["549125", "53722", "89551"])
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"token_len": len(token), "result": result}, ensure_ascii=False),
        }

    # products
    conditions = []
    args = []
    if search:
        conditions.append("(article ILIKE %s OR name ILIKE %s)")
        args += [f"%{search}%", f"%{search}%"]
    if category_filter:
        conditions.append("(split_part(category, '/', 1) = %s OR category ILIKE %s)")
        args += [category_filter, f"{category_filter}%"]
    if brand_filter:
        conditions.append("brand ILIKE %s")
        args.append(f"%{brand_filter}%")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products {where}", args)
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT article, name, brand, category, image_url FROM {SCHEMA}.tools_products "
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
    for article, name, brand, category, image_url in rows:
        price_info = prices.get(article, {})
        base_price = price_info.get("base_price", 0)
        discount_price = price_info.get("discount_price", 0)
        amount = price_info.get("amount", "")
        my_price = discount_price or base_price

        if in_stock_only and amount != "В наличии":
            continue

        img = price_info.get("image_url", "") or image_url or ""

        items.append({
            "article": article,
            "name": name,
            "brand": brand or "",
            "category": category or "",
            "base_price": base_price,
            "discount_price": discount_price,
            "amount": amount,
            "image_url": img,
            "is_hit": price_info.get("is_hit", False),
            "is_new": price_info.get("is_new", False),
        })

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "items": items,
            "total": total,
            "offset": offset,
            "has_more": offset + len(rows) < total,
            "api_error": prices.get("_error"),
        }, ensure_ascii=False),
    }