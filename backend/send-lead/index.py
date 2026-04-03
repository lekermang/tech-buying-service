import base64
import json
import os
import requests

HEADERS = {'Access-Control-Allow-Origin': '*'}

def handler(event: dict, context) -> dict:
    """Отправка заявки с сайта Скупки24 в Telegram (с фото)"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
            'body': ''
        }

    raw_body = event.get('body') or '{}'
    body = json.loads(raw_body) if isinstance(raw_body, str) else (raw_body or {})
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    category = body.get('category', '').strip()
    desc = body.get('desc', '').strip()
    photo_b64 = body.get('photo')

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'})}

    token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']
    tg_url = f'https://api.telegram.org/bot{token}'

    caption = (
        f"📦 *Новая заявка — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"🏷 *Категория:* {category or '—'}\n"
        f"📝 *Описание:* {desc or '—'}"
    )

    if photo_b64:
        photo_bytes = base64.b64decode(photo_b64)
        resp = requests.post(
            f'{tg_url}/sendPhoto',
            data={'chat_id': chat_id, 'caption': caption, 'parse_mode': 'Markdown'},
            files={'photo': ('photo.jpg', photo_bytes, 'image/jpeg')},
            timeout=30
        )
    else:
        resp = requests.post(
            f'{tg_url}/sendMessage',
            json={'chat_id': chat_id, 'text': caption, 'parse_mode': 'Markdown'},
            timeout=10
        )

    if resp.status_code != 200:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'Ошибка отправки'})}

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}