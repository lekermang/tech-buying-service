-- Архивируем старые таблицы SmartLombard (переименовываем, данные не трогаем)
ALTER TABLE IF EXISTS sl_goods RENAME TO sl_goods_archive;
ALTER TABLE IF EXISTS sl_merchants RENAME TO sl_merchants_archive;
ALTER TABLE IF EXISTS sl_webhook_log RENAME TO sl_webhook_log_archive;
ALTER TABLE IF EXISTS smartlombard_cache RENAME TO smartlombard_cache_archive;

-- Категории товаров
CREATE TABLE IF NOT EXISTS slshop_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(80) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'Package',
  color VARCHAR(20) DEFAULT '#FFD700',
  sort_order INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_categories (name, slug, icon, sort_order) VALUES
  ('Смартфоны', 'phones', 'Smartphone', 10),
  ('Ноутбуки', 'laptops', 'Laptop', 20),
  ('Планшеты', 'tablets', 'Tablet', 30),
  ('Часы', 'watches', 'Watch', 40),
  ('Аудио', 'audio', 'Headphones', 50),
  ('ТВ и приставки', 'tv', 'Tv', 60),
  ('Антиквариат', 'antique', 'Crown', 70),
  ('Инструменты', 'tools', 'Wrench', 80),
  ('Прочее', 'other', 'Package', 999)
ON CONFLICT DO NOTHING;

