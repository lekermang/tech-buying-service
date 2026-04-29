-- Сброс закэшированных токенов SmartLombard (через UPDATE с устаревшей датой):
-- ставим updated_at в прошлое, чтобы функция при следующем вызове считала кэш протухшим
UPDATE t_p31606708_tech_buying_service.smartlombard_cache 
SET updated_at = NOW() - INTERVAL '2 hours',
    payload = '{"token": ""}'::jsonb
WHERE cache_key LIKE '__access_token%';