import json
import os
import smtplib
import requests
import psycopg2
from email.mime.text import MIMEText

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'
AD_FOOTER = "\n\n📲 Присоединяйтесь к нам: https://t.me/ProService40"

STATUS_LABEL = {
    'in_progress':   'В работе',
    'waiting_parts': 'Ждём запчасть',
    'ready':         'Готово ✓',
    'done':          'Выдано',
    'cancelled':     'Отменено',
}

STATUS_MSG = {
    'in_progress':   'В работе 🔧 Ваш телефон принят и сейчас в ремонте. Сообщим, как только будет готово.',
    'waiting_parts': 'Ждём запчасть ⏳ Запчасть заказана, ожидаем поставку. Сразу приступим к ремонту.',
    'ready':         'Готово ✓ 🎉 Ваш телефон готов! Можно забирать в любое время.',
    'done':          'Выдано 👍 Спасибо за обращение! Рады видеть вас снова.',
    'cancelled':     'Отменено ❌ К сожалению, ремонт отменён. Свяжитесь с нами для уточнения деталей.',
}


def auth_staff(event: dict) -> bool:
    hdrs = event.get('headers') or {}
    admin_token = os.environ.get('ADMIN_TOKEN', '')
    emp_raw = os.environ.get('EMPLOYEE_TOKENS', '')
    valid = [t.strip() for t in emp_raw.split(',') if t.strip()]
    valid.append(admin_token)
    return hdrs.get('X-Admin-Token') in valid or hdrs.get('X-Employee-Token') in valid


def send_tg(token: str, chat_id, text: str, parse_mode: str = 'Markdown'):
    try:
        requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode},
            timeout=10,
        )
    except Exception:
        pass


def send_sms(phone: str, text: str):
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return
    try:
        requests.get('https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': phone, 'msg': text, 'json': 1}, timeout=10)
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


def save_phone_map(cur, phone: str, chat_id: int, username: str, first_name: str):
    clean = '+' + ''.join(c for c in phone if c.isdigit())
    uname = (username or '').replace("'", "''")
    fname = (first_name or '').replace("'", "''")
    cur.execute(f"""
        INSERT INTO {SCHEMA}.tg_phone_map (phone, chat_id, username, first_name, updated_at)
        VALUES ('{clean}', {chat_id}, '{uname}', '{fname}', NOW())
        ON CONFLICT (phone) DO UPDATE SET
            chat_id=EXCLUDED.chat_id, username=EXCLUDED.username,
            first_name=EXCLUDED.first_name, updated_at=NOW()
    """)
    suffix = clean[-10:]
    cur.execute(f"""
        UPDATE {SCHEMA}.repair_orders
        SET client_tg_chat_id = {chat_id}
        WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}'
          AND client_tg_chat_id IS NULL
    """)


FUNC_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d"


