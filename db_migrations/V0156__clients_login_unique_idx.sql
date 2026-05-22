-- Уникальный индекс на login (если ещё нет)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_login_unique
  ON t_p31606708_tech_buying_service.clients (LOWER(login))
  WHERE login IS NOT NULL AND login <> '';