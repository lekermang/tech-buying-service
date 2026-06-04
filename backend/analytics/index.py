"""Собственная аналитика посетителей в реальном времени.
Публичные действия (без auth):
  - POST track    — события трекера (rate-limit 120 req/min/IP)
  - POST convert  — конверсии (заявки)

Админ-эндпоинты (X-Employee-Token):
  - GET online            — кто онлайн (heartbeat < 30 сек)
  - GET stats_today       — KPI за сегодня
  - GET conversions       — последние заявки
  - GET recent_events     — новые «горячие» события (для тостов)
  - GET visitor?id=...    — карточка посетителя
  - GET session_events?id=... — события сессии
  - GET search?phone=...  — поиск по телефону
"""
import json
import os
import re
import time
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from urllib.parse import urlparse, parse_qs

SCHEMA = 't_p31606708_tech_buying_service'
ALLOWED_ROLES = {'owner', 'admin', 'staff', 'manager', 'master'}

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def _ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=_jd), 'isBase64Encoded': False}


def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False), 'isBase64Encoded': False}


def _jd(o):
    if isinstance(o, (datetime,)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)
    return str(o)


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _get_employee(token: str):
    if not token:
        return None
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, login, role FROM {SCHEMA}.employees "
            f"WHERE auth_token=%s AND token_expires_at>NOW() AND is_active=true",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'full_name': row[1], 'login': row[2], 'role': row[3]}
    finally:
        cur.close(); conn.close()


def _client_ip(event) -> str:
    return ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp') or ''


# ========== Парсинг источника, UTM, User-Agent ==========
_SEARCH_HOSTS = {
    'yandex': ('yandex.', 'text'),
    'google': ('google.', 'q'),
    'mail.ru': ('go.mail.ru', 'q'),
    'bing': ('bing.com', 'q'),
    'duckduckgo': ('duckduckgo.com', 'q'),
}

_SOCIAL_HOSTS = {
    'vk': ['vk.com', 'vk.ru'],
    'telegram': ['t.me', 'telegram.me', 'telegram.org'],
    'whatsapp': ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
    'instagram': ['instagram.com'],
    'facebook': ['facebook.com', 'fb.com'],
    'youtube': ['youtube.com', 'youtu.be'],
    'tiktok': ['tiktok.com'],
}

_LISTING_HOSTS = {
    'avito': ['avito.ru'],
    '2gis': ['2gis.ru', '2gis.com'],
    'yandex_maps': ['yandex.ru/maps', 'maps.yandex'],
}


def _parse_source(referrer: str, page_url: str):
    """Возвращает {source, medium, search_query, campaign} из UTM и referrer.
    UTM имеет приоритет."""
    res = {'source': 'direct', 'medium': 'none', 'search_query': None, 'campaign': None}
    # UTM из URL страницы
    try:
        if page_url:
            qs = parse_qs(urlparse(page_url).query or '')
            us = qs.get('utm_source', [None])[0]
            um = qs.get('utm_medium', [None])[0]
            uc = qs.get('utm_campaign', [None])[0]
            ut = qs.get('utm_term', [None])[0]
            if us:
                res['source'] = us; res['medium'] = um or 'cpc'; res['campaign'] = uc
                if ut:
                    res['search_query'] = ut
                return res
    except Exception:
        pass
    if not referrer:
        return res
    try:
        p = urlparse(referrer); host = (p.hostname or '').lower(); path = p.path or ''
        # Поисковики
        for name, (substr, param) in _SEARCH_HOSTS.items():
            if substr in host:
                res['source'] = name; res['medium'] = 'organic'
                try:
                    q = parse_qs(p.query or '').get(param, [None])[0]
                    if q:
                        res['search_query'] = q[:200]
                except Exception:
                    pass
                return res
        # Соцсети
        for name, hosts in _SOCIAL_HOSTS.items():
            if any(h in host for h in hosts):
                res['source'] = name; res['medium'] = 'social'
                return res
        # Доски/каталоги
        for name, hosts in _LISTING_HOSTS.items():
            if any(h in (host + path) for h in hosts):
                res['source'] = name; res['medium'] = 'referral'
                return res
        # Свой домен — direct
        if 'skupka24' in host or 'skypka24' in host or 'poehali' in host:
            return res
        # Прочее
        res['source'] = 'referral'; res['medium'] = host or 'unknown'
    except Exception:
        pass
    return res


