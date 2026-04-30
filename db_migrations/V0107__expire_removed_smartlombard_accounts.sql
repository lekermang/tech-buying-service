-- Удаляем старые account_id 69146 и 78678 — оставляем только #34914
-- Помечаем их кэш-записи как протухшие
UPDATE t_p31606708_tech_buying_service.smartlombard_cache
SET payload = '{"token": "", "removed": true}'::jsonb,
    updated_at = '2020-01-01 00:00:00'::timestamptz
WHERE cache_key IN ('__access_token_69146__', '__access_token_78678__');