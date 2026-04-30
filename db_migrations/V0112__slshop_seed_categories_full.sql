-- Очищаем старые базовые категории и грузим полное дерево из ТЗ.
-- Используем UPSERT по name. Сначала родители (depth=0), потом дети (depth=1, depth=2)

-- depth=0: корневые
INSERT INTO slshop_categories (name, slug, icon, depth, sort_order) VALUES
  ('Ювелирные изделия','jewelry','Gem',0,10),
  ('Часы','watches_root','Watch',0,20),
  ('Телефоны','phones_root','Smartphone',0,30),
  ('Автотранспорт','vehicles','Car',0,40),
  ('Для автомобиля','for_car','CarFront',0,50),
  ('Компьютеры','computers','Computer',0,60),
  ('Ноутбуки и нетбуки','laptops_root','Laptop',0,70),
  ('Товары для компьютера','pc_goods','Keyboard',0,80),
  ('Комплектующие','pc_parts','Cpu',0,90),
  ('Планшеты и электронные книги','tablets_root','Tablet',0,100),
  ('Аудиотехника','audio_root','Headphones',0,110),
  ('ТВ и видеотехника','tv_root','Tv',0,120),
  ('Видеокамеры','camcorders_root','Video',0,130),
  ('Фототехника','photo_root','Camera',0,140),
  ('Техника для дома','home_tech','House',0,150),
  ('Бытовая техника для индивидуального ухода','personal_care','User',0,160),
  ('Техника для кухни','kitchen','UtensilsCrossed',0,170),
  ('Инструмент','tools_root','Wrench',0,180),
  ('Антиквариат и коллекционирование','antique_root','Crown',0,190),
  ('Спорт, туризм и отдых','sport','Bike',0,200),
  ('Одежда, изделия из кожи и меха','clothes','Shirt',0,210),
  ('Музыкальные инструменты','music_instruments','Music',0,220),
  ('Нарды, шахматы, настольные игры','board_games','Dices',0,230),
  ('Для детей','kids','Baby',0,240),
  ('Прочее','misc','Package',0,250),
  ('Без категории','no_cat','Package',0,260),
  ('Испарители','vapes','Cloud',0,270),
  ('Мебель','furniture_root','Sofa',0,280),
  ('Мобильные аксесуары','mob_acc','Cable',0,290),
  ('Ремонт мобильной техники','mob_repair','Wrench',0,300)
ON CONFLICT (name) DO NOTHING;

-- depth=1: подкатегории
-- Ювелирные изделия
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, i, 1, (SELECT id FROM slshop_categories WHERE name='Ювелирные изделия'), 100
FROM (VALUES
  ('Кольца','rings','Circle'),
  ('Цепи','chains','Link'),
  ('Браслеты','bracelets','Watch'),
  ('Серьги','earrings','Asterisk'),
  ('Подвески, кресты и кулоны','pendants','Cross'),
  ('Броши, зажимы, булавки','brooches','Pin'),
  ('Бусы','beads','Circle'),
  ('Запонки, пуговицы','cufflinks','Square'),
  ('Ожерелья и колье','necklaces','Sparkles'),
  ('Пирсинг','piercing','Circle'),
  ('Столовые приборы','cutlery','Utensils'),
  ('Сувениры','souvenirs','Gift'),
  ('Украшения для волос','hair_acc','Sparkles')
) v(n,s,i)
ON CONFLICT (name) DO NOTHING;

