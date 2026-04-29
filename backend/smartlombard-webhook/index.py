import base64
import hashlib
import json
import os
import urllib.parse
import uuid
from datetime import datetime
from typing import Any

import boto3
import psycopg2
import requests

SCHEMA = 't_p31606708_tech_buying_service'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, AuthorizationSL, X-Authorizationsl, X-Employee-Token',
    'Content-Type': 'application/json; charset=utf-8',
}


def _get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _s():
    s = (os.environ.get('AWS_ACCESS_KEY_ID') or '').strip()
    sk = (os.environ.get('AWS_SECRET_ACCESS_KEY') or '').strip()
    if not s or not sk:
        return None, None, None
    client = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=s,
        aws_secret_access_key=sk,
    )
    return client, s, 'files'


def _download_to_s3(url: str) -> str | None:
    """Скачивает картинку с SmartLombard и кладёт в наш S3.
    Важно: ссылка SmartLombard работает только 3 раза, поэтому делаем это сразу при получении."""
    if not url or not isinstance(url, str):
        return None
    client, key_id, bucket = _s()
    if not client:
        return None
    try:
        r = requests.get(url, timeout=20)
        if r.status_code != 200 or not r.content:
            return None
        ext = '.jpg'
        try:
            path = urllib.parse.urlparse(url).path
            if '.' in path:
                ext = '.' + path.rsplit('.', 1)[-1].split('?')[0][:5]
        except Exception:
            pass
        ct = r.headers.get('Content-Type', 'image/jpeg').split(';')[0].strip() or 'image/jpeg'
        key = f'sl-goods/{datetime.utcnow().strftime("%Y/%m")}/{uuid.uuid4().hex}{ext}'
        client.put_object(Bucket=bucket, Key=key, Body=r.content, ContentType=ct)
        return f'https://cdn.poehali.dev/projects/{key_id}/bucket/{key}'
    except Exception:
        return None


def _process_images(images: list) -> tuple[list, str | None]:
    """Берёт список картинок от SmartLombard, перекладывает src/preview в наш S3.
    Возвращает (новый_список, cover_url)."""
    out = []
    cover_url = None
    if not isinstance(images, list):
        return out, None
    for img in images:
        if not isinstance(img, dict):
            continue
        src = _download_to_s3(img.get('src')) or img.get('src')
        prev = _download_to_s3(img.get('preview')) or img.get('preview')
        cover = int(img.get('cover') or 0)
        out.append({'src': src, 'preview': prev, 'cover': cover})
        if cover == 1 and src:
            cover_url = src
    if not cover_url and out:
        cover_url = out[0].get('src')
    return out, cover_url


def _safe(s: Any) -> str:
    return str(s).replace("'", "''") if s is not None else ''


def _upsert_merchant(action: str, data: dict) -> tuple[bool, int | None, str]:
    workplace = data.get('workplace')
    if workplace is None:
        return False, None, 'no workplace'
    try:
        wid = int(workplace)
    except Exception:
        return False, None, 'workplace not int'

    conn = _get_conn()
    cur = conn.cursor()
    try:
        if action == 'remove':
            cur.execute(
                f"UPDATE {SCHEMA}.sl_merchants SET removed=TRUE, updated_at=NOW() WHERE workplace={wid}"
            )
            if cur.rowcount == 0:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sl_merchants (workplace, removed) VALUES ({wid}, TRUE) "
                    f"ON CONFLICT (workplace) DO UPDATE SET removed=TRUE, updated_at=NOW()"
                )
            conn.commit()
            return True, wid, 'removed'

        img = data.get('image')
        image_src = ''
        image_preview = ''
        if isinstance(img, dict):
            image_src = _download_to_s3(img.get('src')) or img.get('src') or ''
            image_preview = _download_to_s3(img.get('preview')) or img.get('preview') or ''

        raw_safe = json.dumps(data, ensure_ascii=False).replace("'", "''")
        if action == 'add':
            cur.execute(
                f"INSERT INTO {SCHEMA}.sl_merchants "
                f"(workplace, shortlink, city, name, address, phone, image_src, image_preview, description, raw, removed, created_at, updated_at) "
                f"VALUES ({wid}, '{_safe(data.get('shortlink'))}', '{_safe(data.get('city'))}', '{_safe(data.get('name'))}', "
                f"'{_safe(data.get('address'))}', '{_safe(data.get('phone'))}', '{_safe(image_src)}', '{_safe(image_preview)}', "
                f"'{_safe(data.get('description'))}', '{raw_safe}'::jsonb, FALSE, NOW(), NOW()) "
                f"ON CONFLICT (workplace) DO UPDATE SET "
                f"shortlink=EXCLUDED.shortlink, city=EXCLUDED.city, name=EXCLUDED.name, address=EXCLUDED.address, "
                f"phone=EXCLUDED.phone, image_src=EXCLUDED.image_src, image_preview=EXCLUDED.image_preview, "
                f"description=EXCLUDED.description, raw=EXCLUDED.raw, removed=FALSE, updated_at=NOW()"
            )
        else:  # edit — обновляем только пришедшие поля
            sets = []
            for k_field, k_data in [
                ('shortlink', 'shortlink'), ('city', 'city'), ('name', 'name'),
                ('address', 'address'), ('phone', 'phone'), ('description', 'description'),
            ]:
                if k_data in data:
                    sets.append(f"{k_field}='{_safe(data.get(k_data))}'")
            if 'image' in data:
                sets.append(f"image_src='{_safe(image_src)}'")
                sets.append(f"image_preview='{_safe(image_preview)}'")
            sets.append(f"raw='{raw_safe}'::jsonb")
            sets.append("removed=FALSE")
            sets.append("updated_at=NOW()")
            cur.execute(
                f"UPDATE {SCHEMA}.sl_merchants SET {', '.join(sets)} WHERE workplace={wid}"
            )
            if cur.rowcount == 0:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sl_merchants (workplace, raw, updated_at) "
                    f"VALUES ({wid}, '{raw_safe}'::jsonb, NOW())"
                )
        conn.commit()
        return True, wid, 'ok'
    except Exception as e:
        conn.rollback()
        return False, wid, f'db: {e}'
    finally:
        cur.close(); conn.close()


