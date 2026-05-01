-- 1) Сливаем категорию "Смартфоны" в "Мобильные телефоны"
UPDATE slshop_items SET category_id = (SELECT id FROM slshop_categories WHERE name='Мобильные телефоны')
WHERE category_id = (SELECT id FROM slshop_categories WHERE name='Смартфоны');

-- Старую категорию деактивируем (не удаляем — могут быть FK)
UPDATE slshop_categories SET is_active = FALSE WHERE name='Смартфоны';

-- 2) Переносим ВСЕ товары на филиал Кирова 11
UPDATE slshop_items SET branch_id = (SELECT id FROM slshop_branches WHERE name='Кирова 11');

-- 3) Делаем Кирова 11 филиалом по умолчанию
UPDATE slshop_branches SET is_default = (name='Кирова 11');
