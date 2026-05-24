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
ALLOWED_ROLES = {'owner', 'admin', 'staff', 'manager', 'master'}

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


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
    photo_urls_in = body.get('photoUrls') or []  # уже загруженные URL (от ai_fill/upload_photo)
    # Доп. поля
    seller_passport = body.get('sellerPassport')  # dict с полями паспорта
    seller_passport_photo_url = (body.get('sellerPassportPhotoUrl') or '').strip() or None
    seller_yandex_id = (body.get('sellerYandexId') or '').strip() or None
    avito_url = (body.get('avitoUrl') or '').strip() or None
    ai_check_data = body.get('aiCheck')  # результат ИИ-проверки
    referrer_token = (body.get('referrerToken') or '').strip() or None
    courier_pickup = bool(body.get('courierPickup'))
    courier_address = (body.get('courierAddress') or '').strip() or None
    courier_fee = Decimal('400.00') if courier_pickup else Decimal('0.00')
    category_id_raw = body.get('categoryId')
    category_id = None
    try:
        if category_id_raw:
            category_id = int(category_id_raw)
    except Exception:
        category_id = None
    # Реферальный код продавца (для его последующего шеринга)
    referral_code = (uuid.uuid4().hex[:8]).upper()

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
        # Проверка чёрного списка
        bl = _check_blacklist(cur, phone=seller_phone, yandex_id=seller_yandex_id or '')
        if bl.get('in_blacklist'):
            cur.close(); conn.close()
            return _err(403, f"Заявки от этого аккаунта не принимаются. Причина: {bl.get('reason', 'не указана')}. Обратитесь в офис.")

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
            f"payment_method, payout_method, payout_details, "
            f"seller_passport, seller_passport_photo_url, seller_yandex_id, "
            f"avito_url, ai_check, category_id, "
            f"referral_code, referrer_token, courier_pickup, courier_address, courier_fee) "
            f"VALUES (%s, %s, %s, 'submitted', "
            f"%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
            f"%s::jsonb, %s, %s, %s, %s::jsonb, %s, "
            f"%s, %s, %s, %s, %s) RETURNING id",
            (
                deal_number, seller_token, qr_code,
                seller_name, seller_phone, seller_email,
                title, brand, model, category, condition,
                description, serial,
                price, commission_pct, commission_amount, seller_payout,
                payment_method, payout_method, payout_details,
                json.dumps(seller_passport, ensure_ascii=False) if seller_passport else None,
                seller_passport_photo_url, seller_yandex_id,
                avito_url,
                json.dumps(ai_check_data, ensure_ascii=False) if ai_check_data else None,
                category_id,
                referral_code, referrer_token,
                courier_pickup, courier_address, courier_fee,
            )
        )
        deal_id = cur.fetchone()['id']

        photo_urls = []
        # Уже загруженные URL (например через ai_fill/upload_photo)
        if isinstance(photo_urls_in, list):
            for u in photo_urls_in[:6]:
                if isinstance(u, str) and u.startswith('http'):
                    photo_urls.append({'url': u, 'uploaded_at': datetime.now(timezone.utc).isoformat()})
        # base64 фото
        if isinstance(photos_b64, list) and photos_b64 and len(photo_urls) < 6:
            slots = 6 - len(photo_urls)
            for i, b in enumerate(photos_b64[:slots]):
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


# ============ PUBLIC: YANDEX OAUTH (быстрая регистрация продавца) ============
def action_yandex_config():
    """Отдаёт публичный YANDEX_CLIENT_ID для фронта (нужен для OAuth flow)."""
    cid = os.environ.get('YANDEX_CLIENT_ID', '')
    return _ok({'clientId': cid, 'available': bool(cid)})


