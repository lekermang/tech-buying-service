"""
Асинхронная синхронизация каталога instrument.ru.
POST — запускает фоновый поток, сразу возвращает job_id.
GET  — возвращает статус по job_id из БД.
Фид 200МБ парсится потоково через iterparse.
"""
import json
import os
import threading
import xml.etree.ElementTree as ET
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


def do_sync(job_id: int):
    """Фоновый поток: скачивает и парсит фид, обновляет статус в БД."""
    try:
        req = urllib.request.Request(FEED_URL, headers={"User-Agent": "Mozilla/5.0"})
        conn = get_conn()
        cur = conn.cursor()
        categories = {}
        total = 0
        batch = []

        with urllib.request.urlopen(req, timeout=300) as resp:
            for event, elem in ET.iterparse(resp, events=("end",)):
                if elem.tag == "category":
                    categories[elem.get("id", "")] = elem.text or ""
                    elem.clear()
                elif elem.tag == "offer":
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
        update_job(job_id, "done", imported=total)
    except Exception as e:
        update_job(job_id, "error", error=str(e))


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    if not check_token(event):
        return {"statusCode": 401, "headers": CORS_HEADERS, "body": json.dumps({"error": "Unauthorized"})}

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