-- Публичный чат (Скупка24 LIVE) — клиенты + сотрудники

-- Клиенты, прошедшие вход по SMS
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_clients (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    display_name TEXT,
    auth_token TEXT UNIQUE NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMP,
    user_agent TEXT,
    invite_lead_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_clients_token ON t_p31606708_tech_buying_service.pchat_clients(auth_token);
CREATE INDEX IF NOT EXISTS idx_pchat_clients_phone ON t_p31606708_tech_buying_service.pchat_clients(phone);

-- Одноразовые SMS-коды
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_otp (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_otp_phone ON t_p31606708_tech_buying_service.pchat_otp(phone, expires_at DESC);

-- Комнаты: один общий "lobby" (тип public) + личные диалоги клиент↔сотрудники (тип direct)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_rooms (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct',
    title TEXT,
    client_id INTEGER,
    last_message_at TIMESTAMP,
    last_message_text TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_rooms_client ON t_p31606708_tech_buying_service.pchat_rooms(client_id);
CREATE INDEX IF NOT EXISTS idx_pchat_rooms_last ON t_p31606708_tech_buying_service.pchat_rooms(last_message_at DESC);

-- Сообщения
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_messages (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    author_type TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    text TEXT,
    photo_url TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_messages_room ON t_p31606708_tech_buying_service.pchat_messages(room_id, id);
CREATE INDEX IF NOT EXISTS idx_pchat_messages_created ON t_p31606708_tech_buying_service.pchat_messages(created_at DESC);

-- Прочитано/не прочитано (last_read_msg_id для пары room_id × кто)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_reads (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    reader_type TEXT NOT NULL,
    reader_id INTEGER NOT NULL,
    last_read_msg_id INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, reader_type, reader_id)
);

-- Приглашения по ссылке (token → клиент создаётся при первом открытии)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_invites (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    lead_id INTEGER,
    created_by_chat_id TEXT,
    used_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_invites_token ON t_p31606708_tech_buying_service.pchat_invites(token);

-- Гарантируем существование общей комнаты-лобби
INSERT INTO t_p31606708_tech_buying_service.pchat_rooms (id, type, title)
SELECT 1, 'public', 'Скупка24 LIVE'
WHERE NOT EXISTS (SELECT 1 FROM t_p31606708_tech_buying_service.pchat_rooms WHERE id = 1);
