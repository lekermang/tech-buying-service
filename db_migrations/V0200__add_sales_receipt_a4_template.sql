INSERT INTO t_p31606708_tech_buying_service.slshop_doc_templates
  (code, name, description, op_types, is_active, sort_order)
VALUES
  (
    'sales_receipt_a4',
    'Товарный чек А4 (вывоз за границу)',
    'Двуязычный товарный чек формата А4 со всеми реквизитами, IMEI, датой/временем, таможенной оговоркой и местом для печати',
    ARRAY['sell', 'sell_consignment'],
    true,
    18
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  op_types = EXCLUDED.op_types,
  is_active = EXCLUDED.is_active;