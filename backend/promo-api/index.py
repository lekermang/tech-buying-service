import json
import os
import re
import base64
import psycopg2
import psycopg2.extras
import requests

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

S3_ENDPOINT = 'https://bucket.poehali.dev'
S3_BUCKET   = 'files'

TG_BOT_TOKEN = None  # lazy from env
TG_CHAT_ID   = None


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def resp(code: int, body: dict) -> dict:
    return {'statusCode': code, 'headers': HEADERS, 'body': json.dumps(body, ensure_ascii=False, default=str)}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[а-яё]', lambda m: {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
        'и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
        'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh',
        'щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    }.get(m.group(), m.group()), text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')[:100]


def _s3_client():
    import boto3
    from botocore.client import Config as BotoConfig
    return boto3.client(
        's3', endpoint_url=S3_ENDPOINT,
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=BotoConfig(signature_version='s3v4'),
    )


def _cdn_url(key: str) -> str:
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def _notify_tg(promo_title: str, name: str, phone: str, lead_id: int):
    try:
        token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')
        if not token or not chat_id:
            return
        text = (
            f"🎁 *Новая заявка с акции #{lead_id}*\n\n"
            f"📌 Акция: *{promo_title}*\n"
            f"👤 Имя: {name}\n"
            f"📞 Телефон: {phone}"
        )
        requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
            timeout=8,
        )
        # MAX владельцу
        owner_id = os.environ.get('MAX_OWNER_USER_ID', '')
        if owner_id:
            requests.post(
                'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c?action=send',
                json={'phone': phone, 'text': f"🎁 Заявка с акции «{promo_title}»\n👤 {name}\n📞 {phone}"},
                timeout=6,
            )
    except Exception as e:
        print(f'[promo-api][notify] {e}')


