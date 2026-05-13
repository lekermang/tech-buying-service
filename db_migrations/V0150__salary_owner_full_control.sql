-- Новая модель: владелец вручную проставляет смены за любой день и регистрирует выплаты.

-- Флаг "запись создана/изменена владельцем вручную"
ALTER TABLE t_p31606708_tech_buying_service.employee_salary_log
  ADD COLUMN IF NOT EXISTS owner_set BOOLEAN NOT NULL DEFAULT false;

-- Уникальность по (сотрудник, дата): одна запись на день
CREATE UNIQUE INDEX IF NOT EXISTS uniq_salary_log_emp_date
  ON t_p31606708_tech_buying_service.employee_salary_log(employee_id, shift_date);

-- Таблица выплат: владелец фиксирует "выплатил X ₽ такого-то числа"
CREATE TABLE IF NOT EXISTS t_p31606708_tech_buying_service.employee_payouts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  payout_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  created_by INTEGER REFERENCES t_p31606708_tech_buying_service.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_emp_date
  ON t_p31606708_tech_buying_service.employee_payouts(employee_id, payout_date DESC);
