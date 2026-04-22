"""
Telegram Bot — Скупка24

Обрабатывает:
1. Команды /start (главное меню)
2. Callback-кнопки — навигация по разделам меню
3. Текстовые сообщения — статус заявки по номеру / ключевые слова
4. Фото/видео — направляем на сайт
5. Отправку уведомлений через API (action=send, action=send-photo, action=test)
6. Авторизацию через /start web_auth
"""

import json
import os
import re
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

import psycopg2
import telebot

SITE_URL = "https://skypka24.com"
SCHEMA = "t_p31606708_tech_buying_service"

STATUS_LABELS = {
    "new":           "🔔 Заявка принята",
    "accepted":      "✅ Принят мастером",
    "in_progress":   "🔧 В работе",
    "waiting_parts": "📦 Ожидаем запчасть",
    "ready":         "🟡 Готово — можно забирать!",
    "done":          "✅ Выдано",
    "warranty":      "🛡 На гарантии",
    "cancelled":     "❌ Отменено",
}

STATUS_DESC = {
    "new":           "Заявка зарегистрирована, ожидает приёмки мастером.",
    "accepted":      "Мастер принял устройство и приступает к диагностике.",
    "in_progress":   "Мастер работает над вашим устройством.",
    "waiting_parts": "Ожидаем поступления необходимых запчастей.",
    "ready":         "Ремонт завершён! Приходите забирать устройство.",
    "done":          "Устройство выдано владельцу.",
    "warranty":      "Устройство находится на гарантийном обслуживании.",
    "cancelled":     "Заявка отменена.",
}

KEYWORDS_SKUPKA = [
    "куп", "прод", "сдат", "обмен", "оцен", "сколько стоит", "сколько дадите",
    "iphone", "айфон", "samsung", "самсунг", "macbook", "макбук", "ipad", "айпад",
    "ноутбук", "планшет", "часы", "наушники", "золото", "серебро", "телефон",
    "смартфон", "скупка", "выкуп", "продам", "хочу продать",
]
KEYWORDS_REPAIR = [
    "ремонт", "починит", "сломал", "не работает", "разбил", "экран", "стекло",
    "батарея", "зарядк", "кнопка", "динамик", "микрофон", "камера", "не включается",
]


# =============================================================================
# HELPERS
# =============================================================================

def get_bot_token() -> str:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN not configured")
    return token


def get_bot() -> telebot.TeleBot:
    return telebot.TeleBot(get_bot_token())


def get_default_chat_id() -> str:
    return os.environ.get("TELEGRAM_CHAT_ID", "")


def get_cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGINS", "*"),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Bot-Api-Secret-Token",
    }


def cors_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**get_cors_headers(), "Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def options_response() -> dict:
    return {"statusCode": 204, "headers": get_cors_headers(), "body": ""}


# =============================================================================
# DB
# =============================================================================

def save_auth_token(telegram_id: str, username: Optional[str],
                    first_name: Optional[str], last_name: Optional[str]) -> str:
    token = str(uuid.uuid4())
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.telegram_auth_tokens
            (token_hash, telegram_id, telegram_username, telegram_first_name,
             telegram_last_name, telegram_photo_url, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (token_hash, telegram_id, username, first_name, last_name, None,
              datetime.now(timezone.utc) + timedelta(minutes=5)))
        conn.commit()
    finally:
        conn.close()
    return token


def get_order_status(order_id: int) -> Optional[dict]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, model, repair_type, status, admin_note, created_at "
            f"FROM {SCHEMA}.repair_orders WHERE id = %s",
            (order_id,)
        )
        row = cur.fetchone()
    finally:
        conn.close()
    if not row:
        return None
    oid, name, model, repair_type, status, admin_note, created_at = row
    return {
        "id": oid, "name": name, "model": model,
        "repair_type": repair_type, "status": status,
        "admin_note": admin_note, "created_at": created_at,
    }