def action_yandex_auth(body):
    """Принимает code от Yandex OAuth → возвращает данные пользователя для авто-заполнения формы.
    Не создаёт клиента (это не регистрация на сайте, а просто заполнение формы)."""
    import urllib.request as _urlreq
    import urllib.parse as _urlparse

    code = (body.get('code') or '').strip()
    redirect_uri = (body.get('redirect_uri') or '').strip()
    if not code:
        return _err(400, 'code required')

    client_id = os.environ.get('YANDEX_CLIENT_ID', '')
    client_secret = os.environ.get('YANDEX_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return _err(503, 'Яндекс OAuth не настроен')

    try:
        # Обмен code на access_token
        data = _urlparse.urlencode({
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
        }).encode('utf-8')
        req = _urlreq.Request('https://oauth.yandex.ru/token', data=data, method='POST')
        with _urlreq.urlopen(req, timeout=10) as resp:
            token_data = json.loads(resp.read().decode('utf-8'))
        ya_token = token_data.get('access_token')
        if not ya_token:
            return _err(400, 'Не удалось получить токен Яндекса')

        # Получение данных пользователя
        info_req = _urlreq.Request(
            'https://login.yandex.ru/info?format=json',
            headers={'Authorization': f'OAuth {ya_token}'},
        )
        with _urlreq.urlopen(info_req, timeout=10) as resp:
            info = json.loads(resp.read().decode('utf-8'))

        return _ok({
            'fullName': info.get('real_name') or info.get('display_name') or '',
            'email': info.get('default_email') or '',
            'phone': (info.get('default_phone') or {}).get('number', '') if info.get('default_phone') else '',
            'yandexId': str(info.get('id') or ''),
        })
    except Exception as e:
        return _err(502, f'Яндекс ошибка: {e}')


# ============ PUBLIC: SCAN PASSPORT ============
def action_scan_passport(body):
    """Распознаёт паспорт по фото — выдёргивает ФИО, серию/номер, кем выдан, дату.
    Используем тот же GPT-4o-mini (Polza.ai), что и в slshop."""
    b64 = body.get('fileBase64') or ''
    if not b64:
        return _err(400, 'fileBase64 required')

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return _err(503, 'OCR временно недоступен')

    # Сначала загрузим в S3 (нужен URL для vision API)
    try:
        if ',' in b64:
            b64 = b64.split(',', 1)[1]
        data = base64.b64decode(b64)
        if len(data) > MAX_PHOTO_BYTES * 2:  # паспорт может быть 8 МБ
            return _err(413, 'Фото больше 8 МБ')
        mime = 'image/jpeg'
        if data[:4] == b'\x89PNG':
            mime = 'image/png'
        ext = 'jpg' if mime == 'image/jpeg' else 'png'
        key = f"safe-deals/tmp/passport_{int(datetime.now().timestamp()*1000)}_{secrets.token_hex(4)}.{ext}"
        s3 = _get_s3()
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception as e:
        return _err(500, f'Не удалось загрузить фото: {e}')

    prompt = (
        "Перед тобой страница российского паспорта. Распознай и верни СТРОГО в JSON:\n"
        '{ "full_name": "Фамилия Имя Отчество", "series": "0000", "number": "000000", '
        '"issued_by": "кем выдан", "issued_date": "YYYY-MM-DD", "birth_date": "YYYY-MM-DD" }\n'
        "Если какое-то поле не видно — пустая строка. Не выдумывай данные.\n"
    )

    try:
        import urllib.request as _urlreq
        req_body = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": url}},
            ]}],
            "max_tokens": 400,
            "temperature": 0.1,
            "response_format": {"type": "json_object"},
        }
        req = _urlreq.Request(
            'https://api.polza.ai/v1/chat/completions',
            data=json.dumps(req_body).encode('utf-8'),
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            method='POST',
        )
        with _urlreq.urlopen(req, timeout=30) as resp:
            ai_resp = json.loads(resp.read().decode('utf-8'))
        parsed = json.loads(ai_resp['choices'][0]['message']['content'])
        return _ok({
            'fullName': parsed.get('full_name') or '',
            'series': parsed.get('series') or '',
            'number': parsed.get('number') or '',
            'issuedBy': parsed.get('issued_by') or '',
            'issuedDate': parsed.get('issued_date') or '',
            'birthDate': parsed.get('birth_date') or '',
            'photoUrl': url,  # храним для проверки сотрудником
        })
    except Exception as e:
        return _err(502, f'OCR ошибка: {e}')


# ============ PUBLIC: BLACKLIST (анонимный) ============
def action_blacklist_public():
    """Публичный анонимизированный чёрный список: показывает только маскированные данные."""
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, kind, value, reason, role, incidents_count, created_at "
        f"FROM {SCHEMA}.safe_deals_blacklist "
        f"WHERE is_public=TRUE ORDER BY created_at DESC LIMIT 200"
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    items = []
    for r in rows:
        val = (r.get('value') or '')
        # Маскируем телефоны/идентификаторы
        if r.get('kind') == 'phone' and len(val) >= 8:
            masked = val[:2] + '*' * (len(val) - 6) + val[-4:]
        elif len(val) > 6:
            masked = val[:2] + '*' * 4 + val[-2:]
        else:
            masked = '****'
        items.append({
            'id': r['id'],
            'kind': r.get('kind'),
            'masked': masked,
            'reason': r.get('reason'),
            'role': r.get('role') or 'seller',
            'incidents': int(r.get('incidents_count') or 1),
            'createdAt': r['created_at'].isoformat() if isinstance(r.get('created_at'), datetime) else None,
        })
    return _ok({'items': items, 'count': len(items)})


# ============ PUBLIC: LEAD (подписка на чек-лист) ============
def action_subscribe_lead(body):
    """Сохраняет контакт за бесплатный чек-лист. Возвращает ссылку на PDF/HTML."""
    contact = (body.get('contact') or '').strip()
    source = (body.get('source') or 'checklist').strip()
    if not contact or len(contact) < 4:
        return _err(400, 'Укажите email или телефон')
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.safe_deals_leads (contact, source) VALUES (%s, %s) RETURNING id",
            (contact, source),
        )
        conn.commit()
        return _ok({'ok': True, 'downloadUrl': '/safe-deals/checklist.pdf'})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ PUBLIC: CATEGORIES ============
def action_categories():
    """Публичный список категорий товаров из slshop_categories.
    Используется в форме подачи заявки и витрине."""
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, name, slug, icon, color, parent_id, depth "
        f"FROM {SCHEMA}.slshop_categories "
        f"WHERE is_active=true ORDER BY sort_order, name"
    )
    items = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    return _ok({'items': items})


