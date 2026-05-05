-- 1) Колонка quantity для учёта количества единиц в позиции (чехлы, стёкла и т.п.)
ALTER TABLE t_p31606708_tech_buying_service.slshop_items
    ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

UPDATE t_p31606708_tech_buying_service.slshop_items
   SET quantity = 1
 WHERE quantity IS NULL OR quantity < 1;

-- 2) Подкатегории под "Мобильные аксесуары" (id=38). 
--    Имена уникальны глобально — добавляем суффикс "(моб.)" там, где нужно.
INSERT INTO t_p31606708_tech_buying_service.slshop_categories
    (name, slug, icon, color, sort_order, is_active, parent_id, depth, path)
SELECT v.name, v.slug, v.icon, '#FFD700', v.sort_order, true, 38, 1,
       'Мобильные аксесуары / ' || v.name
  FROM (VALUES
        ('Чехлы',                'mob_acc_cases',     'Smartphone',       10),
        ('Защитные стёкла',      'mob_acc_glass',     'Shield',           20),
        ('Зарядные устройства',  'mob_acc_chargers',  'Plug',             30),
        ('Кабели',               'mob_acc_cables',    'Cable',            40),
        ('Наушники (моб.)',      'mob_acc_headphones','Headphones',       50),
        ('Power Bank',           'mob_acc_powerbank', 'BatteryCharging',  60),
        ('Держатели и подставки','mob_acc_holders',   'Anchor',           70),
        ('Адаптеры и переходники','mob_acc_adapters', 'Cable',            80),
        ('Карты памяти',         'mob_acc_memory',    'MemoryStick',      90),
        ('Прочие аксессуары',    'mob_acc_other',     'Package',         100)
  ) AS v(name, slug, icon, sort_order)
 WHERE NOT EXISTS (
        SELECT 1 FROM t_p31606708_tech_buying_service.slshop_categories c
         WHERE c.slug = v.slug OR c.name = v.name
       );
