import json
import os
import requests

HEADERS = {'Access-Control-Allow-Origin': '*'}


def handler(event: dict, context) -> dict:
    """Отправка заявки на ремонт телефона в Telegram (Скупка24)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                **HEADERS,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})

    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    model = body.get('model', '').strip()
    repair_type = body.get('repair_type', '').strip()
    price = body.get('price')
    comment = body.get('comment', '').strip()

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'})}

    token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']

    price_str = f'{price:,} ₽'.replace(',', ' ') if price else 'не определена'

    text = (
        f"🔧 *Заявка на ремонт — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"📱 *Модель:* {model or '—'}\n"
        f"🛠 *Тип ремонта:* {repair_type or '—'}\n"
        f"💰 *Стоимость:* {price_str}"
        + (f"\n📝 *Комментарий:* {comment}" if comment else "")
    )

    resp = requests.post(
        f'https://api.telegram.org/bot{token}/sendMessage',
        json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
        timeout=10,
    )

    if resp.status_code != 200:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'Ошибка отправки'})}

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}