def get_orders_by_phone(phone: str) -> list:
    phone_digits = re.sub(r"[^0-9]", "", phone)[-7:]
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        cur.execute(
            f"""SELECT id, name, model, repair_type, status, admin_note, created_at
                FROM {SCHEMA}.repair_orders
                WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s
                  AND status != 'cancelled'
                ORDER BY created_at DESC LIMIT 5""",
            ("%" + phone_digits + "%",)
        )
        rows = cur.fetchall()
    finally:
        conn.close()
    result = []
    for row in rows:
        oid, name, model, repair_type, status, admin_note, created_at = row
        result.append({
            "id": oid, "name": name, "model": model,
            "repair_type": repair_type, "status": status,
            "admin_note": admin_note, "created_at": created_at,
        })
    return result


# =============================================================================
# KEYBOARDS
# =============================================================================

def kb_main() -> telebot.types.InlineKeyboardMarkup:
    """Главное меню."""
    m = telebot.types.InlineKeyboardMarkup(row_width=1)
    m.add(
        telebot.types.InlineKeyboardButton("📱 Продать технику",      callback_data="menu_sell"),
        telebot.types.InlineKeyboardButton("💍 Сдать ювелирные украшения", callback_data="menu_jewelry"),
        telebot.types.InlineKeyboardButton("🔧 Ремонт телефона",       callback_data="menu_repair"),
        telebot.types.InlineKeyboardButton("🛒 Каталог Б/У техники",   callback_data="menu_catalog"),
        telebot.types.InlineKeyboardButton("🔍 Узнать статус ремонта", callback_data="menu_status"),
        telebot.types.InlineKeyboardButton("📍 Адреса и контакты",     callback_data="menu_contacts"),
    )
    return m


def kb_back() -> telebot.types.InlineKeyboardMarkup:
    """Кнопка назад."""
    m = telebot.types.InlineKeyboardMarkup()
    m.add(telebot.types.InlineKeyboardButton("← Главное меню", callback_data="menu_main"))
    return m


def kb_sell() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup(row_width=1)
    m.add(
        telebot.types.InlineKeyboardButton("📝 Оставить заявку на сайте", url=f"{SITE_URL}/#skupka"),
        telebot.types.InlineKeyboardButton("📞 Позвонить: 8-800",          url="tel:88007074040"),
        telebot.types.InlineKeyboardButton("← Главное меню",               callback_data="menu_main"),
    )
    return m


def kb_jewelry() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup(row_width=1)
    m.add(
        telebot.types.InlineKeyboardButton("📝 Оставить заявку на сайте", url=f"{SITE_URL}/#skupka"),
        telebot.types.InlineKeyboardButton("📞 Позвонить: 8-800",          url="tel:88007074040"),
        telebot.types.InlineKeyboardButton("← Главное меню",               callback_data="menu_main"),
    )
    return m


def kb_repair() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup(row_width=1)
    m.add(
        telebot.types.InlineKeyboardButton("📋 Оставить заявку на ремонт", url=f"{SITE_URL}/#repair"),
        telebot.types.InlineKeyboardButton("🔍 Узнать статус ремонта",     callback_data="menu_status"),
        telebot.types.InlineKeyboardButton("📞 Позвонить",                  url="tel:88007074040"),
        telebot.types.InlineKeyboardButton("← Главное меню",               callback_data="menu_main"),
    )
    return m


def kb_catalog() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup(row_width=1)
    m.add(
        telebot.types.InlineKeyboardButton("🛒 Открыть каталог",   url=f"{SITE_URL}/catalog"),
        telebot.types.InlineKeyboardButton("← Главное меню",       callback_data="menu_main"),
    )
    return m


def kb_contacts() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup(row_width=2)
    m.add(
        telebot.types.InlineKeyboardButton("📞 Позвонить",       url="tel:88007074040"),
        telebot.types.InlineKeyboardButton("🌐 Сайт",            url=SITE_URL),
    )
    m.add(
        telebot.types.InlineKeyboardButton("📍 Кирова, 11 на карте",   url="https://yandex.ru/maps/?text=Калининград+Кирова+11"),
        telebot.types.InlineKeyboardButton("📍 Кирова, 7/47 на карте", url="https://yandex.ru/maps/?text=Калининград+Кирова+7"),
    )
    m.add(telebot.types.InlineKeyboardButton("← Главное меню", callback_data="menu_main"))
    return m


def kb_status_ask() -> telebot.types.InlineKeyboardMarkup:
    m = telebot.types.InlineKeyboardMarkup()
    m.add(telebot.types.InlineKeyboardButton("← Главное меню", callback_data="menu_main"))
    return m


