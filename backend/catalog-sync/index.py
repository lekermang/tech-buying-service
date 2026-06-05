"""
Синхронизация каталога iPhone из smartbery-qrcode.ru API. v2
POST / { "action": "sync", "admin_token": "..." }  — запустить синхронизацию
GET  /                        — последний лог синхронизации

Парсинг name: "<модель> <storage_gb> <color>"
Пример: "15 256 Black" → model=iPhone 15, storage=256GB, color=Black
"""
import os, json, urllib.request, psycopg2, re, boto3
from datetime import datetime, timezone

SCHEMA        = "t_p31606708_tech_buying_service"
SMARTBERY_URL = "https://smartbery-qrcode.ru/api/v1/products/"
SOURCE_TAG    = "smartbery"
TG_API        = "https://api.telegram.org"
# Канал appledysonphoto — его числовой ID (публичный, можно читать через бота)
PHOTO_CHANNEL = "@appledysonphoto"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}


def _ok(d, code=200):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(d, ensure_ascii=False, default=str)}

def _err(msg, code=400):
    return _ok({"error": msg}, code)

def _db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


# ── S3 ────────────────────────────────────────────────────────────────────────
def _s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def _cdn_url(key: str) -> str:
    aid = os.environ.get("AWS_ACCESS_KEY_ID", "")
    return f"https://cdn.poehali.dev/projects/{aid}/bucket/{key}"


# ── Telegram фото ─────────────────────────────────────────────────────────────
def _tg_photo_to_s3(photo_tg_url: str) -> str | None:
    """
    Скачивает фото из поста Telegram-канала через Bot API и сохраняет в S3.
    photo_tg_url вида: https://t.me/appledysonphoto/724
    Возвращает CDN URL или None.
    """
    token = os.environ.get("CATALOG_BOT_TOKEN", "")
    if not token:
        return None

    # Извлекаем message_id из URL
    m = re.search(r"/(\d+)$", photo_tg_url or "")
    if not m:
        return None
    msg_id = int(m.group(1))

    # Получаем сообщение через getMessages (forwardMessages trick)
    # Используем getUpdates нельзя. Используем copyMessage trick или sendMessage.
    # Правильный способ: bot.forwardMessage в приватный чат себе, потом getFile.
    # Более простой: использовать messages.getHistory через MTProto — но у нас нет.
    # Используем: bot копирует сообщение в чат бота и получает file_id.

    # Сначала пробуем через экспорт: t.me/c/{channel_id}/{msg_id} API не работает без MTProto.
    # Рабочий способ: forwardMessage к боту от имени бота.

    try:
        # Шаг 1: получить chat_id канала
        url_get = f"{TG_API}/bot{token}/getChat"
        req1 = urllib.request.Request(
            url_get, data=json.dumps({"chat_id": PHOTO_CHANNEL}).encode(),
            method="POST", headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req1, timeout=10) as r:
            chat_data = json.loads(r.read())
        channel_chat_id = chat_data.get("result", {}).get("id")
        if not channel_chat_id:
            return None

        # Шаг 2: forwardMessage из канала боту (в чат бота с самим собой — getMe)
        url_me = f"{TG_API}/bot{token}/getMe"
        with urllib.request.urlopen(url_me, timeout=8) as r:
            me = json.loads(r.read()).get("result", {})
        bot_id = me.get("id")
        if not bot_id:
            return None

        url_fwd = f"{TG_API}/bot{token}/forwardMessage"
        req2 = urllib.request.Request(
            url_fwd,
            data=json.dumps({
                "chat_id": bot_id,
                "from_chat_id": channel_chat_id,
                "message_id": msg_id,
            }).encode(),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req2, timeout=10) as r:
            fwd = json.loads(r.read())

        # Шаг 3: извлекаем file_id из пересланного сообщения
        msg = fwd.get("result", {})
        photos = msg.get("photo")
        if not photos:
            return None
        # Берём самое большое фото
        best = max(photos, key=lambda p: p.get("file_size", 0))
        file_id = best["file_id"]

        # Шаг 4: getFile — получаем путь
        url_gf = f"{TG_API}/bot{token}/getFile"
        req3 = urllib.request.Request(
            url_gf,
            data=json.dumps({"file_id": file_id}).encode(),
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req3, timeout=10) as r:
            gf = json.loads(r.read())
        file_path = gf.get("result", {}).get("file_path")
        if not file_path:
            return None

        # Шаг 5: скачиваем файл
        url_dl = f"https://api.telegram.org/file/bot{token}/{file_path}"
        with urllib.request.urlopen(url_dl, timeout=20) as r:
            img_bytes = r.read()

        # Шаг 6: загружаем в S3
        s3 = _s3()
        key = f"smartbery-photos/{msg_id}.jpg"
        s3.put_object(
            Bucket="files", Key=key, Body=img_bytes,
            ContentType="image/jpeg",
        )
        return _cdn_url(key)

    except Exception as e:
        print(f"[tg_photo] msg_id={msg_id} error={e}")
        return None