-- Клиенты комиссионки
CREATE TABLE IF NOT EXISTS slshop_clients (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  passport_series VARCHAR(20),
  passport_number VARCHAR(20),
  passport_issued_by TEXT,
  passport_issued_date DATE,
  address TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_clients_phone ON slshop_clients(phone);
CREATE INDEX IF NOT EXISTS idx_slshop_clients_name ON slshop_clients(full_name);

-- Товары
CREATE TABLE IF NOT EXISTS slshop_items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(40) UNIQUE,
  category_id INTEGER REFERENCES slshop_categories(id),
  title VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(150),
  specs TEXT,
  specs_short VARCHAR(100),
  storage VARCHAR(40),
  color VARCHAR(60),
  condition VARCHAR(40),
  imei VARCHAR(60),
  serial_number VARCHAR(120),
  battery_health INTEGER,
  has_box BOOLEAN DEFAULT FALSE,
  has_charger BOOLEAN DEFAULT FALSE,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  buy_price NUMERIC(12,2) DEFAULT 0,
  sell_price NUMERIC(12,2) DEFAULT 0,
  min_price NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'stock',
  source VARCHAR(20) DEFAULT 'buyout',
  consignment_percent NUMERIC(5,2),
  consignment_owner_id INTEGER REFERENCES slshop_clients(id),
  buy_client_id INTEGER REFERENCES slshop_clients(id),
  buy_operation_id INTEGER,
  sell_operation_id INTEGER,
  buy_at TIMESTAMPTZ,
  sell_at TIMESTAMPTZ,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_items_status ON slshop_items(status);
CREATE INDEX IF NOT EXISTS idx_slshop_items_category ON slshop_items(category_id);
CREATE INDEX IF NOT EXISTS idx_slshop_items_imei ON slshop_items(imei);
CREATE INDEX IF NOT EXISTS idx_slshop_items_title ON slshop_items(title);

-- Операции
CREATE TABLE IF NOT EXISTS slshop_operations (
  id SERIAL PRIMARY KEY,
  op_type VARCHAR(30) NOT NULL,
  item_id INTEGER REFERENCES slshop_items(id),
  client_id INTEGER REFERENCES slshop_clients(id),
  amount NUMERIC(12,2) DEFAULT 0,
  payment_method VARCHAR(20) DEFAULT 'cash',
  contract_number VARCHAR(40),
  note TEXT,
  employee_name VARCHAR(150),
  employee_token VARCHAR(120),
  related_op_id INTEGER REFERENCES slshop_operations(id),
  status_from VARCHAR(20),
  status_to VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_operations_type ON slshop_operations(op_type);
CREATE INDEX IF NOT EXISTS idx_slshop_operations_date ON slshop_operations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slshop_operations_item ON slshop_operations(item_id);

-- Шаблоны характеристик
CREATE TABLE IF NOT EXISTS slshop_specs_templates (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES slshop_categories(id),
  match_key VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(150),
  title_pattern VARCHAR(255),
  specs_short VARCHAR(100),
  specs_full TEXT,
  default_color VARCHAR(60),
  default_storage VARCHAR(40),
  popularity INTEGER DEFAULT 0,
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_specs_match ON slshop_specs_templates(match_key);

INSERT INTO slshop_specs_templates (match_key, brand, model, specs_short, specs_full, popularity, is_builtin) VALUES
  ('iphone 11', 'Apple', 'iPhone 11', '6.1" 4/64GB', 'A13 Bionic, 6.1" Liquid Retina, 4/64GB, 12+12 МП', 100, TRUE),
  ('iphone 12', 'Apple', 'iPhone 12', '6.1" 4/64GB 5G', 'A14 Bionic, 6.1" Super Retina XDR, 4/64GB, 5G', 100, TRUE),
  ('iphone 13', 'Apple', 'iPhone 13', '6.1" 4/128GB', 'A15 Bionic, 6.1" OLED, 4/128GB, 12+12 МП', 100, TRUE),
  ('iphone 14', 'Apple', 'iPhone 14', '6.1" 6/128GB', 'A15 Bionic, 6.1" OLED 60Hz, 6/128GB', 100, TRUE),
  ('iphone 14 pro', 'Apple', 'iPhone 14 Pro', '6.1" 6/128GB 120Hz', 'A16 Bionic, 6.1" LTPO 120Hz, 6/128GB, Dynamic Island', 100, TRUE),
  ('iphone 15', 'Apple', 'iPhone 15', '6.1" 6/128GB USB-C', 'A16 Bionic, 6.1" OLED, 6/128GB, USB-C, 48 МП', 100, TRUE),
  ('iphone 15 pro', 'Apple', 'iPhone 15 Pro', '6.1" 8/128GB Ti', 'A17 Pro, 6.1" LTPO 120Hz, титан, 8/128GB, USB-C 3.0', 100, TRUE),
  ('samsung galaxy a52', 'Samsung', 'Galaxy A52', '6.5" 4/128GB', 'Snapdragon 720G, 6.5" AMOLED 90Hz, 4/128GB', 80, TRUE),
  ('samsung galaxy s21', 'Samsung', 'Galaxy S21', '6.2" 8/128GB', 'Exynos 2100, 6.2" AMOLED 120Hz, 8/128GB', 80, TRUE),
  ('samsung galaxy s22', 'Samsung', 'Galaxy S22', '6.1" 8/128GB', 'Snapdragon 8 Gen 1, 6.1" AMOLED 120Hz, 8/128GB', 80, TRUE),
  ('xiaomi redmi note 11', 'Xiaomi', 'Redmi Note 11', '6.43" 4/128GB', 'Snapdragon 680, 6.43" AMOLED 90Hz, 4/128GB, 50 МП', 80, TRUE),
  ('xiaomi redmi note 12', 'Xiaomi', 'Redmi Note 12', '6.67" 4/128GB', 'Snapdragon 685, 6.67" AMOLED 120Hz, 4/128GB', 80, TRUE),
  ('xiaomi redmi 10', 'Xiaomi', 'Redmi 10', '6.5" 4/64GB', 'Helio G88, 6.5" IPS 90Hz, 4/64GB, 50 МП', 70, TRUE),
  ('realme c55', 'Realme', 'C55', '6.72" 6/128GB', 'Helio G88, 6.72" IPS 90Hz, 6/128GB, 64 МП', 60, TRUE),
  ('honor x9', 'Honor', 'X9', '6.81" 6/128GB', 'Snapdragon 680, 6.81" 120Hz, 6/128GB', 60, TRUE),
  ('tecno pova 5', 'Tecno', 'Pova 5', '6.78" 8/128GB', 'Helio G99, 6.78" IPS 120Hz, 8/128GB, 6000 mAh', 50, TRUE),
  ('infinix hot 30', 'Infinix', 'Hot 30', '6.78" 8/128GB', 'Helio G88, 6.78" 90Hz, 8/128GB, 50 МП', 50, TRUE)
ON CONFLICT DO NOTHING;

-- Шаблоны ценников
CREATE TABLE IF NOT EXISTS slshop_label_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  width_mm NUMERIC(6,2) NOT NULL DEFAULT 58,
  height_mm NUMERIC(6,2) NOT NULL DEFAULT 40,
  layout VARCHAR(40) DEFAULT 'classic',
  show_brand BOOLEAN DEFAULT TRUE,
  show_specs BOOLEAN DEFAULT TRUE,
  show_imei BOOLEAN DEFAULT FALSE,
  show_qr BOOLEAN DEFAULT FALSE,
  show_barcode BOOLEAN DEFAULT FALSE,
  font_family VARCHAR(80) DEFAULT 'Arial',
  is_default BOOLEAN DEFAULT FALSE,
  is_thermal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_label_templates (name, width_mm, height_mm, layout, is_default, is_thermal) VALUES
  ('Стандарт 58×40 (термо)', 58, 40, 'classic', TRUE, TRUE),
  ('Большой 58×60 (термо)', 58, 60, 'detailed', FALSE, TRUE),
  ('Маленький 40×30 (термо)', 40, 30, 'compact', FALSE, TRUE),
  ('A4 — 8 ценников 58×40', 58, 40, 'classic', FALSE, FALSE)
ON CONFLICT DO NOTHING;
