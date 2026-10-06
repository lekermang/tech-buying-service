INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description, updated_at)
VALUES ('max_leads_chat_id', '-73679837717099', 'MAX-чат «Оценка скупка»: сюда приходят все заявки с кнопками', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();