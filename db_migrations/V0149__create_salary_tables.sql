-- Настройка зарплаты для каждого сотрудника (одна запись на сотрудника)
CREATE TABLE t_p31606708_tech_buying_service.employee_salary_config (
  employee_id INTEGER PRIMARY KEY REFERENCES t_p31606708_tech_buying_service.employees(id),
  daily_rate INTEGER NOT NULL DEFAULT 2000,
  bonus_percent NUMERIC(5,2) NOT NULL DEFAULT 3.0,
  min_hours_for_rate NUMERIC(4,2) NOT NULL DEFAULT 10.0,
  shift_start_hour INTEGER NOT NULL DEFAULT 9,
  shift_end_hour INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by INTEGER REFERENCES t_p31606708_tech_buying_service.employees(id)
);

CREATE TABLE t_p31606708_tech_buying_service.employee_shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  shift_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  UNIQUE(employee_id, shift_date)
);

CREATE INDEX idx_shifts_employee_date ON t_p31606708_tech_buying_service.employee_shifts(employee_id, shift_date DESC);
CREATE INDEX idx_shifts_open ON t_p31606708_tech_buying_service.employee_shifts(employee_id) WHERE status = 'open';

CREATE TABLE t_p31606708_tech_buying_service.employee_salary_log (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER NOT NULL UNIQUE REFERENCES t_p31606708_tech_buying_service.employee_shifts(id),
  employee_id INTEGER NOT NULL REFERENCES t_p31606708_tech_buying_service.employees(id),
  shift_date DATE NOT NULL,
  hours_worked NUMERIC(5,2) NOT NULL,
  base_rate INTEGER NOT NULL,
  personal_profit INTEGER NOT NULL DEFAULT 0,
  bonus_percent_at_time NUMERIC(5,2) NOT NULL,
  bonus_amount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salary_log_employee ON t_p31606708_tech_buying_service.employee_salary_log(employee_id, shift_date DESC);

INSERT INTO t_p31606708_tech_buying_service.employee_salary_config (employee_id, daily_rate, bonus_percent)
SELECT id, 2000, 3.0
FROM t_p31606708_tech_buying_service.employees
WHERE role IN ('staff', 'admin') AND is_active = true
ON CONFLICT (employee_id) DO NOTHING;

UPDATE t_p31606708_tech_buying_service.employees
SET role = 'owner'
WHERE login = 'admin' AND role = 'admin';
