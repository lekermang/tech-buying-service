"""Безопасные сделки (комиссионка с гарантом-Скупка24).
Публичные действия (без авторизации):
- create: продавец подаёт заявку (получает seller_token + deal_number)
- get_by_token: личный кабинет продавца (по seller_token)
- get_by_qr: страница покупателя по QR
- confirm_by_qr: покупатель подтверждает получение
- cancel_by_token: продавец отменяет до резервации

Внутренние действия (для админки, добавим позже): list, update_status, attach_buyer, mark_office_checked.
"""
import base64
import io
import json
import os
import re
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
import psycopg2
import psycopg2.extras

SCHEMA = 't_p31606708_tech_buying_service'
COMMISSION_PCT = Decimal('10.00')
REALIZATION_DAYS = 14
MAX_PHOTO_BYTES = 4 * 1024 * 1024

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def _ok(data):
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str), 'isBase64Encoded': False}


def _err(code, msg):
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps({'error': msg}, ensure_ascii=False), 'isBase64Encoded': False}


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )


def _next_deal_number(cur) -> str:
    year = datetime.now().year
    cur.execute(
        f"SELECT COUNT(*) AS c FROM {SCHEMA}.safe_deals WHERE deal_number LIKE %s",
        (f'SD-{year}-%',)
    )
    row = cur.fetchone()
    # Поддержка как RealDict, так и обычного курсора
    n = (row['c'] if isinstance(row, dict) else row[0]) or 0
    return f'SD-{year}-{(n + 1):05d}'


def _gen_qr_code() -> str:
    alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    return ''.join(secrets.choice(alphabet) for _ in range(8))


def _phone_normalize(s: str) -> str:
    digits = re.sub(r'\D', '', s or '')
    if len(digits) == 10:
        digits = '7' + digits
    elif digits.startswith('8') and len(digits) == 11:
        digits = '7' + digits[1:]
    return '+' + digits if digits else ''


def _log(cur, deal_id, event_type, details=None, actor=None):
    cur.execute(
        f"INSERT INTO {SCHEMA}.safe_deal_events (deal_id, event_type, details, actor) "
        f"VALUES (%s, %s, %s::jsonb, %s)",
        (deal_id, event_type, json.dumps(details or {}, ensure_ascii=False, default=str), actor),
    )


def _upload_photo_b64(deal_id: int, b64: str, idx: int) -> str:
    """Загружает base64 фото в S3, возвращает CDN URL."""
    if ',' in b64:
        b64 = b64.split(',', 1)[1]
    data = base64.b64decode(b64)
    if len(data) > MAX_PHOTO_BYTES:
        raise ValueError(f'Фото слишком большое (макс 4 МБ)')
    mime = 'image/jpeg'
    if data[:4] == b'\x89PNG':
        mime = 'image/png'
    elif data[:4] == b'RIFF':
        mime = 'image/webp'
    ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[mime]
    key = f"safe-deals/{deal_id}/{int(datetime.now().timestamp()*1000)}_{idx}.{ext}"
    s3 = _get_s3()
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _deal_to_dict(row) -> dict:
    d = dict(row)
    # JSONB photos уже list
    photos = d.get('photos')
    if isinstance(photos, str):
        try:
            photos = json.loads(photos)
        except Exception:
            photos = []
    d['photos'] = photos or []
    # Decimal → float
    for k in ('price', 'commission_pct', 'commission_amount', 'seller_payout'):
        if isinstance(d.get(k), Decimal):
            d[k] = float(d[k])
    # datetime → iso
    for k in ('created_at', 'updated_at', 'expires_at', 'office_checked_at', 'reservation_until', 'completed_at'):
        if isinstance(d.get(k), datetime):
            d[k] = d[k].isoformat()
    return d


def _public_view(deal: dict) -> dict:
    """Безопасный (публичный) вид сделки — без чувствительных деталей продавца."""
    seller = deal.get('seller_name', '') or ''
    parts = seller.split()
    masked = parts[0] + ' ' + '. '.join(p[0] for p in parts[1:]) + '.' if len(parts) >= 2 else seller
    return {
        'dealNumber': deal['deal_number'],
        'status': deal['status'],
        'productTitle': deal['product_title'],
        'productBrand': deal.get('product_brand'),
        'productModel': deal.get('product_model'),
        'productCategory': deal.get('product_category'),
        'productCondition': deal.get('product_condition'),
        'productDescription': deal.get('product_description'),
        'photos': deal.get('photos') or [],
        'price': deal.get('price'),
        'sellerNameMasked': masked,
        'officeCheckNotes': deal.get('office_check_notes'),
        'officeCheckedAt': deal.get('office_checked_at'),
        'createdAt': deal.get('created_at'),
    }


