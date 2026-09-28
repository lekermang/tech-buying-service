ALTER TABLE t_p31606708_tech_buying_service.employee_salary_config
  ADD COLUMN IF NOT EXISTS bonus_percent_purchase NUMERIC(5,2) NOT NULL DEFAULT 7.0;

ALTER TABLE t_p31606708_tech_buying_service.employee_salary_log
  ADD COLUMN IF NOT EXISTS personal_purchase_profit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_percent_purchase_at_time NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_purchase_amount INTEGER NOT NULL DEFAULT 0;
