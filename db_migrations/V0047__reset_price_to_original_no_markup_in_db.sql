-- Сбрасываем price = original_price (убираем наценку из БД, она применяется на фронте)
UPDATE t_p31606708_tech_buying_service.catalog
SET price = original_price
WHERE original_price IS NOT NULL AND original_price > 0;
