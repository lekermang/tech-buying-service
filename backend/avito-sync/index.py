import json
import os
import time
import urllib.request
import urllib.parse
import urllib.error
import hashlib
from typing import Any
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import boto3

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p31606708_tech_buying_service')
AVITO_BASE = 'https://api.avito.ru'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Authorization',
    'Access-Control-Max-Age': '86400',
}


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def _http_get(url: str, headers: dict | None = None, timeout: int = 30) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers=headers or {}, method='GET')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def _http_post_form(url: str, data: dict, headers: dict | None = None, timeout: int = 30) -> tuple[int, bytes]:
    body = urllib.parse.urlencode(data).encode('utf-8')
    h = {'Content-Type': 'application/x-www-form-urlencoded'}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=body, headers=h, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def get_token() -> str:
    cid = os.environ['AVITO_API_CLIENT_ID']
    sec = os.environ['AVITO_API_SECRET']
    status, raw = _http_post_form(
        f'{AVITO_BASE}/token',
        {'grant_type': 'client_credentials', 'client_id': cid, 'client_secret': sec},
    )
    if status != 200:
        raise RuntimeError(f'Avito token error {status}: {raw[:300]!r}')
    data = json.loads(raw.decode('utf-8'))
    return data['access_token']


def get_self_user_id(token: str) -> int:
    status, raw = _http_get(f'{AVITO_BASE}/core/v1/accounts/self', {'Authorization': f'Bearer {token}'})
    if status != 200:
        raise RuntimeError(f'Avito self error {status}: {raw[:300]!r}')
    return int(json.loads(raw.decode('utf-8'))['id'])


def get_user_id() -> int:
    val = os.environ.get('AVITO_USER_ID') or os.environ.get('AVITO_PROFILE_ID')
    if val and val.strip().isdigit():
        return int(val.strip())
    token = get_token()
    return get_self_user_id(token)


def fetch_items_page(token: str, user_id: int, page: int, per_page: int = 100, status_filter: str = 'active') -> dict:
    qs = urllib.parse.urlencode({'per_page': per_page, 'page': page, 'status': status_filter})
    url = f'{AVITO_BASE}/core/v1/items?{qs}'
    status, raw = _http_get(url, {'Authorization': f'Bearer {token}'})
    if status != 200:
        raise RuntimeError(f'Avito items error {status}: {raw[:300]!r}')
    return json.loads(raw.decode('utf-8'))


def fetch_item_detail(token: str, user_id: int, item_id: int) -> dict | None:
    url = f'{AVITO_BASE}/core/v1/accounts/{user_id}/items/{item_id}/'
    status, raw = _http_get(url, {'Authorization': f'Bearer {token}'})
    if status != 200:
        return None
    try:
        return json.loads(raw.decode('utf-8'))
    except Exception:
        return None


