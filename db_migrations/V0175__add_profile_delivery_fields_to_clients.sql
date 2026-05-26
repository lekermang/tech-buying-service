ALTER TABLE t_p31606708_tech_buying_service.clients
  ADD COLUMN IF NOT EXISTS birth_date       DATE,
  ADD COLUMN IF NOT EXISTS passport_series  VARCHAR(10),
  ADD COLUMN IF NOT EXISTS passport_number  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS passport_issued  TEXT,
  ADD COLUMN IF NOT EXISTS delivery_name    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_city    TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_postal  VARCHAR(10);
