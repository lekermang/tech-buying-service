"""
Генерация PDF прайса Скупка24.
GET /  →  PDF с наценкой 2000 руб. (скачать)
Кириллица через шрифт DejaVuSans (загружается из CDN при первом запуске).
SIM-тип определяется по имени модели.
"""
import json, os, io, urllib.request, base64, urllib.parse
from datetime import datetime, timezone, timedelta

import psycopg2
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable, KeepTogether,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

# ── Настройки ──────────────────────────────────────────────────────────────────
SCHEMA         = "t_p31606708_tech_buying_service"
SMARTBERY_URL  = "https://smartbery-qrcode.ru/api/v1/products/"
DEFAULT_MARKUP = 2000
ADMIN_TOKEN    = "Mark2015N"

# DejaVu Sans — открытый шрифт с полной кириллицей, ~750 КБ
FONT_URL_REGULAR = "https://cdn.jsdelivr.net/npm/@fontsource/dejavu-sans@5.0.5/files/dejavu-sans-cyrillic-400-normal.woff2"
FONT_URL_BOLD    = "https://cdn.jsdelivr.net/npm/@fontsource/dejavu-sans@5.0.5/files/dejavu-sans-cyrillic-700-normal.woff2"

# Альтернативный источник — Google Fonts / Noto Sans
NOTO_URL_REGULAR = "https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7du3mhPy0.woff2"
NOTO_URL_BOLD    = "https://fonts.gstatic.com/s/notosans/v36/o-0hIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6LMBiX1.woff2"

HEADERS_CORS = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
}

CATEGORY_ORDER = [
    "iPhone", "MacBook", "iPad", "Apple Watch", "AirPods",
    "Samsung", "Xiaomi", "Honor",
    "Наушники", "Планшеты", "Умные часы", "Игровые консоли",
    "Аксессуары Apple", "Аксессуары", "Прочее",
]

CAT_LABEL = {
    "iPhone": "iPhone",
    "MacBook": "MacBook",
    "iPad": "iPad",
    "Apple Watch": "Apple Watch",
    "AirPods": "AirPods",
    "Samsung": "Samsung",
    "Xiaomi": "Xiaomi",
    "Honor": "Honor",
    "Наушники": "Наушники",
    "Планшеты": "Планшеты",
    "Умные часы": "Умные часы",
    "Игровые консоли": "Игровые консоли",
    "Аксессуары Apple": "Аксессуары Apple",
    "Аксессуары": "Аксессуары",
    "Прочее": "Прочее",
}

# RGB (0–1) для цветной плашки категории
CAT_RGB = {
    "iPhone":     (0.376, 0.647, 0.980),
    "MacBook":    (0.655, 0.545, 0.980),
    "iPad":       (0.204, 0.827, 0.600),
    "Apple Watch":(0.957, 0.443, 0.706),
    "AirPods":    (0.984, 0.749, 0.141),
    "Samsung":    (0.133, 0.827, 0.933),
    "Xiaomi":     (0.976, 0.451, 0.086),
    "Honor":      (0.600, 0.800, 0.400),
}

CAT_MAP = {
    "Redmi": "Xiaomi", "Poco": "Xiaomi", "Xiaomi": "Xiaomi",
    "Samsung": "Samsung", "Galaxy": "Samsung",
    "Honor": "Honor",
    "iPad": "iPad", "MacBook": "MacBook",
    "AirPods": "AirPods", "Earpods": "Наушники", "EarPods": "Наушники",
    "Watch": "Apple Watch", "Pencil": "Аксессуары Apple",
    "PS5": "Игровые консоли", "JBL": "Наушники", "Tab": "Планшеты",
    "SE2": "iPhone", "SE3": "iPhone", "16e": "iPhone", "17e": "iPhone",
    "Air": "iPhone",
}

# ── SIM-определение по имени ───────────────────────────────────────────────────
# iPhone 15 и новее: nano-SIM + eSIM (в EU без физической SIM — только eSIM)
# Модели до iPhone 14 включительно: nano-SIM + eSIM
# Если в названии есть "Magsafe" — обычно eSIM only в EU
# Samsung/Xiaomi — обычно Dual SIM (nano+nano) или eSIM

