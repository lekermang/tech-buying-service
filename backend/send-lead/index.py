import base64
import json
import os
import re
import urllib.parse
import requests
import psycopg2

HEADERS = {'Access-Control-Allow-Origin': '*'}
SCHEMA = 't_p31606708_tech_buying_service'

S3_BUCKET = 'files'
S3_ENDPOINT = 'https://bucket.poehali.dev'

# URL пуш-хаба (см. backend/notify-push)
PUSH_URL = "https://functions.poehali.dev/0a041e7f-92ab-4dbf-86f0-cd09e3eabfbd"


def _send_push_event(title: str, body: str, url: str = "/staff", tag: str = "lead") -> None:
    """Шлёт push сотрудникам через notify-push. Тихо игнорирует ошибки."""
    try:
        admin = os.environ.get('ADMIN_TOKEN', '')
        if not admin:
            return
        requests.post(
            PUSH_URL,
            json={'title': title, 'body': body, 'url': url, 'tag': tag},
            headers={'X-Service-Token': admin, 'Content-Type': 'application/json'},
            timeout=3,
        )
    except Exception:
        pass

CHANNEL_LABELS = {
    'call': '📞 Звонок',
    'phone': '📞 Звонок',
    'tg': '✈️ Telegram',
    'telegram': '✈️ Telegram',
    'max': '💬 MAX',
    'wa': '🟢 WhatsApp',
    'whatsapp': '🟢 WhatsApp',
    'sms': '✉️ SMS',
    'email': '📧 Email',
}


def _s3_client():
    """Boto3 client для S3 (poehali bucket)."""
    try:
        import boto3
        from botocore.client import Config as BotoConfig
        return boto3.client(
            's3',
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            config=BotoConfig(signature_version='s3v4'),
        )
    except Exception as e:
        print(f'[send-lead][S3] init error: {e}')
        return None


def _cdn_url(s3_key: str) -> str:
    access = os.environ.get('AWS_ACCESS_KEY_ID', '')
    return f'https://cdn.poehali.dev/projects/{access}/bucket/{s3_key}'


def upload_lead_photos_to_s3(lead_id: int, photos_b64: list) -> list:
    """Загружает фото в S3 и в lead_photos. Возвращает список dict {s3_key, cdn_url}."""
    if not lead_id or not photos_b64:
        return []
    s3 = _s3_client()
    if s3 is None:
        return []
    saved = []
    for i, b64 in enumerate(photos_b64[:10]):
        try:
            data = base64.b64decode(b64)
            key = f'leads-photos/{lead_id}/{i}.jpg'
            s3.put_object(
                Bucket=S3_BUCKET, Key=key, Body=data,
                ContentType='image/jpeg',
            )
            saved.append({'s3_key': key, 'cdn_url': _cdn_url(key)})
        except Exception as e:
            print(f'[send-lead][S3] upload {i} failed: {e}')
    if not saved:
        return []
    # Запись в lead_photos
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        for ph in saved:
            cur.execute(
                f"INSERT INTO {SCHEMA}.lead_photos (lead_id, s3_key, cdn_url) VALUES (%s, %s, %s)",
                (int(lead_id), ph['s3_key'], ph['cdn_url'])
            )
        conn.commit(); cur.close(); conn.close()
    except Exception as e:
        print(f'[send-lead][S3] db insert error: {e}')
    return saved


