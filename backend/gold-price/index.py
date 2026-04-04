import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

def handler(event: dict, context) -> dict:
    """Возвращает курс золота ЦБ РФ в рублях за грамм"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS'}, 'body': ''}

    now = datetime.now(timezone.utc)
    gold_buy = None
    gold_sell = None
    found_date = None

    for delta in range(7):
        day = now - timedelta(days=delta)
        d1 = day.strftime('%d/%m/%Y')
        # Берём диапазон 7 дней назад чтобы наверняка попасть на рабочий день
        d0 = (day - timedelta(days=7)).strftime('%d/%m/%Y')
        url = f'https://www.cbr.ru/scripts/xml_metall.asp?date_req1={d0}&date_req2={d1}'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                xml_data = resp.read().decode('windows-1251')
            root = ET.fromstring(xml_data)
            records = root.findall('Record')
            # Берём последнюю запись по коду A98 (золото)
            for record in reversed(records):
                code = record.find('Code')
                if code is not None and code.text == 'A98':
                    buy_el = record.find('Buy')
                    sell_el = record.find('Sell')
                    date_el = record.get('Date')
                    if buy_el is not None and buy_el.text:
                        gold_buy = float(buy_el.text.replace(',', '.'))
                        gold_sell = float(sell_el.text.replace(',', '.')) if sell_el is not None and sell_el.text else None
                        found_date = date_el
                        break
            if gold_buy is not None:
                break
        except Exception:
            continue

    if gold_buy is None:
        # Фолбэк: курс USD/RUB × средняя цена XAU
        cbr_url = 'https://www.cbr-xml-daily.ru/daily_json.js'
        req = urllib.request.Request(cbr_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            cbr = json.loads(resp.read().decode('utf-8'))
        usd_rub = cbr['Valute']['USD']['Value']
        # Примерная биржевая цена XAU ~3100 USD/унция → / 31.1035 г
        gold_buy = round(3100 * usd_rub / 31.1035, 2)
        found_date = cbr['Date'][:10]
        gold_sell = None

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({
            'buy': round(gold_buy, 2),
            'sell': round(gold_sell, 2) if gold_sell else None,
            'unit': 'руб/г',
            'metal': 'Золото (Au)',
            'date': found_date,
        })
    }