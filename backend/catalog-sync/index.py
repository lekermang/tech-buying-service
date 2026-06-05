"""
Синхронизация каталога iPhone из smartbery-qrcode.ru API. v2
POST / { "action": "sync", "admin_token": "..." }  — запустить синхронизацию
GET  /                        — последний лог синхронизации

Парсинг name: "<модель> <storage_gb> <color>"
Пример: "15 256 Black" → model=iPhone 15, storage=256GB, color=Black
"""
import os, json, urllib.request, psycopg2, re
from datetime import datetime, timezone

SCHEMA = "t_p31606708_tech_buying_service"
SMARTBERY_URL = "https://smartbery-qrcode.ru/api/v1/products/"
SOURCE_TAG = "smartbery"

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


def _parse_name(name: str) -> dict:
    """
    Парсит строку вида "15 256 Black" или "13 Pro Max 256 Graphite"
    Возвращает { model, storage, color, category }
    """
    name = (name or "").strip()
    parts = name.split()
    if not parts:
        return {"model": name, "storage": None, "color": None, "category": "iPhone"}

    # Первый токен всегда — номер модели (13, 14, 15, 16 и т.д.)
    model_num = parts[0]  # "15", "13", "16"

    # Ищем объём памяти: число (128, 256, 512, 1024 или 64)
    storage = None
    storage_idx = None
    for i, p in enumerate(parts[1:], 1):
        if re.fullmatch(r'\d+', p) and int(p) in (32, 64, 128, 256, 512, 1024):
            storage = f"{p}GB"
            storage_idx = i
            break

    # Всё между model_num и storage — суффикс модели (Pro, Max, Plus, Pro Max)
    if storage_idx is not None:
        suffix_parts = parts[1:storage_idx]
        color_parts  = parts[storage_idx + 1:]
    else:
        # нет числа — берём последнее слово как цвет
        suffix_parts = parts[1:-1] if len(parts) > 2 else []
        color_parts  = [parts[-1]] if len(parts) > 1 else []

    suffix = " ".join(suffix_parts)  # "Pro Max", "Plus", ""
    color  = " ".join(color_parts) if color_parts else None

    if suffix:
        full_model = f"iPhone {model_num} {suffix}"
        category   = f"iPhone {model_num} {suffix}".replace("Max", "MAX").replace("Plus", "+")
    else:
        full_model = f"iPhone {model_num}"
        category   = f"iPhone {model_num}"

    # Нормализуем категорию к формату в БД (e.g. "iPhone 15/+/PRO/MAX")
    # Упрощённо: используем model как есть — каталог может сам сгруппировать
    return {
        "model":    full_model,
        "storage":  storage,
        "color":    color,
        "category": _normalize_category(model_num, suffix),
    }


def _normalize_category(num: str, suffix: str) -> str:
    """Приводит к формату вида 'iPhone 15/+/PRO/MAX'"""
    cats = {
        "13": "iPhone 13/mini/PRO/MAX",
        "14": "iPhone 14/+/PRO/MAX",
        "15": "iPhone 15/+/PRO/MAX",
        "16": "iPhone 16/+/PRO/MAX",
    }
    return cats.get(num, f"iPhone {num}")


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
        expected = os.environ.get("ADMIN_TOKEN", "__none__")

        token_hdr  = hdrs.get("x-admin-token", "")
        token_body = body_parsed.get("admin_token", "")
        qs         = event.get("queryStringParameters") or {}
        token_qs   = qs.get("admin_token", "")

        print(f"[auth] expected={expected!r} hdr={token_hdr!r} body={token_body!r} qs={token_qs!r}")

        token_ok = expected in (token_hdr, token_body, token_qs)
        if not token_ok:
            return _err(f"Forbidden: token mismatch", 403)

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
                price  = int(p["price"]) if p.get("price") else None
                region = p.get("country")  # EU, US, null
                photo_url = p.get("photo_tg")  # telegram link

                # Upsert по sku
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.catalog WHERE sku=%s LIMIT 1",
                    (sku,)
                )
                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        f"UPDATE {SCHEMA}.catalog SET "
                        f"availability=%s, price=%s, region=%s, photo_url=%s, "
                        f"has_photo=%s, is_active=true, updated_at=NOW() "
                        f"WHERE sku=%s",
                        (availability, price, region, photo_url,
                         bool(photo_url), sku)
                    )
                    updated += 1
                else:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.catalog "
                        f"(category, brand, model, color, storage, region, "
                        f"availability, price, photo_url, has_photo, sku, is_active) "
                        f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)",
                        (parsed["category"], "Apple", parsed["model"],
                         parsed["color"], parsed["storage"], region,
                         availability, price, photo_url,
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

    return _err("Method not allowed", 405)