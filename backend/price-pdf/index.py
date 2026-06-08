"""
Генерация PDF прайса Скупка24.
GET / → PDF-файл (application/pdf) с актуальными ценами и наценкой 2000 ₽.
POST / { markup: 0 } → PDF с кастомной наценкой (только для admin_token).
"""
import json, os, io, urllib.request, base64
from datetime import datetime, timezone, timedelta

import psycopg2
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, KeepTogether,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

SCHEMA         = "t_p31606708_tech_buying_service"
SMARTBERY_URL  = "https://smartbery-qrcode.ru/api/v1/products/"
DEFAULT_MARKUP = 2000
ADMIN_TOKEN    = "Mark2015N"

HEADERS_CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

CATEGORY_ORDER = [
    "iPhone", "MacBook", "iPad", "Apple Watch", "AirPods",
    "Смартфоны Samsung", "Смартфоны Xiaomi", "Смартфоны Honor",
    "Наушники", "Планшеты", "Умные часы", "Игровые консоли",
    "Аксессуары Apple", "Аксессуары", "Прочее",
]
CAT_EMOJI = {
    "iPhone": "📱", "MacBook": "💻", "iPad": "🖥",
    "Apple Watch": "⌚", "AirPods": "🎧",
    "Смартфоны Samsung": "📲", "Смартфоны Xiaomi": "📲", "Смартфоны Honor": "📲",
    "Наушники": "🎧", "Планшеты": "📋", "Умные часы": "⌚",
    "Игровые консоли": "🎮", "Аксессуары Apple": "🔌",
    "Аксессуары": "🔌", "Прочее": "📦",
}
# Цвета категорий (RGB 0-1)
CAT_COLORS_RGB = {
    "iPhone":            (0.376, 0.647, 0.980),   # #60a5fa
    "MacBook":           (0.655, 0.545, 0.980),   # #a78bfa
    "iPad":              (0.204, 0.827, 0.600),   # #34d399
    "Apple Watch":       (0.957, 0.443, 0.706),   # #f472b6
    "AirPods":           (0.984, 0.749, 0.141),   # #fbbf24
    "Смартфоны Samsung": (0.133, 0.827, 0.933),   # #22d3ee
    "Смартфоны Xiaomi":  (0.976, 0.451, 0.086),   # #f97316
}

CAT_MAP = {
    "Redmi": "Смартфоны Xiaomi", "Poco": "Смартфоны Xiaomi", "Xiaomi": "Смартфоны Xiaomi",
    "Samsung": "Смартфоны Samsung", "Galaxy": "Смартфоны Samsung",
    "Honor": "Смартфоны Honor",
    "iPad": "iPad", "MacBook": "MacBook",
    "AirPods": "AirPods", "Earpods": "Наушники", "EarPods": "Наушники",
    "Watch": "Apple Watch", "Pencil": "Аксессуары Apple",
    "PS5": "Игровые консоли", "JBL": "Наушники", "Tab": "Планшеты",
    "SE2": "iPhone", "SE3": "iPhone", "16e": "iPhone", "17e": "iPhone", "Air": "iPhone",
}

def detect_category(name: str) -> str:
    first = name.strip().split()[0] if name.strip() else ""
    if first in CAT_MAP:
        return CAT_MAP[first]
    if first.isdigit() and len(first) <= 2:
        return "iPhone"
    return "Прочее"

def _sku_key(name: str) -> str:
    return name.strip().lower().replace(" ", "_")

def fetch_products() -> list:
    token = os.environ.get("SMARTBERY_TOKEN", "")
    req = urllib.request.Request(
        SMARTBERY_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read())
    return [p for p in data if p.get("availability")]

