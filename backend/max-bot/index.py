"""
MAX Bot — интеграция с мессенджером MAX (botapi.max.ru).

Эндпоинты:
  POST /                              → webhook от MAX (входящие сообщения, команды, callback'и)
  POST /?action=send                  → отправить сообщение клиенту в MAX (вызывается из public-chat и repair-admin)
  POST /?action=setup_webhook         → разово зарегистрировать webhook у MAX (требует X-Admin-Token)
  GET  /?action=info                  → информация о боте (getMe) + публичная ссылка для пользователей

Логика входящих сообщений:
  1. /start  → приветствие + меню (Скупка / Ремонт / Каталог / Контакты)
  2. #N (номер ремонта) → краткий статус ремонта
  3. Любой текст → сохраняем в LIVE-чат (pchat) как сообщение клиента + дублируем в Telegram сотрудникам

Связь MAX-пользователь ↔ pchat_clients идёт через pchat_clients.max_user_id (уникальный).
Если у пользователя нет верифицированного телефона — он работает как гость
(телефон фиксируется как 'max:<user_id>' для INSERT-уникальности).
"""

import json
import os
import re
import secrets
from typing import Any

import psycopg2
import requests

SCHEMA = 't_p31606708_tech_buying_service'
MAX_API_URL = 'https://botapi.max.ru'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Internal-Token',
    'Content-Type': 'application/json',
}


# ─────────────────────────── helpers ────────────────────────────────

def _conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def _esc(v: Any) -> str:
    if v is None:
        return 'NULL'
    s = str(v).replace("'", "''")
    return f"'{s}'"


def _ok(payload: dict, status: int = 200) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(payload, ensure_ascii=False)}


def _err(status: int, message: str) -> dict:
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'ok': False, 'error': message}, ensure_ascii=False)}


def _gen_token(n: int = 32) -> str:
    return secrets.token_urlsafe(n)[:n]


def _log(direction: str, update_type: str = '', text: str = '',
         max_user_id: Any = None, max_chat_id: Any = None,
         pchat_client_id: Any = None, pchat_room_id: Any = None,
         payload: Any = None, error: str = ''):
    """ОПТИМИЗАЦИЯ COMPUTE: логируем только важное (ошибки, входящие команды, callback).
    Пропускаем мусор (out, debug-события) — это сокращает время каждого webhook на ~100-300мс
    (на одно новое psycopg2-подключение + insert)."""
    # Скипаем шумные логи — оставляем только ошибки, входящие callback'и и важные события
    is_important = bool(error) or direction == 'in' or update_type.startswith('callback') or update_type.startswith('bot_added')
    if not is_important:
        return
    try:
        conn = _conn(); cur = conn.cursor()
        raw = json.dumps(payload, ensure_ascii=False) if payload is not None else None
        cur.execute(
            f"INSERT INTO {SCHEMA}.max_log (direction, max_user_id, max_chat_id, update_type, text, "
            f"pchat_client_id, pchat_room_id, raw_payload, error_text) VALUES ("
            f"{_esc(direction)}, {('NULL' if max_user_id is None else int(max_user_id))}, "
            f"{('NULL' if max_chat_id is None else int(max_chat_id))}, {_esc(update_type)}, "
            f"{_esc((text or '')[:2000])}, "
            f"{('NULL' if pchat_client_id is None else int(pchat_client_id))}, "
            f"{('NULL' if pchat_room_id is None else int(pchat_room_id))}, "
            f"{('NULL' if raw is None else _esc(raw) + '::jsonb')}, {_esc(error[:500])})"
        )
        conn.commit(); cur.close(); conn.close()
    except Exception as log_err:
        print(f'[MAX LOG] failed: {log_err}')


# ─────────────────────────── MAX API ────────────────────────────────

def max_call(method: str, params: dict | None = None, payload: dict | None = None,
             http_method: str = '') -> tuple[bool, dict]:
    """Универсальный вызов botapi.max.ru. method — путь после /, например 'messages'.
    Авторизация — Authorization: Bearer <token> (новый формат MAX Bot API)."""
    token = os.environ.get('MAX_BOT_TOKEN', '')
    if not token:
        return False, {'error': 'MAX_BOT_TOKEN не задан'}
    url = f'{MAX_API_URL}/{method}'
    req_headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
    }
    q = dict(params) if params else {}
    try:
        verb = (http_method or ('POST' if payload is not None else 'GET')).upper()
        # 8с достаточно: MAX API обычно отвечает <500мс. Чем короче таймаут — тем меньше compute-секунд при сбое.
        if verb == 'POST':
            r = requests.post(url, params=q, json=(payload or {}), headers=req_headers, timeout=8)
        elif verb == 'DELETE':
            r = requests.delete(url, params=q, headers=req_headers, timeout=8)
        elif verb == 'PATCH':
            r = requests.patch(url, params=q, json=(payload or {}), headers=req_headers, timeout=8)
        else:
            r = requests.get(url, params=q, headers=req_headers, timeout=8)
        try:
            d = r.json()
        except Exception:
            d = {'raw': (r.text or '')[:300]}
        ok = r.status_code in (200, 201, 202) and not d.get('error') and not d.get('code')
        return ok, d
    except Exception as e:
        return False, {'error': f'{type(e).__name__}: {e}'}


def send_max_message(chat_id: int, text: str, reply_markup: dict | None = None) -> tuple[bool, dict]:
    """Отправляет текст в чат с пользователем MAX. chat_id — recipient.chat_id из webhook."""
    payload = {'text': text, 'format': 'markdown'}
    if reply_markup:
        payload['attachments'] = [{'type': 'inline_keyboard', 'payload': reply_markup}]
    ok, d = max_call('messages', params={'chat_id': int(chat_id)}, payload=payload)
    return ok, d


# ───────────────── pchat / MAX client linking ──────────────────────

def get_or_create_max_client(max_user_id: int, max_chat_id: int, display_name: str, username: str = '') -> tuple[int, int]:
    """Находит / создаёт pchat_clients для MAX-пользователя.
    Возвращает (client_id, room_id)."""
    conn = _conn(); cur = conn.cursor()
    cur.execute(f"SELECT id FROM {SCHEMA}.pchat_clients WHERE max_user_id={int(max_user_id)} LIMIT 1")
    row = cur.fetchone()
    if row:
        client_id = int(row[0])
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_clients SET max_chat_id={int(max_chat_id)}, "
            f"max_username={_esc(username) if username else 'max_username'}, "
            f"display_name=COALESCE(NULLIF(display_name, ''), {_esc(display_name)}), "
            f"last_seen_at=NOW() WHERE id={client_id}"
        )
    else:
        # Phone-уникальный, поэтому делаем «синтетический» phone — потом клиент может верифицироваться
        synthetic_phone = f'max:{int(max_user_id)}'
        token = _gen_token(32)
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_clients (phone, display_name, auth_token, auth_method, is_guest, "
            f"max_user_id, max_chat_id, max_username, last_seen_at) "
            f"VALUES ({_esc(synthetic_phone)}, {_esc(display_name or 'MAX-клиент')}, {_esc(token)}, "
            f"'max', TRUE, {int(max_user_id)}, {int(max_chat_id)}, "
            f"{_esc(username) if username else 'NULL'}, NOW()) RETURNING id"
        )
        client_id = int(cur.fetchone()[0])
    # Ищем/создаём direct-комнату
    cur.execute(f"SELECT id FROM {SCHEMA}.pchat_rooms WHERE type='direct' AND client_id={client_id} LIMIT 1")
    rr = cur.fetchone()
    if rr:
        room_id = int(rr[0])
    else:
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_rooms (type, title, client_id, last_message_at, last_message_text) "
            f"VALUES ('direct', {_esc('MAX · ' + (display_name or 'клиент'))}, {client_id}, NOW(), "
            f"'👋 Клиент пришёл из MAX') RETURNING id"
        )
        room_id = int(cur.fetchone()[0])
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_messages (room_id, author_type, author_id, author_name, text, is_system) "
            f"VALUES ({room_id}, 'system', 0, 'Скупка24', "
            f"{_esc('Новый клиент из MAX. Пишет через бот.')}, TRUE)"
        )
    conn.commit(); cur.close(); conn.close()
    return client_id, room_id