_UA_OS = [
    ('Windows', 'Windows'), ('Macintosh', 'macOS'), ('Mac OS', 'macOS'),
    ('Android', 'Android'), ('iPhone', 'iOS'), ('iPad', 'iOS'),
    ('Linux', 'Linux'),
]
_UA_BROWSER = [
    ('YaBrowser', 'Яндекс.Браузер'), ('Edg', 'Edge'), ('OPR', 'Opera'),
    ('Firefox', 'Firefox'), ('Chrome', 'Chrome'),
    ('Safari', 'Safari'),
]


def _parse_ua(ua: str):
    if not ua:
        return {'device_type': 'unknown', 'browser': None, 'os': None}
    ua_l = ua
    os_name = next((n for k, n in _UA_OS if k in ua_l), None)
    br = next((n for k, n in _UA_BROWSER if k in ua_l), None)
    is_mobile = any(x in ua_l for x in ['Mobile', 'Android', 'iPhone'])
    is_tablet = 'iPad' in ua_l or ('Tablet' in ua_l)
    dt = 'tablet' if is_tablet else ('mobile' if is_mobile else 'desktop')
    return {'device_type': dt, 'browser': br, 'os': os_name}


# ========== Геолокация по IP с кэшем ==========
def _geo_lookup(ip: str):
    """Возвращает (city, country). Кэшируется в an_ip_cache навсегда."""
    if not ip or ip in ('127.0.0.1', '::1', 'localhost'):
        return (None, None)
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT city, country FROM {SCHEMA}.an_ip_cache WHERE ip=%s",
            (ip,)
        )
        row = cur.fetchone()
        if row:
            return (row[0], row[1])
    finally:
        cur.close(); conn.close()

    city, country = None, None
    try:
        import urllib.request as _urlreq
        req = _urlreq.Request(f'https://ipapi.co/{ip}/json/', headers={'User-Agent': 'skupka24-analytics'})
        with _urlreq.urlopen(req, timeout=3) as resp:
            d = json.loads(resp.read().decode('utf-8'))
        city = d.get('city')
        country = d.get('country_name')
    except Exception:
        # fallback на ip-api.com
        try:
            import urllib.request as _urlreq
            req = _urlreq.Request(f'http://ip-api.com/json/{ip}?lang=ru')
            with _urlreq.urlopen(req, timeout=3) as resp:
                d = json.loads(resp.read().decode('utf-8'))
            city = d.get('city')
            country = d.get('country')
        except Exception:
            pass

    # Сохраняем в кэш (даже если null — чтобы не дёргать API на сломанных IP)
    try:
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.an_ip_cache (ip, city, country) VALUES (%s, %s, %s) "
            f"ON CONFLICT (ip) DO NOTHING",
            (ip, city, country)
        )
        conn.commit(); cur.close(); conn.close()
    except Exception:
        pass
    return (city, country)


# ========== Rate Limit ==========
def _rate_limit_ok(ip: str, max_per_min: int = 120) -> bool:
    if not ip:
        return True
    now = datetime.now(timezone.utc)
    bucket = now.replace(second=0, microsecond=0)
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.an_rate_limit (ip, minute_bucket, hits) VALUES (%s, %s, 1) "
            f"ON CONFLICT (ip, minute_bucket) DO UPDATE SET hits = {SCHEMA}.an_rate_limit.hits + 1 "
            f"RETURNING hits",
            (ip, bucket)
        )
        hits = cur.fetchone()[0]
        conn.commit()
        return hits <= max_per_min
    finally:
        cur.close(); conn.close()


