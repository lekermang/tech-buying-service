"""
Каталог инструментов instrument.ru — возвращает товары с ценами и остатками.
Публичный endpoint, токен instrument.ru хранится в секретах.
"""
import json
import os
import urllib.request

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

BASE_API_URL = "https://instrument.ru/api.php"

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


def fetch_products(token: str, limit: int, offset: int) -> dict:
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "products")
    limit = min(int(params.get("limit", 100)), 500)
    offset = int(params.get("offset", 0))
    search = params.get("search", "").strip().lower()

    if action == "meta":
        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"brands": BRANDS, "categories": CATEGORIES}, ensure_ascii=False),
        }

    token = os.environ.get("INSTRUMENT_API_TOKEN", "")

    try:
        raw = fetch_products(token, limit, offset)

        if isinstance(raw, dict) and raw.get("result") == "error":
            return {
                "statusCode": 400,
                "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                "body": json.dumps({"error": raw.get("error", "API error")}),
            }

        items = []
        for pid, data in raw.items():
            article = data.get("ARTICLE", "")
            if search and search not in article.lower():
                continue
            items.append({
                "id": pid,
                "article": article,
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