def detect_sim(name: str, region: str) -> str:
    """Определяет тип SIM по названию и региону."""
    name_lower = name.lower()
    # iPhone
    if name_lower.startswith(("13", "14", "se2", "se3")):
        return "nano-SIM + eSIM"
    if name_lower.startswith(("15", "16", "17", "16e", "17e")):
        if region == "EU":
            return "eSIM"
        return "nano-SIM + eSIM"
    # MacBook — без SIM
    if "macbook" in name_lower:
        return ""
    # AirPods, Watch, аксессуары — без SIM
    if any(x in name_lower for x in ["airpod", "watch", "pencil", "кабель", "стекло", "чехол", "magsafe"]):
        return ""
    # Samsung/Xiaomi/Honor — обычно dual
    if any(x in name_lower for x in ["samsung", "galaxy", "redmi", "poco", "xiaomi", "honor"]):
        return "Dual SIM (nano)"
    # iPad — eSIM в EU, nano+eSIM остальные
    if "ipad" in name_lower:
        if region == "EU":
            return "eSIM"
        return "nano-SIM + eSIM"
    return ""


def detect_category(name: str) -> str:
    first = name.strip().split()[0] if name.strip() else ""
    if first in CAT_MAP:
        return CAT_MAP[first]
    if first.isdigit() and len(first) <= 2:
        return "iPhone"
    return "Прочее"


def _sku_key(name: str) -> str:
    return name.strip().lower().replace(" ", "_")