def _gc_rate_limit():
    """Очистка старых записей rate-limit (вероятностная)."""
    if int(time.time()) % 60 != 0:
        return
    try:
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(
            f"DELETE FROM {SCHEMA}.an_rate_limit WHERE minute_bucket < NOW() - INTERVAL '5 minutes'"
        )
        conn.commit(); cur.close(); conn.close()
    except Exception:
        pass


# ========== Главные хендлеры ==========
def action_track(body, event):
    """Приём события трекера."""
    ip = _client_ip(event)
    if not _rate_limit_ok(ip):
        return _err(429, 'Слишком много запросов')
    _gc_rate_limit()

    visitor_id = (body.get('visitor_id') or '').strip()[:64]
    session_id = (body.get('session_id') or '').strip()[:64]
    event_type = (body.get('event_type') or '').strip()[:32]
    page_url = (body.get('page_url') or '')[:500]
    page_title = (body.get('page_title') or '')[:200]
    referrer = (body.get('referrer') or '')[:500]
    event_data = body.get('event_data') or {}
    if not visitor_id or not session_id or not event_type:
        return _err(400, 'visitor_id, session_id, event_type required')

    ua = ((event.get('headers') or {}).get('User-Agent')
          or (event.get('headers') or {}).get('user-agent') or '')[:500]

    conn = _get_conn(); cur = conn.cursor()
    try:
        # 1. heartbeat — самый частый, отдельная быстрая ветка
        if event_type == 'heartbeat':
            cur.execute(
                f"UPDATE {SCHEMA}.an_sessions SET "
                f"last_heartbeat = NOW(), "
                f"duration_sec = EXTRACT(EPOCH FROM (NOW() - started_at))::int "
                f"WHERE session_id=%s",
                (session_id,)
            )
            conn.commit()
            return _ok({'ok': True})

        # 2. session_start — создание сессии + визитора
        if event_type == 'session_start':
            ua_info = _parse_ua(ua)
            src = _parse_source(referrer, page_url)
            city, country = _geo_lookup(ip)

            # upsert visitor
            cur.execute(
                f"INSERT INTO {SCHEMA}.an_visitors "
                f"(visitor_id, first_seen, last_seen, visit_count, city, country, device_type, browser, os) "
                f"VALUES (%s, NOW(), NOW(), 1, %s, %s, %s, %s, %s) "
                f"ON CONFLICT (visitor_id) DO UPDATE SET "
                f"last_seen = NOW(), "
                f"visit_count = {SCHEMA}.an_visitors.visit_count + 1, "
                f"city = COALESCE({SCHEMA}.an_visitors.city, EXCLUDED.city), "
                f"country = COALESCE({SCHEMA}.an_visitors.country, EXCLUDED.country)",
                (visitor_id, city, country, ua_info['device_type'], ua_info['browser'], ua_info['os'])
            )

            # insert session (либо upsert если перезапустили)
            cur.execute(
                f"INSERT INTO {SCHEMA}.an_sessions "
                f"(session_id, visitor_id, started_at, last_heartbeat, "
                f"source, medium, campaign, referrer, landing_page, search_query, "
                f"current_page, current_title, path, ip, user_agent, city) "
                f"VALUES (%s, %s, NOW(), NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, %s) "
                f"ON CONFLICT (session_id) DO UPDATE SET last_heartbeat = NOW()",
                (session_id, visitor_id, src['source'], src['medium'], src['campaign'],
                 referrer or None, page_url or None, src['search_query'],
                 page_url or None, page_title or None,
                 json.dumps([{'url': page_url, 'title': page_title, 't': datetime.now(timezone.utc).isoformat()}],
                            ensure_ascii=False),
                 ip or None, ua, city)
            )

            _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data)
            conn.commit()
            return _ok({'ok': True})

        # 3. pageview — обновляем current_page, добавляем в path, +1 счётчик
        if event_type == 'pageview':
            cur.execute(
                f"UPDATE {SCHEMA}.an_sessions SET "
                f"last_heartbeat = NOW(), "
                f"current_page = %s, current_title = %s, "
                f"page_count = page_count + 1, "
                f"path = CASE WHEN jsonb_array_length(path) >= 20 "
                f"            THEN path - 0 || jsonb_build_array(jsonb_build_object('url', %s::text, 'title', %s::text, 't', NOW()::text)) "
                f"            ELSE path || jsonb_build_array(jsonb_build_object('url', %s::text, 'title', %s::text, 't', NOW()::text)) "
                f"       END "
                f"WHERE session_id=%s",
                (page_url or None, page_title or None,
                 page_url or '', page_title or '',
                 page_url or '', page_title or '', session_id)
            )
            _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data)
            conn.commit()
            return _ok({'ok': True})

        # 4. «горячие» события — пометить hot_action
        if event_type in ('phone_click', 'whatsapp_click', 'telegram_click', 'form_start', 'form_submit'):
            cur.execute(
                f"UPDATE {SCHEMA}.an_sessions SET "
                f"last_heartbeat = NOW(), "
                f"hot_action = %s, hot_action_at = NOW() "
                f"WHERE session_id=%s",
                (event_type, session_id)
            )
            _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data)
            conn.commit()
            return _ok({'ok': True})

        # 5. session_end
        if event_type == 'session_end':
            cur.execute(
                f"UPDATE {SCHEMA}.an_sessions SET "
                f"ended_at = NOW(), "
                f"exit_page = %s, "
                f"duration_sec = EXTRACT(EPOCH FROM (NOW() - started_at))::int "
                f"WHERE session_id=%s",
                (page_url or None, session_id)
            )
            _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data)
            conn.commit()
            return _ok({'ok': True})

        # 6. Прочие события (scroll_depth, ...) — просто пишем
        cur.execute(
            f"UPDATE {SCHEMA}.an_sessions SET last_heartbeat = NOW() WHERE session_id=%s",
            (session_id,)
        )
        _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data)
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(500, f'track error: {e}')
    finally:
        cur.close(); conn.close()


