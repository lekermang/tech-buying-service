import io
import os
import json
from datetime import datetime, timedelta, timezone

import requests

SCHEMA = 't_p31606708_tech_buying_service'
MSK = timezone(timedelta(hours=3))
MAX_BOT_URL = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'

BIG = 200.0
SWING = 150.0
BASE_MAX_AGE_H = 12


def _get(cur, key, default=None):
    cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key=%s", (key,))
    r = cur.fetchone()
    return r[0] if r and r[0] not in (None, '') else default


def _set(cur, key, value):
    cur.execute(
        f"INSERT INTO {SCHEMA}.settings (key, value) VALUES (%s, %s) "
        f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
        (key, str(value))
    )


def classify(delta: float):
    a = abs(delta)
    if a >= BIG:
        return ('drop', '📉', 'Цена золота 999 упала') if delta < 0 else ('rise', '📈', 'Цена золота 999 выросла')
    if a >= SWING:
        return 'swing', '⚡', 'Сильные колебания цены золота 999'
    return None


def recipients(cur):
    out = []
    main = os.environ.get('TELEGRAM_CHAT_ID', '')
    if main:
        out.append(main)
    try:
        cur.execute(f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active = true")
        for (cid,) in cur.fetchall():
            if cid and str(cid) not in out:
                out.append(str(cid))
    except Exception:
        pass
    px = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    if px and px not in out:
        out.append(px)
    return out


def load_points(cur, hours=48):
    cur.execute(
        f"SELECT recorded_at, price_rub FROM {SCHEMA}.gold_price_history "
        f"WHERE recorded_at > NOW() - INTERVAL '{int(hours)} hours' AND price_rub > 1000 ORDER BY recorded_at ASC"
    )
    return [(r[0].astimezone(MSK), float(r[1])) for r in cur.fetchall()]


def render_chart(points, current, baseline, kind):
    from PIL import Image, ImageDraw, ImageFont
    from fontdata import font_bytes
    _b, _r = font_bytes(True), font_bytes(False)
    fb = lambda sz: ImageFont.truetype(io.BytesIO(_b), sz)
    fr = lambda sz: ImageFont.truetype(io.BytesIO(_r), sz)

    pts = list(points)
    now = datetime.now(MSK)
    pts.append((now, current))
    if len(pts) > 140:
        step = len(pts) / 140.0
        pts = [pts[int(i * step)] for i in range(139)] + [pts[-1]]
    ys = [p[1] for p in pts]
    up = current >= baseline
    col = (251, 191, 36) if kind == 'swing' else ((52, 211, 153) if up else (248, 113, 113))

    S = 2
    W, H = 800 * S, 420 * S
    L, R, T, B = 70 * S, 24 * S, 64 * S, 44 * S
    img = Image.new('RGB', (W, H), (11, 11, 11))
    d = ImageDraw.Draw(img, 'RGBA')
    d.rounded_rectangle([L - 10 * S, T - 10 * S, W - R + 6 * S, H - B + 6 * S], radius=12 * S, fill=(17, 17, 17))

    lo = min(ys + [baseline]); hi = max(ys + [baseline])
    span = (hi - lo) or 1
    ymin, ymax = lo - span * 0.15, hi + span * 0.2
    X = lambda i: L + (W - L - R) * i / max(1, len(pts) - 1)
    Y = lambda v: T + (H - T - B) * (1 - (v - ymin) / (ymax - ymin))

    for k in range(5):
        v = ymax - (ymax - ymin) * k / 4
        y = Y(v)
        d.line([(L, y), (W - R, y)], fill=(255, 255, 255, 22), width=S)
        d.text((L - 8 * S, y), f'{v:,.0f}'.replace(',', ' '), font=fr(11 * S), fill=(136, 136, 136), anchor='rm')

    xy = [(X(i), Y(p[1])) for i, p in enumerate(pts)]
    poly = xy + [(xy[-1][0], H - B), (xy[0][0], H - B)]
    d.polygon(poly, fill=col + (38,))

    by = Y(baseline)
    x = L
    while x < W - R:
        d.line([(x, by), (min(x + 8 * S, W - R), by)], fill=(255, 215, 0, 190), width=S)
        x += 14 * S
    d.text((L + 6 * S, by - 4 * S), f'было {baseline:,.0f}'.replace(',', ' '), font=fr(11 * S), fill=(255, 215, 0), anchor='ls')

    d.line(xy, fill=col, width=int(3 * S), joint='curve')
    for r_, a in ((14, 40), (9, 80)):
        cx, cy = xy[-1]
        d.ellipse([cx - r_ * S, cy - r_ * S, cx + r_ * S, cy + r_ * S], fill=col + (a,))
    cx, cy = xy[-1]
    d.ellipse([cx - 6 * S, cy - 6 * S, cx + 6 * S, cy + 6 * S], fill=col, outline=(0, 0, 0), width=2 * S)
    d.text((cx - 12 * S, cy - 14 * S), f'{current:,.0f} ₽'.replace(',', ' '), font=fb(15 * S), fill=(255, 255, 255), anchor='rs')

    n = len(pts)
    for i in sorted(set([0, n // 4, n // 2, (3 * n) // 4, n - 1])):
        t = pts[i][0]
        a = 'lm' if i == 0 else ('rm' if i == n - 1 else 'mm')
        d.text((X(i), H - B + 20 * S), t.strftime('%d.%m %H:%M'), font=fr(11 * S), fill=(136, 136, 136), anchor=a)

    diff = current - baseline
    sign = '+' if diff >= 0 else '−'
    d.text((L - 10 * S, 30 * S), 'Золото 999', font=fb(22 * S), fill=(255, 255, 255), anchor='lm')
    d.text((W - R, 30 * S), f'{sign}{abs(diff):,.0f} ₽/г'.replace(',', ' '), font=fb(22 * S), fill=col, anchor='rm')

    img = img.resize((W // S, H // S), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=False)
    return buf.getvalue()


def build_text(emoji, title, current, baseline, usd_rub, xau_usd, test=False):
    d = current - baseline
    pct = d / baseline * 100 if baseline else 0
    sign = '+' if d >= 0 else '−'
    lines = []
    if test:
        lines.append('🧪 ТЕСТОВОЕ УВЕДОМЛЕНИЕ')
    lines.append(f'{emoji} {title}')
    lines.append('')
    lines.append(f'Сейчас: {current:,.0f} ₽/г'.replace(',', ' '))
    lines.append(f'Было: {baseline:,.0f} ₽/г'.replace(',', ' '))
    lines.append(f'Изменение: {sign}{abs(d):,.0f} ₽ ({sign}{abs(pct):.1f}%)'.replace(',', ' '))
    if usd_rub and xau_usd:
        lines.append(f'Биржа: ${xau_usd:,.0f}/oz · USD {usd_rub:.2f} ₽'.replace(',', ' '))
    lines.append('')
    if d < 0:
        lines.append('Проверьте цены в оценке и скупке: возможно, стоит снизить закупочную цену.')
    else:
        lines.append('Проверьте цены в оценке и скупке: можно пересмотреть закупочную цену.')
    return '\n'.join(lines)


def upload_png(png):
    try:
        import boto3, secrets
        from botocore.client import Config
        key = f'gold-alerts/{secrets.token_hex(6)}.png'
        s3 = boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
                          aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                          aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
                          config=Config(signature_version='s3v4', connect_timeout=3, read_timeout=3, retries={'max_attempts': 1}))
        s3.put_object(Bucket='files', Key=key, Body=png, ContentType='image/png')
        return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception as e:
        print(f'[gold-alert] upload error: {e}')
        return None


def send_all(cur, text, photo_png, only_main=False, with_max=True):
    from concurrent.futures import ThreadPoolExecutor
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    targets = []
    if token:
        targets = [os.environ.get('TELEGRAM_CHAT_ID', '')] if only_main else recipients(cur)
        targets = [t for t in targets if t]

    def one(cid):
        try:
            if photo_png:
                r = requests.post(
                    f'https://api.telegram.org/bot{token}/sendPhoto',
                    data={'chat_id': cid, 'caption': text[:1000]},
                    files={'photo': ('gold.png', photo_png, 'image/png')}, timeout=2)
            else:
                r = requests.post(
                    f'https://api.telegram.org/bot{token}/sendMessage',
                    json={'chat_id': cid, 'text': text}, timeout=2)
            return (cid, r.status_code == 200, '' if r.status_code == 200 else str(r.status_code))
        except Exception as e:
            return (cid, False, type(e).__name__)

    def to_max():
        if not with_max:
            return {'ok': False, 'reason': 'skip'}
        try:
            url = upload_png(photo_png) if photo_png else None
            body = {'text': text}
            if url:
                body['photo_urls'] = [url]
            r = requests.post(f'{MAX_BOT_URL}?action=staff_send', json=body, timeout=3.5)
            d = r.json() if r.status_code == 200 else {}
            return {'ok': bool(d.get('delivered')), 'targets': d.get('targets'), 'photo': bool(url)}
        except Exception as e:
            return {'ok': False, 'reason': type(e).__name__}

    sent, errors = 0, []
    with ThreadPoolExecutor(max_workers=8) as ex:
        fm = ex.submit(to_max)
        futs = [ex.submit(one, c) for c in targets]
        for f in futs:
            cid, ok, err = f.result()
            if ok:
                sent += 1
            else:
                errors.append(f'{cid}: {err}')
        max_res = fm.result()
    return {'telegram_sent': sent, 'max': max_res, 'errors': errors}


def check_and_alert(cur, conn, current, usd_rub=None, xau_usd=None):
    """Сравнивает цену с опорной. При изменении от 150 ₽ шлёт уведомление и сдвигает опорную."""
    if _get(cur, 'goldalert_enabled', '1') == '0':
        return {'status': 'disabled'}
    now = datetime.now(MSK)
    try:
        base = float(_get(cur, 'goldalert_base_price', 0) or 0)
        base_at = datetime.fromisoformat(_get(cur, 'goldalert_base_at', '')) if _get(cur, 'goldalert_base_at') else None
    except Exception:
        base, base_at = 0.0, None
    if base <= 0 or base_at is None:
        _set(cur, 'goldalert_base_price', round(current, 2))
        _set(cur, 'goldalert_base_at', now.isoformat())
        conn.commit()
        return {'status': 'baseline_set', 'price': current}

    delta = current - base
    cls = classify(delta)
    if not cls:
        if (now - base_at) > timedelta(hours=BASE_MAX_AGE_H):
            _set(cur, 'goldalert_base_price', round(current, 2))
            _set(cur, 'goldalert_base_at', now.isoformat())
            conn.commit()
            return {'status': 'baseline_rolled', 'delta': round(delta, 2)}
        return {'status': 'quiet', 'delta': round(delta, 2), 'baseline': base}

    kind, emoji, title = cls
    _set(cur, 'goldalert_base_price', round(current, 2))
    _set(cur, 'goldalert_base_at', now.isoformat())
    _set(cur, 'goldalert_last_at', now.isoformat())
    conn.commit()
    text = build_text(emoji, title, current, base, usd_rub, xau_usd)
    png = None
    try:
        png = render_chart(load_points(cur), current, base, kind)
    except Exception as e:
        print(f'[gold-alert] chart error: {e}')
    res = send_all(cur, text, png)
    return {'status': 'sent', 'kind': kind, 'delta': round(delta, 2), **res}


def send_test(cur, conn, current, usd_rub=None, xau_usd=None, kind='drop'):
    last = _get(cur, 'goldalert_test_at')
    now = datetime.now(MSK)
    if last:
        try:
            if (now - datetime.fromisoformat(last)).total_seconds() < 30:
                return {'status': 'throttled'}
        except Exception:
            pass
    _set(cur, 'goldalert_test_at', now.isoformat())
    conn.commit()
    shift = {'drop': -230.0, 'rise': 230.0, 'swing': -170.0}.get(kind, -230.0)
    base = current - shift
    k, emoji, title = classify(shift)
    text = build_text(emoji, title, current, base, usd_rub, xau_usd, test=True)
    png = render_chart(load_points(cur), current, base, k)
    res = send_all(cur, text, png, only_main=True)
    return {'status': 'test_sent', 'kind': k, **res}
