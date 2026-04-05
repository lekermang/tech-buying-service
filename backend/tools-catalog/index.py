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
    """Каталог инструментов: список товаров с ценами, фильтрами, подкатегориями и сортировкой."""
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
    sort = params.get("sort", "popular")
    order_by = SORT_MAP.get(sort, SORT_MAP["popular"])

    conn = get_conn()
    cur = conn.cursor()

    if action == "meta":
        # Топ-категории с кол-вом товаров
        cur.execute(
            f"""SELECT split_part(category, '/', 1) as top_cat, COUNT(*) as cnt
                FROM {SCHEMA}.tools_products
                WHERE category IS NOT NULL AND category != ''
                GROUP BY top_cat ORDER BY top_cat"""
        )
        top_cats = [{"name": r[0], "count": r[1]} for r in cur.fetchall()]

        # Подкатегории (2-й уровень)
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

        # Бренды с кол-вом
        cur.execute(
            f"""SELECT brand, COUNT(*) as cnt FROM {SCHEMA}.tools_products
                WHERE brand IS NOT NULL AND brand != ''
                GROUP BY brand ORDER BY cnt DESC LIMIT 100"""
        )
        brands = [{"name": r[0], "count": r[1]} for r in cur.fetchall()]

        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "categories": top_cats,
                "subcategories": subcats,
                "brands": brands,
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
    if in_stock_only:
        conditions.append("amount = 'В наличии'")

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