def _insert_event(cur, session_id, visitor_id, event_type, page_url, page_title, event_data):
    cur.execute(
        f"INSERT INTO {SCHEMA}.an_events (session_id, visitor_id, event_type, page_url, page_title, event_data) "
        f"VALUES (%s, %s, %s, %s, %s, %s::jsonb)",
        (session_id, visitor_id, event_type, page_url or None, page_title or None,
         json.dumps(event_data or {}, ensure_ascii=False))
    )


def action_convert(body, event):
    """Конверсия (заявка). Сохраняет в an_conversions и помечает visitor."""
    ip = _client_ip(event)
    if not _rate_limit_ok(ip):
        return _err(429, 'rate limit')

    visitor_id = (body.get('visitor_id') or '').strip()[:64]
    session_id = (body.get('session_id') or '').strip()[:64] or None
    ctype = (body.get('type') or 'unknown').strip()[:32]
    form_data = body.get('form_data') or {}
    amount = body.get('amount')
    phone = (body.get('phone') or '').strip()[:32] or None
    if not visitor_id:
        return _err(400, 'visitor_id required')

    # Фильтрация чувствительных полей
    safe_data = {}
    for k, v in (form_data or {}).items():
        if not isinstance(k, str):
            continue
        kl = k.lower()
        if any(x in kl for x in ('password', 'pwd', 'cvv', 'card', 'pan', 'cvc')):
            continue
        if isinstance(v, (str, int, float, bool)) or v is None:
            safe_data[k] = v

    try:
        amount_dec = Decimal(str(amount)) if amount not in (None, '', 0) else None
    except Exception:
        amount_dec = None

    conn = _get_conn(); cur = conn.cursor()
    try:
        # Берём source и city из сессии
        source = None; city = None
        if session_id:
            cur.execute(
                f"SELECT source, city FROM {SCHEMA}.an_sessions WHERE session_id=%s",
                (session_id,)
            )
            row = cur.fetchone()
            if row:
                source, city = row[0], row[1]

        cur.execute(
            f"INSERT INTO {SCHEMA}.an_conversions "
            f"(visitor_id, session_id, type, form_data, amount, phone, city, source) "
            f"VALUES (%s, %s, %s, %s::jsonb, %s, %s, %s, %s) RETURNING id",
            (visitor_id, session_id, ctype,
             json.dumps(safe_data, ensure_ascii=False),
             amount_dec, phone, city, source)
        )
        conv_id = cur.fetchone()[0]
        cur.execute(
            f"UPDATE {SCHEMA}.an_visitors SET is_converted = TRUE, phone = COALESCE(%s, phone) "
            f"WHERE visitor_id=%s",
            (phone, visitor_id)
        )
        # Также пишем как event
        _insert_event(cur, session_id or '', visitor_id, 'conversion', None, None,
                      {'type': ctype, 'amount': float(amount_dec) if amount_dec else None})
        conn.commit()
        return _ok({'ok': True, 'id': conv_id})
    except Exception as e:
        conn.rollback()
        return _err(500, f'convert error: {e}')
    finally:
        cur.close(); conn.close()


