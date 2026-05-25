-- Деактивируем MacBook
UPDATE t_p31606708_tech_buying_service.catalog
SET is_active = false
WHERE category = 'MacBook';

INSERT INTO t_p31606708_tech_buying_service.catalog (category, brand, model, color, storage, ram, region, availability, price, has_photo, sku, is_active) VALUES
-- Magic Mouse
('MacBook', 'Apple', 'Magic Mouse', 'Black Lightning', NULL, NULL, 'US', 'on_order', 8900, false, 'Magic Mouse 3 Black Lightning', true),
('MacBook', 'Apple', 'Magic Mouse', 'Black USB-C', NULL, NULL, 'US', 'on_order', 10400, false, NULL, true),
('MacBook', 'Apple', 'Magic Mouse', 'White USB-C', NULL, NULL, 'US', 'on_order', 8600, false, NULL, true),
('MacBook', 'Apple', 'Magic Mouse', 'White USB-C', NULL, NULL, 'US', 'in_stock', NULL, false, 'Mouse White USB-C', true),

-- MacBook Neo 13 (2026)
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Silver', '256GB', '8GB', 'US', 'on_order', 50900, false, 'MHFA4', true),
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Citrus', '256GB', '8GB', 'US', 'on_order', 52800, false, 'MHFD4', true),
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Indigo', '256GB', '8GB', 'US', 'on_order', 50700, false, 'MHFF4', true),
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Blush', '512GB', '8GB', 'US', 'on_order', 66800, false, 'MHFJ4', true),
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Citrus', '512GB', '8GB', 'US', 'on_order', 59600, false, 'MHFE4', true),
('MacBook', 'Apple', 'MacBook Neo 13 2026', 'Indigo', '512GB', '8GB', 'US', 'on_order', 59100, false, 'MHFG4', true),

-- MacBook Air M2 13 (2022)
('MacBook', 'Apple', 'MacBook Air M2 13 2022', 'Starlight', '256GB', '16GB', 'US', 'on_order', 71400, false, 'MC7W4', true),

-- MacBook Air M4 13 (2025)
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Starlight', '256GB', '16GB', 'US', 'on_order', 72200, false, 'MW0Y3', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Midnight', '256GB', '16GB', 'US', 'on_order', 81700, true, 'MW123', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Starlight', '512GB', '16GB', 'US', 'on_order', 88300, true, 'MW103', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Midnight', '512GB', '16GB', 'US', 'on_order', 88300, true, 'MW133', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Sky Blue', '512GB', '16GB', 'US', 'on_order', 87300, true, 'MC6U4', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Silver', '512GB', '16GB', 'US', 'on_order', 88300, false, 'MW0X3', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Starlight', '512GB', '24GB', 'US', 'on_order', 101700, true, 'MC6A4', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Midnight', '512GB', '24GB', 'US', 'on_order', 104900, true, 'MC6C4', true),
('MacBook', 'Apple', 'MacBook Air M4 13 2025', 'Sky Blue', '512GB', '24GB', 'US', 'on_order', 104900, true, 'MC6V4', true),

-- MacBook Air M5 13 (2026)
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Midnight', '512GB', '16GB', 'US', 'on_order', 83200, false, 'MDHE4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Sky Blue', '512GB', '16GB', 'US', 'on_order', 82700, false, 'MDHH4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Starlight', '512GB', '16GB', 'US', 'on_order', 83200, false, 'MDHA4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Sky Blue', '1TB', '16GB', 'US', 'on_order', 93900, false, 'MDHJ4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Midnight', '1TB', '16GB', 'US', 'on_order', 93900, false, 'MDHF4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Silver', '1TB', '16GB', 'US', 'on_order', 96400, false, 'MDH84', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Starlight', '1TB', '16GB', 'US', 'on_order', 94300, false, 'MDHC4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Starlight', '1TB', '24GB', 'US', 'on_order', 111200, false, 'MDHD4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Silver', '1TB', '24GB', 'US', 'on_order', 117700, false, 'MDH94', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Sky Blue', '1TB', '24GB', 'US', 'on_order', 110000, false, 'MDHK4', true),
('MacBook', 'Apple', 'MacBook Air M5 13 2026', 'Midnight', '1TB', '24GB', 'US', 'on_order', 111000, false, 'MDHG4', true),

-- MacBook Air M3 15 (2024)
('MacBook', 'Apple', 'MacBook Air M3 15 2024', 'Silver', '256GB', '8GB', 'US', 'on_order', 77600, false, 'MRYP3', true),
('MacBook', 'Apple', 'MacBook Air M3 15 2024', 'Midnight', '512GB', '16GB', 'US', 'on_order', 90200, false, 'MXD43', true),

