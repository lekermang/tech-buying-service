export type SmsTemplate = {
  id: string;
  title: string;
  icon: string;
  category: "marketing" | "repair" | "loyalty" | "info";
  text: string;
};

/**
 * Шаблоны SMS-рассылки для Скупка24.
 * Поддерживают плейсхолдеры:
 *   {name} — имя клиента (если есть)
 *   {phone1}, {phone2} — телефоны магазина
 */
export const SMS_TEMPLATES: SmsTemplate[] = [
  // ── Маркетинг / акции ───────────────────────────────────────────────────────
  {
    id: "promo_iphone",
    title: "Акция iPhone",
    icon: "Smartphone",
    category: "marketing",
    text: "Скупка24: повышенная цена за iPhone до конца недели! Оценка 15 минут, деньги сразу. Кирова 11. Тел: +7 992 999-03-33",
  },
  {
    id: "promo_macbook",
    title: "Акция MacBook",
    icon: "Laptop",
    category: "marketing",
    text: "Скупка24: купим ваш MacBook дороже всех в Калуге! Бесплатная диагностика. Кирова 7/47. Звоните: +7 992 999-03-33",
  },
  {
    id: "promo_gold",
    title: "Скупка золота",
    icon: "Coins",
    category: "marketing",
    text: "Скупка24: лучший курс на золото в Калуге сегодня! Оценка бесплатно. Ул. Кирова 11, работаем 24/7. Тел: +7 992 999-03-33",
  },
  {
    id: "promo_weekend",
    title: "Акция выходного",
    icon: "Sparkles",
    category: "marketing",
    text: "Скупка24: только в эти выходные +10% к оценке вашей техники! iPhone, MacBook, золото. Звоните: +7 992 999-03-33",
  },
  {
    id: "promo_general",
    title: "Общая акция",
    icon: "Tag",
    category: "marketing",
    text: "Скупка24: купим вашу технику дороже всех в Калуге. Оценка 15 минут, деньги в день обращения. +7 992 999-03-33",
  },

  // ── Ремонт ──────────────────────────────────────────────────────────────────
  {
    id: "repair_ready",
    title: "Ремонт готов",
    icon: "Wrench",
    category: "repair",
    text: "Скупка24: ваш ремонт готов! Можно забрать в любое время. Кирова 11, работаем 24/7. Тел: +7 992 999-03-33",
  },
  {
    id: "repair_parts_arrived",
    title: "Запчасть пришла",
    icon: "Package",
    category: "repair",
    text: "Скупка24: запчасть для вашего устройства пришла, начинаем ремонт. Сообщим, когда будет готово. +7 992 999-03-33",
  },
  {
    id: "repair_diagnosis",
    title: "Бесплатная диагностика",
    icon: "Stethoscope",
    category: "repair",
    text: "Скупка24: бесплатная диагностика любой техники. Скажем точную причину поломки и стоимость ремонта. +7 992 999-03-33",
  },

  // ── Программа лояльности ────────────────────────────────────────────────────
  {
    id: "loyalty_birthday",
    title: "Поздравление + скидка",
    icon: "Gift",
    category: "loyalty",
    text: "Скупка24 поздравляет вас с днём рождения! Дарим +5% к цене за вашу технику в эту неделю. +7 992 999-03-33",
  },
  {
    id: "loyalty_invite",
    title: "Приглашение в кабинет",
    icon: "Star",
    category: "loyalty",
    text: "Скупка24: зарегистрируйтесь на сайте и получите личную скидку до 10%! https://skypka24.com/cabinet",
  },
  {
    id: "loyalty_thanks",
    title: "Благодарность",
    icon: "Heart",
    category: "loyalty",
    text: "Спасибо, что выбрали Скупка24! Расскажите друзьям — за каждого приведённого клиента +500₽ бонус. +7 992 999-03-33",
  },

  // ── Информационные ──────────────────────────────────────────────────────────
  {
    id: "info_24_7",
    title: "Работаем 24/7",
    icon: "Clock",
    category: "info",
    text: "Скупка24: работаем круглосуточно без выходных. Кирова 11 и Кирова 7/47, Калуга. Тел: +7 992 999-03-33",
  },
  {
    id: "info_new_branch",
    title: "Новый адрес",
    icon: "MapPin",
    category: "info",
    text: "Скупка24: открылся новый офис на Кирова 7/47! Удобный график, бесплатная парковка. +7 992 999-03-33",
  },
];

export const SMS_CATEGORIES: { k: SmsTemplate["category"]; l: string; icon: string; color: string }[] = [
  { k: "marketing", l: "Акции",      icon: "Tag",       color: "text-[#FFD700]" },
  { k: "repair",    l: "Ремонт",     icon: "Wrench",    color: "text-green-400" },
  { k: "loyalty",   l: "Лояльность", icon: "Star",      color: "text-pink-400" },
  { k: "info",      l: "Информация", icon: "Info",      color: "text-blue-400" },
];

/** Подставляет переменные в шаблон. Сейчас — фиксированные телефоны. */
export function renderTemplate(text: string): string {
  return text
    .replace(/\{phone1\}/g, "+7 992 999-03-33")
    .replace(/\{phone2\}/g, "8 800 600-68-33");
}
