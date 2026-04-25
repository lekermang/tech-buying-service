"""
SEO для каталога запчастей (МойСклад + Excel-прайс «Moba»).

Возвращает:
  ?action=sitemap                — динамический sitemap.xml со всеми позициями
  ?slug=<slug-или-id>            — публичный HTML-лендинг конкретной позиции с микроразметкой Schema.org Product
  без параметров                 — JSON со списком (для отладки)

Идея SEO: поисковик находит товар по точному названию запчасти + города + бренда.
"""
import json
import os
import re
import html as html_lib
import psycopg2

SCHEMA = 't_p31606708_tech_buying_service'
SITE = 'https://skypka24.com'
BRAND = 'Скупка24'
CITY = 'Калуга'
PHONE = '+7 (992) 999-03-33'
ADDRESS = 'ул. Кирова, 11 и 7/47'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def _slugify(text: str, max_len: int = 60) -> str:
    """Транслит в URL-slug."""
    if not text:
        return ''
    table = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y',
        'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f',
        'х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    }
    s = text.lower()
    out = []
    for ch in s:
        if ch in table:
            out.append(table[ch])
        elif ('a' <= ch <= 'z') or ('0' <= ch <= '9'):
            out.append(ch)
        elif ch in ' -_/+()':
            out.append('-')
    slug = ''.join(out)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug[:max_len] or 'part'


def _esc(s) -> str:
    if s is None:
        return ''
    return html_lib.escape(str(s), quote=True)


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _build_sitemap() -> str:
    """Динамический sitemap со всеми доступными запчастями + основные страницы сайта."""
    conn = _connect()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT id, name, updated_at FROM {SCHEMA}.repair_parts
        WHERE available = true AND name IS NOT NULL
        ORDER BY updated_at DESC
        LIMIT 5000
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()

    parts_xml = []
    for pid, name, updated_at in rows:
        slug = _slugify(name) + '-' + (pid or '')[:8]
        lastmod = updated_at.strftime('%Y-%m-%d') if updated_at else ''
        parts_xml.append(
            f'  <url>\n'
            f'    <loc>{SITE}/zapchasti/{slug}</loc>\n'
            f'    <lastmod>{lastmod}</lastmod>\n'
            f'    <changefreq>weekly</changefreq>\n'
            f'    <priority>0.6</priority>\n'
            f'  </url>'
        )

    static_pages = [
        ('/', '1.0', 'daily'),
        ('/catalog', '0.9', 'daily'),
        ('/zapchasti', '0.9', 'daily'),
        ('/tools', '0.7', 'weekly'),
        ('/repair-discount', '0.6', 'monthly'),
        ('/act', '0.4', 'yearly'),
    ]
    static_xml = []
    for path, prio, freq in static_pages:
        static_xml.append(
            f'  <url>\n'
            f'    <loc>{SITE}{path}</loc>\n'
            f'    <changefreq>{freq}</changefreq>\n'
            f'    <priority>{prio}</priority>\n'
            f'  </url>'
        )

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += '\n'.join(static_xml + parts_xml)
    xml += '\n</urlset>\n'
    return xml


