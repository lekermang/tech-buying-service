"""
Асинхронная синхронизация каталога instrument.ru.
POST — запускает фоновый поток, сразу возвращает job_id.
GET  — возвращает статус по job_id из БД.
Фид в формате CSV (разделитель ;), парсится построчно.
"""
import json
import os
import threading
import csv
import io
import urllib.request
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
FEED_URL = "https://instrument.ru/api/personalFeed/5492bff915789200fc2d54a3fca417cd/"
BATCH_SIZE = 500


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def check_token(event: dict) -> bool:
    headers = event.get("headers", {})
    params = event.get("queryStringParameters") or {}
    token = (
        headers.get("X-Admin-Token") or
        headers.get("x-admin-token") or
        params.get("token") or ""
    )
    return token == os.environ.get("ADMIN_TOKEN", "")


def create_job() -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.tools_sync_log (status) VALUES ('running') RETURNING id"
    )
    job_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return job_id


def update_job(job_id: int, status: str, imported: int = None, error: str = None):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"""UPDATE {SCHEMA}.tools_sync_log
            SET status=%s, finished_at=NOW(), imported=%s, error=%s
            WHERE id=%s""",
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


def save_batch(cur, batch: list):
    for article, name, brand, category, image_url, base_price, my_price, amount in batch:
        cur.execute(
            f"""INSERT INTO {SCHEMA}.tools_products
                (article, name, brand, category, image_url, base_price, my_price, amount, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (article) DO UPDATE
                SET name=EXCLUDED.name, brand=EXCLUDED.brand, category=EXCLUDED.category,
                    image_url=EXCLUDED.image_url, base_price=EXCLUDED.base_price,
                    my_price=EXCLUDED.my_price, amount=EXCLUDED.amount, updated_at=NOW()""",
            (article, name, brand, category, image_url, base_price, my_price, amount),
        )


def do_sync(job_id: int):
    """Фоновый поток: скачивает CSV-фид, парсит цены/картинки/остатки, сохраняет в БД."""
    try:
        req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
        conn = get_conn()
        cur = conn.cursor()
        total = 0
        batch = []

        with urllib.request.urlopen(req, timeout=300) as resp:
            stream = io.TextIOWrapper(resp, encoding="utf-8-sig", errors="replace")
            reader = csv.DictReader(stream, delimiter=";")
            for row in reader:
                article = (row.get("Код артикула") or "").strip()
                name = (row.get("Название") or "").strip()
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
                if article and name:
                    batch.append((article, name, brand, category, image_url, base_price, my_price, amount))
                    if len(batch) >= BATCH_SIZE:
                        save_batch(cur, batch)
                        conn.commit()
                        total += len(batch)
                        batch = []

        if batch:
            save_batch(cur, batch)
            conn.commit()
            total += len(batch)

        cur.close()
        conn.close()
        update_job(job_id, "done", imported=total)
    except Exception as e:
        update_job(job_id, "error", error=str(e) or repr(e))


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    # GET ?action=start — запуск синхронизации
    if action == "start":
        job_id = create_job()
        t = threading.Thread(target=do_sync, args=(job_id,), daemon=False)
        t.start()
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"ok": True, "job_id": job_id}),
        }

    # GET — статус задачи
    if method == "GET":
        job_id = params.get("job_id")
        conn = get_conn()
        cur = conn.cursor()
        if job_id:
            cur.execute(
                f"SELECT id, status, imported, error, started_at, finished_at FROM {SCHEMA}.tools_sync_log WHERE id=%s",
                (job_id,)
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
                "job_id": row[0], "status": row[1],
                "imported": row[2], "error": row[3],
                "started_at": str(row[4]) if row[4] else None,
                "finished_at": str(row[5]) if row[5] else None,
            }),
        }

    # POST или GET с action=start — запускаем задачу
    job_id = create_job()
    t = threading.Thread(target=do_sync, args=(job_id,), daemon=False)
    t.start()
    # Ждём 2 секунды — если уже готово, возвращаем результат сразу
    t.join(timeout=2)

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({"ok": True, "job_id": job_id, "message": "Синхронизация запущена"}),
    }