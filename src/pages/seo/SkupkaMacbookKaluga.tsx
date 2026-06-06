/**
 * /skupka-macbook-kaluga — SEO-страница скупки MacBook в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Скупка24 — Скупка MacBook в Калуге",
    "description": "Выкуп MacBook Air и Pro всех годов в Калуге. Оценка 15 минут, честная цена.",
    "url": "https://skypka24.com/skupka-macbook-kaluga",
    "telephone": "+79929990333",
    "openingHours": "Mo-Su 00:00-24:00",
    "address": { "@type": "PostalAddress", "addressLocality": "Калуга", "streetAddress": "ул. Кирова, 11", "addressCountry": "RU" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Скупка MacBook в Калуге",
    "description": "Выкуп MacBook Air M1/M2/M3 и MacBook Pro всех поколений. Честная оценка по рыночным ценам.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "35000", "highPrice": "115000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли MacBook без зарядки?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем MacBook без оригинальной зарядки. Отсутствие зарядки незначительно влияет на итоговую цену." } },
      { "@type": "Question", "name": "Принимаете ли старые MacBook на Intel?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем MacBook на процессорах Intel выпуска 2016-2020 годов. Цены на Intel-модели ниже, чем на M-серию, но мы всегда предложим справедливую стоимость." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Скупка MacBook в Калуге — дорого, оценка за 15 мин | Скупка24",
  description: "Продайте MacBook в Калуге выгодно. MacBook Air, MacBook Pro всех годов. Честная оценка, деньги сразу. Кирова 11 и 7/47. ☎ +7 (992) 999-03-33",
  keywords: "скупка MacBook Калуга, продать MacBook Калуга, выкуп MacBook Air Pro, сдать ноутбук Apple Калуга",
  url: "https://skypka24.com/skupka-macbook-kaluga",
  schema: SCHEMA,
  badge: "Скупка MacBook · Калуга · 24/7",
  h1: "Скупка MacBook в Калуге — купим Air и Pro дорого",
  heroText: "Продайте MacBook выгодно и быстро. Принимаем MacBook Air и MacBook Pro всех годов выпуска — M1, M2, M3, Intel. Оценка занимает 15 минут, деньги получаете сразу.",
  heroSubText: "Также принимаем iPhone, iPad, Apple Watch и другую технику Apple. Покупаем золото и украшения.",
  priceTableTitle: "Сколько стоит продать MacBook в Калуге — таблица цен",
  priceTableNote: "Цены ориентировочные. На итоговую стоимость влияют: состояние корпуса, экрана, батарея, объём SSD и оперативной памяти. Бесплатная оценка за 15 минут.",
  priceRows: [
    { model: "MacBook Air 13 M1 (2020) 256GB",  price: "от 35 000 ₽" },
    { model: "MacBook Air 13 M1 (2020) 512GB",  price: "от 42 000 ₽" },
    { model: "MacBook Air 13 M2 (2022) 256GB",  price: "от 50 000 ₽" },
    { model: "MacBook Air 13 M2 (2022) 512GB",  price: "от 60 000 ₽" },
    { model: "MacBook Air 15 M2 (2023) 256GB",  price: "от 58 000 ₽" },
    { model: "MacBook Pro 13 M1 (2020) 256GB",  price: "от 45 000 ₽" },
    { model: "MacBook Pro 14 M1 Pro (2021)",     price: "от 70 000 ₽" },
    { model: "MacBook Pro 14 M3 Pro (2023)",     price: "от 95 000 ₽" },
    { model: "MacBook Pro 16 M1 Pro (2021)",     price: "от 80 000 ₽" },
    { model: "MacBook Pro 16 M3 Pro (2023)",     price: "от 115 000 ₽" },
  ],
  advantages: [
    { icon: "Cpu",         title: "Знаем MacBook изнутри",   desc: "Мастера проверяют количество циклов батареи, состояние матрицы, чипа и SSD." },
    { icon: "Banknote",    title: "Честная рыночная цена",   desc: "Сравниваем с актуальными ценами на Авито и предлагаем справедливую стоимость." },
    { icon: "Clock",       title: "15 минут на оценку",      desc: "Диагностика ноутбука Apple занимает от 10 до 20 минут." },
    { icon: "FileCheck",   title: "Договор купли-продажи",   desc: "Каждая сделка оформляется официально — полная юридическая защита." },
    { icon: "Wallet",      title: "Оплата любым способом",   desc: "Наличные, перевод на карту Сбербанк, Тинькофф, ВТБ или СБП." },
    { icon: "Calendar",    title: "Работаем 24/7",           desc: "Оба офиса в центре Калуги открыты круглосуточно, без праздников." },
  ],
  steps: [
    { n: "01", icon: "PhoneCall",  title: "Обращение",    desc: "Позвоните или приходите в офис без записи." },
    { n: "02", icon: "Cpu",        title: "Диагностика",  desc: "Проверяем батарею, экран, корпус и чип." },
    { n: "03", icon: "DollarSign", title: "Цена",         desc: "Называем точную сумму — вы решаете." },
    { n: "04", icon: "Banknote",   title: "Выплата",      desc: "Деньги получаете сразу после подписания договора." },
  ],
  formCategory: "Скупка MacBook",
  formDataTrack: "cta_macbook_page",
  reviews: [
    { name: "Ольга В.", date: "18 мая 2026", text: "Продала MacBook Air M1 за 38 000 — искала сама на Авито, предлагали 34-36. Здесь быстро, без торга и с договором." },
    { name: "Дмитрий С.", date: "7 апреля 2026", text: "MacBook Pro 14 M1 Pro — дали 72 000. Пришёл в 11 вечера, всё оформили за 20 минут. Работают по-настоящему 24/7." },
    { name: "Алина Р.", date: "22 февраля 2026", text: "Сдавала MacBook с битым экраном. Думала цену сильно скинут, но дали 28 000 за Air M2 — вполне достойно." },
  ],
  faq: [
    { q: "Принимаете ли MacBook без зарядки?", a: "Да, принимаем MacBook без оригинальной зарядки. Отсутствие зарядки незначительно влияет на итоговую цену." },
    { q: "Что делать если MacBook не включается?", a: "Всё равно приносите или звоните — мастер бесплатно диагностирует проблему. Если ремонт нецелесообразен, выкупим неисправный MacBook по сниженной цене." },
    { q: "Принимаете ли с заменённой батареей?", a: "Да, принимаем MacBook с неоригинальной батареей. Мы проверим реальную ёмкость и количество циклов — это влияет на оценку." },
    { q: "Как узнать модель своего MacBook?", a: "Нажмите логотип Apple в левом верхнем углу → «Об этом Mac». Там указана модель, год выпуска, процессор и объём памяти — всё что нужно для предварительной оценки." },
    { q: "Принимаете ли старые MacBook на Intel?", a: "Да, принимаем MacBook на процессорах Intel выпуска 2016-2020 годов. Цены на Intel-модели ниже, чем на M-серию, но мы всегда предложим справедливую стоимость." },
    { q: "Сколько времени занимает сделка целиком?", a: "От приезда до получения денег обычно 20-30 минут: 15 минут диагностика + 5-10 минут оформление договора и выплата." },
  ],
  related: [
    { href: "/skupka-iphone-kaluga",     icon: "Smartphone", title: "Скупка iPhone",    desc: "Все модели от iPhone 6s до 17 Pro." },
    { href: "/skupka-noutbukov-kaluga",  icon: "Monitor",    title: "Скупка ноутбуков", desc: "Lenovo, Asus, HP, Dell — любые марки." },
    { href: "/skupka-zolota-kaluga",     icon: "Gem",        title: "Скупка золота",    desc: "Украшения, монеты, слитки по актуальной цене." },
  ],
  breadcrumbLabel: "Скупка MacBook в Калуге",
};

export default function SkupkaMacbookKaluga() {
  return <SeoPageLayout config={config} />;
}
