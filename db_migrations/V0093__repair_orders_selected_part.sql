-- Добавляем поля «откуда заказывать» в заявку на ремонт
ALTER TABLE t_p31606708_tech_buying_service.repair_orders
  ADD COLUMN IF NOT EXISTS part_id        text,
  ADD COLUMN IF NOT EXISTS part_name      text,
  ADD COLUMN IF NOT EXISTS part_quality   text,
  ADD COLUMN IF NOT EXISTS part_source    text,  -- 'stock' (МойСклад, в наличии) | 'order' (Excel-прайс, под заказ)
  ADD COLUMN IF NOT EXISTS part_supplier  text,  -- например 'МойСклад' | 'Прайс поставщика';
  ADD COLUMN IF NOT EXISTS part_code      text,
  ADD COLUMN IF NOT EXISTS part_category  text,
  ADD COLUMN IF NOT EXISTS part_supplier_price numeric(10,2);