def _build_part_html(pid_or_slug: str) -> tuple[str, int]:
    """HTML-лендинг для конкретной запчасти. Имя/slug → попадание по точному id или по part_id-suffix."""
    conn = _connect()
    cur = conn.cursor()

    # Пробуем точный id (md5 / uuid)
    cur.execute(f"""
        SELECT id, name, category, price, stock, quality, part_type, supplier_price, price_batch_id, updated_at
        FROM {SCHEMA}.repair_parts
        WHERE id = %s OR id LIKE %s
        LIMIT 1
    """, (pid_or_slug, pid_or_slug[-12:] + '%'))
    row = cur.fetchone()

    if not row:
        # fallback: ищем по фрагменту slug в имени
        last_segment = pid_or_slug.rsplit('-', 1)[-1]
        cur.execute(f"""
            SELECT id, name, category, price, stock, quality, part_type, supplier_price, price_batch_id, updated_at
            FROM {SCHEMA}.repair_parts
            WHERE id LIKE %s OR LOWER(name) LIKE %s
            LIMIT 1
        """, (f'{last_segment}%', f'%{pid_or_slug.replace("-", " ")[:30]}%'))
        row = cur.fetchone()

    cur.close(); conn.close()

    if not row:
        return _not_found_html(pid_or_slug), 404

    pid, name, category, price, stock, quality, part_type, supplier_price, price_batch_id, _ = row
    in_stock = price_batch_id is None  # МойСклад
    source_label = 'В наличии · ремонт за 20–60 мин' if in_stock else 'Под заказ · ремонт 1–2 ч'
    supplier_name = 'МойСклад' if in_stock else 'Прайс поставщика'
    avail_schema = 'InStock' if (in_stock and (stock or 0) > 0) else 'PreOrder'

    title = f'{name} — купить и ремонт в {CITY} | {BRAND}'
    description = (
        f'{name}. Цена {int(price or 0):,} ₽. {source_label}. '
        f'{BRAND} в {CITY}: {ADDRESS}, тел. {PHONE}. Гарантия, официальный договор.'
    ).replace(',', ' ')

    keywords = ', '.join(filter(None, [
        name, category or '', f'купить {name} {CITY}', f'ремонт {name}',
        'оригинал', quality or '', 'запчасти для телефонов', f'сервис {CITY}',
    ]))

    json_ld = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": name,
        "category": category or 'Запчасти для телефонов',
        "brand": {"@type": "Brand", "name": "Скупка24"},
        "offers": {
            "@type": "Offer",
            "url": f"{SITE}/zapchasti/{pid_or_slug}",
            "priceCurrency": "RUB",
            "price": str(int(price or 0)),
            "availability": f"https://schema.org/{avail_schema}",
            "seller": {"@type": "LocalBusiness", "name": BRAND, "address": f'{CITY}, {ADDRESS}', "telephone": PHONE},
            "itemCondition": "https://schema.org/NewCondition",
        },
        "additionalProperty": [
            {"@type": "PropertyValue", "name": "Качество", "value": quality or '—'},
            {"@type": "PropertyValue", "name": "Поставщик", "value": supplier_name},
            {"@type": "PropertyValue", "name": "Срок ремонта", "value": '20–60 минут' if in_stock else '1–2 часа'},
        ],
    }

    breadcrumb_ld = {
        "@context": "https://schema.org/",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": SITE},
            {"@type": "ListItem", "position": 2, "name": "Запчасти", "item": f"{SITE}/zapchasti"},
            {"@type": "ListItem", "position": 3, "name": _esc(name), "item": f"{SITE}/zapchasti/{pid_or_slug}"},
        ],
    }

    organization_ld = {
        "@context": "https://schema.org/",
        "@type": "LocalBusiness",
        "name": BRAND,
        "image": f"{SITE}/og-image.jpg",
        "telephone": PHONE,
        "address": {"@type": "PostalAddress", "streetAddress": ADDRESS, "addressLocality": CITY, "addressCountry": "RU"},
        "openingHours": "Mo-Su 00:00-24:00",
    }

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>{_esc(title)}</title>
<meta name="description" content="{_esc(description)}">
<meta name="keywords" content="{_esc(keywords)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{SITE}/zapchasti/{_esc(pid_or_slug)}">

<!-- Open Graph -->
<meta property="og:type" content="product">
<meta property="og:title" content="{_esc(title)}">
<meta property="og:description" content="{_esc(description)}">
<meta property="og:url" content="{SITE}/zapchasti/{_esc(pid_or_slug)}">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="ru_RU">
<meta property="product:price:amount" content="{int(price or 0)}">
<meta property="product:price:currency" content="RUB">
<meta property="product:availability" content="{'in stock' if in_stock else 'preorder'}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{_esc(title)}">
<meta name="twitter:description" content="{_esc(description)}">

