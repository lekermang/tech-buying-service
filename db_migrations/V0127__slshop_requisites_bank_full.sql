-- Заполняем банковские реквизиты ИП Мамедов А.М.О. для документов СмартЛомбарда
UPDATE t_p31606708_tech_buying_service.slshop_requisites SET
  bank_name = 'КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК',
  bank_bic = '042908612',
  bank_account = '40802810422270001866',
  corr_account = '30101810100000000612',
  legal_address = 'г. Калуга, ул. Кирова, 7/47',
  updated_at = NOW()
WHERE branch_id = (SELECT id FROM t_p31606708_tech_buying_service.slshop_branches WHERE name ILIKE '%7/47%' OR name ILIKE '%Кирова 7%' LIMIT 1);

UPDATE t_p31606708_tech_buying_service.slshop_requisites SET
  bank_name = 'КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК',
  bank_bic = '042908612',
  bank_account = '40802810422270001866',
  corr_account = '30101810100000000612',
  legal_address = 'г. Калуга, ул. Кирова, 11',
  updated_at = NOW()
WHERE branch_id = (SELECT id FROM t_p31606708_tech_buying_service.slshop_branches WHERE name ILIKE '%11%' LIMIT 1);

-- Подстраховка: где банк ещё пуст — заполняем общими данными
UPDATE t_p31606708_tech_buying_service.slshop_requisites SET
  bank_name = COALESCE(NULLIF(bank_name, ''), 'КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК'),
  bank_bic = COALESCE(NULLIF(bank_bic, ''), '042908612'),
  bank_account = COALESCE(NULLIF(bank_account, ''), '40802810422270001866'),
  corr_account = COALESCE(NULLIF(corr_account, ''), '30101810100000000612'),
  updated_at = NOW()
WHERE bank_name IS NULL OR bank_account IS NULL;
