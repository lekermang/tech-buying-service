-- Деактивируем iPhone 11/12/13/14
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'iPhone 11/12/13/14';

INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, region, availability, price, has_photo, sim_type, is_active) VALUES
-- iPhone 11
('iPhone 11/12/13/14', 'Apple', 'iPhone 11', 'Black', '64GB', 'EU', 'on_order', 30100, true, 'nanoSIM+eSIM', true),

-- iPhone 12
('iPhone 11/12/13/14', 'Apple', 'iPhone 12', 'Blue', '128GB', 'EU', 'on_order', 45800, false, 'nanoSIM+eSIM', true),

-- iPhone 13
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Midnight', '128GB', 'EU', 'on_order', 41100, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Blue', '128GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Pink', '128GB', 'EU', 'on_order', 43000, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Blue', '256GB', 'EU', 'on_order', 48800, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Midnight', '256GB', 'EU', 'on_order', 48800, false, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Blue', '512GB', 'EU', 'on_order', 55100, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 13', 'Starlight', '512GB', 'EU', 'on_order', 56200, false, 'nanoSIM+eSIM', true),

-- iPhone 14
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Midnight', '128GB', 'EU', 'on_order', 48400, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Blue', '128GB', 'EU', 'on_order', 44000, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Purple', '128GB', 'EU', 'on_order', 46900, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Starlight', '128GB', 'EU', 'on_order', 45000, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Yellow', '128GB', 'EU', 'on_order', 42400, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Midnight', '256GB', 'EU', 'on_order', 48700, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Starlight', '256GB', 'EU', 'on_order', 49100, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Purple', '512GB', 'EU', 'on_order', 49900, false, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Starlight', '512GB', 'EU', 'on_order', 49900, false, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Blue', '512GB', 'EU', 'on_order', 49900, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Midnight', '512GB', 'EU', 'on_order', 49900, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14', 'Red', '512GB', 'EU', 'on_order', 52500, true, 'nanoSIM+eSIM', true),

-- iPhone 14 Plus
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Starlight', '128GB', 'EU', 'on_order', 45300, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Blue', '128GB', 'EU', 'on_order', 45300, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Purple', '128GB', 'EU', 'on_order', 45300, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Yellow', '128GB', 'EU', 'on_order', 46000, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Yellow', '128GB', 'CN', 'on_order', 46000, true, 'nanoSIM+nanoSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Starlight', '512GB', 'EU', 'on_order', 51900, false, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Yellow', '512GB', 'CN', 'on_order', 50900, false, 'nanoSIM+nanoSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Yellow', '512GB', 'US', 'on_order', 49100, false, 'eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Blue', '512GB', 'EU', 'on_order', 55500, true, 'nanoSIM+eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Plus', 'Purple', '512GB', 'EU', 'on_order', 60800, false, 'nanoSIM+eSIM', true),

-- iPhone 14 Pro / Pro Max
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Pro', 'Black', '256GB', 'US', 'on_order', 65600, false, 'eSIM', true),
('iPhone 11/12/13/14', 'Apple', 'iPhone 14 Pro Max', 'Purple', '128GB', 'EU', 'on_order', 74300, false, 'nanoSIM+eSIM', true);
