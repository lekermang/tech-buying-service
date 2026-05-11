-- Добавляем настройку для MAX-приглашений (ссылка на бот/профиль в мессенджере MAX).
-- Если пусто — фронт показывает фолбек «диплинк на номер клиента» (max://u/<phone>).
INSERT INTO t_p31606708_tech_buying_service.settings (key, value, description)
VALUES (
  'max_invite_link',
  '',
  'Публичная ссылка на чат с компанией в мессенджере MAX (например https://max.ru/skypka24). Используется в SMS-приглашениях и кнопке «Пригласить в MAX». Если пусто — клиента приглашаем диплинком max://u/<phone>.'
)
ON CONFLICT (key) DO NOTHING;
