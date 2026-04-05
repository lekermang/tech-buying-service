"""
Импорт наименований товаров из CSV в БД.
Принимает base64-файл (CSV) с колонками: article, name, brand, category.
Защищён токеном админа.
"""
import json
import os
import base64
import csv
import io
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    admin_token = event.get("headers", {}).get("X-Admin-Token", "")
    if admin_token != os.environ.get("ADMIN_TOKEN", ""):
        return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Unauthorized"})}

    method = event.get("httpMethod", "GET")

    # GET — статистика по БД
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products")
        count = cur.fetchone()[0]
        cur.execute(f"SELECT article, name, brand, category FROM {SCHEMA}.tools_products ORDER BY article LIMIT 20")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "count": count,
                "preview": [{"article": r[0], "name": r[1], "brand": r[2], "category": r[3]} for r in rows],
            }, ensure_ascii=False),
        }

    # POST — загрузка CSV
    body = event.get("body", "")
    if event.get("isBase64Encoded"):
        body = base64.b64decode(body).decode("utf-8")

    try:
        data = json.loads(body)
    except Exception:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Invalid JSON"})}

    csv_b64 = data.get("file", "")
    delimiter = data.get("delimiter", ",")

    try:
        csv_bytes = base64.b64decode(csv_b64)
        # Пробуем UTF-8, потом cp1251
        try:
            csv_text = csv_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = csv_bytes.decode("cp1251")
    except Exception as e:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": f"Decode error: {e}"})}

    reader = csv.DictReader(io.StringIO(csv_text), delimiter=delimiter)
    # Нормализуем заголовки
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]

    # Ищем колонку article — может быть vendorcode, артикул, article, код
    article_col = next((f for f in fieldnames if f in ("article", "vendorcode", "артикул", "код", "artic")), None)
    name_col = next((f for f in fieldnames if f in ("name", "наименование", "название", "товар", "product")), None)
    brand_col = next((f for f in fieldnames if f in ("brand", "vendor", "бренд", "производитель")), None)
    category_col = next((f for f in fieldnames if f in ("category", "категория", "раздел")), None)

    if not article_col or not name_col:
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": f"Не найдены колонки. Найдены: {fieldnames}. Нужны: article/артикул и name/наименование"
            }),
        }

    rows = []
    for row in reader:
        norm = {f.strip().lower(): v.strip() for f, v in row.items()}
        article = norm.get(article_col, "").strip()
        name = norm.get(name_col, "").strip()
        if not article or not name:
            continue
        rows.append((
            article,
            name,
            norm.get(brand_col, "") if brand_col else "",
            norm.get(category_col, "") if category_col else "",
        ))

    if not rows:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет данных в файле"})}

    conn = get_conn()
    cur = conn.cursor()
    inserted = 0
    for article, name, brand, category in rows:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.tools_products (article, name, brand, category, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (article) DO UPDATE SET name=EXCLUDED.name, brand=EXCLUDED.brand,
                category=EXCLUDED.category, updated_at=NOW()""",
            (article, name, brand, category)
        )
        inserted += 1
    conn.commit()
    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "imported": inserted}, ensure_ascii=False),
    }
