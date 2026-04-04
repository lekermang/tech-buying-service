CREATE TABLE t_p31606708_tech_buying_service.repair_prices (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price_from INTEGER NOT NULL,
  price_to INTEGER,
  unit TEXT DEFAULT 'шт',
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p31606708_tech_buying_service.repair_prices (category, name, price_from, price_to, sort_order) VALUES
('Ремонт', 'Замена гнезда зарядки', 600, 1000, 1),
('Ремонт', 'Замена кнопки', 600, 800, 2),
('Ремонт', 'Замена стекла (без дисплея)', 800, 1200, 3),
('Ремонт', 'Чистка от влаги', 700, 1000, 4),
('Ремонт', 'Замена разъёма наушников', 600, 900, 5),
('Ремонт', 'Замена дисплея (работа)', 1500, 1500, 6),
('Закупка', 'iPhone 16 Pro', 85000, 95000, 10),
('Закупка', 'iPhone 15 Pro', 65000, 75000, 11),
('Закупка', 'iPhone 14 Pro', 50000, 60000, 12),
('Закупка', 'iPhone 13', 30000, 38000, 13),
('Закупка', 'iPhone 12', 20000, 27000, 14),
('Закупка', 'Samsung Galaxy S24', 35000, 45000, 15),
('Закупка', 'MacBook Air M2', 60000, 80000, 16),
('Закупка', 'AirPods Pro 2', 8000, 12000, 17);
