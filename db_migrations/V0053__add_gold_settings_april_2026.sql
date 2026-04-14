INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description) VALUES
  ('gold_retail_discount',    '15',   'Скупка золота — вычет физлицо (%)'),
  ('gold_retail_deduction',   '0',    'Скупка золота — вычет физлицо (₽/г)'),
  ('gold_wholesale_discount', '10',   'Скупка золота — вычет опт от 30 г (%)'),
  ('gold_wholesale_deduction','0',    'Скупка золота — вычет опт от 30 г (₽/г)'),
  ('gold_bulk_discount',      '15',   'Скупка золота — вычет крупный опт от 300 г (%)'),
  ('gold_bulk_deduction',     '50',   'Скупка золота — вычет крупный опт от 300 г (₽/г)')
ON CONFLICT (key) DO NOTHING