def handler(event: dict, context) -> dict:
    """API для управления акциями Скупка24: публичный просмотр + приём заявок + админ CRUD"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            **HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Employee-Token, X-Admin-Token',
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs     = event.get('queryStringParameters') or {}
    action = qs.get('action', '')
    raw    = event.get('body') or '{}'
    body   = json.loads(raw) if isinstance(raw, str) else (raw or {})

    # ── Авторизация сотрудника (для admin-действий) ──────────────────────────
    def _get_token() -> str:
        hdrs = event.get('headers') or {}
        # case-insensitive поиск заголовка
        for k, v in hdrs.items():
            if k.lower() == 'x-employee-token':
                return v or ''
        return ''

    def _auth_owner() -> bool:
        token = _get_token()
        if not token:
            return False
        try:
            with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(
                    f"SELECT role FROM {SCHEMA}.employees "
                    f"WHERE auth_token=%s AND is_active=true "
                    f"AND (token_expires_at IS NULL OR token_expires_at > NOW()) LIMIT 1",
                    (token,)
                )
                row = cur.fetchone()
                return bool(row and row['role'] in ('owner', 'admin'))
        except Exception as e:
            print(f'[promo-api][auth] {e}')
            return False

    # ════════════════════════════════════════════════════════════════
    # ПУБЛИЧНЫЕ ЭНДПОИНТЫ
    # ════════════════════════════════════════════════════════════════

    # GET /promo-api?action=get&slug=hydrogel-film-150
    if method == 'GET' and action == 'get':
        slug = qs.get('slug', '').strip()
        if not slug:
            return resp(400, {'error': 'slug required'})
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id,slug,title,short_desc,full_desc,image_url,is_active,show_on_main,"
                f"starts_at,ends_at,max_participants FROM {SCHEMA}.promos WHERE slug=%s LIMIT 1",
                (slug,)
            )
            promo = cur.fetchone()
        if not promo:
            return resp(404, {'error': 'not found'})
        if not promo['is_active']:
            return resp(404, {'error': 'promo inactive'})
        # Считаем кол-во заявок
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.promo_leads WHERE promo_id=%s", (promo['id'],))
            leads_count = cur.fetchone()[0]
        return resp(200, {**dict(promo), 'leads_count': leads_count})

    # GET /promo-api?action=list_active  — виджет на главной
    if method == 'GET' and action == 'list_active':
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id,slug,title,short_desc,image_url,ends_at FROM {SCHEMA}.promos "
                f"WHERE is_active=true AND show_on_main=true "
                f"ORDER BY created_at DESC LIMIT 5"
            )
            promos = cur.fetchall()
        return resp(200, {'promos': [dict(p) for p in promos]})

    # POST /promo-api?action=submit — заявка от пользователя
    if method == 'POST' and action == 'submit':
        slug  = body.get('slug', '').strip()
        name  = body.get('name', '').strip()
        phone = body.get('phone', '').strip()
        if not slug or not name or not phone:
            return resp(400, {'error': 'slug, name и phone обязательны'})
        # Найти promo
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT id, title, max_participants, is_active FROM {SCHEMA}.promos WHERE slug=%s LIMIT 1",
                (slug,)
            )
            promo = cur.fetchone()
        if not promo or not promo['is_active']:
            return resp(404, {'error': 'Акция не найдена или неактивна'})
        # Проверка лимита участников
        if promo['max_participants']:
            with get_conn() as conn, conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.promo_leads WHERE promo_id=%s", (promo['id'],))
                cnt = cur.fetchone()[0]
            if cnt >= promo['max_participants']:
                return resp(409, {'error': 'Все места заняты'})
        # Сохранить заявку
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.promo_leads (promo_id, name, phone) VALUES (%s,%s,%s) RETURNING id",
                (promo['id'], name, phone)
            )
            lead_id = cur.fetchone()[0]
            conn.commit()
        _notify_tg(promo['title'], name, phone, lead_id)
        return resp(200, {'ok': True, 'lead_id': lead_id})

    # POST /promo-api?action=upload_photo&promo_id=1
    # Тело: JSON { image_b64: "...", mime: "image/jpeg" }
    if method == 'POST' and action == 'upload_photo':
        if not _auth_owner():
            return resp(403, {'error': 'forbidden'})
        try:
            promo_id = int(qs.get('promo_id') or 0)
        except ValueError:
            promo_id = 0
        if not promo_id:
            return resp(400, {'error': 'promo_id required'})
        # Получаем slug для пути в S3
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(f"SELECT slug FROM {SCHEMA}.promos WHERE id=%s", (promo_id,))
            row = cur.fetchone()
        if not row:
            return resp(404, {'error': 'promo not found'})
        slug = row[0]
        # Декодируем оригинальные байты из base64
        img_b64 = body.get('image_b64', '')
        if not img_b64:
            return resp(400, {'error': 'image_b64 required'})
        try:
            img_data = base64.b64decode(img_b64)
        except Exception:
            return resp(400, {'error': 'Неверный base64'})
        # Тип файла
        ct = body.get('mime') or 'image/jpeg'
        if ct not in ('image/jpeg', 'image/png', 'image/webp'):
            ct = 'image/jpeg'
        ext = {'image/png': 'png', 'image/webp': 'webp'}.get(ct, 'jpg')
        key = f'promos/{slug}/cover.{ext}'
        print(f'[upload_photo] promo_id={promo_id} slug={slug} size={len(img_data)} ct={ct}')
        try:
            s3 = _s3_client()
            s3.put_object(Bucket=S3_BUCKET, Key=key, Body=img_data, ContentType=ct)
            image_url = _cdn_url(key)
        except Exception as e:
            print(f'[promo-api][upload_photo] s3 error: {e}')
            return resp(500, {'error': f'Ошибка загрузки в S3: {e}'})
        # Обновляем image_url в БД
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.promos SET image_url=%s, updated_at=NOW() WHERE id=%s",
                (image_url, promo_id)
            )
            conn.commit()
        return resp(200, {'ok': True, 'image_url': image_url})

    # ════════════════════════════════════════════════════════════════
    # ADMIN ЭНДПОИНТЫ (требуют owner/admin токен)
    # ════════════════════════════════════════════════════════════════

    # GET /promo-api?action=admin_list
    if method == 'GET' and action == 'admin_list':
        if not _auth_owner():
            return resp(403, {'error': 'forbidden'})
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT p.*, "
                f"(SELECT COUNT(*) FROM {SCHEMA}.promo_leads l WHERE l.promo_id=p.id) AS leads_count "
                f"FROM {SCHEMA}.promos p ORDER BY p.created_at DESC"
            )
            promos = cur.fetchall()
        return resp(200, {'promos': [dict(p) for p in promos]})

    # GET /promo-api?action=admin_leads&promo_id=1&period=today|week|month
    if method == 'GET' and action == 'admin_leads':
        if not _auth_owner():
            return resp(403, {'error': 'forbidden'})
        try:
            promo_id = int(qs.get('promo_id') or 0)
        except ValueError:
            promo_id = 0
        period = qs.get('period', 'all')
        period_sql = {
            'today': "AND l.created_at >= NOW() - INTERVAL '1 day'",
            'week':  "AND l.created_at >= NOW() - INTERVAL '7 days'",
            'month': "AND l.created_at >= NOW() - INTERVAL '30 days'",
        }.get(period, '')
        where = f"WHERE l.promo_id={promo_id} {period_sql}" if promo_id else f"WHERE 1=1 {period_sql}"
        with get_conn() as conn, conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                f"SELECT l.id, l.name, l.phone, l.created_at, p.title as promo_title, p.slug "
                f"FROM {SCHEMA}.promo_leads l JOIN {SCHEMA}.promos p ON p.id=l.promo_id "
                f"{where} ORDER BY l.created_at DESC LIMIT 500"
            )
            leads = cur.fetchall()
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.promo_leads l {where}"
            )
            total = cur.fetchone()['count']
        return resp(200, {'leads': [dict(l) for l in leads], 'total': total})

    # POST /promo-api?action=admin_create
    if method == 'POST' and action == 'admin_create':
        if not _auth_owner():
            return resp(403, {'error': 'forbidden'})
        title      = (body.get('title') or '').strip()
        short_desc = (body.get('short_desc') or '').strip()[:70]
        full_desc  = (body.get('full_desc') or '').strip()[:500]
        image_b64  = body.get('image_b64')
        is_active  = bool(body.get('is_active', True))
        show_main  = bool(body.get('show_on_main', False))
        starts_at  = body.get('starts_at') or None
        ends_at    = body.get('ends_at') or None
        max_p      = body.get('max_participants') or None
        custom_slug = (body.get('slug') or '').strip()

        if not title:
            return resp(400, {'error': 'title обязателен'})

        slug = slugify(custom_slug or title)
        # Уникальность slug
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(f"SELECT id FROM {SCHEMA}.promos WHERE slug=%s", (slug,))
            if cur.fetchone():
                slug = slug + '-2'

        image_url = None
        if image_b64:
            try:
                s3 = _s3_client()
                img_data = base64.b64decode(image_b64)
                key = f'promos/{slug}/cover.jpg'
                s3.put_object(Bucket=S3_BUCKET, Key=key, Body=img_data, ContentType='image/jpeg')
                image_url = _cdn_url(key)
            except Exception as e:
                print(f'[promo-api][s3] {e}')

        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {SCHEMA}.promos "
                f"(slug,title,short_desc,full_desc,image_url,is_active,show_on_main,starts_at,ends_at,max_participants) "
                f"VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id,slug",
                (slug, title, short_desc, full_desc, image_url, is_active, show_main, starts_at, ends_at, max_p)
            )
            row = cur.fetchone()
            conn.commit()
        return resp(200, {'ok': True, 'id': row[0], 'slug': row[1]})

    # PUT /promo-api?action=admin_update&id=1
    if method == 'POST' and action == 'admin_update':
        if not _auth_owner():
            return resp(403, {'error': 'forbidden'})
        try:
            promo_id = int(body.get('id') or 0)
        except ValueError:
            promo_id = 0
        if not promo_id:
            return resp(400, {'error': 'id required'})

        fields = {}
        for key in ('title','short_desc','full_desc','is_active','show_on_main','starts_at','ends_at','max_participants'):
            if key in body:
                fields[key] = body[key]
        if 'short_desc' in fields:
            fields['short_desc'] = str(fields['short_desc'])[:70]
        if 'full_desc' in fields:
            fields['full_desc'] = str(fields['full_desc'])[:500]

        # Загрузка нового фото
        if body.get('image_b64'):
            try:
                with get_conn() as conn, conn.cursor() as cur:
                    cur.execute(f"SELECT slug FROM {SCHEMA}.promos WHERE id=%s", (promo_id,))
                    row = cur.fetchone()
                slug = row[0] if row else str(promo_id)
                s3 = _s3_client()
                img_data = base64.b64decode(body['image_b64'])
                key = f'promos/{slug}/cover.jpg'
                s3.put_object(Bucket=S3_BUCKET, Key=key, Body=img_data, ContentType='image/jpeg')
                fields['image_url'] = _cdn_url(key)
            except Exception as e:
                print(f'[promo-api][s3 update] {e}')

        if not fields:
            return resp(400, {'error': 'нет полей для обновления'})

        fields['updated_at'] = 'NOW()'
        set_parts = []
        vals = []
        for k, v in fields.items():
            if v == 'NOW()':
                set_parts.append(f"{k}=NOW()")
            else:
                set_parts.append(f"{k}=%s")
                vals.append(v)
        vals.append(promo_id)
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                f"UPDATE {SCHEMA}.promos SET {', '.join(set_parts)} WHERE id=%s",
                vals
            )
            conn.commit()
        return resp(200, {'ok': True})

    return resp(404, {'error': 'unknown action', 'action': action})