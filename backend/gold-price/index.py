import json
import os
import urllib.request

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}


def handler(event: dict, context) -> dict:
    """Биржевой курс золота 999 пробы + история за 7 дней"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'GET, OPTIONS'}, 'body': ''}

    # 1. Курс USD/RUB от ЦБ
    cbr_url = 'https://www.cbr-xml-daily.ru/daily_json.js'
    req = urllib.request.Request(cbr_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        cbr = json.loads(resp.read().decode('utf-8'))
    usd_rub = cbr['Valute']['USD']['Value']
    cbr_date = cbr['Date'][:10]

    # 2. Цена XAU/USD — fxratesapi
    xau_usd = None
    try:
        gold_url = 'https://api.fxratesapi.com/latest?base=XAU&currencies=USD&resolution=1m&amount=1&places=4&format=json'
        req2 = urllib.request.Request(gold_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            data = json.loads(resp2.read().decode('utf-8'))
        xau_usd = data['rates']['USD']
    except Exception:
        pass

    # 3. Фолбэк — goldapi
    if not xau_usd:
        try:
            url3 = 'https://www.goldapi.io/api/XAU/USD'
            req3 = urllib.request.Request(url3, headers={'User-Agent': 'Mozilla/5.0', 'x-access-token': 'goldapi-demo'})
            with urllib.request.urlopen(req3, timeout=10) as resp3:
                data3 = json.loads(resp3.read().decode('utf-8'))
            xau_usd = data3.get('price')
        except Exception:
            pass

    if not xau_usd:
        xau_usd = 4676.53

    gold_per_gram_usd = xau_usd / 31.1035
    gold_per_gram_rub = round(gold_per_gram_usd * usd_rub, 2)

    # 4. История и настройки из БД
    history = []
    gold_settings = {
        'retail_discount': 15,
        'retail_deduction': 0,
        'wholesale_discount': 10,
        'wholesale_deduction': 0,
        'bulk_discount': 15,
        'bulk_deduction': 50,
    }
    try:
        import psycopg2
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        # Сохраняем не чаще раза в час
        cur.execute(
            f"SELECT id FROM {SCHEMA}.gold_price_history "
            f"WHERE recorded_at > NOW() - INTERVAL '1 hour' LIMIT 1"
        )
        if not cur.fetchone():
            cur.execute(
                f"INSERT INTO {SCHEMA}.gold_price_history (price_rub, xau_usd, usd_rub) VALUES (%s, %s, %s)",
                (gold_per_gram_rub, round(xau_usd, 2), round(usd_rub, 4))
            )
            conn.commit()

        # История за 7 дней — одна точка в день
        cur.execute(
            f"""
            SELECT
                DATE(recorded_at AT TIME ZONE 'Europe/Moscow') AS day,
                AVG(price_rub)::NUMERIC(12,2) AS avg_price
            FROM {SCHEMA}.gold_price_history
            WHERE recorded_at > NOW() - INTERVAL '8 days'
            GROUP BY day
            ORDER BY day ASC
            LIMIT 8
            """
        )
        rows = cur.fetchall()
        history = [{'date': str(r[0]), 'price': float(r[1])} for r in rows]

        # Настройки скидок
        cur.execute(
            f"SELECT key, value FROM {SCHEMA}.settings WHERE key LIKE 'gold_%'"
        )
        for key, value in cur.fetchall():
            short = key.replace('gold_', '')
            gold_settings[short] = float(value)

        cur.close()
        conn.close()
    except Exception:
        pass

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({
            'buy': gold_per_gram_rub,
            'sell': None,
            'xau_usd': round(xau_usd, 2),
            'usd_rub': round(usd_rub, 4),
            'unit': 'руб/г',
            'metal': 'Золото (Au)',
            'date': cbr_date,
            'history': history,
            'settings': gold_settings,
        })
    }