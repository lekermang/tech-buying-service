"""
DzChat API — универсальный эндпоинт для мессенджера DzChat.
Маршрутизация по query-параметру ?action=...

Действия:
  register   POST — регистрация / запрос OTP
  verify     POST — проверка OTP, выдача токена
  me         GET  — профиль текущего пользователя
  profile    POST — обновить имя / аватарку
  chats      GET  — список чатов
  users      GET  — поиск пользователей (?q=)
  create     POST — создать личный чат (?partner_id=)
  messages   GET  — сообщения чата (?chat_id=&before=)
  send       POST — отправить сообщение
  remove     POST — удалить сообщение
  read       POST — отметить прочитанными
  upload     POST — загрузить фото в S3
"""
import json, os, random, string, hashlib, time, base64, uuid
import psycopg2
import boto3

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
AK = os.environ["AWS_ACCESS_KEY_ID"]
SK = os.environ["AWS_SECRET_ACCESS_KEY"]
PAGE = 50

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    }

def resp(data, code=200):
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def gen_otp():
    return "".join(random.choices(string.digits, k=6))

def gen_token(phone):
    raw = f"{phone}{time.time()}{random.random()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:48]

def get_user(conn, token):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(f"SELECT id, name, avatar_url, phone FROM {SCHEMA}.dzchat_users WHERE session_token=%s AND session_expires_at > NOW()", (token,))
    r = cur.fetchone()
    return {"id": r[0], "name": r[1], "avatar_url": r[2], "phone": r[3]} if r else None

