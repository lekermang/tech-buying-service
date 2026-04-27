-- Добавляем поля position/email/phone в employees для расширенного раздела Staff
ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_position ON t_p31606708_tech_buying_service.employees(position);
CREATE INDEX IF NOT EXISTS idx_employees_email ON t_p31606708_tech_buying_service.employees(email);
