-- Web Push подписки клиентов
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.client_push_subs (
  id BIGSERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.clients(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_push_subs_client
  ON t_p31606708_tech_buying_service.client_push_subs (client_id);

-- Колонка last_known_status для отслеживания изменений в repair_orders (если ещё нет)
ALTER TABLE t_p31606708_tech_buying_service.repair_orders
  ADD COLUMN IF NOT EXISTS last_push_status TEXT,
  ADD COLUMN IF NOT EXISTS last_push_at TIMESTAMPTZ;

-- Для предложений: время последнего push (чтобы не дублировать)
ALTER TABLE t_p31606708_tech_buying_service.client_offers
  ADD COLUMN IF NOT EXISTS last_push_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_push_reply_hash TEXT;