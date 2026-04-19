INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description) VALUES
('sms_tpl_in_progress', 'Скупка24: {device} в ремонте. Готово — сообщим. Skypka24.com', 'SMS: устройство взято в ремонт'),
('sms_tpl_waiting_parts', 'Скупка24: {device} — ждём запчасть. Готово — сообщим. Skypka24.com', 'SMS: ожидание запчасти'),
('sms_tpl_ready', 'Скупка24: {device} готов! Стоимость: {amount} руб. Ждём вас. Skypka24.com', 'SMS: устройство готово'),
('sms_tpl_done', 'Скупка24: {device} выдан. Спасибо за обращение! Skypka24.com', 'SMS: устройство выдано'),
('sms_tpl_cancelled', 'Скупка24: {device} — ремонт отменён. Позвоните нам. Skypka24.com', 'SMS: ремонт отменён')
ON CONFLICT (key) DO NOTHING;