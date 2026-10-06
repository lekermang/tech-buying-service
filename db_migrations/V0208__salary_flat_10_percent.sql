UPDATE t_p31606708_tech_buying_service.employee_salary_config c
SET bonus_percent = 10, bonus_percent_purchase = 0
WHERE c.employee_id IN (SELECT id FROM t_p31606708_tech_buying_service.employees WHERE login <> 'PluXan');
ALTER TABLE t_p31606708_tech_buying_service.employee_salary_config ALTER COLUMN bonus_percent SET DEFAULT 10;
ALTER TABLE t_p31606708_tech_buying_service.employee_salary_config ALTER COLUMN bonus_percent_purchase SET DEFAULT 0;