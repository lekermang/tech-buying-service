"""
Leads Monitor — единая функция для отслеживания и эскалации заявок.

Маршруты:
  GET  ?action=hot          — список горящих заявок (для Staff-панели)
  GET  ?action=stats        — статистика по заявкам за день
  POST ?action=take         — сотрудник берёт заявку в работу (body: {lead_id, owner_name})
  POST ?action=answered     — отметить, что клиенту ответили (body: {lead_id})
  POST ?action=close        — закрыть заявку (body: {lead_id})
  POST ?action=tg_callback  — webhook Telegram для inline-кнопок
  POST ?action=pulse        — cron-метроном (каждую минуту): эскалация + SMS клиенту через 15 мин
  POST ?action=morning_digest — утренняя сводка в TG (cron 9:00)
"""
import json
import os
import re
import urllib.parse
from datetime import datetime, timedelta
import requests
import psycopg2
import psycopg2.extras

SCHEMA = 't_p31606708_tech_buying_service'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Employee-Token',
    'Content-Type': 'application/json'
}


def _ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, ensure_ascii=False, default=str)}


def _err(status, msg):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'ok': False, 'error': msg}, ensure_ascii=False)}


def _esc(s):
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"


def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _normalize_phone(phone):
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    return digits


# ───────── Zvonok (робот-звонок клиенту) ─────────
def get_branches():
    """Список активных филиалов из БД."""
    try:
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT name, address, phone, hours, specialization "
            f"FROM {SCHEMA}.zvonok_branches WHERE is_active=TRUE ORDER BY sort_order, id"
        )
        rows = [dict(x) for x in cur.fetchall()]
        cur.close(); conn.close()
        return rows
    except Exception:
        return []


def call_zvonok(purpose, phone, campaign_id, related_type=None, related_id=None, extra_vars=None):
    """Отправляет звонок через Zvonok. Возвращает (ok, info)."""
    pub_key = os.environ.get('ZVONOK_PUBLIC_KEY', '')
    if not pub_key or not campaign_id:
        return False, {'error': 'zvonok_not_configured'}
    digits = _normalize_phone(phone)
    if len(digits) != 11:
        return False, {'error': 'bad_phone'}
    # Анти-дубль: не звоним повторно по одному и тому же поводу за 30 минут
    try:
        cn = _conn(); cu = cn.cursor()
        if related_type and related_id:
            cu.execute(
                f"SELECT 1 FROM {SCHEMA}.zvonok_log "
                f"WHERE related_type={_esc(related_type)} AND related_id={int(related_id)} "
                f"AND purpose={_esc(purpose)} AND success=TRUE "
                f"AND created_at > NOW() - INTERVAL '30 minutes' LIMIT 1"
            )
            if cu.fetchone():
                cu.close(); cn.close()
                return False, {'error': 'already_called_recently'}
        cu.close(); cn.close()
    except Exception:
        pass
    # Параметры. Zvonok принимает доп. переменные через text_param/var_/ext_*. Передаём всё подряд:
    params = {
        'public_key': pub_key,
        'campaign_id': str(campaign_id),
        'phone': '+' + digits,
    }
    if extra_vars:
        for k, v in extra_vars.items():
            params[f'var_{k}'] = str(v)[:200]
            # дублируем через ext_attrs для совместимости
            params[f'ext_{k}'] = str(v)[:200]
    success = False
    err_text = None
    api_resp = {}
    try:
        r = requests.get(
            'https://zvonok.com/manager/cabapi_external/api/v1/phones/call/',
            params=params, timeout=15,
        )
        try:
            api_resp = r.json()
        except Exception:
            api_resp = {'raw': r.text[:500]}
        # Успех: есть call_id или status=ok
        if api_resp.get('call_id') or api_resp.get('id') or api_resp.get('status') in ('ok', 'OK'):
            success = True
        else:
            err_text = str(api_resp.get('error') or api_resp.get('message') or 'unknown')[:300]
    except Exception as e:
        err_text = str(e)[:300]
    # Логируем
    try:
        cn = _conn(); cu = cn.cursor()
        cu.execute(
            f"INSERT INTO {SCHEMA}.zvonok_log (purpose, phone, campaign_id, related_type, related_id, "
            f"api_response, success, error_text) "
            f"VALUES ({_esc(purpose)}, {_esc(digits)}, {_esc(str(campaign_id))}, "
            f"{_esc(related_type)}, {('NULL' if related_id is None else int(related_id))}, "
            f"{_esc(json.dumps(api_resp, ensure_ascii=False))}::jsonb, {'TRUE' if success else 'FALSE'}, "
            f"{_esc(err_text)})"
        )
        cn.commit(); cu.close(); cn.close()
    except Exception as e:
        print(f'[ZVONOK] log error: {e}')
    print(f'[ZVONOK] purpose={purpose} to={digits} ok={success} resp={api_resp}')
    return success, {'success': success, 'response': api_resp, 'error': err_text}


