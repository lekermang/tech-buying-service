-- Пересчёт part_type для всех запчастей по ключевым словам в названии/категории
-- Порядок важен: более специфичные правила — первыми

-- 1. Заднее стекло
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'rear_glass'
WHERE (LOWER(name) LIKE '%заднее стекло%' OR LOWER(name) LIKE '%back glass%')
  AND part_type != 'rear_glass';

-- 2. Стекло камеры
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'camera_glass'
WHERE (LOWER(name) LIKE '%стекл%' AND LOWER(name) LIKE '%камер%')
  AND part_type != 'camera_glass';

-- 3. Дисплей / Экран / LCD / OLED / AMOLED
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'display'
WHERE (
    LOWER(name) LIKE '%дисплей%'
    OR LOWER(name) LIKE '%экран%'
    OR LOWER(name) LIKE '% lcd %'
    OR LOWER(name) LIKE '%oled%'
    OR LOWER(name) LIKE '%amoled%'
    OR LOWER(category) LIKE '%дисплей%'
    OR LOWER(category) LIKE '%экран%'
    OR LOWER(category) LIKE '%дисплеи%'
  )
  AND LOWER(name) NOT LIKE '%стекло%'
  AND LOWER(name) NOT LIKE '%стекл%'
  AND part_type != 'display';

-- 4. Аккумулятор (обновляем на battery_iphone, старый тип battery → battery_iphone если в категории iphone)
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'battery_iphone'
WHERE part_type = 'battery'
  AND (LOWER(category) LIKE '%iphone%' OR LOWER(name) LIKE '%iphone%' OR LOWER(name) LIKE '%айфон%');

UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'battery_other'
WHERE part_type = 'battery'
  AND part_type != 'battery_iphone';

-- 5. Динамик слуховой
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'speaker_ear'
WHERE (LOWER(name) LIKE '%слуховой%' OR LOWER(name) LIKE '%earpiece%' OR LOWER(name) LIKE '%наушник%')
  AND part_type = 'accessory';

-- 6. Динамик громкий / звонок
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'speaker_loud'
WHERE (LOWER(name) LIKE '%динамик%' OR LOWER(name) LIKE '%звонок%' OR LOWER(name) LIKE '%speaker%')
  AND LOWER(name) NOT LIKE '%слуховой%'
  AND part_type = 'accessory';

-- 7. Вибромотор
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'vibro'
WHERE (LOWER(name) LIKE '%вибро%' OR LOWER(name) LIKE '%vibrat%')
  AND part_type = 'accessory';

-- 8. Задняя крышка / Рамка / Корпус
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'back_cover'
WHERE (LOWER(name) LIKE '%корпус%' OR LOWER(name) LIKE '%рамка%' OR LOWER(name) LIKE '%крышка%' OR LOWER(name) LIKE '%back cover%')
  AND part_type = 'accessory';

-- 9. Шлейф / Плата
UPDATE t_p31606708_tech_buying_service.repair_parts
SET part_type = 'flex_board'
WHERE (LOWER(name) LIKE '%шлейф%' OR LOWER(name) LIKE '%плат%')
  AND part_type = 'accessory';

-- Обновляем labor_cost для всех типов по актуальным ценам из таблицы цен работ
UPDATE t_p31606708_tech_buying_service.repair_parts rp
SET labor_cost = lp.price
FROM t_p31606708_tech_buying_service.repair_labor_prices lp
WHERE rp.part_type = lp.part_type;