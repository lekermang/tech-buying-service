ALTER TABLE t_p31606708_tech_buying_service.catalog
  ADD COLUMN IF NOT EXISTS wholesale_price integer NULL,
  ADD COLUMN IF NOT EXISTS retail_price integer NULL;

COMMENT ON COLUMN t_p31606708_tech_buying_service.catalog.wholesale_price IS 'Оптовая цена (price + наценка опт)';
COMMENT ON COLUMN t_p31606708_tech_buying_service.catalog.retail_price IS 'Розничная цена (price + наценка розница)';
