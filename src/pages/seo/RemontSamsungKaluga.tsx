/**
 * /remont-samsung-kaluga — SEO-страница ремонта Samsung в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const A = "#1e40af";
const A2 = "#1d4ed8";

const AMOLED_BLOCK = (
  <section className="px-4 py-12" style={{ background: "#060d1a" }}>
    <div className="max-w-5xl mx-auto">
      <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
        Замена экрана Samsung — AMOLED и LCD
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: `${A}12`, border: `1px solid ${A}30` }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Monitor" size={18} style={{ color: "#60a5fa" }} />
            <span className="font-oswald font-bold text-white uppercase text-sm">Оригинальный AMOLED</span>
          </div>
          <p className="font-roboto text-white/60 text-sm leading-relaxed">
            Samsung использует собственные <strong className="text-white">AMOLED матрицы</strong> в моделях S и A-серии.
            Оригинальный экран сохраняет все функции: работу под стеклом (отпечаток пальца),
            максимальную яркость до 2600 нит, точную цветопередачу и поддержку Always-On Display.
          </p>
          <p className="font-roboto text-white/40 text-xs mt-2">Дороже, но сохраняет полный функционал телефона.</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Layers" size={18} className="text-white/40" />
            <span className="font-oswald font-bold text-white/60 uppercase text-sm">Аналоговый экран</span>
          </div>
          <p className="font-roboto text-white/60 text-sm leading-relaxed">
            Аналоговые экраны дешевле на <strong className="text-white">30-40%</strong>, но могут отличаться
            по качеству цветопередачи, максимальной яркости и отзывчивости тачскрина.
            Некоторые функции (Always-On Display) могут не работать.
          </p>
          <p className="font-roboto text-white/40 text-xs mt-2">Дешевле, но с возможными ограничениями функционала.</p>
        </div>
      </div>
      <p className="font-roboto text-white/30 text-xs mt-4">
        Если ремонт экономически нецелесообразен —{" "}
        <Link to="/skupka-samsung-kaluga" className="underline text-blue-400">выкупим ваш Samsung по честной цене</Link>.
        Также делаем{" "}
        <Link to="/remont-iphone-kaluga" className="underline text-blue-400">ремонт iPhone</Link>.
      </p>
    </div>
  </section>
);

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Скупка24 — Ремонт Samsung в Калуге",
    "description": "Профессиональный ремонт Samsung Galaxy в Калуге. Замена экрана, аккумулятора. Гарантия 6 месяцев.",
    "url": "https://skypka24.com/remont-samsung-kaluga",
    "telephone": "+79929990333",
    "openingHours": "Mo-Su 00:00-24:00",
    "address": { "@type": "PostalAddress", "addressLocality": "Калуга", "streetAddress": "ул. Кирова, 11", "addressCountry": "RU" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Ремонт Samsung Galaxy в Калуге",
    "description": "Замена AMOLED экрана, аккумулятора, стекла. Снятие FRP. Ремонт Galaxy Z Fold. Гарантия 6 месяцев.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "800", "highPrice": "15000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "RepairAction",
    "name": "Ремонт Samsung Galaxy в Калуге",
    "object": { "@type": "Product", "name": "Samsung Galaxy" },
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "result": { "@type": "Thing", "name": "Отремонтированный Samsung Galaxy с гарантией 6 месяцев" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли Samsung Galaxy Z Fold на ремонт?", "acceptedAnswer": { "@type": "Answer", "text": "Да, ремонтируем складные Samsung Galaxy Z Fold и Z Flip. Это сложные устройства, ремонт занимает больше времени и стоит дороже." } },
      { "@type": "Question", "name": "Сколько стоит замена стекла без замены экрана на Samsung?", "acceptedAnswer": { "@type": "Answer", "text": "Замена только стекла (переклейка) на Samsung стоит от 1000 ₽ и занимает 40 минут. Это дешевле чем замена экрана целиком, но подходит только если матрица не повреждена." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Ремонт Samsung в Калуге — Galaxy S, A, Note | Скупка24",
  description: "Ремонт Samsung Galaxy в Калуге. Замена экрана, аккумулятора, стекла. Гарантия 6 мес. Оригинальные запчасти. ☎ +7 (992) 999-03-33",
  keywords: "ремонт Samsung Калуга, замена экрана Samsung Galaxy Калуга, ремонт Galaxy S24 S23, снятие FRP Samsung",
  url: "https://skypka24.com/remont-samsung-kaluga",
  schema: SCHEMA,
  accentColor: "#2563eb",
  accentColor2: A2,
  badge: "Ремонт Samsung · Калуга · 24/7 · Гарантия 6 мес.",
  h1: "Ремонт Samsung в Калуге — Galaxy S, A и Note серии",
  heroText: "Профессиональный ремонт Samsung Galaxy в Калуге. Замена AMOLED экрана, аккумулятора, стекла. Снятие FRP/Google-аккаунта. Гарантия 6 месяцев. Работаем круглосуточно.",
  heroSubText: "Если ремонт нецелесообразен — выкупим Samsung по честной цене. Также выполняем ремонт iPhone и других марок.",
  priceTableTitle: "Цены на ремонт Samsung в Калуге",
  priceTableNote: "Цены за работу. Стоимость запчастей зависит от выбора оригинал AMOLED / аналог. Уточняйте у мастера.",
  priceRows: [
    { model: "Замена экрана Galaxy A15 / A25",      price: "от 2 000 ₽",  time: "30 мин" },
    { model: "Замена экрана Galaxy A35 / A55",      price: "от 2 800 ₽",  time: "35 мин" },
    { model: "Замена экрана Galaxy S23",            price: "от 5 000 ₽",  time: "45 мин" },
    { model: "Замена экрана Galaxy S24",            price: "от 6 000 ₽",  time: "45 мин" },
    { model: "Замена экрана Galaxy S24 Ultra",      price: "от 9 000 ₽",  time: "60 мин" },
    { model: "Замена экрана Galaxy Z Fold5",        price: "от 15 000 ₽", time: "90 мин" },
    { model: "Замена аккумулятора (S / A серия)",   price: "от 1 500 ₽",  time: "25 мин" },
    { model: "Замена стекла (переклейка)",          price: "от 1 000 ₽",  time: "40 мин" },
    { model: "Снятие FRP / Google-аккаунта",       price: "от 800 ₽",    time: "20 мин" },
    { model: "Ремонт после воды",                  price: "от 2 000 ₽",  time: "60 мин" },
  ],
  isRepairTable: true,
  extraBlocks: AMOLED_BLOCK,
  advantages: [
    { icon: "Monitor",     title: "Специалисты по AMOLED",   desc: "Знаем особенности Samsung-матриц и правила их замены." },
    { icon: "ShieldCheck", title: "Гарантия 6 месяцев",      desc: "На все работы с Samsung — в гарантийный период бесплатно." },
    { icon: "UserX",       title: "Снимаем FRP",             desc: "Удаляем Google-аккаунт с Samsung за 20 минут." },
    { icon: "Clock",       title: "Быстро при вас",          desc: "Большинство ремонтов — 30-60 минут без ожидания." },
    { icon: "Package",     title: "Оригинальные запчасти",   desc: "AMOLED оригинал или качественный аналог — на выбор." },
    { icon: "Calendar",    title: "Работаем 24/7",           desc: "Оба офиса в Калуге работают круглосуточно." },
  ],
  steps: [
    { n: "01", icon: "Smartphone",  title: "Приносите",     desc: "Samsung в любом состоянии." },
    { n: "02", icon: "Search",      title: "Диагностика",   desc: "Бесплатно определяем неисправность." },
    { n: "03", icon: "Layers",      title: "Выбор запчасти",desc: "Оригинал или аналог — вы решаете." },
    { n: "04", icon: "Wrench",      title: "Ремонт",        desc: "При вас, с гарантией 6 месяцев." },
  ],
  formCategory: "Ремонт Samsung",
  formDataTrack: "cta_samsung_repair_page",
  reviews: [
    { name: "Павел И.", date: "14 мая 2026", text: "Разбил Galaxy S24 — заменили экран за 40 минут. Взял оригинальный AMOLED — разницы с новым не заметил. Гарантия на 6 месяцев." },
    { name: "Надежда О.", date: "1 апреля 2026", text: "Снимали FRP с Samsung A55 — забыла пароль от Google. Сделали за 15 минут прямо при мне. Отдельно спасибо за то, что всё объясняли." },
    { name: "Тимур Б.", date: "22 февраля 2026", text: "Galaxy Z Fold4 — не работал шарнир и экран пошёл трещинами. Взялись за сложный ремонт, сделали за 2 дня. Теперь всё ок." },
  ],
  faq: [
    { q: "Принимаете ли Samsung со сломанным шлейфом?", a: "Да, диагностируем и ремонтируем любые внутренние неисправности Samsung Galaxy, включая проблемы с шлейфами. Уточните модель по телефону." },
    { q: "Сколько стоит замена стекла без замены экрана?", a: "Замена только стекла (переклейка) стоит от 1000 ₽ и занимает 40 минут. Подходит только если матрица не повреждена — нет полос, засветок, битых пикселей." },
    { q: "Что дешевле — отремонтировать Samsung или купить новый?", a: "Зависит от модели. Замена экрана Galaxy A35 стоит 2800 ₽, новый A35 — от 20 000 ₽. Для флагманов S24 Ultra ситуация похожа: ремонт экрана 9000 ₽ против нового телефона за 100 000+. Ремонт выгоднее в большинстве случаев." },
    { q: "Помогаете ли восстановить данные с Samsung?", a: "В рамках ремонта стараемся сохранить данные. Если телефон не включается — можем попробовать извлечь данные отдельно. Уточняйте возможность у мастера." },
    { q: "Принимаете ли Galaxy Z Fold на ремонт?", a: "Да, ремонтируем складные Galaxy Z Fold и Z Flip. Это сложные устройства — ремонт занимает больше времени и стоит дороже, но мы беремся." },
    { q: "Есть ли скидка постоянным клиентам?", a: "Да, постоянным клиентам предоставляем скидку 5-10% на повторный ремонт или при ремонте нескольких устройств одновременно." },
  ],
  related: [
    { href: "/skupka-samsung-kaluga",  icon: "Monitor",    title: "Скупка Samsung",   desc: "Если ремонт нецелесообразен — выкупим." },
    { href: "/remont-iphone-kaluga",   icon: "Wrench",     title: "Ремонт iPhone",    desc: "Замена экрана за 30 минут с гарантией." },
    { href: "/skupka-iphone-kaluga",   icon: "Smartphone", title: "Скупка iPhone",    desc: "Все модели до iPhone 17 Pro Max." },
  ],
  breadcrumbLabel: "Ремонт Samsung в Калуге",
};

export default function RemontSamsungKaluga() {
  return <SeoPageLayout config={config} />;
}
