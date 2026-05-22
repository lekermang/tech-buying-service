"""
Кабинет клиента: ремонты, залоги 14 дней, предложения.

Действия (POST):
  - my_repairs       : мои ремонты (по телефону клиента)
  - my_contracts     : мои залоги (договоры 14 дней)
  - my_offers        : мои предложения (что я сдавал в скупку)
  - create_offer     : отправить новое предложение
  - upload_photo     : загрузить фото для предложения (base64 → S3)
"""
import os
import json
import uuid
import base64
import hashlib
from datetime import datetime, timezone
import psycopg2
import boto3
from botocore.client import Config as BotoConfig

try:
    from pywebpush import webpush, WebPushException  # type: ignore
    HAS_WEBPUSH = True
except Exception:
    HAS_WEBPUSH = False

SCHEMA = 't_p31606708_tech_buying_service'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Token',
}

ALLOWED_IMG = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/webp': 'webp', 'image/heic': 'heic',
}
MAX_PHOTO_BYTES = 8 * 1024 * 1024


def _ok(body, code=200):
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _err(msg, code=400):
    return _ok({'error': msg}, code)


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _resolve_client(event: dict):
    hdrs = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = (hdrs.get('x-client-token') or '').strip()
    if not token:
        return None
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, phone, email FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'full_name': row[1], 'phone': row[2], 'email': row[3]}
    finally:
        cur.close(); conn.close()


def _normalize_phone(phone: str) -> str:
    digits = ''.join(c for c in (phone or '') if c.isdigit())
    if digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    return digits


