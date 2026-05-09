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


_AVITO_UA = (
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) '
    'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
)


def _pick_best_photo(p: dict) -> str | None:
    """Выбирает максимальное разрешение из объекта фото мобильного API."""
    if not isinstance(p, dict):
        return None
    candidates: list = []
    for key in ('image_url', 'url'):
        v = p.get(key)
        if isinstance(v, str):
            candidates.append((9999, v))
    sizes = p.get('sizes') or p.get('variants') or {}
    if isinstance(sizes, dict):
        for k, v in sizes.items():
            if isinstance(v, str):
                try:
                    w = int(str(k).split('x')[0])
                except Exception:
                    w = 100
                candidates.append((w, v))
    if not candidates:
        for v in (p.values() if isinstance(p, dict) else []):
            if isinstance(v, str) and ('avito.st' in v or 'avito.ru' in v) and ('.jpg' in v or '.webp' in v):
                candidates.append((100, v))
    if not candidates:
        return None
    candidates.sort(key=lambda x: -x[0])
    return candidates[0][1]


def fetch_public_item(item_url_or_id: str | int) -> dict:
    """Тянет фото и описание через мобильный публичный API Авито (m.avito.ru/api/15/items/{id})."""
    out: dict = {'photos': [], 'description': ''}
    item_id: int | None = None
    if isinstance(item_url_or_id, int):
        item_id = item_url_or_id
    elif isinstance(item_url_or_id, str):
        import re
        m = re.search(r'_(\d{6,})(?:[/?]|$)', item_url_or_id)
        if m:
            try:
                item_id = int(m.group(1))
            except Exception:
                item_id = None
        else:
            digits = re.findall(r'(\d{8,})', item_url_or_id)
            if digits:
                try:
                    item_id = int(digits[-1])
                except Exception:
                    item_id = None
    if not item_id:
        return out

    api_endpoints = [
        f'https://m.avito.ru/api/15/items/{item_id}?key=af0deccbgcgidddjgnvljitntccdduijhdinfgjgfjir',
        f'https://m.avito.ru/api/16/items/{item_id}?key=af0deccbgcgidddjgnvljitntccdduijhdinfgjgfjir',
        f'https://www.avito.ru/api/15/items/{item_id}?key=af0deccbgcgidddjgnvljitntccdduijhdinfgjgfjir',
    ]
    headers = {
        'User-Agent': _AVITO_UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ru-RU,ru;q=0.9',
        'Referer': 'https://m.avito.ru/',
        'Origin': 'https://m.avito.ru',
    }
    data: dict | None = None
    for url in api_endpoints:
        try:
            status, raw = _http_get(url, headers, timeout=20)
            if status == 200 and raw:
                try:
                    data = json.loads(raw.decode('utf-8'))
                    if isinstance(data, dict):
                        break
                except Exception:
                    continue
        except Exception:
            continue

    if isinstance(data, dict):
        seen: set = set()
        photos_arr = (
            data.get('images')
            or data.get('photos')
            or (data.get('gallery') or {}).get('images')
            or []
        )
        if isinstance(photos_arr, list):
            for p in photos_arr:
                u = _pick_best_photo(p) if isinstance(p, dict) else (p if isinstance(p, str) else None)
                if not u:
                    continue
                base = u.split('?')[0]
                if base in seen:
                    continue
                seen.add(base)
                out['photos'].append(u)

        for fkey in ('description', 'descriptionHtml', 'description_html'):
            d = data.get(fkey)
            if isinstance(d, str) and d.strip():
                txt = d
                if '<' in txt:
                    import re
                    txt = re.sub(r'<br\s*/?\s*>', '\n', txt, flags=re.I)
                    txt = re.sub(r'</p>', '\n', txt, flags=re.I)
                    txt = re.sub(r'<[^>]+>', '', txt)
                txt = txt.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&nbsp;', ' ')
                out['description'] = txt.strip()
                break

    if not out['photos'] and isinstance(item_url_or_id, str) and item_url_or_id.startswith('http'):
        try:
            status, raw = _http_get(item_url_or_id, headers, timeout=15)
            if status == 200 and raw:
                html = raw.decode('utf-8', errors='ignore')
                import re
                og_imgs = re.findall(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
                seen = set()
                for u in og_imgs:
                    if u in seen:
                        continue
                    seen.add(u)
                    out['photos'].append(u)
                if not out['description']:
                    m = re.search(r'<meta[^>]+property="og:description"[^>]+content="([^"]+)"', html)
                    if m:
                        out['description'] = m.group(1).replace('&quot;', '"').replace('&amp;', '&')
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
                pub = fetch_public_item(avito_id)
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


def refresh_missing_photos(limit: int = 10) -> dict:
    """Догружает фото и описания для товаров без фото через мобильный API Авито."""
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
    found_photos_for = 0
    try:
        cur.execute(
            f"""SELECT id, avito_id, url, photos, description
                FROM {SCHEMA}.avito_products
                WHERE status='active' AND (photos = '[]'::jsonb OR main_photo IS NULL)
                ORDER BY id ASC LIMIT %s""",
            (limit,),
        )
        rows = cur.fetchall()
        for r in rows:
            processed += 1
            pub = fetch_public_item(r['avito_id'])
            new_photos: list[str] = list(r['photos'] or [])
            if not new_photos and pub.get('photos'):
                found_photos_for += 1
                for idx, pu in enumerate(pub['photos'][:5]):
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
        return {
            'ok': True,
            'processed': processed,
            'updated': updated,
            'photos_uploaded': photos_total,
            'found_photos_for': found_photos_for,
        }
    finally:
        cur.close()
        conn.close()


def get_no_photo_count() -> int:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute(
            f"""SELECT COUNT(*) FROM {SCHEMA}.avito_products
                WHERE status='active' AND (photos = '[]'::jsonb OR main_photo IS NULL)"""
        )
        return cur.fetchone()[0] or 0
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


def get_dashboard() -> dict:
    """Возвращает агрегаты для Авито PRO Dashboard: тоталы, топ по просмотрам, графики 7/30 дней."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Тоталы по статусам
        cur.execute(
            f"""SELECT
                COUNT(*) FILTER (WHERE status='active') AS active,
                COUNT(*) FILTER (WHERE status='archived') AS archived,
                COUNT(*) FILTER (WHERE status='removed') AS removed,
                COUNT(*) FILTER (WHERE avito_status='moderation') AS moderation,
                COUNT(*) FILTER (WHERE avito_status='rejected') AS rejected,
                COUNT(*) FILTER (WHERE status='active' AND (main_photo IS NULL OR main_photo='')) AS no_photo,
                COUNT(*) AS total,
                COALESCE(SUM(views_total), 0) AS views_total,
                COALESCE(SUM(contacts_total), 0) AS contacts_total,
                COALESCE(SUM(favorites_total), 0) AS favorites_total
                FROM {SCHEMA}.avito_products"""
        )
        totals_row = cur.fetchone() or {}
        totals = {k: int(v or 0) for k, v in dict(totals_row).items()}

        # Последняя успешная синхронизация
        cur.execute(
            f"""SELECT MAX(synced_at) AS last_sync FROM {SCHEMA}.avito_products"""
        )
        last_sync_row = cur.fetchone() or {}

        # Топ-10 по просмотрам
        cur.execute(
            f"""SELECT id, avito_id, title, price, main_photo, url,
                COALESCE(views_total, 0) AS views,
                COALESCE(contacts_total, 0) AS contacts,
                COALESCE(favorites_total, 0) AS favorites
                FROM {SCHEMA}.avito_products
                WHERE status='active'
                ORDER BY COALESCE(views_total, 0) DESC, id DESC
                LIMIT 10"""
        )
        top = [dict(r) for r in cur.fetchall()]

        # Графики за 30 дней (если есть таблица avito_stats)
        chart: list[dict] = []
        try:
            cur.execute(
                f"""SELECT date::text AS date,
                    COALESCE(SUM(views), 0) AS views,
                    COALESCE(SUM(contacts), 0) AS contacts,
                    COALESCE(SUM(favorites), 0) AS favorites
                    FROM {SCHEMA}.avito_stats
                    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY date
                    ORDER BY date ASC"""
            )
            chart = [
                {
                    'date': r['date'],
                    'views': int(r['views'] or 0),
                    'contacts': int(r['contacts'] or 0),
                    'favorites': int(r['favorites'] or 0),
                }
                for r in cur.fetchall()
            ]
        except Exception:
            chart = []

        return {
            'totals': totals,
            'top': top,
            'chart': chart,
            'last_sync': str(last_sync_row.get('last_sync')) if last_sync_row.get('last_sync') else None,
        }
    finally:
        cur.close()
        conn.close()


def fetch_item_stats(token: str, user_id: int, item_ids: list[int]) -> dict:
    """Получает статистику просмотров/контактов из Avito API за последние 30 дней."""
    if not item_ids:
        return {}
    from datetime import datetime, timedelta
    date_to = datetime.utcnow().date()
    date_from = date_to - timedelta(days=30)
    body = json.dumps({
        'dateFrom': date_from.isoformat(),
        'dateTo': date_to.isoformat(),
        'fields': ['uniqViews', 'uniqContacts', 'uniqFavorites'],
        'itemIds': item_ids[:200],
        'periodGrouping': 'day',
    }).encode('utf-8')
    url = f'{AVITO_BASE}/stats/v1/accounts/{user_id}/items'
    req = urllib.request.Request(
        url,
        data=body,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception:
        return {}


def sync_stats() -> dict:
    """Тянет статистику просмотров/контактов с Avito API и кладёт в avito_stats + обновляет totals в avito_products."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT avito_id FROM {SCHEMA}.avito_products WHERE status='active' ORDER BY id LIMIT 200"
        )
        ids = [int(r['avito_id']) for r in cur.fetchall()]
        if not ids:
            return {'ok': True, 'updated': 0, 'skipped_reason': 'no active items'}

        token = get_token()
        uid = get_user_id()
        data = fetch_item_stats(token, uid, ids)
        items_data = (data or {}).get('result', {}).get('items') or []

        rows_inserted = 0
        for item in items_data:
            try:
                item_id = int(item.get('itemId') or item.get('item_id') or 0)
                if not item_id:
                    continue
                stats_arr = item.get('stats') or []
                total_v = 0
                total_c = 0
                total_f = 0
                for st in stats_arr:
                    date_s = st.get('date') or ''
                    v = int(st.get('uniqViews') or 0)
                    c = int(st.get('uniqContacts') or 0)
                    f = int(st.get('uniqFavorites') or 0)
                    total_v += v
                    total_c += c
                    total_f += f
                    if date_s:
                        cur.execute(
                            f"""INSERT INTO {SCHEMA}.avito_stats(avito_id, date, views, contacts, favorites, captured_at)
                                VALUES(%s, %s, %s, %s, %s, NOW())
                                ON CONFLICT(avito_id, date) DO UPDATE SET
                                    views=EXCLUDED.views,
                                    contacts=EXCLUDED.contacts,
                                    favorites=EXCLUDED.favorites,
                                    captured_at=NOW()""",
                            (item_id, date_s, v, c, f),
                        )
                        rows_inserted += 1
                cur.execute(
                    f"""UPDATE {SCHEMA}.avito_products
                        SET views_total=%s, contacts_total=%s, favorites_total=%s, stats_updated_at=NOW()
                        WHERE avito_id=%s""",
                    (total_v, total_c, total_f, item_id),
                )
            except Exception:
                continue
        conn.commit()
        return {'ok': True, 'updated': rows_inserted, 'items': len(items_data)}
    except Exception as e:
        conn.rollback()
        return {'ok': False, 'error': str(e)}
    finally:
        cur.close()
        conn.close()


