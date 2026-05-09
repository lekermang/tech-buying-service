-- Дополнительные поля для альтернативных методов входа в публичный чат

ALTER TABLE t_p31606708_tech_buying_service.pchat_clients
    ADD COLUMN IF NOT EXISTS telegram_id BIGINT,
    ADD COLUMN IF NOT EXISTS telegram_username TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS auth_method TEXT NOT NULL DEFAULT 'sms',
    ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pchat_clients_tg
    ON t_p31606708_tech_buying_service.pchat_clients(telegram_id) WHERE telegram_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_bot_pending (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    intended_name TEXT,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    auth_token TEXT,
    telegram_id BIGINT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_bot_pending_code ON t_p31606708_tech_buying_service.pchat_bot_pending(code);

CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.pchat_zvonok (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    pincode TEXT,
    call_id TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pchat_zvonok_phone ON t_p31606708_tech_buying_service.pchat_zvonok(phone, expires_at DESC);
