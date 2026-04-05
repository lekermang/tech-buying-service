"""
Импорт каталога инструментов из CSV-файла в S3 папке tools/.
GET  — листает файлы в S3 tools/ и показывает статистику БД
POST ?action=import_s3 — читает CSV из S3 и загружает в tools_products с картинками
POST ?action=upload — ручная загрузка base64-файла
"""
import json
import os
import base64
import csv
import io
import boto3
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def list_s3_tools():
    """Возвращает список файлов в S3 папке tools/"""
    s3 = get_s3()
    resp = s3.list_objects_v2(Bucket="files", Prefix="tools/")
    files = []
    for obj in resp.get("Contents", []):
        files.append({
            "key": obj["Key"],
            "size": obj["Size"],
            "modified": str(obj["LastModified"]),
        })
    return files


def parse_csv_bytes(content: bytes) -> list:
    """Парсит CSV — возвращает список (article, name, brand, category, image_url)"""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("cp1251", errors="replace")

    first_line = text.split("\n")[0]
    delimiter = ";" if first_line.count(";") > first_line.count(",") else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    fieldnames = reader.fieldnames or []

    # Ищем нужные колонки без учёта регистра
    fn_lower = {f.strip().lower(): f for f in fieldnames}

    def find_col(*variants):
        for v in variants:
            if v in fn_lower:
                return fn_lower[v]
        return None

    article_col = find_col("код артикула", "артикул", "article", "vendorcode", "sku", "id", "код")
    name_col = find_col("название", "наименование", "name", "товар", "product", "title")
    brand_col = find_col("бренд", "brand", "vendor", "производитель")
    category_col = find_col("раздел", "категория", "category", "группа")
    image_col = find_col("изображения", "image", "фото", "картинка", "photo", "img", "images")

    if not article_col or not name_col:
        raise ValueError(f"Не найдены колонки артикула/названия. Есть: {fieldnames[:10]}")

    rows = []
    for row in reader:
        article = (row.get(article_col) or "").strip()
        name = (row.get(name_col) or "").strip()
        if not article or not name:
            continue
        brand = (row.get(brand_col) or "").strip() if brand_col else ""
        category = (row.get(category_col) or "").strip() if category_col else ""
        image_url = (row.get(image_col) or "").strip() if image_col else ""
        rows.append((article, name, brand, category, image_url))
    return rows


def save_rows(rows: list) -> int:
    conn = get_conn()
    cur = conn.cursor()
    for article, name, brand, category, image_url in rows:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.tools_products (article, name, brand, category, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (article) DO UPDATE SET
                    name=EXCLUDED.name,
                    brand=EXCLUDED.brand,
                    category=EXCLUDED.category,
                    updated_at=NOW()""",
            (article, name, brand, category),
        )
    conn.commit()
    cur.close()
    conn.close()
    return len(rows)


def handler(event: dict, context) -> dict:
    """Импорт каталога инструментов из S3 или base64-файла"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # GET — показываем файлы в S3 и статистику БД
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products")
        count = cur.fetchone()[0]
        cur.execute(f"SELECT article, name, brand, category FROM {SCHEMA}.tools_products ORDER BY updated_at DESC LIMIT 5")
        preview = [{"article": r[0], "name": r[1], "brand": r[2], "category": r[3]} for r in cur.fetchall()]
        cur.close()
        conn.close()

        try:
            s3_files = list_s3_tools()
        except Exception as e:
            s3_files = [{"error": str(e)}]

        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"count": count, "preview": preview, "s3_files": s3_files}, ensure_ascii=False),
        }

    # POST
    body_raw = event.get("body", "") or ""
    if event.get("isBase64Encoded"):
        body_raw = base64.b64decode(body_raw).decode("utf-8")
    try:
        data = json.loads(body_raw) if body_raw else {}
    except Exception:
        data = {}

    action = data.get("action", action or "import_s3")

    # Импорт из S3
    if action == "import_s3":
        s3 = get_s3()
        s3_key = data.get("key")  # конкретный файл или берём первый
        if not s3_key:
            resp = s3.list_objects_v2(Bucket="files", Prefix="tools/")
            csv_files = [o["Key"] for o in resp.get("Contents", []) if o["Key"].lower().endswith(".csv")]
            if not csv_files:
                return {
                    "statusCode": 404,
                    "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                    "body": json.dumps({"error": "CSV файлы не найдены в S3 папке tools/"}, ensure_ascii=False),
                }
            s3_key = csv_files[0]

        obj = s3.get_object(Bucket="files", Key=s3_key)
        content = obj["Body"].read()
        rows = parse_csv_bytes(content)
        imported = save_rows(rows)

        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "imported": imported, "key": s3_key}, ensure_ascii=False),
        }

    # Ручная загрузка base64
    if action == "upload":
        file_b64 = data.get("file", "")
        if not file_b64:
            return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет файла"})}
        file_bytes = base64.b64decode(file_b64)
        rows = parse_csv_bytes(file_bytes)
        imported = save_rows(rows)
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "imported": imported}, ensure_ascii=False),
        }

    return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Неизвестный action"})}