def _upsert_good(action: str, item: dict) -> tuple[bool, int | None, str]:
    article = item.get('article') or (item.get('data') or {}).get('article')
    item_type = int(item.get('item_type') or 1)
    if article is None:
        return False, None, 'no article'
    try:
        aid = int(article)
    except Exception:
        return False, None, 'article not int'

    conn = _get_conn()
    cur = conn.cursor()
    try:
        if action == 'remove':
            cur.execute(
                f"UPDATE {SCHEMA}.sl_goods SET removed=TRUE, updated_at=NOW() "
                f"WHERE article={aid} AND item_type={item_type}"
            )
            if cur.rowcount == 0:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sl_goods (article, item_type, removed) VALUES ({aid}, {item_type}, TRUE) "
                    f"ON CONFLICT (article, item_type) DO UPDATE SET removed=TRUE, updated_at=NOW()"
                )
            conn.commit()
            return True, aid, 'removed'

        data = item.get('data') or {}
        images, cover_url = _process_images(data.get('images') or [])
        raw_safe = json.dumps(item, ensure_ascii=False).replace("'", "''")
        images_safe = json.dumps(images, ensure_ascii=False).replace("'", "''")

        try:
            price = float(data.get('price') or 0)
        except Exception:
            price = 0.0
        org = data.get('organization')
        wp = data.get('workplace')

        if action == 'add':
            cur.execute(
                f"INSERT INTO {SCHEMA}.sl_goods "
                f"(article, item_type, organization, workplace, name, price, size, open_date, city, features, specifications, "
                f"category, subcategory, metal_name, metal_standart_name, scrap_product, currency, images, cover_url, "
                f"sold, withdrawn, hidden, hidden_reason, removed, raw, created_at, updated_at) "
                f"VALUES ({aid}, {item_type}, "
                f"{int(org) if org is not None else 'NULL'}, {int(wp) if wp is not None else 'NULL'}, "
                f"'{_safe(data.get('name'))}', {price}, '{_safe(data.get('size'))}', '{_safe(data.get('date'))}', "
                f"'{_safe(data.get('city'))}', '{_safe(data.get('features'))}', '{_safe(data.get('specifications'))}', "
                f"'{_safe(data.get('category'))}', '{_safe(data.get('subcategory'))}', '{_safe(data.get('metal_name'))}', "
                f"'{_safe(data.get('metal_standart_name'))}', '{_safe(data.get('scrap_product'))}', '{_safe(data.get('currency'))}', "
                f"'{images_safe}'::jsonb, '{_safe(cover_url or '')}', "
                f"{int(data.get('sold') or 0)}, {int(data.get('withdrawn') or 0)}, {int(data.get('hidden') or 0)}, "
                f"{int(data.get('hidden_reason')) if data.get('hidden_reason') is not None else 'NULL'}, FALSE, "
                f"'{raw_safe}'::jsonb, NOW(), NOW()) "
                f"ON CONFLICT (article, item_type) DO UPDATE SET "
                f"organization=EXCLUDED.organization, workplace=EXCLUDED.workplace, name=EXCLUDED.name, price=EXCLUDED.price, "
                f"size=EXCLUDED.size, open_date=EXCLUDED.open_date, city=EXCLUDED.city, features=EXCLUDED.features, "
                f"specifications=EXCLUDED.specifications, category=EXCLUDED.category, subcategory=EXCLUDED.subcategory, "
                f"metal_name=EXCLUDED.metal_name, metal_standart_name=EXCLUDED.metal_standart_name, "
                f"scrap_product=EXCLUDED.scrap_product, currency=EXCLUDED.currency, images=EXCLUDED.images, "
                f"cover_url=EXCLUDED.cover_url, sold=EXCLUDED.sold, withdrawn=EXCLUDED.withdrawn, hidden=EXCLUDED.hidden, "
                f"hidden_reason=EXCLUDED.hidden_reason, removed=FALSE, raw=EXCLUDED.raw, updated_at=NOW()"
            )
        else:  # edit — обновляем только пришедшие поля
            sets = []
            field_map = {
                'name': 'name', 'size': 'size', 'date': 'open_date', 'city': 'city',
                'features': 'features', 'specifications': 'specifications',
                'category': 'category', 'subcategory': 'subcategory',
                'metal_name': 'metal_name', 'metal_standart_name': 'metal_standart_name',
                'scrap_product': 'scrap_product', 'currency': 'currency',
            }
            for d_key, col in field_map.items():
                if d_key in data:
                    sets.append(f"{col}='{_safe(data.get(d_key))}'")
            if 'price' in data:
                sets.append(f"price={price}")
            if 'organization' in data and data.get('organization') is not None:
                sets.append(f"organization={int(data['organization'])}")
            if 'workplace' in data and data.get('workplace') is not None:
                sets.append(f"workplace={int(data['workplace'])}")
            if 'sold' in data:
                sets.append(f"sold={int(data.get('sold') or 0)}")
            if 'withdrawn' in data:
                sets.append(f"withdrawn={int(data.get('withdrawn') or 0)}")
            if 'hidden' in data:
                sets.append(f"hidden={int(data.get('hidden') or 0)}")
            if 'hidden_reason' in data:
                hr = data.get('hidden_reason')
                sets.append(f"hidden_reason={int(hr) if hr is not None else 'NULL'}")
            if 'images' in data:
                sets.append(f"images='{images_safe}'::jsonb")
                sets.append(f"cover_url='{_safe(cover_url or '')}'")
            if 'deleted' in data and int(data.get('deleted') or 0) == 1:
                sets.append("removed=TRUE")
            sets.append(f"raw='{raw_safe}'::jsonb")
            sets.append("updated_at=NOW()")
            cur.execute(
                f"UPDATE {SCHEMA}.sl_goods SET {', '.join(sets)} "
                f"WHERE article={aid} AND item_type={item_type}"
            )
            if cur.rowcount == 0:
                # запись не существует — создаём с минимумом
                cur.execute(
                    f"INSERT INTO {SCHEMA}.sl_goods (article, item_type, raw, updated_at) "
                    f"VALUES ({aid}, {item_type}, '{raw_safe}'::jsonb, NOW())"
                )
        conn.commit()
        return True, aid, 'ok'
    except Exception as e:
        conn.rollback()
        return False, aid, f'db: {e}'
    finally:
        cur.close(); conn.close()


