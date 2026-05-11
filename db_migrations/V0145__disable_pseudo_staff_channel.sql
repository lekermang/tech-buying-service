-- «Псевдо staff-канал» = личный диалог. Чтобы не было дублей, инвалидируем ключ — ставим невалидное значение, get_staff_channel_id() вернёт None.
UPDATE t_p31606708_tech_buying_service.settings
SET value = '0'
WHERE key = 'max_staff_channel_id';