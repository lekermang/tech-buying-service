"""
AI-чат для /unlock кабинета на базе DeepSeek.
Помогает клиентам выбрать услугу, узнать цену с наценкой, оформить заказ.
POST / — { action: "chat", message, history?, session_id? }
POST / — { action: "getSessions" }
POST / — { action: "clearSession", session_id }
"""
import os, json, urllib.request, urllib.parse, re, psycopg2
from datetime import datetime, timezone

SCHEMA = "t_p31606708_tech_buying_service"
GSM_BASE = "https://3gsm.ru/index.php"
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Client-Token",
}

SYSTEM_PROMPT = """Ты — AI-ассистент сервиса Skypka24 (unlock.skypka24.com).
Ты помогаешь клиентам разблокировать телефоны через сервис 3gsm.ru.

ТВОИ ЗАДАЧИ:
1. Помочь выбрать подходящую услугу из каталога
2. Объяснить разницу между услугами (iCloud, FRP, IMEI unlock, Server)
3. Запросить IMEI у клиента и помочь его найти (*#06#)
4. Объяснить как оформить заказ в кабинете
5. Проконсультировать по статусам заказов

ПРАВИЛА:
- Отвечай ТОЛЬКО на русском языке
- Будь кратким и конкретным (2-4 предложения)
- Не обещай гарантий по срокам — зависит от 3gsm
- Если спрашивают цену — скажи "цены указаны в каталоге услуг"
- Никогда не запрашивай пароли, данные карт, личные документы
- Если не знаешь — честно скажи: "Уточните в поддержке"

КОМАНДЫ которые понимаешь:
- /balance — скажи посмотреть во вкладке "Профиль"
- /status [номер] — скажи проверить во вкладке "Заказы"
- /help — выведи список возможностей

УСЛУГИ (кратко):
- iCloud unlock — снятие блокировки активации Apple
- FRP/Google unlock — снятие Google-аккаунта с Android
- IMEI unlock — разблокировка от оператора (официальная)
- Server unlock — разблокировка через сервер (быстро, ~30 мин)"""


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def resolve_client(event):
    hdrs = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    token = (hdrs.get("x-client-token") or "").strip()
    if not token:
        return None
    conn = db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT id, full_name, email FROM {SCHEMA}.clients "
            f"WHERE auth_token=%s AND token_expires_at>NOW() LIMIT 1",
            (token,),
        )
        row = cur.fetchone()
        return {"id": row[0], "full_name": row[1], "email": row[2]} if row else None
    finally:
        cur.close(); conn.close()


def deepseek_chat(messages: list, system: str) -> str:
    api_key = os.environ.get("DEEPSEEK_API_KEY", "")
    payload = {
        "model": "deepseek-chat",
        "messages": [{"role": "system", "content": system}] + messages,
        "max_tokens": 512,
        "temperature": 0.7,
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        DEEPSEEK_URL, data=data, method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        resp = json.loads(r.read())
    return resp["choices"][0]["message"]["content"]


def save_messages(session_id: int, user_msg: str, ai_msg: str):
    conn = db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"INSERT INTO {SCHEMA}.chat_messages (session_id, role, content) VALUES (%s,'user',%s)",
            (session_id, user_msg),
        )
        cur.execute(
            f"INSERT INTO {SCHEMA}.chat_messages (session_id, role, content) VALUES (%s,'assistant',%s)",
            (session_id, ai_msg),
        )
        cur.execute(
            f"UPDATE {SCHEMA}.chat_sessions SET last_activity=NOW(), message_count=message_count+2 WHERE id=%s",
            (session_id,),
        )
        conn.commit()
    finally:
        cur.close(); conn.close()


def get_or_create_session(client_id: int, session_id=None) -> int:
    conn = db()
    cur = conn.cursor()
    try:
        if session_id:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.chat_sessions WHERE id=%s AND user_id=%s LIMIT 1",
                (session_id, client_id),
            )
            row = cur.fetchone()
            if row:
                return row[0]
        cur.execute(
            f"INSERT INTO {SCHEMA}.chat_sessions (user_id, title, service_type, status, last_activity) "
            f"VALUES (%s,'Новый чат','general','active',NOW()) RETURNING id",
            (client_id,),
        )
        sid = cur.fetchone()[0]
        conn.commit()
        return sid
    finally:
        cur.close(); conn.close()


def get_history(session_id: int, limit=10) -> list:
    conn = db()
    cur = conn.cursor()
    try:
        cur.execute(
            f"SELECT role, content FROM {SCHEMA}.chat_messages "
            f"WHERE session_id=%s ORDER BY id DESC LIMIT %s",
            (session_id, limit * 2),
        )
        rows = cur.fetchall()[::-1]
        return [{"role": r[0], "content": r[1]} for r in rows]
    finally:
        cur.close(); conn.close()


def handler(event: dict, context) -> dict:
    """AI-чат кабинета разблокировки на DeepSeek."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    def ok(d): return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(d, ensure_ascii=False, default=str)}
    def err(m, c=400): return ok({"error": m})

    client = resolve_client(event)
    if not client:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Unauthorized"})}

    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}

    action = body.get("action", "chat")

    # ── Получить список сессий ──────────────────────────────────────────────
    if action == "getSessions":
        conn = db()
        cur = conn.cursor()
        try:
            cur.execute(
                f"SELECT id, title, message_count, last_activity FROM {SCHEMA}.chat_sessions "
                f"WHERE user_id=%s AND status='active' ORDER BY last_activity DESC LIMIT 20",
                (client["id"],),
            )
            sessions = [{"id": r[0], "title": r[1], "message_count": r[2], "last_activity": r[3]} for r in cur.fetchall()]
            return ok({"sessions": sessions})
        finally:
            cur.close(); conn.close()

    # ── Получить историю сессии ─────────────────────────────────────────────
    if action == "getHistory":
        sid = body.get("session_id")
        if not sid:
            return err("session_id required")
        history = get_history(int(sid), limit=30)
        return ok({"messages": history})

    # ── Удалить/архивировать сессию ─────────────────────────────────────────
    if action == "clearSession":
        sid = body.get("session_id")
        if sid:
            conn = db()
            cur = conn.cursor()
            try:
                cur.execute(
                    f"UPDATE {SCHEMA}.chat_sessions SET status='archived' WHERE id=%s AND user_id=%s",
                    (sid, client["id"]),
                )
                conn.commit()
            finally:
                cur.close(); conn.close()
        return ok({"ok": True})

    # ── Чат ────────────────────────────────────────────────────────────────
    message = (body.get("message") or "").strip()
    if not message:
        return err("Пустое сообщение")
    if len(message) > 2000:
        return err("Сообщение слишком длинное")

    session_id = get_or_create_session(client["id"], body.get("session_id"))
    history = get_history(session_id, limit=8)

    # Добавляем контекст клиента в системный промпт
    system = SYSTEM_PROMPT + f"\n\nКЛИЕНТ: {client['full_name']} ({client['email']})"

    messages = history + [{"role": "user", "content": message}]

    ai_reply = deepseek_chat(messages, system)

    save_messages(session_id, message, ai_reply)

    # Обновляем заголовок сессии по первому сообщению
    if len(history) == 0:
        title = message[:50].strip()
        conn = db()
        cur = conn.cursor()
        try:
            cur.execute(f"UPDATE {SCHEMA}.chat_sessions SET title=%s WHERE id=%s", (title, session_id))
            conn.commit()
        finally:
            cur.close(); conn.close()

    return ok({"reply": ai_reply, "session_id": session_id})
