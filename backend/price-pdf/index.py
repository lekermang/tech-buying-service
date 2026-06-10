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
    """
    Определяет тип SIM по названию и региону поставки.

    Регионы из Smartbery:
      EU  — Европа/ОАЭ/Сингапур и др.  → nano-SIM + eSIM (физическая SIM сохранена)
      CN  — Китай                       → Dual SIM (2×nano, без eSIM)
      ""  — США (LL/A)                  → eSIM only (с iPhone 14)
      US  — США явный                   → eSIM only (с iPhone 14)
    """
    n   = name.lower()
    reg = (region or "").upper()

    # Устройства без SIM
    if any(x in n for x in ["macbook", "airpod", "watch", "pencil",
                              "кабель", "стекло", "чехол", "magsafe"]):
        return ""

    # Samsung / Xiaomi / Honor — всегда Dual nano-SIM
    if any(x in n for x in ["samsung", "galaxy", "redmi", "poco", "xiaomi", "honor"]):
        return "Dual SIM (nano)"

    is_iphone = (
        n.startswith(("13", "14", "15", "16", "17", "se2", "se3", "16e", "17e"))
        or n.startswith(("iphone",))
    )
    is_ipad   = "ipad" in n

    if is_iphone or is_ipad:
        # Китай — две физические SIM, без eSIM
        if reg == "CN":
            return "Dual SIM (nano)"
        # США — только eSIM начиная с iPhone 14 (SE3 тоже)
        if reg in ("US", "") and n.startswith(("14", "15", "16", "17", "se3", "16e", "17e")):
            return "eSIM only"
        # Все остальные регионы (EU, AE, ZA, RU и пустая строка для 13/SE2) — nano + eSIM
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


def _sim_order(sim: str) -> int:
    if sim == "nano-SIM + eSIM": return 0
    if sim == "eSIM only":       return 1
    if sim == "Dual SIM (nano)": return 2
    return 3

