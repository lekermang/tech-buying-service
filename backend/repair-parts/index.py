import json
import re
import time
import requests
from bs4 import BeautifulSoup

HEADERS_HTTP = {'Access-Control-Allow-Origin': '*'}

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://kaluga.moba.ru/',
}

CATALOG_URLS = {
    'display': 'https://kaluga.moba.ru/catalog/displei/',
    'battery': 'https://kaluga.moba.ru/catalog/akkumulyatory-1/',
}

REPAIR_COST = 1500


def parse_catalog(url: str) -> list:
    items = []
    page = 1
    session = requests.Session()
    session.get('https://kaluga.moba.ru/', headers=BROWSER_HEADERS, timeout=15)

    while page <= 10:
        page_url = url if page == 1 else f'{url}?PAGEN_1={page}'
        resp = session.get(page_url, headers=BROWSER_HEADERS, timeout=15)
        if resp.status_code != 200:
            break

        soup = BeautifulSoup(resp.text, 'html.parser')
        found = False

        for card in soup.select('.catalog-item, .product-item, .item-block, [class*="catalog"], [class*="product"]'):
            name_el = card.select_one('[class*="name"], [class*="title"], h2, h3, .name, .title')
            price_el = card.select_one('[class*="price"], .price, [itemprop="price"]')
            if not name_el or not price_el:
                continue

            name = name_el.get_text(strip=True)
            price_text = price_el.get_text(strip=True)
            price_match = re.search(r'[\d\s]+', price_text.replace('\xa0', ''))
            if not price_match:
                continue

            try:
                price = int(price_match.group().replace(' ', ''))
            except ValueError:
                continue

            if price > 0 and len(name) > 3:
                items.append({'model': name, 'price': price})
                found = True

        if not found:
            break
        page += 1
        time.sleep(0.3)

    return items


def handler(event: dict, context) -> dict:
    """Парсинг каталога запчастей с moba.ru: дисплеи и аккумуляторы с ценами"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                **HEADERS_HTTP,
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    catalog_type = (event.get('queryStringParameters') or {}).get('type', 'all')

    result = {}

    if catalog_type in ('display', 'all'):
        result['displays'] = parse_catalog(CATALOG_URLS['display'])

    if catalog_type in ('battery', 'all'):
        result['batteries'] = parse_catalog(CATALOG_URLS['battery'])

    result['repair_cost'] = REPAIR_COST

    return {
        'statusCode': 200,
        'headers': HEADERS_HTTP,
        'body': json.dumps(result, ensure_ascii=False),
    }
