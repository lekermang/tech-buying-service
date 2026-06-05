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
from datetime import datetime, timezone, timedelta

CACHE_TTL_SERVICES = 86400 * 30  # 30 дней — обновляем вручную через Staff
CACHE_TTL_BALANCE  = 120         # 2 минуты — баланс обновляется чаще

SCHEMA = "t_p31606708_tech_buying_service"
GSM_BASE     = "https://3gsm.ru/index.php"
GSM_API_BASE = "https://3gsm.ru/api/"       # Dhru Fusion REST API endpoint

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
    token_from_header = hdrs.get("x-admin-token","")
    # Также принимаем токен из body (для POST-запросов из Staff)
    try:
        body_data = json.loads(event.get("body") or "{}")
        token_from_body = body_data.get("admin_token","")
    except Exception:
        token_from_body = ""
    expected = os.environ.get("ADMIN_TOKEN","__none__")
    return token_from_header == expected or token_from_body == expected


# ── 3gsm helper ──────────────────────────────────────────────────────────────
def gsm_call(params):
    """
    Пробует Dhru Fusion API в порядке:
    1) /api/  (REST endpoint)
    2) /index.php (legacy)
    Возвращает строку ответа.
    """
    api_key = os.environ.get("GSMSM_API_KEY", "")

    # Попытка 1: Dhru Fusion /api/ endpoint
    try:
        p = dict(params)
        p["key"] = api_key
        p["type"] = "json"
        data1 = urllib.parse.urlencode(p).encode()
        req1 = urllib.request.Request(GSM_API_BASE, data=data1, method="POST")
        req1.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req1, timeout=20) as r1:
            raw1 = r1.read().decode("utf-8")
        # Если вернул HTML — не то
        if raw1.strip().startswith("<!") or raw1.strip().startswith("<html"):
            raise ValueError("html_response")
        print(f"[gsm /api/] action={params.get('action')} raw={raw1[:150]}")
        return raw1
    except Exception as e1:
        print(f"[gsm /api/ failed] {e1}")

    # Попытка 2: legacy index.php
    p2 = dict(params)
    p2["key"] = api_key
    p2["api"] = "true"
    data2 = urllib.parse.urlencode(p2).encode()
    req2 = urllib.request.Request(GSM_BASE, data=data2, method="POST")
    req2.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req2, timeout=20) as r2:
        raw2 = r2.read().decode("utf-8")
    print(f"[gsm index.php] action={params.get('action')} raw={raw2[:150]}")
    return raw2