# ============ CREATE ============
def action_create(body, event):
    """Создаёт новую заявку. Возвращает seller_token и deal_number."""
    seller_name = (body.get('sellerName') or '').strip()
    seller_phone_raw = (body.get('sellerPhone') or '').strip()
    seller_email = (body.get('sellerEmail') or '').strip() or None
    title = (body.get('productTitle') or '').strip()
    price_raw = body.get('price')
    description = (body.get('productDescription') or '').strip() or None
    brand = (body.get('productBrand') or '').strip() or None
    model = (body.get('productModel') or '').strip() or None
    category = (body.get('productCategory') or '').strip() or None
    condition = (body.get('productCondition') or '').strip() or None
    serial = (body.get('productSerial') or '').strip() or None
    payment_method = (body.get('paymentMethod') or 'cash').strip()
    payout_method = (body.get('payoutMethod') or 'cash').strip()
    payout_details = (body.get('payoutDetails') or '').strip() or None
    photos_b64 = body.get('photos') or []  # массив base64

    if not seller_name or len(seller_name) < 3:
        return _err(400, 'Укажите ваше имя')
    seller_phone = _phone_normalize(seller_phone_raw)
    if not seller_phone or len(seller_phone) < 11:
        return _err(400, 'Укажите телефон')
    if not title or len(title) < 3:
        return _err(400, 'Опишите товар')
    try:
        price = Decimal(str(price_raw or 0))
    except Exception:
        return _err(400, 'Некорректная цена')
    if price <= 0:
        return _err(400, 'Цена должна быть больше 0')
    if payment_method not in ('cash', 'transfer'):
        payment_method = 'cash'
    if payout_method not in ('cash', 'transfer'):
        payout_method = 'cash'

    commission_pct = COMMISSION_PCT
    commission_amount = (price * commission_pct / Decimal('100')).quantize(Decimal('0.01'))
    seller_payout = (price - commission_amount).quantize(Decimal('0.01'))

    seller_token = uuid.uuid4().hex
    qr_code = _gen_qr_code()

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Уникальность QR
        for _ in range(5):
            cur.execute(f"SELECT 1 FROM {SCHEMA}.safe_deals WHERE qr_code=%s", (qr_code,))
            if not cur.fetchone():
                break
            qr_code = _gen_qr_code()

        deal_number = _next_deal_number(cur)
        cur.execute(
            f"INSERT INTO {SCHEMA}.safe_deals "
            f"(deal_number, seller_token, qr_code, status, "
            f"seller_name, seller_phone, seller_email, "
            f"product_title, product_brand, product_model, product_category, product_condition, "
            f"product_description, product_serial, "
            f"price, commission_pct, commission_amount, seller_payout, "
            f"payment_method, payout_method, payout_details) "
            f"VALUES (%s, %s, %s, 'submitted', "
            f"%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                deal_number, seller_token, qr_code,
                seller_name, seller_phone, seller_email,
                title, brand, model, category, condition,
                description, serial,
                price, commission_pct, commission_amount, seller_payout,
                payment_method, payout_method, payout_details,
            )
        )
        deal_id = cur.fetchone()['id']

        photo_urls = []
        if isinstance(photos_b64, list) and photos_b64:
            for i, b in enumerate(photos_b64[:6]):  # макс 6 фото
                try:
                    url = _upload_photo_b64(deal_id, b, i)
                    photo_urls.append({'url': url, 'uploaded_at': datetime.now(timezone.utc).isoformat()})
                except Exception:
                    continue
            if photo_urls:
                cur.execute(
                    f"UPDATE {SCHEMA}.safe_deals SET photos=%s::jsonb WHERE id=%s",
                    (json.dumps(photo_urls), deal_id)
                )

        _log(cur, deal_id, 'submitted', {'price': float(price), 'photos': len(photo_urls)}, actor=seller_name)
        ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp')
        if ip:
            _log(cur, deal_id, 'ip_logged', {'ip': ip})

        conn.commit()
        return _ok({
            'dealNumber': deal_number,
            'sellerToken': seller_token,
            'qrCode': qr_code,
            'commissionPct': float(commission_pct),
            'commissionAmount': float(commission_amount),
            'sellerPayout': float(seller_payout),
            'realizationDays': REALIZATION_DAYS,
            'officeAddress': 'г. Калуга, ул. Кирова, 11',
            'photosUploaded': len(photo_urls),
        })
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка создания: {e}')
    finally:
        cur.close(); conn.close()


