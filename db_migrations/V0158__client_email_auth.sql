-- Email-регистрация клиентов: верификация, сброс пароля, лимиты
ALTER TABLE t_p31606708_tech_buying_service.clients
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verify_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_clients_email_lower
  ON t_p31606708_tech_buying_service.clients (LOWER(email)) WHERE email IS NOT NULL AND email <> '';

CREATE INDEX IF NOT EXISTS idx_clients_phone_digits
  ON t_p31606708_tech_buying_service.clients (REGEXP_REPLACE(phone, '[^0-9]', '', 'g'));