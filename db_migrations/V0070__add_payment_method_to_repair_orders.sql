ALTER TABLE t_p31606708_tech_buying_service.repair_orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT NULL;

UPDATE t_p31606708_tech_buying_service.repair_orders
  SET payment_method = 'cash'
  WHERE is_paid = TRUE AND payment_method IS NULL;