def is_member(conn, user_id, chat_id):
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM {SCHEMA}.dzchat_members WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
    return cur.fetchone() is not None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors(), "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")
    token = (event.get("headers") or {}).get("X-Session-Token", "")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()

    # ── REGISTER ──────────────────────────────────────────────────
    if action == "register" and method == "POST":
        phone = body.get("phone", "").strip()
        name = body.get("name", "").strip()
        if not phone or not name:
            return resp({"error": "Укажите имя и телефон"}, 400)
        otp = gen_otp()
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.dzchat_users (phone, name, otp, otp_expires_at)
            VALUES (%s, %s, %s, NOW() + INTERVAL '300 seconds')
            ON CONFLICT (phone) DO UPDATE SET
                name=EXCLUDED.name, otp=EXCLUDED.otp, otp_expires_at=EXCLUDED.otp_expires_at
        """, (phone, name, otp))
        conn.commit()
        return resp({"ok": True, "otp": otp})  # В продакшне — отправить по SMS

    # ── VERIFY ────────────────────────────────────────────────────
    if action == "verify" and method == "POST":
        phone = body.get("phone", "").strip()
        otp = body.get("otp", "").strip()
        if not phone or not otp:
            return resp({"error": "phone и otp обязательны"}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.dzchat_users WHERE phone=%s AND otp=%s AND otp_expires_at > NOW()", (phone, otp))
        r = cur.fetchone()
        if not r:
            return resp({"error": "Неверный или истёкший код"}, 400)
        tok = gen_token(phone)
        cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET session_token=%s, session_expires_at=NOW() + INTERVAL '30 days', otp=NULL WHERE id=%s", (tok, r[0]))
        conn.commit()
        return resp({"ok": True, "token": tok, "user_id": r[0]})

    # ── ME ────────────────────────────────────────────────────────
    if action == "me" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        return resp(u)

    # ── PROFILE UPDATE ────────────────────────────────────────────
    if action == "profile" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        name = body.get("name", u["name"])
        avatar_url = body.get("avatar_url", u["avatar_url"])
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET name=%s, avatar_url=%s WHERE id=%s", (name, avatar_url, u["id"]))
        conn.commit()
        return resp({"ok": True, "name": name, "avatar_url": avatar_url})

    # ── USERS SEARCH ──────────────────────────────────────────────
    if action == "users" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        q = qs.get("q", "").strip()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT id, name, avatar_url, phone FROM {SCHEMA}.dzchat_users
            WHERE id != %s AND (name ILIKE %s OR phone ILIKE %s)
            ORDER BY name LIMIT 20
        """, (u["id"], f"%{q}%", f"%{q}%"))
        rows = cur.fetchall()
        return resp([{"id": r[0], "name": r[1], "avatar_url": r[2], "phone": r[3]} for r in rows])

    # ── CHATS LIST ────────────────────────────────────────────────
    if action == "chats" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.type, c.name, c.avatar_url,
                   p.id, p.name, p.avatar_url, p.last_seen_at,
                   lm.msg_text, lm.photo_url, lm.created_at, lm.sender_id,
                   (SELECT COUNT(*) FROM {SCHEMA}.dzchat_messages mx
                    WHERE mx.chat_id=c.id AND mx.created_at > mb.last_read_at
                      AND mx.sender_id != %s AND mx.removed=FALSE) AS unread
            FROM {SCHEMA}.dzchat_chats c
            JOIN {SCHEMA}.dzchat_members mb ON mb.chat_id=c.id AND mb.user_id=%s
            LEFT JOIN {SCHEMA}.dzchat_members mb2 ON mb2.chat_id=c.id AND mb2.user_id != %s
            LEFT JOIN {SCHEMA}.dzchat_users p ON p.id=mb2.user_id
            LEFT JOIN LATERAL (
                SELECT msg_text, photo_url, created_at, sender_id
                FROM {SCHEMA}.dzchat_messages
                WHERE chat_id=c.id AND removed=FALSE
                ORDER BY created_at DESC LIMIT 1
            ) lm ON TRUE
            ORDER BY COALESCE(lm.created_at, c.created_at) DESC
        """, (u["id"], u["id"], u["id"]))
        rows = cur.fetchall()
        return resp([{
            "id": r[0], "type": r[1],
            "name": r[2] or r[5] or "Чат",
            "avatar_url": r[3] or r[6],
            "partner": {"id": r[4], "name": r[5], "avatar_url": r[6], "last_seen_at": str(r[7]) if r[7] else None} if r[4] else None,
            "last_message": {"text": r[8], "photo_url": r[9], "created_at": str(r[10]), "sender_id": r[11]} if r[10] else None,
            "unread": int(r[12]) if r[12] else 0,
        } for r in rows])

    # ── CREATE CHAT ───────────────────────────────────────────────
    if action == "create" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        partner_id = body.get("partner_id")
        if not partner_id:
            return resp({"error": "partner_id required"}, 400)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id FROM {SCHEMA}.dzchat_chats c
            JOIN {SCHEMA}.dzchat_members m1 ON m1.chat_id=c.id AND m1.user_id=%s
            JOIN {SCHEMA}.dzchat_members m2 ON m2.chat_id=c.id AND m2.user_id=%s
            WHERE c.type='direct' LIMIT 1
        """, (u["id"], partner_id))
        ex = cur.fetchone()
        if ex:
            return resp({"chat_id": ex[0]})
        cur.execute(f"INSERT INTO {SCHEMA}.dzchat_chats (type, created_by) VALUES ('direct', %s) RETURNING id", (u["id"],))
        chat_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.dzchat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)", (chat_id, u["id"], chat_id, partner_id))
        conn.commit()
        return resp({"chat_id": chat_id})

    # ── MESSAGES ──────────────────────────────────────────────────
    if action == "messages" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = qs.get("chat_id")
        before = qs.get("before")
        if not chat_id:
            return resp({"error": "chat_id required"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        if before:
            cur.execute(f"""
                SELECT m.id, m.sender_id, us.name, us.avatar_url, m.msg_text, m.photo_url,
                       m.forwarded_from, m.removed, m.created_at
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                WHERE m.chat_id=%s AND m.created_at < %s
                ORDER BY m.created_at DESC LIMIT %s
            """, (chat_id, before, PAGE))
        else:
            cur.execute(f"""
                SELECT m.id, m.sender_id, us.name, us.avatar_url, m.msg_text, m.photo_url,
                       m.forwarded_from, m.removed, m.created_at
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                WHERE m.chat_id=%s
                ORDER BY m.created_at DESC LIMIT %s
            """, (chat_id, PAGE))
        rows = cur.fetchall()
        msgs = [{"id": r[0], "sender_id": r[1], "sender_name": r[2], "sender_avatar": r[3],
                 "text": r[4] if not r[7] else None, "photo_url": r[5] if not r[7] else None,
                 "forwarded_from": r[6], "removed": r[7], "created_at": str(r[8])} for r in rows]
        msgs.reverse()
        return resp(msgs)

    # ── SEND MESSAGE ──────────────────────────────────────────────
    if action == "send" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip()
        photo_url = body.get("photo_url", "")
        forwarded_from = body.get("forwarded_from")
        if not chat_id or (not text and not photo_url):
            return resp({"error": "Нужен chat_id и текст или фото"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.dzchat_messages (chat_id, sender_id, msg_text, photo_url, forwarded_from)
            VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at
        """, (chat_id, u["id"], text or None, photo_url or None, forwarded_from))
        row = cur.fetchone()
        conn.commit()
        return resp({"ok": True, "id": row[0], "created_at": str(row[1]),
                     "sender_id": u["id"], "sender_name": u["name"], "sender_avatar": u["avatar_url"]})

    # ── REMOVE MESSAGE ────────────────────────────────────────────
    if action == "remove" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        msg_id = body.get("msg_id")
        if not msg_id:
            return resp({"error": "msg_id required"}, 400)
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.dzchat_messages SET removed=TRUE WHERE id=%s AND sender_id=%s", (msg_id, u["id"]))
        conn.commit()
        return resp({"ok": True})

    # ── READ ──────────────────────────────────────────────────────
    if action == "read" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        if not chat_id:
            return resp({"error": "chat_id required"}, 400)
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.dzchat_members SET last_read_at=NOW() WHERE chat_id=%s AND user_id=%s", (chat_id, u["id"]))
        conn.commit()
        return resp({"ok": True})

    # ── UPLOAD PHOTO ──────────────────────────────────────────────
    if action == "upload" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        image_b64 = body.get("image", "")
        mime = body.get("mime", "image/jpeg")
        if not image_b64:
            return resp({"error": "image required"}, 400)
        ext = "jpg" if "jpeg" in mime else mime.split("/")[-1]
        key = f"dzchat/{u['id']}/{uuid.uuid4().hex}.{ext}"
        try:
            data = base64.b64decode(image_b64)
        except Exception:
            return resp({"error": "Invalid base64"}, 400)
        s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev", aws_access_key_id=AK, aws_secret_access_key=SK)
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=mime)
        cdn_url = f"https://cdn.poehali.dev/projects/{AK}/bucket/{key}"
        return resp({"ok": True, "url": cdn_url})

    return resp({"error": "Unknown action"}, 404)
