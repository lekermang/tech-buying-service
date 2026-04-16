import base64
import json
import os
import requests
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

def send_tg(token: str, chat_id: str, caption: str, photos_b64: list):
    tg_url = f'https://api.telegram.org/bot{token}'
    if photos_b64:
        if len(photos_b64) == 1:
            photo_bytes = base64.b64decode(photos_b64[0])
            requests.post(
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
            requests.post(
                f'{tg_url}/sendMediaGroup',
                data={'chat_id': chat_id, 'media': json.dumps(media)},
                files=files_dict,
                timeout=60
            )
    else:
        requests.post(
            f'{tg_url}/sendMessage',
            json={'chat_id': chat_id, 'text': caption, 'parse_mode': 'Markdown'},
            timeout=10
        )


def handler(event: dict, context) -> dict:
    """Отправка заявки (быстрой оценки) с сайта Скупки24 в Telegram — всем получателям"""

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
    main_chat_id = os.environ['TELEGRAM_CHAT_ID']

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

    # Отправляем в основной чат
    send_tg(token, main_chat_id, caption, photos_b64)

    # Получаем всех активных получателей из БД и шлём им
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active = true"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        for row in rows:
            recipient_chat_id = row[0]
            if recipient_chat_id and recipient_chat_id != main_chat_id:
                send_tg(token, recipient_chat_id, caption, photos_b64)
    except Exception:
        pass

    # Дополнительно шлём @PluXan4ik если задан chat_id
    pluxan_chat_id = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    if pluxan_chat_id and pluxan_chat_id != main_chat_id:
        try:
            send_tg(token, pluxan_chat_id, caption, photos_b64)
        except Exception:
            pass

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}