# ── Загрузка шрифта в /tmp ─────────────────────────────────────────────────────
def _download_font(url: str, path: str):
    """Скачивает woff2/ttf-шрифт и сохраняет в /tmp."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = r.read()
    with open(path, "wb") as f:
        f.write(data)


def setup_fonts():
    """
    Регистрирует русскоязычные шрифты.
    Используем встроенный в reportlab шрифт через CIDFont для кириллицы,
    либо скачиваем Noto Sans.
    """
    # Пробуем встроенный способ — UniCNS через toUnicode
    try:
        # Самый надёжный способ: скачать Noto Sans Regular/Bold в /tmp
        reg_path  = "/tmp/NotoSans-Regular.ttf"
        bold_path = "/tmp/NotoSans-Bold.ttf"

        if not os.path.exists(reg_path):
            _download_font(
                "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf",
                reg_path
            )
        if not os.path.exists(bold_path):
            _download_font(
                "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf",
                bold_path
            )

        pdfmetrics.registerFont(TTFont("NotoSans",     reg_path))
        pdfmetrics.registerFont(TTFont("NotoSans-Bold", bold_path))
        pdfmetrics.registerFontFamily("NotoSans",
            normal="NotoSans", bold="NotoSans-Bold",
            italic="NotoSans", boldItalic="NotoSans-Bold")
        return "NotoSans", "NotoSans-Bold"

    except Exception as e:
        print(f"[price-pdf][font] NotoSans failed: {e}, fallback to Helvetica")
        return "Helvetica", "Helvetica-Bold"


# ── Данные ────────────────────────────────────────────────────────────────────
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
        return {row[0].replace("smartbery_", ""): row[1] for row in rows if row[1]}
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

        price_str = ""
        has_price = raw_price is not None
        if has_price:
            final = int(raw_price) + markup
            # Форматируем: пробел как разделитель тысяч
            price_str = f"{final:,}".replace(",", " ") + " руб."

        sim_type = detect_sim(raw_name, region)

        groups.setdefault(category, []).append({
            "name":      raw_name,
            "price":     price_str,
            "has_price": has_price,
            "region":    region,
            "sim":       sim_type,
        })

    ordered = {}
    for cat in CATEGORY_ORDER:
        if cat in groups:
            ordered[cat] = groups[cat]
    for cat in groups:
        if cat not in ordered:
            ordered[cat] = groups[cat]
    return ordered


# ── PDF ───────────────────────────────────────────────────────────────────────
def build_pdf(groups: dict, total: int, generated_at: str, print_mode: bool = False) -> bytes:
    FONT_REG, FONT_BOLD = setup_fonts()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=10*mm, rightMargin=10*mm,
        topMargin=10*mm, bottomMargin=12*mm,
        title="Прайс Скупка24",
        author="Скупка24",
    )

    # ── Цвета ──────────────────────────────────────────────────────────────────
    WHITE     = colors.white
    LGRAY     = colors.HexColor("#eeeeee")

    if print_mode:
        # Версия для цветного принтера: белый фон, чёрный текст
        GOLD      = colors.HexColor("#B8860B")   # тёмное золото — видно на белом
        DARK_BG   = colors.HexColor("#1a1a1a")   # только шапка и CTA — тёмные
        DARK2     = colors.HexColor("#f5f5f5")   # строка под шапкой — светло-серая
        GRAY      = colors.HexColor("#555555")
        PRICE_CLR = colors.HexColor("#b91c1c")   # красный — яркий на белом
        SIM_CLR   = colors.HexColor("#1d4ed8")
        ESIM_CLR  = colors.HexColor("#15803d")
        DUAL_CLR  = colors.HexColor("#7e22ce")
        ROW_ODD   = colors.HexColor("#f9f9f9")
        ROW_EVEN  = WHITE
        NAME_CLR  = colors.HexColor("#111111")
        NUM_CLR   = colors.HexColor("#888888")
        SUB_TEXT  = colors.HexColor("#444444")
    else:
        GOLD      = colors.HexColor("#FFD700")
        DARK_BG   = colors.HexColor("#111111")
        DARK2     = colors.HexColor("#222222")
        GRAY      = colors.HexColor("#777777")
        PRICE_CLR = colors.HexColor("#7c2d12")
        SIM_CLR   = colors.HexColor("#1e40af")
        ESIM_CLR  = colors.HexColor("#065f46")
        DUAL_CLR  = colors.HexColor("#6b21a8")
        ROW_ODD   = colors.HexColor("#f7f7f7")
        ROW_EVEN  = WHITE
        NAME_CLR  = colors.HexColor("#111111")
        NUM_CLR   = colors.HexColor("#777777")
        SUB_TEXT  = GRAY

    def P(text: str, fn=None, fs=9, clr=None, align=None, leading=None) -> Paragraph:
        """Быстрый конструктор параграфа."""
        kw: dict = dict(
            fontName=fn or FONT_REG,
            fontSize=fs,
            textColor=clr or colors.black,
            leading=leading or (fs * 1.25),
        )
        if align == "R":
            kw["alignment"] = TA_RIGHT
        if align == "C":
            kw["alignment"] = TA_CENTER
        style = ParagraphStyle(f"s_{hash(text)}", **kw)
        return Paragraph(text, style)

    story = []
    W = doc.width

    # ── ШАПКА ──────────────────────────────────────────────────────────────────
    hdr = Table(
        [[
            P("СКУПКА24 — ПРАЙС-ЛИСТ", FONT_BOLD, 20, WHITE),
            Table([
                [P("skypka24.com",                  FONT_BOLD, 10, GOLD,  "R")],
                [P("г. Калуга, Кирова 7/47 и 11",   FONT_REG,   8, GRAY,  "R")],
                [P("+7 (992) 990-33-33",             FONT_BOLD, 12, GOLD,  "R")],
            ], colWidths=[68*mm], style=TableStyle([
                ("TOPPADDING",    (0,0),(-1,-1), 1),
                ("BOTTOMPADDING", (0,0),(-1,-1), 1),
                ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
            ])),
        ]],
        colWidths=[W - 72*mm, 72*mm],
    )
    hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
        ("TOPPADDING",    (0,0),(-1,-1), 10),
        ("BOTTOMPADDING", (0,0),(-1,-1), 10),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
        ("RIGHTPADDING",  (0,0),(-1,-1), 12),
        ("LINEBELOW",     (0,0),(-1,-1), 2.5, GOLD),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))

    sub = Table([[
        P(f"{total} позиций в наличии", FONT_REG, 8, SUB_TEXT),
        P(f"Обновлено: {generated_at}", FONT_REG, 8, SUB_TEXT, "R"),
    ]], colWidths=[W/2, W/2])
    sub.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK2),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
        ("RIGHTPADDING",  (0,0),(-1,-1), 12),
    ]))

    story += [hdr, sub, Spacer(1, 5*mm)]

    # ── Колонки ────────────────────────────────────────────────────────────────
    # №  Название  SIM  Регион  Цена
    COL_NUM    = 8*mm
    COL_PRICE  = 26*mm
    COL_REGION = 13*mm
    COL_SIM    = 30*mm
    COL_NAME   = W - COL_NUM - COL_PRICE - COL_REGION - COL_SIM

    # ── Категории ──────────────────────────────────────────────────────────────
    for cat, items in groups.items():
        cat_rgb   = CAT_RGB.get(cat, (0.4, 0.4, 0.4))
        cat_color = colors.Color(*cat_rgb)
        label     = CAT_LABEL.get(cat, cat).upper()
        dark_bg   = colors.Color(
            max(0, cat_rgb[0]*0.18),
            max(0, cat_rgb[1]*0.18),
            max(0, cat_rgb[2]*0.18),
        )

        # Заголовок категории
        cat_hdr = Table(
            [[P(f"  {label}  ({len(items)} шт.)", FONT_BOLD, 10, cat_color), "", "", "", ""]],
            colWidths=[COL_NUM + COL_NAME, COL_SIM, COL_REGION, COL_PRICE, 0],
        )
        cat_hdr.setStyle(TableStyle([
            ("SPAN",         (0,0),(4,0)),
            ("BACKGROUND",   (0,0),(-1,-1), dark_bg),
            ("TOPPADDING",   (0,0),(-1,-1), 6),
            ("BOTTOMPADDING",(0,0),(-1,-1), 6),
            ("LEFTPADDING",  (0,0),(-1,-1), 4),
            ("LINEABOVE",    (0,0),(-1,0),  2, cat_color),
            ("LINEBELOW",    (0,0),(-1,0),  0.5, cat_color),
        ]))

        # Строки товаров
        rows = []
        for i, item in enumerate(items):
            bg = ROW_ODD if i % 2 == 0 else ROW_EVEN

            # Регион
            if item["region"] == "EU":
                r_clr, r_bg = colors.HexColor("#166534"), colors.HexColor("#dcfce7")
            elif item["region"] == "US":
                r_clr, r_bg = colors.HexColor("#1e40af"), colors.HexColor("#dbeafe")
            elif item["region"] == "CN":
                r_clr, r_bg = colors.HexColor("#854d0e"), colors.HexColor("#fef9c3")
            else:
                r_clr, r_bg = GRAY, bg
            region_p = P(item["region"] or "", FONT_BOLD, 7, r_clr, "C") if item["region"] else P("", FONT_REG, 7, GRAY, "C")

            # SIM
            sim = item["sim"]
            is_esim_only = sim == "eSIM"
            if is_esim_only:
                s_clr = colors.HexColor("#c2410c")  # оранжево-красный — предупреждение
                sim_label = "eSIM only ⚠"
            elif "Dual" in sim:
                s_clr = DUAL_CLR
                sim_label = sim
            else:
                s_clr = SIM_CLR
                sim_label = sim
            sim_p = P(sim_label, FONT_BOLD if is_esim_only else FONT_REG, 7, s_clr, "C") if sim else P("", FONT_REG, 7, GRAY, "C")

            # Цена
            if item["has_price"]:
                price_p = P(item["price"], FONT_BOLD, 9.5, PRICE_CLR, "R")
            else:
                price_p = P("нет цены", FONT_REG, 8, LGRAY, "R")

            rows.append([
                P(str(i+1), FONT_REG, 7, NUM_CLR, "C"),
                P(item["name"], FONT_BOLD, 9, NAME_CLR),
                sim_p,
                region_p,
                price_p,
            ])

        rows_tbl = Table(rows, colWidths=[COL_NUM, COL_NAME, COL_SIM, COL_REGION, COL_PRICE])
        ts = [
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 3),
            ("RIGHTPADDING",  (0,0),(-1,-1), 3),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LINEBELOW",     (0,0),(-1,-1), 0.25, colors.HexColor("#e5e7eb")),
            ("ALIGN",         (0,0),(0,-1),  "CENTER"),
            ("ALIGN",         (3,0),(3,-1),  "CENTER"),
        ]
        for i in range(len(rows)):
            bg = ROW_ODD if i % 2 == 0 else ROW_EVEN
            ts.append(("BACKGROUND", (0,i), (-1,i), bg))
            # Цветной фон для региона
            item = items[i]
            if item["region"] == "EU":
                ts.append(("BACKGROUND", (3,i), (3,i), colors.HexColor("#f0fdf4")))
            elif item["region"] == "US":
                ts.append(("BACKGROUND", (3,i), (3,i), colors.HexColor("#eff6ff")))
            elif item["region"] == "CN":
                ts.append(("BACKGROUND", (3,i), (3,i), colors.HexColor("#fefce8")))

        rows_tbl.setStyle(TableStyle(ts))

        story.append(KeepTogether([cat_hdr, rows_tbl, Spacer(1, 3*mm)]))

    # ── CTA ────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 3*mm))
    cta = Table([
        [P("НЕ НАШЛИ НУЖНУЮ МОДЕЛЬ?",    FONT_BOLD, 13, WHITE,  "C")],
        [P("Позвоните — найдём под заказ за 1–3 дня. Покупаем и продаём 24/7.", FONT_REG, 9, GRAY, "C")],
        [P("+7 (992) 990-33-33",          FONT_BOLD, 16, GOLD,   "C")],
    ], colWidths=[W])
    cta.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
        ("TOPPADDING",    (0,0),(0,0),   10),
        ("TOPPADDING",    (0,1),(0,1),   3),
        ("TOPPADDING",    (0,2),(0,2),   4),
        ("BOTTOMPADDING", (0,2),(0,2),   12),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("RIGHTPADDING",  (0,0),(-1,-1), 8),
        ("LINEABOVE",     (0,0),(-1,0),  2.5, GOLD),
    ]))
    story.append(cta)

    # ── Подвал ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LGRAY))
    story.append(Spacer(1, 1.5*mm))
    story.append(P(
        f"skypka24.com  |  г. Калуга, ул. Кирова 7/47 и ул. Кирова 11  |  +7 (992) 990-33-33  |  (c) {datetime.now().year} Скупка24",
        FONT_REG, 7, GRAY, "C"
    ))

    doc.build(story)
    return buf.getvalue()


# ── Handler ───────────────────────────────────────────────────────────────────
def handler(event: dict, context) -> dict:
    """Генерация PDF прайса Скупка24. GET / — скачать PDF с ценами и SIM-типом."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS_CORS, "body": ""}

    qs   = event.get("queryStringParameters") or {}
    body = {}
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        pass

    admin_token = ((event.get("headers") or {}).get("x-admin-token", "")
                   or body.get("admin_token", ""))
    is_admin    = admin_token == ADMIN_TOKEN
    markup      = int(body.get("markup", qs.get("markup", DEFAULT_MARKUP)))
    if not is_admin:
        markup = DEFAULT_MARKUP

    print_mode = qs.get("print") in ("1", "true", "yes")

    products   = fetch_products()
    cdn_photos = load_cdn_photos()
    groups     = group_products(products, markup, cdn_photos)
    total      = sum(len(v) for v in groups.values())

    msk_now    = datetime.now(timezone(timedelta(hours=3)))
    gen_at     = msk_now.strftime("%d.%m.%Y %H:%M МСК")

    pdf_bytes  = build_pdf(groups, total, gen_at, print_mode=print_mode)
    pdf_b64    = base64.b64encode(pdf_bytes).decode()
    suffix     = "-print" if print_mode else ""
    filename   = f"price-skypka24{suffix}-{msk_now.strftime('%d%m%Y')}.pdf"

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