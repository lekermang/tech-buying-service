-- Заполняем sim_type для iPhone по региону
-- US = только eSIM
UPDATE t_p31606708_tech_buying_service.catalog
SET sim_type = 'eSIM'
WHERE sim_type IS NULL
  AND brand = 'Apple'
  AND category LIKE 'iPhone%'
  AND region IN ('US', 'BH', 'CA', 'JP', 'KW', 'MX', 'QA', 'SA', 'AE');

-- EU, IN, VN, AU, NZ, KR, SG = nanoSIM+eSIM
UPDATE t_p31606708_tech_buying_service.catalog
SET sim_type = 'nanoSIM+eSIM'
WHERE sim_type IS NULL
  AND brand = 'Apple'
  AND category LIKE 'iPhone%'
  AND region IN ('EU', 'IN', 'VN', 'AU', 'NZ', 'KR', 'SG');

-- CN, HK = Dual SIM (физические 2 sim)
UPDATE t_p31606708_tech_buying_service.catalog
SET sim_type = 'Dual SIM'
WHERE sim_type IS NULL
  AND brand = 'Apple'
  AND category LIKE 'iPhone%'
  AND region IN ('CN', 'HK');
