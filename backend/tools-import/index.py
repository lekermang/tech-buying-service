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
import threading
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

# Статус текущей синхронизации (в памяти процесса)
_sync_status = {"running": False, "last": None, "error": None}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def parse_and_save_csv(csv_text: str, delimiter: str = ",") -> int:
    reader = csv.DictReader(io.StringIO(csv_text), delimiter=delimiter)
    fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]

    article_col = next((f for f in fieldnames if f in (
        "article", "vendorcode", "артикул", "код", "artic", "vendor_code", "id", "sku")), None)
    name_col = next((f for f in fieldnames if f in (
        "name", "наименование", "название", "товар", "product", "full_name", "title")), None)
    brand_col = next((f for f in fieldnames if f in (
        "brand", "vendor", "бренд", "производитель", "trademark", "торговая марка")), None)
    category_col = next((f for f in fieldnames if f in (
        "category", "категория", "раздел", "section", "group", "группа")), None)

    if not article_col or not name_col:
        raise ValueError(f"Колонки не найдены. Есть: {fieldnames}. Нужны: article/артикул и name/наименование")

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


def do_sync():
    """Фоновая синхронизация с instrument.ru."""
    global _sync_status
    _sync_status = {"running": True, "last": None, "error": None}

    login = os.environ.get("INSTRUMENT_LOGIN", "")
    password = os.environ.get("INSTRUMENT_PASSWORD", "")

    try:
        if not login or not password:
            raise ValueError("Не заданы INSTRUMENT_LOGIN или INSTRUMENT_PASSWORD")

        cj = http.cookiejar.CookieJar()
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

        # Авторизация
        auth_data = urllib.parse.urlencode({
            "login": login,
            "password": password,
        }).encode("utf-8")
        auth_req = urllib.request.Request(
            f"{INSTRUMENT_BASE}/personal/login/",
            data=auth_data,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"{INSTRUMENT_BASE}/personal/login/",
            },
        )
        with opener.open(auth_req, timeout=20) as resp:
            auth_html = resp.read().decode("utf-8", errors="ignore")

        # Проверяем авторизацию
        if "unloading" not in auth_html and "личный" not in auth_html.lower() and "выйти" not in auth_html.lower():
            # Пробуем перейти на страницу выгрузки напрямую
            check_req = urllib.request.Request(
                f"{INSTRUMENT_BASE}/personal/unloading/",
                headers={"User-Agent": "Mozilla/5.0", "Referer": f"{INSTRUMENT_BASE}/"},
            )
            with opener.open(check_req, timeout=15) as resp:
                check_html = resp.read().decode("utf-8", errors="ignore")
            if "авторизац" in check_html.lower() or "login" in check_html.lower():
                raise ValueError("Авторизация не прошла. Проверь логин и пароль.")

        # Скачиваем CSV
        # Пробуем разные варианты URL выгрузки
        csv_urls = [
            f"{INSTRUMENT_BASE}/personal/unloading/?action=download&type=csv",
            f"{INSTRUMENT_BASE}/personal/unloading/?download=csv",
            f"{INSTRUMENT_BASE}/export/csv/",
            f"{INSTRUMENT_BASE}/personal/unloading/",
        ]

        csv_bytes = None
        for csv_url in csv_urls:
            try:
                csv_req = urllib.request.Request(
                    csv_url,
                    headers={
                        "User-Agent": "Mozilla/5.0",
                        "Referer": f"{INSTRUMENT_BASE}/personal/unloading/",
                        "Accept": "text/csv,application/csv,text/plain,*/*",
                    },
                )
                with opener.open(csv_req, timeout=60) as resp:
                    content_type = resp.headers.get("Content-Type", "")
                    content_disp = resp.headers.get("Content-Disposition", "")
                    data = resp.read()
                    # Если это CSV-файл или скачивание
                    if "csv" in content_type.lower() or "attachment" in content_disp.lower() or (len(data) > 1000 and b"\n" in data[:500]):
                        csv_bytes = data
                        break
            except Exception:
                continue

        if not csv_bytes:
            raise ValueError(
                "Не удалось скачать CSV. Возможно, URL выгрузки изменился. "
                "Попробуй загрузить файл вручную с https://instrument.ru/personal/unloading/"
            )

        # Декодируем
        try:
            csv_text = csv_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            csv_text = csv_bytes.decode("cp1251", errors="replace")

        # Определяем разделитель
        first_line = csv_text.split("\n")[0]
        delimiter = ";" if first_line.count(";") > first_line.count(",") else ","

        imported = parse_and_save_csv(csv_text, delimiter)
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
    params = event.get("queryStringParameters") or {}

    # GET — статистика + статус синхронизации
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
                "has_credentials": bool(os.environ.get("INSTRUMENT_LOGIN") and os.environ.get("INSTRUMENT_PASSWORD")),
                "sync_status": _sync_status,
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

    # Отладка — найти ссылки на странице выгрузки
    if action == "debug":
        login = os.environ.get("INSTRUMENT_LOGIN", "")
        password = os.environ.get("INSTRUMENT_PASSWORD", "")
        try:
            cj = http.cookiejar.CookieJar()
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
            auth_data = urllib.parse.urlencode({"login": login, "password": password}).encode("utf-8")
            auth_req = urllib.request.Request(
                f"{INSTRUMENT_BASE}/personal/login/",
                data=auth_data,
                headers={"User-Agent": "Mozilla/5.0", "Content-Type": "application/x-www-form-urlencoded", "Referer": f"{INSTRUMENT_BASE}/personal/login/"},
            )
            with opener.open(auth_req, timeout=20) as resp:
                resp.read()
            page_req = urllib.request.Request(
                f"{INSTRUMENT_BASE}/personal/unloading/",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with opener.open(page_req, timeout=20) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            # Ищем все ссылки с href
            import re
            links = re.findall(r'href=["\']([^"\']*(?:csv|xls|yml|download|export|unload)[^"\']*)["\']', html, re.I)
            # Первые 2000 символов HTML для диагностики
            snippet = html[:3000]
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"links": links, "snippet": snippet}, ensure_ascii=False),
            }
        except Exception as e:
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": json.dumps({"error": str(e)})}

    # Запуск синхронизации в фоне
    if action == "sync":
        if _sync_status.get("running"):
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "running": True, "message": "Синхронизация уже запущена"}),
            }
        t = threading.Thread(target=do_sync, daemon=True)
        t.start()
        # Ждём до 25 секунд — если успело, отдаём результат
        t.join(timeout=25)
        if _sync_status.get("running"):
            return {
                "statusCode": 200,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"ok": True, "running": True, "message": "Синхронизация запущена, это займёт до минуты. Обнови страницу через 30 секунд."}),
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

    # Ручная загрузка CSV
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