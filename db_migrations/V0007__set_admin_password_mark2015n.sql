-- Устанавливаем пароль Mark2015N (SHA-256 hex)
UPDATE t_p31606708_tech_buying_service.employees
SET password_hash = 'b47bda8a62ca0c14e23e09fc634ee6e0b7258daf5e0d97e5bfaad5bfde9a72a1'
WHERE login = 'admin';
