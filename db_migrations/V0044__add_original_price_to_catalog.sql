-- Добавляем поле original_price (цена без наценки)
ALTER TABLE t_p31606708_tech_buying_service.catalog
  ADD COLUMN IF NOT EXISTS original_price INTEGER;

-- Заполняем original_price из текущих цен (вычитаем текущую наценку 5500)
UPDATE t_p31606708_tech_buying_service.catalog
  SET original_price = GREATEST(price - 5500, 0)
  WHERE price IS NOT NULL AND original_price IS NULL;
