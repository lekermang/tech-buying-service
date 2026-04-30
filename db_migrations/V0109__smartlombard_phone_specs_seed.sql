-- Встроенный справочник характеристик популярных моделей
-- Помечаем is_builtin=TRUE — отображаются в первую очередь при автоподстановке

INSERT INTO sl_specs_templates (category_id, brand, model, title_pattern, specs, is_builtin, use_count) VALUES
-- iPhone
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 11', 'iPhone 11', '6.1" Liquid Retina, A13 Bionic, 4/64-256ГБ, 12Мп+12Мп, Face ID', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 11 Pro', 'iPhone 11 Pro', '5.8" Super Retina XDR, A13, 4/64-512ГБ, тройная 12Мп, Face ID', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 11 Pro Max', 'iPhone 11 Pro Max', '6.5" Super Retina XDR, A13, 4/64-512ГБ, тройная 12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 12', 'iPhone 12', '6.1" Super Retina XDR, A14, 4/64-256ГБ, 12+12Мп, 5G, MagSafe', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 12 mini', 'iPhone 12 mini', '5.4" Super Retina XDR, A14, 4/64-256ГБ, 12+12Мп, 5G', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 12 Pro', 'iPhone 12 Pro', '6.1" Super Retina XDR, A14, 6/128-512ГБ, тройная 12Мп+LiDAR', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 12 Pro Max', 'iPhone 12 Pro Max', '6.7" Super Retina XDR, A14, 6/128-512ГБ, тройная 12Мп+LiDAR', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 13', 'iPhone 13', '6.1" Super Retina XDR, A15, 4/128-512ГБ, 12+12Мп, 5G', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 13 mini', 'iPhone 13 mini', '5.4" Super Retina XDR, A15, 4/128-512ГБ, 12+12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 13 Pro', 'iPhone 13 Pro', '6.1" ProMotion 120Гц, A15, 6/128ГБ-1ТБ, тройная 12Мп+LiDAR', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 13 Pro Max', 'iPhone 13 Pro Max', '6.7" ProMotion 120Гц, A15, 6/128ГБ-1ТБ, тройная 12Мп+LiDAR', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 14', 'iPhone 14', '6.1" Super Retina XDR, A15, 6/128-512ГБ, 12+12Мп, 5G', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 14 Plus', 'iPhone 14 Plus', '6.7" Super Retina XDR, A15, 6/128-512ГБ, 12+12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 14 Pro', 'iPhone 14 Pro', '6.1" ProMotion+Dynamic Island, A16, 6/128ГБ-1ТБ, 48+12+12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 14 Pro Max', 'iPhone 14 Pro Max', '6.7" ProMotion+Dynamic Island, A16, 6/128ГБ-1ТБ, 48+12+12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 15', 'iPhone 15', '6.1" Super Retina XDR, A16, 6/128-512ГБ, 48+12Мп, USB-C', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 15 Plus', 'iPhone 15 Plus', '6.7" Super Retina XDR, A16, 6/128-512ГБ, 48+12Мп, USB-C', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 15 Pro', 'iPhone 15 Pro', '6.1" ProMotion+Titanium, A17 Pro, 8/128ГБ-1ТБ, 48+12+12Мп', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone 15 Pro Max', 'iPhone 15 Pro Max', '6.7" ProMotion+Titanium, A17 Pro, 8/256ГБ-1ТБ, 48+12+12Мп 5x', TRUE, 100),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone X', 'iPhone X', '5.8" Super Retina, A11, 3/64-256ГБ, 12+12Мп, Face ID', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone XR', 'iPhone XR', '6.1" Liquid Retina, A12, 3/64-256ГБ, 12Мп, Face ID', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone XS', 'iPhone XS', '5.8" Super Retina, A12, 4/64-512ГБ, 12+12Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone XS Max', 'iPhone XS Max', '6.5" Super Retina, A12, 4/64-512ГБ, 12+12Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone SE 2020', 'iPhone SE 2020', '4.7" Retina HD, A13, 3/64-256ГБ, 12Мп, Touch ID', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Apple', 'iPhone SE 2022', 'iPhone SE 2022', '4.7" Retina HD, A15, 4/64-256ГБ, 12Мп, Touch ID', TRUE, 50),

