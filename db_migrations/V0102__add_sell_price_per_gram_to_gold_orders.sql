ALTER TABLE t_p31606708_tech_buying_service.gold_orders
  ADD COLUMN IF NOT EXISTS sell_price_per_gram NUMERIC(10,2);

COMMENT ON COLUMN t_p31606708_tech_buying_service.gold_orders.sell_price_per_gram IS
  'Цена продажи за 1 грамм (₽/г). При сохранении бэкенд считает sell_price = sell_price_per_gram * weight, profit = sell_price - buy_price.';