def _verify_signature(raw_data: str, signature: str, raw_body: str = '') -> tuple[bool, str]:
    """Возвращает (валидно, диагностика).
    Пробуем все варианты, что мог хешировать SmartLombard:
    1) raw_data (то, что после parse_qs)
    2) URL-encoded версия raw_data (как было в теле POST)
    3) raw_body целиком (вдруг хеш от всего тела)
    4) Префикс 'data=' + raw_data в URL-encoded виде
    """
    secret = (os.environ.get('SMARTLOMBARD_WEBHOOK_SECRET') or '').strip()
    sig = (signature or '').strip().lower()
    if not secret or not sig:
        return False, f'no_secret_or_sig (secret_present={bool(secret)}, sig_present={bool(sig)})'

    candidates: list[tuple[str, str]] = []
    candidates.append(('raw_data', raw_data or ''))
    try:
        candidates.append(('raw_data_urlenc', urllib.parse.quote(raw_data or '', safe='')))
    except Exception:
        pass
    if raw_body:
        candidates.append(('raw_body', raw_body))
        try:
            # тело без префикса data=
            if raw_body.startswith('data='):
                candidates.append(('body_no_prefix', raw_body[5:]))
        except Exception:
            pass

    diag_lines = [f'sig_received={sig[:16]}…', f'secret_len={len(secret)}']
    for name, val in candidates:
        try:
            inner = hashlib.sha1((val or '').encode('utf-8')).hexdigest()
            outer = hashlib.sha1((inner + secret).encode('utf-8')).hexdigest()
            diag_lines.append(f'{name}: len={len(val)}, sha1(sha1+secret)={outer[:16]}…')
            if outer == sig:
                return True, f'OK via {name}'
        except Exception as e:
            diag_lines.append(f'{name}: error {e}')

    return False, '; '.join(diag_lines)