def handler(event: dict, context) -> dict:
    """Кабинет клиента: ремонты, залоги, предложения."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    me = _resolve_client(event)
    if not me:
        return _err('Unauthorized', 401)

    try:
        body = json.loads(event.get('body') or '{}')
    except Exception:
        body = {}
    action = (body.get('action') or '').strip()

    if action == 'my_repairs':
        return _my_repairs(me)
    if action == 'my_contracts':
        return _my_contracts(me)
    if action == 'my_offers':
        return _my_offers(me)
    if action == 'create_offer':
        return _create_offer(me, body)
    if action == 'upload_photo':
        return _upload_photo(me, body)
    if action == 'summary':
        return _summary(me)
    if action == 'vapid_public':
        return _ok({'public_key': os.environ.get('VAPID_PUBLIC_KEY', '')})
    if action == 'push_subscribe':
        return _push_subscribe(me, body)
    if action == 'push_unsubscribe':
        return _push_unsubscribe(me, body)
    if action == 'check_updates':
        return _check_updates(me)

    return _err(f'unknown action: {action}')


def _my_repairs(me):
    """Ремонты клиента — ищем по phone."""
    phone = _normalize_phone(me['phone'])
    last10 = phone[-10:] if len(phone) >= 10 else phone
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT id, created_at, name, phone, model, repair_type, price,
                   comment, status, status_updated_at, admin_note,
                   completed_at, picked_up_at, advance, is_paid
            FROM {SCHEMA}.repair_orders
            WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE %s
            ORDER BY created_at DESC
            LIMIT 100
        """, ('%' + last10,))
        rows = cur.fetchall()
        repairs = []
        for r in rows:
            repairs.append({
                'id': r[0],
                'created_at': r[1].isoformat() if r[1] else None,
                'name': r[2], 'phone': r[3], 'model': r[4],
                'repair_type': r[5], 'price': r[6], 'comment': r[7],
                'status': r[8],
                'status_updated_at': r[9].isoformat() if r[9] else None,
                'admin_note': r[10],
                'completed_at': r[11].isoformat() if r[11] else None,
                'picked_up_at': r[12].isoformat() if r[12] else None,
                'advance': r[13] or 0,
                'is_paid': r[14] or False,
            })
        return _ok({'repairs': repairs})
    except Exception as e:
        return _err(f'my_repairs failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _my_contracts(me):
    """Залоги 14 дней по телефону клиента."""
    phone = _normalize_phone(me['phone'])
    last10 = phone[-10:] if len(phone) >= 10 else phone
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT c.id, c.contract_number, c.amount, c.interest_rate, c.term_days,
                   c.total_due, c.paid_total, c.remaining_debt,
                   c.start_date, c.end_date, c.status, c.created_at,
                   i.item_type, i.brand, i.model, i.serial_number, i.condition, i.notes, i.accessories,
                   cl.full_name
            FROM {SCHEMA}.contracts_14d c
            JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id = c.client_id
            LEFT JOIN {SCHEMA}.contracts_14d_items i ON i.id = c.item_id
            WHERE REGEXP_REPLACE(COALESCE(cl.phone,''), '[^0-9]', '', 'g') LIKE %s
            ORDER BY c.created_at DESC
            LIMIT 50
        """, ('%' + last10,))
        rows = cur.fetchall()
        items = []
        today = datetime.now(timezone.utc).date()
        for r in rows:
            end_date = r[9]
            days_left = (end_date - today).days if end_date else None
            items.append({
                'id': r[0],
                'contract_number': r[1],
                'amount': float(r[2] or 0),
                'interest_rate': float(r[3] or 0),
                'term_days': r[4],
                'total_due': float(r[5] or 0),
                'paid_total': float(r[6] or 0),
                'remaining_debt': float(r[7] or 0),
                'start_date': r[8].isoformat() if r[8] else None,
                'end_date': end_date.isoformat() if end_date else None,
                'days_left': days_left,
                'status': r[10],
                'created_at': r[11].isoformat() if r[11] else None,
                'item': {
                    'type': r[12], 'brand': r[13], 'model': r[14],
                    'serial': r[15], 'condition': r[16], 'notes': r[17],
                    'accessories': r[18] or [],
                },
                'client_full_name': r[19],
            })
        return _ok({'contracts': items})
    except Exception as e:
        return _err(f'my_contracts failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _my_offers(me):
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT id, category, title, description, expected_price,
                   contact_phone, photos, status, admin_reply, created_at, updated_at
            FROM {SCHEMA}.client_offers WHERE client_id=%s
            ORDER BY created_at DESC LIMIT 100
        """, (me['id'],))
        offers = []
        for r in cur.fetchall():
            offers.append({
                'id': r[0], 'category': r[1], 'title': r[2],
                'description': r[3],
                'expected_price': float(r[4]) if r[4] else None,
                'contact_phone': r[5], 'photos': r[6] or [],
                'status': r[7], 'admin_reply': r[8],
                'created_at': r[9].isoformat() if r[9] else None,
                'updated_at': r[10].isoformat() if r[10] else None,
            })
        return _ok({'offers': offers})
    except Exception as e:
        return _err(f'my_offers failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _create_offer(me, body):
    category = (body.get('category') or 'other').strip()
    if category not in ('skupka', 'repair', 'lombard', 'other'):
        category = 'other'
    title = (body.get('title') or '').strip()
    description = (body.get('description') or '').strip()
    if len(title) < 2:
        return _err('Укажите название')
    price = body.get('expected_price')
    try:
        price = float(price) if price not in (None, '') else None
    except Exception:
        price = None
    contact_phone = (body.get('contact_phone') or me.get('phone') or '').strip()
    photos = body.get('photos') or []
    if not isinstance(photos, list):
        photos = []
    photos = [str(p) for p in photos][:10]

    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.client_offers
            (client_id, category, title, description, expected_price, contact_phone, photos)
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) RETURNING id, created_at
        """, (me['id'], category, title, description or None, price, contact_phone, json.dumps(photos)))
        new_id, created_at = cur.fetchone()
        conn.commit()
        return _ok({'ok': True, 'id': new_id, 'created_at': created_at.isoformat()})
    except Exception as e:
        conn.rollback()
        return _err(f'create_offer failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _upload_photo(me, body):
    b64 = (body.get('base64') or '').strip()
    mime = (body.get('mime_type') or '').strip().lower()
    if not b64:
        return _err('base64 пустой')
    ext = ALLOWED_IMG.get(mime)
    if not ext:
        return _err('Только jpg/png/webp/heic')
    try:
        data = base64.b64decode(b64)
    except Exception:
        return _err('base64 не валиден')
    if len(data) > MAX_PHOTO_BYTES:
        return _err(f'Файл больше {MAX_PHOTO_BYTES // 1024 // 1024} МБ')
    key = f"client-offers/{me['id']}/{uuid.uuid4().hex}.{ext}"
    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            config=BotoConfig(signature_version='s3v4'),
        )
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)
    except Exception as e:
        return _err(f's3 error: {e}', 500)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return _ok({'ok': True, 'photo_url': cdn_url})


def _summary(me):
    """Сводка для дашборда: счётчики по разделам."""
    phone = _normalize_phone(me['phone'])
    last10 = phone[-10:] if len(phone) >= 10 else phone
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            SELECT COUNT(*),
              COUNT(*) FILTER (WHERE status IN ('new','accepted','in_progress','ready','waiting_parts'))
            FROM {SCHEMA}.repair_orders
            WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE %s
        """, ('%' + last10,))
        rep_total, rep_active = cur.fetchone()

        cur.execute(f"""
            SELECT COUNT(*),
              COUNT(*) FILTER (WHERE status='active'),
              COALESCE(SUM(amount) FILTER (WHERE status='active'),0)
            FROM {SCHEMA}.contracts_14d c
            JOIN {SCHEMA}.contracts_14d_clients cl ON cl.id=c.client_id
            WHERE REGEXP_REPLACE(COALESCE(cl.phone,''), '[^0-9]', '', 'g') LIKE %s
        """, ('%' + last10,))
        ctr_total, ctr_active, ctr_amount = cur.fetchone()

        cur.execute(f"""
            SELECT COUNT(*), COUNT(*) FILTER (WHERE status='new')
            FROM {SCHEMA}.client_offers WHERE client_id=%s
        """, (me['id'],))
        off_total, off_new = cur.fetchone()

        return _ok({
            'repairs': {'total': rep_total, 'active': rep_active},
            'contracts': {'total': ctr_total, 'active': ctr_active, 'amount_active': float(ctr_amount or 0)},
            'offers': {'total': off_total, 'new': off_new},
        })
    except Exception as e:
        return _err(f'summary failed: {e}', 500)
    finally:
        cur.close(); conn.close()


