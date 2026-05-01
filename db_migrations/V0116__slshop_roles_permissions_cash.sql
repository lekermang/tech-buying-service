CREATE TABLE IF NOT EXISTS slshop_roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_roles (code, name, description, is_system, sort_order, permissions) VALUES
  ('owner', 'Суперадминистратор',
   'Максимальные права. Аккаунт владельца. Доступно всё, включая редактирование проданных товаров и изменение цены продажи.',
   TRUE, 10,
   '{"all": true}'::jsonb),
  ('manager', 'Руководитель',
   'Доступны все функции программы за исключением редактирования личных настроек суперадминистратора. Руководителей может быть несколько.',
   TRUE, 20,
   '{"shop_buy":true,"shop_sell":true,"shop_return":true,"shop_move":true,"shop_writeoff":true,"shop_reserve":true,"shop_view":true,"consignment_create":true,"consignment_view":true,"edit_price":true,"discount":true,"labels":true,"repair_create":true,"repair_view":true,"repair_edit_parts":true,"repair_edit_works":true,"newgoods_create":true,"newgoods_view":true,"newgoods_edit":true,"newgoods_move":true,"edit_all_ops":true,"backdate":true,"excel_export":true,"clients":true,"revision":true,"salary_view_all":true,"salary_edit_all":true,"settings_employees":true,"settings_branches":true,"settings_categories":true,"settings_storage":true,"settings_loyalty":true,"settings_metals":true,"settings_discount_auto":true,"settings_requisites":true,"settings_kkt":true,"shifts_open_close":true,"shifts_view_closed":true,"shifts_assets":true,"shifts_view_dates":true,"shifts_view_profit":true,"cashflow_create":true,"cashflow_view":true,"accounts_view_all":true,"documents_templates":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('admin', 'Администратор',
   'Управление магазином: операции, ценники, уценка, ревизия. Без доступа к настройкам прав.',
   TRUE, 30,
   '{"shop_buy":true,"shop_sell":true,"shop_return":true,"shop_move":true,"shop_writeoff":true,"shop_reserve":true,"shop_view":true,"consignment_create":true,"consignment_view":true,"edit_price":true,"discount":true,"labels":true,"repair_view":true,"newgoods_view":true,"edit_open_shift_ops":true,"remove_open_shift_ops":true,"excel_export":true,"clients":true,"revision":true,"shifts_open_close":true,"shifts_view_dates":true,"cashflow_create":true,"cashflow_view":true,"accounts_view_own_branch":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('master', 'Мастер по ремонту',
   'Приём и завершение ремонтов, добавление запчастей и работ. Только просмотр товаров комиссионки.',
   TRUE, 40,
   '{"shop_view":true,"consignment_view":true,"repair_create":true,"repair_view":true,"repair_edit_parts":true,"repair_edit_works":true,"newgoods_view":true,"clients":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('seller', 'Продавец',
   'Скупка, продажа, возврат, печать ценников. Просмотр товаров и операций.',
   TRUE, 50,
   '{"shop_buy":true,"shop_sell":true,"shop_return":true,"shop_reserve":true,"shop_view":true,"consignment_create":true,"consignment_view":true,"labels":true,"newgoods_view":true,"clients":true,"shifts_open_close":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('accountant', 'Бухгалтер',
   'Просмотр всех операций, экспорт в Excel, аналитика, расчётные счета и приходно-расходные операции.',
   TRUE, 60,
   '{"shop_view":true,"consignment_view":true,"newgoods_view":true,"excel_export":true,"clients":true,"shifts_view_closed":true,"shifts_view_dates":true,"shifts_view_profit":true,"cashflow_create":true,"cashflow_view":true,"accounts_view_all":true,"salary_view_all":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('investor', 'Инвестор',
   'Только просмотр аналитики, прибыли и оборотов.',
   TRUE, 70,
   '{"shop_view":true,"consignment_view":true,"newgoods_view":true,"shifts_view_closed":true,"shifts_view_dates":true,"shifts_view_profit":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb),
  ('staff', 'Сотрудник (базовый)',
   'Базовый набор прав для нового сотрудника. Скупка, продажа и просмотр.',
   TRUE, 80,
   '{"shop_buy":true,"shop_sell":true,"shop_view":true,"consignment_view":true,"labels":true,"clients":true,"remove_sold_item":false,"edit_sold_price":false}'::jsonb)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS slshop_cash_accounts (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES slshop_branches(id),
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(30) DEFAULT 'cash',
  balance NUMERIC(14,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_cash_accounts (branch_id, name, kind, is_default) VALUES
  ((SELECT id FROM slshop_branches WHERE name='Кирова 7'), 'Касса Кирова 7', 'cash', TRUE),
  ((SELECT id FROM slshop_branches WHERE name='Кирова 11'), 'Касса Кирова 11', 'cash', FALSE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS slshop_cash_movements (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES slshop_cash_accounts(id),
  direction VARCHAR(10) NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2),
  category VARCHAR(60),
  reason TEXT,
  taken_by VARCHAR(150),
  employee_name VARCHAR(150),
  related_op_id INTEGER REFERENCES slshop_operations(id),
  related_item_id INTEGER REFERENCES slshop_items(id),
  is_auto BOOLEAN DEFAULT FALSE,
  branch_id INTEGER REFERENCES slshop_branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_slshop_cash_movements_account ON slshop_cash_movements(account_id);
CREATE INDEX IF NOT EXISTS idx_slshop_cash_movements_date ON slshop_cash_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slshop_cash_movements_dir ON slshop_cash_movements(direction);
