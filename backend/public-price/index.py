"""
Публичный прайс Скупка24 — JSON для страницы /Apple.
GET /?markup=2000  → { ok, groups: {category: [{name, price, photo, region}]}, generated_at, total }
"""
import json, os, urllib.request
import psycopg2
from datetime import datetime, timezone, timedelta

SCHEMA        = "t_p31606708_tech_buying_service"
SMARTBERY_URL = "https://smartbery-qrcode.ru/api/v1/products/"
DEFAULT_MARKUP = 2000

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "public, max-age=10800",
}

CATEGORY_ORDER = [
    "iPhone", "MacBook", "iPad", "Apple Watch", "AirPods",
    "Смартфоны Samsung", "Смартфоны Xiaomi", "Смартфоны Honor",
    "Наушники", "Планшеты", "Умные часы", "Игровые консоли",
    "Аксессуары Apple", "Аксессуары", "Прочее",
]
CAT_MAP = {
    "Redmi": "Смартфоны Xiaomi", "Poco": "Смартфоны Xiaomi", "Xiaomi": "Смартфоны Xiaomi",
    "Samsung": "Смартфоны Samsung", "Galaxy": "Смартфоны Samsung",
    "Honor": "Смартфоны Honor",
    "iPad": "iPad", "MacBook": "MacBook",
    "AirPods": "AirPods", "Earpods": "Наушники", "EarPods": "Наушники",
    "Watch": "Apple Watch", "Pencil": "Аксессуары Apple",
    "PS5": "Игровые консоли", "JBL": "Наушники", "Tab": "Планшеты",
    "Кабель": "Аксессуары", "Стекло": "Аксессуары", "Чехол": "Аксессуары",
    "SE2": "iPhone", "SE3": "iPhone", "16e": "iPhone", "17e": "iPhone", "Air": "iPhone",
}

def detect_sim(name: str, region: str) -> str:
    """
    EU  → nano-SIM + eSIM
    CN  → Dual SIM (nano)
    US / "" + iPhone 14+ → eSIM only
    остальные → nano-SIM + eSIM
    """
    n   = name.lower()
    reg = (region or "").upper()
    if any(x in n for x in ["macbook", "airpod", "watch", "pencil",
                              "кабель", "стекло", "чехол", "magsafe"]):
        return ""
    if any(x in n for x in ["samsung", "galaxy", "redmi", "poco", "xiaomi", "honor"]):
        return "Dual SIM (nano)"
    is_apple = (n.startswith(("13","14","15","16","17","se2","se3","16e","17e","iphone","ipad")))
    if is_apple:
        if reg == "CN":
            return "Dual SIM (nano)"
        if reg in ("US", "") and n.startswith(("14","15","16","17","se3","16e","17e")):
            return "eSIM only"
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

def load_cdn_photos() -> dict:
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur  = conn.cursor()
        cur.execute(
            f"SELECT sku, photo_url FROM {SCHEMA}.catalog "
            f"WHERE sku LIKE 'smartbery_%' "
            f"AND photo_url LIKE 'https://cdn.poehali.dev/%'"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return { row[0].replace("smartbery_", ""): row[1] for row in rows if row[1] }
    except Exception as e:
        print(f"[public-price][photos] {e}")
        return {}

def fetch_products() -> list:
    token = os.environ.get("SMARTBERY_TOKEN", "")
    req = urllib.request.Request(
        SMARTBERY_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        data = json.loads(r.read())
    return [p for p in data if p.get("availability")]

def group_products(products: list, markup: int, cdn_photos: dict) -> dict:
    groups: dict = {}
    for p in products:
        raw_name  = (p.get("name") or "").strip()
        raw_price = p.get("price")
        region    = p.get("country") or ""
        category  = detect_category(raw_name)
        photo     = cdn_photos.get(_sku_key(raw_name))

        price_num = None
        price_str = "—"
        if raw_price is not None:
            price_num = int(raw_price) + markup
            price_str = f"{price_num:,}".replace(",", "\u00a0") + " ₽"

        groups.setdefault(category, []).append({
            "name":      raw_name,
            "price":     price_str,
            "price_num": price_num,
            "region":    region,
            "sim":       detect_sim(raw_name, region),
            "photo":     photo,
        })

    ordered = {}
    for cat in CATEGORY_ORDER:
        if cat in groups:
            ordered[cat] = groups[cat]
    for cat in groups:
        if cat not in ordered:
            ordered[cat] = groups[cat]
    return ordered


def handler(event: dict, context) -> dict:
    """Публичный прайс Скупка24 с наценкой. GET /?markup=2000"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    qs = event.get("queryStringParameters") or {}
    try:
        markup = max(0, int(qs.get("markup", DEFAULT_MARKUP)))
    except Exception:
        markup = DEFAULT_MARKUP

    products   = fetch_products()
    cdn_photos = load_cdn_photos()
    groups     = group_products(products, markup, cdn_photos)
    total      = sum(len(v) for v in groups.values())

    msk_now    = datetime.now(timezone(timedelta(hours=3)))
    gen_at     = msk_now.strftime("%d.%m.%Y %H:%M МСК")

    return {
        "statusCode": 200,
        "headers": HEADERS,
        "body": json.dumps({
            "ok":           True,
            "total":        total,
            "markup":       markup,
            "generated_at": gen_at,
            "groups":       groups,
        }, ensure_ascii=False),
    }