# ========== Admin endpoints ==========
def action_online():
    """Кто онлайн прямо сейчас (heartbeat < 30 сек)."""
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT s.session_id, s.visitor_id, s.started_at, s.last_heartbeat, "
        f"s.source, s.medium, s.search_query, s.current_page, s.current_title, "
        f"s.path, s.hot_action, s.hot_action_at, s.city, s.duration_sec, s.page_count, "
        f"v.visit_count, v.is_converted, v.device_type, v.browser, v.os, v.phone, "
        f"EXTRACT(EPOCH FROM (NOW() - s.started_at))::int AS time_on_site "
        f"FROM {SCHEMA}.an_sessions s "
        f"LEFT JOIN {SCHEMA}.an_visitors v ON v.visitor_id = s.visitor_id "
        f"WHERE s.last_heartbeat > NOW() - INTERVAL '30 seconds' "
        f"ORDER BY s.started_at DESC LIMIT 100"
    )
    items = []
    now = datetime.now(timezone.utc)
    for r in cur.fetchall():
        d = dict(r)
        # горячий, если действие за последние 30 сек
        is_hot = False
        if d.get('hot_action_at'):
            try:
                ts = d['hot_action_at']
                if isinstance(ts, datetime):
                    is_hot = (now - ts).total_seconds() < 30
            except Exception:
                pass
        d['is_hot'] = is_hot
        items.append(d)
    cur.close(); conn.close()
    return _ok({'items': items, 'count': len(items)})


def action_stats_today():
    """KPI за сегодня."""
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT "
        f"  (SELECT COUNT(*) FROM {SCHEMA}.an_sessions WHERE last_heartbeat > NOW() - INTERVAL '30 seconds') AS online_now, "
        f"  (SELECT COUNT(DISTINCT visitor_id) FROM {SCHEMA}.an_sessions WHERE started_at::date = CURRENT_DATE) AS uniq_today, "
        f"  (SELECT COUNT(*) FROM {SCHEMA}.an_sessions WHERE started_at::date = CURRENT_DATE) AS sessions_today, "
        f"  (SELECT COUNT(*) FROM {SCHEMA}.an_conversions WHERE timestamp::date = CURRENT_DATE) AS conv_today, "
        f"  (SELECT COALESCE(SUM(amount), 0) FROM {SCHEMA}.an_conversions WHERE timestamp::date = CURRENT_DATE) AS conv_amount_today"
    )
    row = dict(cur.fetchone() or {})
    uniq = int(row.get('uniq_today') or 0)
    conv = int(row.get('conv_today') or 0)
    row['conversion_rate'] = round((conv / uniq * 100), 2) if uniq else 0.0
    row['conv_amount_today'] = float(row.get('conv_amount_today') or 0)

    # Топ источников за сегодня
    cur.execute(
        f"SELECT source, COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors "
        f"FROM {SCHEMA}.an_sessions WHERE started_at::date = CURRENT_DATE "
        f"GROUP BY source ORDER BY sessions DESC LIMIT 15"
    )
    row['top_sources'] = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok(row)