def branches_to_text():
    """Преобразует список филиалов в строку для робота."""
    branches = get_branches()
    if not branches:
        return 'улица Кирова 7 или Кирова 11'
    parts = []
    for b in branches:
        addr = b.get('address') or b.get('name') or ''
        parts.append(addr)
    return ' или '.join(parts)


# ───────── SMS клиенту ─────────
def send_sms(phone, text):
    api_id = os.environ.get('SMSRU_API_ID', '')
    if not api_id:
        return False
    digits = _normalize_phone(phone)
    if not digits or len(digits) < 11:
        return False
    try:
        sender = os.environ.get('SMSRU_FROM', 'IPMamedov')
        r = requests.get(
            'https://sms.ru/sms/send',
            params={'api_id': api_id, 'to': digits, 'msg': text, 'from': sender, 'json': 1},
            timeout=10,
        )
        d = r.json()
        sms_obj = (d.get('sms') or {}).get(digits) or {}
        ok = d.get('status') == 'OK' and sms_obj.get('status') == 'OK'
        if not ok:
            print(f'[SMS] to={digits} fail: {d}')
        return ok
    except Exception as e:
        print(f'[SMS] exception: {e}')
        return False


# ───────── Telegram ─────────
def tg_send(chat_id, text, reply_markup=None, parse_mode='Markdown'):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token or not chat_id:
        return None
    payload = {'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode}
    if reply_markup:
        payload['reply_markup'] = json.dumps(reply_markup)
    # 5с достаточно — TG API обычно <300мс. Сокращаем compute при сбоях.
    try:
        r = requests.post(f'https://api.telegram.org/bot{token}/sendMessage', json=payload, timeout=5)
        if r.status_code == 200:
            return r.json().get('result', {}).get('message_id')
        # fallback без reply_markup
        r2 = requests.post(f'https://api.telegram.org/bot{token}/sendMessage',
                           json={'chat_id': chat_id, 'text': text, 'parse_mode': parse_mode}, timeout=5)
        if r2.status_code == 200:
            return r2.json().get('result', {}).get('message_id')
        # без markdown
        r3 = requests.post(f'https://api.telegram.org/bot{token}/sendMessage',
                           json={'chat_id': chat_id, 'text': text}, timeout=5)
        if r3.status_code == 200:
            return r3.json().get('result', {}).get('message_id')
    except Exception:
        pass
    return None


def tg_edit(chat_id, message_id, text, reply_markup=None, parse_mode='Markdown'):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return False
    payload = {'chat_id': chat_id, 'message_id': message_id, 'text': text, 'parse_mode': parse_mode}
    if reply_markup is not None:
        payload['reply_markup'] = json.dumps(reply_markup)
    try:
        requests.post(f'https://api.telegram.org/bot{token}/editMessageText', json=payload, timeout=5)
        return True
    except Exception:
        return False


def tg_answer_callback(callback_id, text=''):
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not token:
        return
    try:
        requests.post(f'https://api.telegram.org/bot{token}/answerCallbackQuery',
                      json={'callback_query_id': callback_id, 'text': text or '✅', 'show_alert': False},
                      timeout=4)
    except Exception:
        pass


def get_recipients():
    """Список chat_id всех активных сотрудников."""
    main = os.environ.get('TELEGRAM_CHAT_ID', '')
    pluxan = os.environ.get('PLUXAN4IK_CHAT_ID', '')
    out = []
    if main:
        out.append(main)
    try:
        conn = _conn()
        cur = conn.cursor()
        cur.execute(f"SELECT telegram_chat_id FROM {SCHEMA}.notification_recipients WHERE is_active=true")
        for (cid,) in cur.fetchall():
            if cid and cid not in out:
                out.append(cid)
        cur.close(); conn.close()
    except Exception:
        pass
    if pluxan and pluxan not in out:
        out.append(pluxan)
    return out


# ───────── Inline-клавиатуры ─────────
def kb_new_lead(lead_id, phone, name='', model=''):
    digits = _normalize_phone(phone)
    plus = f'+{digits}' if digits else ''
    greet = f'Здравствуйте, {(name.split()[0] if name else "")}!'.replace('Здравствуйте, !', 'Здравствуйте!')
    body = greet + ' Вы оставляли заявку в Скупка24.'
    if model:
        body += f' ({model})'
    body += ' Подскажите, удобно сейчас обсудить?'
    enc = urllib.parse.quote(body)
    rows = [[{'text': '🎯 Беру в работу', 'callback_data': f'take:{lead_id}'}]]
    if digits and len(digits) == 11:
        rows.append([
            {'text': '💬 WhatsApp', 'url': f'https://wa.me/{digits}?text={enc}'},
            {'text': '✈️ Telegram', 'url': f'https://t.me/{plus}'},
        ])
    return {'inline_keyboard': rows}


def kb_taken(lead_id, phone):
    digits = _normalize_phone(phone)
    plus = f'+{digits}' if digits else ''
    rows = [[{'text': '✅ Клиенту ответили', 'callback_data': f'answered:{lead_id}'}]]
    if digits and len(digits) == 11:
        rows.append([
            {'text': '💬 WhatsApp', 'url': f'https://wa.me/{digits}'},
            {'text': '✈️ Telegram', 'url': f'https://t.me/{plus}'},
        ])
    return {'inline_keyboard': rows}


# ───────── DB helpers ─────────
def log_action(cur, lead_id, action, actor_chat_id=None, actor_name=None, note=None):
    cur.execute(
        f"INSERT INTO {SCHEMA}.leads_tracking_log (lead_id, action, actor_chat_id, actor_name, note) "
        f"VALUES ({int(lead_id)}, {_esc(action)}, {_esc(actor_chat_id)}, {_esc(actor_name)}, {_esc(note)})"
    )


def fetch_lead(cur, lead_id):
    cur.execute(
        f"SELECT id, source, client_name, client_phone, category, description, status, "
        f"owner_chat_id, owner_name, taken_at, answered_at, sla_minutes, escalation_level, "
        f"client_sms_sent, client_warned_15, tg_message_ids, created_at "
        f"FROM {SCHEMA}.leads_tracking WHERE id={int(lead_id)}"
    )
    return cur.fetchone()


# ───────── ACTIONS ─────────
def action_hot(params):
    """Список заявок для Staff: новые + взятые + горящие за последние 24ч."""
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT id, source, client_name, client_phone, category, description, status, "
        f"owner_name, taken_at, answered_at, sla_minutes, escalation_level, created_at, "
        f"EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS age_minutes "
        f"FROM {SCHEMA}.leads_tracking "
        f"WHERE created_at > NOW() - INTERVAL '24 hours' "
        f"AND status NOT IN ('closed','answered') "
        f"ORDER BY created_at DESC LIMIT 100"
    )
    rows = [dict(r) for r in cur.fetchall()]
    # счётчики
    cur.execute(
        f"SELECT "
        f"COUNT(*) FILTER (WHERE status='new' AND created_at > NOW() - INTERVAL '24 hours') as new_count, "
        f"COUNT(*) FILTER (WHERE status='taken' AND created_at > NOW() - INTERVAL '24 hours') as taken_count, "
        f"COUNT(*) FILTER (WHERE status='new' AND created_at < NOW() - INTERVAL '15 minutes' AND created_at > NOW() - INTERVAL '24 hours') as overdue_count, "
        f"COUNT(*) FILTER (WHERE status='answered' AND DATE(answered_at)=CURRENT_DATE) as answered_today, "
        f"COUNT(*) FILTER (WHERE DATE(created_at)=CURRENT_DATE) as today_total "
        f"FROM {SCHEMA}.leads_tracking"
    )
    stats = dict(cur.fetchone())
    cur.close(); conn.close()
    return _ok({'ok': True, 'leads': rows, 'stats': stats})


