"""
Парсер б/у товаров с resold.ru для магазина Скупка24.
GET / — список товаров (все страницы)
GET /?page=N — конкретная страница
"""

import json
import re
import urllib.request
import gzip as gzip_module

HEADERS_OUT = {'Access-Control-Allow-Origin': '*'}
BASE_URL = 'https://resold.ru/merchant/21615/?sl_org=16548'
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9',
}


def ok(data):
    return {'statusCode': 200, 'headers': HEADERS_OUT, 'body': json.dumps(data, ensure_ascii=False)}


def err(code, msg):
    return {'statusCode': code, 'headers': HEADERS_OUT, 'body': json.dumps({'error': msg}, ensure_ascii=False)}


def fetch_page(page: int) -> str:
    url = BASE_URL + (f'&page={page}' if page > 1 else '')
    req = urllib.request.Request(url, headers=BROWSER_HEADERS)
    with urllib.request.urlopen(req, timeout=25) as resp:
        raw = resp.read()
        try:
            return gzip_module.decompress(raw).decode('utf-8')
        except Exception:
            return raw.decode('utf-8')


def parse_items(html: str) -> list:
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    items = []

    for card in soup.find_all('div', class_=re.compile(r'col-xs-6|col-sm-4|col-md-3')):
        try:
            link_el = card.find('a', href=re.compile(r'/good/'))
            if not link_el:
                continue

            href = link_el['href']
            if href.startswith('/'):
                href = 'https://resold.ru' + href

            # Название
            name_el = card.find(['h4', 'h3', 'span'], class_=re.compile(r'name|title|heading'))
            if not name_el:
                name_el = link_el
            name = name_el.get_text(strip=True)

            # Убираем цену из названия если склеена
            name = re.sub(r'\d[\d\s]*руб.*$', '', name).strip()
            name = re.sub(r'\d[\d\s]*₽.*$', '', name).strip()

            if not name or len(name) < 3:
                continue

            # Цена
            price_el = card.find(class_=re.compile(r'price'))
            if price_el:
                price_match = re.search(r'(\d[\d\s]{1,6})', price_el.get_text())
            else:
                text = card.get_text()
                price_match = re.search(r'(\d[\d\s]{1,6})\s*руб', text)

            price = int(re.sub(r'\D', '', price_match.group(1))) if price_match else None

            # Фото
            img = card.find('img')
            photo = None
            if img:
                src = img.get('data-src') or img.get('src') or ''
                if src and 'noimage' not in src and 'location.png' not in src:
                    photo = ('https://resold.ru' + src) if src.startswith('/') else src

            items.append({'name': name, 'price': price, 'photo': photo, 'link': href})
        except Exception:
            continue

    return items


def get_total_pages(html: str) -> int:
    match = re.search(r'страниц[аеи]?\s*(\d+)\s*из\s*(\d+)', html, re.IGNORECASE)
    if match:
        return int(match.group(2))
    match = re.search(r'из\s+(\d+)', html)
    if match:
        return int(match.group(1))
    pages = re.findall(r'[?&]page=(\d+)', html)
    return max(int(p) for p in pages) if pages else 1


def handler(event: dict, context) -> dict:
    """Парсер б/у товаров с resold.ru (Скупка24 Калуга)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS_OUT, 'body': ''}

    params = event.get('queryStringParameters') or {}
    page_param = params.get('page')

    try:
        if page_param:
            page = int(page_param)
            html = fetch_page(page)
            items = parse_items(html)
            total_pages = get_total_pages(html)
            return ok({'items': items, 'page': page, 'total_pages': total_pages, 'count': len(items)})

        html1 = fetch_page(1)
        items = parse_items(html1)
        total_pages = get_total_pages(html1)

        for p in range(2, min(total_pages + 1, 11)):
            try:
                html = fetch_page(p)
                items += parse_items(html)
            except Exception:
                break

        return ok({'items': items, 'total_pages': total_pages, 'count': len(items)})

    except Exception as e:
        return err(500, str(e))
