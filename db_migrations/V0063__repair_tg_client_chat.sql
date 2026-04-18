-- chat_id клиента для отправки статусов через Telegram бот
ALTER TABLE t_p31606708_tech_buying_service.repair_orders
    ADD COLUMN IF NOT EXISTS client_tg_chat_id BIGINT;

-- Таблица привязки телефонов к Telegram chat_id
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.tg_phone_map (
    phone       TEXT PRIMARY KEY,
    chat_id     BIGINT NOT NULL,
    username    TEXT,
    first_name  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);