# =============================================================================
# MENU TEXTS
# =============================================================================

MAIN_TEXT = """👋 <b>Добро пожаловать в Скупка24!</b>

Работаем <b>24/7</b> — выкупаем дорого, ремонтируем быстро.

Выберите раздел:"""

SELL_TEXT = """📱 <b>Продать технику</b>

Выкупаем дорого и быстро:
• iPhone, Samsung, Xiaomi и другие смартфоны
• MacBook, ноутбуки, планшеты, iPad
• Apple Watch, AirPods, наушники
• Игровые консоли (PS, Xbox, Nintendo)
• Фотоаппараты и объективы

💰 <b>Цену назовём за 15 минут</b> после заявки
📦 Можно привезти лично или договориться о выезде

Оставьте заявку — перезвоним сами!"""

JEWELRY_TEXT = """💍 <b>Сдать ювелирные украшения</b>

Принимаем:
• Золото 585, 750, 999 пробы
• Серебро
• Бриллианты и драгоценные камни
• Лом золота

📊 <b>Текущий курс</b> — уточняйте по телефону или на сайте
⚡️ Оценка и выплата — в день обращения"""

REPAIR_TEXT = """🔧 <b>Ремонт телефонов</b>

Ремонтируем при вас за 20 минут:
• Замена стекла и дисплея — от 300 ₽
• Замена аккумулятора
• Ремонт разъёма зарядки
• Чистка после воды
• Любые неисправности

🛡 <b>Бесплатная диагностика</b>
✅ Оригинальные комплектующие
💳 Гарантия на все виды работ"""

CATALOG_TEXT = """🛒 <b>Каталог Б/У техники</b>

Проверенные устройства с гарантией <b>1 год</b>:
• iPhone от 3 000 ₽
• Samsung, Xiaomi и другие
• MacBook, ноутбуки
• iPad и планшеты
• AirPods и наушники

Каждое устройство проверено мастером перед продажей."""

CONTACTS_TEXT = """📍 <b>Наши адреса (работаем 24/7)</b>

🏪 <b>Кирова, 11</b> — Центр Калининграда
🏪 <b>Кирова, 7/47</b> — Центр Калининграда

📞 <b>Телефон:</b> 8-800-707-40-40 (бесплатно)
🌐 <b>Сайт:</b> skypka24.com

⏰ Работаем без выходных, круглосуточно"""

STATUS_ASK_TEXT = """🔍 <b>Статус заявки на ремонт</b>

Отправьте <b>номер заявки</b> (например: <code>42</code>)
или <b>номер телефона</b>, указанный при сдаче.

Мы найдём вашу заявку и покажем актуальный статус."""


# =============================================================================
# MENU SECTIONS
# =============================================================================

SECTIONS = {
    "menu_main":     (MAIN_TEXT,      kb_main),
    "menu_sell":     (SELL_TEXT,      kb_sell),
    "menu_jewelry":  (JEWELRY_TEXT,   kb_jewelry),
    "menu_repair":   (REPAIR_TEXT,    kb_repair),
    "menu_catalog":  (CATALOG_TEXT,   kb_catalog),
    "menu_contacts": (CONTACTS_TEXT,  kb_contacts),
    "menu_status":   (STATUS_ASK_TEXT, kb_status_ask),
}


# =============================================================================
# ORDER STATUS FORMATTING
# =============================================================================

def format_order(o: dict) -> str:
    status_label = STATUS_LABELS.get(o["status"], o["status"])
    status_desc  = STATUS_DESC.get(o["status"], "")

    parts = [f"📋 <b>Заявка #{o['id']}</b>"]
    if o.get("name"):
        parts.append(f"👤 {o['name']}")
    if o.get("model"):
        parts.append(f"📱 {o['model']}")
    if o.get("repair_type"):
        parts.append(f"🔧 {o['repair_type']}")
    parts.append(f"\n{status_label}")
    if status_desc:
        parts.append(f"<i>{status_desc}</i>")
    if o.get("admin_note"):
        parts.append(f"\n💬 <b>Комментарий мастера:</b>\n{o['admin_note']}")
    return "\n".join(parts)


# =============================================================================
# WEBHOOK HANDLERS
# =============================================================================

def handle_web_auth(chat_id: int, user: dict) -> None:
    telegram_id = str(user.get("id", ""))
    token = save_auth_token(telegram_id, user.get("username"),
                            user.get("first_name"), user.get("last_name"))
    site_url = os.environ["SITE_URL"].rstrip("/")
    auth_url = f"{site_url}/auth/telegram/callback?token={token}"
    bot = get_bot()
    bot.send_message(
        chat_id,
        "Авторизация готова!\n\nНажмите кнопку ниже, чтобы войти на сайт 👇\n\nСсылка действительна 5 минут.",
        reply_markup=telebot.types.InlineKeyboardMarkup().add(
            telebot.types.InlineKeyboardButton("Войти на сайт", url=auth_url)
        )
    )


def handle_start(chat_id: int, user: dict, param: str = "") -> None:
    bot = get_bot()

    # /start <order_id> — сразу показываем статус заявки
    if param and param.isdigit():
        order = get_order_status(int(param))
        if order:
            text = f"🔍 <b>Статус вашей заявки:</b>\n\n{format_order(order)}"
            markup = telebot.types.InlineKeyboardMarkup(row_width=1)
            markup.add(
                telebot.types.InlineKeyboardButton("🔄 Обновить статус",  callback_data=f"order_{param}"),
                telebot.types.InlineKeyboardButton("← Главное меню",      callback_data="menu_main"),
            )
            bot.send_message(chat_id, text, parse_mode="HTML", reply_markup=markup)
            return
        else:
            bot.send_message(chat_id, f"⚠️ Заявка #{param} не найдена.\n\nПроверьте номер или напишите номер телефона.",
                             parse_mode="HTML", reply_markup=kb_status_ask())
            return

    bot.send_message(chat_id, MAIN_TEXT, parse_mode="HTML",
                     reply_markup=kb_main(), disable_web_page_preview=True)


def handle_callback(call: telebot.types.CallbackQuery, bot: telebot.TeleBot) -> None:
    data = call.data
    chat_id = call.message.chat.id
    message_id = call.message.message_id

    # Обновить статус конкретной заявки
    if data.startswith("order_"):
        order_id = int(data.split("_", 1)[1])
        order = get_order_status(order_id)
        if order:
            text = f"🔍 <b>Статус вашей заявки:</b>\n\n{format_order(order)}"
            markup = telebot.types.InlineKeyboardMarkup(row_width=1)
            markup.add(
                telebot.types.InlineKeyboardButton("🔄 Обновить статус", callback_data=data),
                telebot.types.InlineKeyboardButton("← Главное меню",     callback_data="menu_main"),
            )
        else:
            text = f"⚠️ Заявка #{order_id} не найдена."
            markup = kb_back()
        try:
            bot.edit_message_text(text, chat_id, message_id, parse_mode="HTML",
                                  reply_markup=markup, disable_web_page_preview=True)
        except Exception:
            pass
        bot.answer_callback_query(call.id)
        return

    # Разделы меню
    if data in SECTIONS:
        text, kb_fn = SECTIONS[data]
        try:
            bot.edit_message_text(text, chat_id, message_id, parse_mode="HTML",
                                  reply_markup=kb_fn(), disable_web_page_preview=True)
        except Exception:
            bot.send_message(chat_id, text, parse_mode="HTML",
                             reply_markup=kb_fn(), disable_web_page_preview=True)
        bot.answer_callback_query(call.id)
        return

    bot.answer_callback_query(call.id)


