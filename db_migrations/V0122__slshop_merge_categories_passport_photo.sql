-- 1) Объединяем «Смартфоны» (id=1) и «Мобильные телефоны» (id=57) в одну категорию.
-- Все товары и шаблоны характеристик переводим на «Мобильные телефоны».
UPDATE slshop_items
SET category_id = (SELECT id FROM slshop_categories WHERE name='Мобильные телефоны' LIMIT 1)
WHERE category_id = (SELECT id FROM slshop_categories WHERE name='Смартфоны' AND parent_id IS NULL LIMIT 1);

UPDATE slshop_specs_templates
SET category_id = (SELECT id FROM slshop_categories WHERE name='Мобильные телефоны' LIMIT 1)
WHERE category_id = (SELECT id FROM slshop_categories WHERE name='Смартфоны' AND parent_id IS NULL LIMIT 1);

UPDATE slshop_revisions
SET category_id = (SELECT id FROM slshop_categories WHERE name='Мобильные телефоны' LIMIT 1)
WHERE category_id = (SELECT id FROM slshop_categories WHERE name='Смартфоны' AND parent_id IS NULL LIMIT 1);

UPDATE slshop_discount_rules
SET category_id = (SELECT id FROM slshop_categories WHERE name='Мобильные телефоны' LIMIT 1)
WHERE category_id = (SELECT id FROM slshop_categories WHERE name='Смартфоны' AND parent_id IS NULL LIMIT 1);

-- Скрываем старую категорию «Смартфоны» (без удаления — мягко)
UPDATE slshop_categories SET is_active = FALSE
WHERE name='Смартфоны' AND parent_id IS NULL;

-- 2) Все имеющиеся товары (которые сейчас на складе) переносим на Кирова 11.
-- Товары по умолчанию были привязаны к Кирова 7 — фактически они на Кирова 11.
UPDATE slshop_items
SET branch_id = (SELECT id FROM slshop_branches WHERE name='Кирова 11' LIMIT 1)
WHERE status IN ('stock','showcase','consignment');

-- 3) Поле для фото паспорта клиента и фото клиента
ALTER TABLE slshop_clients ADD COLUMN IF NOT EXISTS passport_photo_url TEXT;
ALTER TABLE slshop_clients ADD COLUMN IF NOT EXISTS passport_photo2_url TEXT;
ALTER TABLE slshop_clients ADD COLUMN IF NOT EXISTS face_photo_url TEXT;
