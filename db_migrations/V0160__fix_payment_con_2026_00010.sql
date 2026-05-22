-- Исправление платежа по договору CON-2026-00010:
-- клиент заплатил 32 400 ₽, в системе зафиксировано 31 200 ₽.
-- Поправляем сумму платежа и пересчитываем агрегаты по договору.

UPDATE t_p31606708_tech_buying_service.contracts_14d_payments
SET amount = 32400.00
WHERE id = 8 AND contract_id = 10;

UPDATE t_p31606708_tech_buying_service.contracts_14d
SET paid_total = 32400.00,
    total_due = 32400.00,
    remaining_debt = 0.00,
    updated_at = NOW()
WHERE id = 10 AND contract_number = 'CON-2026-00010';

INSERT INTO t_p31606708_tech_buying_service.contracts_14d_log
  (contract_id, action, details, actor_name, actor_role)
VALUES (
  10,
  'payment_correction',
  '{"reason":"клиент заплатил 32400₽, в системе было 31200₽","payment_id":8,"old_amount":31200.00,"new_amount":32400.00,"diff":1200.00}'::jsonb,
  'system',
  'admin'
);