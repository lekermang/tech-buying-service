-- Бэкфил model_keywords и category для ранее загруженных через Excel запчастей
-- (раньше эти поля не заполнялись, из-за чего публичная форма ремонта не находила позиции)

-- 1) Категория по типу запчасти, если она пустая
UPDATE t_p31606708_tech_buying_service.repair_parts
SET category = CASE part_type
    WHEN 'display'        THEN 'Дисплеи'
    WHEN 'battery_iphone' THEN 'Аккумуляторы iPhone'
    WHEN 'battery_other'  THEN 'Аккумуляторы'
    WHEN 'rear_glass'     THEN 'Задние стёкла'
    WHEN 'camera_glass'   THEN 'Стёкла камер'
    WHEN 'flex_board'     THEN 'Шлейфы и платы'
    WHEN 'speaker_ear'    THEN 'Слуховые динамики'
    WHEN 'speaker_loud'   THEN 'Громкие динамики'
    WHEN 'vibro'          THEN 'Вибромоторы'
    WHEN 'back_cover'     THEN 'Корпуса и крышки'
    ELSE 'Прочее'
END
WHERE (category IS NULL OR category = '')
  AND price_batch_id IS NOT NULL;

-- 2) model_keywords = name + category, в нижнем регистре, где пусто
UPDATE t_p31606708_tech_buying_service.repair_parts
SET model_keywords = LOWER(COALESCE(name, '') || ' ' || COALESCE(category, ''))
WHERE (model_keywords IS NULL OR model_keywords = '');

-- Индекс для ускорения LIKE-поиска по ключевым словам
CREATE INDEX IF NOT EXISTS idx_repair_parts_model_keywords_lower
ON t_p31606708_tech_buying_service.repair_parts (LOWER(model_keywords) text_pattern_ops);

CREATE INDEX IF NOT EXISTS idx_repair_parts_name_lower
ON t_p31606708_tech_buying_service.repair_parts (LOWER(name) text_pattern_ops);
