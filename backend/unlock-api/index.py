"""
Unlock-кабинет: Dhru Fusion API (3gsm.ru) proxy + авторизация + наценка + транзакции.
GET  /?action=getServices       — публичный каталог с наценкой
GET  /?action=getBalance        — баланс (авт.)
GET  /?action=getOrderList      — заказы из 3gsm (авт.)
GET  /?action=myOrders          — заказы из нашей БД (авт.)
GET  /?action=getTransactions   — история пополнений (авт.)
GET  /?action=getMarkup         — текущие наценки
POST / action=createOrder       — создать заказ (авт.)
POST / action=refreshStatus     — обновить статус заказа (авт.)
POST / action=addTransaction    — записать транзакцию пополнения (авт.)
POST / action=setMarkup         — изменить наценку (только admin-token)
POST / action=syncServices      — синхронизировать каталог из 3gsm (admin)
POST / action=adminGetClients   — все клиенты (admin)
POST / action=adminGetOrders    — все заказы (admin)
POST / action=adminGetTransactions — все транзакции (admin)
"""
import os, json, re, base64, urllib.request, urllib.parse, psycopg2
from datetime import datetime, timezone, timedelta

CACHE_TTL_SERVICES = 86400 * 30  # 30 дней
CACHE_TTL_BALANCE  = 120         # 2 минуты

SCHEMA = "t_p31606708_tech_buying_service"

# ── Dhru Fusion API endpoint (официальный) ────────────────────────────────────
DHRU_API_URL = "https://3gsm.ru/api.php"

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


# ── Аутентификация ─────────────────────────────────────────────────────────────
def resolve_client(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = (hdrs.get("x-client-token") or "").strip()
    if not token:
        return None
    c = _db(); cur = c.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, email, phone FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW() LIMIT 1", (token,)
        )
        row = cur.fetchone()
        return {"id": row[0], "full_name": row[1], "email": row[2], "phone": row[3]} if row else None
    finally:
        cur.close(); c.close()


