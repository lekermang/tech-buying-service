/**
 * /remont-iphone-kaluga — SEO-страница ремонта iPhone в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const A = "#16a34a";
const A2 = "#15803d";

const WARRANTY_BLOCK = (
  <section className="px-4 py-12" style={{ background: "#061209" }}>
    <div className="max-w-5xl mx-auto">
      <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
        Гарантия на ремонт iPhone
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: "ShieldCheck", title: "6 месяцев гарантии", desc: "На все виды ремонта iPhone — замена экрана, батареи, разъёма и другие работы." },
          { icon: "RotateCcw",   title: "Бесплатный повторный ремонт", desc: "Если та же неисправность возникла в течение гарантийного срока — устраняем бесплатно." },
          { icon: "AlertCircle", title: "Что не входит в гарантию", desc: "Механические повреждения после ремонта, попадание воды, самостоятельный разбор телефона." },
        ].map((i, idx) => (
          <div key={idx} className="rounded-xl p-5 flex gap-3" style={{ background: `${A}10`, border: `1px solid ${A}25` }}>
            <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${A}20` }}>
              <Icon name={i.icon as Parameters<typeof Icon>[0]["name"]} size={18} style={{ color: "#4ade80" }} />
            </div>
            <div>
              <p className="font-roboto font-semibold text-white text-sm mb-1">{i.title}</p>
              <p className="font-roboto text-white/40 text-xs leading-relaxed">{i.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-roboto text-white/30 text-xs mt-4">
        Если ремонт нецелесообразен экономически —{" "}
        <Link to="/skupka-iphone-kaluga" className="underline text-green-400">выкупим ваш iPhone по честной цене</Link>.
        Также делаем{" "}
        <Link to="/remont-samsung-kaluga" className="underline text-green-400">ремонт Samsung Galaxy</Link>.
      </p>
    </div>
  </section>
);

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Скупка24 — Ремонт iPhone в Калуге",
    "description": "Профессиональный ремонт iPhone в Калуге. Замена экрана за 30 минут. Гарантия 6 месяцев.",
    "url": "https://skypka24.com/remont-iphone-kaluga",
    "telephone": "+79929990333",
    "openingHours": "Mo-Su 00:00-24:00",
    "address": { "@type": "PostalAddress", "addressLocality": "Калуга", "streetAddress": "ул. Кирова, 11", "addressCountry": "RU" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Ремонт iPhone в Калуге",
    "description": "Замена экрана, аккумулятора, стекла iPhone. Гарантия 6 месяцев. Оригинальные запчасти.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "1200", "highPrice": "4500", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "RepairAction",
    "name": "Ремонт iPhone в Калуге",
    "object": { "@type": "Product", "name": "Apple iPhone" },
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "result": { "@type": "Thing", "name": "Отремонтированный iPhone с гарантией 6 месяцев" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Сколько времени занимает замена экрана на iPhone?", "acceptedAnswer": { "@type": "Answer", "text": "Замена экрана iPhone занимает от 20 до 45 минут в зависимости от модели. Работа делается при вас — можете подождать в офисе." } },
      { "@type": "Question", "name": "Используете ли оригинальные запчасти для iPhone?", "acceptedAnswer": { "@type": "Answer", "text": "Используем оригинальные запчасти Apple и высококачественные совместимые аналоги. Мастер расскажет о разнице в цене и качестве перед ремонтом." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Ремонт iPhone в Калуге — замена экрана за 30 мин | Скупка24",
  description: "Ремонт iPhone в Калуге. Замена экрана, аккумулятора, стекла. Гарантия 6 месяцев. Оригинальные запчасти. ☎ +7 (992) 999-03-33",
  keywords: "ремонт iPhone Калуга, замена экрана iPhone Калуга, замена аккумулятора iPhone, разбил iPhone Калуга, срочный ремонт телефона",
  url: "https://skypka24.com/remont-iphone-kaluga",
  schema: SCHEMA,
  accentColor: A,
  accentColor2: A2,
  badge: "Ремонт iPhone · Калуга · 24/7 · Гарантия 6 мес.",
  h1: "Ремонт iPhone в Калуге — быстро, с гарантией",
  heroText: "Профессиональный ремонт iPhone любых моделей в Калуге. Замена экрана за 30 минут прямо при вас. Гарантия 6 месяцев на все виды работ. Оба офиса работают круглосуточно.",
  heroSubText: "Если ремонт нецелесообразен — выкупим ваш iPhone по честной рыночной цене. Также выполняем ремонт Samsung Galaxy.",
  priceTableTitle: "Цены на ремонт iPhone в Калуге",
  priceTableNote: "Цены указаны за работу. Стоимость запчастей уточняется у мастера — зависит от выбора оригинал/аналог.",
  priceRows: [
    { model: "Замена экрана iPhone 11",                price: "от 2 500 ₽", time: "30 мин" },
    { model: "Замена экрана iPhone 12 / 12 mini",      price: "от 3 000 ₽", time: "30 мин" },
    { model: "Замена экрана iPhone 13",                price: "от 3 500 ₽", time: "30 мин" },
    { model: "Замена экрана iPhone 14",                price: "от 4 000 ₽", time: "35 мин" },
    { model: "Замена экрана iPhone 15",                price: "от 4 500 ₽", time: "35 мин" },
    { model: "Замена аккумулятора (любая модель)",      price: "от 1 500 ₽", time: "20 мин" },
    { model: "Замена стекла (переклейка)",              price: "от 1 200 ₽", time: "40 мин" },
    { model: "Ремонт после воды",                      price: "от 2 000 ₽", time: "60 мин" },
    { model: "Замена разъёма зарядки",                 price: "от 1 800 ₽", time: "30 мин" },
    { model: "Восстановление кнопки Home / Face ID",   price: "от 2 500 ₽", time: "45 мин" },
  ],
  isRepairTable: true,
  extraBlocks: WARRANTY_BLOCK,
  advantages: [
    { icon: "Clock",       title: "Ремонт при вас — 30 мин",  desc: "Замена экрана iPhone 11-15 прямо при клиенте, без очереди." },
    { icon: "ShieldCheck", title: "Гарантия 6 месяцев",       desc: "На все виды ремонта — в гарантийный период ремонтируем бесплатно." },
    { icon: "Package",     title: "Оригинальные запчасти",    desc: "Используем детали Apple и проверенные аналоги — на выбор клиента." },
    { icon: "Search",      title: "Бесплатная диагностика",   desc: "Определим точную причину неисправности перед ремонтом." },
    { icon: "Banknote",    title: "Прозрачные цены",          desc: "Цена согласовывается до начала работ — никаких скрытых доплат." },
    { icon: "Calendar",    title: "Работаем 24/7",            desc: "Оба офиса открыты круглосуточно — починим в любое время." },
  ],
  steps: [
    { n: "01", icon: "Smartphone",  title: "Приносите iPhone", desc: "В любом состоянии — для диагностики." },
    { n: "02", icon: "Search",      title: "Диагностика",      desc: "Бесплатно определяем неисправность." },
    { n: "03", icon: "Tag",         title: "Согласование",     desc: "Называем цену, вы соглашаетесь." },
    { n: "04", icon: "Wrench",      title: "Ремонт",           desc: "30-60 минут при вас, с гарантией." },
  ],
  formCategory: "Ремонт iPhone",
  formDataTrack: "cta_iphone_repair_page",
  reviews: [
    { name: "Анна Р.", date: "16 мая 2026", text: "Разбила экран iPhone 14 в субботу вечером. Пришла в 9 вечера — сделали за 35 минут. Гарантия 6 месяцев на руках. Отличный сервис." },
    { name: "Геннадий М.", date: "3 апреля 2026", text: "Менял аккумулятор на iPhone 12 — был на 70% ёмкости. Заменили за 20 минут. Цена 1800 с оригинальной батареей — честно." },
    { name: "Вера Н.", date: "8 марта 2026", text: "iPhone 13 упал в воду. Не включался. Привезла через час — разобрали, просушили, почистили. Заработал. Цена разумная, сделали быстро." },
  ],
  faq: [
    { q: "Сколько времени занимает замена экрана на iPhone?", a: "Замена экрана iPhone занимает от 20 до 45 минут в зависимости от модели. Работа делается при вас — можете подождать в офисе." },
    { q: "Используете ли оригинальные запчасти для iPhone?", a: "Используем оригинальные запчасти Apple и высококачественные совместимые аналоги. Мастер расскажет о разнице в цене и качестве перед ремонтом — вы выбираете." },
    { q: "Можно ли сделать ремонт пока жду в офисе?", a: "Да, большинство ремонтов — замена экрана, батареи, стекла, разъёма — делаются при клиенте за 20-60 минут. Для сложных случаев может потребоваться оставить телефон." },
    { q: "Принимаете ли iPhone на ремонт без коробки?", a: "Да, коробка не нужна. Нужен только сам телефон и желательно пароль от Face ID — для проверки работоспособности после ремонта." },
    { q: "Что делать если iPhone не включается?", a: "Приносите — мастер сделает бесплатную диагностику. В большинстве случаев причину удаётся найти: разрядилась батарея, проблема после воды, программный сбой. Назовём точную стоимость ремонта." },
    { q: "Даёте ли скидку при ремонте и продаже другого телефона?", a: "Да, если вы сдаёте нам старый телефон и ремонтируете другой — обговорим дополнительную скидку. Уточните у мастера при визите." },
  ],
  related: [
    { href: "/skupka-iphone-kaluga",   icon: "Smartphone", title: "Скупка iPhone",    desc: "Если ремонт нецелесообразен — выкупим." },
    { href: "/remont-samsung-kaluga",  icon: "Wrench",     title: "Ремонт Samsung",   desc: "Galaxy S, A, Z серии с гарантией." },
    { href: "/skupka-macbook-kaluga",  icon: "Laptop",     title: "Скупка MacBook",   desc: "Air и Pro всех поколений." },
  ],
  breadcrumbLabel: "Ремонт iPhone в Калуге",
};

export default function RemontIphoneKalugaSeo() {
  return <SeoPageLayout config={config} />;
}
