/**
 * /skupka-samsung-kaluga — SEO-страница скупки Samsung в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const A = "#1565C0";

const FRP_BLOCK = (
  <section className="px-4 py-12" style={{ background: "#0a0d12" }}>
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl p-6" style={{ background: `${A}10`, border: `1px solid ${A}30` }}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${A}20` }}>
            <Icon name="ShieldCheck" size={24} style={{ color: "#60a5fa" }} />
          </div>
          <div>
            <h2 className="font-oswald font-black uppercase text-white text-xl mb-2">Снятие FRP перед продажей — помогаем бесплатно</h2>
            <p className="font-roboto text-white/60 text-sm leading-relaxed mb-3">
              Если вы забыли пароль от аккаунта Google на Samsung или не можете выйти из него —
              наш мастер поможет снять FRP-блокировку (Factory Reset Protection) прямо в офисе.
              Это <strong className="text-white">бесплатно</strong> при продаже аппарата нам.
            </p>
            <p className="font-roboto text-white/40 text-xs">
              Samsung с активным FRP-блоком ценится значительно ниже. Если снять блокировку невозможно —
              мы всё равно купим телефон, но по более низкой цене. Также покупаем{" "}
              <Link to="/skupka-iphone-kaluga" className="underline text-blue-400">iPhone</Link> и{" "}
              <Link to="/skupka-xiaomi-kaluga" className="underline text-blue-400">Xiaomi</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Скупка Samsung в Калуге",
    "description": "Выкуп Samsung Galaxy S, A, Z серии в Калуге. Честная оценка за 15 минут, деньги сразу.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "4000", "highPrice": "55000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли Samsung с разбитым экраном?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем Samsung с любыми повреждениями экрана. AMOLED матрицы дороже в замене, поэтому скидка за повреждение может быть значительнее, чем у других марок, но деньги вы получите сразу." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Скупка Samsung в Калуге — Galaxy S и A серии | Скупка24",
  description: "Продайте Samsung в Калуге. Galaxy S24, S23, A55, A35 и другие модели. Оценка 15 минут, деньги сразу. ☎ +7 (992) 999-03-33",
  keywords: "скупка Samsung Калуга, продать Samsung Galaxy Калуга, выкуп Galaxy S24 S23, сдать Samsung дорого",
  url: "https://skypka24.com/skupka-samsung-kaluga",
  schema: SCHEMA,
  accentColor: "#2563eb",
  accentColor2: "#1d4ed8",
  badge: "Скупка Samsung Galaxy · Калуга · 24/7",
  h1: "Скупка Samsung в Калуге — купим Galaxy дорого",
  heroText: "Продайте Samsung Galaxy за 15 минут. Принимаем S-серию, A-серию и складные Z Fold/Flip. Любое состояние — рабочий, с разбитым экраном, с дефектами.",
  heroSubText: "Также принимаем iPhone, Xiaomi и другие марки смартфонов. Помогаем бесплатно снять FRP при продаже аппарата.",
  priceTableTitle: "Цены на скупку Samsung Galaxy в Калуге",
  priceTableNote: "Цены ориентировочные. На стоимость влияют: состояние экрана (AMOLED), наличие FRP-блокировки, комплектация. Оценка бесплатно.",
  priceRows: [
    { model: "Samsung Galaxy A15 4G",          price: "от 4 000 ₽" },
    { model: "Samsung Galaxy A35 5G",          price: "от 10 000 ₽" },
    { model: "Samsung Galaxy A55 5G",          price: "от 14 000 ₽" },
    { model: "Samsung Galaxy S23 128GB",       price: "от 22 000 ₽" },
    { model: "Samsung Galaxy S23+ 256GB",      price: "от 30 000 ₽" },
    { model: "Samsung Galaxy S23 Ultra 256GB", price: "от 38 000 ₽" },
    { model: "Samsung Galaxy S24 128GB",       price: "от 28 000 ₽" },
    { model: "Samsung Galaxy S24+ 256GB",      price: "от 38 000 ₽" },
    { model: "Samsung Galaxy S24 Ultra 256GB", price: "от 52 000 ₽" },
    { model: "Samsung Galaxy Z Fold5",         price: "от 55 000 ₽" },
    { model: "Samsung Galaxy Z Flip5",         price: "от 28 000 ₽" },
  ],
  extraBlocks: FRP_BLOCK,
  advantages: [
    { icon: "Zap",         title: "Знаем Samsung Galaxy",    desc: "Специалисты по диагностике AMOLED-экранов и проверке FRP." },
    { icon: "ShieldCheck", title: "Снимаем FRP бесплатно",   desc: "Помогаем убрать привязку Google-аккаунта при продаже нам." },
    { icon: "Banknote",    title: "Деньги в день сдачи",     desc: "Наличные или перевод на карту прямо на месте." },
    { icon: "FileCheck",   title: "Договор на каждую сделку",desc: "Юридически оформляем каждую покупку." },
    { icon: "Award",       title: "9 лет опыта",             desc: "Более 3460 отзывов на Яндекс.Картах — рейтинг 5.0." },
    { icon: "Calendar",    title: "Работаем 24/7",           desc: "Оба офиса работают круглосуточно без выходных." },
  ],
  steps: [
    { n: "01", icon: "Smartphone",  title: "Приходите",   desc: "С Samsung Galaxy в любом состоянии." },
    { n: "02", icon: "Search",      title: "Осмотр",      desc: "Проверяем экран, батарею, FRP-статус." },
    { n: "03", icon: "Tag",         title: "Цена",        desc: "Называем сумму сразу." },
    { n: "04", icon: "Banknote",    title: "Выплата",     desc: "Договор и деньги на месте." },
  ],
  formCategory: "Скупка Samsung",
  formDataTrack: "cta_samsung_page",
  reviews: [
    { name: "Максим Т.", date: "15 мая 2026", text: "Продал S24 Ultra в идеале — дали 51 000. Сравнивал по Авито — честная цена. Всё быстро, договор на руки." },
    { name: "Елена В.", date: "2 апреля 2026", text: "Galaxy Z Fold5 выкупили за 56 000. Думала за такой экзотический телефон сильно скинут, нет — дали нормально." },
    { name: "Руслан А.", date: "18 марта 2026", text: "Не мог выйти из Google-аккаунта на Samsung A55. Мастер снял FRP прямо при мне, бесплатно, и сразу оценил телефон." },
  ],
  faq: [
    { q: "Принимаете ли Samsung с разбитым экраном?", a: "Да, принимаем Samsung с любыми повреждениями экрана. AMOLED матрицы дороже в замене, поэтому скидка за повреждение может быть значительнее, чем у других марок, но деньги вы получите сразу." },
    { q: "Что такое FRP и мешает ли он продаже?", a: "FRP (Factory Reset Protection) — защита Google-аккаунта. Если аккаунт активен, телефон стоит значительно дешевле. Мы помогаем снять FRP бесплатно при продаже нам." },
    { q: "Принимаете ли Galaxy Z Fold на ремонт?", a: "Скупаем Galaxy Z Fold и Z Flip в любом состоянии. Если вас интересует ремонт складного Samsung — обратитесь к нам, рассмотрим возможность." },
    { q: "Принимаете ли Samsung планшеты?", a: "Да, принимаем планшеты Samsung Galaxy Tab всех серий. Цена зависит от модели, года выпуска и состояния." },
    { q: "Нужна ли коробка от Samsung?", a: "Нет, коробка и аксессуары не обязательны. Желательно иметь зарядное устройство — для проверки телефона и более точной оценки." },
    { q: "Какие Samsung принимаете помимо флагманов?", a: "Принимаем все серии: A (A15, A35, A55, A75), S (S22, S23, S24), Z (Fold, Flip), Note (Note 20) и даже старые модели. Минимальная цена — 1000 ₽ за рабочий аппарат." },
  ],
  related: [
    { href: "/skupka-iphone-kaluga",   icon: "Smartphone", title: "Скупка iPhone",  desc: "Все модели от iPhone 6s до 17." },
    { href: "/skupka-xiaomi-kaluga",   icon: "Cpu",        title: "Скупка Xiaomi",  desc: "Redmi, POCO, Xiaomi 14 серия." },
    { href: "/remont-samsung-kaluga",  icon: "Wrench",     title: "Ремонт Samsung", desc: "Замена экрана, батареи, стекла." },
  ],
  breadcrumbLabel: "Скупка Samsung в Калуге",
};

export default function SkupkaSamsungKaluga() {
  return <SeoPageLayout config={config} />;
}
