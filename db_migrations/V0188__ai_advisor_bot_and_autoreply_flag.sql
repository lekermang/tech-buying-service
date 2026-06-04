-- Системный бот-сотрудник для ИИ-сообщений в командном чате СКУПКА24Vip.
-- login уникален, не активен для входа (is_active=false), без пароля для логина.
INSERT INTO t_p31606708_tech_buying_service.employees (full_name, login, password_hash, role, is_active, avatar_url)
SELECT '🤖 ИИ-Советник', 'ai_advisor_bot', 'x', 'staff', false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM t_p31606708_tech_buying_service.employees WHERE login='ai_advisor_bot'
);

-- Флаг ИИ-автоответов клиентам (по умолчанию включено)
INSERT INTO t_p31606708_tech_buying_service.settings (key, value)
VALUES ('ai_autoreply_enabled', '1')
ON CONFLICT (key) DO NOTHING;