def action_take(body):
    lead_id = body.get('lead_id')
    owner_name = (body.get('owner_name') or '').strip() or 'Сотрудник'
    owner_chat_id = (body.get('owner_chat_id') or '').strip()
    if not lead_id:
        return _err(400, 'lead_id required')
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.leads_tracking SET status='taken', owner_name={_esc(owner_name)}, "
        f"owner_chat_id={_esc(owner_chat_id)}, taken_at=NOW(), updated_at=NOW() "
        f"WHERE id={int(lead_id)} AND status='new' RETURNING id"
    )
    if not cur.fetchone():
        conn.rollback(); cur.close(); conn.close()
        return _err(409, 'Заявка уже взята или закрыта')
    log_action(cur, lead_id, 'taken', owner_chat_id, owner_name, None)
    conn.commit(); cur.close(); conn.close()
    # отредактируем все TG-сообщения, чтобы убрать кнопку "Беру" у других
    update_tg_taken(lead_id, owner_name)
    return _ok({'ok': True})


def action_answered(body):
    lead_id = body.get('lead_id')
    if not lead_id:
        return _err(400, 'lead_id required')
    actor_name = (body.get('actor_name') or 'Сотрудник').strip()
    actor_chat_id = (body.get('actor_chat_id') or '').strip()
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.leads_tracking SET status='answered', answered_at=NOW(), "
        f"updated_at=NOW() WHERE id={int(lead_id)} RETURNING id"
    )
    if not cur.fetchone():
        conn.rollback(); cur.close(); conn.close()
        return _err(404, 'not found')
    log_action(cur, lead_id, 'answered', actor_chat_id, actor_name, None)
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True})


