-- Архивируем старые таблицы SmartLombard (на случай возврата к данным)
ALTER TABLE IF EXISTS sl_goods RENAME TO sl_goods_archive_old;
ALTER TABLE IF EXISTS sl_merchants RENAME TO sl_merchants_archive_old;
ALTER TABLE IF EXISTS sl_webhook_log RENAME TO sl_webhook_log_archive_old;
ALTER TABLE IF EXISTS smartlombard_cache RENAME TO smartlombard_cache_archive_old;

-- Категории товаров
CREATE TABLE IF NOT EXISTS sl_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  icon VARCHAR(40) DEFAULT 'Package',
  color VARCHAR(20) DEFAULT '#FFD700',
  sort_order INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sl_categories (name, slug, icon, color, sort_order) VALUES
  ('Мобильные телефоны', 'phones', 'Smartphone', '#FFD700', 10),
  ('Ноутбуки', 'laptops', 'Laptop', '#3B82F6', 20),
  ('Планшеты', 'tablets', 'Tablet', '#8B5CF6', 30),
  ('Часы', 'watches', 'Watch', '#F97316', 40),
  ('Аудио / Наушники', 'audio', 'Headphones', '#EC4899', 50),
  ('ТВ и приставки', 'tv', 'Tv', '#10B981', 60),
  ('Игровые консоли', 'consoles', 'Gamepad2', '#EF4444', 70),
  ('Фото / Видео', 'photo', 'Camera', '#06B6D4', 80),
  ('Антиквариат', 'antique', 'Crown', '#D4A017', 90),
  ('Инструменты', 'tools', 'Wrench', '#A78BFA', 100),
  ('Другое', 'other', 'Package', '#94A3B8', 999)
ON CONFLICT (slug) DO NOTHING;

-- Клиенты комиссионки
CREATE TABLE IF NOT EXISTS sl_clients (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(40),
  passport_series VARCHAR(20),
  passport_number VARCHAR(20),
  passport_issued_by TEXT,
  passport_issued_date VARCHAR(20),
  passport_address TEXT,
  birth_date VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_clients_phone ON sl_clients(phone);
CREATE INDEX IF NOT EXISTS idx_sl_clients_name ON sl_clients(full_name);

-- Товары на складе
CREATE TABLE IF NOT EXISTS sl_items (
  id SERIAL PRIMARY KEY,
  category_id INT,
  title VARCHAR(300) NOT NULL,
  brand VARCHAR(80),
  model VARCHAR(120),
  specs TEXT,
  condition VARCHAR(40) DEFAULT 'хорошее',
  color VARCHAR(60),
  storage VARCHAR(40),
  imei VARCHAR(40),
  serial_number VARCHAR(80),
  description TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  sell_price NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'in_stock',
  location VARCHAR(60) DEFAULT 'showcase',
  source VARCHAR(40) DEFAULT 'buyout',
  purchase_client_id INT,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  purchase_employee VARCHAR(120),
  sell_client_id INT,
  sell_date TIMESTAMPTZ,
  sell_employee VARCHAR(120),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_items_status ON sl_items(status);
CREATE INDEX IF NOT EXISTS idx_sl_items_category ON sl_items(category_id);
CREATE INDEX IF NOT EXISTS idx_sl_items_purchase_date ON sl_items(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sl_items_sell_date ON sl_items(sell_date);
CREATE INDEX IF NOT EXISTS idx_sl_items_brand_model ON sl_items(brand, model);

-- Журнал операций
CREATE TABLE IF NOT EXISTS sl_operations (
  id SERIAL PRIMARY KEY,
  item_id INT,
  client_id INT,
  op_type VARCHAR(30) NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  payment_method VARCHAR(30) DEFAULT 'cash',
  contract_number VARCHAR(60),
  employee VARCHAR(120),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_ops_item ON sl_operations(item_id);
CREATE INDEX IF NOT EXISTS idx_sl_ops_type ON sl_operations(op_type);
CREATE INDEX IF NOT EXISTS idx_sl_ops_date ON sl_operations(created_at);

-- Шаблоны характеристик
CREATE TABLE IF NOT EXISTS sl_specs_templates (
  id SERIAL PRIMARY KEY,
  category_id INT,
  brand VARCHAR(80),
  model VARCHAR(120),
  title_pattern VARCHAR(300),
  specs TEXT NOT NULL,
  use_count INT DEFAULT 1,
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sl_specs_brand_model ON sl_specs_templates(brand, model);
CREATE INDEX IF NOT EXISTS idx_sl_specs_title ON sl_specs_templates(title_pattern);
CREATE INDEX IF NOT EXISTS idx_sl_specs_use ON sl_specs_templates(use_count DESC);

-- Форматы ценников
CREATE TABLE IF NOT EXISTS sl_pricetag_formats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  width_mm NUMERIC(6,2) NOT NULL,
  height_mm NUMERIC(6,2) NOT NULL,
  show_specs BOOLEAN DEFAULT TRUE,
  show_barcode BOOLEAN DEFAULT FALSE,
  show_logo BOOLEAN DEFAULT TRUE,
  font_family VARCHAR(80) DEFAULT 'Arial',
  is_default BOOLEAN DEFAULT FALSE,
  is_thermal BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO sl_pricetag_formats (name, width_mm, height_mm, show_specs, show_barcode, show_logo, is_default, is_thermal, sort_order) VALUES
  ('Стандарт 58×40 мм (термо)', 58, 40, TRUE, FALSE, TRUE, TRUE, TRUE, 10),
  ('Маленький 40×30 мм', 40, 30, TRUE, FALSE, FALSE, FALSE, TRUE, 20),
  ('Большой 70×50 мм', 70, 50, TRUE, TRUE, TRUE, FALSE, TRUE, 30),
  ('Лист A4 (3×8 = 24 шт)', 70, 37, TRUE, FALSE, TRUE, FALSE, FALSE, 40);
