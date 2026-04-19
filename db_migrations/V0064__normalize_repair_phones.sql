-- Нормализация телефонов в repair_orders: 8XXXXXXXXXX → +7XXXXXXXXXX
UPDATE t_p31606708_tech_buying_service.repair_orders
SET phone = '+7' || substring(regexp_replace(phone, '[^0-9]', '', 'g') FROM 2)
WHERE regexp_replace(phone, '[^0-9]', '', 'g') ~ '^8[0-9]{10}$';

-- Форматы без скобок и пробелов: +7XXXXXXXXXX (уже правильные, только убираем пробелы/скобки)
UPDATE t_p31606708_tech_buying_service.repair_orders
SET phone = '+7' || substring(regexp_replace(phone, '[^0-9]', '', 'g') FROM 2)
WHERE regexp_replace(phone, '[^0-9]', '', 'g') ~ '^7[0-9]{10}$'
  AND phone NOT LIKE '+7%';