def handler(event: dict, context) -> dict:
    """
    POST action=new_order      — создать заявку, уведомить команду
    POST action=notify         — отправить клиенту статус через бота (staff only)
    POST action=tg_webhook     — webhook Telegram бота @Skypkaklgbot
    GET  ?setup_webhook=1      — зарегистрировать webhook в Telegram
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**HEADERS,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Employee-Token'}, 'body': ''}

    # Регистрация webhook
    params = event.get('queryStringParameters') or {}
    if params.get('setup_webhook'):
        token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        webhook_url = f"{FUNC_URL}?action=tg_webhook"
        resp = requests.post(
            f'https://api.telegram.org/bot{token}/setWebhook',
            json={'url': webhook_url, 'allowed_updates': ['message']},
            timeout=10,
        )
        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps(resp.json(), ensure_ascii=False)}

    raw = event.get('body') or '{}'
    body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    action = body.get('action', '') or params.get('action', 'new_order')
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')

    # ── Telegram Webhook от бота ──────────────────────────────────────────────
    if action == 'tg_webhook':
        message = body.get('message') or {}
        chat_id = message.get('chat', {}).get('id')
        if not chat_id or not token:
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        from_user = message.get('from') or {}
        username = from_user.get('username', '')
        first_name = from_user.get('first_name', '')
        text = (message.get('text') or '').strip()
        contact = message.get('contact')

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()

        if contact and contact.get('phone_number'):
            save_phone_map(cur, contact['phone_number'], chat_id, username, first_name)
            conn.commit()
            cur.close(); conn.close()
            send_tg(token, chat_id,
                f"✅ Телефон {contact['phone_number']} привязан.\n"
                "Теперь вы будете получать уведомления о статусе ремонта.", parse_mode='')
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        if text.startswith('/start'):
            cur.close(); conn.close()
            requests.post(f'https://api.telegram.org/bot{token}/sendMessage', json={
                'chat_id': chat_id,
                'text': (
                    f"Привет, {first_name}! 👋 Я бот Скупка24.\n\n"
                    "Здесь вы будете получать уведомления о статусе ремонта вашего телефона.\n\n"
                    "Нажмите кнопку ниже, чтобы привязать номер 👇"
                ),
                'reply_markup': {
                    'keyboard': [[{'text': '📱 Поделиться номером телефона', 'request_contact': True}]],
                    'resize_keyboard': True, 'one_time_keyboard': True,
                }
            }, timeout=10)
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        if text.startswith('/status'):
            cur.execute(f"""
                SELECT id, repair_type, status, price FROM {SCHEMA}.repair_orders
                WHERE client_tg_chat_id = {chat_id} ORDER BY id DESC LIMIT 1
            """)
            row = cur.fetchone()
            cur.close(); conn.close()
            if row:
                oid, rtype, status, price = row
                slabels = {'new': 'Новая', 'in_progress': 'В работе 🔧',
                    'waiting_parts': 'Ждём запчасть ⏳', 'ready': 'Готово ✓ 🎉',
                    'done': 'Выдано 👍', 'cancelled': 'Отменено ❌'}
                price_str = f"{int(price):,} ₽".replace(',', ' ') if price else '—'
                send_tg(token, chat_id,
                    f"📋 Заявка #{oid}\nТип: {rtype or '—'}\nСтоимость: {price_str}\n"
                    f"Статус: {slabels.get(status, status)}", parse_mode='')
            else:
                cur.close(); conn.close()
                send_tg(token, chat_id,
                    "Заявок не найдено. Сначала привяжите номер телефона командой /start", parse_mode='')
            return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

        cur.close(); conn.close()
        send_tg(token, chat_id,
            "Команды:\n/start — привязать номер\n/status — статус ремонта\n\n"
            f"📲 https://t.me/ProService40", parse_mode='')
        return {'statusCode': 200, 'headers': HEADERS, 'body': '{"ok":true}'}

    # ── Уведомить клиента о статусе ──────────────────────────────────────────
    if action == 'notify':
        if not auth_staff(event):
            return {'statusCode': 401, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Unauthorized'}, ensure_ascii=False)}

        order_id = int(body.get('order_id', 0))
        status_key = str(body.get('status_key', '')).strip()

        if not order_id or status_key not in STATUS_MSG:
            return {'statusCode': 400, 'headers': HEADERS,
                    'body': json.dumps({'error': 'order_id и status_key обязательны'}, ensure_ascii=False)}
        if not token:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'error': 'TELEGRAM_BOT_TOKEN не задан'}, ensure_ascii=False)}

        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, phone, repair_type, repair_amount, client_tg_chat_id
            FROM {SCHEMA}.repair_orders WHERE id = {order_id}
        """)
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': HEADERS,
                    'body': json.dumps({'error': 'Заявка не найдена'}, ensure_ascii=False)}

        _, name, phone, repair_type, repair_amount, chat_id = row

        if not chat_id and phone:
            suffix = ''.join(c for c in phone if c.isdigit())[-10:]
            cur.execute(f"""
                SELECT chat_id FROM {SCHEMA}.tg_phone_map
                WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}' LIMIT 1
            """)
            prow = cur.fetchone()
            if prow:
                chat_id = prow[0]

        cur.close(); conn.close()

        if not chat_id:
            return {'statusCode': 404, 'headers': HEADERS,
                    'body': json.dumps({
                        'error': f'Клиент не писал боту @Skypkaklgbot. Попросите клиента написать /start боту.',
                        'phone': phone,
                    }, ensure_ascii=False)}

        msg = STATUS_MSG[status_key]
        amount_str = f"\nСтоимость ремонта: {int(repair_amount):,} ₽".replace(',', ' ') if repair_amount else ""
        text = f"🔧 *Скупка24 — ремонт #{order_id}*\n\n{msg}{amount_str}{AD_FOOTER}"

        resp = requests.post(
            f'https://api.telegram.org/bot{token}/sendMessage',
            json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'},
            timeout=10,
        )
        tg_data = resp.json()
        if tg_data.get('ok'):
            return {'statusCode': 200, 'headers': HEADERS,
                    'body': json.dumps({'ok': True, 'sent_to': name, 'status': STATUS_LABEL[status_key]}, ensure_ascii=False)}
        else:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'error': tg_data.get('description', 'Ошибка Telegram')}, ensure_ascii=False)}

    # ── Создать новую заявку ─────────────────────────────────────────────────
    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    model = body.get('model', '').strip()
    repair_type = body.get('repair_type', '').strip()
    price = body.get('price')
    comment = body.get('comment', '').strip()

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS,
                'body': json.dumps({'error': 'Имя и телефон обязательны'}, ensure_ascii=False)}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # Ищем chat_id по телефону
    suffix = ''.join(c for c in phone if c.isdigit())[-10:]
    cur.execute(f"""
        SELECT chat_id FROM {SCHEMA}.tg_phone_map
        WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = '{suffix}' LIMIT 1
    """)
    prow = cur.fetchone()
    client_chat_id = prow[0] if prow else None

    cur.execute(
        f"INSERT INTO {SCHEMA}.repair_orders (name, phone, model, repair_type, price, comment, client_tg_chat_id) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
        (name, phone, model or None, repair_type or None, price, comment or None, client_chat_id)
    )
    order_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    price_str = f'{int(price):,} ₽'.replace(',', ' ') if price else 'не определена'
    act_text = (
        f"📋 *АКТ ПРИЁМКИ НА РЕМОНТ №{order_id}*\n"
        f"_Сервисный центр Скупка24, г. Калуга_\n\n"
        f"*Клиент:* {name}\n"
        f"*Телефон:* {phone}\n"
        f"*Устройство:* {model or '—'}\n"
        f"*Вид работ:* {repair_type or '—'}\n"
        f"*Предв. стоимость:* {price_str}\n"
        + (f"*Комментарий:* {comment}\n" if comment else "")
        + "\n*⚠️ КЛИЕНТ УВЕДОМЛЁН И СОГЛАСЕН:*\n\n"
        "1. После контакта с водой аппарат может полностью выйти из строя при любом виде ремонта (чистка, прогрев, пайка). Мастерская не обязана его восстанавливать.\n\n"
        "2. Компонентная пайка сопряжена с риском безвозвратного повреждения платы. Если телефон перестал включаться в процессе ремонта — работа оплачивается в полном объёме.\n\n"
        "3. При снятии дисплея возможно его повреждение (полосы, артефакты, отказ включения). Замена дисплея производится за счёт клиента.\n\n"
        "4. Все пользовательские данные (фото, контакты и др.) могут быть безвозвратно утеряны. Мастерская не занимается их восстановлением. Клиент самостоятельно создал резервную копию либо согласен на потерю данных.\n\n"
        "5. Гарантия на результат ремонта не предоставляется. В худшем случае устройство будет возвращено в нерабочем состоянии; клиент оплачивает диагностику и уже выполненные работы.\n\n"
        f"*Подпись клиента:* ______________\n\n"
        f"🔑 ID заявки: `{order_id}`"
        + (f"\n✅ Клиент в TG" if client_chat_id else "")
    )
    tg_text = (
        f"🔧 *Заявка #{order_id} на ремонт — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n📞 *Телефон:* {phone}\n"
        f"📱 *Модель:* {model or '—'}\n🛠 *Тип ремонта:* {repair_type or '—'}\n"
        f"💰 *Стоимость:* {price_str}"
        + (f"\n📝 *Комментарий:* {comment}" if comment else "")
        + f"\n\n🔑 ID заявки: `{order_id}`"
        + (f"\n✅ Клиент в TG" if client_chat_id else "")
    )

    if token:
        conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
        cur2 = conn2.cursor()
        cur2.execute(
            f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active=true AND notify_repair=true"
        )
        chat_ids = [r[0] for r in cur2.fetchall()]
        cur2.close(); conn2.close()
        default_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
        if default_chat and default_chat not in chat_ids:
            chat_ids.insert(0, default_chat)
        for cid in chat_ids:
            send_tg(token, cid, tg_text)
            send_tg(token, cid, act_text)

    send_sms('+79929990333', f'Заявка #{order_id} на ремонт. {name}, {phone}. {repair_type or model or ""}. Скупка24')
    send_email('lekermanya@yandex.ru', f'Заявка #{order_id} на ремонт — Скупка24',
        f"Заявка #{order_id}\nИмя: {name}\nТелефон: {phone}\nМодель: {model}\nТип: {repair_type}\nСтоимость: {price_str}")

    return {'statusCode': 200, 'headers': HEADERS,
            'body': json.dumps({'ok': True, 'order_id': order_id}, ensure_ascii=False)}