"""
Каталог инструментов: товары из БД (tools_products) + цены и картинки из API instrument.ru.
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
    """Получает цены и картинки из API instrument.ru для списка артикулов."""
    if not articles or not token:
        return {}
    try:
        payload = json.dumps({
            "access_token": token,
            "format": "json",
            "articles": articles
        }).encode("utf-8")
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
                # Картинки: PICTURE — основная, PICTURES — список
                pictures = data.get("PICTURES", [])
                main_pic = data.get("PICTURE", "")
                if not main_pic and pictures:
                    main_pic = pictures[0] if isinstance(pictures, list) else ""
                result[art] = {
                    "base_price": float(data.get("BASE_PRICE", 0) or 0),
                    "discount_price": float(data.get("DISCOUNT_PRICE", 0) or 0),
                    "amount": data.get("AMOUNT", ""),
                    "image_url": main_pic or "",
                    "is_new": bool(data.get("IS_NEW")),
                    "is_hit": bool(data.get("IS_HIT")),
                }
        return result
    except Exception:
        return {}


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
    price_min = float(params.get("price_min", 0) or 0)
    price_max = float(params.get("price_max", 0) or 0)

    conn = get_conn()
    cur = conn.cursor()

    if action == "meta":
        cur.execute(
            f"SELECT DISTINCT split_part(category, '/', 1) FROM {SCHEMA}.tools_products "
            f"WHERE category IS NOT NULL AND category != '' ORDER BY 1"
        )
        top_cats = [r[0] for r in cur.fetchall()]

        # Подкатегории для выбранной категории
        selected_cat = params.get("category", "")
        subcats = []
        if selected_cat:
            cur.execute(
                f"SELECT DISTINCT split_part(category, '/', 2) FROM {SCHEMA}.tools_products "
                f"WHERE split_part(category, '/', 1) = %s AND category LIKE %s "
                f"AND split_part(category, '/', 2) != '' ORDER BY 1",
                (selected_cat, selected_cat + "/%")
            )
            subcats = [r[0] for r in cur.fetchall()]

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
            "body": json.dumps({
                "brands": brands,
                "categories": top_cats,
                "subcategories": subcats,
            }, ensure_ascii=False),
        }

    # --- action=products ---
    conditions = []
    args = []

    if search:
        conditions.append("(article ILIKE %s OR name ILIKE %s)")
        args += [f"%{search}%", f"%{search}%"]

    if category_filter:
        conditions.append("(split_part(category, '/', 1) = %s OR split_part(category, '/', 2) = %s OR category ILIKE %s)")
        args += [category_filter, category_filter, f"{category_filter}%"]

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

    # Фильтрация по наличию и цене (после получения цен из API)
    items = []
    for article, name, brand, category, image_url in rows:
        price_info = prices.get(article, {})
        base_price = price_info.get("base_price", 0)
        discount_price = price_info.get("discount_price", 0)
        amount = price_info.get("amount", "")
        my_price = discount_price or base_price

        if in_stock_only and amount != "В наличии":
            continue
        if price_min and my_price and my_price < price_min:
            continue
        if price_max and my_price and my_price > price_max:
            continue

        # Картинка: из API или из БД
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
        }, ensure_ascii=False),
    }