def gsm_fetch_services_from_html() -> list:
    """
    Получает услуги из 3gsm через Dhru Fusion API.
    Пробует несколько endpoint'ов в порядке приоритета.
    """
    api_key = os.environ.get("GSMSM_API_KEY", "")
    services = []

    # ── Попытка 1: Dhru Fusion API endpoint /api.php ──────────────────────────
    try:
        params = urllib.parse.urlencode({
            "key": api_key, "type": "json", "action": "services"
        }).encode()
        req = urllib.request.Request(GSM_API_BASE, data=params, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        with urllib.request.urlopen(req, timeout=20) as r:
            raw1 = r.read().decode("utf-8")
        print(f"[gsm api.php] status={r.status if hasattr(r,'status') else '?'} len={len(raw1)} preview={raw1[:200]}")
        services = _parse_gsm_response(raw1)
        if services:
            return services
    except Exception as e:
        print(f"[gsm api.php] error: {e}")

    # ── Попытка 2: index.php с action=services ────────────────────────────────
    for action_name in ["services", "getServices", "getservices"]:
        try:
            params2 = urllib.parse.urlencode({
                "key": api_key, "api": "true", "action": action_name,
                "type": "json"
            }).encode()
            req2 = urllib.request.Request(GSM_BASE, data=params2, method="POST")
            req2.add_header("Content-Type", "application/x-www-form-urlencoded")
            with urllib.request.urlopen(req2, timeout=20) as r2:
                raw2 = r2.read().decode("utf-8")
            print(f"[gsm index action={action_name}] len={len(raw2)} preview={raw2[:200]}")
            services = _parse_gsm_response(raw2)
            if services:
                return services
        except Exception as e:
            print(f"[gsm index action={action_name}] error: {e}")

    return services


def _parse_select_html(html: str) -> list:
    """Парсит HTML со страницы 3gsm — <optgroup> + <option data-price>"""
    services = []
    current_group = ""
    for line in html.split("\n"):
        g = re.search(r'<optgroup[^>]+label="([^"]+)"', line, re.IGNORECASE)
        if g: current_group = g.group(1).strip()
        # <option value="abc123" data-price="0.03">Название - 0.03 usd</option>
        o = re.search(r'<option[^>]+value="([a-f0-9]{32,})"[^>]*data-price="([^"]*)"[^>]*>\s*(.+?)\s*</option>', line, re.IGNORECASE)
        if o:
            sid, price, title = o.group(1).strip(), o.group(2).strip(), o.group(3).strip()
            title_clean = re.sub(r'\s*[-–]\s*[\d.]+\s*usd\s*$', '', title, flags=re.IGNORECASE).strip()
            if sid and title_clean:
                services.append({
                    "serviceid": sid,
                    "title": title_clean,
                    "credits": price,
                    "time": "",
                    "category_group": current_group,
                })
    return services


def _parse_gsm_response(raw: str) -> list:
    """Парсит ответ 3gsm в любом формате (JSON, XML, HTML)."""
    services = []
    if not raw or raw.strip().lower() in ("forbidden", "unauthorized", "error"):
        return []

    # JSON массив / объект
    try:
        data = json.loads(raw)
        items = data if isinstance(data, list) else data.get("services") or data.get("data") or []
        for s in items:
            if not isinstance(s, dict): continue
            sid = str(s.get("id") or s.get("serviceid") or s.get("service_id") or "")
            title = s.get("title") or s.get("name") or s.get("service_name") or ""
            if sid and title:
                services.append({
                    "serviceid": sid,
                    "title": str(title),
                    "credits": str(s.get("credits") or s.get("price") or ""),
                    "time": str(s.get("time") or s.get("eta") or ""),
                    "category_group": str(s.get("category") or s.get("categoryname") or ""),
                })
        if services: return services
    except Exception:
        pass

    # XML <service> теги
    for block in re.findall(r"<service[\s\S]*?</service>", raw, re.IGNORECASE):
        obj = {}
        for m in re.finditer(r"<(\w+)[^>]*>\s*([^<]*?)\s*</\1>", block):
            obj[m.group(1).lower()] = m.group(2).strip()
        sid = obj.get("serviceid") or obj.get("id") or ""
        title = obj.get("title") or obj.get("name") or obj.get("servicename") or ""
        if sid and title:
            services.append({
                "serviceid": sid,
                "title": title,
                "credits": obj.get("credits") or obj.get("price") or "",
                "time": obj.get("time") or "",
                "category_group": obj.get("categoryname") or obj.get("category") or "",
            })
    if services: return services

    # HTML <option value="..." data-price="...">
    current_group = ""
    for line in raw.split("\n"):
        g = re.search(r'<optgroup[^>]+label="([^"]+)"', line, re.IGNORECASE)
        if g: current_group = g.group(1).strip()
        o = re.search(r'<option[^>]+value="([^"]+)"[^>]*data-price="([^"]*)"[^>]*>\s*(.+?)\s*</option>', line, re.IGNORECASE)
        if o:
            sid, price, title = o.group(1), o.group(2), o.group(3)
            title_clean = re.sub(r'\s*[-–]\s*[\d.]+\s*usd\s*$', '', title, flags=re.IGNORECASE).strip()
            services.append({
                "serviceid": sid, "title": title_clean,
                "credits": price, "time": "",
                "category_group": current_group,
            })

    return services

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


# ── Кэш услуг ────────────────────────────────────────────────────────────────
def get_services_from_cache():
    """Возвращает услуги из кэша если не устарел, иначе None."""
    c = _db(); cur = c.cursor()
    try:
        cur.execute(
            f"SELECT service_id, title, credits, time, category_group, raw_data "
            f"FROM {SCHEMA}.unlock_services_cache "
            f"WHERE cached_at > NOW() - INTERVAL '{CACHE_TTL_SERVICES} seconds' "
            f"ORDER BY id"
        )
        rows = cur.fetchall()
        if not rows:
            return None
        return [{"serviceid": r[0], "title": r[1], "credits": r[2],
                 "time": r[3], "category_group": r[4],
                 **(r[5] if r[5] else {})} for r in rows]
    finally:
        cur.close(); c.close()

def save_services_to_cache(services: list):
    """Сохраняет услуги в кэш (upsert)."""
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
                    str(s.get("serviceid") or s.get("id") or ""),
                    str(s.get("title") or s.get("servicename") or ""),
                    str(s.get("credits") or ""),
                    str(s.get("time") or ""),
                    str(s.get("category_group") or ""),
                    json.dumps(s),
                )
            )
        c.commit()
    except Exception:
        c.rollback()
    finally:
        cur.close(); c.close()