# ============ PUBLIC: SHOP (витрина проверенных товаров) ============
def action_shop():
    """Публичная витрина. Показывает все активные товары (кроме отменённых/возвратов/завершённых).
    Статусы submitted/review помечаются «На проверке», on_shelf/reserved — «Проверено».
    Сначала идут featured (платная карточка в топе)."""
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, deal_number, qr_code, status, "
        f"product_title, product_brand, product_model, product_category, product_condition, product_description, "
        f"price, photos, seller_name, office_check_notes, office_checked_at, created_at, "
        f"is_featured, featured_until "
        f"FROM {SCHEMA}.safe_deals "
        f"WHERE status IN ('submitted', 'review', 'on_shelf', 'reserved') "
        f"  AND expires_at > NOW() "
        f"ORDER BY "
        f"  CASE WHEN is_featured = TRUE AND (featured_until IS NULL OR featured_until > NOW()) THEN 0 ELSE 1 END, "
        f"  CASE WHEN status='on_shelf' THEN 0 WHEN status='reserved' THEN 1 ELSE 2 END, "
        f"  office_checked_at DESC NULLS LAST, created_at DESC LIMIT 200"
    )
    rows = [_deal_to_dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    items = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for r in rows:
        v = _public_view(r)
        v['isFeatured'] = bool(r.get('is_featured')) and (
            r.get('featured_until') is None or
            (r.get('featured_until') and str(r['featured_until']) > now_iso)
        )
        items.append(v)
    return _ok({'items': items, 'count': len(items)})


# ============ PUBLIC: ITEM VIEW (страница одного товара) ============
def action_item_view(qs):
    """Публичная страница товара по номеру сделки. Показывает все детали + маскированного продавца."""
    number = (qs.get('number') or '').strip().upper()
    if not number:
        return _err(400, 'number required')
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT * FROM {SCHEMA}.safe_deals WHERE UPPER(deal_number)=%s",
        (number,)
    )
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return _err(404, 'Товар не найден')
    deal = _deal_to_dict(row)
    v = _public_view(deal)
    v['isFeatured'] = bool(deal.get('is_featured'))
    # Дополнительные поля для карточки
    v['qrCode'] = deal.get('qr_code')
    v['paymentMethod'] = deal.get('payment_method')
    v['payoutMethod'] = deal.get('payout_method')
    v['expiresAt'] = deal.get('expires_at')
    return _ok(v)


# ============ PUBLIC: FEATURE DEAL (платный апгрейд) ============
def action_feature_deal(body):
    """Включает «золотую карточку в топе» на 7 дней. MVP — без оплаты, просто помечаем флагом.
    Реальная оплата подключится позже через ЮКассу."""
    token = (body.get('token') or '').strip()
    if not token:
        return _err(400, 'token required')
    conn = _get_conn()
    cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET "
            f"is_featured=TRUE, "
            f"featured_until=NOW() + INTERVAL '7 days', "
            f"featured_paid_amount=100.00 "
            f"WHERE seller_token=%s RETURNING id",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return _err(404, 'Сделка не найдена')
        _log(cur, row[0], 'featured_enabled', {'amount': 100, 'days': 7}, actor='self')
        conn.commit()
        return _ok({'ok': True, 'amount': 100, 'days': 7})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ PUBLIC: CHECK BLACKLIST ============
def _check_blacklist(cur, phone: str = '', yandex_id: str = '') -> dict:
    """Проверяет, есть ли продавец в чёрном списке. Возвращает { in_blacklist, reason }."""
    if not phone and not yandex_id:
        return {'in_blacklist': False}
    conds = []
    params = []
    if phone:
        conds.append("(kind='phone' AND value=%s)")
        params.append(phone)
    if yandex_id:
        conds.append("(kind='yandex_id' AND value=%s)")
        params.append(yandex_id)
    cur.execute(
        f"SELECT reason FROM {SCHEMA}.safe_deals_blacklist WHERE " + ' OR '.join(conds),
        params,
    )
    row = cur.fetchone()
    if not row:
        return {'in_blacklist': False}
    return {'in_blacklist': True, 'reason': row[0] if not isinstance(row, dict) else row.get('reason')}