-- Samsung Galaxy
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy S20', 'Galaxy S20', '6.2" Dynamic AMOLED 120Гц, Exynos 990, 8/128ГБ, 12+64+12Мп', TRUE, 80),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy S21', 'Galaxy S21', '6.2" Dynamic AMOLED 120Гц, Exynos 2100, 8/128-256ГБ, 12+64+12Мп', TRUE, 80),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy S22', 'Galaxy S22', '6.1" Dynamic AMOLED 120Гц, Snapdragon 8 Gen 1, 8/128-256ГБ, 50+10+12Мп', TRUE, 80),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy S23', 'Galaxy S23', '6.1" Dynamic AMOLED 120Гц, Snapdragon 8 Gen 2, 8/128-512ГБ, 50+10+12Мп', TRUE, 80),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy S23 Ultra', 'Galaxy S23 Ultra', '6.8" QHD+ AMOLED 120Гц, SD 8 Gen 2, 12/256ГБ-1ТБ, 200Мп+10+12+10, S Pen', TRUE, 80),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A52', 'Galaxy A52', '6.5" Super AMOLED 90Гц, SD 720G, 6/128-256ГБ, 64+12+5+5Мп', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A53', 'Galaxy A53', '6.5" Super AMOLED 120Гц, Exynos 1280, 6/128-256ГБ, 64+12+5+5Мп', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A54', 'Galaxy A54', '6.4" Super AMOLED 120Гц, Exynos 1380, 8/128-256ГБ, 50+12+5Мп', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A12', 'Galaxy A12', '6.5" PLS LCD, Helio P35, 4/64-128ГБ, 48+5+2+2Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A13', 'Galaxy A13', '6.6" PLS LCD, Exynos 850, 4/64-128ГБ, 50+5+2+2Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy A14', 'Galaxy A14', '6.6" PLS LCD 90Гц, Helio G80, 4/64-128ГБ, 50+5+2Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy Note 20', 'Galaxy Note 20', '6.7" Super AMOLED, SD 865+, 8/256ГБ, 12+64+12Мп, S Pen', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy Note 20 Ultra', 'Galaxy Note 20 Ultra', '6.9" Dynamic AMOLED 120Гц, SD 865+, 12/256-512ГБ, 108+12+12Мп, S Pen', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy Z Flip 4', 'Galaxy Z Flip 4', '6.7" Dynamic AMOLED 120Гц складной, SD 8+ Gen 1, 8/128-512ГБ, 12+12Мп', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Samsung', 'Galaxy Z Fold 4', 'Galaxy Z Fold 4', '7.6" Dynamic AMOLED 120Гц складной, SD 8+ Gen 1, 12/256ГБ-1ТБ, 50+12+10Мп', TRUE, 40),

-- Xiaomi / Redmi
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi 9', 'Redmi 9', '6.53" IPS, Helio G80, 3-4/32-128ГБ, 13+8+5+2Мп, 5020мАч', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi 10', 'Redmi 10', '6.5" IPS 90Гц, Helio G88, 4/64-128ГБ, 50+8+2+2Мп, 5000мАч', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi 12', 'Redmi 12', '6.79" IPS 90Гц, Helio G88, 4-8/128-256ГБ, 50+8+2Мп, 5000мАч', TRUE, 60),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 8', 'Redmi Note 8', '6.3" IPS, SD 665, 4/64-128ГБ, 48+8+2+2Мп, 4000мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 9', 'Redmi Note 9', '6.53" IPS, Helio G85, 3-4/64-128ГБ, 48+8+2+2Мп, 5020мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 10', 'Redmi Note 10', '6.43" AMOLED, SD 678, 4/64-128ГБ, 48+8+2+2Мп, 5000мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 11', 'Redmi Note 11', '6.43" AMOLED 90Гц, SD 680, 4/64-128ГБ, 50+8+2+2Мп, 5000мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 12', 'Redmi Note 12', '6.67" AMOLED 120Гц, SD 685, 4/64-256ГБ, 50+8+2Мп, 5000мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 12 Pro', 'Redmi Note 12 Pro', '6.67" AMOLED 120Гц, Dimensity 1080, 6-8/128-256ГБ, 50+8+2Мп', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Redmi Note 13', 'Redmi Note 13', '6.67" AMOLED 120Гц, SD 685, 6-8/128-256ГБ, 108+8+2Мп, 5000мАч', TRUE, 70),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Mi 11', 'Mi 11', '6.81" AMOLED 120Гц, SD 888, 8/128-256ГБ, 108+13+5Мп, 4600мАч', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'Mi 11 Lite', 'Mi 11 Lite', '6.55" AMOLED 90Гц, SD 732G, 6/64-128ГБ, 64+8+5Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', '12', 'Xiaomi 12', '6.28" AMOLED 120Гц, SD 8 Gen 1, 8/128-256ГБ, 50+13+5Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', '13', 'Xiaomi 13', '6.36" AMOLED 120Гц, SD 8 Gen 2, 8/128-256ГБ, 50+10+12Мп', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', '13 Pro', 'Xiaomi 13 Pro', '6.73" AMOLED 120Гц QHD+, SD 8 Gen 2, 12/256ГБ, 50+50+50Мп Leica', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'POCO X3', 'POCO X3', '6.67" IPS 120Гц, SD 732G, 6/64-128ГБ, 64+13+2+2Мп, 5160мАч', TRUE, 50),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Xiaomi', 'POCO X5 Pro', 'POCO X5 Pro', '6.67" AMOLED 120Гц, SD 778G, 6-8/128-256ГБ, 108+8+2Мп', TRUE, 50),