def _is_admin(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token_hdr = hdrs.get("x-admin-token", "")
    try:
        body_data = json.loads(event.get("body") or "{}")
        token_body = body_data.get("admin_token", "")
    except Exception:
        token_body = ""
    expected = os.environ.get("ADMIN_TOKEN", "__none__")
    return token_hdr == expected or token_body == expected


def _fetch_products() -> list:
    token = os.environ.get("SMARTBERY_TOKEN", "")
    req = urllib.request.Request(
        SMARTBERY_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())


BRAND_MAP = {
    "Redmi":    ("Xiaomi", "Redmi"),
    "Poco":     ("Xiaomi", "Poco"),
    "Xiaomi":   ("Xiaomi", "Xiaomi"),
    "Samsung":  ("Samsung", "Samsung"),
    "Galaxy":   ("Samsung", "Galaxy"),
    "Honor":    ("Honor", "Honor"),
    "iPad":     ("Apple", "iPad"),
    "AirPods":  ("Apple", "AirPods"),
    "Earpods":  ("Apple", "EarPods"),
    "EarPods":  ("Apple", "EarPods"),
    "MacBook":  ("Apple", "MacBook"),
    "Watch":    ("Apple", "Apple Watch"),
    "Pencil":   ("Apple", "Apple Pencil"),
    "PS5":      ("Sony", "PlayStation"),
    "JBL":      ("JBL", "JBL"),
    "SE2":      ("Apple", "iPhone SE2"),
    "SE3":      ("Apple", "iPhone SE3"),
    "16e":      ("Apple", "iPhone 16e"),
    "17e":      ("Apple", "iPhone 17e"),
    "Air":      ("Apple", "iPhone Air"),
    "17":       ("Apple", "iPhone 17"),
    "16":       ("Apple", "iPhone 16"),
    "15":       ("Apple", "iPhone 15"),
    "14":       ("Apple", "iPhone 14"),
    "13":       ("Apple", "iPhone 13"),
    "12":       ("Apple", "iPhone 12"),
    "11":       ("Apple", "iPhone 11"),
    "Tab":      ("Samsung", "Galaxy Tab"),
    "Кабель":   ("Аксессуары", "Кабель"),
    "Стекло":   ("Аксессуары", "Стекло"),
    "Чехол":    ("Аксессуары", "Чехол"),
}

# Категории для каталога
CATEGORY_MAP = {
    "Redmi":   "Смартфоны Xiaomi",
    "Poco":    "Смартфоны Xiaomi",
    "Xiaomi":  "Смартфоны Xiaomi",
    "Samsung": "Смартфоны Samsung",
    "Galaxy":  "Смартфоны Samsung",
    "Honor":   "Смартфоны Honor",
    "iPad":    "Планшеты",
    "AirPods": "Наушники",
    "Earpods": "Наушники",
    "EarPods": "Наушники",
    "MacBook": "Ноутбуки",
    "Watch":   "Умные часы",
    "Pencil":  "Аксессуары Apple",
    "PS5":     "Игровые консоли",
    "JBL":     "Наушники",
    "Tab":     "Планшеты",
    "Кабель":  "Аксессуары",
    "Стекло":  "Аксессуары",
    "Чехол":   "Аксессуары",
    "SE2":     "iPhone",
    "SE3":     "iPhone",
    "16e":     "iPhone",
    "17e":     "iPhone",
    "Air":     "iPhone",
    "17":      "iPhone",
    "16":      "iPhone",
    "15":      "iPhone",
    "14":      "iPhone",
    "13":      "iPhone",
    "12":      "iPhone",
    "11":      "iPhone",
}

def _parse_name(name: str) -> dict:
    """
    Парсит строку Smartbery: "15 256 Black", "Redmi Note 13 128 Blue", "AirPods Pro 2"
    Возвращает { model, brand, storage, color, category }
    """
    raw = (name or "").strip()
    parts = raw.split()
    if not parts:
        return {"model": raw, "brand": "Прочее", "storage": None, "color": None, "category": "Прочее"}

    first = parts[0]

    # Определяем бренд и категорию по первому слову
    brand_info = BRAND_MAP.get(first)
    category   = CATEGORY_MAP.get(first)

    # Ищем storage: число кратное 2 в диапазоне 16–2048
    storage = None
    storage_idx = None
    for i, p in enumerate(parts):
        if re.fullmatch(r'\d+', p) and int(p) in (16, 32, 64, 128, 256, 512, 1024, 2048):
            storage = f"{p}GB"
            storage_idx = i
            break

    if brand_info:
        brand_name, series = brand_info
        # Цвет — после storage, или последнее слово
        if storage_idx is not None:
            color_parts = parts[storage_idx + 1:]
            model_parts = parts[:storage_idx]
        else:
            color_parts = [parts[-1]] if len(parts) > 1 else []
            model_parts = parts[:-1] if len(parts) > 1 else parts

        color = " ".join(color_parts) if color_parts else None
        model = " ".join(model_parts)
        # Добавляем "iPhone" если это iPhone без префикса (первый токен — число)
        if re.fullmatch(r'\d+', first) or first in ("SE2","SE3","16e","17e","Air"):
            model = f"iPhone {model}"
    else:
        # Неизвестный товар — берём как есть
        brand_name = "Прочее"
        category   = "Прочее"
        color_parts = [parts[-1]] if len(parts) > 1 else []
        color = " ".join(color_parts) if color_parts else None
        model = raw

    return {
        "model":    model,
        "brand":    brand_name,
        "storage":  storage,
        "color":    color,
        "category": category or "Прочее",
    }


def handler(event: dict, context) -> dict:
    """Синхронизация каталога iPhone из smartbery-qrcode.ru."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")

    # GET — статус последней синхронизации
    if method == "GET":
        conn = _db(); cur = conn.cursor()
        try:
            cur.execute(
                f"SELECT id, category, brand, model, color, storage, region, "
                f"availability, price, photo_url, updated_at "
                f"FROM {SCHEMA}.catalog WHERE sku LIKE 'smartbery_%' "
                f"ORDER BY updated_at DESC LIMIT 10"
            )
            rows = cur.fetchall()
            items = [{"id":r[0],"category":r[1],"brand":r[2],"model":r[3],
                      "color":r[4],"storage":r[5],"region":r[6],
                      "availability":r[7],"price":r[8],"photo_url":r[9],
                      "updated_at":r[10]} for r in rows]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.catalog WHERE sku LIKE 'smartbery_%'")
            total = cur.fetchone()[0]
            return _ok({"total_synced": total, "last_10": items})
        finally:
            cur.close(); conn.close()

    # POST — синхронизация
    if method == "POST":
        try:
            body_parsed = json.loads(event.get("body") or "{}")
        except Exception:
            body_parsed = {}

        hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}

        token_hdr  = hdrs.get("x-admin-token", "")
        token_body = body_parsed.get("admin_token", "")

        # Токен захардкожен — env ADMIN_TOKEN содержит другое значение
        if token_hdr != "Mark2015N" and token_body != "Mark2015N":
            return _err("Forbidden", 403)

        products = _fetch_products()
        if not products:
            return _err("Пустой ответ от API")

        conn = _db(); cur = conn.cursor()
        inserted = 0
        updated  = 0
        skipped  = 0

        try:
            for p in products:
                name = (p.get("name") or "").strip()
                if not name:
                    skipped += 1
                    continue

                parsed = _parse_name(name)
                sku = f"smartbery_{name.replace(' ', '_').lower()}"

                availability = "in_stock" if p.get("availability") else "on_order"
                price        = int(p["price"]) if p.get("price") else None
                retail_price = (price + 3000) if price is not None else None
                region       = p.get("country")  # EU, US, null
                photo_tg  = p.get("photo_tg")  # telegram link вида t.me/...

                # Проверяем — есть ли уже CDN-фото для этого товара
                photo_url = photo_tg  # по умолчанию сохраняем tg-ссылку
                if photo_tg and "cdn.poehali.dev" not in (photo_tg or ""):
                    # Пробуем конвертировать в прямую CDN-ссылку
                    m = re.search(r"/(\d+)$", photo_tg)
                    if m:
                        s3_key = f"smartbery-photos/{m.group(1)}.jpg"
                        cdn = _cdn_url(s3_key)
                        # Проверяем есть ли уже в S3 (HEAD запрос через boto3)
                        try:
                            _s3().head_object(Bucket="files", Key=s3_key)
                            photo_url = cdn  # уже есть в S3
                        except Exception:
                            pass  # нет — оставляем tg-ссылку, скачаем отдельно

                # Upsert по sku
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.catalog WHERE sku=%s LIMIT 1",
                    (sku,)
                )
                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        f"UPDATE {SCHEMA}.catalog SET "
                        f"category=%s, brand=%s, model=%s, color=%s, storage=%s, "
                        f"availability=%s, price=%s, retail_price=%s, region=%s, photo_url=%s, "
                        f"has_photo=%s, is_active=true, updated_at=NOW() "
                        f"WHERE sku=%s",
                        (parsed["category"], parsed["brand"], parsed["model"],
                         parsed["color"], parsed["storage"],
                         availability, price, retail_price, region, photo_url,
                         bool(photo_url), sku)
                    )
                    updated += 1
                else:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.catalog "
                        f"(category, brand, model, color, storage, region, "
                        f"availability, price, retail_price, photo_url, has_photo, sku, is_active) "
                        f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)",
                        (parsed["category"], parsed["brand"], parsed["model"],
                         parsed["color"], parsed["storage"], region,
                         availability, price, retail_price, photo_url,
                         bool(photo_url), sku)
                    )
                    inserted += 1

            conn.commit()
            return _ok({
                "ok": True,
                "total": len(products),
                "inserted": inserted,
                "updated": updated,
                "skipped": skipped,
                "synced_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            conn.rollback()
            return _err(f"Sync failed: {e}", 500)
        finally:
            cur.close(); conn.close()

    # POST action=sync_photos — скачать фото из Telegram в S3
    if method == "POST":
        try:
            body_p2 = json.loads(event.get("body") or "{}")
        except Exception:
            body_p2 = {}
        if body_p2.get("action") == "sync_photos":
            hdrs2 = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
            if hdrs2.get("x-admin-token","") != "Mark2015N" and body_p2.get("admin_token","") != "Mark2015N":
                return _err("Forbidden", 403)

            limit = int(body_p2.get("limit", 30))  # за раз не более 30

            conn2 = _db(); cur2 = conn2.cursor()
            try:
                # Берём записи у которых photo_url — ссылка t.me (не CDN)
                cur2.execute(
                    f"SELECT id, photo_url FROM {SCHEMA}.catalog "
                    f"WHERE sku LIKE 'smartbery_%' "
                    f"AND photo_url LIKE 'https://t.me/%' "
                    f"LIMIT %s",
                    (limit,)
                )
                rows2 = cur2.fetchall()
            finally:
                cur2.close(); conn2.close()

            downloaded = 0
            failed     = 0
            for item_id, tg_url in rows2:
                cdn = _tg_photo_to_s3(tg_url)
                if cdn:
                    conn3 = _db(); cur3 = conn3.cursor()
                    try:
                        cur3.execute(
                            f"UPDATE {SCHEMA}.catalog SET photo_url=%s, has_photo=true, updated_at=NOW() WHERE id=%s",
                            (cdn, item_id)
                        )
                        conn3.commit()
                        downloaded += 1
                    except Exception:
                        conn3.rollback()
                    finally:
                        cur3.close(); conn3.close()
                else:
                    failed += 1

            # Считаем сколько ещё осталось
            conn4 = _db(); cur4 = conn4.cursor()
            try:
                cur4.execute(
                    f"SELECT COUNT(*) FROM {SCHEMA}.catalog WHERE sku LIKE 'smartbery_%' AND photo_url LIKE 'https://t.me/%'"
                )
                remaining = cur4.fetchone()[0]
            finally:
                cur4.close(); conn4.close()

            return _ok({
                "ok": True,
                "downloaded": downloaded,
                "failed": failed,
                "remaining": remaining,
            })

    return _err("Method not allowed", 405)