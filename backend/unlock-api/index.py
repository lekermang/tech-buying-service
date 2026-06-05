"""
Unlock-кабинет: 3gsm.ru API proxy с авторизацией через clients.
Действия (GET/POST):
  - getBalance      : баланс аккаунта 3gsm
  - getServices     : список услуг с ценами
  - getOrderList    : история заказов из 3gsm
  - createOrder     : создать заказ (сохраняет в unlock_orders)
  - myOrders        : мои заказы из нашей БД
  - refreshStatus   : обновить статус конкретного заказа из 3gsm
"""
import os
import json
import urllib.request
import urllib.parse
import psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p31606708_tech_buying_service"
GSM_BASE = "https://3gsm.ru/index.php"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Client-Token",
}


def ok(data, code=200):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json; charset=utf-8"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg, code=400):
    return ok({"error": msg}, code)


def conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


# ── Авторизация ──────────────────────────────────────────────────────────────
def resolve_client(event: dict):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = (hdrs.get("x-client-token") or "").strip()
    if not token:
        return None
    db = conn()
    cur = db.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, email FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW() LIMIT 1",
            (token,),
        )
        row = cur.fetchone()
        return {"id": row[0], "full_name": row[1], "email": row[2]} if row else None
    finally:
        cur.close(); db.close()


# ── 3gsm API helper ──────────────────────────────────────────────────────────
def gsm_call(params: dict) -> str:
    api_key = os.environ.get("GSMSM_API_KEY", "")
    params["key"] = api_key
    params["api"] = "true"
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(GSM_BASE, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8")


def xml_field(xml: str, tag: str) -> str:
    import re
    m = re.search("<" + tag + r"[^>]*>([^<]*)</" + tag + ">", xml)
    return m.group(1) if m else ""


def xml_items(xml: str, tag: str) -> list:
    import re
    items = []
    for block in re.findall(f"<{tag}[\\s\\S]*?</{tag}>", xml):
        obj = {}
        for m in re.finditer(r"<(\w+)[^>]*>([^<]*)</\1>", block):
            obj[m.group(1)] = m.group(2)
        if obj:
            items.append(obj)
    return items


# ── Обработчик ───────────────────────────────────────────────────────────────
def handler(event: dict, context) -> dict:
    """Unlock-кабинет: проксирование 3gsm API + история заказов."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            body = {}
        action = body.get("action", action)
    else:
        body = {}

    # Публичные действия (без авторизации)
    if action == "getServices":
        raw = gsm_call({"action": "getServices"})
        items = xml_items(raw, "service")
        if not items:
            # попробуем JSON
            try:
                items = json.loads(raw)
            except Exception:
                items = []
        return ok({"services": items, "raw": raw})

    # Все остальные — только авторизованным
    client = resolve_client(event)
    if not client:
        return err("Необходима авторизация", 401)

    if action == "getBalance":
        raw = gsm_call({"action": "getBalance"})
        credits = xml_field(raw, "credits") or xml_field(raw, "balance")
        currency = xml_field(raw, "currency") or "₽"
        return ok({"credits": credits, "currency": currency, "raw": raw})

    if action == "getOrderList":
        raw = gsm_call({"action": "getOrderList"})
        items = xml_items(raw, "order")
        if not items:
            try:
                items = json.loads(raw)
            except Exception:
                items = []
        return ok({"orders": items})

    if action == "myOrders":
        # Заказы из нашей БД
        db = conn()
        cur = db.cursor()
        try:
            cur.execute(
                f"SELECT id, gsm_order_id, service_id, service_name, imei, quantity, "
                f"price_credits, status, created_at FROM {SCHEMA}.unlock_orders "
                f"WHERE client_id=%s ORDER BY created_at DESC LIMIT 100",
                (client["id"],),
            )
            rows = cur.fetchall()
            orders = [
                {
                    "id": r[0], "gsm_order_id": r[1], "service_id": r[2],
                    "service_name": r[3], "imei": r[4], "quantity": r[5],
                    "price_credits": str(r[6]) if r[6] else None,
                    "status": r[7],
                    "created_at": r[8].isoformat() if r[8] else None,
                }
                for r in rows
            ]
            return ok({"orders": orders})
        finally:
            cur.close(); db.close()

    if action == "createOrder":
        service_id = str(body.get("serviceid") or body.get("service_id") or "").strip()
        service_name = str(body.get("service_name") or "").strip()
        imei = str(body.get("imei") or "").strip()
        quantity = int(body.get("quantity") or 1)
        price = body.get("price_credits")

        if not service_id or not imei:
            return err("Укажите услугу и IMEI")

        # Отправляем заказ в 3gsm
        raw = gsm_call({
            "action": "createOrder",
            "serviceid": service_id,
            "imei": imei,
            "quantity": str(quantity),
        })

        gsm_order_id = xml_field(raw, "orderid") or xml_field(raw, "id")
        gsm_status = xml_field(raw, "status")
        gsm_msg = xml_field(raw, "message") or xml_field(raw, "error")

        order_status = "pending"
        if gsm_status == "1" or gsm_order_id:
            order_status = "sent"
        elif gsm_msg:
            order_status = "error"

        # Сохраняем в БД
        db = conn()
        cur = db.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.unlock_orders "
                f"(client_id, gsm_order_id, service_id, service_name, imei, quantity, price_credits, status, gsm_response) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (
                    client["id"], gsm_order_id or None, service_id, service_name,
                    imei, quantity, price, order_status,
                    json.dumps({"raw": raw, "gsm_status": gsm_status, "message": gsm_msg}),
                ),
            )
            local_id = cur.fetchone()[0]
            db.commit()
        finally:
            cur.close(); db.close()

        success = order_status == "sent"
        return ok({
            "success": success,
            "local_id": local_id,
            "gsm_order_id": gsm_order_id,
            "status": order_status,
            "message": gsm_msg,
            "raw": raw,
        }, 200 if success else 422)

    if action == "refreshStatus":
        order_id = str(body.get("gsm_order_id") or qs.get("gsm_order_id") or "").strip()
        local_id = body.get("local_id") or qs.get("local_id")
        if not order_id:
            return err("Укажите gsm_order_id")

        raw = gsm_call({"action": "getOrderStatus", "orderid": order_id})
        status_val = xml_field(raw, "status")
        info = xml_field(raw, "information") or xml_field(raw, "message")

        status_map = {
            "Completed": "completed", "Approved": "approved",
            "Processing": "processing", "Pending": "pending",
            "Error": "error", "Canceled": "error",
        }
        new_status = status_map.get(status_val, status_val.lower() if status_val else "unknown")

        if local_id:
            db = conn()
            cur = db.cursor()
            try:
                cur.execute(
                    f"UPDATE {SCHEMA}.unlock_orders SET status=%s, updated_at=NOW() WHERE id=%s AND client_id=%s",
                    (new_status, local_id, client["id"]),
                )
                db.commit()
            finally:
                cur.close(); db.close()

        return ok({"gsm_order_id": order_id, "status": new_status, "info": info, "raw": raw})

    return err(f"Неизвестный action: {action}")