# ── PDF ───────────────────────────────────────────────────────────────────────
def build_pdf(groups: dict, total: int, generated_at: str, print_mode: bool = False) -> bytes:
    from reportlab.lib.pagesizes import landscape
    from reportlab.platypus import MultiCol
    FONT_REG, FONT_BOLD = setup_fonts()

    buf = io.BytesIO()
    # Альбомный A4
    PAGE = landscape(A4)
    doc = SimpleDocTemplate(
        buf, pagesize=PAGE,
        leftMargin=8*mm, rightMargin=8*mm,
        topMargin=8*mm, bottomMargin=8*mm,
        title="Прайс Скупка24",
        author="Скупка24",
    )

    WHITE = colors.white
    GOLD  = colors.HexColor("#B8860B") if print_mode else colors.HexColor("#FFD700")
    DARK_BG   = colors.HexColor("#1a1a1a")
    GRAY      = colors.HexColor("#555555") if print_mode else colors.HexColor("#888888")
    LGRAY     = colors.HexColor("#dddddd")
    PRICE_CLR = colors.HexColor("#b91c1c") if print_mode else colors.HexColor("#7c2d12")
    SIM_CLR   = colors.HexColor("#1d4ed8")
    ESIM_CLR  = colors.HexColor("#c2410c")
    DUAL_CLR  = colors.HexColor("#7e22ce")
    NAME_CLR  = colors.HexColor("#111111")
    ROW_ODD   = colors.HexColor("#f7f8fa")
    ROW_EVEN  = WHITE
    SIM_HDR_COLORS = {
        "nano-SIM + eSIM": (colors.HexColor("#1d4ed8"), colors.HexColor("#eff6ff")),
        "eSIM only":       (colors.HexColor("#c2410c"), colors.HexColor("#fff7ed")),
        "Dual SIM (nano)": (colors.HexColor("#7e22ce"), colors.HexColor("#faf5ff")),
    }

    def P(text, fn=None, fs=7, clr=None, align=None):
        kw = dict(fontName=fn or FONT_REG, fontSize=fs,
                  textColor=clr or colors.black, leading=fs*1.3)
        if align == "R": kw["alignment"] = TA_RIGHT
        if align == "C": kw["alignment"] = TA_CENTER
        return Paragraph(text, ParagraphStyle(f"p{hash(text[:30])}", **kw))

    story = []
    W = doc.width   # ~260mm для landscape A4

    # ── ШАПКА ──────────────────────────────────────────────────────────────────
    hdr = Table([[
        P("СКУПКА24 — ПРАЙС-ЛИСТ", FONT_BOLD, 18, WHITE),
        P("skypka24.com  ·  г. Калуга, Кирова 7/47 и 11", FONT_REG, 8, GRAY, "C"),
        P("+7 (992) 990-33-33", FONT_BOLD, 13, GOLD, "R"),
    ]], colWidths=[W*0.38, W*0.38, W*0.24])
    hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), DARK_BG),
        ("TOPPADDING",    (0,0),(-1,-1), 8),
        ("BOTTOMPADDING", (0,0),(-1,-1), 8),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
        ("LINEBELOW",     (0,0),(-1,0),  2, GOLD),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    sub = Table([[
        P(f"Всего позиций: {total}", FONT_REG, 7, GRAY),
        P(f"Обновлено: {generated_at}  ·  nano+eSIM = Европа/ОАЭ  ·  eSIM only = США  ·  Dual = Китай",
          FONT_REG, 7, GRAY, "C"),
        P(f"skypka24.com", FONT_BOLD, 7, GOLD, "R"),
    ]], colWidths=[W*0.2, W*0.6, W*0.2])
    sub.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), colors.HexColor("#f0f0f0") if print_mode else colors.HexColor("#1e1e1e")),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
    ]))
    story += [hdr, sub, Spacer(1, 4*mm)]

    # ── 3 КОЛОНКИ ──────────────────────────────────────────────────────────────
    GAP   = 4*mm
    NCOLS = 3
    CW    = (W - GAP * (NCOLS - 1)) / NCOLS   # ширина одной колонки

    # Размеры столбцов внутри одной колонки: Название | SIM | Цена
    cNAME  = CW * 0.50
    cSIM   = CW * 0.28
    cPRICE = CW * 0.22

    def make_item_row(item: dict, idx: int):
        sim = item["sim"]
        if sim == "eSIM only":       s_clr, s_lbl = ESIM_CLR, "eSIM only"
        elif "Dual" in sim:          s_clr, s_lbl = DUAL_CLR, "Dual SIM"
        elif sim == "nano-SIM + eSIM": s_clr, s_lbl = SIM_CLR, "nano+eSIM"
        else:                        s_clr, s_lbl = GRAY, sim

        reg = item["region"] or ""
        if reg == "EU":   r_sfx = " 🇪🇺"
        elif reg == "CN": r_sfx = " 🇨🇳"
        elif reg == "US": r_sfx = " 🇺🇸"
        else:             r_sfx = ""

        name_txt = item["name"] + r_sfx
        price_p  = P(item["price"], FONT_BOLD, 7, PRICE_CLR, "R") if item["has_price"] else P("под заказ", FONT_REG, 6, GRAY, "R")

        bg = ROW_ODD if idx % 2 == 0 else ROW_EVEN
        return [
            P(name_txt, FONT_BOLD, 7, NAME_CLR),
            P(s_lbl, FONT_REG, 6, s_clr, "C"),
            price_p,
        ], bg

    def build_cat_block(cat: str, items: list) -> list:
        """Строит flowable-блок одной категории."""
        cat_rgb   = CAT_RGB.get(cat, (0.4, 0.4, 0.4))
        cat_color = colors.Color(*cat_rgb)
        dark_cat  = colors.Color(max(0, cat_rgb[0]*0.15), max(0, cat_rgb[1]*0.15), max(0, cat_rgb[2]*0.15))

        # Сортируем по SIM
        sorted_items = sorted(items, key=lambda x: _sim_order(x["sim"]))

        # Группируем по SIM
        by_sim: dict = {}
        for it in sorted_items:
            k = it["sim"] or "Другое"
            by_sim.setdefault(k, []).append(it)

        blocks = []
        # Заголовок категории
        cat_hdr = Table(
            [[P(f"{CAT_LABEL.get(cat, cat).upper()}  ({len(items)})", FONT_BOLD, 8, cat_color)]],
            colWidths=[CW]
        )
        cat_hdr.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,-1), dark_cat),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
            ("LEFTPADDING",   (0,0),(-1,-1), 5),
            ("LINEABOVE",     (0,0),(-1,0),  1.5, cat_color),
        ]))
        blocks.append(cat_hdr)

        for sim_key, sim_items in by_sim.items():
            # SIM-подзаголовок если групп больше одной
            if len(by_sim) > 1:
                s_clr, s_bg = SIM_HDR_COLORS.get(sim_key, (GRAY, colors.HexColor("#f5f5f5")))
                sim_hdr = Table(
                    [[P(sim_key, FONT_REG, 6, s_clr)]],
                    colWidths=[CW]
                )
                sim_hdr.setStyle(TableStyle([
                    ("BACKGROUND",    (0,0),(-1,-1), s_bg),
                    ("TOPPADDING",    (0,0),(-1,-1), 2),
                    ("BOTTOMPADDING", (0,0),(-1,-1), 2),
                    ("LEFTPADDING",   (0,0),(-1,-1), 6),
                    ("LINEBELOW",     (0,0),(-1,0),  0.3, s_clr),
                ]))
                blocks.append(sim_hdr)

            # Строки товаров
            rows_data, row_bgs = [], []
            for i, it in enumerate(sim_items):
                r, bg = make_item_row(it, i)
                rows_data.append(r)
                row_bgs.append(bg)

            tbl = Table(rows_data, colWidths=[cNAME, cSIM, cPRICE])
            ts = [
                ("TOPPADDING",    (0,0),(-1,-1), 2),
                ("BOTTOMPADDING", (0,0),(-1,-1), 2),
                ("LEFTPADDING",   (0,0),(-1,-1), 5),
                ("RIGHTPADDING",  (0,0),(-1,-1), 3),
                ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
                ("LINEBELOW",     (0,0),(-1,-1), 0.2, LGRAY),
                ("ALIGN",         (1,0),(1,-1),  "CENTER"),
            ]
            for i, bg in enumerate(row_bgs):
                ts.append(("BACKGROUND", (0,i), (-1,i), bg))
            tbl.setStyle(TableStyle(ts))
            blocks.append(tbl)

        blocks.append(Spacer(1, 2*mm))
        return blocks

    # Распределяем категории по 3 колонкам равномерно
    cat_list    = list(groups.items())
    total_items = sum(len(v) for _, v in cat_list)
    target      = total_items / NCOLS

    cols_flows: list = [[], [], []]
    col_counts       = [0, 0, 0]
    col_idx = 0
    for cat, items in cat_list:
        if col_idx < NCOLS - 1 and col_counts[col_idx] >= target:
            col_idx += 1
        cols_flows[col_idx].extend(build_cat_block(cat, items))
        col_counts[col_idx] += len(items)

    # MultiCol принимает список списков + список ширин
    story.append(MultiCol(cols_flows, [CW, CW, CW]))

    # ── Подвал ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=LGRAY))
    story.append(Spacer(1, 1*mm))
    footer = Table([[
        P(f"+7 (992) 990-33-33", FONT_BOLD, 8, GOLD),
        P("г. Калуга, ул. Кирова 7/47 и ул. Кирова 11  ·  skypka24.com", FONT_REG, 7, GRAY, "C"),
        P(f"© {datetime.now().year} Скупка24. Цены актуальны на дату печати.", FONT_REG, 6, GRAY, "R"),
    ]], colWidths=[W*0.25, W*0.5, W*0.25])
    footer.setStyle(TableStyle([
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    story.append(footer)

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