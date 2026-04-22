-- Помечаем тестовые заявки как отменённые
UPDATE t_p31606708_tech_buying_service.repair_orders 
SET status = 'cancelled', admin_note = 'Тестовая заявка — удалить'
WHERE id IN (61, 62);

-- Восстанавливаем потерянную заявку #58
INSERT INTO t_p31606708_tech_buying_service.repair_orders (id, name, phone, status, created_at, admin_note)
VALUES (58, 'Клиент', '89092503040', 'new', '2026-04-22 12:00:00+00', 'Восстановлена вручную — данные частичные');

-- Восстанавливаем заявку Вадима
INSERT INTO t_p31606708_tech_buying_service.repair_orders (name, phone, status, created_at, admin_note)
VALUES ('Вадим', '89055958830', 'new', '2026-04-22 12:00:00+00', 'Восстановлена вручную — данные частичные');
