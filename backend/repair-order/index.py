import json
import os
import smtplib
import requests
import psycopg2
from email.mime.text import MIMEText

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'


def send_sms(phone: str, text: str):
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return
    try:
        requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': phone, 'msg': text, 'json': 1},
            timeout=10,
        )
    except Exception:
        pass


def send_email(to: str, subject: str, body: str):
    login = os.environ.get('YANDEX_SMTP_LOGIN', '')
    password = os.environ.get('YANDEX_SMTP_PASSWORD', '')
    if not login or not password:
        return
    try:
        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = login
        msg['To'] = to
        with smtplib.SMTP_SSL('smtp.yandex.ru', 465) as server:
            server.login(login, password)
            server.sendmail(login, [to], msg.as_string())
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Создание заявки на ремонт: сохраняет в БД, отправляет в Telegram, SMS и email, возвращает ID заявки"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {**HEADERS, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'},
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
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False)}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment) "
        "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
        (name, phone, model or None, repair_type or None, price, comment or None)
    )
    order_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    price_str = f'{int(price):,} ₽'.replace(',', ' ') if price else 'не определена'

    tg_text = (
        f"🔧 *Заявка #{order_id} на ремонт — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"📱 *Модель:* {model or '—'}\n"
        f"🛠 *Тип ремонта:* {repair_type or '—'}\n"
        f"💰 *Стоимость:* {price_str}"
        + (f"\n📝 *Комментарий:* {comment}" if comment else "")
        + f"\n\n🔑 ID заявки: `{order_id}`"
    )

    plain_text = (
        f"Заявка #{order_id} на ремонт — Скупка24\n\n"
        f"Имя: {name}\n"
        f"Телефон: {phone}\n"
        f"Модель: {model or '—'}\n"
        f"Тип ремонта: {repair_type or '—'}\n"
        f"Стоимость: {price_str}"
        + (f"\nКомментарий: {comment}" if comment else "")
    )

    if token:
        conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
        cur2 = conn2.cursor()
        cur2.execute(
            "SELECT telegram_chat_id FROM t_p31606708_tech_buying_service.notification_recipients WHERE is_active=true AND notify_repair=true"
        )
        rows2 = cur2.fetchall()
        cur2.close(); conn2.close()
        chat_ids = [r[0] for r in rows2]
        default_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
        if default_chat and default_chat not in chat_ids:
            chat_ids.insert(0, default_chat)
        for cid in chat_ids:
            try:
                requests.post(
                    f'https://api.telegram.org/bot{token}/sendMessage',
                    json={'chat_id': cid, 'text': tg_text, 'parse_mode': 'Markdown'},
                    timeout=10,
                )
            except Exception:
                pass

    send_sms('+79929990333', f'Заявка #{order_id} на ремонт. {name}, {phone}. {repair_type or model or ""}. Скупка24')
    send_email('lekermanya@yandex.ru', f'Заявка #{order_id} на ремонт — Скупка24', plain_text)

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'order_id': order_id})}
