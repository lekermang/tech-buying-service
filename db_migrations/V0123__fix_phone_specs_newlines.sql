-- Заменяем литеральные \n на настоящие переносы строк в характеристиках смартфонов
UPDATE t_p31606708_tech_buying_service.slshop_items
SET specs = REPLACE(specs, '\n', E'\n'),
    updated_at = NOW()
WHERE specs LIKE '%\n%';