-- Часы (раздел украшений и общий)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Watch', 1, (SELECT id FROM slshop_categories WHERE name='Часы' AND depth=0), 100
FROM (VALUES
  ('Для интерьера','watch_interior'),
  ('Наручные или карманные','watch_wrist'),
  ('Смарт-часы или браслет','watch_smart')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Телефоны
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, i, 1, (SELECT id FROM slshop_categories WHERE name='Телефоны'), 100
FROM (VALUES
  ('Techno Spark','techno_spark','Smartphone'),
  ('Мобильные телефоны','mob_phones','Smartphone'),
  ('Модемы и роутеры','modems','Wifi'),
  ('Рации','radios','Radio')
) v(n,s,i)
ON CONFLICT (name) DO NOTHING;

-- Автотранспорт
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, i, 1, (SELECT id FROM slshop_categories WHERE name='Автотранспорт'), 100
FROM (VALUES
  ('Автомобили','cars','Car'),
  ('Мотоциклы и мопеды','motorcycles','Bike'),
  ('Снегоходы и квадроциклы','snowmobiles','Mountain'),
  ('Водный транспорт','watercraft','Sailboat'),
  ('Спецтехника и прочий транспорт','special_vehicles','Truck')
) v(n,s,i)
ON CONFLICT (name) DO NOTHING;

-- Для автомобиля
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Cog', 1, (SELECT id FROM slshop_categories WHERE name='Для автомобиля'), 100
FROM (VALUES
  ('Автомагнитолы','car_radio'),
  ('Автомобильная акустика','car_audio'),
  ('Автомобильные усилители','car_amp'),
  ('Видеорегистраторы','dvr'),
  ('Навигаторы','navi'),
  ('Радар-детекторы','radar'),
  ('Шины, диски и колеса','tires'),
  ('Автокомпрессоры','compressors'),
  ('Комплектующие и аксессуары','car_acc')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Компьютеры
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Computer', 1, (SELECT id FROM slshop_categories WHERE name='Компьютеры'), 100
FROM (VALUES
  ('Моноблоки','allinone'),
  ('Системные блоки','sysblocks')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Ноутбуки и нетбуки → бренды
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Laptop', 1, (SELECT id FROM slshop_categories WHERE name='Ноутбуки и нетбуки'), 100
FROM (VALUES
  ('Acer','laptop_acer'),
  ('Apple','laptop_apple'),
  ('ASUS','laptop_asus'),
  ('Compaq','laptop_compaq'),
  ('Dell','laptop_dell'),
  ('Fujitsu','laptop_fujitsu'),
  ('HP','laptop_hp'),
  ('Lenovo','laptop_lenovo'),
  ('MSI','laptop_msi'),
  ('Microsoft','laptop_microsoft'),
  ('Samsung','laptop_samsung'),
  ('Sony','laptop_sony'),
  ('Toshiba','laptop_toshiba'),
  ('Packard Bell','laptop_packard'),
  ('Другие марки','laptop_other')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Товары для компьютера
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Keyboard', 1, (SELECT id FROM slshop_categories WHERE name='Товары для компьютера'), 100
FROM (VALUES
  ('Мониторы','monitors'),
  ('Принтеры, сканеры, копиры','printers'),
  ('Клавиатуры и мыши','kbdmouse'),
  ('Акустика','pc_acoustic'),
  ('Веб-камеры','webcams'),
  ('Джойстики и рули','joysticks'),
  ('Переносные жесткие диски','ext_hdd'),
  ('Сетевое оборудование','network'),
  ('ИБП, сетевые фильтры','ups')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Комплектующие
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Cpu', 1, (SELECT id FROM slshop_categories WHERE name='Комплектующие'), 100
FROM (VALUES
  ('CD, DVD и Blu-ray приводы','optical'),
  ('Блоки питания','psu'),
  ('Видеокарты','gpu'),
  ('Жёсткие диски','hdd'),
  ('Звуковые карты','sound_cards'),
  ('Контроллеры','controllers'),
  ('Корпусы','cases'),
  ('Материнские платы','mb'),
  ('Оперативная память','ram'),
  ('Процессоры','cpu'),
  ('Системы охлаждения','cooling')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Планшеты и электронные книги
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Tablet', 1, (SELECT id FROM slshop_categories WHERE name='Планшеты и электронные книги'), 100
FROM (VALUES
  ('Планшеты','tablets'),
  ('Электронные книги','ebooks')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Аудиотехника
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Headphones', 1, (SELECT id FROM slshop_categories WHERE name='Аудиотехника'), 100
FROM (VALUES
  ('Музыкальные центры и магнитолы','music_centers'),
  ('Акустика, колонки, сабвуферы','speakers'),
  ('Усилители, ресиверы и приемники','receivers'),
  ('MP-3 плееры','mp3'),
  ('Радиоприемники','radio_recv'),
  ('Наушники','headphones')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- ТВ и видеотехника
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Tv', 1, (SELECT id FROM slshop_categories WHERE name='ТВ и видеотехника'), 100
FROM (VALUES
  ('Телевизоры и проекторы','tv_proj'),
  ('Видеоплееры и AV-ресиверы','video_players'),
  ('Домашние кинотеатры','home_theater'),
  ('Игровые приставки','consoles'),
  ('Игры для приставок','console_games'),
  ('Игры для компьютера','pc_games'),
  ('Спутниковое ТВ','satellite_tv')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Фототехника
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Camera', 1, (SELECT id FROM slshop_categories WHERE name='Фототехника'), 100
FROM (VALUES
  ('Компактные фотоаппараты','compact_cam'),
  ('Зеркальные фотоаппараты','dslr'),
  ('Бинокли и телескопы','binoculars'),
  ('Объективы','lenses'),
  ('Оборудование и аксессуары','photo_acc')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Техника для дома
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'House', 1, (SELECT id FROM slshop_categories WHERE name='Техника для дома'), 100
FROM (VALUES
  ('Стиральные машины','washers'),
  ('Пылесосы','vacuums'),
  ('Утюги','irons'),
  ('Швейные машины и оверлоки','sewing'),
  ('Кондиционеры и вентиляторы','airconditioners'),
  ('Увлажнители, очистители и мойки воздуха','humidifiers'),
  ('Обогреватели','heaters'),
  ('Прочая техника для дома','other_home')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Бытовая техника для индивидуального ухода
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'User', 1, (SELECT id FROM slshop_categories WHERE name='Бытовая техника для индивидуального ухода'), 100
FROM (VALUES
  ('Бритвы и триммеры','shavers'),
  ('Машинки для стрижки','clippers'),
  ('Фены и приборы для укладки','hairdryers'),
  ('Эпиляторы','epilators')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Техника для кухни
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'UtensilsCrossed', 1, (SELECT id FROM slshop_categories WHERE name='Техника для кухни'), 100
FROM (VALUES
  ('Микроволновые печи','microwave'),
  ('Плиты','stoves'),
  ('Холодильники и морозильные камеры','fridges'),
  ('Электрочайники','kettles'),
  ('Соковыжималки','juicers'),
  ('Миксеры, блендеры и чопперы','mixers'),
  ('Прочая кухонная техника','other_kitchen'),
  ('Мультиварки и пароварки','multicookers')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Инструмент
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Wrench', 1, (SELECT id FROM slshop_categories WHERE name='Инструмент'), 100
FROM (VALUES
  ('Дрели и шуруповерты','drills'),
  ('Перфораторы и отбойные молотки','hammers'),
  ('Сварочное оборудование','welding'),
  ('Генераторы и компрессоры','generators'),
  ('Лобзики','jigsaws'),
  ('Пилы','saws'),
  ('Плиткорезы','tilecutters'),
  ('Пневмоинструмент','pneumatic'),
  ('Болгарки и шлифмашинки','grinders'),
  ('Лазерные уровни, дальномеры','laser_levels'),
  ('Мелкий ручной инструмент','hand_tools'),
  ('Запчасти и расходники','tool_parts')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Антиквариат и коллекционирование
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Crown', 1, (SELECT id FROM slshop_categories WHERE name='Антиквариат и коллекционирование'), 100
FROM (VALUES
  ('Монеты','coins'),
  ('Банкноты','banknotes'),
  ('Иконы','icons'),
  ('Фарфор','porcelain'),
  ('Гжель','gzhel'),
  ('Жетоны, медали, значки','medals'),
  ('Столовое серебро','silverware'),
  ('Книги','books'),
  ('Картины','paintings'),
  ('Мебель','antique_furniture'),
  ('Военные вещи','military'),
  ('Коллекционное оружие','collect_arms'),
  ('Самовары','samovars'),
  ('Подстаканники','cup_holders'),
  ('Прочий антиквариат','other_antique')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Спорт, туризм и отдых
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Bike', 1, (SELECT id FROM slshop_categories WHERE name='Спорт, туризм и отдых'), 100
FROM (VALUES
  ('Велосипеды и самокаты','bikes'),
  ('Для охоты, рыбалки и туризма','hunting'),
  ('Спортивный инвентарь','sport_inv'),
  ('Оружие','weapons')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Одежда
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Shirt', 1, (SELECT id FROM slshop_categories WHERE name='Одежда, изделия из кожи и меха'), 100
FROM (VALUES
  ('Аксессуары','clothes_acc'),
  ('Женская одежда','women_clothes'),
  ('Мужская одежда','men_clothes')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Для детей
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Baby', 1, (SELECT id FROM slshop_categories WHERE name='Для детей'), 100
FROM (VALUES
  ('Игрушки','toys'),
  ('Коляски','strollers'),
  ('Детская одежда для девочек','girls_clothes'),
  ('Детская одежда для мальчиков','boys_clothes')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Подкатегории Пылесосов (depth=2)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Wind', 2, (SELECT id FROM slshop_categories WHERE name='Пылесосы'), 100
FROM (VALUES
  ('Вертикальные','vac_vert'),
  ('Напольные','vac_floor'),
  ('Пароочистители','vac_steam'),
  ('Ручные','vac_hand'),
  ('Строительные','vac_build')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Подкатегории «Телевизоры и проекторы»
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Tv', 2, (SELECT id FROM slshop_categories WHERE name='Телевизоры и проекторы'), 100
FROM (VALUES
  ('Другое','tv_other'),
  ('Проекторы','projectors'),
  ('Телевизоры','televisions')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Женская одежда (depth=2)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Shirt', 2, (SELECT id FROM slshop_categories WHERE name='Женская одежда'), 100
FROM (VALUES
  ('Брюки','w_pants'),
  ('Верхняя одежда','w_outerwear'),
  ('Джинсы','w_jeans'),
  ('Другое','w_other'),
  ('Купальники','w_swim'),
  ('Нижнее бельё','w_underwear'),
  ('Обувь','w_shoes'),
  ('Пиджаки и костюмы','w_suits'),
  ('Платья и юбки','w_dresses'),
  ('Рубашки и блузки','w_shirts'),
  ('Свадебные платья','w_wedding'),
  ('Топы и футболки','w_tops'),
  ('Трикотаж','w_knit'),
  ('Шубы','w_furs')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Мужская одежда (depth=2)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Shirt', 2, (SELECT id FROM slshop_categories WHERE name='Мужская одежда'), 100
FROM (VALUES
  ('Брюки','m_pants'),
  ('Верхняя одежда','m_outerwear'),
  ('Джинсы','m_jeans'),
  ('Другое','m_other'),
  ('Обувь','m_shoes'),
  ('Пиджаки и костюмы','m_suits'),
  ('Рубашки','m_shirts'),
  ('Трикотаж и футболки','m_knit'),
  ('Шубы','m_furs')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Детская одежда для девочек (depth=2)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Baby', 2, (SELECT id FROM slshop_categories WHERE name='Детская одежда для девочек'), 100
FROM (VALUES
  ('Брюки','g_pants'),
  ('Верхняя одежда','g_outerwear'),
  ('Другое','g_other'),
  ('Комбинезоны и боди','g_overalls'),
  ('Обувь','g_shoes'),
  ('Пижамы','g_pj'),
  ('Платья и юбки','g_dresses'),
  ('Трикотаж','g_knit'),
  ('Шапки, варежки, шарфы','g_hats')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Детская одежда для мальчиков (depth=2)
INSERT INTO slshop_categories (name, slug, icon, depth, parent_id, sort_order)
SELECT n, s, 'Baby', 2, (SELECT id FROM slshop_categories WHERE name='Детская одежда для мальчиков'), 100
FROM (VALUES
  ('Брюки','b_pants'),
  ('Верхняя одежда','b_outerwear'),
  ('Другое','b_other'),
  ('Комбинезоны и боди','b_overalls'),
  ('Обувь','b_shoes'),
  ('Пижамы','b_pj'),
  ('Трикотаж','b_knit'),
  ('Шапки, варежки, шарфы','b_hats')
) v(n,s)
ON CONFLICT (name) DO NOTHING;

-- Заполним path для категорий
UPDATE slshop_categories c SET path = COALESCE((SELECT p.name FROM slshop_categories p WHERE p.id = c.parent_id), '') || ' / ' || c.name WHERE c.parent_id IS NOT NULL;
UPDATE slshop_categories SET path = name WHERE parent_id IS NULL;
