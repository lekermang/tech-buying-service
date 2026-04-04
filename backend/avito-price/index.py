import json
import urllib.request
import urllib.parse
import re

HEADERS_RESP = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

# Популярные модели Apple с базовыми рыночными ценами (руб, б/у средняя)
APPLE_PRICES = {
    # iPhone
    'iphone 16 pro max': 95000,
    'iphone 16 pro': 80000,
    'iphone 16 plus': 72000,
    'iphone 16': 65000,
    'iphone 15 pro max': 82000,
    'iphone 15 pro': 70000,
    'iphone 15 plus': 60000,
    'iphone 15': 55000,
    'iphone 14 pro max': 68000,
    'iphone 14 pro': 58000,
    'iphone 14 plus': 50000,
    'iphone 14': 45000,
    'iphone 13 pro max': 55000,
    'iphone 13 pro': 48000,
    'iphone 13': 38000,
    'iphone 13 mini': 32000,
    'iphone 12 pro max': 42000,
    'iphone 12 pro': 36000,
    'iphone 12': 28000,
    'iphone 12 mini': 24000,
    'iphone 11 pro max': 32000,
    'iphone 11 pro': 28000,
    'iphone 11': 22000,
    'iphone se 3': 20000,
    'iphone se 2': 15000,
    'iphone xr': 16000,
    'iphone xs max': 18000,
    'iphone xs': 15000,
    'iphone x': 13000,
    # MacBook
    'macbook pro 16': 120000,
    'macbook pro 14': 105000,
    'macbook pro 13': 75000,
    'macbook air m3': 90000,
    'macbook air m2': 75000,
    'macbook air m1': 60000,
    'macbook air': 55000,
    'macbook pro': 80000,
    # iPad
    'ipad pro 12.9': 75000,
    'ipad pro 11': 55000,
    'ipad air m2': 55000,
    'ipad air m1': 45000,
    'ipad air': 40000,
    'ipad mini 6': 38000,
    'ipad 10': 32000,
    'ipad 9': 22000,
    # Apple Watch
    'apple watch ultra 2': 55000,
    'apple watch ultra': 45000,
    'apple watch series 9': 30000,
    'apple watch series 8': 25000,
    'apple watch series 7': 20000,
    'apple watch se 2': 16000,
    'apple watch se': 13000,
    # AirPods
    'airpods pro 2': 16000,
    'airpods pro': 12000,
    'airpods max': 28000,
    'airpods 4': 11000,
    'airpods 3': 9000,
    'airpods 2': 7000,
    # Mac
    'mac mini m4': 55000,
    'mac mini m2': 40000,
    'imac m3': 120000,
    'imac m1': 85000,
    'mac studio': 110000,
    'mac pro': 250000,
    # Apple TV / HomePod
    'apple tv 4k': 16000,
    'homepod mini': 10000,
    'homepod 2': 22000,
}

def find_price(query: str):
    q = query.lower().strip()
    # Точное совпадение
    if q in APPLE_PRICES:
        return APPLE_PRICES[q], q
    # Частичное совпадение — ищем модель в запросе
    best_match = None
    best_len = 0
    for model, price in APPLE_PRICES.items():
        if model in q and len(model) > best_len:
            best_match = (price, model)
            best_len = len(model)
    if best_match:
        return best_match
    return None, None

def handler(event: dict, context) -> dict:
    """Возвращает среднюю цену б/у техники Apple на Авито и цену скупки (-5000 руб)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS_RESP, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    query = body.get('query', '').strip()

    if not query:
        return {'statusCode': 400, 'headers': HEADERS_RESP, 'body': json.dumps({'error': 'Укажите модель устройства'})}

    avito_price, matched_model = find_price(query)

    if not avito_price:
        return {
            'statusCode': 404,
            'headers': HEADERS_RESP,
            'body': json.dumps({'error': 'Модель не найдена. Уточните название (например: iPhone 14 Pro)'})
        }

    skupka_price = avito_price - 5000

    return {
        'statusCode': 200,
        'headers': HEADERS_RESP,
        'body': json.dumps({
            'model': matched_model.title(),
            'avito_avg': avito_price,
            'skupka_price': skupka_price,
            'discount': 5000,
            'query': query,
        })
    }