def action_close(body):
    lead_id = body.get('lead_id')
    if not lead_id:
        return _err(400, 'lead_id required')
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        f"UPDATE {SCHEMA}.leads_tracking SET status='closed', closed_at=NOW(), updated_at=NOW() "
        f"WHERE id={int(lead_id)} RETURNING id"
    )
    if not cur.fetchone():
        conn.rollback(); cur.close(); conn.close()
        return _err(404, 'not found')
    log_action(cur, lead_id, 'closed', None, None, None)
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True})


def update_tg_taken(lead_id, owner_name):
    """Обновляем TG-сообщения у всех получателей: убираем кнопку 'Беру', показываем кто взял."""
    try:
        conn = _conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            f"SELECT client_name, client_phone, category, description, source, tg_message_ids "
            f"FROM {SCHEMA}.leads_tracking WHERE id={int(lead_id)}"
        )
        r = cur.fetchone()
        cur.close(); conn.close()
        if not r:
            return
        text = (
            f"📦 *Заявка #{lead_id} — В РАБОТЕ*\n\n"
            f"👤 *Имя:* {r['client_name']}\n"
            f"📞 *Телефон:* {r['client_phone']}\n"
            f"🏷 *Категория:* {r['category'] or '—'}\n"
            f"📝 *Описание:* {r['description'] or '—'}\n\n"
            f"🎯 *Взял:* {owner_name}"
        )
        kb = kb_taken(lead_id, r['client_phone'])
        msgs = r.get('tg_message_ids') or {}
        if isinstance(msgs, str):
            try:
                msgs = json.loads(msgs)
            except Exception:
                msgs = {}
        for chat_id, message_id in (msgs or {}).items():
            try:
                tg_edit(chat_id, int(message_id), text, kb)
            except Exception:
                pass
    except Exception:
        pass


