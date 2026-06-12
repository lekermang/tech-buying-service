INSERT INTO t_p31606708_tech_buying_service.employees
  (full_name, login, password_hash, role, is_active, position, note)
VALUES (
  'Developer',
  'dev',
  encode(sha256('dev2024'::bytea), 'hex'),
  'admin',
  true,
  'Разработчик',
  'Внешний разработчик — полный доступ'
);