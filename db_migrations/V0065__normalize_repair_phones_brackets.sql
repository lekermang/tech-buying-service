-- Убираем скобки/пробелы/тире: "+7 (910) 597-54-37" → "+79105975437"
UPDATE t_p31606708_tech_buying_service.repair_orders
SET phone = '+7' || substring(regexp_replace(phone, '[^0-9]', '', 'g') FROM 2)
WHERE phone ~ '^\+7[\s\(\)]';