# ───────── Telegram callback ─────────
def action_tg_callback(body):
    """Обработка нажатий inline-кнопок в TG-уведомлениях."""
    cb = body.get('callback_query') or {}
    if not cb:
        return _ok({'ok': True})
    callback_id = cb.get('id')
    data = cb.get('data', '')
    user = cb.get('from', {}) or {}
    user_name = (user.get('first_name', '') + ' ' + user.get('last_name', '')).strip() or user.get('username', 'Сотрудник')
    user_chat_id = str(user.get('id', ''))
    if data.startswith('take:'):
        lead_id = data.split(':', 1)[1]
        try:
            lid = int(lead_id)
        except Exception:
            tg_answer_callback(callback_id, '❌ Ошибка'); return _ok({'ok': True})
        # выполнить взятие
        res = action_take({'lead_id': lid, 'owner_name': user_name, 'owner_chat_id': user_chat_id})
        if res['statusCode'] == 200:
            tg_answer_callback(callback_id, f'✅ Взяли в работу: {user_name}')
        else:
            tg_answer_callback(callback_id, '⚠️ Уже взята')
        return _ok({'ok': True})
    if data.startswith('answered:'):
        lead_id = data.split(':', 1)[1]
        try:
            lid = int(lead_id)
        except Exception:
            tg_answer_callback(callback_id, '❌ Ошибка'); return _ok({'ok': True})
        action_answered({'lead_id': lid, 'actor_name': user_name, 'actor_chat_id': user_chat_id})
        tg_answer_callback(callback_id, '✅ Ответили клиенту')
        # отредактируем сообщение
        msg = cb.get('message', {})
        if msg:
            new_text = (msg.get('text') or msg.get('caption') or '') + f'\n\n✅ Клиенту ответили ({user_name})'
            tg_edit(msg.get('chat', {}).get('id'), msg.get('message_id'), new_text, {'inline_keyboard': []}, parse_mode=None)
        return _ok({'ok': True})
    tg_answer_callback(callback_id)
    return _ok({'ok': True})


