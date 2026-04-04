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
    photo_b64 = body.get('photo')  # обратная совместимость

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'})}

    token = os.environ['TELEGRAM_BOT_TOKEN']
    chat_id = os.environ['TELEGRAM_CHAT_ID']
    tg_url = f'https://api.telegram.org/bot{token}'

    client_type = body.get('client_type', '').strip()
    gold_price = body.get('gold_price', '')

    caption = (
        f"📦 *Новая заявка — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"🏷 *Категория:* {category or '—'}\n"
        f"📝 *Описание:* {desc or '—'}"
        + (f"\n👥 *Тип клиента:* {client_type}" if client_type else "")
        + (f"\n🥇 *Курс золота:* {gold_price} ₽/г" if gold_price else "")
    )

    photos_b64 = body.get('photos') or ([photo_b64] if photo_b64 else [])

    if photos_b64:
        if len(photos_b64) == 1:
            photo_bytes = base64.b64decode(photos_b64[0])
            resp = requests.post(
                f'{tg_url}/sendPhoto',
                data={'chat_id': chat_id, 'caption': caption, 'parse_mode': 'Markdown'},
                files={'photo': ('photo.jpg', photo_bytes, 'image/jpeg')},
                timeout=30
            )
        else:
            media = []
            files_dict = {}
            for i, b64 in enumerate(photos_b64[:5]):
                key = f'photo{i}'
                files_dict[key] = (f'{key}.jpg', base64.b64decode(b64), 'image/jpeg')
                item = {'type': 'photo', 'media': f'attach://{key}'}
                if i == 0:
                    item['caption'] = caption
                    item['parse_mode'] = 'Markdown'
                media.append(item)
            resp = requests.post(
                f'{tg_url}/sendMediaGroup',
                data={'chat_id': chat_id, 'media': json.dumps(media)},
                files=files_dict,
                timeout=60
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