def fetch_chats(token: str, user_id: int, limit: int = 50, offset: int = 0) -> dict:
    """Получает список диалогов из Avito Messenger API."""
    qs = urllib.parse.urlencode({'limit': limit, 'offset': offset})
    url = f'{AVITO_BASE}/messenger/v2/accounts/{user_id}/chats?{qs}'
    status, raw = _http_get(url, {'Authorization': f'Bearer {token}'})
    if status != 200:
        return {}
    try:
        return json.loads(raw.decode('utf-8'))
    except Exception:
        return {}


def fetch_chat_messages(token: str, user_id: int, chat_id: str, limit: int = 50) -> list:
    """Получает сообщения из конкретного диалога."""
    qs = urllib.parse.urlencode({'limit': limit})
    url = f'{AVITO_BASE}/messenger/v3/accounts/{user_id}/chats/{chat_id}/messages/?{qs}'
    status, raw = _http_get(url, {'Authorization': f'Bearer {token}'})
    if status != 200:
        return []
    try:
        data = json.loads(raw.decode('utf-8'))
        return data.get('messages') or []
    except Exception:
        return []


def send_chat_message(token: str, user_id: int, chat_id: str, text: str) -> dict:
    """Отправляет текстовое сообщение в чат Avito."""
    url = f'{AVITO_BASE}/messenger/v1/accounts/{user_id}/chats/{chat_id}/messages'
    body = json.dumps({'message': {'text': text}, 'type': 'text'}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return {'error': e.read().decode('utf-8'), 'code': e.code}
        except Exception:
            return {'error': str(e), 'code': e.code}
    except Exception as e:
        return {'error': str(e)}


def sync_chats() -> dict:
    """Синхронизирует список диалогов из Avito в нашу БД (avito_chats)."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        token = get_token()
        uid = get_user_id()
        data = fetch_chats(token, uid, limit=100)
        chats = (data or {}).get('chats') or []
        added = 0
        updated = 0
        for c in chats:
            try:
                cid = str(c.get('id') or '')
                if not cid:
                    continue
                ctx = c.get('context') or {}
                value = ctx.get('value') or {}
                avito_id = int(value.get('id') or 0) if value.get('id') else 0
                title = value.get('title') or ''
                users = c.get('users') or []
                buyer = next((u for u in users if str(u.get('id')) != str(uid)), None) or {}
                user_name = (buyer or {}).get('name') or ''
                avatar = ((buyer or {}).get('public_user_profile') or {}).get('avatar', {}).get('default') or ''
                last_msg = (c.get('last_message') or {})
                last_text = (last_msg.get('content') or {}).get('text') or '[без текста]'
                last_at_unix = last_msg.get('created') or 0
                from datetime import datetime as dt
                last_at = dt.utcfromtimestamp(int(last_at_unix)).isoformat() if last_at_unix else None
                unread = int(c.get('unread') or c.get('unread_count') or 0)
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.avito_chats(chat_id, avito_id, item_title, user_name, user_avatar,
                        last_message, last_message_at, unread_count, raw_data, fetched_at)
                        VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                        ON CONFLICT(chat_id) DO UPDATE SET
                            avito_id=EXCLUDED.avito_id,
                            item_title=EXCLUDED.item_title,
                            user_name=EXCLUDED.user_name,
                            user_avatar=EXCLUDED.user_avatar,
                            last_message=EXCLUDED.last_message,
                            last_message_at=EXCLUDED.last_message_at,
                            unread_count=EXCLUDED.unread_count,
                            raw_data=EXCLUDED.raw_data,
                            fetched_at=NOW()
                        RETURNING (xmax = 0) AS inserted""",
                    (cid, avito_id or None, title, user_name, avatar, last_text, last_at, unread, Json(c)),
                )
                row = cur.fetchone()
                if row and row.get('inserted'):
                    added += 1
                else:
                    updated += 1
            except Exception:
                continue
        conn.commit()
        return {'ok': True, 'total': len(chats), 'added': added, 'updated': updated}
    except Exception as e:
        conn.rollback()
        return {'ok': False, 'error': str(e)}
    finally:
        cur.close()
        conn.close()


