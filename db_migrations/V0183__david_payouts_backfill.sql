-- Давид получает выплату в тот же день что заработал.
-- Вставляем выплаты за все дни кроме 2026-05-17 (уже есть, 500 ₽).
-- За 17 мая обновляем выплату до полной суммы (2075 ₽).

INSERT INTO t_p31606708_tech_buying_service.employee_payouts
  (employee_id, payout_date, amount, note, created_by)
SELECT
  3,
  shift_date,
  total,
  'Авто: выплата за ремонты дня',
  1
FROM t_p31606708_tech_buying_service.employee_salary_log
WHERE employee_id = 3
  AND shift_date != '2026-05-17';

-- Обновляем 17 мая до полной суммы (500 ставка + 1575 ремонты)
UPDATE t_p31606708_tech_buying_service.employee_payouts
SET amount = 2075, note = 'Авто: ставка + ремонты дня'
WHERE employee_id = 3 AND payout_date = '2026-05-17';