-- Realme
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', 'C25', 'Realme C25', '6.5" IPS, Helio G70, 4/64-128ГБ, 13+2+2Мп, 6000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', 'C35', 'Realme C35', '6.6" IPS 90Гц, Unisoc T616, 4/64-128ГБ, 50+2+0.3Мп, 5000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', '8', 'Realme 8', '6.4" AMOLED, Helio G95, 4-6/64-128ГБ, 64+8+2+2Мп, 5000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', '9', 'Realme 9', '6.4" AMOLED 90Гц, SD 680, 6-8/128ГБ, 108+8+2Мп, 5000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', '10', 'Realme 10', '6.4" AMOLED 90Гц, Helio G99, 8/128-256ГБ, 50+2Мп, 5000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Realme', 'GT Master', 'Realme GT Master', '6.43" AMOLED 120Гц, SD 778G, 6-8/128-256ГБ, 64+8+2Мп', TRUE, 40),

-- Honor
((SELECT id FROM sl_categories WHERE slug='phones'), 'Honor', '50', 'Honor 50', '6.57" AMOLED 120Гц, SD 778G, 6-8/128-256ГБ, 108+8+2+2Мп', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Honor', 'X8', 'Honor X8', '6.7" IPS 90Гц, SD 680, 6/128ГБ, 64+5+2+2Мп, 4000мАч', TRUE, 40),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Honor', 'X9', 'Honor X9', '6.81" IPS 120Гц, SD 680, 8/128ГБ, 48+2+2Мп, 5100мАч', TRUE, 40),

-- Tecno
((SELECT id FROM sl_categories WHERE slug='phones'), 'Tecno', 'POVA 5', 'Tecno POVA 5', '6.78" IPS 120Гц, Helio G99, 8/128-256ГБ, 50+0.08Мп, 6000мАч', TRUE, 30),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Tecno', 'CAMON 20', 'Tecno CAMON 20', '6.67" AMOLED 120Гц, Helio G85, 8/256ГБ, 64+2+0.08Мп', TRUE, 30),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Tecno', 'SPARK 10', 'Tecno SPARK 10', '6.6" IPS 90Гц, Helio G88, 4-8/128-256ГБ, 50+0.08Мп', TRUE, 30),

-- Infinix
((SELECT id FROM sl_categories WHERE slug='phones'), 'Infinix', 'HOT 30', 'Infinix HOT 30', '6.78" IPS 90Гц, Helio G88, 4-8/128-256ГБ, 50+0.08Мп, 5000мАч', TRUE, 30),
((SELECT id FROM sl_categories WHERE slug='phones'), 'Infinix', 'NOTE 30', 'Infinix NOTE 30', '6.78" AMOLED 120Гц, Helio G99, 8/128-256ГБ, 108+2+0.08Мп', TRUE, 30);
