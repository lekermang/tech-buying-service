"""
Синхронизация каталога instrument.ru — постраничный режим.
Каждый вызов ?action=sync_chunk&offset=N обрабатывает 500 строк из CSV.
Укладывается в 30 сек таймаут.
"""
import csv
import io
import json
import os
import urllib.request
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
FEED_URL = "https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/"
CHUNK_SIZE = 500


def get_conn():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        keepalives=1, keepalives_idle=30, keepalives_interval=5, keepalives_count=3
    )


def parse_price(val: str) -> float:
    try:
        return float((val or "").replace(",", ".").replace(" ", "").strip())
    except Exception:
        return 0.0


def upsert_batch(batch: list):
    if not batch:
        return
    conn = get_conn()
    cur = conn.cursor()
    psycopg2.extras.execute_values(
        cur,
        f"""INSERT INTO {SCHEMA}.tools_products
            (article, name, brand, category, image_url, base_price, my_price, amount, updated_at)
            VALUES %s
            ON CONFLICT (article) DO UPDATE SET
                name=EXCLUDED.name, brand=EXCLUDED.brand, category=EXCLUDED.category,
                image_url=EXCLUDED.image_url, base_price=EXCLUDED.base_price,
                my_price=EXCLUDED.my_price, amount=EXCLUDED.amount, updated_at=NOW()""",
        batch,
        template="(%s,%s,%s,%s,%s,%s,%s,%s,NOW())",
        page_size=CHUNK_SIZE
    )
    conn.commit()
    cur.close()
    conn.close()


def parse_row(row: dict):
    article = (row.get("Код артикула") or "").strip()
    name = (row.get("Название") or "").strip()
    if not article or not name:
        return None
    brand = (row.get("Бренд") or "").strip()
    category = (row.get("Раздел") or "").strip()
    base_price = parse_price(row.get("Базовая цена") or row.get("Розничная цена") or "")
    my_price = parse_price(row.get("Ваша цена") or "")
    amount = (row.get("Статус") or "").strip()
    image_url = ""
    for key, val in row.items():
        if key and "изображени" in key.lower() and val and val.strip().startswith("http"):
            image_url = val.strip()
            break
    return (article, name, brand, category, image_url, base_price, my_price, amount)


def handler(event: dict, context) -> dict:
    """Постраничная синхронизация каталога инструментов из CSV-фида."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "status")

    # Один чанк: скачиваем CSV, пропускаем offset строк, берём CHUNK_SIZE
    if action == "sync_chunk":
        offset = int(params.get("offset", 0))
        req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
        batch = []
        has_more = False
        total_seen = 0

        with urllib.request.urlopen(req, timeout=60) as resp:
            stream = io.TextIOWrapper(resp, encoding="utf-8-sig", errors="replace")
            reader = csv.DictReader(stream, delimiter=";")
            for row in reader:
                parsed = parse_row(row)
                if parsed is None:
                    continue
                if total_seen < offset:
                    total_seen += 1
                    continue
                if len(batch) < CHUNK_SIZE:
                    batch.append(parsed)
                    total_seen += 1
                else:
                    has_more = True
                    break

        upsert_batch(batch)
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "ok": True,
                "offset": offset,
                "saved": len(batch),
                "has_more": has_more,
                "next_offset": offset + len(batch) if has_more else None,
            }),
        }

    # status — сколько товаров в БД
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""SELECT COUNT(*),
            COUNT(CASE WHEN my_price > 0 THEN 1 END),
            COUNT(CASE WHEN image_url != '' AND image_url IS NOT NULL THEN 1 END)
        FROM {SCHEMA}.tools_products"""
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"total": row[0], "with_price": row[1], "with_image": row[2]}),
    }