def is_admin(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token_from_header = hdrs.get("x-admin-token", "")
    try:
        body_data = json.loads(event.get("body") or "{}")
        token_from_body = body_data.get("admin_token", "")
    except Exception:
        token_from_body = ""
    expected = os.environ.get("ADMIN_TOKEN", "__none__")
    return token_from_header == expected or token_from_body == expected


# ── Dhru Fusion API helper ─────────────────────────────────────────────────────
def _dhru_call(action: str, parameters: dict = None) -> dict:
    """
    Официальный Dhru Fusion API (POST к api.php).
    action:     accountinfo | imeiservicelist | placeimeiorder | getimeiorder
    parameters: dict — будет base64(json_encode(parameters))
    Возвращает распарсенный dict ответа.
    """
    username = os.environ.get("DHRU_USERNAME", "")
    api_key  = os.environ.get("GSMSM_API_KEY", "")

    payload = {
        "action":      action,
        "username":    username,
        "apiaccesskey": api_key,
    }
    if parameters:
        payload["parameters"] = base64.b64encode(
            json.dumps(parameters, ensure_ascii=False).encode("utf-8")
        ).decode("ascii")

    data = urllib.parse.urlencode(payload).encode("utf-8")
    req  = urllib.request.Request(DHRU_API_URL, data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("Accept", "application/json")

    with urllib.request.urlopen(req, timeout=25) as r:
        raw = r.read().decode("utf-8")

    print(f"[dhru] action={action} status={r.status} raw={raw[:300]}")

    try:
        return json.loads(raw)
    except Exception:
        return {"_raw": raw}


def _dhru_success(resp: dict):
    """Возвращает первый элемент SUCCESS или None."""
    s = resp.get("SUCCESS")
    if isinstance(s, list) and s:
        return s[0]
    if isinstance(s, dict):
        return s
    return None


def _dhru_error(resp: dict) -> str:
    e = resp.get("ERROR")
    if isinstance(e, list) and e:
        return e[0].get("MESSAGE") or str(e[0])
    if isinstance(e, dict):
        return e.get("MESSAGE") or str(e)
    return resp.get("_raw", "Unknown error")[:300]


# ── Парсинг списка услуг из Dhru Fusion ──────────────────────────────────────
def _parse_dhru_service_list(success_data: dict) -> list:
    """
    Разбирает LIST из imeiservicelist в плоский список услуг.
    Структура: {GroupName: {GROUPNAME, GROUPTYPE, SERVICES: {id: {SERVICEID, ...}}}}
    """
    raw_list = success_data.get("LIST") or {}
    services = []
    for group_key, group_val in raw_list.items():
        if not isinstance(group_val, dict):
            continue
        group_name = group_val.get("GROUPNAME") or group_key
        raw_services = group_val.get("SERVICES") or {}
        if not isinstance(raw_services, dict):
            continue
        for sid_key, svc in raw_services.items():
            if not isinstance(svc, dict):
                continue
            service_id = str(svc.get("SERVICEID") or sid_key or "")
            title      = str(svc.get("SERVICENAME") or "")
            if not service_id or not title:
                continue
            services.append({
                "serviceid":      service_id,
                "title":          title,
                "credits":        str(svc.get("CREDIT") or ""),
                "time":           str(svc.get("TIME") or ""),
                "category_group": group_name,
                "info":           str(svc.get("INFO") or ""),
                # Обязательные поля
                "req_network":  svc.get("Requires.Network") == "Required",
                "req_imei":     True,  # IMEI всегда нужен
                "req_provider": svc.get("Requires.Provider") == "Required",
            })
    return services


# ── Кэш услуг ─────────────────────────────────────────────────────────────────
def get_services_from_cache(any_age=False):
    c = _db(); cur = c.cursor()
    try:
        ttl_cond = "" if any_age else f"WHERE cached_at > NOW() - INTERVAL '{CACHE_TTL_SERVICES} seconds'"
        cur.execute(
            f"SELECT service_id, title, credits, time, category_group, raw_data "
            f"FROM {SCHEMA}.unlock_services_cache {ttl_cond} ORDER BY id"
        )
        rows = cur.fetchall()
        if not rows:
            return None
        return [{"serviceid": r[0], "title": r[1], "credits": r[2],
                 "time": r[3], "category_group": r[4],
                 **(r[5] if isinstance(r[5], dict) else {})} for r in rows]
    finally:
        cur.close(); c.close()


def save_services_to_cache(services: list):
    if not services:
        return
    c = _db(); cur = c.cursor()
    try:
        cur.execute(f"DELETE FROM {SCHEMA}.unlock_services_cache")
        for s in services:
            cur.execute(
                f"INSERT INTO {SCHEMA}.unlock_services_cache "
                f"(service_id, title, credits, time, category_group, raw_data, cached_at) "
                f"VALUES (%s,%s,%s,%s,%s,%s,NOW())",
                (
                    str(s.get("serviceid") or s.get("SERVICEID") or ""),
                    str(s.get("title") or s.get("SERVICENAME") or ""),
                    str(s.get("credits") or s.get("CREDIT") or ""),
                    str(s.get("time") or s.get("TIME") or ""),
                    str(s.get("category_group") or ""),
                    json.dumps(s),
                )
            )
        c.commit()
    except Exception as e:
        print(f"[save_services_to_cache] error: {e}")
        c.rollback()
    finally:
        cur.close(); c.close()


# ── Кэш баланса ───────────────────────────────────────────────────────────────
def get_balance_from_cache():
    c = _db(); cur = c.cursor()
    try:
        cur.execute(
            f"SELECT credits, currency FROM {SCHEMA}.unlock_balance_cache "
            f"WHERE cached_at > NOW() - INTERVAL '{CACHE_TTL_BALANCE} seconds' "
            f"ORDER BY id DESC LIMIT 1"
        )
        row = cur.fetchone()
        return {"credits": row[0], "currency": row[1]} if row else None
    finally:
        cur.close(); c.close()


def save_balance_to_cache(credits: str, currency: str):
    c = _db(); cur = c.cursor()
    try:
        cur.execute(f"DELETE FROM {SCHEMA}.unlock_balance_cache")
        cur.execute(
            f"INSERT INTO {SCHEMA}.unlock_balance_cache (credits, currency) VALUES (%s,%s)",
            (credits, currency)
        )
        c.commit()
    except Exception:
        c.rollback()
    finally:
        cur.close(); c.close()


# ── Наценка ────────────────────────────────────────────────────────────────────
def get_markup_map():
    c = _db(); cur = c.cursor()
    try:
        cur.execute(f"SELECT category, multiplier FROM {SCHEMA}.unlock_markup_config")
        return {row[0]: float(row[1]) for row in cur.fetchall()}
    finally:
        cur.close(); c.close()


def detect_category(service_name: str) -> str:
    name = (service_name or "").lower()
    if "icloud" in name:                            return "icloud"
    if "frp" in name or "google" in name or "bypass" in name: return "frp"
    if "server" in name:                            return "server"
    if "imei" in name or "check" in name:           return "imei"
    return "default"


def apply_markup(services: list, markup_map: dict) -> list:
    result = []
    for s in services:
        s = dict(s)
        cat  = detect_category(s.get("title") or "")
        mult = markup_map.get(cat, markup_map.get("default", 1.40))
        raw_price = s.get("credits", "")
        try:
            base = float(raw_price)
            s["price_client"] = str(round(base * mult, 2))
            s["markup_pct"]   = str(round((mult - 1) * 100, 0)).rstrip(".0") + "%"
            s["category"]     = cat
        except (ValueError, TypeError):
            s["price_client"] = raw_price
            s["markup_pct"]   = "—"
            s["category"]     = cat
        result.append(s)
    return result


# ── Статусы Dhru Fusion ───────────────────────────────────────────────────────
DHRU_STATUS_MAP = {
    0:   "pending",
    "0": "pending",
    1:   "processing",
    "1": "processing",
    3:   "failed",
    "3": "failed",
    4:   "completed",
    "4": "completed",
}


# ═══════════════════════════════════════════════════════════════════════════════
def handler(event: dict, context) -> dict:
    """Unlock API: Dhru Fusion (3gsm.ru) proxy + наценка + транзакции."""

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    body = {}
    if method == "POST":
        try:
            body = json.loads(event.get("body") or "{}")
        except Exception:
            pass
        action = body.get("action", action)

    # ══ ПУБЛИЧНОЕ: каталог услуг с наценкой ══════════════════════════════════
    if action == "getServices":
        force_refresh = qs.get("refresh") == "1"
        markup_map    = get_markup_map()

        if not force_refresh:
            cached = get_services_from_cache()
            if cached:
                return _ok({"services": apply_markup(cached, markup_map), "from_cache": True})

        # Запрашиваем у Dhru Fusion
        try:
            resp    = _dhru_call("imeiservicelist")
            success = _dhru_success(resp)
            if success:
                services = _parse_dhru_service_list(success)
                if services:
                    save_services_to_cache(services)
                    return _ok({"services": apply_markup(services, markup_map)})
            err_msg = _dhru_error(resp)
            print(f"[getServices] dhru error: {err_msg}")
        except Exception as e:
            err_msg = str(e)
            print(f"[getServices] exception: {e}")

        # Fallback: старый кэш любой давности
        old = get_services_from_cache(any_age=True) or []
        return _ok({"services": apply_markup(old, markup_map), "from_cache": True, "error": err_msg})

    # ══ ADMIN: принудительная синхронизация услуг ════════════════════════════
    if action == "syncServices":
        if not is_admin(event):
            return _err("Forbidden", 403)
        try:
            resp    = _dhru_call("imeiservicelist")
            success = _dhru_success(resp)
            if success:
                services = _parse_dhru_service_list(success)
                if services:
                    save_services_to_cache(services)
                    return _ok({"ok": True, "count": len(services), "sample": services[:3]})
            return _ok({"ok": False, "error": _dhru_error(resp), "raw": str(resp)[:400]})
        except Exception as e:
            return _ok({"ok": False, "error": str(e)})

    # ══ ADMIN: клиенты ═══════════════════════════════════════════════════════
    if action == "adminGetClients":
        if not is_admin(event):
            return _err("Forbidden", 403)
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT c.id, c.full_name, c.email, c.phone, c.registered_at, "
                f"COUNT(o.id) as order_count, COALESCE(SUM(o.price_client),0) as total_spent "
                f"FROM {SCHEMA}.clients c "
                f"LEFT JOIN {SCHEMA}.unlock_orders o ON o.client_id = c.id "
                f"WHERE c.auth_token IS NOT NULL "
                f"GROUP BY c.id ORDER BY c.registered_at DESC LIMIT 100"
            )
            rows = cur.fetchall()
            clients = [{"id": r[0], "full_name": r[1], "email": r[2], "phone": r[3],
                        "registered_at": r[4].isoformat() if r[4] else None,
                        "order_count": r[5], "total_spent": str(r[6])} for r in rows]
            return _ok({"clients": clients})
        finally:
            cur.close(); c.close()

    # ══ ADMIN: все заказы ════════════════════════════════════════════════════
    if action == "adminGetOrders":
        if not is_admin(event):
            return _err("Forbidden", 403)
        page          = int(qs.get("page", body.get("page", 1)) or 1)
        per_page      = 50
        offset        = (page - 1) * per_page
        status_filter = qs.get("status", body.get("status", ""))
        c = _db(); cur = c.cursor()
        try:
            where = "WHERE 1=1"
            args  = []
            if status_filter:
                where += " AND o.status=%s"; args.append(status_filter)
            cur.execute(
                f"SELECT o.id, o.client_id, cl.full_name, cl.email, "
                f"o.gsm_order_id, o.service_name, o.imei, o.quantity, "
                f"o.price_credits, o.price_client, o.status, o.created_at "
                f"FROM {SCHEMA}.unlock_orders o "
                f"JOIN {SCHEMA}.clients cl ON cl.id = o.client_id "
                f"{where} ORDER BY o.created_at DESC LIMIT %s OFFSET %s",
                args + [per_page, offset]
            )
            rows = cur.fetchall()
            orders = [{"id": r[0], "client_id": r[1], "client_name": r[2], "client_email": r[3],
                       "gsm_order_id": r[4], "service_name": r[5], "imei": r[6], "quantity": r[7],
                       "price_credits": str(r[8]) if r[8] else None,
                       "price_client":  str(r[9]) if r[9] else None,
                       "status": r[10],
                       "created_at": r[11].isoformat() if r[11] else None} for r in rows]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.unlock_orders o {where}", args)
            total = cur.fetchone()[0]
            return _ok({"orders": orders, "total": total, "page": page, "per_page": per_page})
        finally:
            cur.close(); c.close()

    # ══ ADMIN: все транзакции ═════════════════════════════════════════════════
    if action == "adminGetTransactions":
        if not is_admin(event):
            return _err("Forbidden", 403)
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT t.id, t.client_id, cl.full_name, cl.email, "
                f"t.type, t.amount, t.payment_status, t.description, t.created_at "
                f"FROM {SCHEMA}.unlock_transactions t "
                f"JOIN {SCHEMA}.clients cl ON cl.id = t.client_id "
                f"ORDER BY t.created_at DESC LIMIT 200"
            )
            rows = cur.fetchall()
            txs = [{"id": r[0], "client_id": r[1], "client_name": r[2], "client_email": r[3],
                    "type": r[4], "amount": str(r[5]), "payment_status": r[6],
                    "description": r[7], "created_at": r[8].isoformat() if r[8] else None} for r in rows]
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {SCHEMA}.unlock_transactions WHERE type='deposit' AND payment_status='succeeded'")
            dep = cur.fetchone()
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {SCHEMA}.unlock_transactions WHERE type='order_payment'")
            pay = cur.fetchone()
            return _ok({"transactions": txs, "summary": {
                "deposits_count": dep[0], "deposits_total": str(dep[1]),
                "payments_count": pay[0], "payments_total": str(pay[1]),
            }})
        finally:
            cur.close(); c.close()

    # ══ Наценки (публичное чтение) ════════════════════════════════════════════
    if action == "getMarkup":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(f"SELECT id, category, multiplier, note FROM {SCHEMA}.unlock_markup_config ORDER BY id")
            rows = cur.fetchall()
            markup = [{"id": r[0], "category": r[1], "multiplier": str(r[2]),
                       "pct": str(round((float(r[2]) - 1) * 100)) + "%", "note": r[3]} for r in rows]
            return _ok({"markup": markup})
        finally:
            cur.close(); c.close()

    if action == "setMarkup":
        if not is_admin(event):
            return _err("Forbidden", 403)
        category   = body.get("category", "default")
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

    # ══ Остальное — только авторизованным ════════════════════════════════════
    client = resolve_client(event)
    if not client:
        return _err("Необходима авторизация", 401)

    # ── Баланс (accountinfo) ──────────────────────────────────────────────────
    if action == "getBalance":
        if qs.get("refresh") != "1":
            cached_bal = get_balance_from_cache()
            if cached_bal:
                return _ok({**cached_bal, "from_cache": True})
        try:
            resp    = _dhru_call("accountinfo")
            success = _dhru_success(resp)
            if success:
                info     = success.get("AccoutInfo") or success.get("AccountInfo") or {}
                credits  = str(info.get("credit") or info.get("Credit") or "")
                currency = str(info.get("currency") or info.get("Currency") or "USD")
                if credits:
                    save_balance_to_cache(credits, currency)
                return _ok({"credits": credits, "currency": currency})
            return _ok({"credits": None, "currency": "USD", "error": _dhru_error(resp)})
        except Exception as e:
            cached_bal = get_balance_from_cache()
            if cached_bal:
                return _ok({**cached_bal, "from_cache": True})
            return _ok({"credits": None, "currency": "USD", "error": str(e)})

    # ── Список заказов из 3gsm (для справки) ─────────────────────────────────
    if action == "getOrderList":
        try:
            resp    = _dhru_call("getimeiorderlist")
            success = _dhru_success(resp)
            orders  = []
            if success:
                raw_list = success.get("LIST") or success.get("ORDERS") or []
                if isinstance(raw_list, list):
                    orders = raw_list
                elif isinstance(raw_list, dict):
                    orders = list(raw_list.values())
            return _ok({"orders": orders})
        except Exception as e:
            return _ok({"orders": [], "error": str(e)})

    # ── Мои заказы из БД ──────────────────────────────────────────────────────
    if action == "myOrders":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT id, gsm_order_id, service_id, service_name, imei, quantity, "
                f"price_credits, price_client, status, created_at "
                f"FROM {SCHEMA}.unlock_orders "
                f"WHERE client_id=%s ORDER BY created_at DESC LIMIT 100",
                (client["id"],)
            )
            rows = cur.fetchall()
            orders = [{"id": r[0], "gsm_order_id": r[1], "service_id": r[2], "service_name": r[3],
                       "imei": r[4], "quantity": r[5],
                       "price_credits": str(r[6]) if r[6] else None,
                       "price_client":  str(r[7]) if r[7] else None,
                       "status": r[8], "created_at": r[9].isoformat() if r[9] else None} for r in rows]
            return _ok({"orders": orders})
        finally:
            cur.close(); c.close()

    # ── Транзакции ────────────────────────────────────────────────────────────
    if action == "getTransactions":
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT id, type, amount, payment_status, description, created_at "
                f"FROM {SCHEMA}.unlock_transactions WHERE client_id=%s ORDER BY created_at DESC LIMIT 50",
                (client["id"],)
            )
            rows = cur.fetchall()
            txs = [{"id": r[0], "type": r[1], "amount": str(r[2]), "payment_status": r[3],
                    "description": r[4], "created_at": r[5].isoformat() if r[5] else None} for r in rows]
            return _ok({"transactions": txs})
        finally:
            cur.close(); c.close()

    # ── Создать заказ (placeimeiorder) ────────────────────────────────────────
    if action == "createOrder":
        service_id   = str(body.get("serviceid") or body.get("service_id") or "").strip()
        service_name = str(body.get("service_name") or "").strip()
        imei         = str(body.get("imei") or "").strip()
        quantity     = int(body.get("quantity") or 1)
        price_base   = body.get("price_credits")
        price_client = body.get("price_client")
        custom_fields = body.get("custom_fields") or {}  # доп. поля если нужны

        if not service_id or not imei:
            return _err("Укажите услугу и IMEI")

        gsm_order_id = None
        gsm_status   = ""
        gsm_msg      = "Заказ принят, обрабатывается"
        gsm_sent     = False
        dhru_raw     = ""

        try:
            # Формируем parameters для placeimeiorder
            params = {"ID": int(service_id) if service_id.isdigit() else service_id}

            # Собираем customfield: IMEI + доп. поля
            cf_list = [{"fieldname": "IMEI", "value": imei}]
            for k, v in (custom_fields or {}).items():
                cf_list.append({"fieldname": k, "value": str(v)})

            params["customfield"] = base64.b64encode(
                json.dumps(cf_list, ensure_ascii=False).encode("utf-8")
            ).decode("ascii")

            if quantity > 1:
                params["QNT"] = quantity

            resp    = _dhru_call("placeimeiorder", params)
            dhru_raw = json.dumps(resp)[:500]
            success = _dhru_success(resp)

            if success:
                gsm_order_id = str(success.get("REFERENCEID") or success.get("ID") or "")
                gsm_msg      = str(success.get("MESSAGE") or "Заказ принят")
                gsm_sent     = bool(gsm_order_id)
            else:
                gsm_msg = _dhru_error(resp)
                print(f"[createOrder] dhru error: {gsm_msg}")

        except Exception as e:
            gsm_msg  = "Заказ принят и будет обработан"
            dhru_raw = str(e)[:200]
            print(f"[createOrder] exception: {e}")

        order_status = "sent" if gsm_sent else "pending"

        c = _db(); cur = c.cursor()
        local_id = None
        try:
            cur.execute(
                f"INSERT INTO {SCHEMA}.unlock_orders "
                f"(client_id, gsm_order_id, service_id, service_name, imei, quantity, "
                f"price_credits, price_client, status, gsm_response) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (client["id"], gsm_order_id or None, service_id, service_name,
                 imei, quantity,
                 float(price_base)   if price_base   else None,
                 float(price_client) if price_client else None,
                 order_status,
                 json.dumps({"raw": dhru_raw, "gsm_status": gsm_status, "message": gsm_msg}))
            )
            local_id = cur.fetchone()[0]

            # Списание с баланса клиента
            if price_client:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.unlock_transactions "
                    f"(client_id, type, amount, payment_status, order_id, description) "
                    f"VALUES (%s,'order_payment',%s,'succeeded',%s,%s)",
                    (client["id"], float(price_client), local_id,
                     f"Заказ #{local_id}: {service_name} | IMEI: {imei}")
                )
            c.commit()
        finally:
            cur.close(); c.close()

        return _ok({
            "success":      True,
            "local_id":     local_id,
            "gsm_order_id": gsm_order_id,
            "status":       order_status,
            "message":      gsm_msg or "Заказ принят и обрабатывается",
        })

    # ── Пополнение транзакции ─────────────────────────────────────────────────
    if action == "addTransaction":
        amount      = body.get("amount")
        payment_id  = body.get("payment_id", "")
        description = body.get("description", "Пополнение баланса")
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

    # ── Обновить статус заказа (getimeiorder) ─────────────────────────────────
    if action == "refreshStatus":
        gsm_order_id = str(body.get("gsm_order_id") or qs.get("gsm_order_id", "")).strip()
        local_id     = body.get("local_id") or qs.get("local_id")

        if not gsm_order_id:
            return _err("Укажите gsm_order_id")

        try:
            resp    = _dhru_call("getimeiorder", {"ID": int(gsm_order_id) if gsm_order_id.isdigit() else gsm_order_id})
            success = _dhru_success(resp)

            if success:
                raw_status  = success.get("STATUS")
                unlock_code = success.get("CODE") or success.get("code") or ""
                new_status  = DHRU_STATUS_MAP.get(raw_status, "processing")
                info        = success.get("INFORMATION") or success.get("information") or unlock_code or ""

                # Обновляем в БД
                if local_id:
                    c = _db(); cur = c.cursor()
                    try:
                        extra_set = ""
                        args_upd  = [new_status, local_id, client["id"]]
                        if unlock_code:
                            extra_set = ", result_code=%s"
                            args_upd  = [new_status, unlock_code, local_id, client["id"]]
                        cur.execute(
                            f"UPDATE {SCHEMA}.unlock_orders "
                            f"SET status=%s, updated_at=NOW(){extra_set} "
                            f"WHERE id=%s AND client_id=%s",
                            args_upd
                        )
                        c.commit()
                    finally:
                        cur.close(); c.close()

                return _ok({
                    "gsm_order_id": gsm_order_id,
                    "status":       new_status,
                    "status_code":  raw_status,
                    "code":         unlock_code,
                    "info":         info,
                })
            else:
                return _ok({"gsm_order_id": gsm_order_id, "status": "unknown", "error": _dhru_error(resp)})

        except Exception as e:
            return _ok({"gsm_order_id": gsm_order_id, "status": "unknown", "error": str(e)})

    return _err(f"Неизвестный action: {action}")