def _format_channels(channels) -> str:
    """Формирует строку «📞 Звонок, ✈️ Telegram» из массива каналов."""
    if not channels:
        return ''
    if isinstance(channels, str):
        try:
            channels = json.loads(channels)
        except Exception:
            channels = [c.strip() for c in channels.split(',') if c.strip()]
    if not isinstance(channels, list):
        return ''
    labels = []
    seen = set()
    for ch in channels:
        key = str(ch).strip().lower()
        lbl = CHANNEL_LABELS.get(key)
        if lbl and lbl not in seen:
            seen.add(lbl)
            labels.append(lbl)
    return ', '.join(labels)


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
        sender = os.environ.get('SMSRU_FROM', 'IPMamedov')
        r = requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': digits, 'msg': text, 'from': sender, 'json': 1},
            timeout=8,
        )
        try:
            d = r.json()
            sms_obj = (d.get('sms') or {}).get(digits) or {}
            ok = d.get('status') == 'OK' and sms_obj.get('status') == 'OK'
            if not ok:
                print(f'[SMS][send-lead] to={digits} fail: {d}')
            return ok
        except Exception:
            return True
    except Exception as e:
        print(f'[SMS][send-lead] exception: {e}')
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

    # ── Оценка сайта от клиента (после заявки) ───────────────────────────────
    qs = event.get('queryStringParameters') or {}
    if qs.get('action') == 'rate' or body.get('action') == 'rate':
        try:
            lid = int(body.get('lead_id') or 0)
        except Exception:
            lid = 0
        try:
            rating = int(body.get('rating') or 0)
        except Exception:
            rating = 0
        if not lid or rating < 1 or rating > 5:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Нужны lead_id и оценка 1-5'})}
        liked = (body.get('liked') or '')
        if isinstance(liked, list):
            liked = ', '.join(str(x) for x in liked)
        liked = str(liked).strip()[:500]
        feedback = str(body.get('feedback') or '').strip()[:1000]
        try:
            connr = psycopg2.connect(os.environ['DATABASE_URL'])
            curr = connr.cursor()
            l_e = liked.replace("'", "''")
            f_e = feedback.replace("'", "''")
            l_sql = f"'{l_e}'" if l_e else 'NULL'
            f_sql = f"'{f_e}'" if f_e else 'NULL'
            curr.execute(
                f"UPDATE {SCHEMA}.leads_tracking "
                f"SET site_rating={rating}, site_liked={l_sql}, site_feedback={f_sql}, site_rated_at=NOW() "
                f"WHERE id={lid}"
            )
            connr.commit(); curr.close(); connr.close()
        except Exception as e:
            print(f'[send-lead][rate] error: {e}')
            return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'Не удалось сохранить оценку'})}
        # Уведомляем сотрудников об оценке (особенно если низкая или есть замечания)
        try:
            stars = '⭐' * rating
            note = f"Клиент оценил сайт: {stars} ({rating}/5)"
            if liked:
                note += f"\n👍 Понравилось: {liked}"
            if feedback:
                note += f"\n📝 Замечания: {feedback}"
            _send_push_event(
                title=f"Оценка заявки #{lid}: {rating}/5",
                body=note[:120],
                url=f"/staff?tab=clients&lead={lid}",
                tag=f"rate-{lid}",
            )
        except Exception:
            pass
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    name = body.get('name', '').strip()
    phone = body.get('phone', '').strip()
    category = body.get('category', '').strip()
    desc = body.get('desc', '').strip()
    delivery_info = (body.get('delivery_info') or '').strip()
    photo_b64 = body.get('photo')
    contact_channels = body.get('contact_channels')  # массив ["call","tg","max","wa"]
    device = (body.get('device') or '').strip()

    if not name or not phone:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Имя и телефон обязательны'})}

    token = os.environ['TELEGRAM_BOT_TOKEN']
    main_chat_id = os.environ['TELEGRAM_CHAT_ID']
    client_type = body.get('client_type', '').strip()
    gold_price = body.get('gold_price', '')
    client_price = str(body.get('client_price', '') or '').strip()
    channels_str = _format_channels(contact_channels)

    caption = (
        f"📦 *Новая заявка — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"🏷 *Категория:* {category or '—'}\n"
        + (f"📱 *Устройство:* {device}\n" if device else "")
        + f"📝 *Описание:* {desc or '—'}"
        + (f"\n🚚 *Доставка:* {delivery_info}" if delivery_info else "")
        + (f"\n💵 *Цена клиента:* {client_price} ₽" if client_price and client_price != '0' else "")
        + (f"\n👥 *Тип клиента:* {client_type}" if client_type else "")
        + (f"\n🥇 *Курс золота:* {gold_price} ₽/г" if gold_price else "")
        + (f"\n📡 *Предпочтительный способ связи:* {channels_str}" if channels_str else "")
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
        full_desc = desc + (f'. Доставка: {delivery_info}' if delivery_info else '')
        d_e = full_desc.replace("'", "''")
        src = 'lead'
        if category == 'Золото': src = 'gold'
        elif 'Apple' in (category or ''): src = 'apple'
        elif 'Вакансия' in (category or ''): src = 'jobs'
        elif 'нструмент' in (category or ''): src = 'tools'
        # contact_channels сохраняем как JSON-string, device — как текст
        ch_json = None
        if contact_channels:
            try:
                ch_json = json.dumps(contact_channels, ensure_ascii=False) if not isinstance(contact_channels, str) else contact_channels
            except Exception:
                ch_json = None
        ch_e = ch_json.replace("'", "''") if ch_json else None
        dev_e = device.replace("'", "''") if device else None
        ch_sql = f"'{ch_e}'" if ch_e is not None else 'NULL'
        dev_sql = f"'{dev_e}'" if dev_e is not None else 'NULL'
        cur0.execute(
            f"INSERT INTO {SCHEMA}.leads_tracking "
            f"(source, client_name, client_phone, category, description, contact_channels, device) "
            f"VALUES ('{src}', '{n_e}', '{p_e}', '{c_e}', '{d_e}', {ch_sql}, {dev_sql}) RETURNING id"
        )
        lead_id = cur0.fetchone()[0]
        cur0.execute(
            f"INSERT INTO {SCHEMA}.leads_tracking_log (lead_id, action, note) VALUES ({lead_id}, 'created', '{src}')"
        )
        conn0.commit(); cur0.close(); conn0.close()
        # Push сотрудникам о новой заявке
        _push_body = " · ".join(p for p in [str(category)[:40] if category else None,
                                            str(desc)[:60] if desc else None,
                                            str(name)[:30] if name else None,
                                            str(phone)[:20] if phone else None] if p)
        _send_push_event(
            title=f"Новая заявка #{lead_id}",
            body=_push_body or "Заявка с сайта",
            url=f"/staff?tab=clients&lead={lead_id}",
            tag=f"lead-{lead_id}",
        )
    except Exception:
        lead_id = None

    # Если есть lead_id — добавляем кнопку "Беру в работу" + WhatsApp/Telegram
    photos_b64 = body.get('photos') or ([photo_b64] if photo_b64 else [])

    # Загружаем фото в S3 и получаем CDN-URL для MAX
    cdn_photo_urls = []
    if lead_id and photos_b64:
        try:
            saved = upload_lead_photos_to_s3(lead_id, photos_b64)
            cdn_photo_urls = [p['cdn_url'] for p in saved if p.get('cdn_url')]
        except Exception as up_err:
            print(f'[send-lead][S3] {up_err}')

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

    # 💬 MAX-бот: уведомить клиента о принятии заявки (если он писал нашему MAX-боту)
    if lead_id:
        try:
            max_text = (
                f"✅ *Заявка #{lead_id} принята!*\n"
                + (f"📋 {category}\n" if category else "")
                + (f"📝 {(desc or '')[:200]}\n" if desc else "")
                + (f"💰 Ваша оценка: {client_price} ₽\n" if client_price else "")
                + "\n📞 Менеджер позвонит в течение 15 минут.\n"
                + "Срочные вопросы — пишите прямо сюда, в MAX."
            )
            requests.post(
                'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c?action=send',
                json={'phone': phone, 'text': max_text},
                timeout=6,
            )
        except Exception as max_err:
            print(f'[MAX LEAD] error: {max_err}')

        # 💬 MAX-канал сотрудников: дублируем уведомление о новой заявке с фото
        try:
            staff_text = (
                f"🔔 *Новая заявка #{lead_id}*\n\n"
                f"👤 {name or '—'}\n"
                f"📞 {phone or '—'}\n"
                + (f"📋 {category}\n" if category else "")
                + (f"📱 Устройство: {device}\n" if device else "")
                + (f"📝 {(desc or '')[:300]}\n" if desc else "")
                + (f"💰 Цена клиента: {client_price} ₽\n" if client_price else "")
                + (f"📡 Связь: {channels_str}\n" if channels_str else "")
                + f"\n_Источник: сайт_"
            )
            staff_payload = {'text': staff_text}
            if cdn_photo_urls:
                staff_payload['photo_urls'] = cdn_photo_urls[:3]
            requests.post(
                'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c?action=staff_send',
                json=staff_payload,
                timeout=10,
            )
        except Exception as max_err:
            print(f'[MAX STAFF LEAD] error: {max_err}')

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

    return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'lead_id': lead_id})}