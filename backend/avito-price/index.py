import json

HEADERS_RESP = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

APPLE_PRICES = {
    # iPhone 17
    'iphone 17 pro max': 130000,
    'iphone 17 pro': 115000,
    'iphone 17 plus': 100000,
    'iphone 17': 90000,
    # iPhone 16
    'iphone 16 pro max': 95000,
    'iphone 16 pro': 80000,
    'iphone 16 plus': 72000,
    'iphone 16': 65000,
    # iPhone 15
    'iphone 15 pro max': 82000,
    'iphone 15 pro': 70000,
    'iphone 15 plus': 60000,
    'iphone 15': 55000,
    # iPhone 14
    'iphone 14 pro max': 68000,
    'iphone 14 pro': 58000,
    'iphone 14 plus': 50000,
    'iphone 14': 45000,
    # iPhone 13
    'iphone 13 pro max': 55000,
    'iphone 13 pro': 48000,
    'iphone 13 mini': 32000,
    'iphone 13': 38000,
    # iPhone 12
    'iphone 12 pro max': 42000,
    'iphone 12 pro': 36000,
    'iphone 12 mini': 24000,
    'iphone 12': 28000,
    # iPhone 11
    'iphone 11 pro max': 32000,
    'iphone 11 pro': 28000,
    'iphone 11': 22000,
    # iPhone SE / старые
    'iphone se 3': 20000,
    'iphone se 2': 15000,
    'iphone se': 12000,
    'iphone xr': 16000,
    'iphone xs max': 18000,
    'iphone xs': 15000,
    'iphone x': 13000,
    'iphone 8 plus': 12000,
    'iphone 8': 10000,
    # MacBook Pro
    'macbook pro 16 m3': 160000,
    'macbook pro 16 m2': 140000,
    'macbook pro 16 m1': 120000,
    'macbook pro 16': 130000,
    'macbook pro 14 m3': 140000,
    'macbook pro 14 m2': 120000,
    'macbook pro 14 m1': 105000,
    'macbook pro 14': 115000,
    'macbook pro 13 m2': 85000,
    'macbook pro 13 m1': 75000,
    'macbook pro 13': 70000,
    'macbook pro': 90000,
    # MacBook Air
    'macbook air 15 m3': 110000,
    'macbook air 15 m2': 95000,
    'macbook air 13 m3': 95000,
    'macbook air 13 m2': 80000,
    'macbook air m3': 100000,
    'macbook air m2': 80000,
    'macbook air m1': 62000,
    'macbook air': 60000,
    # iPad Pro
    'ipad pro 13 m4': 120000,
    'ipad pro 11 m4': 95000,
    'ipad pro 12.9 m2': 85000,
    'ipad pro 12.9 m1': 75000,
    'ipad pro 12.9': 70000,
    'ipad pro 11 m2': 70000,
    'ipad pro 11 m1': 60000,
    'ipad pro 11': 58000,
    'ipad pro': 65000,
    # iPad Air
    'ipad air m2': 60000,
    'ipad air m1': 48000,
    'ipad air 5': 45000,
    'ipad air 4': 38000,
    'ipad air': 40000,
    # iPad Mini
    'ipad mini 7': 50000,
    'ipad mini 6': 40000,
    'ipad mini 5': 25000,
    'ipad mini': 35000,
    # iPad
    'ipad 10': 32000,
    'ipad 9': 22000,
    'ipad 8': 18000,
    # Apple Watch
    'apple watch ultra 2': 55000,
    'apple watch ultra': 45000,
    'apple watch series 10': 40000,
    'apple watch series 9': 32000,
    'apple watch series 8': 26000,
    'apple watch series 7': 20000,
    'apple watch series 6': 17000,
    'apple watch se 2': 16000,
    'apple watch se': 13000,
    # AirPods
    'airpods pro 2': 16000,
    'airpods pro': 12000,
    'airpods max': 30000,
    'airpods 4': 12000,
    'airpods 3': 9000,
    'airpods 2': 7000,
    # Mac
    'mac mini m4': 60000,
    'mac mini m2': 42000,
    'mac mini m1': 32000,
    'imac m3': 130000,
    'imac m1': 90000,
    'mac studio m2': 150000,
    'mac studio': 120000,
    'mac pro': 300000,
    # Apple TV / HomePod
    'apple tv 4k': 18000,
    'homepod mini': 11000,
    'homepod 2': 24000,
}

def find_price(query: str):
    q = query.lower().strip()
    # Точное совпадение
    if q in APPLE_PRICES:
        return APPLE_PRICES[q], q
    # Частичное — ищем самое длинное совпадение
    best_match = None
    best_len = 0
    for model, price in APPLE_PRICES.items():
        if model in q and len(model) > best_len:
            best_match = (price, model)
            best_len = len(model)
    if best_match:
        return best_match
    # Обратное — ищем часть запроса в названии модели
    for model, price in APPLE_PRICES.items():
        words = q.split()
        if len(words) >= 2 and all(w in model for w in words):
            return price, model
    return None, None

def handler(event: dict, context) -> dict:
    """Возвращает среднюю цену б/у техники Apple и цену скупки (-5000 руб). При ненайденной модели — возвращает статус unknown для отправки заявки."""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS_RESP, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    query = body.get('query', '').strip()

    if not query:
        return {'statusCode': 400, 'headers': HEADERS_RESP, 'body': json.dumps({'error': 'Укажите модель устройства'})}

    avito_price, matched_model = find_price(query)

    if not avito_price:
        # Модель не найдена — возвращаем 200 с флагом unknown, чтобы фронт мог показать форму заявки
        return {
            'statusCode': 200,
            'headers': HEADERS_RESP,
            'body': json.dumps({
                'model': query,
                'avito_avg': None,
                'skupka_price': None,
                'unknown': True,
                'query': query,
            })
        }

    skupka_price = avito_price - 5000

    return {
        'statusCode': 200,
        'headers': HEADERS_RESP,
        'body': json.dumps({
            'model': matched_model.title(),
            'avito_avg': avito_price,
            'skupka_price': skupka_price,
            'unknown': False,
            'discount': 5000,
            'query': query,
        })
    }