def get_balance_from_cache():
    """Возвращает баланс из кэша если не устарел."""
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
        force_refresh = qs.get("refresh") == "1"
        markup_map = get_markup_map()

        # Сначала пробуем кэш
        if not force_refresh:
            cached = get_services_from_cache()
            if cached:
                return _ok({"services": apply_markup(cached, markup_map), "from_cache": True})

        # Идём в 3gsm через умный парсер
        try:
            items = gsm_fetch_services_from_html()
            if items:
                save_services_to_cache(items)
                return _ok({"services": apply_markup(items, markup_map)})
            else:
                # 3gsm вернул пустоту — отдаём кэш (любой давности)
                old_cache = get_services_from_cache() or []
                # попробуем без TTL
                c = _db(); cur = c.cursor()
                try:
                    cur.execute(f"SELECT service_id, title, credits, time, category_group, raw_data FROM {SCHEMA}.unlock_services_cache ORDER BY id")
                    rows = cur.fetchall()
                    old_cache = [{"serviceid": r[0], "title": r[1], "credits": r[2], "time": r[3], "category_group": r[4], **(r[5] if r[5] else {})} for r in rows]
                finally:
                    cur.close(); c.close()
                return _ok({"services": apply_markup(old_cache, markup_map), "from_cache": True, "raw": raw[:500]})
        except Exception as e:
            # 3gsm недоступен — отдаём кэш
            c2 = _db(); cur2 = c2.cursor()
            try:
                cur2.execute(f"SELECT service_id, title, credits, time, category_group, raw_data FROM {SCHEMA}.unlock_services_cache ORDER BY id")
                rows2 = cur2.fetchall()
                old = [{"serviceid": r[0], "title": r[1], "credits": r[2], "time": r[3], "category_group": r[4], **(r[5] if r[5] else {})} for r in rows2]
            finally:
                cur2.close(); c2.close()
            return _ok({"services": apply_markup(old, markup_map), "from_cache": True, "error": str(e)})

    # ── ADMIN: синхронизация услуг 3gsm → кэш ───────────────────────────────
    if action == "syncServices":
        if not is_admin(event):
            return _err("Forbidden", 403)

        # Если передан html_source — парсим его напрямую (из браузера)
        html_source = body.get("html_source","")
        if html_source:
            services = _parse_gsm_response(html_source)
            if not services:
                # Специальный парсер для <option value="..." data-price="...">
                services = _parse_select_html(html_source)
            if services:
                save_services_to_cache(services)
                return _ok({"ok": True, "count": len(services), "sample": services[:3], "source": "html"})

        # Иначе пробуем API
        services = gsm_fetch_services_from_html()
        if services:
            save_services_to_cache(services)
            return _ok({"ok": True, "count": len(services), "sample": services[:3], "source": "api"})

        # Диагностика — что вернул 3gsm
        diag = {}
        for attempt_action in ["getBalance", "balance"]:
            try:
                params_d = {"key": os.environ.get("GSMSM_API_KEY",""), "api": "true", "action": attempt_action}
                data_d = urllib.parse.urlencode(params_d).encode()
                req_d = urllib.request.Request(GSM_BASE, data=data_d, method="POST")
                req_d.add_header("Content-Type","application/x-www-form-urlencoded")
                with urllib.request.urlopen(req_d, timeout=10) as rd:
                    diag[attempt_action] = rd.read().decode("utf-8")[:300]
                break
            except Exception as e:
                diag[attempt_action] = str(e)
        return _ok({"ok": False, "count": 0, "diag": diag,
                    "hint": "API 3gsm не возвращает каталог. Используй кнопку 'Загрузить из браузера' или добавь услуги вручную."})

    # ── ADMIN: список всех клиентов unlock ────────────────────────────────────
    if action == "adminGetClients":
        if not is_admin(event):
            return _err("Forbidden", 403)
        c = _db(); cur = c.cursor()
        try:
            cur.execute(
                f"SELECT c.id, c.full_name, c.email, c.phone, c.registered_at, "
                f"COUNT(o.id) as order_count, "
                f"COALESCE(SUM(o.price_client),0) as total_spent "
                f"FROM {SCHEMA}.clients c "
                f"LEFT JOIN {SCHEMA}.unlock_orders o ON o.client_id = c.id "
                f"WHERE c.auth_token IS NOT NULL "
                f"GROUP BY c.id ORDER BY c.registered_at DESC LIMIT 100"
            )
            rows = cur.fetchall()
            clients = [{"id":r[0],"full_name":r[1],"email":r[2],"phone":r[3],
                        "registered_at":r[4].isoformat() if r[4] else None,
                        "order_count":r[5],"total_spent":str(r[6])} for r in rows]
            return _ok({"clients": clients})
        finally:
            cur.close(); c.close()

    # ── ADMIN: все заказы (всех клиентов) ────────────────────────────────────
    if action == "adminGetOrders":
        if not is_admin(event):
            return _err("Forbidden", 403)
        page = int(qs.get("page", body.get("page", 1)) or 1)
        per_page = 50
        offset = (page - 1) * per_page
        status_filter = qs.get("status", body.get("status", ""))
        c = _db(); cur = c.cursor()
        try:
            where = "WHERE 1=1"
            args = []
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
            orders = [{"id":r[0],"client_id":r[1],"client_name":r[2],"client_email":r[3],
                       "gsm_order_id":r[4],"service_name":r[5],"imei":r[6],"quantity":r[7],
                       "price_credits":str(r[8]) if r[8] else None,
                       "price_client":str(r[9]) if r[9] else None,
                       "status":r[10],
                       "created_at":r[11].isoformat() if r[11] else None} for r in rows]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.unlock_orders o {where}", args)
            total = cur.fetchone()[0]
            return _ok({"orders": orders, "total": total, "page": page, "per_page": per_page})
        finally:
            cur.close(); c.close()

    # ── ADMIN: все транзакции ────────────────────────────────────────────────
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
            txs = [{"id":r[0],"client_id":r[1],"client_name":r[2],"client_email":r[3],
                    "type":r[4],"amount":str(r[5]),"payment_status":r[6],
                    "description":r[7],
                    "created_at":r[8].isoformat() if r[8] else None} for r in rows]
            # Сводка
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
        # Сначала кэш (2 минуты)
        cached_bal = get_balance_from_cache()
        if cached_bal and qs.get("refresh") != "1":
            return _ok({**cached_bal, "from_cache": True})
        try:
            raw = gsm_call({"action": "getBalance"})
            credits = xf(raw, "credits") or xf(raw, "balance") or xf(raw, "Credit")
            currency = xf(raw, "currency") or xf(raw, "Currency") or "USD"
            if credits:
                save_balance_to_cache(credits, currency)
            return _ok({"credits": credits, "currency": currency})
        except Exception as e:
            if cached_bal:
                return _ok({**cached_bal, "from_cache": True})
            return _ok({"credits": None, "currency": "USD", "error": str(e)})

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

        # Сохраняем заказ локально и пробуем отправить в 3gsm
        raw = ""
        gsm_order_id = None
        gsm_status   = ""
        gsm_msg      = "Заказ принят, обрабатывается"
        gsm_sent     = False

        try:
            raw = gsm_call({"action": "createOrder", "serviceid": service_id,
                            "imei": imei, "quantity": str(quantity)})
            print(f"[createOrder] raw={raw[:300]}")

            # Не HTML — парсим
            if not (raw.strip().startswith("<!") or raw.strip().startswith("<html")):
                gsm_order_id = xf(raw, "orderid") or xf(raw, "id") or xf(raw, "OrderID")
                gsm_status   = xf(raw, "status") or xf(raw, "Status")
                gsm_msg      = xf(raw, "message") or xf(raw, "error") or xf(raw, "description") or ""
                if not gsm_order_id:
                    try:
                        j = json.loads(raw)
                        gsm_order_id = str(j.get("orderid") or j.get("order_id") or j.get("id") or "")
                        gsm_status   = str(j.get("status") or "")
                        gsm_msg      = str(j.get("message") or j.get("error") or "")
                    except Exception:
                        pass
                gsm_sent = bool(gsm_order_id or gsm_status in ("1","success","Success"))
            else:
                # 3gsm вернул HTML — API недоступен, заказ сохраняем локально
                gsm_msg = "Заказ принят и будет обработан"
                raw = raw[:200]  # не сохраняем весь HTML в БД

        except Exception as e:
            gsm_msg = "Заказ принят"
            raw = str(e)[:200]

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
                 float(price_base) if price_base else None,
                 float(price_client) if price_client else None,
                 order_status,
                 json.dumps({"raw": raw[:1000], "gsm_status": gsm_status, "message": gsm_msg}))
            )
            local_id = cur.fetchone()[0]

            # Транзакция списания
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
            "success": True,  # заказ всегда принят — клиент видит подтверждение
            "local_id": local_id,
            "gsm_order_id": gsm_order_id,
            "status": order_status,
            "message": gsm_msg or "Заказ принят и обрабатывается",
        })

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