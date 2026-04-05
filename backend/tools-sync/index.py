"""
Фоновая синхронизация каталога instrument.ru.
Скачивает YML-фид потоково (200МБ+), парсит и сохраняет в БД порциями.
Вызывается из админки — не требует передачи файла через браузер.
"""
import json
import os
import xml.etree.ElementTree as ET
import urllib.request
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token, X-User-Id",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
FEED_URL = "https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/"
BATCH_SIZE = 500


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def save_batch(cur, batch: list):
    for article, name, brand, category in batch:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.tools_products (article, name, brand, category, updated_at)
                VALUES (%s, %s, %s, %s, NOW())
                ON CONFLICT (article) DO UPDATE
                SET name=EXCLUDED.name, brand=EXCLUDED.brand,
                    category=EXCLUDED.category, updated_at=NOW()""",
            (article, name, brand, category),
        )


def stream_parse_yml(url: str) -> dict:
    """
    Потоковый парсинг YML через iterparse — не грузит весь файл в память.
    Возвращает статистику.
    """
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    conn = get_conn()
    cur = conn.cursor()

    categories = {}
    total = 0
    batch = []

    with urllib.request.urlopen(req, timeout=120) as resp:
        context = ET.iterparse(resp, events=("end",))
        for event, elem in context:
            tag = elem.tag

            if tag == "category":
                categories[elem.get("id", "")] = elem.text or ""
                elem.clear()

            elif tag == "offer":
                article = (elem.findtext("vendorCode") or elem.get("id", "")).strip()
                name = (elem.findtext("name") or elem.findtext("model") or "").strip()
                brand = (elem.findtext("vendor") or "").strip()
                cat_id = (elem.findtext("categoryId") or "").strip()
                category = categories.get(cat_id, "").strip()

                if article and name:
                    batch.append((article, name, brand, category))
                    if len(batch) >= BATCH_SIZE:
                        save_batch(cur, batch)
                        conn.commit()
                        total += len(batch)
                        batch = []

                elem.clear()

    if batch:
        save_batch(cur, batch)
        conn.commit()
        total += len(batch)

    cur.close()
    conn.close()
    return {"imported": total}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    headers = event.get("headers", {})
    params = event.get("queryStringParameters") or {}
    admin_token = (
        headers.get("X-Admin-Token") or
        headers.get("x-admin-token") or
        params.get("token") or ""
    )
    if admin_token != os.environ.get("ADMIN_TOKEN", ""):
        return {
            "statusCode": 401,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Unauthorized"}),
        }

    try:
        result = stream_parse_yml(FEED_URL)
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, **result}, ensure_ascii=False),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": False, "error": str(e)}),
        }