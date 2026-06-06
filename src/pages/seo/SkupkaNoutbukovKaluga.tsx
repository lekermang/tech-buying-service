/**
 * /skupka-noutbukov-kaluga — SEO-страница скупки ноутбуков в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import { Link } from "react-router-dom";

const A = "#FF6B1A";

const COMPARE_BLOCK = (
  <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
    <div className="max-w-5xl mx-auto">
      <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
        Сравнение: сдать нам vs продать на Авито
      </h2>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${A}20` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: `${A}15` }}>
              <th className="font-oswald font-bold text-left px-4 py-3 text-xs uppercase tracking-wide text-white/60"></th>
              <th className="font-oswald font-bold text-center px-4 py-3 text-xs uppercase tracking-wide" style={{ color: A }}>Скупка24</th>
              <th className="font-oswald font-bold text-center px-4 py-3 text-xs uppercase tracking-wide text-white/60">Авито</th>
            </tr>
          </thead>
          <tbody>
            {[
              { param: "Скорость",    us: "15 минут",      them: "1–4 недели" },
              { param: "Безопасность", us: "Договор",       them: "Риск мошенников" },
              { param: "Торг",        us: "Нет",            them: "Постоянный" },
              { param: "Выплата",     us: "Сразу",          them: "После встречи" },
              { param: "Усилия",      us: "Минимум",        them: "Фото, звонки, встречи" },
            ].map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <td className="font-roboto font-semibold text-white/60 px-4 py-3">{r.param}</td>
                <td className="font-roboto font-bold text-center px-4 py-3" style={{ color: A }}>{r.us}</td>
                <td className="font-roboto text-center text-white/40 px-4 py-3">{r.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-roboto text-white/35 text-xs mt-3">
        Если хотите продать ноутбук на Авито — это ваш выбор. Но если нужны деньги сегодня без лишних хлопот —{" "}
        <Link to="/skupka-iphone-kaluga" className="underline" style={{ color: A }}>мы также скупаем iPhone</Link> и{" "}
        <Link to="/skupka-macbook-kaluga" className="underline" style={{ color: A }}>MacBook</Link>.
      </p>
    </div>
  </section>
);

const SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Скупка ноутбуков в Калуге",
    "description": "Выкуп ноутбуков любых марок в Калуге: Lenovo, Asus, HP, Dell, Acer, Samsung. Оценка 15 минут.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "2000", "highPrice": "55000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли неработающие ноутбуки?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем неисправные ноутбуки. Мастер оценит степень поломки — цена будет ниже, но вы всё равно получите деньги." } },
      { "@type": "Question", "name": "Какие документы нужны для сдачи ноутбука?", "acceptedAnswer": { "@type": "Answer", "text": "Нужен только паспорт для оформления договора. Коробка, диски и гарантийные документы не обязательны." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Скупка ноутбуков в Калуге — любые марки | Скупка24",
  description: "Продайте ноутбук в Калуге. Lenovo, Asus, HP, Dell, Acer и другие. Оценка 15 минут, деньги сразу. Работаем 24/7. ☎ +7 (992) 999-03-33",
  keywords: "скупка ноутбуков Калуга, продать ноутбук Калуга, выкуп ноутбука Lenovo Asus HP Dell, сдать ноутбук дорого",
  url: "https://skypka24.com/skupka-noutbukov-kaluga",
  schema: SCHEMA,
  badge: "Скупка ноутбуков · Калуга · 24/7",
  h1: "Скупка ноутбуков в Калуге — купим любую марку",
  heroText: "Продайте ноутбук за 15 минут и получите деньги сразу. Принимаем Lenovo, Asus, HP, Dell, Acer, Samsung и другие марки. Игровые ноутбуки, бизнес-ноутбуки, ультрабуки — любые.",
  heroSubText: "Также принимаем MacBook Apple. Если ноутбук сломан — всё равно приходите, мастер оценит. Покупаем золото и украшения.",
  priceTableTitle: "Цены на скупку ноутбуков в Калуге",
  priceTableNote: "Цены ориентировочные — зависят от состояния, комплектации и конкретной модели. Точная цена после бесплатного осмотра.",
  priceRows: [
    { model: "Ноутбук до 2018 года, любая марка",       price: "от 2 000 ₽" },
    { model: "Ноутбук 2019-2021, Core i3 / Ryzen 3",    price: "от 6 000 ₽" },
    { model: "Ноутбук 2019-2021, Core i5 / Ryzen 5",    price: "от 10 000 ₽" },
    { model: "Ноутбук 2022-2024, Core i5 / Ryzen 5",    price: "от 18 000 ₽" },
    { model: "Ноутбук 2022-2024, Core i7 / Ryzen 7",    price: "от 28 000 ₽" },
    { model: "Игровой ноутбук с RTX 3060",               price: "от 35 000 ₽" },
    { model: "Игровой ноутбук с RTX 4060",               price: "от 55 000 ₽" },
    { model: "Lenovo ThinkPad бизнес-серия",             price: "от 12 000 ₽" },
  ],
  extraBlocks: COMPARE_BLOCK,
  advantages: [
    { icon: "Search",      title: "Оценим любой ноутбук",    desc: "Рабочий или нет, с любыми дефектами, без зарядки и коробки." },
    { icon: "Banknote",    title: "Деньги в день сдачи",     desc: "Наличные или перевод — прямо на месте после оформления." },
    { icon: "Shield",      title: "Официальный договор",     desc: "Полная юридическая защита — мы покупаем законно." },
    { icon: "Award",       title: "Опыт 9 лет",              desc: "Специалисты разбираются в любых моделях и конфигурациях." },
    { icon: "Clock",       title: "Быстро — 15 минут",       desc: "Без долгих переговоров и торга — цена сразу." },
    { icon: "Calendar",    title: "Круглосуточно",            desc: "Работаем 24 часа в сутки, 7 дней в неделю." },
  ],
  steps: [
    { n: "01", icon: "Laptop",     title: "Приходите",   desc: "С ноутбуком в офис — без записи." },
    { n: "02", icon: "Search",     title: "Осмотр",      desc: "Проверяем железо, экран, батарею." },
    { n: "03", icon: "Tag",        title: "Цена",        desc: "Озвучиваем сумму — вы решаете." },
    { n: "04", icon: "Banknote",   title: "Деньги",      desc: "Договор и оплата сразу." },
  ],
  formCategory: "Скупка ноутбуков",
  formDataTrack: "cta_noutbuk_page",
  reviews: [
    { name: "Кирилл М.", date: "10 мая 2026", text: "Сдал старый Lenovo ThinkPad 2019. Думал дадут тысяч пять, дали 13 500 — приятная неожиданность. Деньги переводом на карту мгновенно." },
    { name: "Ирина Л.", date: "29 марта 2026", text: "Продала игровой Asus с RTX 3060. Предложили 37 000 — на Авито висел 3 недели за 40 и никто не брал. Продала за 20 минут." },
    { name: "Антон Г.", date: "5 февраля 2026", text: "Неисправный HP — не включался. Мастер диагностировал бесплатно, предложили 4 000. Согласился — всё равно лежал бы пылился." },
  ],
  faq: [
    { q: "Принимаете ли неисправные ноутбуки?", a: "Да, принимаем неисправные ноутбуки. Мастер оценит степень поломки — цена будет ниже чем за рабочий, но вы всё равно получите деньги." },
    { q: "Нужна ли коробка от ноутбука?", a: "Нет, коробка, зарядка и документы не обязательны. Желательно принести зарядку — это позволит проверить ноутбук в рабочем режиме и дать более точную оценку." },
    { q: "Принимаете ли Chromebook?", a: "Принимаем, но Chromebook оценивается ниже чем аналогичный Windows-ноутбук из-за ограниченной функциональности системы." },
    { q: "Как оценивается состояние ноутбука?", a: "Мастер проверяет: работоспособность, состояние экрана (битые пиксели, засветки), клавиатуру и тачпад, батарею (реальная ёмкость), температуры процессора и видеокарты. Всё это влияет на итоговую цену." },
    { q: "Можно ли предварительно узнать цену по фото?", a: "Можно прислать фото и характеристики нам на WhatsApp — дадим предварительную оценку. Точная цена только после осмотра в офисе." },
    { q: "Какие документы нужны?", a: "Только паспорт для оформления договора купли-продажи. Это требование закона — без него мы не можем провести сделку." },
  ],
  related: [
    { href: "/skupka-macbook-kaluga",  icon: "Laptop",     title: "Скупка MacBook",  desc: "MacBook Air и Pro всех поколений." },
    { href: "/skupka-iphone-kaluga",   icon: "Smartphone", title: "Скупка iPhone",   desc: "Все модели до iPhone 17 Pro Max." },
    { href: "/skupka-zolota-kaluga",   icon: "Gem",        title: "Скупка золота",   desc: "Украшения по актуальной цене." },
  ],
  breadcrumbLabel: "Скупка ноутбуков в Калуге",
};

export default function SkupkaNoutbukovKaluga() {
  return <SeoPageLayout config={config} />;
}
