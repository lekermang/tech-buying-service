-- Авито PRO: статистика, чат, autoload
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_stats (
    id BIGSERIAL PRIMARY KEY,
    avito_id BIGINT NOT NULL,
    date DATE NOT NULL,
    views INT DEFAULT 0,
    contacts INT DEFAULT 0,
    favorites INT DEFAULT 0,
    captured_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(avito_id, date)
);

CREATE INDEX IF NOT EXISTS idx_avito_stats_date ON t_p31606708_tech_buying_service.avito_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_avito_stats_avito_id ON t_p31606708_tech_buying_service.avito_stats(avito_id);

-- Чаты Авито (диалоги с покупателями)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_chats (
    id BIGSERIAL PRIMARY KEY,
    chat_id TEXT UNIQUE NOT NULL,
    avito_id BIGINT,
    item_title TEXT,
    user_name TEXT,
    user_avatar TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP,
    unread_count INT DEFAULT 0,
    raw_data JSONB,
    fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avito_chats_last ON t_p31606708_tech_buying_service.avito_chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_avito_chats_unread ON t_p31606708_tech_buying_service.avito_chats(unread_count) WHERE unread_count > 0;

-- Сообщения в чатах
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.avito_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL,
    message_id TEXT UNIQUE,
    author_id TEXT,
    is_outgoing BOOLEAN DEFAULT false,
    text TEXT,
    type TEXT DEFAULT 'text',
    created_at TIMESTAMP,
    raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_avito_msg_chat ON t_p31606708_tech_buying_service.avito_messages(chat_id, created_at DESC);

-- Autoload-фид: товары которые мы хотим выгружать на Авито
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.autoload_items (
    id BIGSERIAL PRIMARY KEY,
    source TEXT NOT NULL DEFAULT 'used',  -- 'used', 'manual', 'lombard'
    source_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL,
    category TEXT,
    sub_category TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    address TEXT,
    condition TEXT DEFAULT 'used',
    is_active BOOLEAN DEFAULT true,
    extra JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_autoload_active ON t_p31606708_tech_buying_service.autoload_items(is_active);

-- Расширяем avito_products счётчиками для дашборда
ALTER TABLE t_p31606708_tech_buying_service.avito_products
    ADD COLUMN IF NOT EXISTS views_total INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contacts_total INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS favorites_total INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMP;