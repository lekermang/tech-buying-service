-- Деактивируем все записи iPhone 16
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'iPhone 16/e/+/PRO/MAX';

-- iPhone 16e (EU)
INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, region, availability, price, has_photo, sim_type, is_active) VALUES
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16e', 'Black', '128GB', 'EU', 'in_stock', 43900, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16e', 'White', '128GB', 'EU', 'in_stock', 43900, true, 'nanoSIM+eSIM', true),

-- iPhone 16 (US)
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Black', '128GB', 'US', 'on_order', 51000, false, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Pink', '128GB', 'US', 'on_order', 50900, false, 'eSIM', true),

-- iPhone 16 (EU)
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Black', '128GB', 'EU', 'in_stock', 51400, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Ultramarine', '128GB', 'EU', 'on_order', 51200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Pink', '128GB', 'EU', 'in_stock', 52300, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Teal', '128GB', 'EU', 'on_order', 51200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'White', '128GB', 'EU', 'in_stock', 51200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Ultramarine', '256GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Pink', '256GB', 'EU', 'in_stock', 61300, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Teal', '256GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'White', '256GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Black', '256GB', 'EU', 'in_stock', NULL, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Black', '512GB', 'EU', 'on_order', 91000, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Teal', '512GB', 'EU', 'on_order', 90000, false, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'Ultramarine', '512GB', 'EU', 'on_order', 91000, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16', 'White', '512GB', 'EU', 'on_order', 91000, true, 'nanoSIM+eSIM', true),

-- iPhone 16 Plus (EU)
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Black', '128GB', 'EU', 'on_order', 62100, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Pink', '128GB', 'EU', 'on_order', 62200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Teal', '128GB', 'EU', 'on_order', 62100, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Ultramarine', '128GB', 'EU', 'on_order', 61900, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'White', '128GB', 'EU', 'on_order', 61900, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Black', '256GB', 'EU', 'on_order', 72700, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Pink', '256GB', 'EU', 'on_order', 67500, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Teal', '256GB', 'EU', 'on_order', 66800, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Ultramarine', '256GB', 'EU', 'on_order', 67800, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'White', '256GB', 'EU', 'on_order', 70700, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'White', '512GB', 'EU', 'on_order', 76600, false, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Pink', '512GB', 'EU', 'on_order', 78300, false, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Black', '512GB', 'EU', 'on_order', 75300, false, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Ultramarine', '512GB', 'EU', 'on_order', 76200, false, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Plus', 'Teal', '512GB', 'EU', 'on_order', 77300, false, 'nanoSIM+eSIM', true),

-- iPhone 16 Pro US eSIM
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'White', '256GB', 'US', 'on_order', 82700, true, 'eSIM', true),

-- iPhone 16 Pro CN 2sim
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Black', '128GB', 'CN', 'on_order', 76500, true, 'nanoSIM+nanoSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Desert', '128GB', 'CN', 'in_stock', 76100, true, 'nanoSIM+nanoSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Natural', '128GB', 'CN', 'in_stock', 76200, true, 'nanoSIM+nanoSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'White', '128GB', 'CN', 'in_stock', 72600, false, 'nanoSIM+nanoSIM', true),

-- iPhone 16 Pro EU Sim+eSIM
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Black', '128GB', 'EU', 'on_order', 98100, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Desert', '128GB', 'EU', 'on_order', 81200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Natural', '128GB', 'EU', 'on_order', 84200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Desert', '256GB', 'EU', 'on_order', 104000, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Desert', '512GB', 'EU', 'on_order', 112400, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Natural', '512GB', 'EU', 'on_order', 124600, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'Desert', '1TB', 'EU', 'on_order', 129200, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro', 'White', '1TB', 'EU', 'on_order', 106100, true, 'nanoSIM+eSIM', true),

-- iPhone 16 Pro Max US eSIM
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Black', '256GB', 'US', 'on_order', 88800, true, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Natural', '256GB', 'US', 'on_order', 90500, true, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Black', '512GB', 'US', 'on_order', 99800, true, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Natural', '512GB', 'US', 'on_order', 99800, true, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'White', '512GB', 'US', 'on_order', 100300, true, 'eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Black', '1TB', 'US', 'on_order', 119200, false, 'eSIM', true),

-- iPhone 16 Pro Max EU Sim+eSIM
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Black', '256GB', 'EU', 'on_order', 93700, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Desert', '256GB', 'EU', 'in_stock', 88900, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Natural', '256GB', 'EU', 'on_order', 93300, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Black', '512GB', 'EU', 'on_order', 121000, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Desert', '512GB', 'EU', 'on_order', 104100, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Natural', '512GB', 'EU', 'on_order', 105900, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'White', '512GB', 'EU', 'on_order', 104800, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Natural', '1TB', 'EU', 'on_order', 119500, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'White', '1TB', 'EU', 'on_order', 122000, true, 'nanoSIM+eSIM', true),
('iPhone 16/e/+/PRO/MAX', 'Apple', 'iPhone 16 Pro Max', 'Desert', '1TB', 'EU', 'on_order', 119500, true, 'nanoSIM+eSIM', true);