def insert_client_message(room_id: int, client_id: int, name: str, text: str) -> int | None:
    """Создаёт сообщение клиента в LIVE-чате и пушит уведомление сотрудникам."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_messages (room_id, author_type, author_id, author_name, text) "
            f"VALUES ({int(room_id)}, 'client', {int(client_id)}, {_esc(name)}, {_esc(text)}) RETURNING id"
        )
        mid = int(cur.fetchone()[0])
        snippet = (text or '📷 Фото')[:200]
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text={_esc(snippet)} "
            f"WHERE id={int(room_id)}"
        )
        conn.commit(); cur.close(); conn.close()
        notify_staff_telegram(name, text, source='MAX')
        return mid
    except Exception as e:
        print(f'[MAX] insert_client_message error: {e}')
        return None


def notify_staff_telegram(author: str, text: str, source: str = 'MAX'):
    """Дублирует входящее сообщение в Telegram-группу сотрудников."""
    tg_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    tg_chat = os.environ.get('TELEGRAM_CHAT_ID', '')
    if not tg_token or not tg_chat:
        return
    snippet = (text or '📷 Фото')[:300]
    msg = f"💬 *{source} · {author}*\n{snippet}\n\n_Ответ — из вкладки «Клиенты Live» в Staff_"
    try:
        requests.post(
            f'https://api.telegram.org/bot{tg_token}/sendMessage',
            json={'chat_id': tg_chat, 'text': msg, 'parse_mode': 'Markdown'},
            timeout=8,
        )
    except Exception:
        pass


# ───────────────── команды бота ────────────────────────────────────

SITE_URL = 'https://skypka24.com'

WELCOME_TEXT = (
    "👋 *Скупка24 — техника, ремонт, золото*\n\n"
    "Выбирайте — что нужно:\n\n"
    "📱 *Оценить технику* — пришлём цену за 5 минут\n"
    "🔧 *Сдать в ремонт* — починим за 1 день, гарантия 90 дней\n"
    "🛒 *Каталог Б/У* — проверенные iPhone и Android\n"
    "💰 *Цена золота* — актуальный курс приёма\n"
    "📋 *Мои заявки* — статус ремонтов и оценок\n"
    "📍 *Филиалы* — адреса, часы работы\n"
    "💬 *Написать менеджеру* — ответим за минуту\n\n"
    "_Подсказка: для статуса ремонта отправьте *#номер* (например #10)_"
)


def main_keyboard() -> dict:
    """Главное меню — двумя колонками для компактности."""
    return {
        'buttons': [
            [{'type': 'callback', 'text': '📱 Оценить технику', 'payload': 'menu:buy'},
             {'type': 'callback', 'text': '🔧 Ремонт', 'payload': 'menu:repair'}],
            [{'type': 'callback', 'text': '🛒 Каталог', 'payload': 'menu:catalog'},
             {'type': 'callback', 'text': '💰 Цена золота', 'payload': 'menu:gold'}],
            [{'type': 'callback', 'text': '📋 Мои заявки', 'payload': 'menu:my_orders'},
             {'type': 'callback', 'text': '📍 Филиалы', 'payload': 'menu:branches'}],
            [{'type': 'callback', 'text': '💬 Связаться с менеджером', 'payload': 'menu:contact'}],
            [{'type': 'link', 'text': '🌐 Открыть сайт', 'url': SITE_URL}],
        ]
    }


def cmd_start(chat_id: int, max_user_id: int) -> dict:
    send_max_message(chat_id, WELCOME_TEXT, reply_markup=main_keyboard())
    return {'ok': True}


# ─────────────── контент-блоки для каждого пункта меню ────────────

def menu_buy() -> tuple[str, dict]:
    text = (
        "📱 *Оценить технику онлайн*\n\n"
        "Покупаем iPhone, MacBook, iPad, Apple Watch, Android, ноутбуки, "
        "PlayStation, Xbox, золото и украшения.\n\n"
        "💵 Оплата сразу: наличные или на карту.\n"
        "⚡ Оценка за 5 минут — без выезда.\n\n"
        "Что дальше:\n"
        "1️⃣ Откройте форму оценки на сайте\n"
        "2️⃣ Или напишите сюда: *модель, состояние* — менеджер пришлёт цену"
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '⚡ Форма оценки', 'url': f'{SITE_URL}?action=eval'}],
        [{'type': 'link', 'text': '📱 Что принимаем', 'url': f'{SITE_URL}?section=catalog'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_repair() -> tuple[str, dict]:
    text = (
        "🔧 *Ремонт техники*\n\n"
        "iPhone, Android, ноутбуки, планшеты. Гарантия *90 дней*.\n"
        "Большинство ремонтов — за 1 день.\n\n"
        "Что дальше:\n"
        "📲 Откройте форму ремонта на сайте\n"
        "🔢 Или пришлите *#номер заявки* — скажу статус\n"
        "💬 Или напишите модель и проблему — оценим"
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '🔧 Сдать в ремонт', 'url': f'{SITE_URL}?section=repair'}],
        [{'type': 'callback', 'text': '📋 Мои ремонты', 'payload': 'menu:my_orders'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_catalog() -> tuple[str, dict]:
    text = (
        "🛒 *Каталог Б/У*\n\n"
        "Проверенные iPhone, Android, ноутбуки, планшеты.\n"
        "✅ Полная диагностика\n"
        "✅ Гарантия 30 дней\n"
        "✅ Возврат 7 дней без вопросов\n\n"
        "Откройте каталог — там цены и фото."
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '🛒 Открыть каталог', 'url': f'{SITE_URL}/catalog'}],
        [{'type': 'link', 'text': '📱 iPhone Б/У', 'url': f'{SITE_URL}/catalog?category=iphone'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_gold() -> tuple[str, dict]:
    """Цена золота из БД (gold_prices)."""
    text_lines = ["💰 *Цена приёма золота сегодня*\n"]
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT sample, price_per_gram FROM {SCHEMA}.gold_prices "
            f"WHERE is_active=true ORDER BY sample"
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        if rows:
            for sample, price in rows:
                text_lines.append(f"• *{sample} проба*: {price} ₽/г")
        else:
            text_lines.append("_Уточняйте у менеджера — цена обновляется ежедневно._")
    except Exception:
        text_lines.append("_Уточняйте у менеджера — цена обновляется ежедневно._")
    text_lines.append("\n💍 Принимаем: украшения, лом, монеты, слитки.")
    text_lines.append("📍 Калуга, ул. Кирова, 7 — приходите без записи.")
    text = "\n".join(text_lines)
    kb = {'buttons': [
        [{'type': 'link', 'text': '💰 Подробнее о приёме золота', 'url': f'{SITE_URL}?section=gold'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_branches() -> tuple[str, dict]:
    text = (
        "📍 *Наши филиалы в Калуге*\n\n"
        "*Офис №1* — ул. Кирова, 11\n"
        "🕙 10:00 – 21:00 ежедневно\n"
        "🚇 Карта: https://yandex.ru/maps/-/CHc4mC-V\n\n"
        "*Офис №2* — ул. Кирова, 7/47\n"
        "🕙 10:00 – 21:00 ежедневно\n"
        "🚇 Карта: https://yandex.ru/maps/-/CHc4mO5l\n\n"
        "📞 Общий телефон: *8-800-600-68-33*"
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '📞 Позвонить', 'url': 'tel:+78006006833'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_contact() -> tuple[str, dict]:
    text = (
        "💬 *Написать менеджеру*\n\n"
        "Просто напишите вопрос в этот чат — менеджер увидит и ответит "
        "в течение минуты (10:00–21:00).\n\n"
        "Также можно:\n"
        "📞 Позвонить: 8-800-600-68-33\n"
        "💬 WhatsApp: +7 992 999-03-33\n"
        "✈️ Telegram: @skypka24"
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '📞 Позвонить', 'url': 'tel:+78006006833'}],
        [{'type': 'link', 'text': '💬 WhatsApp', 'url': 'https://wa.me/79929990333'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


def menu_my_orders(max_user_id: int) -> tuple[str, dict]:
    """Список ремонтов и заявок клиента по его MAX-телефону."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT phone FROM {SCHEMA}.pchat_clients WHERE max_user_id={int(max_user_id)} LIMIT 1"
        )
        rrow = cur.fetchone()
        client_phone = None
        if rrow and rrow[0] and not rrow[0].startswith('max:'):
            client_phone = rrow[0]
        lines = ["📋 *Ваши заявки и ремонты*\n"]
        found_any = False
        # Ремонты
        if client_phone:
            cur.execute(
                f"SELECT id, status, model, repair_amount FROM {SCHEMA}.repair_orders "
                f"WHERE phone={_esc(client_phone)} "
                f"ORDER BY id DESC LIMIT 10"
            )
            repairs = cur.fetchall()
            if repairs:
                lines.append("🔧 *Ремонты:*")
                status_emoji = {
                    'new': '🆕', 'pending_approval': '🔍', 'accepted': '👨‍🔧',
                    'in_progress': '🔧', 'waiting_parts': '📦', 'ready': '✅',
                    'done': '📤', 'warranty': '🛡', 'cancelled': '❌',
                }
                for r_id, r_status, r_model, r_amount in repairs:
                    emoji = status_emoji.get(r_status, '•')
                    amt = f" · {r_amount} ₽" if r_amount and r_status in ('ready', 'done') else ''
                    lines.append(f"{emoji} #{r_id} — {(r_model or '—')[:30]}{amt}")
                found_any = True
            # Заявки на скупку
            cur.execute(
                f"SELECT id, category, status FROM {SCHEMA}.leads_tracking "
                f"WHERE client_phone={_esc(client_phone)} "
                f"ORDER BY id DESC LIMIT 5"
            )
            leads = cur.fetchall()
            if leads:
                lines.append("\n📱 *Заявки на скупку:*")
                for l_id, l_cat, l_status in leads:
                    lines.append(f"• #{l_id} — {(l_cat or 'без категории')[:30]}")
                found_any = True
        cur.close(); conn.close()
        if not found_any:
            lines.append("_Пока заявок нет._\n\nОставьте оценку или сдайте технику — заявка появится здесь автоматически.")
    except Exception as e:
        print(f'[MAX my_orders] error: {e}')
        lines = ["📋 *Ваши заявки*\n\n_Не удалось загрузить. Попробуйте позже или напишите менеджеру._"]
    kb = {'buttons': [
        [{'type': 'callback', 'text': '🔄 Обновить', 'payload': 'menu:my_orders'}],
        [{'type': 'link', 'text': '🌐 Открыть на сайте', 'url': f'{SITE_URL}/cabinet'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return "\n".join(lines), kb


def menu_review(order_id: int = 0) -> tuple[str, dict]:
    text = (
        "⭐ *Оцените нашу работу*\n\n"
        "Ваш отзыв помогает нам становиться лучше.\n"
        "Будем благодарны за честную оценку 🙏"
    )
    kb = {'buttons': [
        [{'type': 'link', 'text': '⭐ Яндекс.Карты', 'url': 'https://yandex.ru/maps/org/skupka24/114124804072/reviews/'}],
        [{'type': 'link', 'text': '⭐ 2ГИС', 'url': 'https://2gis.ru/kaluga/firm/70000001037088876'}],
        [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
    ]}
    return text, kb


# ─────────────── ОПЛАТА РЕМОНТА (ЮKassa + fallback на сайт) ──────

def create_yookassa_payment(order_id: int, amount: float, description: str, return_url: str) -> str | None:
    """Создаёт платёж в ЮKassa, возвращает confirmation_url. Если ключей нет — None."""
    shop_id = os.environ.get('YOOKASSA_SHOP_ID', '')
    secret = os.environ.get('YOOKASSA_SECRET_KEY', '')
    if not shop_id or not secret:
        return None
    try:
        import base64 as b64
        import uuid
        auth = b64.b64encode(f'{shop_id}:{secret}'.encode()).decode()
        r = requests.post(
            'https://api.yookassa.ru/v3/payments',
            headers={
                'Authorization': f'Basic {auth}',
                'Idempotence-Key': str(uuid.uuid4()),
                'Content-Type': 'application/json',
            },
            json={
                'amount': {'value': f'{float(amount):.2f}', 'currency': 'RUB'},
                'capture': True,
                'confirmation': {'type': 'redirect', 'return_url': return_url},
                'description': description,
                'metadata': {'order_id': str(order_id), 'source': 'max-bot'},
            },
            timeout=10,
        )
        d = r.json()
        if r.status_code == 200 and d.get('confirmation', {}).get('confirmation_url'):
            return d['confirmation']['confirmation_url']
        print(f'[YOOKASSA] error: {d}')
    except Exception as e:
        print(f'[YOOKASSA] exception: {e}')
    return None


def menu_pay(order_id: int, max_chat_id: int) -> tuple[str, dict]:
    """Готовит текст и кнопку для оплаты ремонта. Использует ЮKassa, иначе fallback на сайт."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT status, model, repair_amount, name FROM {SCHEMA}.repair_orders "
            f"WHERE id={int(order_id)} LIMIT 1"
        )
        r = cur.fetchone(); cur.close(); conn.close()
        if not r:
            return f"❓ Ремонт #{order_id} не найден.", {'buttons': [
                [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}]
            ]}
        status, model, amount, client_name = r
        if not amount:
            return (
                f"💰 *Ремонт #{order_id}* — сумма ещё не определена.\n\n"
                f"Мастер выставит цену после диагностики. Тогда вернитесь и нажмите «Оплатить»."
            ), {'buttons': [[{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}]]}
        amount_float = float(amount)
        text = (
            f"💳 *Оплата ремонта #{order_id}*\n\n"
            f"📱 {model or 'устройство'}\n"
            f"💰 Сумма: *{amount} ₽*\n\n"
            f"Нажмите «Оплатить» — откроется безопасная страница оплаты картой."
        )
        return_url = f'{SITE_URL}/cabinet?repair={order_id}&pay=success'
        pay_url = create_yookassa_payment(
            order_id, amount_float, f'Ремонт #{order_id} — Скупка24', return_url
        )
        if not pay_url:
            # Fallback: страница оплаты на сайте
            pay_url = f'{SITE_URL}/pay?repair={order_id}'
        kb = {'buttons': [
            [{'type': 'link', 'text': f'💳 Оплатить {amount} ₽', 'url': pay_url}],
            [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
        ]}
        return text, kb
    except Exception as e:
        print(f'[MAX menu_pay] error: {e}')
        return "❌ Ошибка. Попробуйте позже.", {'buttons': [
            [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}]
        ]}


def repair_status_by_id(order_id: int) -> str | None:
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT id, status, model, repair_type, repair_amount, created_at, completed_at "
            f"FROM {SCHEMA}.repair_orders WHERE id={int(order_id)} LIMIT 1"
        )
        r = cur.fetchone()
        cur.close(); conn.close()
        if not r:
            return None
        oid, status, model, rtype, ramount, created_at, completed_at = r
        status_label = {
            'new': '🆕 Принят',
            'pending_approval': '🔍 На согласовании у мастера',
            'accepted': '👨‍🔧 Мастер принял в работу',
            'in_progress': '🔧 В ремонте',
            'waiting_parts': '📦 Ждёт запчасть',
            'ready': '✅ Готов к выдаче',
            'done': '📤 Выдан клиенту',
            'warranty': '🛡 На гарантии',
            'cancelled': '❌ Отменён',
        }.get(status, status)
        parts = [f"*Ремонт #{oid}* — {status_label}"]
        if model:
            parts.append(f"📱 {model}")
        if rtype:
            parts.append(f"🔧 {rtype}")
        if ramount and status in ('ready', 'done'):
            parts.append(f"💰 К оплате: {ramount} ₽")
        if status == 'ready':
            parts.append("\n_Заберите по адресу: ул. Кирова, 7 (10:00–21:00)_")
        return "\n".join(parts)
    except Exception as e:
        print(f'[MAX] repair_status_by_id error: {e}')
        return None


# ───────────────── обработка входящих ──────────────────────────────

def dispatch_menu(key: str, max_chat_id: int, max_user_id: int) -> bool:
    """Универсальный диспетчер для callback и команд. Возвращает True если обработано."""
    if key in ('home', 'start'):
        send_max_message(max_chat_id, WELCOME_TEXT, reply_markup=main_keyboard())
        return True
    if key == 'buy':
        t, k = menu_buy(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'repair':
        t, k = menu_repair(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'catalog':
        t, k = menu_catalog(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'gold':
        t, k = menu_gold(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'branches':
        t, k = menu_branches(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'contact':
        t, k = menu_contact(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'my_orders':
        t, k = menu_my_orders(max_user_id); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key == 'review':
        t, k = menu_review(); send_max_message(max_chat_id, t, reply_markup=k); return True
    if key.startswith('pay:'):
        try:
            oid = int(key.split(':', 1)[1])
            t, k = menu_pay(oid, max_chat_id)
            send_max_message(max_chat_id, t, reply_markup=k)
            return True
        except Exception:
            return False
    if key.startswith('status:'):
        try:
            oid = int(key.split(':', 1)[1])
            info = repair_status_by_id(oid) or f"❓ Ремонт #{oid} не найден."
            send_max_message(max_chat_id, info, reply_markup={'buttons': [
                [{'type': 'callback', 'text': '💳 Оплатить', 'payload': f'menu:pay:{oid}'}],
                [{'type': 'callback', 'text': '⬅ В меню', 'payload': 'menu:home'}],
            ]})
            return True
        except Exception:
            return False
    return False


def _handle_staff_reply(text: str, staff_name: str, notify_chat_id: int) -> bool:
    """Обрабатывает ответ сотрудника вида '>N текст'. Возвращает True если обработано."""
    m = re.match(r'^[>!](\d+)\s+(.+)$', text, re.DOTALL)
    if not m:
        return False
    room_id_r = int(m.group(1))
    reply_text = m.group(2).strip()
    staff_name = staff_name or 'Менеджер'
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.pchat_messages "
            f"(room_id, author_type, author_id, author_name, text, is_system) "
            f"VALUES ({room_id_r}, 'staff', 0, %s, %s, FALSE) RETURNING id",
            (staff_name, reply_text)
        )
        cur.execute(
            f"UPDATE {SCHEMA}.pchat_rooms SET last_message_at=NOW(), last_message_text=%s WHERE id={room_id_r}",
            (reply_text[:500],)
        )
        cur.execute(
            f"SELECT c.max_chat_id FROM {SCHEMA}.pchat_rooms r "
            f"JOIN {SCHEMA}.pchat_clients c ON c.id=r.client_id "
            f"WHERE r.id={room_id_r} LIMIT 1"
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        send_max_message(notify_chat_id, f'✅ Ответ клиенту (чат #{room_id_r}) отправлен.')
        if row and row[0]:
            send_max_message(int(row[0]), f'💬 *{staff_name}*:\n{reply_text}')
        print(f'[MAX-staff-reply] room={room_id_r} staff={staff_name} text={reply_text[:80]}')
        return True
    except Exception as e:
        print(f'[MAX-staff-reply] error: {e}')
        send_max_message(notify_chat_id, f'❌ Ошибка: {e}')
        return True


def handle_message(msg: dict) -> dict:
    """Главный обработчик одного сообщения от MAX-пользователя."""
    sender = msg.get('sender') or msg.get('from') or {}
    chat = msg.get('chat') or {}
    # MAX присылает реальный chat_id в recipient.chat_id (НЕ в sender.user_id!)
    recipient = msg.get('recipient') or {}
    max_user_id = int(sender.get('user_id') or sender.get('id') or 0)
    max_chat_id = int(
        recipient.get('chat_id')  # ⬅ главный источник
        or chat.get('chat_id') or chat.get('id')
        or msg.get('chat_id')
        or max_user_id
    )
    chat_type = (recipient.get('chat_type') or chat.get('type') or chat.get('chat_type') or '').lower()
    name = (sender.get('name') or sender.get('first_name') or '').strip() or 'MAX-клиент'
    username = (sender.get('username') or '').strip()

    body = msg.get('body') or {}
    text = (body.get('text') or msg.get('text') or '').strip()

    if not max_user_id:
        _log('in', 'unknown_sender', text, payload=msg, error='no max_user_id')
        return {'ok': False}

    # Если это сообщение из ГРУППЫ/КАНАЛА
    if chat_type in ('chat', 'channel', 'group'):
        try:
            save_staff_channel(max_chat_id, chat_type, recipient.get('title') or chat.get('title') or '')
        except Exception:
            pass

        # Ответ сотрудника клиенту: формат ">N текст" или "!N текст" (N = room_id)
        if text and _handle_staff_reply(text, name, max_chat_id):
            _log('in', 'staff_reply', text[:200], max_chat_id=max_chat_id, payload=msg)
            return {'ok': True}

        _log('in', f'staff_channel:{chat_type}', text[:200], max_chat_id=max_chat_id, payload=msg)
        return {'ok': True}

    # 0. Сотрудник отвечает клиенту из личного диалога с ботом: ">N текст"
    if text and re.match(r'^[>!]\d+\s+', text):
        if _handle_staff_reply(text, name, max_chat_id):
            _log('in', 'staff_reply_dm', text[:200], max_user_id=max_user_id, max_chat_id=max_chat_id, payload=msg)
            return {'ok': True}

    client_id, room_id = get_or_create_max_client(max_user_id, max_chat_id, name, username)

    # 1. Команды (Russian + English)
    cmd_map = {
        '/start': 'home', '/help': 'home', '/menu': 'home', '/меню': 'home',
        '/buy': 'buy', '/оценить': 'buy', '/sell': 'buy', '/скупка': 'buy',
        '/repair': 'repair', '/ремонт': 'repair',
        '/catalog': 'catalog', '/каталог': 'catalog',
        '/gold': 'gold', '/золото': 'gold', '/цена_золота': 'gold',
        '/branches': 'branches', '/филиалы': 'branches', '/адреса': 'branches',
        '/contact': 'contact', '/контакты': 'contact', '/менеджер': 'contact',
        '/orders': 'my_orders', '/мои_заявки': 'my_orders', '/заявки': 'my_orders',
        '/review': 'review', '/отзыв': 'review',
    }
    cmd_key = cmd_map.get(text.lower().split()[0] if text else '')
    if cmd_key:
        dispatch_menu(cmd_key, max_chat_id, max_user_id)
        _log('in', 'command', text, max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, pchat_room_id=room_id, payload=msg)
        return {'ok': True}

    # /оплатить N или /pay N
    pay_match = re.match(r'^/(оплатить|pay)\s+#?(\d+)\s*$', text, re.IGNORECASE)
    if pay_match:
        dispatch_menu(f'pay:{pay_match.group(2)}', max_chat_id, max_user_id)
        _log('in', 'command', text, max_user_id=max_user_id, max_chat_id=max_chat_id, payload=msg)
        return {'ok': True}

    # 2. Запрос статуса ремонта: #10 или просто "10"
    m = re.match(r'^#?\s*(\d{1,6})\s*$', text)
    if m:
        oid = int(m.group(1))
        dispatch_menu(f'status:{oid}', max_chat_id, max_user_id)
        _log('in', 'repair_status', text, max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, payload=msg)
        return {'ok': True}

    # 3. Обычный текст — кладём в LIVE-чат, сотрудник ответит из Staff
    if text:
        mid = insert_client_message(room_id, client_id, name, text)
        if len(text) > 5:
            send_max_message(
                max_chat_id,
                "✅ Принял ваш вопрос. Менеджер ответит в ближайшие минуты прямо здесь, в MAX.",
                reply_markup={'buttons': [
                    [{'type': 'callback', 'text': '⬅ В главное меню', 'payload': 'menu:home'}]
                ]}
            )
        _log('in', 'text', text, max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, pchat_room_id=room_id, payload=msg)
        return {'ok': True, 'message_id': mid}

    return {'ok': True}


def lookup_chat_id_by_user(max_user_id: int) -> int | None:
    """Берём правильный chat_id из pchat_clients (сохранён при первом /start)."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT max_chat_id FROM {SCHEMA}.pchat_clients "
            f"WHERE max_user_id={int(max_user_id)} AND max_chat_id IS NOT NULL "
            f"ORDER BY last_seen_at DESC NULLS LAST LIMIT 1"
        )
        r = cur.fetchone(); cur.close(); conn.close()
        if r and r[0]:
            return int(r[0])
    except Exception as e:
        print(f'[MAX] lookup_chat_id_by_user error: {e}')
    return None


def answer_callback(callback_id: str, text: str | None = None, notification: str | None = None) -> tuple[bool, dict]:
    """Ответ на нажатие inline-кнопки. MAX API: POST /answers?callback_id=..."""
    if not callback_id:
        return False, {'error': 'empty callback_id'}
    payload: dict = {}
    if notification:
        payload['notification'] = notification
    if text is not None:
        # message-объект для замены текста (если нужно)
        payload['message'] = {'text': text, 'format': 'markdown'}
    return max_call('answers', params={'callback_id': callback_id}, payload=payload or {'notification': '✓'})


def handle_callback(cb: dict) -> dict:
    """Нажатие inline-кнопки (тип callback).
    В MAX callback приходит БЕЗ chat_id — только user_id и callback_id.
    Поэтому chat_id берём из БД (сохранён, когда юзер первый раз писал /start)."""
    sender = cb.get('user') or cb.get('sender') or cb.get('from') or {}
    max_user_id = int(sender.get('user_id') or sender.get('id') or 0)
    payload = cb.get('payload') or cb.get('data') or cb.get('callback_data') or ''
    callback_id = cb.get('callback_id') or ''

    if not max_user_id:
        _log('in', 'callback_no_user', payload, payload=cb, error='no max_user_id')
        return {'ok': False}

    # 1. Ищем правильный chat_id в БД
    max_chat_id = lookup_chat_id_by_user(max_user_id)

    # 2. Если не нашли — пробуем достать из вложенных полей (на всякий случай)
    if not max_chat_id:
        msg_obj = cb.get('message') or {}
        recipient = msg_obj.get('recipient') or cb.get('recipient') or {}
        chat = msg_obj.get('chat') or cb.get('chat') or {}
        max_chat_id = int(
            recipient.get('chat_id')
            or chat.get('chat_id') or chat.get('id')
            or 0
        )

    if not max_chat_id:
        # Совсем нет chat_id — пробуем хотя бы коротким ответом на callback
        if callback_id:
            answer_callback(callback_id, notification='Нажмите /start для активации меню')
        _log('in', 'callback_no_chat', payload, max_user_id=max_user_id, payload=cb,
             error='no chat_id; user must press /start first')
        return {'ok': False, 'reason': 'no_chat_id'}

    # 3. Подтверждаем нажатие (убираем «крутилку» с кнопки в UI)
    if callback_id:
        try:
            answer_callback(callback_id)
        except Exception as e:
            print(f'[MAX] answer_callback failed: {e}')

    # 4. Диспатчим меню
    if payload.startswith('menu:'):
        key = payload.split(':', 1)[1]
        dispatch_menu(key, max_chat_id, max_user_id)
        _log('in', 'callback', payload, max_user_id=max_user_id, max_chat_id=max_chat_id, payload=cb)
        return {'ok': True}

    _log('in', 'callback_unknown', payload, max_user_id=max_user_id, max_chat_id=max_chat_id, payload=cb)
    return {'ok': True}


# ─────────────── привязка сотруднического канала/группы ───────────

def save_staff_channel(chat_id: int, chat_type: str, title: str = '') -> None:
    """Сохраняет ID канала/группы в settings — туда будут лететь дубликаты заявок."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.settings (key, value) VALUES ('max_staff_channel_id', {_esc(str(chat_id))}) "
            f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.settings (key, value) VALUES ('max_staff_channel_title', {_esc(title or chat_type)}) "
            f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
        )
        conn.commit(); cur.close(); conn.close()
    except Exception as e:
        print(f'[MAX] save_staff_channel error: {e}')


def get_staff_channel_id() -> int | None:
    """Читает сохранённый ID staff-канала из settings."""
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='max_staff_channel_id' LIMIT 1")
        r = cur.fetchone(); cur.close(); conn.close()
        if r and r[0]:
            v = int(r[0])
            return v if v > 0 else None
    except Exception:
        pass
    return None


def notify_staff_max(text: str) -> bool:
    """Отправляет уведомление в staff-канал MAX (если он привязан). Возвращает True если доставлено."""
    cid = get_staff_channel_id()
    if not cid:
        return False
    try:
        ok, _ = send_max_message(cid, text)
        return ok
    except Exception:
        return False


# ─────────────────────── actions ────────────────────────────────────

def action_webhook(body: dict) -> dict:
    """Входная точка webhook от MAX. MAX шлёт разные типы update — обрабатываем известные."""
    update_type = body.get('update_type') or body.get('type') or ''

    if update_type in ('message_created', 'message', 'bot_started'):
        msg = body.get('message') or body
        handle_message(msg)
        return _ok({'ok': True})

    if update_type in ('message_callback', 'callback'):
        handle_callback(body.get('callback') or body)
        return _ok({'ok': True})

    # Бота добавили в канал/группу — сохраняем chat_id как staff-канал или news-канал
    if update_type in ('bot_added', 'chat_member_updated', 'message_chat_created'):
        chat = body.get('chat') or body.get('recipient') or body
        chat_id = chat.get('chat_id') or chat.get('id')
        chat_type = (chat.get('type') or chat.get('chat_type') or 'chat').lower()
        title = chat.get('title') or ''
        if chat_id:
            try:
                # Каналы (channel) — для публикации новостей. Группы (chat/group) — staff.
                if chat_type == 'channel':
                    conn = _conn(); cur = conn.cursor()
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.settings (key, value) VALUES ('max_news_channel_id', {_esc(str(int(chat_id)))}) "
                        f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
                    )
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.settings (key, value) VALUES ('max_news_channel_title', {_esc(title or 'channel')}) "
                        f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
                    )
                    conn.commit(); cur.close(); conn.close()
                    _log('in', f'bot_added:news_channel', title, max_chat_id=int(chat_id), payload=body)
                    send_max_message(int(chat_id),
                        f"✅ Бот *Скупка24* подключён к каналу «{title or 'канал'}».\n"
                        f"Сюда будут публиковаться новости автоматически (раз в 5 часов).")
                else:
                    save_staff_channel(int(chat_id), chat_type, title)
                    _log('in', f'bot_added:{chat_type}', title, max_chat_id=int(chat_id), payload=body)
                    send_max_message(int(chat_id),
                        f"✅ Бот *Скупка24* подключён к группе «{title or chat_type}».\n"
                        f"Сюда будут приходить заявки и сообщения клиентов.")
            except Exception as e:
                _log('in', update_type, '', payload=body, error=str(e))
        return _ok({'ok': True})

    # Если MAX шлёт без update_type — пробуем как message
    if body.get('sender') or body.get('from') or body.get('text'):
        handle_message(body)
        return _ok({'ok': True})

    _log('in', update_type or 'unknown', '', payload=body)
    return _ok({'ok': True, 'ignored': update_type})


def _normalize_phone(phone: str) -> str:
    """Нормализация телефона до 11 цифр, начинающихся с 7."""
    digits = ''.join(c for c in (phone or '') if c.isdigit())
    if len(digits) == 11 and digits.startswith('8'):
        digits = '7' + digits[1:]
    elif len(digits) == 10:
        digits = '7' + digits
    return digits


def find_max_chat_by_phone(phone: str) -> int | None:
    """Ищет max_chat_id по телефону клиента (если он привязал MAX к pchat_clients)."""
    p = _normalize_phone(phone)
    if len(p) != 11:
        return None
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT max_chat_id FROM {SCHEMA}.pchat_clients "
            f"WHERE phone={_esc(p)} AND max_chat_id IS NOT NULL LIMIT 1"
        )
        r = cur.fetchone(); cur.close(); conn.close()
        return int(r[0]) if r and r[0] else None
    except Exception:
        return None


def action_send(body: dict) -> dict:
    """Отправить сообщение в MAX. Кому (одно из):
    - max_chat_id (int)
    - pchat_client_id (int) — найдём max_chat_id в pchat_clients
    - phone (str) — найдём клиента по нормализованному телефону
    Параметры: text (str), reply_markup (dict, optional) — inline-кнопки MAX.
    Возвращает {ok, response, delivered}. delivered=false если адресата нет в MAX-боте — не ошибка."""
    text = (body.get('text') or '').strip()
    if not text:
        return _err(400, 'text обязателен')

    max_chat_id = body.get('max_chat_id')
    pchat_client_id = body.get('pchat_client_id')
    phone = (body.get('phone') or '').strip()
    reply_markup = body.get('reply_markup')

    if not max_chat_id and pchat_client_id:
        try:
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"SELECT max_chat_id FROM {SCHEMA}.pchat_clients WHERE id={int(pchat_client_id)} LIMIT 1"
            )
            r = cur.fetchone(); cur.close(); conn.close()
            if r and r[0]:
                max_chat_id = int(r[0])
        except Exception:
            pass
    if not max_chat_id and phone:
        max_chat_id = find_max_chat_by_phone(phone)

    if not max_chat_id:
        # Не ошибка — просто клиент не в MAX-боте
        return _ok({'ok': True, 'delivered': False, 'reason': 'no_max_chat_for_recipient'})

    ok, d = send_max_message(int(max_chat_id), text, reply_markup=reply_markup)
    _log('out', 'send', text, max_chat_id=int(max_chat_id),
         pchat_client_id=int(pchat_client_id) if pchat_client_id else None,
         payload=d, error='' if ok else json.dumps(d, ensure_ascii=False)[:300])
    return _ok({'ok': ok, 'delivered': ok, 'response': d})


def action_staff_send(body: dict) -> dict:
    """Отправить сообщение во ВСЕ staff-каналы MAX:
    1) staff-канал (если бот добавлен в группу/канал),
    2) личные ID владельцев из MAX_OWNER_USER_ID (через запятую) — приходит в личку MAX-бота.
    Используется из send-lead, repair-order, repair-admin, public-chat."""
    text = (body.get('text') or '').strip()
    if not text:
        return _err(400, 'text обязателен')
    targets: list[int] = []
    cid = get_staff_channel_id()
    if cid:
        targets.append(int(cid))
    # Личные получатели — владельцы
    owners_raw = (os.environ.get('MAX_OWNER_USER_ID') or '').strip()
    for piece in owners_raw.replace(' ', '').split(','):
        if piece.isdigit():
            uid = int(piece)
            if uid and uid not in targets:
                targets.append(uid)
    if not targets:
        return _ok({'ok': True, 'delivered': False, 'reason': 'no_targets',
                    'hint': 'Добавь бота в канал ИЛИ заполни секрет MAX_OWNER_USER_ID'})
    delivered = 0
    last_resp: dict = {}
    for tid in targets:
        ok, d = send_max_message(tid, text)
        last_resp = d
        _log('out', 'staff_send', text, max_chat_id=tid,
             payload=d, error='' if ok else json.dumps(d, ensure_ascii=False)[:300])
        if ok:
            delivered += 1
    return _ok({'ok': delivered > 0, 'delivered': delivered, 'targets': targets,
                'response': last_resp})


def action_staff_status() -> dict:
    """Показать привязан ли staff-канал."""
    cid = get_staff_channel_id()
    title = ''
    if cid:
        try:
            conn = _conn(); cur = conn.cursor()
            cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='max_staff_channel_title' LIMIT 1")
            r = cur.fetchone(); cur.close(); conn.close()
            if r and r[0]:
                title = r[0]
        except Exception:
            pass
    return _ok({'ok': True, 'bound': bool(cid), 'channel_id': cid, 'title': title})


def action_setup_webhook(body: dict, headers: dict) -> dict:
    """Регистрирует webhook у MAX. Защищено admin-токеном (в header X-Admin-Token
    или в body.admin)."""
    admin_token = (
        headers.get('X-Admin-Token')
        or headers.get('x-admin-token')
        or (body.get('admin') or '')
    )
    if admin_token != os.environ.get('ADMIN_TOKEN', ''):
        return _err(401, 'admin token required')
    url = (body.get('url') or '').strip()
    if not url:
        return _err(400, 'url (адрес webhook) обязателен')
    ok, d = max_call('subscriptions', payload={
        'url': url,
        'update_types': ['message_created', 'bot_started', 'message_callback']
    })
    return _ok({'ok': ok, 'webhook_url': url, 'response': d})


def action_info() -> dict:
    """getMe — для проверки токена и для frontend, чтобы получить ссылку на бота."""
    ok, d = max_call('me')
    bot_link = ''
    if ok:
        username = d.get('username') or d.get('user_name') or ''
        if username:
            bot_link = f'https://max.ru/{username}'
    return _ok({'ok': ok, 'bot': d, 'bot_link': bot_link})


def action_subscriptions() -> dict:
    """Показать какие webhook-подписки уже зарегистрированы у бота в MAX."""
    ok, d = max_call('subscriptions')
    return _ok({'ok': ok, 'subscriptions': d})


def _check_admin(headers: dict, qp: dict, body: dict) -> bool:
    """Проверка X-Admin-Token (заголовок / query / body)."""
    expected = os.environ.get('ADMIN_TOKEN', '')
    if not expected:
        return False
    got = (
        headers.get('X-Admin-Token')
        or headers.get('x-admin-token')
        or (qp.get('admin') if isinstance(qp, dict) else '')
        or (body.get('admin') if isinstance(body, dict) else '')
        or ''
    )
    return got == expected


def action_broadcast(body: dict, headers: dict, qp: dict) -> dict:
    """Массовая рассылка всем подписчикам MAX-бота.
    Body: {text: str, dry_run?: bool}. Требует X-Admin-Token."""
    if not _check_admin(headers, qp, body):
        return _err(401, 'admin token required')
    text = (body.get('text') or '').strip()
    if not text:
        return _err(400, 'text обязателен')
    dry_run = bool(body.get('dry_run'))
    try:
        conn = _conn(); cur = conn.cursor()
        cur.execute(
            f"SELECT max_chat_id, display_name FROM {SCHEMA}.pchat_clients "
            f"WHERE max_chat_id IS NOT NULL"
        )
        rows = cur.fetchall(); cur.close(); conn.close()
    except Exception as e:
        return _err(500, f'db error: {e}')
    total = len(rows)
    if dry_run:
        return _ok({'ok': True, 'dry_run': True, 'total': total})
    import time
    sent = 0; failed = 0
    for chat_id, _name in rows:
        try:
            ok, d = send_max_message(int(chat_id), text)
            if ok:
                sent += 1
            else:
                failed += 1
                _log('out', 'broadcast', text, max_chat_id=int(chat_id),
                     payload=d, error=json.dumps(d, ensure_ascii=False)[:300])
        except Exception as e:
            failed += 1
            _log('out', 'broadcast', text, max_chat_id=int(chat_id), error=str(e)[:300])
        time.sleep(0.1)
    return _ok({'ok': True, 'sent': sent, 'failed': failed, 'total': total})


def action_list_clients(headers: dict, qp: dict) -> dict:
    """GET список подписчиков MAX-бота для админки. Требует X-Admin-Token.
    Возвращает до 200 клиентов, отсортированных по last_seen_at DESC."""
    if not _check_admin(headers, qp, {}):
        return _err(401, 'admin token required')
    try:
        conn = _conn(); cur = conn.cursor()
        # LEFT JOIN на leads_tracking — есть ли заявка по этому телефону
        cur.execute(
            f"SELECT c.id, c.max_user_id, c.display_name, c.max_username, c.phone, "
            f"c.last_seen_at, "
            f"EXISTS(SELECT 1 FROM {SCHEMA}.leads_tracking lt "
            f"  WHERE REGEXP_REPLACE(lt.client_phone, '[^0-9]', '', 'g') = "
            f"        REGEXP_REPLACE(c.phone, '[^0-9]', '', 'g') "
            f"  AND c.phone IS NOT NULL AND c.phone NOT LIKE 'max:%') AS has_lead "
            f"FROM {SCHEMA}.pchat_clients c "
            f"WHERE c.max_chat_id IS NOT NULL "
            f"ORDER BY c.last_seen_at DESC NULLS LAST "
            f"LIMIT 200"
        )
        rows = cur.fetchall(); cur.close(); conn.close()
    except Exception as e:
        return _err(500, f'db error: {e}')
    items = []
    for r in rows:
        cid, max_user_id, display_name, max_username, phone, last_seen_at, has_lead = r
        # Скрываем «синтетические» phone вида 'max:<id>' — для UI это пусто
        phone_clean = phone if (phone and not str(phone).startswith('max:')) else ''
        items.append({
            'id': int(cid),
            'max_user_id': int(max_user_id) if max_user_id else None,
            'display_name': display_name or '',
            'max_username': max_username or '',
            'phone': phone_clean,
            'last_seen_at': last_seen_at.isoformat() if last_seen_at else None,
            'has_lead': bool(has_lead),
        })
    return _ok({'ok': True, 'clients': items, 'count': len(items)})


def action_auto_setup_webhook(qp: dict) -> dict:
    """Разовая регистрация webhook. Защита: admin-токен в query ?admin=<TOKEN>.
    Использование: GET /?action=auto_setup_webhook&admin=<TOKEN>&url=<WEBHOOK_URL>"""
    got_admin = (qp.get('admin') or '').strip()
    expected = os.environ.get('ADMIN_TOKEN', '')
    if got_admin != expected:
        return _err(401, f'admin token mismatch; got_len={len(got_admin)}, expected_len={len(expected)}, qp_keys={list(qp.keys())}')
    url = (qp.get('url') or '').strip()
    if not url:
        return _err(400, 'url query parameter required')
    ok, d = max_call('subscriptions', payload={'url': url, 'update_types': [
        'message_created', 'bot_started', 'message_callback'
    ]})
    return _ok({'ok': ok, 'webhook_url': url, 'response': d})


# ─────────────────────── handler ────────────────────────────────────

def handler(event: dict, context) -> dict:
    """MAX-бот: webhook от мессенджера MAX + утилиты отправки сообщений клиентам."""
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    headers = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    qp = event.get('queryStringParameters') or {}
    raw = event.get('body') or '{}'
    try:
        body = json.loads(raw) if isinstance(raw, str) else (raw or {})
    except Exception:
        body = {}

    action = (qp.get('action') or body.get('action') or '').strip()

    if method == 'GET' and action == 'info':
        return action_info()

    if method == 'GET' and action == 'subscriptions':
        return action_subscriptions()

    if method == 'GET' and action == 'auto_setup_webhook':
        return action_auto_setup_webhook(qp)

    # Одноразовая регистрация webhook. URL хардкоден.
    if action == 'selfbind':
        own_url = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'
        ok, d = max_call('subscriptions', payload={
            'url': own_url,
            'update_types': ['message_created', 'bot_started', 'message_callback']
        })
        return _ok({'ok': ok, 'webhook_url': own_url, 'response': d, 'method_was': method})

    if method == 'POST' and action == 'send':
        return action_send(body)

    if method == 'POST' and action == 'staff_send':
        return action_staff_send(body)

    if method == 'GET' and action == 'staff_status':
        return action_staff_status()

    # Постинг в MAX-канал новостей (chat_id из settings.max_news_channel_id)
    if method == 'POST' and action == 'send_to_chat':
        text = (body.get('text') or '').strip()
        if not text:
            return _err(400, 'text обязателен')
        # Канал-получатель: явно из body или из settings.max_news_channel_id
        target_id = body.get('chat_id')
        if not target_id:
            try:
                conn = _conn(); cur = conn.cursor()
                cur.execute(f"SELECT value FROM {SCHEMA}.settings WHERE key='max_news_channel_id' LIMIT 1")
                r = cur.fetchone(); cur.close(); conn.close()
                if r and r[0]:
                    target_id = int(r[0])
            except Exception:
                target_id = None
        if not target_id:
            return _ok({'ok': True, 'delivered': False, 'reason': 'no_max_news_channel'})
        ok, d = send_max_message(int(target_id), text)
        _log('out', 'news_to_channel', text, max_chat_id=int(target_id),
             payload=d, error='' if ok else json.dumps(d, ensure_ascii=False)[:300])
        return _ok({'ok': ok, 'delivered': ok, 'channel_id': int(target_id), 'response': d})

    # Привязка канала новостей: GET ?action=bind_news_channel&chat_id=...
    if action == 'bind_news_channel':
        cid_str = (qp.get('chat_id') or '').strip()
        if not cid_str.lstrip('-').isdigit():
            return _err(400, 'chat_id query param required')
        try:
            conn = _conn(); cur = conn.cursor()
            cur.execute(
                f"INSERT INTO {SCHEMA}.settings (key, value) VALUES ('max_news_channel_id', {_esc(cid_str)}) "
                f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value"
            )
            conn.commit(); cur.close(); conn.close()
        except Exception as e:
            return _err(500, f'db error: {e}')
        return _ok({'ok': True, 'max_news_channel_id': int(cid_str)})

    # Диагностика: GET ?action=test_owner — отправить владельцу простой тест
    if action == 'test_owner':
        owners_raw = (os.environ.get('MAX_OWNER_USER_ID') or '').strip()
        results = []
        for piece in owners_raw.replace(' ', '').split(','):
            if piece.isdigit():
                uid = int(piece)
                ok, d = send_max_message(uid, 'Тест от Скупка24. Если видишь это сообщение - связь работает!')
                results.append({'uid': uid, 'ok': ok, 'resp': d})
        return _ok({'ok': True, 'env_value': owners_raw, 'results': results})

    # Диагностика: GET ?action=test_send&uid=28799083 — послать на конкретный uid
    if action == 'test_send':
        uid_str = (qp.get('uid') or '').strip()
        if not uid_str.isdigit():
            return _err(400, 'uid query param required')
        ok1, d1 = send_max_message(int(uid_str), 'TEST1: простой текст без markdown без кнопок')
        ok2, d2 = max_call('messages', params={'chat_id': int(uid_str)}, payload={
            'text': 'TEST2: текст + markdown *жирный* _курсив_',
            'format': 'markdown'
        })
        ok3, d3 = max_call('messages', params={'chat_id': int(uid_str)}, payload={
            'text': 'TEST3: с кнопками',
            'attachments': [{'type': 'inline_keyboard', 'payload': {'buttons': [
                [{'type': 'callback', 'text': 'Кнопка 1', 'payload': 'test:1'}],
            ]}}]
        })
        return _ok({'uid': int(uid_str),
                    'test1_plain': {'ok': ok1, 'resp': d1},
                    'test2_markdown': {'ok': ok2, 'resp': d2},
                    'test3_buttons': {'ok': ok3, 'resp': d3}})

    # Обновить webhook на расширенный список update_types
    if action == 'resubscribe':
        own_url = 'https://functions.poehali.dev/4618b13e-cd61-4167-b943-0f3d439d0c8c'
        ok, d = max_call('subscriptions', payload={
            'url': own_url,
            'update_types': [
                'message_created', 'bot_started', 'message_callback',
                'bot_added', 'message_chat_created',
            ]
        })
        return _ok({'ok': ok, 'webhook_url': own_url, 'response': d})

    if method == 'POST' and action == 'setup_webhook':
        return action_setup_webhook(body, headers)

    # Массовая рассылка всем подписчикам MAX-бота (требует admin token)
    if method == 'POST' and action == 'broadcast':
        # headers здесь уже lower-cased в начале handler — пробросим оба ключа
        # для совместимости
        hdrs_for_check = {**headers}
        # original-case дублируем, т.к. _check_admin ищет 'X-Admin-Token' и 'x-admin-token'
        hdrs_for_check['X-Admin-Token'] = headers.get('x-admin-token', '')
        return action_broadcast(body, hdrs_for_check, qp)

    # Список подписчиков MAX-бота для админки (требует admin token)
    if method == 'GET' and action == 'list_clients':
        hdrs_for_check = {**headers}
        hdrs_for_check['X-Admin-Token'] = headers.get('x-admin-token', '')
        return action_list_clients(hdrs_for_check, qp)

    # Дефолт: всё остальное — это webhook от MAX
    if method == 'POST':
        return action_webhook(body)

    return _err(405, 'Method not allowed')