import base64
import json
import os
import re
import urllib.parse
import requests
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'


def normalize_phone(phone: str) -> str:
    """Нормализация телефона в формат 7XXXXXXXXXX (только цифры, 11 знаков)."""
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    return digits


def build_contact_keyboard(phone: str, client_name: str = '', model: str = '') -> dict:
    """Inline-клавиатура: WhatsApp / Telegram — только https-ссылки (tel:/sms: Telegram не разрешает)."""
    digits = normalize_phone(phone)
    if not digits or len(digits) < 11:
        return None
    plus_phone = f'+{digits}'
    greet_name = (client_name.split()[0] if client_name else '').strip()
    hello = f'Здравствуйте, {greet_name}!' if greet_name else 'Здравствуйте!'
    body = hello + ' Вы оставляли заявку в Скупка24'
    if model:
        body += f' ({model})'
    body += '. Подскажите, удобно сейчас обсудить?'
    enc = urllib.parse.quote(body)
    return {
        'inline_keyboard': [[
            {'text': '💬 WhatsApp', 'url': f'https://wa.me/{digits}?text={enc}'},
            {'text': '✈️ Telegram', 'url': f'https://t.me/{plus_phone}'},
        ]]
    }


def build_take_keyboard(lead_id: int, phone: str, client_name: str = '', model: str = '') -> dict:
    """Кнопка 'Беру в работу' (callback) + WhatsApp/Telegram (https)."""
    digits = normalize_phone(phone)
    plus_phone = f'+{digits}' if digits else ''
    greet_name = (client_name.split()[0] if client_name else '').strip()
    hello = f'Здравствуйте, {greet_name}!' if greet_name else 'Здравствуйте!'
    body = hello + ' Вы оставляли заявку в Скупка24'
    if model:
        body += f' ({model})'
    body += '. Подскажите, удобно сейчас обсудить?'
    enc = urllib.parse.quote(body)
    rows = [[{'text': '🎯 Беру в работу', 'callback_data': f'take:{lead_id}'}]]
    if digits and len(digits) == 11:
        rows.append([
            {'text': '💬 WhatsApp', 'url': f'https://wa.me/{digits}?text={enc}'},
            {'text': '✈️ Telegram', 'url': f'https://t.me/{plus_phone}'},
        ])
    return {'inline_keyboard': rows}


def send_sms_confirmation(phone: str, lead_id: int, name: str = ''):
    """SMS клиенту с подтверждением заявки через sms.ru."""
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return False
    digits = normalize_phone(phone)
    if not digits or len(digits) < 11:
        return False
    text = f"Скупка24: заявка #{lead_id} принята! Перезвоним в течение 15 мин. Срочно: 88005553535"
    try:
        requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': digits, 'msg': text, 'json': 1},
            timeout=8,
        )
        return True
    except Exception:
        return False


def send_tg_text(token: str, chat_id: str, text: str, reply_markup: dict = None):
    """Отправка с fallback. Возвращает message_id или None."""
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    try:
        payload = {'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}
        if reply_markup:
            payload['reply_markup'] = json.dumps(reply_markup)
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            try: return r.json().get('result', {}).get('message_id')
            except Exception: return None
        r2 = requests.post(url, json={'chat_id': chat_id, 'text': text, 'parse_mode': 'Markdown'}, timeout=10)
        if r2.status_code == 200:
            try: return r2.json().get('result', {}).get('message_id')
            except Exception: return None
        r3 = requests.post(url, json={'chat_id': chat_id, 'text': text}, timeout=10)
        if r3.status_code == 200:
            try: return r3.json().get('result', {}).get('message_id')
            except Exception: return None
    except Exception:
        try:
            requests.post(url, json={'chat_id': chat_id, 'text': text}, timeout=10)
        except Exception:
            pass
    return None


def send_tg_photos(token: str, chat_id: str, caption: str, photos_b64: list, reply_markup: dict = None):
    tg_url = f'https://api.telegram.org/bot{token}'
    photo_ok = False
    try:
        if len(photos_b64) == 1:
            photo_bytes = base64.b64decode(photos_b64[0])
            data = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'Markdown'}
            if reply_markup:
                data['reply_markup'] = json.dumps(reply_markup)
            r = requests.post(
                f'{tg_url}/sendPhoto',
                data=data,
                files={'photo': ('photo.jpg', photo_bytes, 'image/jpeg')},
                timeout=30
            )
            photo_ok = (r.status_code == 200)
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
            r = requests.post(
                f'{tg_url}/sendMediaGroup',
                data={'chat_id': chat_id, 'media': json.dumps(media)},
                files=files_dict,
                timeout=45
            )
            photo_ok = (r.status_code == 200)
            # У альбома нельзя прикрепить inline-кнопки — отправим отдельным сообщением
            if photo_ok and reply_markup:
                send_tg_text(token, chat_id, '👇 Быстро связаться с клиентом:', reply_markup)
    except Exception:
        photo_ok = False
    # Гарантируем хотя бы текстовое уведомление, если фото не прошли
    if not photo_ok:
        send_tg_text(token, chat_id, caption, reply_markup)


def get_all_recipients(main_chat_id: str) -> list:
    recipients = [main_chat_id]
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active = true"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        for row in rows:
            cid = row[0]
            if cid and cid not in recipients:
                recipients.append(cid)
    except Exception:
        pass
    pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    if pluxan and pluxan not in recipients:
        recipients.append(pluxan)
    return recipients


