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

SORT_MAP = {
    "price_asc":  "my_price ASC NULLS LAST",
    "price_desc": "my_price DESC NULLS LAST",
    "name_asc":   "name ASC",
    "popular":    "category, name",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Каталог инструментов: товары с расширенными фильтрами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "products")
    limit = min(int(params.get("limit", 48)), 200)
    offset = int(params.get("offset", 0))
    search = params.get("search", "").strip()
    category_filter = params.get("category", "").strip()
    subcategory_filter = params.get("subcategory", "").strip()
    brand_filter = params.get("brand", "").strip()
    in_stock_only = params.get("in_stock", "") == "1"
    amount_filter = params.get("amount", "").strip()
    price_min = params.get("price_min", "").strip()
    price_max = params.get("price_max", "").strip()
    has_image = params.get("has_image", "").strip()
    sort = params.get("sort", "popular")
    order_by = SORT_MAP.get(sort, SORT_MAP["popular"])

    conn = get_conn()
    cur = conn.cursor()

    if action == "meta":
        cur.execute(
            f"""SELECT split_part(category, '/', 1) as top_cat, COUNT(*) as cnt
                FROM {SCHEMA}.tools_products
                WHERE category IS NOT NULL AND category != ''
                GROUP BY top_cat ORDER BY top_cat"""
        )
        top_cats = [{"name": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.execute(
            f"""SELECT split_part(category, '/', 1) as top, split_part(category, '/', 2) as sub, COUNT(*) as cnt
                FROM {SCHEMA}.tools_products
                WHERE category IS NOT NULL AND category != '' AND position('/' in category) > 0
                GROUP BY top, sub ORDER BY top, sub"""
        )
        subcats: dict = {}
        for top, sub, cnt in cur.fetchall():
            if sub:
                subcats.setdefault(top, []).append({"name": sub, "count": cnt})

        cur.execute(
            f"""SELECT brand, COUNT(*) as cnt FROM {SCHEMA}.tools_products
                WHERE brand IS NOT NULL AND brand != ''
                GROUP BY brand ORDER BY cnt DESC LIMIT 100"""
        )
        brands = [{"name": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.execute(
            f"""SELECT amount, COUNT(*) as cnt FROM {SCHEMA}.tools_products
                WHERE amount IS NOT NULL AND amount != ''
                GROUP BY amount ORDER BY cnt DESC"""
        )
        amounts = [{"name": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.execute(
            f"""SELECT
                COUNT(CASE WHEN my_price > 0 AND my_price < 500 THEN 1 END),
                COUNT(CASE WHEN my_price >= 500 AND my_price < 1000 THEN 1 END),
                COUNT(CASE WHEN my_price >= 1000 AND my_price < 3000 THEN 1 END),
                COUNT(CASE WHEN my_price >= 3000 AND my_price < 10000 THEN 1 END),
                COUNT(CASE WHEN my_price >= 10000 AND my_price < 50000 THEN 1 END),
                COUNT(CASE WHEN my_price >= 50000 THEN 1 END),
                MIN(CASE WHEN my_price > 0 THEN my_price END),
                MAX(my_price)
            FROM {SCHEMA}.tools_products"""
        )
        pr = cur.fetchone()
        price_ranges = [
            {"label": "до 500 ₽",          "min": 0,     "max": 499,   "count": pr[0]},
            {"label": "500 — 1 000 ₽",     "min": 500,   "max": 999,   "count": pr[1]},
            {"label": "1 000 — 3 000 ₽",   "min": 1000,  "max": 2999,  "count": pr[2]},
            {"label": "3 000 — 10 000 ₽",  "min": 3000,  "max": 9999,  "count": pr[3]},
            {"label": "10 000 — 50 000 ₽", "min": 10000, "max": 49999, "count": pr[4]},
            {"label": "от 50 000 ₽",       "min": 50000, "max": None,  "count": pr[5]},
        ]

        cur.execute(
            f"SELECT COUNT(*) FROM {SCHEMA}.tools_products WHERE image_url IS NOT NULL AND image_url != ''"
        )
        with_image_cnt = cur.fetchone()[0]

        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "categories": top_cats,
                "subcategories": subcats,
                "brands": brands,
                "amounts": amounts,
                "price_ranges": price_ranges,
                "price_min": float(pr[6] or 0),
                "price_max": float(pr[7] or 0),
                "with_image_count": with_image_cnt,
            }, ensure_ascii=False),
        }

    # products
    conditions = []
    args = []
    if search:
        conditions.append("(article ILIKE %s OR name ILIKE %s)")
        args += [f"%{search}%", f"%{search}%"]
    if subcategory_filter:
        conditions.append("(split_part(category, '/', 1) = %s AND split_part(category, '/', 2) = %s)")
        args += [category_filter or subcategory_filter, subcategory_filter]
    elif category_filter:
        conditions.append("split_part(category, '/', 1) = %s")
        args.append(category_filter)
    if brand_filter:
        conditions.append("brand ILIKE %s")
        args.append(f"%{brand_filter}%")
    if amount_filter:
        conditions.append("amount = %s")
        args.append(amount_filter)
    elif in_stock_only:
        conditions.append("amount = 'В наличии'")
    if price_min:
        conditions.append("my_price >= %s")
        args.append(float(price_min))
    if price_max:
        conditions.append("my_price <= %s AND my_price > 0")
        args.append(float(price_max))
    if has_image == "1":
        conditions.append("image_url IS NOT NULL AND image_url != ''")

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products {where}", args)
    total = cur.fetchone()[0]

    cur.execute(
        f"""SELECT article, name, brand, category, image_url, base_price, my_price, amount
            FROM {SCHEMA}.tools_products {where}
            ORDER BY {order_by} LIMIT %s OFFSET %s""",
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
