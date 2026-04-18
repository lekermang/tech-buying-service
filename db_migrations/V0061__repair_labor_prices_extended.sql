INSERT INTO t_p31606708_tech_buying_service.repair_labor_prices (part_type, label, price) VALUES
  ('rear_glass',     'Заднее стекло iPhone',  1200),
  ('battery_iphone', 'Аккумулятор iPhone',    1200),
  ('battery_other',  'Аккумулятор (другое)',   800),
  ('accessory',      'Аксессуары',             500),
  ('speaker_ear',    'Динамик слуховой',       700),
  ('speaker_loud',   'Динамик громкий (звонок)', 700),
  ('vibro',          'Вибромотор',             600),
  ('display',        'Дисплей / Экран / LCD',  1800),
  ('back_cover',     'Задняя крышка / Рамка / Корпус', 900),
  ('camera_glass',   'Стекло камеры',          800),
  ('flex_board',     'Шлейфы / Платы',        1000)
ON CONFLICT (part_type) DO UPDATE SET label = EXCLUDED.label, updated_at = NOW();