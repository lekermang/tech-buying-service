-- Кабинет клиента: добавляем логин/пароль и поле для проверки прав
ALTER TABLE t_p31606708_tech_buying_service.clients
  ADD COLUMN IF NOT EXISTS login TEXT,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_clients_login
  ON t_p31606708_tech_buying_service.clients (login)
  WHERE login IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_auth_token
  ON t_p31606708_tech_buying_service.clients (auth_token)
  WHERE auth_token IS NOT NULL;

-- Предложения клиентов (что они хотят сдать/заложить/отремонтировать)
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.client_offers (
  id BIGSERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.clients(id),
  category TEXT NOT NULL,           -- skupka | repair | lombard | other
  title TEXT NOT NULL,
  description TEXT,
  expected_price NUMERIC(12,2),
  contact_phone TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new', -- new | viewed | in_progress | accepted | rejected
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_offers_client
  ON t_p31606708_tech_buying_service.client_offers (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_offers_status
  ON t_p31606708_tech_buying_service.client_offers (status, created_at DESC);