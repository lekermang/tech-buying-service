"""
Импорт наименований товаров из CSV/YML-фида instrument.ru в БД.
Фид: https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/
Защищён токеном админа.
"""
import json
import os
import base64
import csv
import io
import re
import threading
import xml.etree.ElementTree as ET
import urllib.request
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

FEED_URL = "https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/"

_sync_status = {"running": False, "last": None, "error": None}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def save_rows(rows: list) -> int:
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


def parse_yml(content: bytes) -> list:
    """Парсим YML-фид (Яндекс.Маркет формат)."""
    root = ET.fromstring(content)
    shop = root.find("shop")
    if shop is None:
        raise ValueError("Не найден тег <shop> в YML")

    categories = {}
    for cat in shop.findall(".//category"):
        categories[cat.get("id", "")] = cat.text or ""

    rows = []
    for offer in shop.findall(".//offer"):
        article = offer.findtext("vendorCode", "") or offer.get("id", "")
        name = offer.findtext("name", "") or offer.findtext("model", "")
        brand = offer.findtext("vendor", "")
        cat_id = offer.findtext("categoryId", "")
        category = categories.get(cat_id, "")
        if article and name:
            rows.append((article.strip(), name.strip(), brand.strip(), category.strip()))
    return rows


def parse_csv(content: bytes) -> list:
    """Парсим CSV с автоопределением кодировки и разделителя."""
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("cp1251", errors="replace")

    first_line = text.split("\n")[0]
    delimiter = ";" if first_line.count(";") > first_line.count(",") else ","

    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]

    article_col = next((f for f in fieldnames if f in (
        "article", "vendorcode", "артикул", "код", "artic", "vendor_code", "sku", "id")), None)
    name_col = next((f for f in fieldnames if f in (
        "name", "наименование", "название", "товар", "product", "full_name", "title", "fullname")), None)
    brand_col = next((f for f in fieldnames if f in (
        "brand", "vendor", "бренд", "производитель", "trademark")), None)
    category_col = next((f for f in fieldnames if f in (
        "category", "категория", "раздел", "section", "group", "группа")), None)

    if not article_col or not name_col:
        raise ValueError(f"Нет нужных колонок. Найдено: {fieldnames}")

    rows = []
    for row in reader:
        norm = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        article = norm.get(article_col, "").strip()
        name = norm.get(name_col, "").strip()
        if article and name:
            rows.append((
                article, name,
                norm.get(brand_col, "") if brand_col else "",
                norm.get(category_col, "") if category_col else "",
            ))
    return rows


def do_sync():
    """Скачивает фид и сохраняет в БД."""
    global _sync_status
    _sync_status = {"running": True, "last": None, "error": None}
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read()
            content_type = resp.headers.get("Content-Type", "")

        # Определяем формат по содержимому
        if content[:5] in (b"<?xml", b"<yml_") or b"<yml_catalog" in content[:200] or b"<offer" in content[:500]:
            rows = parse_yml(content)
        else:
            rows = parse_csv(content)

        if not rows:
            raise ValueError("Фид пустой или не удалось распарсить")

        imported = save_rows(rows)
        _sync_status = {"running": False, "last": imported, "error": None}
    except Exception as e:
        _sync_status = {"running": False, "last": None, "error": str(e)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    admin_token = event.get("headers", {}).get("X-Admin-Token", "")
    if admin_token != os.environ.get("ADMIN_TOKEN", ""):
        return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Unauthorized"})}

    method = event.get("httpMethod", "GET")

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
                "has_credentials": True,
                "sync_status": _sync_status,
                "feed_url": FEED_URL,
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

    # Синхронизация с фидом
    if action == "sync":
        if _sync_status.get("running"):
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "running": True, "message": "Уже запущено"}),
            }
        t = threading.Thread(target=do_sync, daemon=True)
        t.start()
        t.join(timeout=25)
        if _sync_status.get("running"):
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "running": True, "message": "Загружаю фид, проверь статус через 30 сек"}),
            }
        if _sync_status.get("error"):
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": False, "error": _sync_status["error"]}),
            }
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "imported": _sync_status.get("last"), "running": False}),
        }

    # Ручная загрузка файла (base64)
    file_b64 = data.get("file", "")
    delimiter = data.get("delimiter", ",")
    if not file_b64:
        return {"statusCode": 400, "headers": CORS_HEADERS, "body": json.dumps({"error": "Нет файла"})}
    try:
        file_bytes = base64.b64decode(file_b64)
        # Определяем формат
        if b"<yml_catalog" in file_bytes[:500] or b"<?xml" in file_bytes[:10]:
            rows = parse_yml(file_bytes)
        else:
            rows = parse_csv(file_bytes)
        imported = save_rows(rows)
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
