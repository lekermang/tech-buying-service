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

def max_call(method: str, params: dict | None = None, payload: dict | None = None) -> tuple[bool, dict]:
    """Универсальный вызов botapi.max.ru. method — путь после /, например 'sendMessage'.
    MAX API похож на Telegram: GET с access_token либо POST JSON body."""
    token = os.environ.get('MAX_BOT_TOKEN', '')
    if not token:
        return False, {'error': 'MAX_BOT_TOKEN не задан'}
    url = f'{MAX_API_URL}/{method}'
    q = {'access_token': token}
    if params:
        q.update(params)
    try:
        if payload is not None:
            r = requests.post(url, params=q, json=payload, timeout=15)
        else:
            r = requests.get(url, params=q, timeout=15)
        try:
            d = r.json()
        except Exception:
            d = {'raw': (r.text or '')[:300]}
        ok = r.status_code == 200 and not d.get('error') and not d.get('code')
        return ok, d
    except Exception as e:
        return False, {'error': f'{type(e).__name__}: {e}'}


def send_max_message(chat_id: int, text: str, reply_markup: dict | None = None) -> tuple[bool, dict]:
    """Отправляет текст в чат с пользователем MAX. chat_id — то, что пришло в webhook."""
    payload = {'text': text}
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

WELCOME_TEXT = (
    "👋 Здравствуйте! Это Скупка24 — выкуп техники, ремонт, каталог Б/У.\n\n"
    "Чем могу помочь?\n\n"
    "📱 *Скупка* — оценим вашу технику и купим за 15 минут\n"
    "🔧 *Ремонт* — починим за 1 день, гарантия 90 дней\n"
    "🛒 *Каталог* — проверенные Б/У смартфоны\n"
    "📞 *Контакты* — адрес и телефон\n\n"
    "Или просто напишите ваш вопрос — менеджер ответит за минуту.\n"
    "Чтобы узнать статус ремонта — отправьте *#номер* (например `#10`)."
)


def cmd_start(chat_id: int, max_user_id: int) -> dict:
    keyboard = {
        'buttons': [
            [{'type': 'callback', 'text': '📱 Скупка', 'payload': 'menu:buy'}],
            [{'type': 'callback', 'text': '🔧 Ремонт', 'payload': 'menu:repair'}],
            [{'type': 'callback', 'text': '🛒 Каталог', 'payload': 'menu:catalog'}],
            [{'type': 'callback', 'text': '📞 Контакты', 'payload': 'menu:contacts'}],
        ]
    }
    send_max_message(chat_id, WELCOME_TEXT, reply_markup=keyboard)
    return {'ok': True}


MENU_TEXTS = {
    'buy': (
        "📱 *Скупка техники*\n\n"
        "Покупаем iPhone, Android, ноутбуки, планшеты, часы.\n"
        "Оценка за 5 минут, оплата сразу — наличные или на карту.\n\n"
        "Напишите модель и состояние — пришлю ориентир по цене."
    ),
    'repair': (
        "🔧 *Ремонт*\n\n"
        "iPhone, Android, ноутбуки. Гарантия 90 дней.\n"
        "Если уже сдали технику — пришлите *#номер заявки*, скажу статус.\n\n"
        "Напишите модель и проблему — расскажу сроки и цену."
    ),
    'catalog': (
        "🛒 *Каталог Б/У*\n\n"
        "Проверенные iPhone, Android, планшеты.\n"
        "Полный каталог: https://skypka24.com/catalog\n\n"
        "Напишите что ищете — подскажу что есть в наличии."
    ),
    'contacts': (
        "📞 *Контакты*\n\n"
        "Калуга, ул. Кирова, 7\n"
        "Тел.: 8-800-600-68-33\n"
        "Часы работы: 10:00–21:00 ежедневно\n\n"
        "Сайт: https://skypka24.com"
    ),
}


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