def action_conversions(qs):
    limit = min(int(qs.get('limit') or 50), 200)
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, visitor_id, session_id, type, form_data, amount, phone, city, source, timestamp "
        f"FROM {SCHEMA}.an_conversions ORDER BY timestamp DESC LIMIT {limit}"
    )
    items = []
    for r in cur.fetchall():
        d = dict(r)
        if isinstance(d.get('amount'), Decimal):
            d['amount'] = float(d['amount'])
        items.append(d)
    cur.close(); conn.close()
    return _ok({'items': items})


def action_recent_events(qs):
    """Новые события за последние N секунд (для тостов)."""
    seconds = min(int(qs.get('seconds') or 15), 120)
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT e.id, e.session_id, e.visitor_id, e.event_type, e.event_data, e.page_url, e.timestamp, "
        f"s.source, s.city, v.phone, v.is_converted "
        f"FROM {SCHEMA}.an_events e "
        f"LEFT JOIN {SCHEMA}.an_sessions s ON s.session_id = e.session_id "
        f"LEFT JOIN {SCHEMA}.an_visitors v ON v.visitor_id = e.visitor_id "
        f"WHERE e.timestamp > NOW() - INTERVAL '{seconds} seconds' "
        f"  AND e.event_type IN ('session_start', 'phone_click', 'whatsapp_click', 'telegram_click', 'form_submit', 'conversion') "
        f"ORDER BY e.timestamp DESC LIMIT 30"
    )
    items = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'items': items})


def action_visitor(qs):
    vid = (qs.get('id') or '').strip()
    if not vid:
        return _err(400, 'id required')
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.an_visitors WHERE visitor_id=%s", (vid,))
    visitor = cur.fetchone()
    if not visitor:
        cur.close(); conn.close()
        return _err(404, 'visitor not found')
    visitor = dict(visitor)

    cur.execute(
        f"SELECT session_id, started_at, ended_at, duration_sec, page_count, "
        f"source, medium, referrer, landing_page, exit_page, search_query, city, "
        f"current_page, hot_action, hot_action_at "
        f"FROM {SCHEMA}.an_sessions WHERE visitor_id=%s ORDER BY started_at DESC LIMIT 50",
        (vid,)
    )
    sessions = [dict(r) for r in cur.fetchall()]

    cur.execute(
        f"SELECT id, type, amount, phone, source, timestamp, form_data "
        f"FROM {SCHEMA}.an_conversions WHERE visitor_id=%s ORDER BY timestamp DESC",
        (vid,)
    )
    conversions = []
    for r in cur.fetchall():
        d = dict(r)
        if isinstance(d.get('amount'), Decimal):
            d['amount'] = float(d['amount'])
        conversions.append(d)
    cur.close(); conn.close()
    return _ok({'visitor': visitor, 'sessions': sessions, 'conversions': conversions})


def action_session_events(qs):
    sid = (qs.get('id') or '').strip()
    if not sid:
        return _err(400, 'id required')
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, event_type, page_url, page_title, event_data, timestamp "
        f"FROM {SCHEMA}.an_events WHERE session_id=%s ORDER BY timestamp ASC LIMIT 500",
        (sid,)
    )
    items = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'items': items})


