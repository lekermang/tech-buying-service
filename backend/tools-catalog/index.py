"""
Каталог инструментов instrument.ru — цены из API + названия из БД.
Публичный endpoint.
"""
import json
import os
import urllib.request
import psycopg2

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

BASE_API_URL = "https://instrument.ru/api.php"
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

BRANDS = [
    "СИБРТЕХ", "ELFE", "SPARTA", "MATRIX", "STELS", "GROSS",
    "БАРС", "DENZEL", "ШУРУПЬ", "PALISAD", "KRONWERK", "MTX",
    "STERN", "PALISAD Home",
]

CATEGORIES = [
    "Отделочный инструмент", "Прочий инструмент", "Слесарный инструмент",
    "Автомобильный инструмент", "Столярный инструмент", "Садовый инвентарь",
    "Измерительный инструмент", "Силовое оборудование", "Крепежный инструмент",
    "Режущий инструмент", "Аксессуары для бетоносмесителей", "Аксессуары для насосов",
    "Аксессуары для плиткорезов", "Долота-стамески наборы", "Стусла прецизионные",
    "Полотна для прецизионного стусла", "Пилы для стусла", "Лопаты снеговые с черенком",
    "Адаптеры пластмассовые", "Адаптеры латунные", "Муфты пластмассовые",
    "Муфты латунные", "Переходники пластмассовые", "Переходники латунные",
    "Разветвители пластмассовые", "Разветвители латунные", "Соединители пластмассовые",
    "Соединители латунные", "Соединители стальные", "Ведра оцинкованные",
    "Тазы оцинкованные", "Компрессоры ременные", "Компрессоры поршневые",
    "Ящики для инструмента", "Полки для инструмента", "Веревки", "Канаты",
    "Инфракрасные обогреватели", "Конвекторы", "Масляные обогреватели",
    "Снегоуборочные машины бензиновые", "Снегоуборочные машины электрические",
    "Аппараты для сварки пластиковых труб", "Инверторные полуавтоматы MIG-MAG",
    "Инверторы TIG", "Бетоносмесители", "Электроды", "Гайковерты ударные аккумуляторные",
    "Дрели-шуруповерты аккумуляторные", "УШМ аккумуляторные", "МФИ аккумуляторные",
    "Отвертки аккумуляторные", "Зарядные устройства", "Триммеры электрические",
    "Насосы циркуляционные", "Опрыскиватели ручные", "Опрыскиватели бензиновые",
    "Опрыскиватели аккумуляторные", "Лобзики аккумуляторные",
    "Шлифовальные машины аккумуляторные", "Пилы сабельные аккумуляторные",
    "Пилы циркулярные аккумуляторные", "Насосы фонтанные", "Пылесосы строительные",
    "Перфораторы аккумуляторные", "Снегоуборочные машины аккумуляторные",
]


def fetch_api_products(token: str, limit: int, offset: int) -> dict:
    payload = {"access_token": token, "format": "json", "limit": limit, "offset": offset}
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_API_URL}/get.products.list",
        data=body,
        headers={"Content-Type": "application/json"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_names_from_db(articles: list) -> dict:
    """Возвращает {article: {name, brand, category}} для переданных артикулов."""
    if not articles:
        return {}
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    placeholders = ",".join(["%s"] * len(articles))
    cur.execute(
        f"SELECT article, name, brand, category FROM {SCHEMA}.tools_products WHERE article IN ({placeholders})",
        articles,
    )
    result = {row[0]: {"name": row[1], "brand": row[2] or "", "category": row[3] or ""} for row in cur.fetchall()}
    cur.close()
    conn.close()
    return result


def get_db_categories(category: str) -> list:
    """Возвращает уникальные категории из БД."""
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute(f"SELECT DISTINCT category FROM {SCHEMA}.tools_products WHERE category IS NOT NULL AND category != '' ORDER BY category")
    cats = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return cats


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "products")
    limit = min(int(params.get("limit", 100)), 500)
    offset = int(params.get("offset", 0))
    search = params.get("search", "").strip().lower()
    category_filter = params.get("category", "").strip()
    brand_filter = params.get("brand", "").strip()

    if action == "meta":
        try:
            db_cats = get_db_categories(category_filter)
        except Exception:
            db_cats = CATEGORIES
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "brands": BRANDS,
                "categories": db_cats if db_cats else CATEGORIES,
            }, ensure_ascii=False),
        }

    token = os.environ.get("INSTRUMENT_API_TOKEN", "")

    try:
        raw = fetch_api_products(token, limit, offset)

        if isinstance(raw, dict) and raw.get("result") == "error":
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": raw.get("error", "API error")}),
            }

        # Собираем артикулы и получаем названия из БД одним запросом
        articles = [data.get("ARTICLE", "") for data in raw.values() if data.get("ARTICLE")]
        names_map = fetch_names_from_db(articles)

        items = []
        for pid, data in raw.items():
            article = data.get("ARTICLE", "")
            db_info = names_map.get(article, {})
            name = db_info.get("name", "")
            brand = db_info.get("brand", "")
            category = db_info.get("category", "")

            # Фильтры
            if search:
                haystack = f"{article} {name} {brand}".lower()
                if search not in haystack:
                    continue
            if category_filter and category != category_filter:
                continue
            if brand_filter and brand != brand_filter:
                continue

            items.append({
                "id": pid,
                "article": article,
                "name": name,
                "brand": brand,
                "category": category,
                "base_price": float(data.get("BASE_PRICE", 0)),
                "discount_price": float(data.get("DISCOUNT_PRICE", 0)),
                "amount": data.get("AMOUNT", ""),
            })

        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({
                "items": items,
                "count": len(items),
                "offset": offset,
                "has_more": len(items) == limit,
            }, ensure_ascii=False),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"error": str(e), "items": []}),
        }
