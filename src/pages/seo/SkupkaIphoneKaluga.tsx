/**
 * /skupka-iphone-kaluga — SEO-страница скупки iPhone в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Скупка24 — Скупка iPhone в Калуге",
    "description": "Выкуп iPhone всех моделей в Калуге. Оценка 15 минут, выплата в день обращения.",
    "url": "https://skypka24.com/skupka-iphone-kaluga",
    "telephone": "+79929990333",
    "openingHours": "Mo-Su 00:00-24:00",
    "address": { "@type": "PostalAddress", "addressLocality": "Калуга", "streetAddress": "ул. Кирова, 11", "addressCountry": "RU" },
    "geo": { "@type": "GeoCoordinates", "latitude": 54.5293, "longitude": 36.2754 },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3460" },
    "priceRange": "₽₽₽",
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Скупка iPhone в Калуге",
    "description": "Выкуп iPhone всех моделей в Калуге. Оценка 15 минут, выплата в день обращения.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "8000", "highPrice": "65000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли iPhone с разбитым экраном?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем iPhone в любом техническом состоянии — разбитый экран, сколы, царапины, не работают кнопки. Цена будет ниже чем за идеальный аппарат, но деньги вы получите сразу." } },
      { "@type": "Question", "name": "Нужно ли сбрасывать iPhone перед сдачей?", "acceptedAnswer": { "@type": "Answer", "text": "Желательно сделать сброс до заводских настроек и выйти из iCloud самостоятельно до визита. Если не знаете как — наш мастер поможет на месте бесплатно, это займёт 5 минут." } },
      { "@type": "Question", "name": "Принимаете ли iPhone в кредите?", "acceptedAnswer": { "@type": "Answer", "text": "Нет, iPhone находящийся в кредите или залоге мы не принимаем. Принимаем только устройства которые полностью принадлежат вам." } },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": { "@type": "LocalBusiness", "name": "Скупка24" },
    "author": { "@type": "Person", "name": "Андрей К." },
    "datePublished": "2026-05-14",
    "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
    "reviewBody": "Сдал iPhone 14 Pro за 20 минут. Дали 41 000 рублей — проверил Авито, там такие же стоят от 43. Честно.",
  },
];

const config: SeoPageConfig = {
  title: "Скупка iPhone в Калуге — оценка за 15 мин | Скупка24",
  description: "Продайте iPhone в Калуге дорого. Честная оценка за 15 минут, деньги сразу. Все модели iPhone 11–17. Два офиса на Кирова. ☎ +7 (992) 999-03-33",
  keywords: "скупка iPhone Калуга, продать iPhone Калуга, выкуп iPhone, купить iPhone Калуга, сдать айфон Калуга",
  url: "https://skypka24.com/skupka-iphone-kaluga",
  schema: SCHEMA,
  badge: "Скупка iPhone · Калуга · 24/7",
  h1: "Скупка iPhone в Калуге — купим дорого и честно",
  heroText: "Продайте iPhone за 15 минут. Принимаем все модели от iPhone 6s до iPhone 17 — в любом состоянии. Два офиса в центре Калуги, работаем 24 часа 7 дней в неделю.",
  heroSubText: "Также принимаем MacBook, ноутбуки и другую технику Apple. Покупаем золото и украшения.",
  priceTableTitle: "Сколько стоит сдать iPhone в Калуге — таблица цен",
  priceTableNote: "Цены приблизительные. Точная оценка зависит от состояния, комплектации, наличия iCloud. Оценка бесплатно за 15 минут.",
  priceRows: [
    { model: "iPhone 11 64GB",       price: "от 8 000 ₽" },
    { model: "iPhone 11 128GB",      price: "от 9 500 ₽" },
    { model: "iPhone 12 64GB",       price: "от 12 000 ₽" },
    { model: "iPhone 12 128GB",      price: "от 14 000 ₽" },
    { model: "iPhone 13 128GB",      price: "от 20 000 ₽" },
    { model: "iPhone 13 Pro 128GB",  price: "от 28 000 ₽" },
    { model: "iPhone 14 128GB",      price: "от 30 000 ₽" },
    { model: "iPhone 14 Pro 128GB",  price: "от 42 000 ₽" },
    { model: "iPhone 15 128GB",      price: "от 38 000 ₽" },
    { model: "iPhone 15 Pro 128GB",  price: "от 52 000 ₽" },
    { model: "iPhone 16 128GB",      price: "от 48 000 ₽" },
    { model: "iPhone 16 Pro 128GB",  price: "от 65 000 ₽" },
  ],
  advantages: [
    { icon: "Clock",       title: "Оценка за 15 минут",      desc: "Мастер проверит экран, батарею, камеру и корпус — сразу назовём цену." },
    { icon: "Banknote",    title: "Деньги сразу",            desc: "Наличные или перевод на карту Сбербанк, Тинькофф, ВТБ — в день обращения." },
    { icon: "Award",       title: "9 лет на рынке",          desc: "Работаем с 2015 года. Более 3460 отзывов на Яндекс.Картах — рейтинг 5.0." },
    { icon: "FileCheck",   title: "Договор на каждую сделку",desc: "Юридически оформляем каждую покупку — никаких рисков для продавца." },
    { icon: "BadgeCheck",  title: "Честная рыночная цена",   desc: "Смотрим на реальные цены на Авито и предлагаем справедливую стоимость." },
    { icon: "Calendar",    title: "Работаем 24/7",           desc: "Оба офиса на Кирова 11 и Кирова 7/47 открыты круглосуточно, без выходных." },
  ],
  steps: [
    { n: "01", icon: "PhoneCall",   title: "Заявка",    desc: "Позвоните или приходите напрямую — очередей нет." },
    { n: "02", icon: "Search",      title: "Оценка",    desc: "Мастер проверяет телефон 5-15 минут." },
    { n: "03", icon: "MessageSquare", title: "Решение", desc: "Называем цену — вы соглашаетесь или уходите, без обязательств." },
    { n: "04", icon: "Banknote",    title: "Деньги",    desc: "Подписываем договор и выплачиваем сразу." },
  ],
  formCategory: "Скупка iPhone",
  formDataTrack: "cta_iphone_page",
  reviews: [
    { name: "Андрей К.", date: "14 мая 2026", text: "Сдал iPhone 14 Pro за 20 минут. Дали 41 000 рублей — проверил Авито, там такие же стоят от 43. Честно и быстро." },
    { name: "Марина Д.", date: "3 апреля 2026", text: "Сдавала iPhone 13 с разбитым экраном, думала дадут копейки. Получила 16 500 — реально хорошая цена за такое состояние." },
    { name: "Сергей П.", date: "20 марта 2026", text: "Работают действительно 24/7 — приехал в 2 ночи, всё оформили за 15 минут. Деньги наличными сразу." },
  ],
  faq: [
    { q: "Принимаете ли iPhone с разбитым экраном?", a: "Да, принимаем iPhone в любом техническом состоянии — разбитый экран, сколы, царапины, не работают кнопки. Цена будет ниже чем за идеальный аппарат, но деньги вы получите сразу." },
    { q: "Нужно ли сбрасывать iPhone перед сдачей?", a: "Желательно сделать сброс до заводских настроек и выйти из iCloud самостоятельно до визита. Если не знаете как — наш мастер поможет на месте бесплатно, это займёт 5 минут." },
    { q: "Принимаете ли iPhone в кредите?", a: "Нет, iPhone находящийся в кредите или залоге мы не принимаем. Принимаем только устройства которые полностью принадлежат вам." },
    { q: "Как быстро происходит оценка?", a: "Оценка занимает от 5 до 15 минут. Мастер проверяет экран, батарею, камеру, корпус и программную часть. После этого сразу называем цену." },
    { q: "Можно ли получить деньги на карту?", a: "Да, выплачиваем как наличными, так и переводом на карту любого банка — Сбербанк, Тинькофф, ВТБ и другие. Переводы без комиссии." },
    { q: "Работаете ли вы ночью?", a: "Да, оба офиса на Кирова 11 и Кирова 7/47 работают 24/7 без выходных и праздников. Можно приехать в любое время." },
  ],
  related: [
    { href: "/skupka-macbook-kaluga", icon: "Laptop",  title: "Скупка MacBook",   desc: "Купим MacBook Air и Pro всех поколений." },
    { href: "/skupka-noutbukov-kaluga", icon: "Monitor", title: "Скупка ноутбуков", desc: "Lenovo, Asus, HP, Dell — любые марки." },
    { href: "/remont-iphone-kaluga",  icon: "Wrench",  title: "Ремонт iPhone",   desc: "Если дешевле починить — отремонтируем." },
  ],
  breadcrumbLabel: "Скупка iPhone в Калуге",
};

export default function SkupkaIphoneKaluga() {
  return <SeoPageLayout config={config} />;
}
