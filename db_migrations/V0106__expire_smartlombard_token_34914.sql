-- Помечаем старый токен SmartLombard для #34914 как устаревший:
-- ставим updated_at в далёкое прошлое, чтобы код считал кэш протухшим
-- и при следующем запросе пошёл за новым токеном.
UPDATE t_p31606708_tech_buying_service.smartlombard_cache 
SET payload = '{"token": ""}'::jsonb, updated_at = '2020-01-01 00:00:00'::timestamptz
WHERE cache_key IN ('__access_token_34914__', '__access_token__');