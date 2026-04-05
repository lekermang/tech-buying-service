"""
Импорт наименований товаров из CSV в БД.
Поддерживает: ручную загрузку CSV (base64) и автосинхронизацию с instrument.ru.
Защищён токеном админа.
"""
import json
import os
import base64
import csv
import io
import urllib.request
import urllib.parse
import http.cookiejar
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

INSTRUMENT_BASE = "https://instrument.ru"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def parse_and_save_csv(csv_text: str, delimiter: str = ",") -> int:
    reader = csv.DictReader(io.StringIO(csv_text), delimiter=delimiter)
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]

    article_col = next((f for f in fieldnames if f in ("article", "vendorcode", "артикул", "код", "artic", "vendor_code")), None)
    name_col = next((f for f in fieldnames if f in ("name", "наименование", "название", "товар", "product", "full_name")), None)
    brand_col = next((f for f in fieldnames if f in ("brand", "vendor", "бренд", "производитель", "trademark")), None)
    category_col = next((f for f in fieldnames if f in ("category", "категория", "раздел", "section")), None)

    if not article_col or not name_col:
        raise ValueError(f"Колонки не найдены. Есть: {fieldnames}")

    rows = []
    for row in reader:
        norm = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        article = norm.get(article_col, "").strip()
        name = norm.get(name_col, "").strip()
        if not article or not name:
            continue
        rows.append((
            article, name,
            norm.get(brand_col, "") if brand_col else "",
            norm.get(category_col, "") if category_col else "",
        ))

    if not rows:
        raise ValueError("Файл пуст или не содержит данных")

    conn = get_conn()
    cur = conn.cursor()
    for article, name, brand, category in rows:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.tools_products (article, name, brand, category, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (article) DO UPDATE SET name=EXCLUDED.name, brand=EXCLUDED.brand,
                category=EXCLUDED.category, updated_at=NOW()""",
            (article, name, brand, category),
        )
    conn.commit()
    cur.close()
    conn.close()
    return len(rows)


def sync_from_instrument() -> dict:
    """Логинится на instrument.ru и скачивает полный CSV-каталог."""
    login = os.environ.get("INSTRUMENT_LOGIN", "")
    password = os.environ.get("INSTRUMENT_PASSWORD", "")
    if not login or not password:
        raise ValueError("Не заданы INSTRUMENT_LOGIN или INSTRUMENT_PASSWORD")

    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    # Шаг 1 — получаем страницу логина для CSRF
    req = urllib.request.Request(
        f"{INSTRUMENT_BASE}/personal/login/",
        headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"},
    )
    with opener.open(req, timeout=15) as resp:
        html = resp.read().decode("utf-8", errors="ignore")

    # Шаг 2 — авторизация
    auth_data = urllib.parse.urlencode({
        "login": login,
        "password": password,
        "remember": "on",
    }).encode("utf-8")
    auth_req = urllib.request.Request(
        f"{INSTRUMENT_BASE}/personal/login/",
        data=auth_data,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": f"{INSTRUMENT_BASE}/personal/login/",
        },
    )
    with opener.open(auth_req, timeout=15) as resp:
        pass

    # Шаг 3 — скачиваем полный CSV
    csv_url = f"{INSTRUMENT_BASE}/personal/unloading/?action=download&type=csv&brand=all"
    csv_req = urllib.request.Request(
        csv_url,
        headers={"User-Agent": "Mozilla/5.0", "Referer": f"{INSTRUMENT_BASE}/personal/unloading/"},
    )
    with opener.open(csv_req, timeout=60) as resp:
        csv_bytes = resp.read()
        content_type = resp.headers.get("Content-Type", "")

    # Определяем кодировку
    if b"," in csv_bytes[:100] or b";" in csv_bytes[:100]:
        try:
            csv_text = csv_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = csv_bytes.decode("cp1251", errors="replace")
    else:
        raise ValueError(f"Неожиданный ответ от сервера ({len(csv_bytes)} байт). Возможно, авторизация не прошла.")

    # Определяем разделитель
    first_line = csv_text.split("\n")[0]
    delimiter = ";" if first_line.count(";") > first_line.count(",") else ","

    imported = parse_and_save_csv(csv_text, delimiter)
    return {"imported": imported, "bytes": len(csv_bytes)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    admin_token = event.get("headers", {}).get("X-Admin-Token", "")
    if admin_token != os.environ.get("ADMIN_TOKEN", ""):
        return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Unauthorized"})}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    # GET — статистика
    if method == "GET":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.tools_products")
        count = cur.fetchone()[0]
        cur.execute(f"SELECT article, name, brand, category FROM {SCHEMA}.tools_products ORDER BY updated_at DESC LIMIT 20")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "count": count,
                "preview": [{"article": r[0], "name": r[1], "brand": r[2], "category": r[3]} for r in rows],
                "has_credentials": bool(os.environ.get("INSTRUMENT_LOGIN")),
            }, ensure_ascii=False),
        }

    # POST
    body_raw = event.get("body", "") or ""
    if event.get("isBase64Encoded"):
        body_raw = base64.b64decode(body_raw).decode("utf-8")

    try:
        data = json.loads(body_raw) if body_raw else {}
    except Exception:
        data = {}

    action = data.get("action", "upload")

    # Автосинхронизация с instrument.ru
    if action == "sync":
        try:
            result = sync_from_instrument()
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, **result}, ensure_ascii=False),
            }
        except Exception as e:
            return {
                "statusCode": 500,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": str(e)}),
            }

    # Ручная загрузка CSV (base64)
    csv_b64 = data.get("file", "")
    delimiter = data.get("delimiter", ",")

    if not csv_b64:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет файла"})}

    try:
        csv_bytes = base64.b64decode(csv_b64)
        try:
            csv_text = csv_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = csv_bytes.decode("cp1251")
        imported = parse_and_save_csv(csv_text, delimiter)
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "imported": imported}, ensure_ascii=False),
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e)}),
        }