-- MacBook Air M4 15 (2025)
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Starlight', '256GB', '16GB', 'US', 'on_order', 84200, true, 'MW1J3', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Midnight', '256GB', '16GB', 'US', 'on_order', 85600, true, 'MW1L3', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Sky Blue', '256GB', '16GB', 'US', 'on_order', 85200, false, 'MC7A4', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Starlight', '512GB', '16GB', 'US', 'on_order', 105700, true, 'MW1K3', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Midnight', '512GB', '16GB', 'US', 'on_order', 102000, true, 'MW1M3', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Silver', '512GB', '16GB', 'US', 'on_order', 102000, false, 'MW1H3', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Sky Blue', '512GB', '16GB', 'US', 'on_order', 102000, true, 'MC7C4', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Silver', '512GB', '24GB', 'US', 'on_order', 122200, false, 'MC6J4', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Starlight', '512GB', '24GB', 'US', 'on_order', 115800, true, 'MC6K4', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Midnight', '512GB', '24GB', 'US', 'on_order', 117500, true, 'MC6L4', true),
('MacBook', 'Apple', 'MacBook Air M4 15 2025', 'Sky Blue', '512GB', '24GB', 'US', 'on_order', 117600, true, 'MC7D4', true),

-- MacBook Air M5 15 (2026)
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Starlight', '512GB', '16GB', 'US', 'on_order', 100600, false, 'MDVD4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Silver', '1TB', '16GB', 'US', 'on_order', 113600, false, 'MDVA4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Sky Blue', '1TB', '16GB', 'US', 'on_order', 113600, false, 'MDVT4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Starlight', '1TB', '16GB', 'US', 'on_order', 112600, false, 'MDVE4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Midnight', '1TB', '16GB', 'US', 'on_order', 112600, false, 'MDVK4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Silver', '1TB', '24GB', 'US', 'on_order', 136000, false, 'MDVC4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Starlight', '1TB', '24GB', 'US', 'on_order', 129100, false, 'MDVF4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Sky Blue', '1TB', '24GB', 'US', 'on_order', 130900, false, 'MDVU4', true),
('MacBook', 'Apple', 'MacBook Air M5 15 2026', 'Midnight', '1TB', '24GB', 'US', 'on_order', 132900, false, 'MDVN4', true),

-- MacBook Pro 14 M4 (2024)
('MacBook', 'Apple', 'MacBook Pro 14 M4 2024', 'Space Black', '512GB', '24GB', 'US', 'on_order', 156400, false, 'MX2H3', true),

-- MacBook Pro 14 M5 (2025)
('MacBook', 'Apple', 'MacBook Pro 14 M5 2025', 'Space Black', '1TB', '16GB', 'US', 'on_order', 135800, false, 'MDE14', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 2025', 'Space Black', '1TB', '24GB', 'US', 'on_order', 149800, false, 'MDE34', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 2025', 'Silver', '1TB', '24GB', 'US', 'on_order', 149800, false, 'MDE64', true),

-- MacBook Pro 14 M5 Pro (2026)
('MacBook', 'Apple', 'MacBook Pro 14 M5 Pro 2026', 'Space Black', '1TB', '24GB', 'US', 'on_order', 168800, false, 'MGDR4', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 Pro 2026', 'Silver', '1TB', '24GB', 'US', 'on_order', 167100, false, 'MGDN4', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 Pro 2026', 'Space Black', '2TB', '24GB', 'US', 'on_order', 205800, false, 'MGDT4', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 Pro 2026', 'Silver', '2TB', '24GB', 'US', 'on_order', 214000, false, 'MJLV4', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 Pro 2026', 'Space Black', '2TB', '24GB', 'US', 'on_order', 214000, false, 'MJLW4', true),

-- MacBook Pro 14 M5 Max (2026)
('MacBook', 'Apple', 'MacBook Pro 14 M5 Max 2026', 'Silver', '2TB', '36GB', 'US', 'on_order', 281200, false, 'MGDQ4', true),
('MacBook', 'Apple', 'MacBook Pro 14 M5 Max 2026', 'Space Black', '2TB', '36GB', 'US', 'on_order', 281200, false, 'MGDU4', true),

-- MacBook Pro 16 M5 Pro (2026)
('MacBook', 'Apple', 'MacBook Pro 16 M5 Pro 2026', 'Silver', '1TB', '24GB', 'US', 'on_order', 215100, false, 'MGE44', true),
('MacBook', 'Apple', 'MacBook Pro 16 M5 Pro 2026', 'Space Black', '1TB', '24GB', 'US', 'on_order', 203800, false, 'MGEA4', true),

-- MacBook Pro 16 M5 Max (2026)
('MacBook', 'Apple', 'MacBook Pro 16 M5 Max 2026', 'Silver', '2TB', '36GB', 'US', 'on_order', 292400, false, 'MGE74', true),
('MacBook', 'Apple', 'MacBook Pro 16 M5 Max 2026', 'Silver', '2TB', '48GB', 'US', 'on_order', 348500, false, 'MGE94', true),
('MacBook', 'Apple', 'MacBook Pro 16 M5 Max 2026', 'Space Black', '2TB', '36GB', 'US', 'on_order', 297500, false, 'MGED4', true),

-- iMac 24 M4 (2024)
('MacBook', 'Apple', 'iMac 24 M4 2024', 'Blue', '256GB', '16GB', 'US', 'on_order', 149800, false, 'MWV13', true),
('MacBook', 'Apple', 'iMac 24 M4 2024', 'Green', '256GB', '16GB', 'US', 'on_order', 136500, false, 'MWUE3', true),

-- Mac mini M4 (2024)
('MacBook', 'Apple', 'Mac mini M4 2024', 'Silver', '256GB', '16GB', 'US', 'on_order', 59100, false, 'MU9D3', true);