# ───────── Pulse (эскалация) ─────────
def action_pulse(_body):
    """Запускается раз в минуту по cron'у. Делает эскалацию по SLA."""
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    # Заявки, которые горят: статус new/taken, SLA превышен.
    # ОПТИМИЗАЦИЯ: ограничиваем выборку 50-ю заявками + только те, где SLA реально мог истечь (>=5 мин).
    # Это резко сокращает compute, тк раньше в худшем случае могло быть 500 заявок × 10 уведомлений × 10с = 50000с.
    cur.execute(
        f"SELECT id, source, client_name, client_phone, category, description, status, "
        f"owner_name, escalation_level, client_warned_15, sla_minutes, "
        f"EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS age_minutes "
        f"FROM {SCHEMA}.leads_tracking "
        f"WHERE status IN ('new','taken') AND created_at > NOW() - INTERVAL '4 hours' "
        f"  AND created_at < NOW() - INTERVAL '5 minutes' "
        f"ORDER BY created_at LIMIT 50"
    )
    rows = cur.fetchall()
    # ОПТИМИЗАЦИЯ: кешируем получателей один раз, а не дёргаем БД в каждом цикле
    cached_recipients = get_recipients() if rows else []
    actions = {'escalated_5': 0, 'escalated_15': 0, 'escalated_30': 0, 'sms_sent': 0, 'robocall_lead': 0}
    for r in rows:
        lid = int(r['id']); age = float(r['age_minutes'] or 0); status = r['status']; level = int(r['escalation_level'] or 0)
        # 5 минут — повторное уведомление в TG если новая + робот-звонок клиенту с приглашением
        if status == 'new' and age >= 5 and level < 5:
            cur2 = conn.cursor()
            cur2.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET escalation_level=5, last_escalation_at=NOW(), "
                f"updated_at=NOW() WHERE id={lid}"
            )
            log_action(cur2, lid, 'escalated', None, None, '5 минут — никто не взял')
            cur2.close()
            text = (
                f"⚠️ *ЗАЯВКА БЕЗ ОТВЕТА — 5 МИНУТ*\n"
                f"👤 {r['client_name']} · 📞 {r['client_phone']}\n"
                f"📝 {(r['description'] or r['category'] or '—')[:120]}\n\n"
                f"Нажмите «Беру в работу» 👇"
            )
            kb = kb_new_lead(lid, r['client_phone'], r['client_name'])
            for cid in cached_recipients:
                tg_send(cid, text, kb)
            actions['escalated_5'] += 1
            # Робот-звонок клиенту — кампания "Обработка заявки на скупку техники"
            lead_campaign = os.environ.get('ZVONOK_CAMPAIGN_LEAD', '') or os.environ.get('ZVONOK_CAMPAIGN_ID', '')
            if lead_campaign:
                ok_call, _info = call_zvonok(
                    purpose='lead_invite',
                    phone=r['client_phone'],
                    campaign_id=lead_campaign,
                    related_type='lead',
                    related_id=lid,
                    extra_vars={
                        'name': (r['client_name'] or '').split(' ')[0] or 'клиент',
                        'category': r.get('category') or '',
                        'address': branches_to_text(),
                        'hours': '10:00-21:00',
                    },
                )
                if ok_call:
                    actions['robocall_lead'] += 1
                    cur3 = conn.cursor()
                    log_action(cur3, lid, 'robocall', None, None, 'Робот-звонок клиенту (Zvonok)')
                    cur3.close()
        # 15 минут — SMS клиенту "извините, скоро ответим"
        if status == 'new' and age >= 15 and not r['client_warned_15']:
            sms_text = (
                f"Здравствуйте, {(r['client_name'].split()[0] if r['client_name'] else '')}! "
                f"Это Скупка24. Видим вашу заявку, ответим в ближайшие минуты. "
                f"Если срочно — звоните 88005553535."
            )
            sent = send_sms(r['client_phone'], sms_text)
            cur2 = conn.cursor()
            cur2.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET client_warned_15=TRUE, escalation_level=15, "
                f"last_escalation_at=NOW(), updated_at=NOW() WHERE id={lid}"
            )
            log_action(cur2, lid, 'sms_sent', None, None, 'Авто-SMS клиенту 15 мин')
            cur2.close()
            if sent:
                actions['sms_sent'] += 1
            actions['escalated_15'] += 1
            # Параллельно — алерт всем сотрудникам
            text = (
                f"🔥 *ЗАЯВКА ГОРИТ — 15 МИНУТ*\n"
                f"👤 {r['client_name']} · 📞 {r['client_phone']}\n"
                f"Клиенту отправлено SMS-извинение. Ответьте СЕЙЧАС."
            )
            for cid in cached_recipients:
                tg_send(cid, text, kb_new_lead(lid, r['client_phone'], r['client_name']))
        # 30 минут — критический алерт
        if status == 'new' and age >= 30 and level < 30:
            cur2 = conn.cursor()
            cur2.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET escalation_level=30, status='escalated_30', "
                f"last_escalation_at=NOW(), updated_at=NOW() WHERE id={lid}"
            )
            log_action(cur2, lid, 'escalated', None, None, '30 минут — критическая')
            cur2.close()
            text = (
                f"🚨🚨🚨 *КРИТИЧНО — ЗАЯВКА 30+ МИНУТ*\n"
                f"👤 {r['client_name']} · 📞 {r['client_phone']}\n"
                f"📞 ПОЗВОНИТЕ КЛИЕНТУ НЕМЕДЛЕННО"
            )
            for cid in cached_recipients:
                tg_send(cid, text, kb_new_lead(lid, r['client_phone'], r['client_name']))
            actions['escalated_30'] += 1
    conn.commit(); cur.close(); conn.close()
    return _ok({'ok': True, 'actions': actions, 'checked': len(rows)})


# ───────── Ручные звонки (Zvonok) ─────────
def _employee_by_token(token):
    if not token:
        return None
    try:
        cn = _conn(); cu = cn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cu.execute(
            f"SELECT id, full_name, role, is_active FROM {SCHEMA}.employees WHERE auth_token={_esc(token)} LIMIT 1"
        )
        row = cu.fetchone()
        cu.close(); cn.close()
        if not row or not row.get('is_active'):
            return None
        return dict(row)
    except Exception:
        return None