def handle_text_message(chat_id: int, text: str, bot: telebot.TeleBot) -> None:
    t = text.strip()

    # Только цифры — ищем заявку по ID
    if re.fullmatch(r"\d{1,6}", t):
        order = get_order_status(int(t))
        if order:
            reply = f"🔍 <b>Статус вашей заявки:</b>\n\n{format_order(order)}"
            markup = telebot.types.InlineKeyboardMarkup(row_width=1)
            markup.add(
                telebot.types.InlineKeyboardButton("🔄 Обновить статус", callback_data=f"order_{t}"),
                telebot.types.InlineKeyboardButton("← Главное меню",     callback_data="menu_main"),
            )
            bot.send_message(chat_id, reply, parse_mode="HTML", reply_markup=markup)
            return
        else:
            bot.send_message(chat_id,
                f"⚠️ Заявка <b>#{t}</b> не найдена.\n\nПроверьте номер или введите номер телефона для поиска.",
                parse_mode="HTML", reply_markup=kb_status_ask())
            return

    # Похоже на номер телефона — ищем заявки по телефону
    digits = re.sub(r"[^0-9]", "", t)
    if len(digits) >= 7:
        orders = get_orders_by_phone(t)
        if orders:
            lines = [f"📋 Найдено заявок по вашему номеру: <b>{len(orders)}</b>\n"]
            markups_btns = []
            for o in orders:
                status_label = STATUS_LABELS.get(o["status"], o["status"])
                model_part = f" — {o['model']}" if o.get("model") else ""
                lines.append(f"• <b>#{o['id']}</b>{model_part} · {status_label}")
                markups_btns.append(
                    telebot.types.InlineKeyboardButton(
                        f"🔍 Заявка #{o['id']}", callback_data=f"order_{o['id']}"
                    )
                )
            markup = telebot.types.InlineKeyboardMarkup(row_width=1)
            for btn in markups_btns:
                markup.add(btn)
            markup.add(telebot.types.InlineKeyboardButton("← Главное меню", callback_data="menu_main"))
            bot.send_message(chat_id, "\n".join(lines), parse_mode="HTML", reply_markup=markup)
            return
        else:
            bot.send_message(chat_id,
                "⚠️ По этому номеру телефона заявок не найдено.\n\nПроверьте номер или введите <b>номер заявки</b>.",
                parse_mode="HTML", reply_markup=kb_status_ask())
            return

    # Ключевые слова — подходящий раздел меню
    tl = t.lower()
    if any(kw in tl for kw in KEYWORDS_REPAIR) or "статус" in tl or "заявк" in tl or "ремонт" in tl:
        bot.send_message(chat_id, REPAIR_TEXT, parse_mode="HTML",
                         reply_markup=kb_repair(), disable_web_page_preview=True)
        return

    if any(kw in tl for kw in KEYWORDS_SKUPKA):
        bot.send_message(chat_id, SELL_TEXT, parse_mode="HTML",
                         reply_markup=kb_sell(), disable_web_page_preview=True)
        return

    # Всё остальное — главное меню
    bot.send_message(chat_id, MAIN_TEXT, parse_mode="HTML",
                     reply_markup=kb_main(), disable_web_page_preview=True)


def process_webhook(body: dict) -> dict:
    bot = get_bot()

    # Обработка нажатий inline-кнопок
    if "callback_query" in body:
        call_data = body["callback_query"]
        call = telebot.types.CallbackQuery.de_json(call_data)
        chat_type = call.message.chat.type if call.message else "private"
        if chat_type == "private":
            try:
                handle_callback(call, bot)
            except Exception as e:
                print(f"Callback error: {e}")
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    # Обработка сообщений
    message = body.get("message")
    if not message:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    chat_type = message.get("chat", {}).get("type", "private")
    if chat_type != "private":
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    text = message.get("text", "") or ""
    user = message.get("from", {})
    chat_id = message.get("chat", {}).get("id")
    has_media = bool(message.get("photo") or message.get("video") or message.get("document"))

    if not chat_id:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}

    try:
        # /start
        if text.startswith("/start"):
            parts_cmd = text.split(" ", 1)
            param = parts_cmd[1].strip() if len(parts_cmd) > 1 else ""
            if param == "web_auth":
                handle_web_auth(chat_id, user)
            else:
                handle_start(chat_id, user, param)
            return {"statusCode": 200, "body": json.dumps({"ok": True})}

        # Медиа
        if has_media:
            markup = telebot.types.InlineKeyboardMarkup(row_width=1)
            markup.add(
                telebot.types.InlineKeyboardButton("📝 Оформить заявку на сайте", url=SITE_URL),
                telebot.types.InlineKeyboardButton("← Главное меню", callback_data="menu_main"),
            )
            bot.send_message(
                chat_id,
                "Спасибо за фото! 👋\n\n"
                "Чтобы мы оперативно оценили вашу технику, оформите заявку на сайте — "
                "там можно прикрепить фото и указать контакты.\n\n"
                "⏱️ Оценим в течение 15 минут!",
                parse_mode="HTML", reply_markup=markup, disable_web_page_preview=True,
            )
            return {"statusCode": 200, "body": json.dumps({"ok": True})}

        # Текст
        if text:
            handle_text_message(chat_id, text, bot)

    except telebot.apihelper.ApiTelegramException as e:
        print(f"Telegram API error: {e}")
    except Exception as e:
        print(f"Error: {e}")

    return {"statusCode": 200, "body": json.dumps({"ok": True})}