def load_cdn_photos() -> dict:
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur  = conn.cursor()
        cur.execute(
            f"SELECT sku, photo_url FROM {SCHEMA}.catalog "
            f"WHERE sku LIKE 'smartbery_%' AND photo_url LIKE 'https://cdn.poehali.dev/%'"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return { row[0].replace("smartbery_", ""): row[1] for row in rows if row[1] }
    except Exception as e:
        print(f"[price-pdf][photos] {e}")
        return {}

def group_products(products: list, markup: int, cdn_photos: dict) -> dict:
    groups: dict = {}
    for p in products:
        raw_name  = (p.get("name") or "").strip()
        raw_price = p.get("price")
        region    = p.get("country") or ""
        category  = detect_category(raw_name)
        photo     = cdn_photos.get(_sku_key(raw_name))

        price_str = "—"
        if raw_price is not None:
            final = int(raw_price) + markup
            price_str = f"{final:,}".replace(",", "\u00a0") + " \u20bd"

        groups.setdefault(category, []).append({
            "name":    raw_name,
            "price":   price_str,
            "has_price": raw_price is not None,
            "region":  region,
            "photo":   photo,
        })

    ordered = {}
    for cat in CATEGORY_ORDER:
        if cat in groups:
            ordered[cat] = groups[cat]
    for cat in groups:
        if cat not in ordered:
            ordered[cat] = groups[cat]
    return ordered


def register_fonts():
    """Регистрируем встроенные шрифты с поддержкой кириллицы."""
    try:
        from reportlab.pdfbase.cidfonts import UnicodeCIDFont
        pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))
    except Exception:
        pass