def action_visitors(qs):
    """Список посетителей с фильтрацией по дате, источнику, конверсии. Пагинация offset/limit."""
    date_from = (qs.get('date_from') or '').strip()
    date_to   = (qs.get('date_to') or '').strip()
    source    = (qs.get('source') or '').strip()
    converted = qs.get('converted', '')
    limit  = min(int(qs.get('limit') or 50), 200)
    offset = max(int(qs.get('offset') or 0), 0)

    where = ["1=1"]
    params = []

    if date_from:
        where.append("v.last_seen::date >= %s")
        params.append(date_from)
    if date_to:
        where.append("v.last_seen::date <= %s")
        params.append(date_to)
    if source:
        where.append(
            "EXISTS (SELECT 1 FROM " + SCHEMA + ".an_sessions s2 "
            "WHERE s2.visitor_id=v.visitor_id AND s2.source=%s)"
        )
        params.append(source)
    if converted == '1':
        where.append("v.is_converted = TRUE")
    elif converted == '0':
        where.append("v.is_converted = FALSE")

    w = " AND ".join(where)
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Общее кол-во
    cur.execute(
        f"SELECT COUNT(*) FROM {SCHEMA}.an_visitors v WHERE {w}",
        params
    )
    total = cur.fetchone()['count']

    # Список с последним источником
    cur.execute(
        f"SELECT v.visitor_id, v.first_seen, v.last_seen, v.visit_count, "
        f"v.city, v.device_type, v.browser, v.os, v.is_converted, v.phone, "
        f"(SELECT s.source FROM {SCHEMA}.an_sessions s "
        f" WHERE s.visitor_id=v.visitor_id ORDER BY s.started_at DESC LIMIT 1) AS last_source, "
        f"(SELECT s.page_count FROM {SCHEMA}.an_sessions s "
        f" WHERE s.visitor_id=v.visitor_id ORDER BY s.started_at DESC LIMIT 1) AS last_pages "
        f"FROM {SCHEMA}.an_visitors v "
        f"WHERE {w} "
        f"ORDER BY v.last_seen DESC LIMIT {limit} OFFSET {offset}",
        params
    )
    items = [dict(r) for r in cur.fetchall()]

    # Агрегация по дням для графика (за выбранный диапазон или последние 30 дней)
    df = date_from or (datetime.now(timezone.utc) - timedelta(days=29)).strftime('%Y-%m-%d')
    dt = date_to   or datetime.now(timezone.utc).strftime('%Y-%m-%d')
    cur.execute(
        f"SELECT started_at::date AS day, "
        f"COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors "
        f"FROM {SCHEMA}.an_sessions "
        f"WHERE started_at::date BETWEEN %s AND %s "
        f"GROUP BY day ORDER BY day",
        (df, dt)
    )
    daily = [dict(r) for r in cur.fetchall()]

    # Топ источников за период
    cur.execute(
        f"SELECT source, COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors "
        f"FROM {SCHEMA}.an_sessions "
        f"WHERE started_at::date BETWEEN %s AND %s "
        f"GROUP BY source ORDER BY sessions DESC LIMIT 15",
        (df, dt)
    )
    sources = [dict(r) for r in cur.fetchall()]

    cur.close(); conn.close()
    return _ok({'items': items, 'total': total, 'daily': daily, 'sources': sources,
                'limit': limit, 'offset': offset})


