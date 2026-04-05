"""
Синхронизация каталога instrument.ru — синхронный режим.
GET ?action=start  — запускает синхронизацию, ждёт результата (таймаут функции: 600 сек).
GET ?action=status — статус последней задачи.
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


def get_conn():
    return psycopg2.connect(
        os.environ["DATABASE_URL"],
        keepalives=1, keepalives_idle=60, keepalives_interval=10, keepalives_count=5
    )


def create_job() -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"INSERT INTO {SCHEMA}.tools_sync_log (status) VALUES ('running') RETURNING id")
    job_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return job_id


def update_job(job_id: int, status: str, imported: int = None, error: str = None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.tools_sync_log SET status=%s, finished_at=NOW(), imported=%s, error=%s WHERE id=%s",
        (status, imported, error, job_id)
    )
    conn.commit()
    cur.close()
    conn.close()


def parse_price(val: str) -> float:
    try:
        return float((val or "").replace(",", ".").replace(" ", "").strip())
    except Exception:
        return 0.0


def run_sync(job_id: int) -> int:
    """Потоковый парсинг CSV + запись батчами через keepalive-соединение."""
    req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
    conn = get_conn()
    cur = conn.cursor()
    total = 0
    batch = []
    CHUNK = 500

    SQL = f"""INSERT INTO {SCHEMA}.tools_products
        (article, name, brand, category, image_url, base_price, my_price, amount, updated_at)
        VALUES %s
        ON CONFLICT (article) DO UPDATE SET
            name=EXCLUDED.name, brand=EXCLUDED.brand, category=EXCLUDED.category,
            image_url=EXCLUDED.image_url, base_price=EXCLUDED.base_price,
            my_price=EXCLUDED.my_price, amount=EXCLUDED.amount, updated_at=NOW()"""
    TPL = "(%s,%s,%s,%s,%s,%s,%s,%s,NOW())"

    with urllib.request.urlopen(req, timeout=400) as resp:
        stream = io.TextIOWrapper(resp, encoding="utf-8-sig", errors="replace")
        reader = csv.DictReader(stream, delimiter=";")
        for row in reader:
            article = (row.get("Код артикула") or "").strip()
            name = (row.get("Название") or "").strip()
            if not article or not name:
                continue
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
            batch.append((article, name, brand, category, image_url, base_price, my_price, amount))
            if len(batch) >= CHUNK:
                psycopg2.extras.execute_values(cur, SQL, batch, template=TPL, page_size=CHUNK)
                conn.commit()
                total += len(batch)
                batch = []

    if batch:
        psycopg2.extras.execute_values(cur, SQL, batch, template=TPL, page_size=CHUNK)
        conn.commit()
        total += len(batch)

    cur.close()
    conn.close()
    return total


def handler(event: dict, context) -> dict:
    """Синхронизация каталога инструментов из CSV-фида instrument.ru."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "status")

    if action == "start":
        job_id = create_job()
        try:
            total = run_sync(job_id)
            update_job(job_id, "done", imported=total)
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "job_id": job_id, "imported": total}),
            }
        except Exception as e:
            update_job(job_id, "error", error=str(e)[:500])
            return {
                "statusCode": 500,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": False, "error": str(e)[:300]}),
            }

    # status
    job_id_param = params.get("job_id")
    conn = get_conn()
    cur = conn.cursor()
    if job_id_param:
        cur.execute(
            f"SELECT id, status, imported, error, started_at, finished_at FROM {SCHEMA}.tools_sync_log WHERE id=%s",
            (job_id_param,)
        )
    else:
        cur.execute(
            f"SELECT id, status, imported, error, started_at, finished_at FROM {SCHEMA}.tools_sync_log ORDER BY id DESC LIMIT 1"
        )
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return {"statusCode": 200, "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"status": "none"})}
    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "job_id": row[0], "status": row[1], "imported": row[2],
            "error": row[3], "started_at": str(row[4]), "finished_at": str(row[5]) if row[5] else None,
        }),
    }
