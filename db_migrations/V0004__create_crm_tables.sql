-- Сотрудники магазина
CREATE TABLE t_p31606708_tech_buying_service.employees (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- staff | admin
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Вставляем первого admin с паролем "admin123" (bcrypt-like, для смены через ЛК)
INSERT INTO t_p31606708_tech_buying_service.employees (full_name, login, password_hash, role)
VALUES ('Администратор', 'admin', 'CHANGE_ME', 'admin');

-- Клиенты
CREATE TABLE t_p31606708_tech_buying_service.clients (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  passport_series TEXT,
  passport_number TEXT,
  passport_issued_by TEXT,
  passport_issued_date DATE,
  address TEXT,
  discount_pct INTEGER NOT NULL DEFAULT 3, -- скидка 3-10%
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  yandex_id TEXT,
  telegram_id TEXT,
  auth_token TEXT,
  token_expires_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Б/у товары
CREATE TABLE t_p31606708_tech_buying_service.goods (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Смартфон',
  brand TEXT,
  model TEXT,
  condition TEXT NOT NULL DEFAULT 'хорошее', -- отличное | хорошее | удовлетворительное
  color TEXT,
  storage TEXT,
  imei TEXT,
  purchase_price INTEGER NOT NULL, -- цена закупки
  sell_price INTEGER NOT NULL,     -- цена продажи
  status TEXT NOT NULL DEFAULT 'available', -- available | reserved | sold
  description TEXT,
  photo_url TEXT,
  client_id INTEGER REFERENCES t_p31606708_tech_buying_service.clients(id),
  employee_id INTEGER REFERENCES t_p31606708_tech_buying_service.employees(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  sold_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Продажи
CREATE TABLE t_p31606708_tech_buying_service.sales (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'goods', -- goods | repair | purchase
  good_id INTEGER REFERENCES t_p31606708_tech_buying_service.goods(id),
  repair_order_id INTEGER REFERENCES t_p31606708_tech_buying_service.repair_orders(id),
  client_id INTEGER REFERENCES t_p31606708_tech_buying_service.clients(id),
  employee_id INTEGER REFERENCES t_p31606708_tech_buying_service.employees(id),
  amount INTEGER NOT NULL,
  discount_pct INTEGER DEFAULT 0,
  amount_final INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'cash', -- cash | card | transfer
  contract_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX ON t_p31606708_tech_buying_service.clients(phone);
CREATE INDEX ON t_p31606708_tech_buying_service.goods(status);
CREATE INDEX ON t_p31606708_tech_buying_service.sales(created_at);