def build_pdf(groups: dict, total: int, generated_at: str) -> bytes:
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=12*mm, rightMargin=12*mm,
        topMargin=14*mm, bottomMargin=14*mm,
        title=f"Прайс Скупка24 — {generated_at}",
        author="Скупка24",
    )

    # Цвета
    GOLD     = colors.HexColor("#FFD700")
    DARK_BG  = colors.HexColor("#111111")
    DARK2    = colors.HexColor("#1a1a1a")
    WHITE    = colors.white
    GRAY     = colors.HexColor("#888888")
    ROW_ODD  = colors.HexColor("#f9f9f9")
    ROW_EVEN = colors.white
    PRICE_C  = colors.HexColor("#92400e")
    DASH_C   = colors.HexColor("#cccccc")
    REGION_EU = colors.HexColor("#166534")
    REGION_US = colors.HexColor("#1e40af")

    styles = getSampleStyleSheet()

    # Базовый стиль — Helvetica (встроен в PDF, кириллица через latin subset)
    # Для кириллицы используем встроенный Helvetica + encode
    def S(name: str, **kw) -> ParagraphStyle:
        base = ParagraphStyle(name, **kw)
        return base

    style_title = S("title",
        fontName="Helvetica-Bold", fontSize=18, textColor=WHITE,
        spaceAfter=2, leading=22)
    style_sub = S("sub",
        fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#aaaaaa"),
        spaceAfter=0)
    style_cat = S("cat",
        fontName="Helvetica-Bold", fontSize=10, textColor=WHITE,
        leading=13)
    style_item = S("item",
        fontName="Helvetica-Bold", fontSize=9.5, textColor=colors.HexColor("#111111"),
        leading=12)
    style_price = S("price",
        fontName="Helvetica-Bold", fontSize=10, textColor=PRICE_C,
        alignment=TA_RIGHT, leading=12)
    style_dash = S("dash",
        fontName="Helvetica", fontSize=9, textColor=DASH_C,
        alignment=TA_RIGHT, leading=12)
    style_region = S("region",
        fontName="Helvetica-Bold", fontSize=7, textColor=REGION_EU, leading=10)
    style_footer = S("footer",
        fontName="Helvetica", fontSize=8, textColor=GRAY,
        alignment=TA_CENTER, leading=11)
    style_cta_main = S("cta_main",
        fontName="Helvetica-Bold", fontSize=13, textColor=WHITE,
        alignment=TA_CENTER, leading=16)
    style_cta_sub = S("cta_sub",
        fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#aaaaaa"),
        alignment=TA_CENTER, leading=12)
    style_cta_phone = S("cta_phone",
        fontName="Helvetica-Bold", fontSize=15, textColor=GOLD,
        alignment=TA_CENTER, leading=18)

    story = []

    # ── ШАПКА ────────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("СКУПКА24 — ПРАЙС-ЛИСТ", style_title),
        Table([
            [Paragraph("skypka24.com", S("h_right", fontName="Helvetica-Bold", fontSize=10, textColor=GOLD, alignment=TA_RIGHT))],
            [Paragraph("г. Калуга, Кирова 7/47 и 11", S("h_r2", fontName="Helvetica", fontSize=8, textColor=GRAY, alignment=TA_RIGHT))],
            [Paragraph(f"+7 (992) 990-33-33", S("h_phone", fontName="Helvetica-Bold", fontSize=11, textColor=GOLD, alignment=TA_RIGHT))],
        ], colWidths=[70*mm], style=TableStyle([("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),1)])),
    ]]
    header_tbl = Table(header_data, colWidths=[doc.width - 80*mm, 80*mm])
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), DARK_BG),
        ("TOPPADDING",    (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
        ("LEFTPADDING",   (0,0), (-1,-1), 14),
        ("RIGHTPADDING",  (0,0), (-1,-1), 14),
        ("ROUNDEDCORNERS", (0,0), (-1,-1), [6,6,6,6]),
        ("LINEBELOW",     (0,0), (-1,0),  2, GOLD),
    ]))

    sub_data = [[
        Paragraph(f"{total} позиций в наличии", S("sub2", fontName="Helvetica", fontSize=8, textColor=GRAY)),
        Paragraph(f"Обновлено: {generated_at}", S("sub3", fontName="Helvetica", fontSize=8, textColor=GRAY, alignment=TA_RIGHT)),
    ]]
    sub_tbl = Table(sub_data, colWidths=[doc.width/2, doc.width/2])
    sub_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), DARK2),
        ("TOPPADDING", (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("LEFTPADDING", (0,0),(-1,-1), 14),
        ("RIGHTPADDING",(0,0),(-1,-1), 14),
    ]))

    story.append(header_tbl)
    story.append(sub_tbl)
    story.append(Spacer(1, 6*mm))

    # ── КАТЕГОРИИ ─────────────────────────────────────────────────────────────────
    page_w = doc.width
    col_photo = 12*mm
    col_price = 24*mm
    col_name  = page_w - col_photo - col_price

    for cat, items in groups.items():
        cat_rgb = CAT_COLORS_RGB.get(cat, (1.0, 0.843, 0.0))
        cat_color = colors.Color(*cat_rgb)
        emoji = CAT_EMOJI.get(cat, "")

        # Заголовок категории
        cat_label = f"{emoji}  {cat.upper()}  ({len(items)} шт.)"
        cat_row = [[
            Paragraph(cat_label, S(f"cat_{cat}",
                fontName="Helvetica-Bold", fontSize=9.5, textColor=cat_color, leading=12)),
            "", "",
        ]]
        cat_tbl = Table(cat_row, colWidths=[col_photo + col_name, col_price, 0])
        cat_tbl.setStyle(TableStyle([
            ("SPAN",            (0,0),(1,0)),
            ("BACKGROUND",      (0,0),(-1,-1), colors.Color(cat_rgb[0]*0.12, cat_rgb[1]*0.12, cat_rgb[2]*0.12)),
            ("LINEBEFORETRUE",  (0,0),(0,0),   3, cat_color),
            ("LEFTPADDING",     (0,0),(-1,-1), 8),
            ("RIGHTPADDING",    (0,0),(-1,-1), 8),
            ("TOPPADDING",      (0,0),(-1,-1), 6),
            ("BOTTOMPADDING",   (0,0),(-1,-1), 6),
        ]))

        rows_data = []
        for i, item in enumerate(items):
            bg = ROW_ODD if i % 2 == 0 else ROW_EVEN
            region_txt = ""
            if item["region"]:
                rc = REGION_EU if item["region"] == "EU" else REGION_US
                region_txt = f' <font color="#{"%02x%02x%02x" % (int(rc.red*255), int(rc.green*255), int(rc.blue*255))}" size="7">[{item["region"]}]</font>'

            name_para = Paragraph(
                f'{item["name"]}{region_txt}',
                S(f"n{i}", fontName="Helvetica-Bold", fontSize=9, textColor=colors.HexColor("#111111"), leading=11)
            )

            if item["has_price"]:
                price_para = Paragraph(item["price"], S(f"p{i}", fontName="Helvetica-Bold", fontSize=9.5, textColor=PRICE_C, alignment=TA_RIGHT, leading=11))
            else:
                price_para = Paragraph("—", S(f"p{i}d", fontName="Helvetica", fontSize=9, textColor=DASH_C, alignment=TA_RIGHT, leading=11))

            rows_data.append(["", name_para, price_para])

        rows_tbl = Table(rows_data, colWidths=[col_photo, col_name, col_price])
        ts = [
            ("LEFTPADDING",   (0,0),(-1,-1), 4),
            ("RIGHTPADDING",  (0,0),(-1,-1), 6),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LINEBELOW",     (0,0),(-1,-1), 0.3, colors.HexColor("#e5e7eb")),
        ]
        for i in range(len(rows_data)):
            bg = ROW_ODD if i % 2 == 0 else ROW_EVEN
            ts.append(("BACKGROUND", (0,i), (-1,i), bg))
        rows_tbl.setStyle(TableStyle(ts))

        block = KeepTogether([cat_tbl, rows_tbl, Spacer(1, 4*mm)])
        story.append(block)

    # ── CTA ───────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    cta_data = [[
        Paragraph("НЕ НАШЛИ НУЖНУЮ МОДЕЛЬ?", style_cta_main),
        Paragraph("Позвоните — найдём под заказ за 1–3 дня. Скупаем и продаём 24/7.", style_cta_sub),
        Paragraph("+7 (992) 990-33-33", style_cta_phone),
    ]]
    cta_tbl = Table([[c] for c in cta_data[0]], colWidths=[doc.width])
    cta_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), DARK_BG),
        ("LEFTPADDING",   (0,0), (-1,-1), 16),
        ("RIGHTPADDING",  (0,0), (-1,-1), 16),
        ("TOPPADDING",    (0,0), (0,0),   10),
        ("TOPPADDING",    (0,1), (0,1),   4),
        ("TOPPADDING",    (0,2), (0,2),   4),
        ("BOTTOMPADDING", (0,2), (0,2),   12),
        ("LINEABOVE",     (0,0), (-1,0),  2, GOLD),
    ]))
    story.append(cta_tbl)

    # ── ПОДВАЛ ────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e5e7eb")))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        f"skypka24.com  ·  г. Калуга, ул. Кирова 7/47 и ул. Кирова 11  ·  +7 (992) 990-33-33  ·  © {datetime.now().year} Скупка24",
        style_footer
    ))

    doc.build(story)
    return buf.getvalue()