def fetch_public_item(item_url: str) -> dict:
    """Подтягивает фото и описание с публичной страницы Авито."""
    out: dict = {'photos': [], 'description': ''}
    if not item_url:
        return out
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        }
        status, raw = _http_get(item_url, headers, timeout=20)
        if status != 200 or not raw:
            return out
        html = raw.decode('utf-8', errors='ignore')

        import re
        og_imgs = re.findall(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
        if not og_imgs:
            og_imgs = re.findall(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"', html)
        seen = set()
        for u in og_imgs:
            if u in seen:
                continue
            seen.add(u)
            out['photos'].append(u)

        gallery_urls = re.findall(r'"(https://\d+\.avito\.st/image/[0-9a-zA-Z_/.-]+\.jpg[^"]*)"', html)
        for u in gallery_urls:
            base = u.split('?')[0]
            if base in seen:
                continue
            seen.add(base)
            out['photos'].append(u)

        m = re.search(r'<meta[^>]+property="og:description"[^>]+content="([^"]+)"', html)
        if m:
            out['description'] = m.group(1).replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    except Exception:
        pass
    return out


def upload_photo_to_s3(s3, url: str, avito_id: int, idx: int) -> str | None:
    try:
        status, raw = _http_get(url, {'User-Agent': 'Mozilla/5.0'})
        if status != 200 or not raw:
            return None
        key = f'avito/{avito_id}/{idx}_{hashlib.md5(url.encode()).hexdigest()[:8]}.jpg'
        ctype = 'image/jpeg'
        if url.lower().endswith('.png'):
            ctype = 'image/png'
        elif url.lower().endswith('.webp'):
            ctype = 'image/webp'
        s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=ctype, ACL='public-read')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception:
        return None


def extract_photos(item: dict) -> list[str]:
    out: list[str] = []
    imgs = item.get('images') or []
    for im in imgs:
        if isinstance(im, dict):
            best = im.get('1280x960') or im.get('640x480') or im.get('480x360') or im.get('320x240')
            if not best and im:
                best = list(im.values())[-1]
            if best:
                out.append(best)
        elif isinstance(im, str):
            out.append(im)
    if not out and item.get('image_url'):
        out.append(item['image_url'])
    return out


def sync_all(reupload_photos: bool = False) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=RealDictCursor)
    sync_id: int | None = None
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.avito_sync_log (status) VALUES ('running') RETURNING id"
        )
        sync_id = cur.fetchone()['id']
        conn.commit()

        token = get_token()
        user_id = get_user_id()

        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )

        cur.execute(f"SELECT avito_id, photos, main_photo FROM {SCHEMA}.avito_products")
        existing: dict[int, dict] = {r['avito_id']: dict(r) for r in cur.fetchall()}

        all_items: list[dict] = []
        page = 1
        while True:
            data = fetch_items_page(token, user_id, page, per_page=100, status_filter='active')
            resources = data.get('resources') or []
            all_items.extend(resources)
            meta = data.get('meta') or {}
            total_pages = meta.get('pages') or 1
            if page >= total_pages or not resources:
                break
            page += 1
            if page > 50:
                break

        added = 0
        updated = 0
        photos_uploaded = 0
        active_ids: set[int] = set()

        for it in all_items:
            avito_id = int(it.get('id') or 0)
            if not avito_id:
                continue
            active_ids.add(avito_id)

            detail = fetch_item_detail(token, user_id, avito_id) or {}
            merged = {**it, **detail}

            title = (merged.get('title') or '').strip()
            description = merged.get('description') or ''
            price = merged.get('price') or 0
            try:
                price = int(float(price))
            except Exception:
                price = 0
            url = merged.get('url') or f'https://www.avito.ru/{avito_id}'
            address = merged.get('address') or ''
            if isinstance(merged.get('location'), dict):
                address = merged['location'].get('name') or address
            category = ''
            cat = merged.get('category')
            if isinstance(cat, dict):
                category = cat.get('name') or ''
            elif isinstance(cat, str):
                category = cat
            avito_status = merged.get('status') or 'active'

            photo_urls = extract_photos(merged)

            old = existing.get(avito_id)
            need_public_fetch = not photo_urls or not description
            if need_public_fetch:
                pub = fetch_public_item(url)
                if not photo_urls:
                    photo_urls = pub.get('photos') or []
                if not description:
                    description = pub.get('description') or ''

            need_upload = reupload_photos or not old or not (old.get('photos') or [])
            cdn_photos: list[str] = []
            if need_upload:
                for idx, purl in enumerate(photo_urls[:10]):
                    cdn = upload_photo_to_s3(s3, purl, avito_id, idx)
                    if cdn:
                        cdn_photos.append(cdn)
                        photos_uploaded += 1
            else:
                cdn_photos = old.get('photos') or []

            main_photo = cdn_photos[0] if cdn_photos else None

            if old:
                cur.execute(
                    f"""UPDATE {SCHEMA}.avito_products SET
                        title=%s, description=%s, price=%s, url=%s, address=%s,
                        category=%s, avito_status=%s, status='active',
                        photos=%s, main_photo=%s, raw_data=%s,
                        synced_at=NOW(), updated_at=NOW()
                        WHERE avito_id=%s""",
                    (title, description, price, url, address, category, avito_status,
                     Json(cdn_photos), main_photo, Json(merged), avito_id),
                )
                updated += 1
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.avito_products
                        (avito_id, title, description, price, url, address, category,
                         avito_status, status, photos, main_photo, raw_data)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,'active',%s,%s,%s)""",
                    (avito_id, title, description, price, url, address, category,
                     avito_status, Json(cdn_photos), main_photo, Json(merged)),
                )
                added += 1

            if (added + updated) % 5 == 0:
                conn.commit()

        archived = 0
        if active_ids:
            placeholders = ','.join(['%s'] * len(active_ids))
            cur.execute(
                f"""UPDATE {SCHEMA}.avito_products
                    SET status='archived', updated_at=NOW()
                    WHERE status='active' AND avito_id NOT IN ({placeholders})""",
                tuple(active_ids),
            )
            archived = cur.rowcount or 0

        cur.execute(
            f"""UPDATE {SCHEMA}.avito_sync_log
                SET status='success', finished_at=NOW(),
                    items_total=%s, items_added=%s, items_updated=%s,
                    items_archived=%s, photos_uploaded=%s
                WHERE id=%s""",
            (len(all_items), added, updated, archived, photos_uploaded, sync_id),
        )
        conn.commit()

        return {
            'ok': True,
            'user_id': user_id,
            'total': len(all_items),
            'added': added,
            'updated': updated,
            'archived': archived,
            'photos_uploaded': photos_uploaded,
        }
    except Exception as e:
        conn.rollback()
        if sync_id:
            try:
                cur.execute(
                    f"""UPDATE {SCHEMA}.avito_sync_log
                        SET status='error', finished_at=NOW(), error_message=%s
                        WHERE id=%s""",
                    (str(e)[:500], sync_id),
                )
                conn.commit()
            except Exception:
                pass
        raise
    finally:
        cur.close()
        conn.close()


def refresh_missing_photos(limit: int = 30) -> dict:
    """Догружает фото и описания для товаров, у которых их ещё нет (через публичную страницу Авито)."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    processed = 0
    updated = 0
    photos_total = 0
    try:
        cur.execute(
            f"""SELECT id, avito_id, url, photos, description
                FROM {SCHEMA}.avito_products
                WHERE status='active' AND (photos = '[]'::jsonb OR main_photo IS NULL OR description IS NULL OR description='')
                ORDER BY id ASC LIMIT %s""",
            (limit,),
        )
        rows = cur.fetchall()
        for r in rows:
            processed += 1
            pub = fetch_public_item(r['url'])
            new_photos: list[str] = list(r['photos'] or [])
            if not new_photos and pub.get('photos'):
                for idx, pu in enumerate(pub['photos'][:10]):
                    cdn = upload_photo_to_s3(s3, pu, r['avito_id'], idx)
                    if cdn:
                        new_photos.append(cdn)
                        photos_total += 1
            new_desc = r['description'] or pub.get('description') or ''
            main_photo = new_photos[0] if new_photos else None
            cur.execute(
                f"""UPDATE {SCHEMA}.avito_products
                    SET photos=%s, main_photo=%s, description=%s,
                        synced_at=NOW(), updated_at=NOW()
                    WHERE id=%s""",
                (Json(new_photos), main_photo, new_desc, r['id']),
            )
            updated += 1
            conn.commit()
        return {'ok': True, 'processed': processed, 'updated': updated, 'photos_uploaded': photos_total}
    finally:
        cur.close()
        conn.close()


