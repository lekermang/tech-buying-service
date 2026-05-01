-- Заполняем реквизиты ИП Мамедов Адиль Мирза Оглы для всех записей
UPDATE t_p31606708_tech_buying_service.slshop_requisites SET
  legal_name = 'Индивидуальный предприниматель Мамедов Адиль Мирза Оглы',
  short_name = 'ИП Мамедов А.М.О.',
  inn = '402810962699',
  ogrn = '307402814200032',
  director_name = 'Мамедов Адиль Мирза Оглы',
  director_position = 'Индивидуальный предприниматель',
  signatory_name = 'Мамедов Адиль Мирза Оглы',
  updated_at = NOW();