def action_stats_range(qs):
    """KPI за произвольный период (date_from / date_to)."""
    date_from = (qs.get('date_from') or '').strip()
    date_to   = (qs.get('date_to') or '').strip()

    if not date_from:
        date_from = (datetime.now(timezone.utc) - timedelta(days=6)).strftime('%Y-%m-%d')
    if not date_to:
        date_to = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT "
        f"  (SELECT COUNT(DISTINCT visitor_id) FROM {SCHEMA}.an_sessions "
        f"   WHERE started_at::date BETWEEN %s AND %s) AS uniq_visitors, "
        f"  (SELECT COUNT(*) FROM {SCHEMA}.an_sessions "
        f"   WHERE started_at::date BETWEEN %s AND %s) AS total_sessions, "
        f"  (SELECT COUNT(*) FROM {SCHEMA}.an_conversions "
        f"   WHERE timestamp::date BETWEEN %s AND %s) AS total_conv, "
        f"  (SELECT COALESCE(SUM(amount),0) FROM {SCHEMA}.an_conversions "
        f"   WHERE timestamp::date BETWEEN %s AND %s) AS total_amount ",
        (date_from, date_to, date_from, date_to, date_from, date_to, date_from, date_to)
    )
    row = dict(cur.fetchone() or {})
    uniq = int(row.get('uniq_visitors') or 0)
    conv = int(row.get('total_conv') or 0)
    row['conversion_rate'] = round((conv / uniq * 100), 2) if uniq else 0.0
    row['total_amount'] = float(row.get('total_amount') or 0)
    row['date_from'] = date_from
    row['date_to'] = date_to
    cur.close(); conn.close()
    return _ok(row)


def action_search(qs):
    phone_raw = (qs.get('phone') or '').strip()
    digits = re.sub(r'\D', '', phone_raw)
    if len(digits) < 3:
        return _err(400, 'phone too short')
    pattern = f'%{digits}%'
    conn = _get_conn(); cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT DISTINCT v.visitor_id, v.phone, v.city, v.last_seen, v.visit_count, v.is_converted "
        f"FROM {SCHEMA}.an_visitors v "
        f"WHERE regexp_replace(COALESCE(v.phone, ''), '\\D', '', 'g') LIKE %s "
        f"   OR EXISTS (SELECT 1 FROM {SCHEMA}.an_conversions c "
        f"              WHERE c.visitor_id = v.visitor_id "
        f"              AND regexp_replace(COALESCE(c.phone, ''), '\\D', '', 'g') LIKE %s) "
        f"ORDER BY v.last_seen DESC LIMIT 30",
        (pattern, pattern)
    )
    items = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'items': items})


# ========== Handler ==========
def handler(event: dict, context) -> dict:
    """Аналитика. Публичные: track, convert. Админ: online, stats_today, conversions, recent_events, visitor, session_events, search."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    qs = event.get('queryStringParameters') or {}
    action = (qs.get('action') or '').strip()

    body = {}
    raw = event.get('body') or ''
    if raw and method == 'POST':
        try:
            body = json.loads(raw) if isinstance(raw, str) else (raw or {})
        except Exception:
            body = {}

    # Публичные
    if action == 'track' and method == 'POST':
        return action_track(body, event)
    if action == 'convert' and method == 'POST':
        return action_convert(body, event)

    # Админ
    admin = {'online', 'stats_today', 'conversions', 'recent_events', 'visitor', 'session_events', 'search', 'visitors', 'stats_range'}
    if action in admin:
        headers = event.get('headers') or {}
        token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''
        actor = _get_employee(token)
        if not actor:
            return _err(401, 'Не авторизован')
        if actor.get('role') not in ALLOWED_ROLES:
            return _err(403, 'Нет доступа')
        if method != 'GET':
            return _err(405, 'GET only')
        if action == 'online': return action_online()
        if action == 'stats_today': return action_stats_today()
        if action == 'conversions': return action_conversions(qs)
        if action == 'recent_events': return action_recent_events(qs)
        if action == 'visitor': return action_visitor(qs)
        if action == 'session_events': return action_session_events(qs)
        if action == 'search': return action_search(qs)
        if action == 'visitors': return action_visitors(qs)
        if action == 'stats_range': return action_stats_range(qs)

    return _err(400, f'Unknown action: {action}')