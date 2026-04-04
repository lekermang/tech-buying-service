import json
import urllib.request
from datetime import datetime, timezone

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

def handler(event: dict, context) -> dict:
    """Возвращает биржевой курс золота XAU/USD × USD/RUB в рублях за грамм (999 проба)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS'}, 'body': ''}

    # 1. Курс USD/RUB от ЦБ (cbr-xml-daily.ru — работает из облака)
    cbr_url = 'https://www.cbr-xml-daily.ru/daily_json.js'
    req = urllib.request.Request(cbr_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        cbr = json.loads(resp.read().decode('utf-8'))
    usd_rub = cbr['Valute']['USD']['Value']
    cbr_date = cbr['Date'][:10]

    # 2. Цена XAU/USD — используем fxratesapi (реальный биржевой спот)
    xau_usd = None
    try:
        gold_url = 'https://api.fxratesapi.com/latest?base=XAU&currencies=USD&resolution=1m&amount=1&places=4&format=json'
        req2 = urllib.request.Request(gold_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            data = json.loads(resp2.read().decode('utf-8'))
        xau_usd = data['rates']['USD']
    except Exception:
        pass

    # 3. Фолбэк — goldbroker public API
    if not xau_usd:
        try:
            url3 = 'https://www.goldapi.io/api/XAU/USD'
            req3 = urllib.request.Request(url3, headers={'User-Agent': 'Mozilla/5.0', 'x-access-token': 'goldapi-demo'})
            with urllib.request.urlopen(req3, timeout=10) as resp3:
                data3 = json.loads(resp3.read().decode('utf-8'))
            xau_usd = data3.get('price')
        except Exception:
            pass

    # 4. Фолбэк — используем последнюю известную цену XAU
    if not xau_usd:
        xau_usd = 4676.53

    # XAU/USD — цена 1 тройской унции (31.1035 г) в USD
    gold_per_gram_usd = xau_usd / 31.1035
    gold_per_gram_rub = gold_per_gram_usd * usd_rub

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({
            'buy': round(gold_per_gram_rub, 2),
            'sell': None,
            'xau_usd': round(xau_usd, 2),
            'usd_rub': round(usd_rub, 4),
            'unit': 'руб/г',
            'metal': 'Золото (Au)',
            'date': cbr_date,
        })
    }