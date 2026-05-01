-- Расширяем поле specs_short и обогащаем встроенные шаблоны
ALTER TABLE t_p31606708_tech_buying_service.slshop_specs_templates
  ALTER COLUMN specs_short TYPE VARCHAR(200);

-- Обогащаем базовые шаблоны: добавляем процессор/АКБ/камеру/экран
UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" Liquid Retina, 4/64GB, A13 Bionic, 12+12MP, 3110mAh',
  specs_full  = 'Apple A13 Bionic (6 ядер), 6.1" Liquid Retina IPS, 4/64GB, 12+12 МП (ширик+ультраширик), фронт 12 МП, АКБ 3110 мАч, IP68'
WHERE match_key = 'iphone 11';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" Super Retina XDR OLED, 4/64GB, A14 Bionic, 5G, 12+12MP, 2815mAh',
  specs_full  = 'Apple A14 Bionic (6 ядер), 6.1" Super Retina XDR OLED, 4/64GB, 5G, 12+12 МП, MagSafe, АКБ 2815 мАч'
WHERE match_key = 'iphone 12';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" OLED, 4/128GB, A15 Bionic, 5G, 12+12MP, 3240mAh',
  specs_full  = 'Apple A15 Bionic, 6.1" Super Retina XDR OLED, 4/128GB, 5G, 12+12 МП, ночной режим, АКБ 3240 мАч'
WHERE match_key = 'iphone 13';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" OLED 60Hz, 6/128GB, A15 Bionic, 5G, 12+12MP, 3279mAh',
  specs_full  = 'Apple A15 Bionic (5-ядерный GPU), 6.1" Super Retina XDR OLED 60 Гц, 6/128GB, 5G, 12+12 МП, фотонический движок, АКБ 3279 мАч'
WHERE match_key = 'iphone 14';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" LTPO 120Hz, 6/128GB, A16 Bionic, Dynamic Island, 48+12+12MP, 3200mAh',
  specs_full  = 'Apple A16 Bionic, 6.1" LTPO Super Retina XDR 120 Гц, 6/128GB, Dynamic Island, 48+12+12 МП, Always-On, АКБ 3200 мАч'
WHERE match_key = 'iphone 14 pro';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" OLED, 6/128GB, A16 Bionic, USB-C, 48+12MP, 3349mAh',
  specs_full  = 'Apple A16 Bionic, 6.1" Super Retina XDR OLED, 6/128GB, USB-C, 48+12 МП, Dynamic Island, АКБ 3349 мАч'
WHERE match_key = 'iphone 15';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" LTPO 120Hz, 8/128GB, A17 Pro, титан, USB-C 3.0, 48+12+12MP, 3274mAh',
  specs_full  = 'Apple A17 Pro, 6.1" LTPO Super Retina XDR 120 Гц, 8/128GB, титановый корпус, USB-C 3.0, 48+12+12 МП, АКБ 3274 мАч'
WHERE match_key = 'iphone 15 pro';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.7" LTPO 120Hz, 8/256GB, A17 Pro, титан, USB-C 3.0, 48+12+12MP, 4422mAh',
  specs_full  = 'Apple A17 Pro, 6.7" LTPO Super Retina XDR 120 Гц, 8/256GB, титан, 5x оптический зум, USB-C 3.0, АКБ 4422 мАч'
WHERE match_key = 'apple iphone 15 pro max';

UPDATE t_p31606708_tech_buying_service.slshop_specs_templates SET
  specs_short = '6.1" OLED, 4/128GB, A14 Bionic, 5G, LiDAR, 12+12+12MP, 2815mAh',
  specs_full  = 'Apple A14 Bionic, 6.1" Super Retina XDR OLED, 4/128GB, 5G, LiDAR, 12+12+12 МП, MagSafe, АКБ 2815 мАч'
WHERE match_key = 'apple iphone 12 pro';

-- Универсальное обогащение: где specs_short короче 30 символов и есть specs_full — склеиваем
UPDATE t_p31606708_tech_buying_service.slshop_specs_templates
SET specs_short = LEFT(specs_short || ', ' || COALESCE(specs_full, ''), 200)
WHERE LENGTH(COALESCE(specs_short, '')) < 30
  AND specs_full IS NOT NULL
  AND LENGTH(specs_full) > 10;
