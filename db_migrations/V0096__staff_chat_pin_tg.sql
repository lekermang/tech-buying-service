-- Multi-photo for VIP chat + erase tracking
ALTER TABLE t_p31606708_tech_buying_service.vip_chat_messages
  ADD COLUMN IF NOT EXISTS photo_urls jsonb,
  ADD COLUMN IF NOT EXISTS erased_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_vip_chat_not_erased
  ON t_p31606708_tech_buying_service.vip_chat_messages (id)
  WHERE erased_at IS NULL;

-- 2FA PIN
ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS pin_hash           text,
  ADD COLUMN IF NOT EXISTS pin_failed_count   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until   timestamptz,
  ADD COLUMN IF NOT EXISTS pin_pending        boolean NOT NULL DEFAULT false;

-- Telegram link for login + notifications
ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS tg_chat_id        bigint,
  ADD COLUMN IF NOT EXISTS tg_username       text,
  ADD COLUMN IF NOT EXISTS tg_link_code      text,
  ADD COLUMN IF NOT EXISTS tg_link_expires   timestamptz,
  ADD COLUMN IF NOT EXISTS tg_notify_enabled boolean NOT NULL DEFAULT true;

-- One-time codes for Telegram login
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.tg_login_codes (
  id          bigserial PRIMARY KEY,
  employee_id integer NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  code        text    NOT NULL,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tg_login_codes_emp ON t_p31606708_tech_buying_service.tg_login_codes (employee_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_tg_login_codes_code ON t_p31606708_tech_buying_service.tg_login_codes (code) WHERE used_at IS NULL;
