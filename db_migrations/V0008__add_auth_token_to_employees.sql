ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS auth_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