def handle_message(msg: dict) -> dict:
    """Главный обработчик одного сообщения от MAX-пользователя."""
    sender = msg.get('sender') or msg.get('from') or {}
    chat = msg.get('chat') or {}
    max_user_id = int(sender.get('user_id') or sender.get('id') or 0)
    max_chat_id = int(chat.get('chat_id') or chat.get('id') or msg.get('chat_id') or max_user_id)
    name = (sender.get('name') or sender.get('first_name') or '').strip() or 'MAX-клиент'
    username = (sender.get('username') or '').strip()

    body = msg.get('body') or {}
    text = (body.get('text') or msg.get('text') or '').strip()

    if not max_user_id:
        _log('in', 'unknown_sender', text, payload=msg, error='no max_user_id')
        return {'ok': False}

    client_id, room_id = get_or_create_max_client(max_user_id, max_chat_id, name, username)

    # 1. Команды
    if text.startswith('/start'):
        cmd_start(max_chat_id, max_user_id)
        _log('in', 'command', '/start', max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, pchat_room_id=room_id, payload=msg)
        return {'ok': True}

    if text.startswith('/help'):
        send_max_message(max_chat_id, WELCOME_TEXT)
        _log('in', 'command', '/help', max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, payload=msg)
        return {'ok': True}

    # 2. Запрос статуса ремонта: #10 или просто "10"
    m = re.match(r'^#?\s*(\d{1,6})\s*$', text)
    if m:
        oid = int(m.group(1))
        info = repair_status_by_id(oid)
        if info:
            send_max_message(max_chat_id, info)
        else:
            send_max_message(max_chat_id, f"❓ Ремонт #{oid} не найден. Проверьте номер или напишите ваш вопрос — менеджер ответит.")
        _log('in', 'repair_status', text, max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, payload=msg)
        return {'ok': True}

    # 3. Обычный текст — кладём в LIVE-чат, сотрудник ответит из Staff
    if text:
        mid = insert_client_message(room_id, client_id, name, text)
        # Автоответ клиенту (только если сообщение длиннее 3 символов — не на «спасибо»)
        if len(text) > 5:
            send_max_message(
                max_chat_id,
                "✅ Принял ваш вопрос. Менеджер ответит в ближайшие минуты прямо здесь, в MAX.\n\n"
                "_Чтобы посмотреть меню — отправьте /start_"
            )
        _log('in', 'text', text, max_user_id=max_user_id, max_chat_id=max_chat_id,
             pchat_client_id=client_id, pchat_room_id=room_id, payload=msg)
        return {'ok': True, 'message_id': mid}

    return {'ok': True}


def handle_callback(cb: dict) -> dict:
    """Нажатие inline-кнопки (тип callback)."""
    sender = cb.get('user') or cb.get('sender') or {}
    max_user_id = int(sender.get('user_id') or sender.get('id') or 0)
    chat = cb.get('message', {}).get('recipient') or cb.get('message', {}).get('chat') or {}
    max_chat_id = int(chat.get('chat_id') or chat.get('id') or max_user_id)
    payload = cb.get('payload') or cb.get('data') or ''

    if not max_user_id or not max_chat_id:
        return {'ok': False}

    if payload.startswith('menu:'):
        key = payload.split(':', 1)[1]
        send_max_message(max_chat_id, MENU_TEXTS.get(key, WELCOME_TEXT))
        _log('in', 'callback', payload, max_user_id=max_user_id, max_chat_id=max_chat_id, payload=cb)
        return {'ok': True}

    _log('in', 'callback_unknown', payload, max_user_id=max_user_id, max_chat_id=max_chat_id, payload=cb)
    return {'ok': True}


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

    # Если MAX шлёт без update_type — пробуем как message
    if body.get('sender') or body.get('from') or body.get('text'):
        handle_message(body)
        return _ok({'ok': True})

    _log('in', update_type or 'unknown', '', payload=body)
    return _ok({'ok': True, 'ignored': update_type})


def action_send(body: dict) -> dict:
    """Отправить сообщение в MAX. Параметры:
    - max_chat_id (int) ИЛИ pchat_client_id (int) — кому
    - text (str) — что отправить
    Используется внутренними сервисами (public-chat при ответе сотрудника, repair-admin при статусе)."""
    text = (body.get('text') or '').strip()
    if not text:
        return _err(400, 'text обязателен')

    max_chat_id = body.get('max_chat_id')
    pchat_client_id = body.get('pchat_client_id')
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
    if not max_chat_id:
        return _err(400, 'Не найден MAX-чат для адресата')

    ok, d = send_max_message(int(max_chat_id), text)
    _log('out', 'send', text, max_chat_id=int(max_chat_id),
         pchat_client_id=int(pchat_client_id) if pchat_client_id else None,
         payload=d, error='' if ok else json.dumps(d, ensure_ascii=False)[:300])
    return _ok({'ok': ok, 'response': d})


def action_setup_webhook(body: dict, headers: dict) -> dict:
    """Регистрирует webhook у MAX. Защищено X-Admin-Token. Вызывается разово."""
    admin_token = headers.get('X-Admin-Token') or headers.get('x-admin-token') or ''
    if admin_token != os.environ.get('ADMIN_TOKEN', ''):
        return _err(401, 'admin token required')
    url = (body.get('url') or '').strip()
    if not url:
        return _err(400, 'url (адрес webhook) обязателен')
    ok, d = max_call('subscriptions', payload={'url': url})
    return _ok({'ok': ok, 'response': d})


def action_info() -> dict:
    """getMe — для проверки токена и для frontend, чтобы получить ссылку на бота."""
    ok, d = max_call('me')
    bot_link = ''
    if ok:
        username = d.get('username') or d.get('user_name') or ''
        if username:
            bot_link = f'https://max.ru/{username}'
    return _ok({'ok': ok, 'bot': d, 'bot_link': bot_link})


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

    if method == 'POST' and action == 'send':
        return action_send(body)

    if method == 'POST' and action == 'setup_webhook':
        return action_setup_webhook(body, headers)

    # Дефолт: всё остальное — это webhook от MAX
    if method == 'POST':
        return action_webhook(body)

    return _err(405, 'Method not allowed')
