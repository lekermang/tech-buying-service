-- Деактивируем все записи iPhone 17/AIR/PRO/MAX
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'iPhone 17/AIR/PRO/MAX';

-- iPhone 17e (EU, nanoSIM+eSIM)
INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, region, availability, price, has_photo, sim_type, is_active) VALUES
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17e', 'Black', '256GB', 'EU', 'in_stock', NULL, false, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17e', 'White', '256GB', 'EU', 'in_stock', 49400, false, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17e', 'Pink', '256GB', 'EU', 'on_order', 49400, false, 'nanoSIM+eSIM', true),

-- iPhone 17 (US, eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Blue', '256GB', 'US', 'on_order', 59000, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Sage', '256GB', 'US', 'on_order', 59600, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Lavender', '256GB', 'US', 'on_order', 60200, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'White', '256GB', 'US', 'on_order', 60900, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Black', '256GB', 'US', 'on_order', 60400, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Black', '512GB', 'US', 'on_order', 75600, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'White', '512GB', 'US', 'on_order', 76600, true, 'eSIM', true),

-- iPhone 17 (EU, nanoSIM+eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Blue', '256GB', 'EU', 'in_stock', 65100, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Sage', '256GB', 'EU', 'on_order', 66600, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Lavender', '256GB', 'EU', 'in_stock', 66200, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'White', '256GB', 'EU', 'in_stock', 66100, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Black', '256GB', 'EU', 'in_stock', 66000, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Lavender', '512GB', 'EU', 'on_order', 98900, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Black', '512GB', 'EU', 'on_order', 87300, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Sage', '512GB', 'EU', 'on_order', 95000, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'Blue', '512GB', 'EU', 'on_order', 91000, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17', 'White', '512GB', 'EU', 'on_order', 97100, true, 'nanoSIM+eSIM', true),

-- iPhone AIR (US, eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Blue', '256GB', 'US', 'on_order', 69200, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Black', '256GB', 'US', 'on_order', 69500, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'White', '256GB', 'US', 'in_stock', 75800, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Gold', '256GB', 'US', 'in_stock', 70700, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Blue', '1TB', 'US', 'on_order', 82600, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Gold', '1TB', 'US', 'on_order', 93700, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'White', '1TB', 'US', 'on_order', 94000, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone Air', 'Black', '1TB', 'US', 'on_order', 101100, true, 'eSIM', true),

-- iPhone 17 Pro (US, eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '256GB', 'US', 'in_stock', 92900, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '256GB', 'US', 'in_stock', 87000, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '256GB', 'US', 'in_stock', 86800, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '512GB', 'US', 'in_stock', 107000, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '512GB', 'US', 'in_stock', 105100, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '512GB', 'US', 'in_stock', 107300, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '1TB', 'US', 'on_order', 124600, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '1TB', 'US', 'on_order', 118200, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '1TB', 'US', 'on_order', 120700, true, 'eSIM', true),

-- iPhone 17 Pro (EU, nanoSIM+eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '256GB', 'EU', 'in_stock', 102000, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '256GB', 'EU', 'in_stock', 95400, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '256GB', 'EU', 'in_stock', 99900, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '512GB', 'EU', 'in_stock', 118700, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '512GB', 'EU', 'in_stock', 114800, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '512GB', 'EU', 'in_stock', 116800, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Silver', '1TB', 'EU', 'on_order', 132900, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Orange', '1TB', 'EU', 'on_order', 128400, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro', 'Blue', '1TB', 'EU', 'on_order', 131800, true, 'nanoSIM+eSIM', true),

-- iPhone 17 Pro Max (US, eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '256GB', 'US', 'in_stock', 97100, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '256GB', 'US', 'in_stock', 94500, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '256GB', 'US', 'in_stock', 94600, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '512GB', 'US', 'in_stock', 116800, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '512GB', 'US', 'in_stock', NULL, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '512GB', 'US', 'in_stock', 116100, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '1TB', 'US', 'on_order', 129200, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '1TB', 'US', 'in_stock', 130200, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '1TB', 'US', 'on_order', 129100, true, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '2TB', 'US', 'on_order', 160500, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '2TB', 'US', 'on_order', 140400, false, 'eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '2TB', 'US', 'on_order', 143800, true, 'eSIM', true),

-- iPhone 17 Pro Max (EU, nanoSIM+eSIM)
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '256GB', 'EU', 'in_stock', 106200, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '256GB', 'EU', 'in_stock', 104200, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '256GB', 'EU', 'in_stock', 105900, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '512GB', 'EU', 'in_stock', 123800, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '512GB', 'EU', 'in_stock', 122500, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '512GB', 'EU', 'in_stock', 122800, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '1TB', 'EU', 'in_stock', 143100, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '1TB', 'EU', 'on_order', 146000, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '1TB', 'EU', 'on_order', 142100, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Silver', '2TB', 'EU', 'on_order', 166600, true, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Orange', '2TB', 'EU', 'on_order', 161200, false, 'nanoSIM+eSIM', true),
('iPhone 17/AIR/PRO/MAX', 'Apple', 'iPhone 17 Pro Max', 'Blue', '2TB', 'EU', 'on_order', 164000, true, 'nanoSIM+eSIM', true);