def _log(auth_ok: bool, auth_hdr: str, raw: str, parsed: Any, resp: list,
         items_count: int, error: str | None,
         http_method: str = '', content_type: str = '', all_headers: dict | None = None):
    try:
        conn = _get_conn(); cur = conn.cursor()
        raw_safe = ((raw or '')[:50000]).replace("'", "''")
        if parsed is not None:
            try:
                parsed_safe = json.dumps(parsed, ensure_ascii=False)[:100000].replace("'", "''")
                parsed_sql = f"'{parsed_safe}'::jsonb"
            except Exception:
                parsed_sql = 'NULL'
        else:
            parsed_sql = 'NULL'
        resp_safe = json.dumps(resp, ensure_ascii=False).replace("'", "''")
        err_safe = ((error or '')[:500]).replace("'", "''")
        hdr_safe = (auth_hdr or '')[:200].replace("'", "''")
        method_safe = (http_method or '')[:20].replace("'", "''")
        ct_safe = (content_type or '')[:200].replace("'", "''")
        if all_headers:
            try:
                hdrs_clean = {k: v for k, v in all_headers.items()
                              if k.lower() not in ('cookie', 'x-cookie', 'authorization', 'x-authorization')}
                hdrs_json = json.dumps(hdrs_clean, ensure_ascii=False)[:5000].replace("'", "''")
                hdrs_sql = f"'{hdrs_json}'::jsonb"
            except Exception:
                hdrs_sql = 'NULL'
        else:
            hdrs_sql = 'NULL'
        cur.execute(
            f"INSERT INTO {SCHEMA}.sl_webhook_log "
            f"(auth_ok, auth_header, raw_data, parsed, response, items_count, error, "
            f"http_method, content_type, all_headers) VALUES "
            f"({'TRUE' if auth_ok else 'FALSE'}, '{hdr_safe}', '{raw_safe}', "
            f"{parsed_sql}, '{resp_safe}'::jsonb, {int(items_count or 0)}, '{err_safe}', "
            f"'{method_safe}', '{ct_safe}', {hdrs_sql})"
        )
        conn.commit(); cur.close(); conn.close()
    except Exception as e:
        try:
            print(f'[sl_webhook_log] insert failed: {e}', flush=True)
        except Exception:
            pass


def _check_employee_token(event: dict) -> bool:
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    token = headers.get('x-employee-token', '')
    if not token:
        return False
    try:
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT role FROM {SCHEMA}.employees WHERE auth_token='{_safe(token)}' "
            f"AND token_expires_at>NOW() AND is_active=true"
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return False
        return row[0] in ('owner', 'admin')
    except Exception:
        return False


