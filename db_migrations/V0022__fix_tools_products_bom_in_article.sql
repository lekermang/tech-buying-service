-- Убираем BOM-символ (U+FEFF) из начала артикулов
UPDATE t_p31606708_tech_buying_service.tools_products
SET article = ltrim(article, U&'\FEFF')
WHERE article LIKE U&'\FEFF%';