def action_robocall_ready(body, headers):
    """Сотрудник жмёт «📞 Позвонить роботом» в карточке ремонта.
    Звонит клиенту с сообщением о готовности устройства."""
    emp = _employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    phone = body.get('phone') or ''
    name = (body.get('name') or 'клиент').split(' ')[0] or 'клиент'
    model = body.get('model') or 'устройство'
    price = body.get('price') or ''
    order_id = body.get('order_id')
    branch = body.get('address') or 'улица Кирова 7'
    campaign = os.environ.get('ZVONOK_CAMPAIGN_READY', '')
    if not campaign:
        return _err(500, 'ZVONOK_CAMPAIGN_READY не настроен')
    ok, info = call_zvonok(
        purpose='ready',
        phone=phone,
        campaign_id=campaign,
        related_type='repair',
        related_id=int(order_id) if order_id else None,
        extra_vars={
            'name': name,
            'model': model,
            'price': str(price),
            'address': branch,
            'hours': '10:00-21:00',
        },
    )
    return _ok({'ok': bool(ok), 'info': info})


def action_robocall_lead_manual(body, headers):
    """Сотрудник жмёт «📞 Позвонить роботом-приглашением» в карточке заявки."""
    emp = _employee_by_token(headers.get('X-Employee-Token') or headers.get('x-employee-token') or '')
    if not emp:
        return _err(401, 'Auth required')
    lead_id = body.get('lead_id')
    if not lead_id:
        return _err(400, 'lead_id required')
    cn = _conn(); cu = cn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cu.execute(
        f"SELECT id, client_name, client_phone, category FROM {SCHEMA}.leads_tracking WHERE id={int(lead_id)} LIMIT 1"
    )
    r = cu.fetchone()
    cu.close(); cn.close()
    if not r:
        return _err(404, 'Заявка не найдена')
    campaign = os.environ.get('ZVONOK_CAMPAIGN_LEAD', '') or os.environ.get('ZVONOK_CAMPAIGN_ID', '')
    if not campaign:
        return _err(500, 'ZVONOK кампания скупки не настроена')
    ok, info = call_zvonok(
        purpose='lead_manual',
        phone=r['client_phone'],
        campaign_id=campaign,
        related_type='lead',
        related_id=int(r['id']),
        extra_vars={
            'name': (r['client_name'] or '').split(' ')[0] or 'клиент',
            'category': r.get('category') or '',
            'address': branches_to_text(),
            'hours': '10:00-21:00',
        },
    )
    return _ok({'ok': bool(ok), 'info': info})


def action_branches_get(_body, _headers):
    """Список филиалов (для фронта — чтобы выбрать адрес перед звонком)."""
    return _ok({'ok': True, 'branches': get_branches()})


# ───────── Утренняя сводка ─────────
def action_morning_digest(_body):
    conn = _conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(
        f"SELECT COUNT(*) total, "
        f"COUNT(*) FILTER (WHERE status='answered') as answered, "
        f"COUNT(*) FILTER (WHERE status='closed') as closed, "
        f"COUNT(*) FILTER (WHERE status NOT IN ('answered','closed')) as missed, "
        f"AVG(EXTRACT(EPOCH FROM (answered_at - created_at))/60) FILTER (WHERE answered_at IS NOT NULL) as avg_answer_min "
        f"FROM {SCHEMA}.leads_tracking "
        f"WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'"
    )
    s = dict(cur.fetchone())
    cur.close(); conn.close()
    avg = s.get('avg_answer_min')
    avg_str = f"{int(avg)} мин" if avg else '—'
    text = (
        f"☀️ *Утренняя сводка — Скупка24*\n\n"
        f"За вчера: *{s.get('total') or 0}* заявок\n"
        f"✅ Ответили: {s.get('answered') or 0}\n"
        f"📦 Закрыли: {s.get('closed') or 0}\n"
        f"⚠️ Пропустили: *{s.get('missed') or 0}*\n"
        f"⏱ Среднее время ответа: {avg_str}"
    )
    for cid in get_recipients():
        tg_send(cid, text)
    return _ok({'ok': True, 'stats': s})


