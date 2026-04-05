"""
Каталог инструментов: товары из БД tools_products (цены и картинки из CSV-фида).
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Каталог инструментов: список товаров с ценами, фильтрами и поиском."""
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
    if in_stock_only:
        conditions.append("amount = 'В наличии'")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products {where}", args)
    total = cur.fetchone()[0]

    cur.execute(
        f"SELECT article, name, brand, category, image_url, base_price, my_price, amount "
        f"FROM {SCHEMA}.tools_products {where} ORDER BY category, name LIMIT %s OFFSET %s",
        args + [limit, offset]
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    items = []
    for article, name, brand, category, image_url, base_price, my_price, amount in rows:
        bp = float(base_price or 0)
        mp = float(my_price or 0)
        items.append({
            "article": article,
            "name": name,
            "brand": brand or "",
            "category": category or "",
            "base_price": bp,
            "discount_price": mp,
            "amount": amount or "",
            "image_url": image_url or "",
            "is_hit": False,
            "is_new": False,
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