# ============ Перекачка фото с водяной маркой «Скупка24» ============
def _download_url(url: str, timeout: int = 12) -> bytes:
    """Скачивает картинку по URL."""
    import urllib.request as _urlreq
    req = _urlreq.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Linux; Android 10)'})
    with _urlreq.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _watermark_image(data: bytes) -> bytes:
    """Накладывает водяную марку «Скупка24» в правом нижнем углу. Если Pillow недоступен — возвращает исходник."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io as _io
        img = Image.open(_io.BytesIO(data)).convert('RGBA')
        # ограничим макс. сторону
        max_side = 1600
        w, h = img.size
        if max(w, h) > max_side:
            k = max_side / max(w, h)
            img = img.resize((int(w * k), int(h * k)), Image.LANCZOS)
            w, h = img.size

        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        text = 'СКУПКА24'
        font_size = max(20, int(min(w, h) * 0.05))
        font = None
        for fp in (
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
        ):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except Exception:
                continue
        if font is None:
            font = ImageFont.load_default()

        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        except Exception:
            tw, th = font_size * len(text) // 2, font_size

        pad = int(font_size * 0.5)
        x0 = w - tw - pad * 3
        y0 = h - th - pad * 3
        x1 = w - pad
        y1 = h - pad
        # подложка-пилюля
        draw.rounded_rectangle([x0, y0, x1, y1], radius=int(pad * 1.2), fill=(0, 0, 0, 175))
        # текст золотом
        draw.text((x0 + pad, y0 + int(pad * 0.5)), text, font=font, fill=(255, 215, 0, 255))

        out = Image.alpha_composite(img, overlay).convert('RGB')
        buf = _io.BytesIO()
        out.save(buf, format='JPEG', quality=86, optimize=True)
        return buf.getvalue()
    except Exception:
        return data


def _reupload_to_our_s3(url: str, sub: str = 'imported') -> str:
    """Скачивает картинку с любого внешнего URL, накладывает наш ватермарк,
    загружает в наш S3. Возвращает CDN-URL (если ошибка — исходный URL)."""
    try:
        data = _download_url(url)
        if not data or len(data) > 15 * 1024 * 1024:
            return url
        wm = _watermark_image(data)
        key = f"safe-deals/{sub}/{int(datetime.now().timestamp()*1000)}_{secrets.token_hex(4)}.jpg"
        s3 = _get_s3()
        s3.put_object(Bucket='files', Key=key, Body=wm, ContentType='image/jpeg')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception:
        return url


# ============ PUBLIC: PARSE AVITO ============
def action_parse_avito(body):
    """Парсит URL объявления Авито через мобильное API (без авторизации).
    Возвращает: title, price, photos (перекачанные в наш S3 с водяной маркой Скупка24), description, category, address."""
    import re as _re
    import urllib.request as _urlreq

    url = (body.get('url') or '').strip()
    if not url:
        return _err(400, 'url required')

    # Извлекаем ID объявления из URL
    m = _re.search(r'_(\d{6,})(?:\?|$|/)', url)
    if not m:
        m = _re.search(r'/(\d{6,})(?:\?|$|/)', url)
    if not m:
        return _err(400, 'Не удалось извлечь ID объявления из URL')
    item_id = m.group(1)

    endpoints = [
        f'https://m.avito.ru/api/16/items/{item_id}',
        f'https://m.avito.ru/api/15/items/{item_id}',
        f'https://www.avito.ru/api/15/items/{item_id}',
    ]
    headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) Mobile',
        'Accept': 'application/json',
    }
    data = None
    last_err = None
    for ep in endpoints:
        try:
            req = _urlreq.Request(ep, headers=headers)
            with _urlreq.urlopen(req, timeout=10) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    break
        except Exception as e:
            last_err = str(e)
            continue
    if not data:
        return _err(502, f'Не удалось получить объявление: {last_err or "недоступно"}')

    # Парсим ответ Авито (структура мобильного API)
    title = data.get('title') or ''
    price = 0
    try:
        price_obj = data.get('price') or {}
        price = int(price_obj.get('value') or price_obj.get('price') or 0)
    except Exception:
        price = 0
    description = data.get('description') or ''
    category_obj = data.get('category') or {}
    category = category_obj.get('name') if isinstance(category_obj, dict) else None

    photos = []
    for img in (data.get('images') or []):
        if isinstance(img, dict):
            # Берём самое большое разрешение
            variants = img.get('variants') or img.get('variantsList') or {}
            best = None
            if isinstance(variants, dict):
                # Ищем ключи типа '1280x960', '640x480' и т.п.
                for key in ['1280x960', '640x480', 'orig', 'original', '1024x768']:
                    if variants.get(key):
                        best = variants[key]
                        break
                if not best:
                    # Берём любое значение
                    for v in variants.values():
                        if isinstance(v, str):
                            best = v
                            break
            if best:
                photos.append(best)
        elif isinstance(img, str):
            photos.append(img)
    photos = photos[:6]

    # Перекачиваем фото в наш S3 с водяной маркой «Скупка24» — убираем чужой бренд
    our_photos = []
    for src in photos:
        new_url = _reupload_to_our_s3(src, sub='avito')
        if new_url:
            our_photos.append(new_url)
    photos = our_photos or photos

    return _ok({
        'title': title.strip(),
        'price': price,
        'description': description.strip(),
        'category': category,
        'photos': photos,
        'url': url,
    })


# ============ PUBLIC: AI CHECK PHOTOS ============
def action_ai_check(body):
    """ИИ-проверка фото и описания на признаки мошенничества (через Polza.ai GPT-4o).
    Возвращает: { risk_level, warnings[], suggestions[], summary }.
    Используется на этапе подачи заявки для предупреждения продавца.
    """
    title = (body.get('productTitle') or '').strip()
    description = (body.get('productDescription') or '').strip()
    price = body.get('price')
    photo_urls = body.get('photoUrls') or []  # уже загруженные URLs

    if not title:
        return _err(400, 'productTitle required')

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        # Без ИИ просто базовая проверка
        warnings = []
        try:
            p = int(price or 0)
            if p > 0 and p < 5000:
                warnings.append('Цена подозрительно низкая — мы порекомендуем покупателю проверить лично')
        except Exception:
            pass
        if len(description) < 20:
            warnings.append('Описание короткое — добавьте детали о состоянии и комплектации')
        if len(photo_urls) < 2:
            warnings.append('Загружено мало фото — нужно минимум 3 (общий вид, экран, состояние)')
        return _ok({
            'risk_level': 'unknown',
            'warnings': warnings,
            'suggestions': [],
            'summary': 'ИИ-проверка временно недоступна, выполнена базовая проверка.',
        })

    prompt = (
        "Ты — модератор-эксперт по предотвращению мошенничества на сервисе купли-продажи Б/У техники в России.\n"
        "Проверь объявление по фото и описанию. Найди признаки мошенничества/обмана:\n"
        "- размытые/некачественные/одинаковые фото (могут быть скачаны)\n"
        "- подозрительно низкая цена (минимум 30% ниже рынка)\n"
        "- противоречия в описании (название не совпадает с фото)\n"
        "- неполная информация (нет фото коробки, серийника, экрана включённого)\n"
        "- общие фразы вместо конкретных деталей\n\n"
        f"Название: {title}\n"
        f"Цена: {price or '—'} ₽\n"
        f"Описание: {description or '(не указано)'}\n"
        f"Кол-во фото: {len(photo_urls)}\n\n"
        "Ответь СТРОГО в JSON:\n"
        '{"risk_level": "low|medium|high", "warnings": ["..."], "suggestions": ["..."], "summary": "1-2 предложения"}\n'
        "Где warnings — что вызывает подозрение (максимум 4 пункта), suggestions — что улучшить (максимум 3 пункта).\n"
        "Если всё хорошо — risk_level=low, warnings=[], summary='Объявление выглядит честно.'"
    )

    try:
        import urllib.request as _urlreq
        # GPT-4o-mini принимает image_url в content
        content: list = [{"type": "text", "text": prompt}]
        for u in photo_urls[:4]:
            if isinstance(u, str) and u.startswith('http'):
                content.append({"type": "image_url", "image_url": {"url": u}})

        req_body = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 600,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        req = _urlreq.Request(
            'https://api.polza.ai/v1/chat/completions',
            data=json.dumps(req_body).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        with _urlreq.urlopen(req, timeout=25) as resp:
            ai_resp = json.loads(resp.read().decode('utf-8'))
        raw = ai_resp['choices'][0]['message']['content']
        parsed = json.loads(raw)
        risk = parsed.get('risk_level') or 'low'
        if risk not in ('low', 'medium', 'high'):
            risk = 'medium'
        return _ok({
            'risk_level': risk,
            'warnings': parsed.get('warnings') or [],
            'suggestions': parsed.get('suggestions') or [],
            'summary': parsed.get('summary') or '',
        })
    except Exception as e:
        return _ok({
            'risk_level': 'unknown',
            'warnings': [],
            'suggestions': [],
            'summary': f'ИИ-проверка не выполнена: {e}',
        })


# ============ PUBLIC: AI PRICE (оценка рынка) ============
def action_ai_price(body):
    """ИИ-оценка рыночной цены и времени продажи на основе фото и описания.
    Использует GPT-4o-mini с данными о российском рынке Б/У техники.
    Возвращает: { fair_price, fast_price, top_price, days_to_sell, summary }.
    """
    title = (body.get('productTitle') or '').strip()
    description = (body.get('productDescription') or '').strip()
    brand = (body.get('productBrand') or '').strip()
    model = (body.get('productModel') or '').strip()
    condition = (body.get('productCondition') or '').strip()
    photo_urls = body.get('photoUrls') or []

    if not title and not model:
        return _err(400, 'productTitle или productModel обязательны')

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return _err(503, 'AI недоступен')

    prompt = (
        "Ты — эксперт по российскому рынку Б/У техники (Калуга, Москва, регионы). "
        "Оцени реальную рыночную цену устройства для быстрой продажи. Учти: бренд, модель, "
        "состояние, типичный износ для Б/У, средние цены на Авито/Юла.\n\n"
        f"Название: {title}\n"
        f"Бренд: {brand or '—'}\n"
        f"Модель: {model or '—'}\n"
        f"Состояние: {condition or '—'}\n"
        f"Описание: {description or '—'}\n\n"
        "Ответь СТРОГО в JSON:\n"
        '{"fast_price": число — цена для продажи за 1-3 дня (-15% от рынка),\n'
        ' "fair_price": число — справедливая рыночная цена (продажа за 7-14 дней),\n'
        ' "top_price": число — максимальная цена (продажа от 2-4 недель),\n'
        ' "days_to_sell": число — типичное время продажи по справедливой цене,\n'
        ' "summary": "1-2 предложения с обоснованием"}'
    )

    try:
        import urllib.request as _urlreq
        content: list = [{"type": "text", "text": prompt}]
        for u in photo_urls[:3]:
            if isinstance(u, str) and u.startswith('http'):
                content.append({"type": "image_url", "image_url": {"url": u}})

        req_body = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 400,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }
        req = _urlreq.Request(
            'https://api.polza.ai/v1/chat/completions',
            data=json.dumps(req_body).encode('utf-8'),
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            method='POST',
        )
        with _urlreq.urlopen(req, timeout=30) as resp:
            ai_resp = json.loads(resp.read().decode('utf-8'))
        parsed = json.loads(ai_resp['choices'][0]['message']['content'])
        return _ok({
            'fast_price': int(parsed.get('fast_price') or 0),
            'fair_price': int(parsed.get('fair_price') or 0),
            'top_price': int(parsed.get('top_price') or 0),
            'days_to_sell': int(parsed.get('days_to_sell') or 14),
            'summary': parsed.get('summary') or '',
        })
    except Exception as e:
        return _err(502, f'ИИ ошибка: {e}')


# ============ PUBLIC: AI FILL ============
def action_ai_fill(body):
    """ИИ распознаёт фото товара и предлагает название, бренд, модель, состояние, категорию, цену.
    Возвращает: { title, brand, model, category, condition, description, price_hint }.
    """
    photo_urls = body.get('photoUrls') or []
    if not photo_urls or not isinstance(photo_urls, list):
        return _err(400, 'photoUrls required')

    api_key = os.environ.get('POLZA_AI_API_KEY', '')
    if not api_key:
        return _err(503, 'AI временно недоступен')

    prompt = (
        "Ты — эксперт по Б/У технике в России. Посмотри на фото и определи:\n"
        "- title: точное название устройства (например 'iPhone 13 Pro 256GB' или 'Apple MacBook Air M2 13')\n"
        "- brand: бренд (Apple, Samsung, Xiaomi и т.д.)\n"
        "- model: модель ('iPhone 13 Pro', 'MacBook Air M2')\n"
        "- category: одна из: Смартфон, Ноутбук, Планшет, Часы, Игровая консоль, Аудиотехника, Фотоаппарат, Другое\n"
        "- condition: одно из: Новое (в упаковке), Отличное, Хорошее, Удовлетворительное\n"
        "- description: краткое описание (состояние, видимые особенности, комплектация — что видно на фото). 2-3 предложения.\n"
        "- price_hint: примерная рыночная цена за Б/У в рублях (число, для ориентира)\n\n"
        "Ответь СТРОГО в JSON: { title, brand, model, category, condition, description, price_hint }.\n"
        "Если не уверен — оставь поле пустой строкой или null."
    )

    try:
        import urllib.request as _urlreq
        content: list = [{"type": "text", "text": prompt}]
        for u in photo_urls[:4]:
            if isinstance(u, str) and u.startswith('http'):
                content.append({"type": "image_url", "image_url": {"url": u}})

        req_body = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": content}],
            "max_tokens": 600,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        req = _urlreq.Request(
            'https://api.polza.ai/v1/chat/completions',
            data=json.dumps(req_body).encode('utf-8'),
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            method='POST',
        )
        with _urlreq.urlopen(req, timeout=30) as resp:
            ai_resp = json.loads(resp.read().decode('utf-8'))
        raw = ai_resp['choices'][0]['message']['content']
        parsed = json.loads(raw)
        return _ok({
            'title': parsed.get('title') or '',
            'brand': parsed.get('brand') or '',
            'model': parsed.get('model') or '',
            'category': parsed.get('category') or '',
            'condition': parsed.get('condition') or '',
            'description': parsed.get('description') or '',
            'price_hint': parsed.get('price_hint') or 0,
        })
    except Exception as e:
        return _err(502, f'ИИ ошибка: {e}')


# ============ PUBLIC: UPLOAD PHOTO (отдельный аплоад, чтобы потом скормить ИИ) ============
def action_upload_photo(body):
    """Загружает одно фото в S3 (без привязки к сделке) — для ИИ-проверки до отправки формы.
    Возвращает: { url, s3_key }.
    """
    b64 = body.get('fileBase64') or ''
    if not b64:
        return _err(400, 'fileBase64 required')
    try:
        if ',' in b64:
            b64 = b64.split(',', 1)[1]
        data = base64.b64decode(b64)
        if len(data) > MAX_PHOTO_BYTES:
            return _err(413, 'Файл больше 4 МБ')
        mime = 'image/jpeg'
        if data[:4] == b'\x89PNG':
            mime = 'image/png'
        elif data[:4] == b'RIFF':
            mime = 'image/webp'
        ext = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[mime]
        key = f"safe-deals/tmp/{int(datetime.now().timestamp()*1000)}_{secrets.token_hex(4)}.{ext}"
        s3 = _get_s3()
        s3.put_object(Bucket='files', Key=key, Body=data, ContentType=mime)
        url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        return _ok({'url': url, 's3_key': key})
    except Exception as e:
        return _err(500, f'Ошибка загрузки: {e}')


# ============ ADMIN: LIST ============
def action_admin_list(qs):
    """Список сделок для админки. Фильтры: status, q (поиск), from/to."""
    status = (qs.get('status') or '').strip()
    q = (qs.get('q') or '').strip()
    date_from = (qs.get('from') or '').strip()
    date_to = (qs.get('to') or '').strip()
    limit = min(int(qs.get('limit') or 200), 500)

    conds = []
    params = []
    if status and status != 'all':
        conds.append('status = %s')
        params.append(status)
    if q:
        like = f'%{q}%'
        conds.append('(deal_number ILIKE %s OR seller_name ILIKE %s OR seller_phone ILIKE %s OR product_title ILIKE %s)')
        params.extend([like, like, like, like])
    if date_from:
        conds.append('created_at::date >= %s')
        params.append(date_from)
    if date_to:
        conds.append('created_at::date <= %s')
        params.append(date_to)
    where = ('WHERE ' + ' AND '.join(conds)) if conds else ''

    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, deal_number, qr_code, status, "
        f"seller_name, seller_phone, "
        f"product_title, product_brand, product_model, product_condition, product_category, "
        f"price, commission_amount, seller_payout, "
        f"buyer_name, buyer_phone, "
        f"created_at, updated_at, expires_at, completed_at, "
        f"jsonb_array_length(photos) AS photos_count "
        f"FROM {SCHEMA}.safe_deals {where} ORDER BY created_at DESC LIMIT {limit}",
        params
    )
    rows = [dict(r) for r in cur.fetchall()]
    cur.close(); conn.close()
    # нормализация
    for r in rows:
        for k in ('price', 'commission_amount', 'seller_payout'):
            if isinstance(r.get(k), Decimal):
                r[k] = float(r[k])
        for k in ('created_at', 'updated_at', 'expires_at', 'completed_at'):
            if isinstance(r.get(k), datetime):
                r[k] = r[k].isoformat()
    return _ok({'items': rows, 'count': len(rows)})


# ============ ADMIN: GET BY ID ============
def action_admin_get(qs):
    deal_id = qs.get('id')
    if not deal_id:
        return _err(400, 'id required')
    try:
        deal_id = int(deal_id)
    except Exception:
        return _err(400, 'id must be integer')
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT * FROM {SCHEMA}.safe_deals WHERE id=%s", (deal_id,))
    row = cur.fetchone()
    if not row:
        cur.close(); conn.close()
        return _err(404, 'Сделка не найдена')
    deal = _deal_to_dict(row)
    cur.execute(
        f"SELECT id, event_type, details, actor, created_at FROM {SCHEMA}.safe_deal_events "
        f"WHERE deal_id=%s ORDER BY created_at DESC LIMIT 100",
        (deal_id,)
    )
    events = []
    for r in cur.fetchall():
        e = dict(r)
        if isinstance(e['created_at'], datetime):
            e['created_at'] = e['created_at'].isoformat()
        events.append(e)
    cur.close(); conn.close()
    deal['events'] = events
    return _ok(deal)


# ============ ADMIN: UPDATE STATUS ============
_VALID_STATUSES = {'submitted', 'review', 'on_shelf', 'reserved', 'completed', 'cancelled', 'returned'}


def action_admin_set_status(body, actor):
    deal_id = body.get('id')
    new_status = (body.get('status') or '').strip()
    note = (body.get('note') or '').strip() or None
    if not deal_id or new_status not in _VALID_STATUSES:
        return _err(400, 'id и status обязательны')
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET status=%s, updated_at=NOW() "
            f"WHERE id=%s RETURNING id",
            (new_status, int(deal_id))
        )
        if not cur.fetchone():
            return _err(404, 'Сделка не найдена')
        _log(cur, int(deal_id), f'status_changed', {'to': new_status, 'note': note}, actor=actor.get('full_name'))
        conn.commit()
        return _ok({'ok': True, 'status': new_status})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ ADMIN: SET OFFICE CHECK ============
def action_admin_set_check(body, actor):
    """Сотрудник зафиксировал результат осмотра в офисе. Переводит сделку в on_shelf."""
    deal_id = body.get('id')
    notes = (body.get('notes') or '').strip() or None
    if not deal_id:
        return _err(400, 'id required')
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET "
            f"office_check_notes=%s, office_checked_by=%s, office_checked_at=NOW(), "
            f"status=CASE WHEN status IN ('submitted','review') THEN 'on_shelf' ELSE status END, "
            f"updated_at=NOW() WHERE id=%s RETURNING id",
            (notes, actor.get('full_name'), int(deal_id))
        )
        if not cur.fetchone():
            return _err(404, 'Сделка не найдена')
        _log(cur, int(deal_id), 'office_checked', {'notes': notes}, actor=actor.get('full_name'))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ ADMIN: RESERVE ============
def action_admin_reserve(body, actor):
    deal_id = body.get('id')
    buyer_name = (body.get('buyerName') or '').strip()
    buyer_phone = _phone_normalize(body.get('buyerPhone') or '')
    hours = int(body.get('hours') or 24)
    if not deal_id:
        return _err(400, 'id required')
    conn = _get_conn(); cur = conn.cursor()
    try:
        cur.execute(
            f"UPDATE {SCHEMA}.safe_deals SET "
            f"status='reserved', buyer_name=%s, buyer_phone=%s, "
            f"reservation_until=NOW() + (%s || ' hours')::interval, "
            f"updated_at=NOW() WHERE id=%s RETURNING id",
            (buyer_name or None, buyer_phone or None, str(hours), int(deal_id))
        )
        if not cur.fetchone():
            return _err(404, 'Сделка не найдена')
        _log(cur, int(deal_id), 'reserved', {
            'buyer_name': buyer_name, 'buyer_phone': buyer_phone, 'hours': hours,
        }, actor=actor.get('full_name'))
        conn.commit()
        return _ok({'ok': True})
    except Exception as e:
        conn.rollback()
        return _err(500, f'Ошибка: {e}')
    finally:
        cur.close(); conn.close()


# ============ ADMIN: STATS ============
def action_admin_stats(qs):
    """Сводка: счётчики статусов, выручка комиссии (день/месяц/всего), активные сделки."""
    conn = _get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT "
        f"COUNT(*) FILTER (WHERE status='submitted') AS submitted_count, "
        f"COUNT(*) FILTER (WHERE status='review') AS review_count, "
        f"COUNT(*) FILTER (WHERE status='on_shelf') AS on_shelf_count, "
        f"COUNT(*) FILTER (WHERE status='reserved') AS reserved_count, "
        f"COUNT(*) FILTER (WHERE status='completed') AS completed_count, "
        f"COUNT(*) FILTER (WHERE status='cancelled') AS cancelled_count, "
        f"COUNT(*) FILTER (WHERE status='returned') AS returned_count, "
        f"COALESCE(SUM(commission_amount) FILTER (WHERE status='completed' AND completed_at::date = CURRENT_DATE), 0) AS commission_today, "
        f"COALESCE(SUM(commission_amount) FILTER (WHERE status='completed' AND completed_at >= date_trunc('month', CURRENT_DATE)), 0) AS commission_month, "
        f"COALESCE(SUM(commission_amount) FILTER (WHERE status='completed'), 0) AS commission_total, "
        f"COALESCE(SUM(price) FILTER (WHERE status='completed' AND completed_at::date = CURRENT_DATE), 0) AS turnover_today, "
        f"COALESCE(SUM(price) FILTER (WHERE status='completed' AND completed_at >= date_trunc('month', CURRENT_DATE)), 0) AS turnover_month, "
        f"COALESCE(SUM(price) FILTER (WHERE status='completed'), 0) AS turnover_total, "
        f"COUNT(*) FILTER (WHERE status='completed' AND completed_at::date = CURRENT_DATE) AS completed_today, "
        f"COUNT(*) FILTER (WHERE status='completed' AND completed_at >= date_trunc('month', CURRENT_DATE)) AS completed_month "
        f"FROM {SCHEMA}.safe_deals"
    )
    row = dict(cur.fetchone() or {})
    # Прибыль по дням за 14 дней
    cur.execute(
        f"SELECT completed_at::date AS day, "
        f"COUNT(*) AS count, "
        f"COALESCE(SUM(commission_amount), 0) AS commission "
        f"FROM {SCHEMA}.safe_deals "
        f"WHERE status='completed' AND completed_at >= CURRENT_DATE - INTERVAL '13 days' "
        f"GROUP BY completed_at::date ORDER BY day DESC"
    )
    daily = []
    for r in cur.fetchall():
        daily.append({
            'day': r['day'].isoformat() if r.get('day') else None,
            'count': int(r['count'] or 0),
            'commission': float(r['commission'] or 0),
        })
    row['daily'] = daily
    for k in ('commission_today', 'commission_month', 'commission_total', 'turnover_today', 'turnover_month', 'turnover_total'):
        if isinstance(row.get(k), Decimal):
            row[k] = float(row[k])
    cur.close(); conn.close()
    return _ok(row)


# ============ HANDLER ============
def handler(event: dict, context) -> dict:
    """Безопасные сделки: ?action=create|get_by_token|get_by_qr|confirm_by_qr|cancel_by_token|admin_*."""
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

    # Админ-экшены — требуют X-Employee-Token
    admin_actions = {
        'admin_list', 'admin_get', 'admin_stats',
        'admin_set_status', 'admin_set_check', 'admin_reserve',
    }
    if action in admin_actions:
        headers = event.get('headers') or {}
        token = headers.get('X-Employee-Token') or headers.get('x-employee-token') or ''
        actor = _get_employee(token)
        if not actor:
            return _err(401, 'Не авторизован')
        if actor.get('role') not in ALLOWED_ROLES:
            return _err(403, 'Нет доступа')
        if method == 'GET':
            if action == 'admin_list':
                return action_admin_list(qs)
            if action == 'admin_get':
                return action_admin_get(qs)
            if action == 'admin_stats':
                return action_admin_stats(qs)
        if method == 'POST':
            if action == 'admin_set_status':
                return action_admin_set_status(body, actor)
            if action == 'admin_set_check':
                return action_admin_set_check(body, actor)
            if action == 'admin_reserve':
                return action_admin_reserve(body, actor)
        return _err(400, f'Unknown admin action: {action}')

    if method == 'GET':
        if action == 'get_by_token':
            return action_get_by_token(qs)
        if action == 'get_by_qr':
            return action_get_by_qr(qs)
        if action == 'categories':
            return action_categories()
        if action == 'shop':
            return action_shop()
        if action == 'yandex_config':
            return action_yandex_config()
        if action == 'blacklist_public':
            return action_blacklist_public()
        if action == 'item_view':
            return action_item_view(qs)
        return _err(400, f'Unknown GET action: {action}')

    if method == 'POST':
        if action == 'create':
            return action_create(body, event)
        if action == 'confirm_by_qr':
            return action_confirm_by_qr(body)
        if action == 'cancel_by_token':
            return action_cancel_by_token(body)
        if action == 'parse_avito':
            return action_parse_avito(body)
        if action == 'ai_check':
            return action_ai_check(body)
        if action == 'ai_fill':
            return action_ai_fill(body)
        if action == 'ai_price':
            return action_ai_price(body)
        if action == 'upload_photo':
            return action_upload_photo(body)
        if action == 'yandex_auth':
            return action_yandex_auth(body)
        if action == 'scan_passport':
            return action_scan_passport(body)
        if action == 'feature_deal':
            return action_feature_deal(body)
        if action == 'subscribe_lead':
            return action_subscribe_lead(body)
        return _err(400, f'Unknown POST action: {action}')

    return _err(405, 'Method not allowed')