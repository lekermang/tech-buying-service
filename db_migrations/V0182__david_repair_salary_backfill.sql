-- Шаг 1: создаём смены Давида за все дни с ремонтами (кроме 2026-05-17 — уже есть)
INSERT INTO t_p31606708_tech_buying_service.employee_shifts
  (employee_id, shift_date, started_at, ended_at, status)
SELECT DISTINCT
  3,
  completed_at::date,
  (completed_at::date + time '09:00'),
  (completed_at::date + time '20:00'),
  'closed'
FROM t_p31606708_tech_buying_service.repair_orders
WHERE status = 'done'
  AND completed_at IS NOT NULL
  AND master_income IS NOT NULL
  AND master_income > 0
  AND completed_at::date != '2026-05-17'
ON CONFLICT (employee_id, shift_date) DO NOTHING;

-- Шаг 2: вставляем salary_log для Давида по каждому дню с ремонтами
INSERT INTO t_p31606708_tech_buying_service.employee_salary_log
  (shift_id, employee_id, shift_date, hours_worked, base_rate, personal_profit, bonus_percent_at_time, bonus_amount, total, owner_set)
SELECT
  sh.id,
  3,
  sh.shift_date,
  8,
  0,
  SUM(r.master_income),
  0,
  SUM(r.master_income),
  SUM(r.master_income),
  true
FROM t_p31606708_tech_buying_service.employee_shifts sh
JOIN t_p31606708_tech_buying_service.repair_orders r
  ON r.completed_at::date = sh.shift_date
  AND r.status = 'done'
  AND r.master_income IS NOT NULL
  AND r.master_income > 0
WHERE sh.employee_id = 3
  AND sh.shift_date != '2026-05-17'
GROUP BY sh.id, sh.shift_date
ON CONFLICT (employee_id, shift_date) DO UPDATE
  SET personal_profit = EXCLUDED.personal_profit,
      bonus_amount = EXCLUDED.bonus_amount,
      total = EXCLUDED.total,
      owner_set = true;

-- Шаг 3: обновляем 17 мая (ставка 500 + ремонты 1575 = 2075)
UPDATE t_p31606708_tech_buying_service.employee_salary_log
SET
  personal_profit = 1575,
  bonus_amount = 1575,
  total = 2075,
  owner_set = true
WHERE employee_id = 3 AND shift_date = '2026-05-17';