# ─── Web Push ──────────────────────────────────────────────────────────────────

def _push_subscribe(me, body):
    """Сохранить web push подписку браузера клиента."""
    sub = body.get('subscription') or {}
    endpoint = (sub.get('endpoint') or '').strip()
    keys = sub.get('keys') or {}
    p256dh = (keys.get('p256dh') or '').strip()
    auth = (keys.get('auth') or '').strip()
    user_agent = (body.get('user_agent') or '')[:500]
    if not endpoint or not p256dh or not auth:
        return _err('Нужны endpoint и keys.{p256dh,auth}')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            INSERT INTO {SCHEMA}.client_push_subs (client_id, endpoint, p256dh, auth, user_agent, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (endpoint) DO UPDATE SET
              client_id=EXCLUDED.client_id, p256dh=EXCLUDED.p256dh,
              auth=EXCLUDED.auth, user_agent=EXCLUDED.user_agent, updated_at=NOW()
        """, (me['id'], endpoint, p256dh, auth, user_agent))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'push_subscribe failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _push_unsubscribe(me, body):
    endpoint = (body.get('endpoint') or '').strip()
    if not endpoint:
        return _err('endpoint обязателен')
    conn = _connect()
    cur = conn.cursor()
    try:
        cur.execute(f"""
            UPDATE {SCHEMA}.client_push_subs SET p256dh='', auth='', updated_at=NOW()
            WHERE endpoint=%s AND client_id=%s
        """, (endpoint, me['id']))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(f'push_unsubscribe failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _check_updates(me):
    """Проверяет смену статусов ремонтов и новые ответы менеджера → шлёт push.
    Вызывается клиентом при poll'е или сотрудником после изменений.
    """
    sent = 0
    phone = _normalize_phone(me['phone'])
    last10 = phone[-10:] if len(phone) >= 10 else phone
    conn = _connect()
    cur = conn.cursor()
    try:
        # 1. Ремонты со сменой статуса
        cur.execute(f"""
            SELECT id, status, last_push_status, model, repair_type, admin_note
            FROM {SCHEMA}.repair_orders
            WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') LIKE %s
              AND (last_push_status IS NULL OR last_push_status <> status)
              AND status IN ('in_progress','waiting_parts','ready','done','completed','cancelled')
        """, ('%' + last10,))
        repairs = cur.fetchall()
        for r in repairs:
            rid, status, _last, model, rtype, note = r
            title = "Скупка 24 · Ремонт"
            body_txt = _repair_status_text(status, model or rtype or 'устройство')
            url = f"/client?tab=repairs"
            _send_to_client(me['id'], {
                'title': title, 'body': body_txt, 'url': url,
                'tag': f'repair-{rid}', 'badge': '/icon-192.png',
            })
            cur.execute(f"UPDATE {SCHEMA}.repair_orders SET last_push_status=%s, last_push_at=NOW() WHERE id=%s", (status, rid))
            sent += 1

        # 2. Предложения с новым ответом
        cur.execute(f"""
            SELECT id, title, admin_reply, last_push_reply_hash
            FROM {SCHEMA}.client_offers
            WHERE client_id=%s AND admin_reply IS NOT NULL AND admin_reply <> ''
        """, (me['id'],))
        offers = cur.fetchall()
        for o in offers:
            oid, title, reply, prev_hash = o
            h = hashlib.sha256((reply or '').encode('utf-8')).hexdigest()[:16]
            if h == prev_hash:
                continue
            _send_to_client(me['id'], {
                'title': f"Скупка 24 · {title}"[:80],
                'body': (reply or '')[:160],
                'url': '/client?tab=offers',
                'tag': f'offer-{oid}',
            })
            cur.execute(f"UPDATE {SCHEMA}.client_offers SET last_push_reply_hash=%s, last_push_at=NOW() WHERE id=%s", (h, oid))
            sent += 1
        conn.commit()
        return _ok({'ok': True, 'sent': sent})
    except Exception as e:
        conn.rollback()
        return _err(f'check_updates failed: {e}', 500)
    finally:
        cur.close(); conn.close()


def _repair_status_text(status: str, device: str) -> str:
    texts = {
        'in_progress': f'Мастер приступил к ремонту: {device}',
        'waiting_parts': f'Ждём запчасть для: {device}',
        'ready': f'Готов к выдаче: {device} 🎉',
        'done': f'Ремонт выдан: {device}',
        'completed': f'Ремонт выдан: {device}',
        'cancelled': f'Заявка отменена: {device}',
    }
    return texts.get(status, f'Статус ремонта обновлён: {device}')


def _send_to_client(client_id: int, payload: dict) -> int:
    """Шлёт push всем подпискам клиента."""
    if not HAS_WEBPUSH:
        return 0
    private_key = os.environ.get('VAPID_PRIVATE_KEY', '')
    public_key = os.environ.get('VAPID_PUBLIC_KEY', '')
    if not private_key or not public_key:
        return 0
    vapid_claims = {'sub': 'mailto:lekermany@yandex.ru'}
    conn = _connect()
    cur = conn.cursor()
    sent = 0
    dead = []
    try:
        cur.execute(f"""
            SELECT endpoint, p256dh, auth FROM {SCHEMA}.client_push_subs
            WHERE client_id=%s AND p256dh<>'' AND auth<>''
        """, (client_id,))
        body_str = json.dumps(payload, ensure_ascii=False)
        for endpoint, p256dh, auth in cur.fetchall():
            try:
                webpush(
                    subscription_info={'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth}},
                    data=body_str,
                    vapid_private_key=private_key,
                    vapid_claims=vapid_claims,
                    timeout=4,
                )
                sent += 1
            except WebPushException as e:
                code = getattr(e.response, 'status_code', 0) if e.response else 0
                if code in (404, 410):
                    dead.append(endpoint)
            except Exception:
                pass
        if dead:
            cur.executemany(
                f"UPDATE {SCHEMA}.client_push_subs SET p256dh='', auth='', updated_at=NOW() WHERE endpoint=%s",
                [(e,) for e in dead]
            )
            conn.commit()
    except Exception:
        pass
    finally:
        cur.close(); conn.close()
    return sent