-- Фикс: в pchat_clients max_chat_id содержал user_id (баг). Сбрасываем — корректный chat_id появится при следующем сообщении от клиента.
UPDATE t_p31606708_tech_buying_service.pchat_clients
SET max_chat_id = NULL
WHERE max_user_id IS NOT NULL AND max_chat_id = max_user_id;

-- Сразу выставим правильный chat_id для Сергея (определён из webhook)
UPDATE t_p31606708_tech_buying_service.pchat_clients
SET max_chat_id = 268564495
WHERE max_user_id = 28799083;