# ============ GET BY TOKEN ============
def action_get_by_token(qs):
    token = (qs.get('token') or '').strip()
    if not token or len(token) < 16:
        return _err(400, 'token required')
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.safe_deals WHERE seller_token=%s",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return _err(404, 'Сделка не найдена')
    deal = _deal_to_dict(row)
    cur.execute(
        f"SELECT id, event_type, details, actor, created_at FROM {SCHEMA}.safe_deal_events "
        f"WHERE deal_id=%s ORDER BY created_at DESC LIMIT 50",
        (deal['id'],)
    )
    events = []
    for r in cur.fetchall():
        e = dict(r)
        if isinstance(e['created_at'], datetime):
            e['created_at'] = e['created_at'].isoformat()
        # details — уже dict (psycopg2 JSONB → dict). Превратим в JSON-сериализуемое
        events.append(e)
    cur.close(); conn.close()
    deal['events'] = events
    return _ok(deal)


# ============ GET BY QR ============
def action_get_by_qr(qs):
    code = (qs.get('code') or '').strip().upper()
    if not code:
        return _err(400, 'code required')
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.safe_deals WHERE qr_code=%s",
        (code,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return _err(404, 'Сделка не найдена')
    return _ok(_public_view(_deal_to_dict(row)))


# ============ CONFIRM BY QR (покупатель) ============
def action_confirm_by_qr(body):
    code = (body.get('code') or '').strip().upper()
    buyer_name = (body.get('buyerName') or '').strip()
    buyer_phone = _phone_normalize(body.get('buyerPhone') or '')
    rating_raw = body.get('rating')
    comment = (body.get('comment') or '').strip() or None
    if not code:
        return _err(400, 'code required')
    if not buyer_name:
        return _err(400, 'Укажите имя')
    if not buyer_phone or len(buyer_phone) < 11:
        return _err(400, 'Укажите телефон')
    try:
        rating = int(rating_raw) if rating_raw is not None else None
        if rating is not None and (rating < 1 or rating > 5):
            rating = None
    except Exception:
        rating = None

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(
            f"SELECT id, status FROM {SCHEMA}.safe_deals WHERE qr_code=%s FOR UPDATE",
            (code,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Сделка не найдена')
        if row['status'] == 'completed':
            return _err(400, 'Сделка уже завершена')
        if row['status'] in ('cancelled', 'returned'):
            return _err(400, 'Сделка отменена')
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET "
            f"status='completed', "
            f"buyer_name=%s, buyer_phone=%s, "
            f"completed_at=NOW(), updated_at=NOW() "
            f"WHERE id=%s",
            (buyer_name, buyer_phone, row['id'])
        )
        _log(cur, row['id'], 'completed', {
            'buyer_name': buyer_name,
            'buyer_phone': buyer_phone,
            'rating': rating,
            'comment': comment,
        }, actor=buyer_name)
        conn.commit()
        return _ok({'ok': True, 'dealId': row['id']})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ CANCEL BY TOKEN ============
def action_cancel_by_token(body):
    token = (body.get('token') or '').strip()
    reason = (body.get('reason') or '').strip() or 'Отмена продавцом'
    if not token:
        return _err(400, 'token required')
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cur.execute(
            f"SELECT id, status, seller_name FROM {SCHEMA}.safe_deals "
            f"WHERE seller_token=%s FOR UPDATE",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Сделка не найдена')
        if row['status'] in ('completed', 'cancelled', 'returned'):
            return _err(400, 'Сделку нельзя отменить в этом статусе')
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET status='cancelled', "
            f"cancel_reason=%s, updated_at=NOW() WHERE id=%s",
            (reason, row['id'])
        )
        _log(cur, row['id'], 'cancelled', {'reason': reason}, actor=row['seller_name'])
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ HANDLER ============
def handler(event: dict, context) -> dict:
    """Безопасные сделки: ?action=create|get_by_token|get_by_qr|confirm_by_qr|cancel_by_token."""
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

    if method == 'GET':
        if action == 'get_by_token':
            return action_get_by_token(qs)
        if action == 'get_by_qr':
            return action_get_by_qr(qs)
        return _err(400, f'Unknown GET action: {action}')

    if method == 'POST':
        if action == 'create':
            return action_create(body, event)
        if action == 'confirm_by_qr':
            return action_confirm_by_qr(body)
        if action == 'cancel_by_token':
            return action_cancel_by_token(body)
        return _err(400, f'Unknown POST action: {action}')

    return _err(405, 'Method not allowed')