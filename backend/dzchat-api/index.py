"""
DzChat API — WhatsApp-like мессенджер.
Действия: register, login, me, profile, chats, users,
          create, create_group, messages, send, remove, read,
          react, upload, ping, search_messages, group_info, group_leave,
          call_start, call_answer, call_ice, call_end, call_status,
          vapid_public_key, push_subscribe, push_unsubscribe
"""
import json, os, hashlib, time, base64, uuid, random, io, struct, hmac
import psycopg2
import boto3
import bcrypt
from urllib.request import urlopen, Request
from urllib.error import HTTPError
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

# ── Web Push (VAPID) ──────────────────────────────────────────────────────────

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

def _b64url_decode(s: str) -> bytes:
    pad = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * (pad % 4))

def _make_vapid_jwt(audience: str, private_key_b64: str) -> str:
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.backends import default_backend
    from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
    header = _b64url_encode(json.dumps({"typ": "JWT", "alg": "ES256"}).encode())
    exp = int(time.time()) + 43200
    payload = _b64url_encode(json.dumps({"aud": audience, "exp": exp, "sub": "mailto:admin@skypka24.com"}).encode())
    signing_input = f"{header}.{payload}".encode()
    raw = _b64url_decode(private_key_b64)
    if len(raw) == 32:
        private_key = ec.derive_private_key(int.from_bytes(raw, "big"), ec.SECP256R1(), default_backend())
    else:
        private_key = serialization.load_der_private_key(raw, password=None, backend=default_backend())
    sig_der = private_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(sig_der)
    return f"{header}.{payload}.{_b64url_encode(r.to_bytes(32,'big') + s.to_bytes(32,'big'))}"