def get_chats_list(unread_only: bool = False, limit: int = 50) -> dict:
    """Список чатов из БД."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        where = ''
        if unread_only:
            where = 'WHERE unread_count > 0'
        cur.execute(
            f"""SELECT chat_id, avito_id, item_title, user_name, user_avatar,
                last_message, last_message_at, unread_count
                FROM {SCHEMA}.avito_chats
                {where}
                ORDER BY last_message_at DESC NULLS LAST LIMIT %s""",
            (limit,),
        )
        chats = [dict(r) for r in cur.fetchall()]
        cur.execute(
            f"""SELECT
                COUNT(*) FILTER (WHERE unread_count > 0) AS unread_chats,
                COALESCE(SUM(unread_count), 0) AS unread_total,
                COUNT(*) AS total
                FROM {SCHEMA}.avito_chats"""
        )
        stats = dict(cur.fetchone() or {})
        return {'chats': chats, 'stats': stats}
    finally:
        cur.close()
        conn.close()


def get_chat_messages(chat_id: str, refresh: bool = True) -> dict:
    """Получает сообщения чата (свежие тянет с API + сохраняет в БД)."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        if refresh:
            try:
                token = get_token()
                uid = get_user_id()
                msgs = fetch_chat_messages(token, uid, chat_id, limit=80)
                from datetime import datetime as dt
                for m in msgs:
                    mid = str(m.get('id') or '')
                    if not mid:
                        continue
                    author = str(m.get('author_id') or '')
                    is_out = str(author) == str(uid)
                    text = (m.get('content') or {}).get('text') or ''
                    mtype = m.get('type') or 'text'
                    created_unix = m.get('created') or 0
                    created_at = dt.utcfromtimestamp(int(created_unix)).isoformat() if created_unix else None
                    cur.execute(
                        f"""INSERT INTO {SCHEMA}.avito_messages(chat_id, message_id, author_id, is_outgoing, text, type, created_at, raw_data)
                            VALUES(%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT(message_id) DO UPDATE SET text=EXCLUDED.text""",
                        (chat_id, mid, author, is_out, text, mtype, created_at, Json(m)),
                    )
                conn.commit()
            except Exception:
                conn.rollback()
        cur.execute(
            f"""SELECT message_id, author_id, is_outgoing, text, type, created_at
                FROM {SCHEMA}.avito_messages
                WHERE chat_id=%s ORDER BY created_at ASC NULLS FIRST LIMIT 200""",
            (chat_id,),
        )
        messages = [dict(r) for r in cur.fetchall()]
        cur.execute(
            f"SELECT chat_id, item_title, user_name, user_avatar, avito_id FROM {SCHEMA}.avito_chats WHERE chat_id=%s",
            (chat_id,),
        )
        chat = dict(cur.fetchone() or {})
        return {'chat': chat, 'messages': messages}
    finally:
        cur.close()
        conn.close()


