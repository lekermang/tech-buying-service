-- Настройки аниме-темы сотрудника
ALTER TABLE t_p31606708_tech_buying_service.employees
  ADD COLUMN IF NOT EXISTS theme_settings JSONB NULL DEFAULT NULL;

COMMENT ON COLUMN t_p31606708_tech_buying_service.employees.theme_settings IS 'Персональные настройки темы: character_id, cursor_effect, accent_color, bg_style, ui_density';