def handler(event: dict, context) -> dict:
    """Генерация PDF прайса Скупка24. GET / → скачать PDF."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS_CORS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    # Наценка — публично всегда 2000, с токеном — любая
    admin_token = (event.get("headers") or {}).get("x-admin-token", "") or body.get("admin_token", "")
    is_admin    = admin_token == ADMIN_TOKEN
    markup      = int(body.get("markup", qs.get("markup", DEFAULT_MARKUP)))
    if not is_admin:
        markup = DEFAULT_MARKUP

    products   = fetch_products()
    cdn_photos = load_cdn_photos()
    groups     = group_products(products, markup, cdn_photos)
    total      = sum(len(v) for v in groups.values())

    msk_now    = datetime.now(timezone(timedelta(hours=3)))
    gen_at     = msk_now.strftime("%d.%m.%Y %H:%M МСК")

    pdf_bytes  = build_pdf(groups, total, gen_at)
    pdf_b64    = base64.b64encode(pdf_bytes).decode()

    filename   = f"price-skypka24-{msk_now.strftime('%d%m%Y')}.pdf"

    return {
        "statusCode": 200,
        "headers": {
            **HEADERS_CORS,
            "Content-Type":        "application/pdf",
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control":       "public, max-age=10800",
        },
        "body":            pdf_b64,
        "isBase64Encoded": True,
    }