def auto_sync_if_stale(min_age_minutes: int = 30) -> dict:
    """Запускает синхронизацию только если последняя успешная была давно. Безопасно для частых вызовов."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"""SELECT MAX(finished_at) AS last
                FROM {SCHEMA}.avito_sync_log
                WHERE status='success'"""
        )
        row = cur.fetchone()
        last = row['last'] if row else None
        if last:
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            age = (now - last).total_seconds() / 60.0
            if age < min_age_minutes:
                return {'ok': True, 'skipped': True, 'reason': 'fresh', 'age_minutes': round(age, 1)}
        cur.execute(
            f"""SELECT 1 FROM {SCHEMA}.avito_sync_log
                WHERE status='running' AND started_at > NOW() - INTERVAL '5 minutes'
                LIMIT 1"""
        )
        if cur.fetchone():
            return {'ok': True, 'skipped': True, 'reason': 'already_running'}
    finally:
        cur.close()
        conn.close()
    return sync_all(reupload_photos=False)


def get_status() -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"""SELECT id, started_at, finished_at, status, items_total,
                items_added, items_updated, items_archived, photos_uploaded, error_message
                FROM {SCHEMA}.avito_sync_log
                ORDER BY id DESC LIMIT 10"""
        )
        logs = [dict(r) for r in cur.fetchall()]
        cur.execute(
            f"SELECT COUNT(*) AS n FROM {SCHEMA}.avito_products WHERE status='active'"
        )
        active = cur.fetchone()['n']
        return {'logs': logs, 'active_count': active}
    finally:
        cur.close()
        conn.close()


def handler(event: dict, context: Any) -> dict:
    """Синхронизация товаров профиля Авито с сайтом Скупка24. Тянет объявления через официальное API, сохраняет фото в S3, кладёт в БД."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    headers = event.get('headers') or {}
    qs = event.get('queryStringParameters') or {}
    admin_token = headers.get('X-Admin-Token') or headers.get('x-admin-token') \
        or headers.get('X-Authorization') or headers.get('x-authorization') \
        or (qs.get('token') if qs else '') or ''
    expected = os.environ.get('ADMIN_TOKEN', '')

    action = qs.get('action', 'status')

    if action == 'status':
        try:
            return _resp(200, {'ok': True, **get_status()})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'whoami':
        try:
            token = get_token()
            uid = get_self_user_id(token)
            return _resp(200, {'ok': True, 'user_id': uid})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action in ('sync', 'run', 'pull'):
        if expected and admin_token != expected:
            return _resp(403, {'ok': False, 'error': 'Forbidden'})
        try:
            reupload = qs.get('reupload') == '1'
            result = sync_all(reupload_photos=reupload)
            return _resp(200, result)
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'refresh':
        try:
            limit_n = int(qs.get('limit') or 30)
        except Exception:
            limit_n = 30
        try:
            result = refresh_missing_photos(limit_n)
            return _resp(200, result)
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'auto':
        try:
            mins = int(qs.get('min') or 30)
        except Exception:
            mins = 30
        try:
            return _resp(200, auto_sync_if_stale(mins))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'firstrun':
        cur_count = 0
        try:
            dsn = os.environ['DATABASE_URL']
            c = psycopg2.connect(dsn)
            cu = c.cursor()
            cu.execute(f"SELECT COUNT(*) FROM {SCHEMA}.avito_products")
            cur_count = cu.fetchone()[0]
            cu.close()
            c.close()
        except Exception:
            pass
        if cur_count > 0:
            return _resp(200, {'ok': True, 'skipped': True, 'reason': 'already has products', 'count': cur_count})
        try:
            result = sync_all(reupload_photos=False)
            return _resp(200, result)
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    return _resp(400, {'ok': False, 'error': 'unknown action'})