def send_message_action(chat_id: str, text: str) -> dict:
    """Отправляет сообщение в чат + сохраняет в БД."""
    if not text.strip():
        return {'ok': False, 'error': 'Пустое сообщение'}
    try:
        token = get_token()
        uid = get_user_id()
        result = send_chat_message(token, uid, chat_id, text)
        if 'error' in result:
            return {'ok': False, 'error': result.get('error', 'unknown')}
        # Сохраним сразу в БД
        try:
            dsn = os.environ['DATABASE_URL']
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            from datetime import datetime as dt
            mid = str(result.get('id') or f'local_{int(time.time()*1000)}')
            created_at = dt.utcnow().isoformat()
            cur.execute(
                f"""INSERT INTO {SCHEMA}.avito_messages(chat_id, message_id, author_id, is_outgoing, text, type, created_at, raw_data)
                    VALUES(%s, %s, %s, TRUE, %s, 'text', %s, %s)
                    ON CONFLICT(message_id) DO NOTHING""",
                (chat_id, mid, str(uid), text, created_at, Json(result)),
            )
            cur.execute(
                f"""UPDATE {SCHEMA}.avito_chats
                    SET last_message=%s, last_message_at=NOW(), unread_count=0
                    WHERE chat_id=%s""",
                (text, chat_id),
            )
            conn.commit()
            cur.close()
            conn.close()
        except Exception:
            pass
        return {'ok': True, 'sent': True, 'response': result}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def apply_vas(token: str, user_id: int, item_id: int, vas_type: str = 'xl') -> dict:
    """Применяет услугу продвижения (VAS) к объявлению."""
    url = f'{AVITO_BASE}/core/v1/accounts/{user_id}/items/{item_id}/vas'
    body = json.dumps({'vas': [vas_type]}).encode('utf-8')
    req = urllib.request.Request(
        url,
        data=body,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='PUT',
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return {'ok': True, 'response': json.loads(r.read().decode('utf-8') or '{}')}
    except urllib.error.HTTPError as e:
        try:
            return {'ok': False, 'error': e.read().decode('utf-8'), 'code': e.code}
        except Exception:
            return {'ok': False, 'error': str(e), 'code': e.code}
    except Exception as e:
        return {'ok': False, 'error': str(e)}


def bump_items(item_ids: list[int], vas_type: str = 'xl', schedule_id: int | None = None) -> dict:
    """Поднимает список объявлений через VAS API."""
    if not item_ids:
        return {'ok': False, 'error': 'нет объявлений'}
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        token = get_token()
        uid = get_user_id()
        ok_n = 0
        fail_n = 0
        errors = []
        for iid in item_ids[:50]:
            res = apply_vas(token, uid, iid, vas_type)
            status = 'ok' if res.get('ok') else 'error'
            err = None if res.get('ok') else (res.get('error') or '')[:300]
            if res.get('ok'):
                ok_n += 1
            else:
                fail_n += 1
                errors.append({'item_id': iid, 'error': err})
            cur.execute(
                f"""INSERT INTO {SCHEMA}.avito_bump_log(avito_id, vas_type, status, error, schedule_id)
                    VALUES(%s, %s, %s, %s, %s)""",
                (iid, vas_type, status, err, schedule_id),
            )
        if schedule_id:
            cur.execute(
                f"""UPDATE {SCHEMA}.avito_bump_schedule
                    SET last_run_at=NOW(), last_run_count=%s, updated_at=NOW()
                    WHERE id=%s""",
                (ok_n, schedule_id),
            )
        conn.commit()
        return {'ok': True, 'bumped': ok_n, 'failed': fail_n, 'errors': errors[:10]}
    except Exception as e:
        conn.rollback()
        return {'ok': False, 'error': str(e)}
    finally:
        cur.close()
        conn.close()


def list_schedules() -> list:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"""SELECT id, name, category, weekdays, hour, vas_type, is_active,
                last_run_at, last_run_count, created_at
                FROM {SCHEMA}.avito_bump_schedule
                ORDER BY id ASC"""
        )
        return [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()


def save_schedule(data: dict) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        sid = data.get('id')
        name = (data.get('name') or 'Без имени')[:200]
        category = (data.get('category') or '')[:200] or None
        weekdays = (data.get('weekdays') or '1,2,3,4,5,6,7')[:50]
        hour = max(0, min(23, int(data.get('hour') or 10)))
        vas_type = (data.get('vas_type') or 'xl')[:50]
        is_active = bool(data.get('is_active', True))
        if sid:
            cur.execute(
                f"""UPDATE {SCHEMA}.avito_bump_schedule
                    SET name=%s, category=%s, weekdays=%s, hour=%s, vas_type=%s, is_active=%s, updated_at=NOW()
                    WHERE id=%s RETURNING *""",
                (name, category, weekdays, hour, vas_type, is_active, sid),
            )
        else:
            cur.execute(
                f"""INSERT INTO {SCHEMA}.avito_bump_schedule(name, category, weekdays, hour, vas_type, is_active)
                    VALUES(%s, %s, %s, %s, %s, %s) RETURNING *""",
                (name, category, weekdays, hour, vas_type, is_active),
            )
        row = dict(cur.fetchone() or {})
        conn.commit()
        return {'ok': True, 'item': row}
    except Exception as e:
        conn.rollback()
        return {'ok': False, 'error': str(e)}
    finally:
        cur.close()
        conn.close()


def delete_schedule(sid: int) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute(f"DELETE FROM {SCHEMA}.avito_bump_schedule WHERE id=%s", (sid,))
        conn.commit()
        return {'ok': True}
    finally:
        cur.close()
        conn.close()


def run_schedule(sid: int) -> dict:
    """Запускает расписание вручную: берёт активные товары (опц. по категории) и продвигает."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT * FROM {SCHEMA}.avito_bump_schedule WHERE id=%s AND is_active=TRUE",
            (sid,),
        )
        sch = cur.fetchone()
        if not sch:
            return {'ok': False, 'error': 'расписание не найдено или выключено'}
        sch = dict(sch)
        category = sch.get('category')
        params: list = []
        where = "status='active'"
        if category:
            where += " AND category=%s"
            params.append(category)
        cur.execute(
            f"SELECT avito_id FROM {SCHEMA}.avito_products WHERE {where} ORDER BY id LIMIT 50",
            params,
        )
        item_ids = [int(r['avito_id']) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

    if not item_ids:
        return {'ok': False, 'error': 'нет товаров для продвижения'}
    return bump_items(item_ids, sch['vas_type'], sid)


def build_autoload_xml() -> str:
    """Генерирует XML-фид для Avito Autoload из активных товаров (только с фото!)."""
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"""SELECT avito_id, title, description, price, category, photos, address, url, main_photo
                FROM {SCHEMA}.avito_products
                WHERE status='active' AND is_visible=TRUE
                  AND (
                    (main_photo IS NOT NULL AND main_photo != '')
                    OR (photos IS NOT NULL AND photos::text NOT IN ('[]', 'null', ''))
                  )
                ORDER BY id ASC"""
        )
        rows = [dict(r) for r in cur.fetchall()]
    finally:
        cur.close()
        conn.close()

    def esc(s: str) -> str:
        return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    parts = ['<?xml version="1.0" encoding="UTF-8"?>', '<Ads formatVersion="3" target="Avito.ru">']
    for r in rows:
        photos = r.get('photos') or []
        if isinstance(photos, str):
            try:
                photos = json.loads(photos)
            except Exception:
                photos = []
        if not photos and r.get('main_photo'):
            photos = [r['main_photo']]
        # Защита: пропускаем товар, если нет ни одного валидного фото-URL
        valid_photos = [p for p in photos if isinstance(p, str) and p.strip()]
        if not valid_photos:
            continue
        photos = valid_photos
        parts.append('<Ad>')
        parts.append(f"<Id>{r['avito_id']}</Id>")
        parts.append(f"<Title>{esc(r.get('title', ''))}</Title>")
        parts.append(f"<Description><![CDATA[{r.get('description') or r.get('title', '')}]]></Description>")
        if r.get('category'):
            parts.append(f"<Category>{esc(r['category'])}</Category>")
        parts.append(f"<Price>{int(r.get('price') or 0)}</Price>")
        if r.get('address'):
            parts.append(f"<Address>{esc(r['address'])}</Address>")
        parts.append('<Condition>Б/у</Condition>')
        if photos:
            parts.append('<Images>')
            for p in photos[:10]:
                if isinstance(p, str) and p:
                    parts.append(f'<Image url="{esc(p)}" />')
            parts.append('</Images>')
        parts.append('</Ad>')
    parts.append('</Ads>')
    return '\n'.join(parts)


def get_autoload_status() -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(
            f"SELECT * FROM {SCHEMA}.avito_autoload_config WHERE id=1"
        )
        cfg = dict(cur.fetchone() or {})
        cur.execute(
            f"""SELECT
                COUNT(*) FILTER (
                    WHERE status='active' AND is_visible=TRUE
                      AND (
                        (main_photo IS NOT NULL AND main_photo != '')
                        OR (photos IS NOT NULL AND photos::text NOT IN ('[]', 'null', ''))
                      )
                ) AS eligible,
                COUNT(*) FILTER (
                    WHERE status='active' AND is_visible=TRUE
                      AND (main_photo IS NULL OR main_photo='')
                      AND (photos IS NULL OR photos::text IN ('[]', 'null', ''))
                ) AS no_photo,
                COUNT(*) FILTER (WHERE status='active' AND is_visible=TRUE) AS active_visible
                FROM {SCHEMA}.avito_products"""
        )
        row = dict(cur.fetchone() or {})
        return {
            'config': cfg,
            'eligible': int(row.get('eligible') or 0),
            'no_photo': int(row.get('no_photo') or 0),
            'active_visible': int(row.get('active_visible') or 0),
        }
    finally:
        cur.close()
        conn.close()


def update_autoload_config(data: dict) -> dict:
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        is_enabled = bool(data.get('is_enabled', False))
        feed_url = (data.get('feed_url') or '')[:500] or None
        cur.execute(
            f"""UPDATE {SCHEMA}.avito_autoload_config
                SET is_enabled=%s, feed_url=%s, updated_at=NOW()
                WHERE id=1 RETURNING *""",
            (is_enabled, feed_url),
        )
        row = dict(cur.fetchone() or {})
        conn.commit()
        return {'ok': True, 'config': row}
    except Exception as e:
        conn.rollback()
        return {'ok': False, 'error': str(e)}
    finally:
        cur.close()
        conn.close()


def regenerate_autoload(s3_save: bool = True) -> dict:
    """Генерирует свежий XML и сохраняет в S3 (публичный URL)."""
    xml = build_autoload_xml()
    items_count = xml.count('<Ad>')
    feed_url = None
    if s3_save:
        try:
            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            key = 'avito/autoload.xml'
            s3.put_object(
                Bucket='files',
                Key=key,
                Body=xml.encode('utf-8'),
                ContentType='application/xml; charset=utf-8',
                ACL='public-read',
                CacheControl='no-cache',
            )
            feed_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        except Exception as e:
            return {'ok': False, 'error': str(e)}

    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    try:
        cur.execute(
            f"""UPDATE {SCHEMA}.avito_autoload_config
                SET feed_url=COALESCE(%s, feed_url),
                    last_generated_at=NOW(), last_items_count=%s, updated_at=NOW()
                WHERE id=1""",
            (feed_url, items_count),
        )
        conn.commit()
    finally:
        cur.close()
        conn.close()
    return {'ok': True, 'items': items_count, 'feed_url': feed_url, 'size': len(xml)}


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

    if action == 'find_by_query':
        # Поиск активных Авито-объявлений по названию/IMEI для снятия после полного выкупа в Смарт-Ломбарде
        q = (qs.get('q') or '').strip()
        imei = (qs.get('imei') or '').strip()
        if not q and not imei:
            return _resp(200, {'ok': True, 'items': []})
        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            # Сначала по IMEI/serial — точное совпадение
            items = []
            if imei and len(imei) >= 6:
                cur.execute(
                    f"""SELECT id, avito_id, title, price, url, main_photo
                        FROM {SCHEMA}.avito_products
                        WHERE status='active'
                          AND (raw_data::text ILIKE %s OR description ILIKE %s OR title ILIKE %s)
                        ORDER BY id DESC LIMIT 20""",
                    (f'%{imei}%', f'%{imei}%', f'%{imei}%')
                )
                items = [dict(r) for r in cur.fetchall()]
            # Если по IMEI ничего — ищем по названию (нечётко: разбиваем на слова)
            if not items and q:
                words = [w for w in q.split() if len(w) >= 2][:5]
                if words:
                    where_parts = ['status=%s']
                    params: list = ['active']
                    for w in words:
                        where_parts.append('title ILIKE %s')
                        params.append(f'%{w}%')
                    sql = (
                        f"SELECT id, avito_id, title, price, url, main_photo "
                        f"FROM {SCHEMA}.avito_products "
                        f"WHERE {' AND '.join(where_parts)} "
                        f"ORDER BY id DESC LIMIT 20"
                    )
                    cur.execute(sql, params)
                    items = [dict(r) for r in cur.fetchall()]
            # Возвращаем id (avito_id используется в UI как идентификатор)
            out = []
            for it in items:
                out.append({
                    'id': it.get('avito_id'),
                    'title': it.get('title'),
                    'price': float(it['price']) if it.get('price') is not None else None,
                    'url': it.get('url'),
                    'main_photo': it.get('main_photo'),
                })
            return _resp(200, {'ok': True, 'items': out})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})
        finally:
            cur.close(); conn.close()

    if action == 'archive_product':
        # Снять Авито-товар с публикации (status='archived', is_visible=FALSE)
        try:
            body = json.loads(event.get('body') or '{}')
        except Exception:
            body = {}
        avito_id = body.get('avito_id') or qs.get('avito_id')
        if not avito_id:
            return _resp(400, {'ok': False, 'error': 'avito_id required'})
        try:
            avito_id = int(avito_id)
        except Exception:
            return _resp(400, {'ok': False, 'error': 'avito_id must be int'})
        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        try:
            cur.execute(
                f"UPDATE {SCHEMA}.avito_products "
                f"SET status='archived', is_visible=FALSE, updated_at=NOW() "
                f"WHERE avito_id=%s",
                (avito_id,)
            )
            conn.commit()
            return _resp(200, {'ok': True, 'avito_id': avito_id})
        except Exception as e:
            conn.rollback()
            return _resp(500, {'ok': False, 'error': str(e)})
        finally:
            cur.close(); conn.close()

    if action == 'probe':
        return _resp(410, {'ok': False, 'error': 'deprecated'})

    if action == 'auto':
        try:
            mins = int(qs.get('min') or 30)
        except Exception:
            mins = 30
        try:
            return _resp(200, auto_sync_if_stale(mins))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'dashboard':
        try:
            return _resp(200, {'ok': True, **get_dashboard()})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'sync_stats':
        try:
            return _resp(200, sync_stats())
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    # Чат Авито
    if action == 'sync_chats':
        try:
            return _resp(200, sync_chats())
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'chats_list':
        try:
            unread_only = qs.get('unread') == '1'
            return _resp(200, {'ok': True, **get_chats_list(unread_only=unread_only, limit=100)})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'chat_messages':
        try:
            cid = qs.get('chat_id') or ''
            if not cid:
                return _resp(400, {'ok': False, 'error': 'chat_id обязателен'})
            refresh = qs.get('refresh') != '0'
            return _resp(200, {'ok': True, **get_chat_messages(cid, refresh=refresh)})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'send_message':
        try:
            raw = event.get('body') or '{}'
            body = json.loads(raw)
            cid = body.get('chat_id') or ''
            text = body.get('text') or ''
            if not cid or not text:
                return _resp(400, {'ok': False, 'error': 'chat_id и text обязательны'})
            return _resp(200, send_message_action(cid, text))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    # Автопродвижение
    if action == 'schedules':
        try:
            return _resp(200, {'ok': True, 'items': list_schedules()})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'schedule_save':
        try:
            raw = event.get('body') or '{}'
            body = json.loads(raw)
            return _resp(200, save_schedule(body))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'schedule_delete':
        try:
            sid = int(qs.get('id') or 0)
            if not sid:
                return _resp(400, {'ok': False, 'error': 'id обязателен'})
            return _resp(200, delete_schedule(sid))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'schedule_run':
        try:
            sid = int(qs.get('id') or 0)
            if not sid:
                return _resp(400, {'ok': False, 'error': 'id обязателен'})
            return _resp(200, run_schedule(sid))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'bump_now':
        try:
            raw = event.get('body') or '{}'
            body = json.loads(raw)
            ids = body.get('item_ids') or []
            vas_type = body.get('vas_type') or 'xl'
            return _resp(200, bump_items([int(x) for x in ids], vas_type))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    # Autoload
    if action == 'autoload_status':
        try:
            return _resp(200, {'ok': True, **get_autoload_status()})
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'autoload_save':
        try:
            raw = event.get('body') or '{}'
            body = json.loads(raw)
            return _resp(200, update_autoload_config(body))
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'autoload_regenerate':
        try:
            return _resp(200, regenerate_autoload())
        except Exception as e:
            return _resp(500, {'ok': False, 'error': str(e)})

    if action == 'autoload_xml':
        try:
            xml = build_autoload_xml()
            return {
                'statusCode': 200,
                'headers': {**CORS_HEADERS, 'Content-Type': 'application/xml; charset=utf-8'},
                'isBase64Encoded': False,
                'body': xml,
            }
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