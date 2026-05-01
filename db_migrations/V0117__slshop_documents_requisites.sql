-- Реквизиты ИП/ООО для печати документов
CREATE TABLE IF NOT EXISTS slshop_requisites (
  id SERIAL PRIMARY KEY,
  branch_id INTEGER REFERENCES slshop_branches(id),
  legal_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(120),
  inn VARCHAR(20),
  ogrn VARCHAR(20),
  kpp VARCHAR(20),
  legal_address TEXT,
  actual_address TEXT,
  bank_name VARCHAR(255),
  bank_bic VARCHAR(20),
  bank_account VARCHAR(40),
  corr_account VARCHAR(40),
  phone VARCHAR(50),
  email VARCHAR(120),
  director_name VARCHAR(150),
  director_position VARCHAR(120) DEFAULT 'Индивидуальный предприниматель',
  signatory_name VARCHAR(150),
  warranty_days INTEGER DEFAULT 365,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_requisites (
  branch_id, legal_name, short_name, inn, legal_address, actual_address,
  phone, email, director_position, director_name, warranty_days, is_default
) VALUES (
  (SELECT id FROM slshop_branches WHERE name='Кирова 7'),
  'ИП СКУПКА24', 'Скупка24', '',
  'г. Калуга, ул. Кирова, 7', 'г. Калуга, ул. Кирова, 7',
  '+7 (4842) 27-77-04', 'info@skupka24.ru',
  'Индивидуальный предприниматель', 'Заморенов Д.', 365, TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO slshop_requisites (
  branch_id, legal_name, short_name, inn, legal_address, actual_address,
  phone, director_position, director_name, warranty_days
) VALUES (
  (SELECT id FROM slshop_branches WHERE name='Кирова 11'),
  'ИП СКУПКА24', 'Скупка24', '',
  'г. Калуга, ул. Кирова, 11', 'г. Калуга, ул. Кирова, 11',
  '+7 (4842) 27-77-04',
  'Индивидуальный предприниматель', 'Заморенов Д.', 365
) ON CONFLICT DO NOTHING;

-- Шаблоны документов: к какой операции прикручен какой документ
CREATE TABLE IF NOT EXISTS slshop_doc_templates (
  id SERIAL PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  op_types TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT TRUE,
  print_format VARCHAR(20) DEFAULT 'a4',
  copies INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO slshop_doc_templates (code, name, description, op_types, print_format, copies, is_system, sort_order) VALUES
  ('contract_purchase',           'Договор купли-продажи',
   'Договор купли-продажи между продавцом (физлицо) и Скупкой24.',
   ARRAY['buyout_individual','buyout_legal'], 'a4', 2, TRUE, 10),
  ('contract_purchase_jewelry',   'Договор купли-продажи (ювелирные изделия)',
   'Договор купли-продажи для ювелирных изделий с указанием металла, пробы и веса.',
   ARRAY['buyout_individual'], 'a4', 2, TRUE, 11),
  ('purchase_receipt',             'Скупочная квитанция (ювелирные изделия)',
   'Квитанция о приёме ювелирного изделия в скупку.',
   ARRAY['buyout_individual'], 'a4', 2, TRUE, 12),
  ('rko_buyout',                   'Расходный кассовый ордер (скупка)',
   'РКО на выдачу денег клиенту при скупке.',
   ARRAY['buyout_individual','buyout_legal'], 'a5', 1, TRUE, 20),
  ('control_label',                'Контрольный талон (бирка)',
   'Бирка для вложения в скупленное имущество.',
   ARRAY['buyout_individual'], 'thermal', 1, TRUE, 30),
  ('personal_consent',             'Согласие на обработку персональных данных',
   'Согласие клиента на обработку персональных данных.',
   ARRAY['buyout_individual','consignment_in'], 'a4', 1, TRUE, 40),
  ('sales_receipt',                'Товарный чек',
   'Товарный чек для покупателя при продаже товара.',
   ARRAY['sell','sell_consignment'], 'thermal', 2, TRUE, 50),
  ('pko_sale',                     'Приходный кассовый ордер (продажа)',
   'ПКО при продаже товара.',
   ARRAY['sell'], 'a5', 1, TRUE, 60),
  ('rko_return',                   'Расходный кассовый ордер (возврат)',
   'РКО при возврате товара покупателем.',
   ARRAY['return','return_consignment'], 'a5', 1, TRUE, 70),
  ('contract_consignment',         'Договор комиссии (на реализацию)',
   'Договор комиссии для приёма товара на реализацию.',
   ARRAY['consignment_in'], 'a4', 2, TRUE, 80),
  ('act_consignment_return',       'Акт возврата товара по договору комиссии',
   'Акт о снятии товара с реализации и возврате клиенту.',
   ARRAY['consignment_off'], 'a4', 2, TRUE, 90),
  ('rko_consignment_settlement',   'РКО (расчёт за реализованный товар)',
   'РКО на выплату клиенту по договору комиссии.',
   ARRAY['consignment_settle'], 'a5', 1, TRUE, 100),
  ('pko_consignment_sale',         'ПКО (продажа на реализации)',
   'ПКО при продаже товара, принятого на реализацию.',
   ARRAY['sell_consignment'], 'a5', 1, TRUE, 110),
  ('invoice',                      'Счёт на оплату',
   'Счёт на оплату для оплаты по реквизитам.',
   ARRAY['sell','sell_consignment'], 'a4', 1, TRUE, 120),
  ('waybill_in',                   'Накладная (входящее перемещение)',
   'Накладная на приём товара со склада другого филиала.',
   ARRAY['move_in'], 'a4', 1, TRUE, 130),
  ('waybill_out',                  'Накладная (исходящее перемещение)',
   'Накладная на отправку товара на другой филиал.',
   ARRAY['move_out'], 'a4', 1, TRUE, 140),
  ('writeoff_act',                 'Акт списания/изъятия товара',
   'Акт о списании или изъятии товара.',
   ARRAY['writeoff'], 'a4', 1, TRUE, 150)
ON CONFLICT (code) DO NOTHING;
