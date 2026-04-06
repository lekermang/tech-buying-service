"""
DzChat API — WhatsApp-like мессенджер.
Действия: register, login, me, profile, chats, users,
          create, create_group, messages, send, remove, read,
          react, upload, ping, search_messages, group_info, group_leave
"""
import json, os, hashlib, time, base64, uuid, random, io
import psycopg2
import boto3
import bcrypt
try:
    from PIL import Image as PILImage
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

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
    return {"statusCode": code, "headers": {**cors(), "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}

def gen_token(seed):
    raw = f"{seed}{time.time()}{random.random()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:48]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        return False

def get_user(conn, token):
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(f"SELECT id, name, avatar_url, phone FROM {SCHEMA}.dzchat_users WHERE session_token=%s AND session_expires_at > NOW()", (token,))
    r = cur.fetchone()
    if not r:
        return None
    # обновляем онлайн-статус
    cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET is_online=TRUE, last_seen_at=NOW() WHERE id=%s", (r[0],))
    conn.commit()
    return {"id": r[0], "name": r[1], "avatar_url": r[2], "phone": r[3]}

def is_member(conn, user_id, chat_id):
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM {SCHEMA}.dzchat_members WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
    return cur.fetchone() is not None

def get_msg_reactions(conn, msg_ids):
    if not msg_ids:
        return {}
    cur = conn.cursor()
    cur.execute(f"""
        SELECT r.msg_id, r.emoji, COUNT(*) as cnt, array_agg(u.name) as users
        FROM {SCHEMA}.dzchat_reactions r
        JOIN {SCHEMA}.dzchat_users u ON u.id = r.user_id
        WHERE r.msg_id = ANY(%s)
        GROUP BY r.msg_id, r.emoji
    """, (list(msg_ids),))
    result = {}
    for row in cur.fetchall():
        mid = row[0]
        if mid not in result:
            result[mid] = []
        result[mid].append({"emoji": row[1], "count": row[2], "users": row[3]})
    return result

def handler(event: dict, context) -> dict:
    """DzChat WhatsApp-like API handler."""
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

    # ── PING (обновить онлайн-статус) ─────────────────────────────
    if action == "ping" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        return resp({"ok": True})

    # ── REGISTER ──────────────────────────────────────────────────
    if action == "register" and method == "POST":
        phone = body.get("phone", "").strip()
        name = body.get("name", "").strip()
        password = body.get("password", "").strip()
        if not phone or not name or not password:
            return resp({"error": "Укажите имя, телефон и пароль"}, 400)
        if len(password) < 6:
            return resp({"error": "Пароль должен быть не менее 6 символов"}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id, password_hash FROM {SCHEMA}.dzchat_users WHERE phone=%s", (phone,))
        existing = cur.fetchone()
        # Если аккаунт существует И у него уже есть пароль — не даём перезаписать
        if existing and existing[1]:
            return resp({"error": "Аккаунт с этим номером уже существует. Войдите."}, 409)
        pw_hash = hash_password(password)
        tok = gen_token(phone)
        if existing:
            # Аккаунт без пароля (сброшенный) — переактивируем
            cur.execute(f"""
                UPDATE {SCHEMA}.dzchat_users
                SET name=%s, password_hash=%s, session_token=%s,
                    session_expires_at=NOW() + INTERVAL '30 days',
                    is_online=TRUE, last_seen_at=NOW()
                WHERE id=%s
            """, (name, pw_hash, tok, existing[0]))
            user_id = existing[0]
        else:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.dzchat_users (phone, name, password_hash, is_online, last_seen_at)
                VALUES (%s, %s, %s, TRUE, NOW()) RETURNING id
            """, (phone, name, pw_hash))
            user_id = cur.fetchone()[0]
            cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET session_token=%s, session_expires_at=NOW() + INTERVAL '30 days' WHERE id=%s", (tok, user_id))
        conn.commit()
        return resp({"ok": True, "token": tok, "user_id": user_id})

    # ── LOGIN ─────────────────────────────────────────────────────
    if action == "login" and method == "POST":
        phone = body.get("phone", "").strip()
        password = body.get("password", "").strip()
        if not phone or not password:
            return resp({"error": "Укажите телефон и пароль"}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id, password_hash FROM {SCHEMA}.dzchat_users WHERE phone=%s", (phone,))
        row = cur.fetchone()
        if not row:
            return resp({"error": "Аккаунт с этим номером не найден"}, 404)
        if not row[1]:
            return resp({"error": "Пароль не установлен. Обратитесь в поддержку."}, 400)
        if not check_password(password, row[1]):
            return resp({"error": "Неверный пароль"}, 401)
        tok = gen_token(phone)
        cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET session_token=%s, session_expires_at=NOW() + INTERVAL '30 days', is_online=TRUE, last_seen_at=NOW() WHERE id=%s", (tok, row[0]))
        conn.commit()
        return resp({"ok": True, "token": tok, "user_id": row[0]})

    # ── RESET PASSWORD — шаг 1: проверить телефон + имя ──────────
    if action == "reset_check" and method == "POST":
        phone = body.get("phone", "").strip()
        name = body.get("name", "").strip()
        if not phone or not name:
            return resp({"error": "Укажите телефон и имя"}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.dzchat_users WHERE phone=%s AND name=%s", (phone, name))
        row = cur.fetchone()
        if not row:
            return resp({"error": "Аккаунт не найден. Проверьте телефон и имя."}, 404)
        # Генерируем одноразовый reset-токен на 15 минут
        reset_tok = gen_token(phone + name)
        cur.execute(f"UPDATE {SCHEMA}.dzchat_users SET otp=%s, otp_expires_at=NOW() + INTERVAL '15 minutes' WHERE id=%s", (reset_tok[:32], row[0]))
        conn.commit()
        return resp({"ok": True, "reset_token": reset_tok[:32]})

    # ── RESET PASSWORD — шаг 2: установить новый пароль ──────────
    if action == "reset_password" and method == "POST":
        phone = body.get("phone", "").strip()
        reset_token = body.get("reset_token", "").strip()
        new_password = body.get("new_password", "").strip()
        if not phone or not reset_token or not new_password:
            return resp({"error": "Все поля обязательны"}, 400)
        if len(new_password) < 6:
            return resp({"error": "Пароль — минимум 6 символов"}, 400)
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.dzchat_users WHERE phone=%s AND otp=%s AND otp_expires_at > NOW()", (phone, reset_token))
        row = cur.fetchone()
        if not row:
            return resp({"error": "Токен недействителен или истёк. Начните заново."}, 400)
        pw_hash = hash_password(new_password)
        tok = gen_token(phone)
        cur.execute(f"""
            UPDATE {SCHEMA}.dzchat_users
            SET password_hash=%s, otp=NULL, otp_expires_at=NULL,
                session_token=%s, session_expires_at=NOW() + INTERVAL '30 days',
                is_online=TRUE, last_seen_at=NOW()
            WHERE id=%s
        """, (pw_hash, tok, row[0]))
        conn.commit()
        return resp({"ok": True, "token": tok})

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
            SELECT id, name, avatar_url, phone, is_online, last_seen_at FROM {SCHEMA}.dzchat_users
            WHERE id != %s AND (name ILIKE %s OR phone ILIKE %s)
            ORDER BY name LIMIT 20
        """, (u["id"], f"%{q}%", f"%{q}%"))
        rows = cur.fetchall()
        return resp([{"id": r[0], "name": r[1], "avatar_url": r[2], "phone": r[3],
                      "is_online": r[4], "last_seen_at": str(r[5]) if r[5] else None} for r in rows])

    # ── CHATS LIST ────────────────────────────────────────────────
    if action == "chats" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.type, c.name, c.avatar_url,
                   p.id, p.name, p.avatar_url, p.last_seen_at, p.is_online,
                   lm.id, lm.msg_text, lm.photo_url, lm.voice_url, lm.created_at, lm.sender_id, lm.is_read,
                   (SELECT COUNT(*) FROM {SCHEMA}.dzchat_messages mx
                    WHERE mx.chat_id=c.id AND mx.created_at > mb.last_read_at
                      AND mx.sender_id != %s AND mx.removed=FALSE) AS unread
            FROM {SCHEMA}.dzchat_chats c
            JOIN {SCHEMA}.dzchat_members mb ON mb.chat_id=c.id AND mb.user_id=%s
            LEFT JOIN {SCHEMA}.dzchat_members mb2 ON mb2.chat_id=c.id AND mb2.user_id != %s
            LEFT JOIN {SCHEMA}.dzchat_users p ON p.id=mb2.user_id AND c.type='direct'
            LEFT JOIN LATERAL (
                SELECT id, msg_text, photo_url, voice_url, created_at, sender_id, is_read
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
            "partner": {"id": r[4], "name": r[5], "avatar_url": r[6],
                        "last_seen_at": str(r[7]) if r[7] else None,
                        "is_online": r[8]} if r[4] else None,
            "last_message": {"id": r[9], "text": r[10], "photo_url": r[11], "voice_url": r[12],
                             "created_at": str(r[13]), "sender_id": r[14], "is_read": r[15]} if r[13] else None,
            "unread": int(r[16]) if r[16] else 0,
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

    # ── CREATE GROUP ──────────────────────────────────────────────
    if action == "create_group" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        name = body.get("name", "").strip()
        member_ids = body.get("member_ids", [])
        avatar_url = body.get("avatar_url", "")
        if not name:
            return resp({"error": "Укажите название группы"}, 400)
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.dzchat_chats (type, name, avatar_url, created_by) VALUES ('group', %s, %s, %s) RETURNING id",
                    (name, avatar_url or None, u["id"]))
        chat_id = cur.fetchone()[0]
        all_members = list(set([u["id"]] + [int(m) for m in member_ids if str(m).isdigit()]))
        for mid in all_members:
            cur.execute(f"INSERT INTO {SCHEMA}.dzchat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, mid))
        conn.commit()
        return resp({"chat_id": chat_id, "name": name})

    # ── GROUP INFO ────────────────────────────────────────────────
    if action == "group_info" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = qs.get("chat_id")
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"""
            SELECT us.id, us.name, us.avatar_url, us.is_online, us.last_seen_at
            FROM {SCHEMA}.dzchat_members mb
            JOIN {SCHEMA}.dzchat_users us ON us.id = mb.user_id
            WHERE mb.chat_id=%s ORDER BY us.name
        """, (chat_id,))
        members = [{"id": r[0], "name": r[1], "avatar_url": r[2], "is_online": r[3],
                    "last_seen_at": str(r[4]) if r[4] else None} for r in cur.fetchall()]
        return resp({"members": members})

    # ── GROUP EDIT (переименование) ───────────────────────────────
    if action == "group_edit" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        name = body.get("name", "").strip()
        if not chat_id or not name:
            return resp({"error": "chat_id и name обязательны"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"UPDATE {SCHEMA}.dzchat_chats SET name=%s WHERE id=%s AND type='group'", (name, chat_id))
        conn.commit()
        return resp({"ok": True})

    # ── GROUP ADD MEMBER ──────────────────────────────────────────
    if action == "group_add" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        user_id = body.get("user_id")
        if not chat_id or not user_id:
            return resp({"error": "chat_id и user_id обязательны"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.dzchat_members (chat_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (chat_id, user_id))
        conn.commit()
        return resp({"ok": True})

    # ── GROUP REMOVE MEMBER ───────────────────────────────────────
    if action == "group_remove" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        user_id = body.get("user_id")
        if not chat_id or not user_id:
            return resp({"error": "chat_id и user_id обязательны"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.dzchat_members WHERE chat_id=%s AND user_id=%s", (chat_id, user_id))
        conn.commit()
        return resp({"ok": True})

    # ── GROUP LEAVE ───────────────────────────────────────────────
    if action == "group_leave" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.dzchat_members WHERE chat_id=%s AND user_id=%s", (chat_id, u["id"]))
        conn.commit()
        return resp({"ok": True})

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
                       m.voice_url, m.voice_duration, m.forwarded_from, m.removed, m.created_at,
                       m.reply_to, m.is_read, m.video_url,
                       rm.msg_text, rm.photo_url, rm.voice_url, rus.name, rm.video_url
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                LEFT JOIN {SCHEMA}.dzchat_messages rm ON rm.id=m.reply_to
                LEFT JOIN {SCHEMA}.dzchat_users rus ON rus.id=rm.sender_id
                WHERE m.chat_id=%s AND m.created_at < %s
                  AND NOT (%s = ANY(COALESCE(m.hidden_for, '{{}}'::integer[])))
                ORDER BY m.created_at DESC LIMIT %s
            """, (chat_id, before, u["id"], PAGE))
        else:
            cur.execute(f"""
                SELECT m.id, m.sender_id, us.name, us.avatar_url, m.msg_text, m.photo_url,
                       m.voice_url, m.voice_duration, m.forwarded_from, m.removed, m.created_at,
                       m.reply_to, m.is_read, m.video_url,
                       rm.msg_text, rm.photo_url, rm.voice_url, rus.name, rm.video_url
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                LEFT JOIN {SCHEMA}.dzchat_messages rm ON rm.id=m.reply_to
                LEFT JOIN {SCHEMA}.dzchat_users rus ON rus.id=rm.sender_id
                WHERE m.chat_id=%s
                  AND NOT (%s = ANY(COALESCE(m.hidden_for, '{{}}'::integer[])))
                ORDER BY m.created_at DESC LIMIT %s
            """, (chat_id, u["id"], PAGE))
        rows = cur.fetchall()
        msg_ids = [r[0] for r in rows]
        reactions = get_msg_reactions(conn, msg_ids)
        msgs = []
        for r in rows:
            reply = None
            if r[11]:
                reply = {"id": r[11], "text": r[14], "photo_url": r[15], "voice_url": r[16], "sender_name": r[17], "video_url": r[18]}
            msgs.append({
                "id": r[0], "sender_id": r[1], "sender_name": r[2], "sender_avatar": r[3],
                "text": r[4] if not r[9] else None,
                "photo_url": r[5] if not r[9] else None,
                "voice_url": r[6] if not r[9] else None,
                "voice_duration": r[7],
                "video_url": r[13] if not r[9] else None,
                "forwarded_from": r[8], "removed": r[9], "created_at": str(r[10]),
                "reply": reply, "is_read": r[12],
                "reactions": reactions.get(r[0], []),
            })
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
        video_url = body.get("video_url", "")
        voice_url = body.get("voice_url", "")
        voice_duration = body.get("voice_duration", 0)
        forwarded_from = body.get("forwarded_from")
        reply_to = body.get("reply_to")
        if not chat_id or (not text and not photo_url and not video_url and not voice_url):
            return resp({"error": "Нужен chat_id и текст, фото, видео или голос"}, 400)
        if not is_member(conn, u["id"], chat_id):
            return resp({"error": "Forbidden"}, 403)
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.dzchat_messages
                (chat_id, sender_id, msg_text, photo_url, video_url, voice_url, voice_duration, forwarded_from, reply_to)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at
        """, (chat_id, u["id"], text or None, photo_url or None, video_url or None,
              voice_url or None, voice_duration, forwarded_from, reply_to))
        row = cur.fetchone()
        conn.commit()
        return resp({"ok": True, "id": row[0], "created_at": str(row[1]),
                     "sender_id": u["id"], "sender_name": u["name"], "sender_avatar": u["avatar_url"]})

    # ── REMOVE MESSAGE (для всех — помечает removed=TRUE) ─────────
    if action == "remove" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        msg_id = body.get("msg_id")
        everyone = body.get("everyone", False)
        if not msg_id:
            return resp({"error": "msg_id required"}, 400)
        cur = conn.cursor()
        if everyone:
            # Удалить для всех — только отправитель может
            cur.execute(f"UPDATE {SCHEMA}.dzchat_messages SET removed=TRUE WHERE id=%s AND sender_id=%s", (msg_id, u["id"]))
        else:
            # Удалить для себя — добавляем user_id в hidden_for
            cur.execute(f"SELECT hidden_for FROM {SCHEMA}.dzchat_messages WHERE id=%s", (msg_id,))
            row = cur.fetchone()
            if row is not None:
                hidden = row[0] or []
                if u["id"] not in hidden:
                    hidden.append(u["id"])
                cur.execute(f"UPDATE {SCHEMA}.dzchat_messages SET hidden_for=%s WHERE id=%s", (hidden, msg_id))
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
        # помечаем is_read у сообщений для отправителя
        cur.execute(f"""
            UPDATE {SCHEMA}.dzchat_messages SET is_read=TRUE
            WHERE chat_id=%s AND sender_id != %s AND is_read=FALSE
        """, (chat_id, u["id"]))
        conn.commit()
        return resp({"ok": True})

    # ── REACT ─────────────────────────────────────────────────────
    if action == "react" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        msg_id = body.get("msg_id")
        emoji = body.get("emoji", "").strip()
        if not msg_id or not emoji:
            return resp({"error": "msg_id и emoji обязательны"}, 400)
        cur = conn.cursor()
        # Если та же реакция — удаляем (toggle), иначе вставляем/обновляем
        cur.execute(f"SELECT emoji FROM {SCHEMA}.dzchat_reactions WHERE msg_id=%s AND user_id=%s", (msg_id, u["id"]))
        existing = cur.fetchone()
        if existing and existing[0] == emoji:
            cur.execute(f"UPDATE {SCHEMA}.dzchat_reactions SET emoji=NULL WHERE msg_id=%s AND user_id=%s", (msg_id, u["id"]))
        else:
            cur.execute(f"""
                INSERT INTO {SCHEMA}.dzchat_reactions (msg_id, user_id, emoji)
                VALUES (%s, %s, %s)
                ON CONFLICT (msg_id, user_id) DO UPDATE SET emoji=EXCLUDED.emoji
            """, (msg_id, u["id"], emoji))
        conn.commit()
        return resp({"ok": True})

    # ── SEARCH MESSAGES ───────────────────────────────────────────
    if action == "search_messages" and method == "GET":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        q = qs.get("q", "").strip()
        chat_id = qs.get("chat_id")
        if not q:
            return resp([])
        cur = conn.cursor()
        if chat_id:
            cur.execute(f"""
                SELECT m.id, m.chat_id, m.msg_text, m.created_at, us.name
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                WHERE m.chat_id=%s AND m.msg_text ILIKE %s AND m.removed=FALSE
                ORDER BY m.created_at DESC LIMIT 30
            """, (chat_id, f"%{q}%"))
        else:
            cur.execute(f"""
                SELECT m.id, m.chat_id, m.msg_text, m.created_at, us.name
                FROM {SCHEMA}.dzchat_messages m
                JOIN {SCHEMA}.dzchat_users us ON us.id=m.sender_id
                JOIN {SCHEMA}.dzchat_members mb ON mb.chat_id=m.chat_id AND mb.user_id=%s
                WHERE m.msg_text ILIKE %s AND m.removed=FALSE
                ORDER BY m.created_at DESC LIMIT 30
            """, (u["id"], f"%{q}%"))
        rows = cur.fetchall()
        return resp([{"id": r[0], "chat_id": r[1], "text": r[2], "created_at": str(r[3]), "sender_name": r[4]} for r in rows])

    # ── UPLOAD (photo or voice) ───────────────────────────────────
    if action == "upload" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        image_b64 = body.get("image", "")
        mime = body.get("mime", "image/jpeg")
        kind = body.get("kind", "photo")  # photo | voice | avatar | video
        if not image_b64:
            return resp({"error": "image required"}, 400)
        try:
            data = base64.b64decode(image_b64)
        except Exception:
            return resp({"error": "Invalid base64"}, 400)

        # Аватарки — папка DZChatAv, сжатие до 256px
        if kind == "avatar":
            folder = f"DZChatAv/{u['id']}"
            ext = "jpg"
            out_mime = "image/jpeg"
            if HAS_PIL:
                try:
                    img = PILImage.open(io.BytesIO(data)).convert("RGB")
                    img.thumbnail((256, 256), PILImage.LANCZOS)
                    buf = io.BytesIO()
                    img.save(buf, format="JPEG", quality=82, optimize=True)
                    data = buf.getvalue()
                except Exception:
                    pass
        # Фото в сообщениях — сжатие до 1024px
        elif kind == "photo" and HAS_PIL and not mime.startswith("video/"):
            folder = f"dzchat/photo/{u['id']}"
            ext = "jpg"
            out_mime = "image/jpeg"
            try:
                img = PILImage.open(io.BytesIO(data)).convert("RGB")
                img.thumbnail((1024, 1024), PILImage.LANCZOS)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=80, optimize=True)
                data = buf.getvalue()
            except Exception:
                pass
        elif mime.startswith("video/"):
            folder = f"dzchat/video/{u['id']}"
            ext = mime.split("/")[-1] or "mp4"
            out_mime = mime
        else:
            folder = f"dzchat/{kind}/{u['id']}"
            ext = "jpg" if "jpeg" in mime else ("webm" if "webm" in mime else mime.split("/")[-1])
            out_mime = mime

        key = f"{folder}/{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                          aws_access_key_id=AK, aws_secret_access_key=SK)
        s3.put_object(Bucket="files", Key=key, Body=data, ContentType=out_mime)
        cdn_url = f"https://cdn.poehali.dev/projects/{AK}/files/{key}"
        return resp({"ok": True, "url": cdn_url})

    return resp({"error": "Unknown action"}, 404)