# =============================================================================
# NOTIFICATION API
# =============================================================================

def handle_send(body: dict) -> dict:
    """POST ?action=send — отправка текстового уведомления."""
    text = body.get("text", "").strip()
    chat_id = body.get("chat_id") or get_default_chat_id()
    parse_mode = body.get("parse_mode", "HTML")
    silent = body.get("silent", False)

    if not text:
        return cors_response(400, {"error": "text is required"})
    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})
    if len(text) > 4096:
        return cors_response(400, {"error": "Message too long"})

    # Кнопка «Обновить статус» если передан order_id
    order_id = body.get("order_id")
    markup = None
    if order_id:
        markup = telebot.types.InlineKeyboardMarkup()
        markup.add(telebot.types.InlineKeyboardButton(
            "🔍 Посмотреть статус", callback_data=f"order_{order_id}"
        ))

    try:
        bot = get_bot()
        result = bot.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode,
                                   disable_notification=silent, disable_web_page_preview=True,
                                   reply_markup=markup)
        return cors_response(200, {"success": True, "message_id": result.message_id})
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {"error": e.description, "error_code": e.error_code})
    except Exception as e:
        return cors_response(500, {"error": str(e)})


def handle_send_photo(body: dict) -> dict:
    """POST ?action=send-photo."""
    photo_url = body.get("photo_url", "").strip()
    caption = body.get("caption", "").strip()
    chat_id = body.get("chat_id") or get_default_chat_id()

    if not photo_url:
        return cors_response(400, {"error": "photo_url is required"})
    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})

    try:
        bot = get_bot()
        result = bot.send_photo(chat_id=chat_id, photo=photo_url,
                                 caption=caption or None, parse_mode="HTML")
        return cors_response(200, {"success": True, "message_id": result.message_id})
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {"error": e.description, "error_code": e.error_code})
    except Exception as e:
        return cors_response(500, {"error": str(e)})


def handle_test(body: dict) -> dict:
    """POST ?action=test."""
    chat_id = body.get("chat_id") or get_default_chat_id()
    if not chat_id:
        return cors_response(400, {"error": "chat_id is required"})

    text = (f"<b>Тестовое сообщение</b>\n\n"
            f"Бот настроен правильно!\n\n"
            f"<i>{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>")
    try:
        bot = get_bot()
        result = bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
        return cors_response(200, {"success": True, "message_id": result.message_id})
    except telebot.apihelper.ApiTelegramException as e:
        return cors_response(400, {"error": e.description, "error_code": e.error_code})
    except Exception as e:
        return cors_response(500, {"error": str(e)})


# =============================================================================
# MAIN HANDLER
# =============================================================================

def handler(event: dict, context) -> dict:
    """Telegram Bot — Скупка24. Главное меню + статус заявок + уведомления."""
    method = event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return options_response()

    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    if action:
        body = {}
        if method == "POST":
            raw = event.get("body", "{}")
            try:
                body = json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return cors_response(400, {"error": "Invalid JSON"})

        if action == "send" and method == "POST":
            return handle_send(body)
        elif action == "send-photo" and method == "POST":
            return handle_send_photo(body)
        elif action == "test" and method == "POST":
            return handle_test(body)
        else:
            return cors_response(400, {"error": f"Unknown action: {action}"})

    # Webhook
    headers = event.get("headers", {})
    headers_lower = {k.lower(): v for k, v in headers.items()}
    webhook_secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET")

    if webhook_secret:
        if headers_lower.get("x-telegram-bot-api-secret-token", "") != webhook_secret:
            return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    body = json.loads(event.get("body", "{}"))
    return process_webhook(body)
