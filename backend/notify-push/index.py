"""
Универсальный пуш-хаб Скупка 24.

Любая backend-функция может вызвать эту, чтобы разослать push-уведомление
всем подписанным сотрудникам (или по фильтру ролей/логинов).

Запрос:
  POST  с JSON-телом:
    {
      "title":  "Новый ремонт",
      "body":   "iPhone 13, тачскрин, 12 000 ₽",
      "url":    "/staff?tab=repair",      // куда открыть по клику
      "tag":    "repair-new",             // тег (одинаковые перетирают друг друга)
      "roles":  ["owner", "admin"],       // (опц.) только этим ролям
      "logins": ["PluXan", "Bogdan"],     // (опц.) точечно по логинам
      "exclude_employee_id": 12           // (опц.) кому НЕ отправлять
    }
  Заголовок X-Service-Token: <ADMIN_TOKEN>  — простая защита от чужих запросов.

Подписки берутся из таблицы vip_chat_push_subs — единая таблица браузерных
подписок устройств сотрудников.
"""
import json
import os
import psycopg2

try:
    from pywebpush import webpush, WebPushException  # type: ignore
    HAS_WEBPUSH = True
except Exception:
    HAS_WEBPUSH = False

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Service-Token',
}


def _ok(body: dict, code: int = 200) -> dict:
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False),
    }


def _err(msg: str, code: int = 400) -> dict:
    return _ok({'error': msg}, code)


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _broadcast(payload: dict, roles=None, logins=None, exclude_employee_id=None) -> dict:
    """Шлёт push всем подходящим сотрудникам. Возвращает {sent, dead, total}."""
    if not HAS_WEBPUSH:
        return {'sent': 0, 'dead': 0, 'total': 0, 'error': 'no pywebpush'}
    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    if not private_key or not public_key:
        return {'sent': 0, 'dead': 0, 'total': 0, 'error': 'no VAPID keys'}

    vapid_claims = {'sub': 'mailto:lekermany@yandex.ru'}
    conn = _connect()
    cur = conn.cursor()
    sent = 0
    total = 0
    dead_endpoints = []
    try:
        # Базовый запрос подписок
        sql = (
            f"SELECT s.endpoint, s.p256dh, s.auth "
            f"FROM {SCHEMA}.vip_chat_push_subs s "
            f"JOIN {SCHEMA}.employees e ON e.id=s.employee_id "
            f"WHERE s.p256dh<>'' AND s.auth<>'' AND e.is_active=true"
        )
        if exclude_employee_id is not None:
            sql += f" AND s.employee_id<>{int(exclude_employee_id)}"
        if roles:
            roles_sql = ", ".join("'" + str(r).replace("'", "''") + "'" for r in roles)
            sql += f" AND e.role IN ({roles_sql})"
        if logins:
            logins_sql = ", ".join("'" + str(l).replace("'", "''") + "'" for l in logins)
            sql += f" AND e.login IN ({logins_sql})"
        cur.execute(sql)
        rows = cur.fetchall()
        total = len(rows)

        body_str = json.dumps(payload, ensure_ascii=False)
        for endpoint, p256dh, auth in rows:
            try:
                webpush(
                    subscription_info={
                        'endpoint': endpoint,
                        'keys': {'p256dh': p256dh, 'auth': auth},
                    },
                    data=body_str,
                    vapid_private_key=private_key,
                    vapid_claims=vapid_claims,
                    timeout=4,
                )
                sent += 1
            except WebPushException as e:
                code = getattr(e.response, 'status_code', 0) if e.response else 0
                if code in (404, 410):
                    dead_endpoints.append(endpoint)
            except Exception:
                pass

        if dead_endpoints:
            cur.executemany(
                f"UPDATE {SCHEMA}.vip_chat_push_subs SET p256dh='', auth='', updated_at=NOW() WHERE endpoint=%s",
                [(e,) for e in dead_endpoints],
            )
            conn.commit()
    finally:
        cur.close()
        conn.close()
    return {'sent': sent, 'dead': len(dead_endpoints), 'total': total}


def handler(event: dict, context) -> dict:
    """Пуш-хаб: принимает событие и рассылает уведомления сотрудникам."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    headers_in = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (headers_in.get('x-service-token') or '').strip()
    if not token or token != os.environ.get('ADMIN_TOKEN', ''):
        return _err('Forbidden', 403)

    if event.get('httpMethod') != 'POST':
        return _err('POST only', 405)

    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        return _err('Bad JSON')

    title = (body.get('title') or '').strip()
    text = (body.get('body') or '').strip()
    if not title or not text:
        return _err('title и body обязательны')

    payload = {
        'title': title[:120],
        'body': text[:300],
        'url': body.get('url') or '/staff',
        'tag': body.get('tag') or 'skupka24',
        'icon': body.get('icon'),
    }
    roles = body.get('roles') if isinstance(body.get('roles'), list) else None
    logins = body.get('logins') if isinstance(body.get('logins'), list) else None
    exclude = body.get('exclude_employee_id')

    result = _broadcast(payload, roles=roles, logins=logins, exclude_employee_id=exclude)
    return _ok({'ok': True, **result})