def handler(event: dict, context) -> dict:
    """Отправка быстрой оценки с сайта Скупки24 в Telegram — всем получателям"""

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
    client_price = str(body.get('client_price', '') or '').strip()

    caption = (
        f"📦 *Новая заявка — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"🏷 *Категория:* {category or '—'}\n"
        f"📝 *Описание:* {desc or '—'}"
        + (f"\n💵 *Цена клиента:* {client_price} ₽" if client_price and client_price != '0' else "")
        + (f"\n👥 *Тип клиента:* {client_type}" if client_type else "")
        + (f"\n🥇 *Курс золота:* {gold_price} ₽/г" if gold_price else "")
    )

    # ── Регистрируем заявку в системе трекинга (lead_id для кнопки "Беру") ───
    lead_id = None
    try:
        conn0 = psycopg2.connect(os.environ['DATABASE_URL'])
        cur0 = conn0.cursor()
        # SQL injection защита: используем параметры через replace
        n_e = name.replace("'", "''")
        p_e = phone.replace("'", "''")
        c_e = (category or '').replace("'", "''")
        d_e = (desc or '').replace("'", "''")
        src = 'lead'
        if category == 'Золото': src = 'gold'
        elif 'Apple' in (category or ''): src = 'apple'
        elif 'Вакансия' in (category or ''): src = 'jobs'
        elif 'нструмент' in (category or ''): src = 'tools'
        cur0.execute(
            f"INSERT INTO {SCHEMA}.leads_tracking (source, client_name, client_phone, category, description) "
            f"VALUES ('{src}', '{n_e}', '{p_e}', '{c_e}', '{d_e}') RETURNING id"
        )
        lead_id = cur0.fetchone()[0]
        cur0.execute(
            f"INSERT INTO {SCHEMA}.leads_tracking_log (lead_id, action, note) VALUES ({lead_id}, 'created', '{src}')"
        )
        conn0.commit(); cur0.close(); conn0.close()
    except Exception:
        lead_id = None

    # Если есть lead_id — добавляем кнопку "Беру в работу" + WhatsApp/Telegram
    photos_b64 = body.get('photos') or ([photo_b64] if photo_b64 else [])
    recipients = get_all_recipients(main_chat_id)
    if lead_id:
        kb = build_take_keyboard(lead_id, phone, name, category or desc)
        # Префикс с номером заявки в caption
        caption = f"📦 *Новая заявка #{lead_id} — Скупка24*\n\n" + caption.split('\n\n', 1)[1] if '\n\n' in caption else caption
    else:
        kb = build_contact_keyboard(phone, name, category or desc)

    msg_ids = {}
    if photos_b64:
        send_tg_photos(token, main_chat_id, caption, photos_b64, kb)
        for cid in recipients[1:]:
            mid = send_tg_text(token, cid, caption, kb)
            if mid: msg_ids[str(cid)] = mid
    else:
        for cid in recipients:
            mid = send_tg_text(token, cid, caption, kb)
            if mid: msg_ids[str(cid)] = mid

    # Сохраняем message_ids чтобы потом можно было отредактировать сообщения
    if lead_id and msg_ids:
        try:
            conn0 = psycopg2.connect(os.environ['DATABASE_URL'])
            cur0 = conn0.cursor()
            cur0.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET tg_message_ids='{json.dumps(msg_ids).replace(chr(39), chr(39)+chr(39))}'::jsonb, updated_at=NOW() WHERE id={lead_id}"
            )
            conn0.commit(); cur0.close(); conn0.close()
        except Exception:
            pass

    # SMS клиенту с подтверждением
    if lead_id:
        try:
            send_sms_confirmation(phone, lead_id, name)
        except Exception:
            pass

    # Если заявка на золото — сохраняем в gold_orders
    if category == 'Золото':
        try:
            gold_price_val = body.get('gold_price', '')
            weight_raw = body.get('weight', '')
            purity_raw = body.get('purity', '')
            total_price = body.get('total_price')

            name_e = name.replace("'", "''")
            phone_e = phone.replace("'", "''")
            desc_e = desc.replace("'", "''")
            item_name_e = str(purity_raw or '').replace("'", "''")
            gold_price_e = str(gold_price_val or '').replace("'", "''")

            try:
                weight_f = float(weight_raw) if weight_raw else None
            except Exception:
                weight_f = None

            try:
                buy_price_i = int(float(total_price)) if total_price else None
            except Exception:
                buy_price_i = None

            weight_sql = str(weight_f) if weight_f is not None else 'NULL'
            buy_sql = str(buy_price_i) if buy_price_i is not None else 'NULL'
            comment_parts = []
            if desc_e:
                comment_parts.append(desc_e)
            if gold_price_e:
                comment_parts.append(f'Курс: {gold_price_e}')
            comment_sql = '; '.join(comment_parts).replace("'", "''")

            conn2 = psycopg2.connect(os.environ['DATABASE_URL'])
            cur2 = conn2.cursor()
            cur2.execute(f"""
                INSERT INTO {SCHEMA}.gold_orders
                    (name, phone, item_name, weight, purity, buy_price, comment)
                VALUES
                    ('{name_e}', '{phone_e}',
                     'Золото (заявка с сайта)',
                     {weight_sql},
                     '{item_name_e}',
                     {buy_sql},
                     '{comment_sql}')
            """)
            conn2.commit()
            cur2.close()
            conn2.close()
        except Exception:
            pass

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}