def handler(event: dict, context) -> dict:
    """Webhook для приёма выгрузки товаров и филиалов из SmartLombard.
    POST с form-data: data=<json>, заголовок AuthorizationSL=sha1(sha1(data)+secret).
    GET ?action=stats — статистика выгрузки (для владельца).
    GET ?action=ping — публичный health-check (без авторизации).
    """
    method = event.get('httpMethod') or 'POST'

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = (params.get('action') or '').lower()

    if method == 'GET' and action == 'ping':
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({'ok': True, 'service': 'smartlombard-webhook'}, ensure_ascii=False)}

    if method == 'GET' and action == 'stats':
        if not _check_employee_token(event):
            return {'statusCode': 401, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}
        conn = _get_conn(); cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.sl_goods WHERE removed=FALSE")
        goods_total = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.sl_merchants WHERE removed=FALSE")
        merchants_total = cur.fetchone()[0]
        cur.execute(
            f"SELECT received_at, auth_ok, items_count, error FROM {SCHEMA}.sl_webhook_log "
            f"ORDER BY received_at DESC LIMIT 20"
        )
        last = [
            {'at': r[0].isoformat() if r[0] else None, 'auth_ok': r[1], 'items': r[2], 'error': r[3]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({
                    'goods_total': goods_total,
                    'merchants_total': merchants_total,
                    'last_webhooks': last,
                    'webhook_secret_present': bool(os.environ.get('SMARTLOMBARD_WEBHOOK_SECRET')),
                }, ensure_ascii=False)}

    # ---------- POST: основной webhook от SmartLombard ----------
    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    auth_hdr = headers.get('authorizationsl') or headers.get('x-authorizationsl') or ''

    raw_body = event.get('body') or ''
    if event.get('isBase64Encoded'):
        try:
            raw_body = base64.b64decode(raw_body).decode('utf-8', errors='replace')
        except Exception:
            pass

    # Полная диагностика: метод, content-type, все заголовки, размер тела
    try:
        hdr_dump = json.dumps({k: v for k, v in headers.items() if k not in ('cookie', 'x-cookie', 'authorization', 'x-authorization')}, ensure_ascii=False)[:1500]
        print(f'[webhook] method={method} ct={headers.get("content-type", "")} body_len={len(raw_body)} headers={hdr_dump} body_preview={raw_body[:300]}', flush=True)
    except Exception:
        pass

    # SmartLombard шлёт application/x-www-form-urlencoded с полем data=<json>
    raw_data = ''
    parsed_payload = None
    try:
        # пробуем как form: data=...
        if '=' in raw_body and raw_body.lstrip().startswith(('data=', 'data ')):
            qs = urllib.parse.parse_qs(raw_body, keep_blank_values=True)
            raw_data = (qs.get('data') or [''])[0]
        else:
            # запасной вариант: парсим всё что есть
            qs = urllib.parse.parse_qs(raw_body, keep_blank_values=True)
            if 'data' in qs:
                raw_data = qs['data'][0]
            else:
                raw_data = raw_body
        if raw_data:
            try:
                parsed_payload = json.loads(raw_data)
            except Exception:
                parsed_payload = None
    except Exception as e:
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps([{'status': False, 'type': 'auth', 'message': f'parse error: {e}'}],
                                   ensure_ascii=False)}

    # Проверка подписи: sha1(sha1(data) + secret)
    auth_ok, auth_diag = _verify_signature(raw_data, auth_hdr, raw_body)
    try:
        print(f'[webhook] auth_ok={auth_ok} diag={auth_diag}', flush=True)
    except Exception:
        pass
    ct_hdr = headers.get('content-type', '')
    if not auth_ok:
        resp = [{'status': False, 'type': 'auth', 'message': 'Authorization failed'}]
        _log(False, auth_hdr, raw_body[:5000], parsed_payload, resp, 0, f'auth fail: {auth_diag}',
             http_method=method, content_type=ct_hdr, all_headers=headers)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(resp, ensure_ascii=False)}

    if parsed_payload is None:
        resp = [{'status': False, 'type': 'auth', 'message': 'invalid json in data'}]
        _log(True, auth_hdr, raw_body[:5000], None, resp, 0, 'bad json',
             http_method=method, content_type=ct_hdr, all_headers=headers)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(resp, ensure_ascii=False)}

    messages: list = []
    items_count = 0

    blocks = parsed_payload if isinstance(parsed_payload, list) else [parsed_payload]
    for block in blocks:
        if not isinstance(block, dict):
            continue
        data_blk = block.get('data') if isinstance(block.get('data'), dict) else block

        merchants = data_blk.get('merchants') or []
        for m in merchants if isinstance(merchants, list) else []:
            if not isinstance(m, dict):
                continue
            t = (m.get('type') or '').lower()
            mdata = m.get('data') if isinstance(m.get('data'), dict) else {}
            ok, uid, msg = _upsert_merchant(t, mdata)
            messages.append({
                'status': bool(ok),
                'type': f'merchant-{t}' if t in ('add', 'edit', 'remove') else 'merchant-add',
                'unique': uid,
                'message': msg,
            })
            items_count += 1

        goods = data_blk.get('goods') or []
        for g in goods if isinstance(goods, list) else []:
            if not isinstance(g, dict):
                continue
            t = (g.get('type') or '').lower()
            ok, uid, msg = _upsert_good(t, g)
            messages.append({
                'status': bool(ok),
                'type': f'good-{t}' if t in ('add', 'edit', 'remove') else 'good-add',
                'unique': uid,
                'message': msg,
            })
            items_count += 1

    if not messages:
        messages.append({'status': True, 'type': 'good-add', 'unique': None, 'message': 'empty payload accepted'})

    _log(True, auth_hdr, raw_body[:5000], parsed_payload, messages, items_count, None,
         http_method=method, content_type=ct_hdr, all_headers=headers)
    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(messages, ensure_ascii=False)}