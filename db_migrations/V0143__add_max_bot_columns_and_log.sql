-- MAX-бот: связь MAX-пользователя с pchat_clients
-- max_user_id (числовой ID пользователя из MAX webhook) — уникальный ключ
-- chat_id (ID чата с ботом в MAX — куда отвечать)
-- pchat_client_id — наш клиент в LIVE-чате (FK мягкая, без CASCADE)

ALTER TABLE t_p31606708_tech_buying_service.pchat_clients
  ADD COLUMN IF NOT EXISTS max_user_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS max_chat_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS max_username TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pchat_clients_max
  ON t_p31606708_tech_buying_service.pchat_clients (max_user_id)
  WHERE max_user_id IS NOT NULL;

-- auth_method теперь может быть 'max' (CHECK не строгий, поэтому просто документируем)
COMMENT ON COLUMN t_p31606708_tech_buying_service.pchat_clients.max_user_id
  IS 'ID пользователя в MAX (botapi.max.ru). Заполняется при первом сообщении боту.';
COMMENT ON COLUMN t_p31606708_tech_buying_service.pchat_clients.max_chat_id
  IS 'ID личного чата с MAX-ботом — куда отправляем ответы и нотификации.';

-- Лог входящих MAX-сообщений (для дебага и аналитики)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.max_log (
  id SERIAL PRIMARY KEY,
  direction TEXT NOT NULL,
  max_user_id BIGINT NULL,
  max_chat_id BIGINT NULL,
  update_type TEXT NULL,
  text TEXT NULL,
  pchat_client_id INTEGER NULL,
  pchat_room_id INTEGER NULL,
  raw_payload JSONB NULL,
  error_text TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_max_log_created ON t_p31606708_tech_buying_service.max_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_max_log_user ON t_p31606708_tech_buying_service.max_log (max_user_id);