# ───────── Регистрация новой заявки (вызывается из send-lead/repair-order) ─────────
def action_register(body):
    """Регистрирует заявку в leads_tracking. Возвращает id и tg_message_ids чтобы инициатор мог обновить."""
    source = body.get('source') or 'lead'
    name = (body.get('name') or '').strip()
    phone = (body.get('phone') or '').strip()
    category = (body.get('category') or '').strip() or None
    desc = (body.get('description') or body.get('desc') or '').strip() or None
    external_id = body.get('external_id')
    payload = body.get('payload') or {}
    if not name or not phone:
        return _err(400, 'name & phone required')
    conn = _conn()
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SCHEMA}.leads_tracking (source, external_id, client_name, client_phone, category, description, payload_json) "
        f"VALUES ({_esc(source)}, "
        f"{('NULL' if external_id is None else int(external_id))}, "
        f"{_esc(name)}, {_esc(phone)}, {_esc(category)}, {_esc(desc)}, "
        f"{_esc(json.dumps(payload, ensure_ascii=False))}::jsonb) RETURNING id"
    )
    lead_id = cur.fetchone()[0]
    log_action(cur, lead_id, 'created', None, None, source)
    conn.commit(); cur.close(); conn.close()

    # Отправляем уведомления всем сотрудникам с кнопкой "Беру"
    text = (
        f"📦 *Новая заявка #{lead_id} — Скупка24*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📞 *Телефон:* {phone}\n"
        f"🏷 *Категория:* {category or '—'}\n"
        f"📝 *Описание:* {desc or '—'}\n\n"
        f"⏱ SLA: 15 минут"
    )
    kb = kb_new_lead(lead_id, phone, name, category or '')
    msg_ids = {}
    for cid in get_recipients():
        mid = tg_send(cid, text, kb)
        if mid:
            msg_ids[str(cid)] = int(mid)
    if msg_ids:
        try:
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET tg_message_ids={_esc(json.dumps(msg_ids))}::jsonb, updated_at=NOW() "
                f"WHERE id={int(lead_id)}"
            )
            conn.commit(); cur.close(); conn.close()
        except Exception:
            pass

    # Подтверждающее SMS клиенту
    sms_text = (
        f"Здравствуйте! Заявка #{lead_id} в Скупка24 принята. "
        f"Перезвоним в течение 15 минут. По срочным вопросам: 88005553535."
    )
    sms_ok = send_sms(phone, sms_text)
    if sms_ok:
        try:
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.leads_tracking SET client_sms_sent=TRUE, updated_at=NOW() WHERE id={int(lead_id)}"
            )
            conn.commit(); cur.close(); conn.close()
        except Exception:
            pass

    return _ok({'ok': True, 'lead_id': lead_id, 'sms_sent': sms_ok})


# ───────── Handler ─────────
def handler(event, context):
    """API + cron-pulse + Telegram webhook для системы трекинга заявок"""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    qp = event.get('queryStringParameters') or {}
    action = (qp.get('action') or '').strip()
    headers = event.get('headers') or {}
    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        body = {}
    # webhook от телеграм может прийти POST'ом без action — определим по наличию callback_query
    if not action and isinstance(body, dict) and body.get('callback_query'):
        action = 'tg_callback'

    try:
        if action == 'hot':
            return action_hot(qp)
        if action == 'register':
            return action_register(body)
        if action == 'take':
            return action_take(body)
        if action == 'answered':
            return action_answered(body)
        if action == 'close':
            return action_close(body)
        if action == 'tg_callback':
            return action_tg_callback(body)
        if action == 'pulse':
            return action_pulse(body)
        if action == 'morning_digest':
            return action_morning_digest(body)
        if action == 'robocall_ready':
            return action_robocall_ready(body, headers)
        if action == 'robocall_lead':
            return action_robocall_lead_manual(body, headers)
        if action == 'branches':
            return action_branches_get(body, headers)
        return _err(400, f'Unknown action: {action}')
    except Exception as e:
        return _err(500, f'{type(e).__name__}: {e}')