def send_web_push(subscription: dict, push_payload: dict) -> bool | None:
    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError:
        return False
    vapid_private = os.environ.get("VAPID_PRIVATE_KEY", "")
    vapid_public = os.environ.get("VAPID_PUBLIC_KEY", "")
    if not vapid_private or not vapid_public:
        return False
    endpoint = subscription["endpoint"]
    from urllib.parse import urlparse
    audience = f"{urlparse(endpoint).scheme}://{urlparse(endpoint).netloc}"
    jwt_token = _make_vapid_jwt(audience, vapid_private)
    server_public_raw = _b64url_decode(vapid_public)
    client_pub_bytes = _b64url_decode(subscription["keys"]["p256dh"])
    auth_secret = _b64url_decode(subscription["keys"]["auth"])
    client_pub_key = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), client_pub_bytes)
    ephemeral_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    ephemeral_pub = ephemeral_key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    shared_secret = ephemeral_key.exchange(ec.ECDH(), client_pub_key)
    def hkdf(salt: bytes, ikm: bytes, info: bytes, length: int) -> bytes:
        prk = hmac.new(salt, ikm, hashlib.sha256).digest()
        t, okm = b"", b""
        for i in range(1, (length // 32) + 2):
            t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest()
            okm += t
        return okm[:length]
    prk_key = hmac.new(auth_secret, shared_secret, hashlib.sha256).digest()
    key_info = b"WebPush: info\x00" + client_pub_bytes + ephemeral_pub
    ik_bytes = hkdf(prk_key, b"", key_info + b"\x01", 32)
    salt = os.urandom(16)
    prk_nonce = hmac.new(salt, ik_bytes, hashlib.sha256).digest()
    cek = hkdf(prk_nonce, b"", b"Content-Encoding: aes128gcm\x00\x01", 16)
    nonce = hkdf(prk_nonce, b"", b"Content-Encoding: nonce\x00\x01", 12)
    header = salt + struct.pack(">I", 4096) + bytes([len(ephemeral_pub)]) + ephemeral_pub
    plaintext = json.dumps(push_payload, ensure_ascii=False).encode() + b"\x02"
    body = header + AESGCM(cek).encrypt(nonce, plaintext, None)
    req = Request(endpoint, data=body, headers={
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Authorization": f"vapid t={jwt_token},k={vapid_public}",
        "TTL": "86400",
        "Urgency": "normal",
    }, method="POST")
    try:
        with urlopen(req, timeout=10) as r:
            return r.status in (200, 201)
    except HTTPError as e:
        return None if e.code == 410 else False
    except Exception:
        return False

def push_to_chat_members(conn, chat_id: int, exclude_user_id: int, push_payload: dict):
    """Отправляем Web Push всем участникам чата кроме отправителя."""
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT ps.endpoint, ps.p256dh, ps.auth
            FROM {SCHEMA}.dzchat_push_subscriptions ps
            JOIN {SCHEMA}.dzchat_members m ON m.user_id = ps.user_id
            WHERE m.chat_id = %s AND ps.user_id != %s
        """, (chat_id, exclude_user_id))
        subs = cur.fetchall()
        stale = []
        for row in subs:
            result = send_web_push({"endpoint": row[0], "keys": {"p256dh": row[1], "auth": row[2]}}, push_payload)
            if result is None:
                stale.append(row[0])
        for ep in stale:
            cur.execute(f"UPDATE {SCHEMA}.dzchat_push_subscriptions SET endpoint=endpoint WHERE endpoint=%s", (ep,))
        if stale:
            conn.commit()
    except Exception:
        pass


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

    # ── VAPID PUBLIC KEY ──────────────────────────────────────────
    if action == "vapid_public_key" and method == "GET":
        key = os.environ.get("VAPID_PUBLIC_KEY", "")
        conn.close()
        return resp({"public_key": key, "ready": bool(key)})

    # ── PUSH SUBSCRIBE ────────────────────────────────────────────
    if action == "push_subscribe" and method == "POST":
        u = get_user(conn, token)
        if not u:
            conn.close()
            return resp({"error": "Unauthorized"}, 401)
        sub = body.get("subscription", {})
        endpoint = sub.get("endpoint", "")
        keys = sub.get("keys", {})
        p256dh = keys.get("p256dh", "")
        auth_key = keys.get("auth", "")
        ua = body.get("user_agent", "")[:255] if body.get("user_agent") else ""
        if not endpoint or not p256dh or not auth_key:
            conn.close()
            return resp({"error": "invalid subscription"}, 400)
        cur = conn.cursor()
        cur.execute(f"""
            INSERT INTO {SCHEMA}.dzchat_push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id, endpoint) DO UPDATE
              SET p256dh=EXCLUDED.p256dh, auth=EXCLUDED.auth,
                  user_agent=EXCLUDED.user_agent, updated_at=NOW()
        """, (u["id"], endpoint, p256dh, auth_key, ua))
        conn.commit()
        conn.close()
        return resp({"ok": True})

    # ── PUSH UNSUBSCRIBE ──────────────────────────────────────────
    if action == "push_unsubscribe" and method == "POST":
        u = get_user(conn, token)
        if not u:
            conn.close()
            return resp({"error": "Unauthorized"}, 401)
        endpoint = body.get("endpoint", "")
        if endpoint:
            cur = conn.cursor()
            cur.execute(
                f"UPDATE {SCHEMA}.dzchat_push_subscriptions SET updated_at=NOW() WHERE user_id=%s AND endpoint=%s",
                (u["id"], endpoint)
            )
            conn.commit()
        conn.close()
        return resp({"ok": True})

    # ── PING (обновить онлайн-статус + продлить сессию) ──────────
    if action == "ping" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        # Продлеваем сессию до 30 дней от текущего момента
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.dzchat_users SET session_expires_at=NOW() + INTERVAL '30 days' WHERE id=%s",
            (u["id"],)
        )
        conn.commit()
        return resp({"ok": True})

    # ── TYPING (пользователь печатает) ────────────────────────────
    if action == "typing" and method == "POST":
        u = get_user(conn, token)
        if not u:
            return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        is_typing = body.get("is_typing", True)
        if not chat_id:
            return resp({"error": "chat_id required"}, 400)
        cur = conn.cursor()
        if is_typing:
            # Ставим typing_until = NOW() + 5 секунд
            cur.execute(f"""
                UPDATE {SCHEMA}.dzchat_members
                SET typing_until = NOW() + INTERVAL '5 seconds'
                WHERE chat_id=%s AND user_id=%s
            """, (chat_id, u["id"]))
        else:
            cur.execute(f"""
                UPDATE {SCHEMA}.dzchat_members
                SET typing_until = NULL
                WHERE chat_id=%s AND user_id=%s
            """, (chat_id, u["id"]))
        conn.commit()
        return resp({"ok": True})

    # ── CALL: начать звонок (caller отправляет offer) ────────────
    if action == "call_start" and method == "POST":
        u = get_user(conn, token)
        if not u: return resp({"error": "Unauthorized"}, 401)
        chat_id = body.get("chat_id")
        callee_id = body.get("callee_id")
        offer_sdp = body.get("offer_sdp", "")
        call_type = body.get("call_type", "audio")
        if not chat_id or not callee_id:
            return resp({"error": "chat_id and callee_id required"}, 400)
        cur = conn.cursor()
        # Завершаем старые активные звонки
        cur.execute(f"""
            UPDATE {SCHEMA}.dzchat_calls SET status='ended', ended_at=NOW(), updated_at=NOW()
            WHERE (caller_id=%s OR callee_id=%s) AND status IN ('ringing','accepted')
        """, (u["id"], u["id"]))
        cur.execute(f"""
            INSERT INTO {SCHEMA}.dzchat_calls (chat_id, caller_id, callee_id, status, call_type, offer_sdp, updated_at)
            VALUES (%s,%s,%s,'ringing',%s,%s,NOW()) RETURNING id
        """, (chat_id, u["id"], callee_id, call_type, offer_sdp))
        call_id = cur.fetchone()[0]
        conn.commit()
        return resp({"ok": True, "call_id": call_id})

    # ── CALL: ответить (callee отправляет answer) ─────────────────
    if action == "call_answer" and method == "POST":
        u = get_user(conn, token)
        if not u: return resp({"error": "Unauthorized"}, 401)
        call_id = body.get("call_id")
        answer_sdp = body.get("answer_sdp", "")
        accepted = body.get("accepted", True)
        cur = conn.cursor()
        new_status = "accepted" if accepted else "rejected"
        cur.execute(f"""
            UPDATE {SCHEMA}.dzchat_calls SET status=%s, answer_sdp=%s, updated_at=NOW()
            WHERE id=%s AND callee_id=%s AND status='ringing'
        """, (new_status, answer_sdp, call_id, u["id"]))
        if not accepted:
            cur.execute(f"UPDATE {SCHEMA}.dzchat_calls SET ended_at=NOW() WHERE id=%s", (call_id,))
        conn.commit()
        return resp({"ok": True})

    # ── CALL: передать ICE candidates ────────────────────────────
    if action == "call_ice" and method == "POST":
        u = get_user(conn, token)
        if not u: return resp({"error": "Unauthorized"}, 401)
        call_id = body.get("call_id")
        candidates = body.get("candidates", [])
        cur = conn.cursor()
        cur.execute(f"SELECT caller_id, callee_id FROM {SCHEMA}.dzchat_calls WHERE id=%s", (call_id,))
        row = cur.fetchone()
        if not row: return resp({"error": "Call not found"}, 404)
        caller_id, callee_id = row
        if u["id"] == caller_id:
            cur.execute(f"""
                UPDATE {SCHEMA}.dzchat_calls
                SET ice_caller = ice_caller || %s::jsonb, updated_at=NOW()
                WHERE id=%s
            """, (json.dumps(candidates), call_id))
        else:
            cur.execute(f"""
                UPDATE {SCHEMA}.dzchat_calls
                SET ice_callee = ice_callee || %s::jsonb, updated_at=NOW()
                WHERE id=%s
            """, (json.dumps(candidates), call_id))
        conn.commit()
        return resp({"ok": True})

    # ── CALL: завершить звонок ────────────────────────────────────
    if action == "call_end" and method == "POST":
        u = get_user(conn, token)
        if not u: return resp({"error": "Unauthorized"}, 401)
        call_id = body.get("call_id")
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE {SCHEMA}.dzchat_calls
            SET status='ended', ended_at=NOW(), updated_at=NOW()
            WHERE id=%s AND (caller_id=%s OR callee_id=%s)
        """, (call_id, u["id"], u["id"]))
        conn.commit()
        return resp({"ok": True})

    # ── CALL: получить статус звонка (polling) ───────────────────
    if action == "call_status" and method == "GET":
        u = get_user(conn, token)
        if not u: return resp({"error": "Unauthorized"}, 401)
        call_id = qs.get("call_id")
        cur = conn.cursor()
        if call_id:
            cur.execute(f"""
                SELECT c.id, c.status, c.offer_sdp, c.answer_sdp,
                       c.ice_caller, c.ice_callee, c.call_type,
                       c.caller_id, caller.name, caller.avatar_url,
                       c.callee_id, callee.name, callee.avatar_url
                FROM {SCHEMA}.dzchat_calls c
                JOIN {SCHEMA}.dzchat_users caller ON caller.id=c.caller_id
                JOIN {SCHEMA}.dzchat_users callee ON callee.id=c.callee_id
                WHERE c.id=%s AND (c.caller_id=%s OR c.callee_id=%s)
            """, (call_id, u["id"], u["id"]))
        else:
            # Входящий — ищем активный ringing звонок где я callee
            cur.execute(f"""
                SELECT c.id, c.status, c.offer_sdp, c.answer_sdp,
                       c.ice_caller, c.ice_callee, c.call_type,
                       c.caller_id, caller.name, caller.avatar_url,
                       c.callee_id, callee.name, callee.avatar_url
                FROM {SCHEMA}.dzchat_calls c
                JOIN {SCHEMA}.dzchat_users caller ON caller.id=c.caller_id
                JOIN {SCHEMA}.dzchat_users callee ON callee.id=c.callee_id
                WHERE c.callee_id=%s AND c.status='ringing'
                  AND c.created_at > NOW() - INTERVAL '60 seconds'
                ORDER BY c.created_at DESC LIMIT 1
            """, (u["id"],))
        row = cur.fetchone()
        if not row: return resp({"call": None})
        return resp({"call": {
            "id": row[0], "status": row[1], "offer_sdp": row[2], "answer_sdp": row[3],
            "ice_caller": row[4] or [], "ice_callee": row[5] or [],
            "call_type": row[6],
            "caller": {"id": row[7], "name": row[8], "avatar_url": row[9]},
            "callee": {"id": row[10], "name": row[11], "avatar_url": row[12]},
        }})

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
                      AND mx.sender_id != %s AND mx.removed=FALSE) AS unread,
                   (SELECT mb3.typing_until > NOW()
                    FROM {SCHEMA}.dzchat_members mb3
                    WHERE mb3.chat_id=c.id AND mb3.user_id != %s
                      AND mb3.typing_until IS NOT NULL
                    LIMIT 1) AS partner_typing
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
        """, (u["id"], u["id"], u["id"], u["id"]))
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
            "partner_typing": bool(r[17]) if r[17] else False,
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

        # Web Push — уведомляем участников чата (кроме отправителя)
        body_text = (
            "🎤 Голосовое сообщение" if voice_url else
            "📷 Фото" if photo_url else
            "🎥 Видео" if video_url else
            (text[:80] + "…" if len(text) > 80 else text) if text else "Новое сообщение"
        )
        push_to_chat_members(conn, chat_id, u["id"], {
            "title": f"DzChat — {u['name']}",
            "body": body_text,
            "url": "/dzchat",
            "chat_id": chat_id,
        })

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
        elif kind == "voice" or mime.startswith("audio/"):
            folder = f"dzchat/voice/{u['id']}"
            # Правильное расширение для каждого формата
            if "mp4" in mime or "m4a" in mime or "aac" in mime or "mpeg" in mime:
                ext = "m4a"
                out_mime = "audio/mp4"
            elif "ogg" in mime:
                ext = "ogg"
                out_mime = "audio/ogg"
            else:
                ext = "webm"
                out_mime = "audio/webm"
        else:
            folder = f"dzchat/{kind}/{u['id']}"
            ext = "jpg" if "jpeg" in mime else mime.split("/")[-1]
            out_mime = mime

        key = f"{folder}/{uuid.uuid4().hex}.{ext}"
        s3 = boto3.client("s3", endpoint_url="https://bucket.poehali.dev",
                          aws_access_key_id=AK, aws_secret_access_key=SK)
        s3.put_object(
            Bucket="files", Key=key, Body=data, ContentType=out_mime,
            # Принудительно отдаём как аудио (не загрузка файла)
            ContentDisposition="inline" if kind == "voice" else "attachment",
        )
        cdn_url = f"https://cdn.poehali.dev/projects/{AK}/files/{key}"
        return resp({"ok": True, "url": cdn_url})

    return resp({"error": "Unknown action"}, 404)