<!-- Yandex / Google -->
<meta name="yandex-verification" content="">
<meta name="geo.region" content="RU-KLU">
<meta name="geo.placename" content="{CITY}">

<!-- JSON-LD Schema.org Product -->
<script type="application/ld+json">{json.dumps(json_ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(breadcrumb_ld, ensure_ascii=False)}</script>
<script type="application/ld+json">{json.dumps(organization_ld, ensure_ascii=False)}</script>

<style>
*{{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,Roboto,sans-serif}}
body{{background:#0d0d0d;color:#fff;line-height:1.5}}
.wrap{{max-width:920px;margin:0 auto;padding:32px 20px}}
header{{display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid rgba(255,215,0,0.2)}}
header strong{{color:#ffd700;font-size:22px;letter-spacing:.05em}}
nav{{margin-top:8px;font-size:13px;color:rgba(255,255,255,.5)}}
nav a{{color:#ffd700;text-decoration:none}}
h1{{font-size:28px;line-height:1.2;margin:24px 0 12px;color:#fff}}
.tags{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}}
.tag{{padding:4px 10px;border-radius:4px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}}
.tag-stock{{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.4)}}
.tag-order{{background:rgba(255,215,0,.15);color:#ffd700;border:1px solid rgba(255,215,0,.4)}}
.tag-quality{{background:rgba(255,215,0,.1);color:#ffd700;border:1px solid rgba(255,215,0,.3)}}
.price{{font-size:42px;color:#ffd700;font-weight:700;margin:16px 0}}
.specs{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:24px 0;padding:18px;border:1px solid rgba(255,215,0,.2);border-radius:8px;background:#141414}}
.spec b{{display:block;font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}}
.cta{{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;background:linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%);color:#000;font-weight:700;text-transform:uppercase;border-radius:8px;text-decoration:none;letter-spacing:.04em;box-shadow:0 4px 16px rgba(255,215,0,.3);margin-right:12px}}
.cta-outline{{display:inline-flex;align-items:center;gap:10px;padding:14px 24px;border:1px solid rgba(255,215,0,.5);color:#ffd700;text-decoration:none;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}}
.section{{margin:28px 0}}
.section h2{{font-size:18px;color:#ffd700;margin-bottom:8px}}
.section p{{color:rgba(255,255,255,.7);margin-bottom:8px}}
ul{{list-style:none;padding-left:0}}
li{{padding:6px 0 6px 20px;color:rgba(255,255,255,.7);position:relative}}
li:before{{content:"✓";position:absolute;left:0;color:#ffd700}}
footer{{margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,215,0,.1);font-size:12px;color:rgba(255,255,255,.4)}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <strong>СКУПКА24</strong>
  <span style="color:rgba(255,255,255,.4);font-size:13px">· сервис ремонта в {CITY} · 24/7</span>
</header>
<nav>
  <a href="/">Главная</a> /
  <a href="/zapchasti">Запчасти</a> /
  <span>{_esc(name)}</span>
</nav>

<h1>{_esc(name)}</h1>

<div class="tags">
  <span class="tag {'tag-stock' if in_stock else 'tag-order'}">{_esc(source_label)}</span>
  <span class="tag tag-quality">Качество: {_esc(quality or '—')}</span>
  {'<span class="tag tag-quality">Категория: ' + _esc(category) + '</span>' if category else ''}
</div>

<div class="price">{int(price or 0):,} ₽</div>

<div>
  <a class="cta" href="/?model={_esc(name)[:60]}#repair">Заказать ремонт онлайн</a>
  <a class="cta-outline" href="tel:{PHONE.replace(' ', '').replace('(', '').replace(')', '')}">Позвонить · {PHONE}</a>
</div>

<div class="specs">
  <div class="spec"><b>Категория</b>{_esc(category or 'Запчасти для телефонов')}</div>
  <div class="spec"><b>Качество</b>{_esc(quality or 'Стандарт')}</div>
  <div class="spec"><b>Срок ремонта</b>{('20–60 минут') if in_stock else ('1–2 часа')}</div>
  <div class="spec"><b>Поставщик</b>{_esc(supplier_name)}</div>
  <div class="spec"><b>Гарантия</b>{('1 год' if quality == 'ORIG' else '6 мес.' if quality == 'AAA' else '3 мес.' if quality == 'AA' else '30 дней')}</div>
  <div class="spec"><b>Адреса</b>{CITY}, {ADDRESS}</div>
</div>

<div class="section">
  <h2>Где купить и установить</h2>
  <p>{BRAND} — официальный сервис в {CITY}. Адреса: <b>{ADDRESS}</b>. Работаем 24/7 без выходных. Профессиональные мастера, оригинальные комплектующие, бесплатная диагностика.</p>
</div>

<div class="section">
  <h2>Что входит в стоимость</h2>
  <ul>
    <li>Сама запчасть {_esc(name)}</li>
    <li>Работа мастера по установке</li>
    <li>Бесплатная диагностика устройства</li>
    <li>Гарантия с официальным актом-договором</li>
  </ul>
</div>

<div class="section">
  <h2>Преимущества Скупка24</h2>
  <ul>
    <li>Работаем с 2015 года · 50 000+ клиентов · 4.9 на Яндекс Картах</li>
    <li>Прозрачная цена — ничего сверху</li>
    <li>Два офиса в центре {CITY} · круглосуточно</li>
    <li>Гарантия по официальному договору</li>
  </ul>
</div>

<footer>
  © {BRAND} · {CITY} · {ADDRESS} · тел. {PHONE} ·
  <a href="{SITE}" style="color:#ffd700">{SITE}</a>
</footer>
</div>
</body>
</html>"""
    return html, 200


def _not_found_html(slug: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<title>Запчасть не найдена | {BRAND}</title>
<meta name="robots" content="noindex">
<style>body{{background:#0d0d0d;color:#fff;font-family:Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}}a{{color:#ffd700}}</style>
</head><body>
<div>
<h1 style="color:#ffd700">Запчасть не найдена</h1>
<p>Похоже, эта позиция больше не доступна. Посмотрите <a href="/zapchasti">весь каталог запчастей</a> или <a href="/">оставьте заявку на ремонт</a>.</p>
</div>
</body></html>"""


def handler(event: dict, context) -> dict:
    """SEO для каталога запчастей: sitemap.xml и публичные HTML-страницы товаров с микроразметкой."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    slug = params.get('slug', '').strip()

    if action == 'sitemap':
        xml = _build_sitemap()
        return {
            'statusCode': 200,
            'headers': {**CORS, 'Content-Type': 'application/xml; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600'},
            'body': xml,
        }

    if slug:
        html, code = _build_part_html(slug)
        return {
            'statusCode': code,
            'headers': {**CORS, 'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'public, max-age=600'},
            'body': html,
        }

    # Без параметров — JSON со списком (для отладки + индекс категорий)
    conn = _connect()
    cur = conn.cursor()
    cur.execute(f"""
        SELECT category, COUNT(*) FROM {SCHEMA}.repair_parts
        WHERE available = true GROUP BY category ORDER BY 2 DESC LIMIT 100
    """)
    cats = [{'category': r[0], 'count': r[1]} for r in cur.fetchall()]
    cur.close(); conn.close()

    return {
        'statusCode': 200,
        'headers': {**CORS, 'Content-Type': 'application/json; charset=utf-8'},
        'body': json.dumps({'ok': True, 'sitemap_url': f'{SITE}/sitemap.xml',
                            'usage': '?action=sitemap | ?slug=<id-or-slug>',
                            'categories': cats}, ensure_ascii=False),
    }
