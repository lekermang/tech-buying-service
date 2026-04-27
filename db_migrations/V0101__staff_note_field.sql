ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS idx_employees_is_active
  ON t_p31606708_tech_buying_service.employees (is_active);