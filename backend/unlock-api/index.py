"""
Unlock-кабинет: 3gsm.ru API proxy с авторизацией + наценка + транзакции.
GET  /?action=getServices       — публичный каталог с наценкой
GET  /?action=getBalance        — баланс 3gsm (авт.)
GET  /?action=getOrderList      — заказы из 3gsm (авт.)
GET  /?action=myOrders          — заказы из нашей БД (авт.)
GET  /?action=getTransactions   — история пополнений (авт.)
GET  /?action=getMarkup         — текущие наценки (авт.)
POST / action=createOrder       — создать заказ (авт.)
POST / action=refreshStatus     — обновить статус (авт.)
POST / action=addTransaction    — записать транзакцию пополнения (авт.)
POST / action=setMarkup         — изменить наценку (только admin-token)
"""
import os, json, re, urllib.request, urllib.parse, psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p31606708_tech_buying_service"
GSM_BASE = "https://3gsm.ru/index.php"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Client-Token, X-Admin-Token",
}


def _ok(data, code=200):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json; charset=utf-8"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}

def _err(msg, code=400):
    return _ok({"error": msg}, code)

def _db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resolve_client(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = (hdrs.get("x-client-token") or "").strip()
    if not token:
        return None
    c = _db(); cur = c.cursor()
    try:
        cur.execute(f"SELECT id, full_name, email, phone FROM {SCHEMA}.clients "
                    f"WHERE auth_token=%s AND token_expires_at>NOW() LIMIT 1", (token,))
        row = cur.fetchone()
        return {"id": row[0], "full_name": row[1], "email": row[2], "phone": row[3]} if row else None
    finally:
        cur.close(); c.close()


def is_admin(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    return hdrs.get("x-admin-token","") == os.environ.get("ADMIN_TOKEN","__none__")


# ── 3gsm helper ──────────────────────────────────────────────────────────────
def gsm_call(params):
    params["key"] = os.environ.get("GSMSM_API_KEY","")
    params["api"] = "true"
    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(GSM_BASE, data=data, method="POST")
    req.add_header("Content-Type","application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8")

def xf(xml, tag):
    m = re.search("<" + tag + r"[^>]*>([^<]*)</" + tag + ">", xml)
    return m.group(1) if m else ""

def xi(xml, tag):
    items = []
    for block in re.findall(f"<{tag}[\\s\\S]*?</{tag}>", xml):
        obj = {}
        for m in re.finditer(r"<(\w+)[^>]*>([^<]*)</\1>", block):
            obj[m.group(1)] = m.group(2)
        if obj: items.append(obj)
    return items


# ── Наценка ───────────────────────────────────────────────────────────────────
def get_markup_map():
    """Возвращает dict {category: multiplier}"""
    c = _db(); cur = c.cursor()
    try:
        cur.execute(f"SELECT category, multiplier FROM {SCHEMA}.unlock_markup_config")
        return {row[0]: float(row[1]) for row in cur.fetchall()}
    finally:
        cur.close(); c.close()

def detect_category(service_name: str) -> str:
    name = (service_name or "").lower()
    if "icloud" in name: return "icloud"
    if "frp" in name or "google" in name or "bypass" in name: return "frp"
    if "server" in name: return "server"
    if "imei" in name or "check" in name: return "imei"
    return "default"

def apply_markup(services: list, markup_map: dict) -> list:
    """Добавляет поля price_client и markup_pct к каждой услуге."""
    result = []
    for s in services:
        s = dict(s)
        cat = detect_category(s.get("title") or s.get("servicename",""))
        mult = markup_map.get(cat, markup_map.get("default", 1.40))
        raw_price = s.get("credits","")
        try:
            base = float(raw_price)
            client_price = round(base * mult, 2)
            s["price_client"] = str(client_price)
            s["markup_pct"] = str(round((mult - 1) * 100, 0)).rstrip('.0') + "%"
            s["category"] = cat
        except (ValueError, TypeError):
            s["price_client"] = raw_price
            s["markup_pct"] = "—"
            s["category"] = cat
        result.append(s)
    return result


# ── Handler ───────────────────────────────────────────────────────────────────
def handler(event: dict, context) -> dict:
    """Unlock API: 3gsm proxy + наценка + транзакции."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod","GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action","")

    body = {}
    if method == "POST":
        try: body = json.loads(event.get("body") or "{}")
        except Exception: pass
        action = body.get("action", action)

    # ── ПУБЛИЧНОЕ: каталог с наценкой ────────────────────────────────────────
    if action == "getServices":
        raw = gsm_call({"action": "getServices"})
        items = xi(raw, "service")
        if not items:
            try: items = json.loads(raw)
            except Exception: items = []
        markup_map = get_markup_map()
        items_with_markup = apply_markup(items, markup_map)
        return _ok({"services": items_with_markup})

    # ── ADMIN: наценки (без клиентского токена) ───────────────────────────────
    if action == "getMarkup":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(f"SELECT id, category, multiplier, note FROM {SCHEMA}.unlock_markup_config ORDER BY id")
            rows = cur.fetchall()
            markup = [{"id":r[0],"category":r[1],"multiplier":str(r[2]),
                       "pct": str(round((float(r[2])-1)*100))+'%',"note":r[3]} for r in rows]
            return _ok({"markup": markup})
        finally:
            cur.close(); c.close()

    if action == "setMarkup":
        if not is_admin(event):
            return _err("Forbidden", 403)
        category   = body.get("category","default")
        multiplier = body.get("multiplier")
        if not multiplier:
            return _err("Укажите multiplier (напр. 1.40)")
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"UPDATE {SCHEMA}.unlock_markup_config SET multiplier=%s, updated_at=NOW() WHERE category=%s",
                (float(multiplier), category)
            )
            c.commit()
            return _ok({"ok": True, "category": category, "multiplier": multiplier})
        finally:
            cur.close(); c.close()

    # ── Остальное только авторизованным ──────────────────────────────────────
    client = resolve_client(event)
    if not client:
        return _err("Необходима авторизация", 401)

    # ── Баланс ───────────────────────────────────────────────────────────────
    if action == "getBalance":
        raw = gsm_call({"action": "getBalance"})
        credits = xf(raw, "credits") or xf(raw, "balance")
        currency = xf(raw, "currency") or "₽"
        return _ok({"credits": credits, "currency": currency})

    # ── Заказы из 3gsm ───────────────────────────────────────────────────────
    if action == "getOrderList":
        raw = gsm_call({"action": "getOrderList"})
        items = xi(raw, "order")
        if not items:
            try: items = json.loads(raw)
            except Exception: items = []
        return _ok({"orders": items})

    # ── Мои заказы из БД ─────────────────────────────────────────────────────
    if action == "myOrders":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT id, gsm_order_id, service_id, service_name, imei, quantity, "
                f"price_credits, price_client, status, created_at FROM {SCHEMA}.unlock_orders "
                f"WHERE client_id=%s ORDER BY created_at DESC LIMIT 100",
                (client["id"],)
            )
            rows = cur.fetchall()
            orders = [{"id":r[0],"gsm_order_id":r[1],"service_id":r[2],"service_name":r[3],
                       "imei":r[4],"quantity":r[5],"price_credits":str(r[6]) if r[6] else None,
                       "price_client":str(r[7]) if r[7] else None,
                       "status":r[8],"created_at":r[9].isoformat() if r[9] else None} for r in rows]
            return _ok({"orders": orders})
        finally:
            cur.close(); c.close()

    # ── Транзакции ───────────────────────────────────────────────────────────
    if action == "getTransactions":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT id, type, amount, payment_status, description, created_at "
                f"FROM {SCHEMA}.unlock_transactions WHERE client_id=%s ORDER BY created_at DESC LIMIT 50",
                (client["id"],)
            )
            rows = cur.fetchall()
            txs = [{"id":r[0],"type":r[1],"amount":str(r[2]),"payment_status":r[3],
                    "description":r[4],"created_at":r[5].isoformat() if r[5] else None} for r in rows]
            return _ok({"transactions": txs})
        finally:
            cur.close(); c.close()

    # ── Создать заказ ────────────────────────────────────────────────────────
    if action == "createOrder":
        service_id   = str(body.get("serviceid") or body.get("service_id") or "").strip()
        service_name = str(body.get("service_name") or "").strip()
        imei         = str(body.get("imei") or "").strip()
        quantity     = int(body.get("quantity") or 1)
        price_base   = body.get("price_credits")   # цена 3gsm
        price_client = body.get("price_client")    # цена клиенту (с наценкой)

        if not service_id or not imei:
            return _err("Укажите услугу и IMEI")

        raw = gsm_call({"action":"createOrder","serviceid":service_id,"imei":imei,"quantity":str(quantity)})
        gsm_order_id = xf(raw, "orderid") or xf(raw, "id")
        gsm_status   = xf(raw, "status")
        gsm_msg      = xf(raw, "message") or xf(raw, "error")

        order_status = "sent" if (gsm_status == "1" or gsm_order_id) else "error"

        c = _db(); cur = c.cursor()
        try:
            # Добавляем поле price_client если таблица ещё без него
            cur.execute(
                f"INSERT INTO {SCHEMA}.unlock_orders "
                f"(client_id, gsm_order_id, service_id, service_name, imei, quantity, price_credits, status, gsm_response) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (client["id"], gsm_order_id or None, service_id, service_name,
                 imei, quantity, price_base, order_status,
                 json.dumps({"raw":raw,"gsm_status":gsm_status,"message":gsm_msg}))
            )
            local_id = cur.fetchone()[0]

            # Записываем транзакцию списания если известна цена
            if price_client:
                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.unlock_transactions "
                        f"(client_id, type, amount, payment_status, order_id, description) "
                        f"VALUES (%s,'order_payment',%s,'succeeded',%s,%s)",
                        (client["id"], float(price_client), local_id,
                         f"Заказ #{local_id}: {service_name} | IMEI: {imei}")
                    )
                except Exception:
                    pass  # поле может отсутствовать в старых записях

            c.commit()
        finally:
            cur.close(); c.close()

        return _ok({"success": order_status == "sent", "local_id": local_id,
                    "gsm_order_id": gsm_order_id, "status": order_status,
                    "message": gsm_msg})

    # ── Записать транзакцию пополнения ──────────────────────────────────────
    if action == "addTransaction":
        amount       = body.get("amount")
        payment_id   = body.get("payment_id","")
        description  = body.get("description","Пополнение баланса")
        if not amount:
            return _err("Укажите amount")
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.unlock_transactions "
                f"(client_id, type, amount, payment_id, payment_status, description) "
                f"VALUES (%s,'deposit',%s,%s,'succeeded',%s) RETURNING id",
                (client["id"], float(amount), payment_id, description)
            )
            tx_id = cur.fetchone()[0]
            c.commit()
            return _ok({"ok": True, "tx_id": tx_id})
        finally:
            cur.close(); c.close()

    # ── Обновить статус заказа ───────────────────────────────────────────────
    if action == "refreshStatus":
        order_id = str(body.get("gsm_order_id") or qs.get("gsm_order_id","")).strip()
        local_id = body.get("local_id") or qs.get("local_id")
        if not order_id:
            return _err("Укажите gsm_order_id")
        raw = gsm_call({"action":"getOrderStatus","orderid":order_id})
        status_val = xf(raw,"status")
        info = xf(raw,"information") or xf(raw,"message")
        smap = {"Completed":"completed","Approved":"approved","Processing":"processing",
                "Pending":"pending","Error":"error","Canceled":"error"}
        new_status = smap.get(status_val, status_val.lower() if status_val else "unknown")
        if local_id:
            c = _db(); cur = c.cursor()
            try:
                cur.execute(f"UPDATE {SCHEMA}.unlock_orders SET status=%s, updated_at=NOW() "
                            f"WHERE id=%s AND client_id=%s", (new_status, local_id, client["id"]))
                c.commit()
            finally:
                cur.close(); c.close()
        return _ok({"gsm_order_id":order_id,"status":new_status,"info":info})

    return _err(f"Неизвестный action: {action}")