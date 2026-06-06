/**
 * /skupka-xiaomi-kaluga — SEO-страница скупки Xiaomi в Калуге.
 */
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const A = "#ff6900";

const MI_ACCOUNT_BLOCK = (
  <section className="px-4 py-12" style={{ background: "#120a00" }}>
    <div className="max-w-5xl mx-auto">
      <div className="rounded-2xl p-6" style={{ background: `${A}10`, border: `1px solid ${A}30` }}>
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${A}20` }}>
            <Icon name="UserX" size={24} style={{ color: A }} />
          </div>
          <div>
            <h2 className="font-oswald font-black uppercase text-white text-xl mb-2">Разблокировка Mi Account перед продажей</h2>
            <p className="font-roboto text-white/60 text-sm leading-relaxed mb-3">
              Если на вашем Xiaomi привязан <strong className="text-white">Mi Account (аккаунт Xiaomi)</strong> и вы не можете его отключить —
              это серьёзно снижает цену выкупа. Мастер обязательно проверит аккаунт при оценке.
            </p>
            <p className="font-roboto text-white/60 text-sm leading-relaxed mb-3">
              Рекомендуем <strong className="text-white">заранее</strong> зайти в настройки Xiaomi → Аккаунт Mi → выйти из аккаунта.
              После этого сделайте сброс до заводских настроек. Так вы получите максимальную цену.
            </p>
            <p className="font-roboto text-white/40 text-xs">
              Также скупаем{" "}
              <Link to="/skupka-iphone-kaluga" className="underline" style={{ color: A }}>iPhone</Link>,{" "}
              <Link to="/skupka-samsung-kaluga" className="underline" style={{ color: A }}>Samsung</Link> и{" "}
              <Link to="/skupka-noutbukov-kaluga" className="underline" style={{ color: A }}>ноутбуки</Link>.
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
    "name": "Скупка Xiaomi в Калуге",
    "description": "Выкуп Xiaomi Redmi, POCO, Mi Series в Калуге. Честная оценка 15 минут, деньги сразу.",
    "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
    "areaServed": { "@type": "City", "name": "Калуга" },
    "offers": { "@type": "AggregateOffer", "lowPrice": "3500", "highPrice": "55000", "priceCurrency": "RUB" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли Xiaomi с привязанным Mi Account?", "acceptedAnswer": { "@type": "Answer", "text": "Принимаем, но Mi Account значительно снижает цену выкупа. Рекомендуем заранее выйти из аккаунта в настройках и сделать сброс до заводских настроек." } },
    ],
  },
];

const config: SeoPageConfig = {
  title: "Скупка Xiaomi в Калуге — Redmi, POCO, Note | Скупка24",
  description: "Продайте Xiaomi в Калуге. Redmi Note, POCO, Mi Series. Оценка 15 минут, деньги сразу. Работаем 24/7. ☎ +7 (992) 999-03-33",
  keywords: "скупка Xiaomi Калуга, продать Xiaomi Redmi Калуга, выкуп POCO Xiaomi, сдать Redmi Note Калуга",
  url: "https://skypka24.com/skupka-xiaomi-kaluga",
  schema: SCHEMA,
  accentColor: A,
  accentColor2: "#c05200",
  badge: "Скупка Xiaomi · Redmi · POCO · Калуга",
  h1: "Скупка Xiaomi в Калуге — Redmi, POCO и Mi Series",
  heroText: "Продайте Xiaomi за 15 минут по честной цене. Принимаем все серии: Redmi, Redmi Note, POCO, Xiaomi 13/14. Рабочие и с дефектами — оцениваем всё.",
  heroSubText: "Также принимаем Samsung, iPhone и другие марки смартфонов. Важно: отключите Mi Account перед визитом для максимальной цены.",
  priceTableTitle: "Скупка всех серий Xiaomi — цены в Калуге",
  priceTableNote: "Цены ориентировочные. Xiaomi с активным Mi Account оценивается ниже. Оценка бесплатно — 15 минут.",
  priceRows: [
    { model: "Redmi 12 4G",            price: "от 3 500 ₽" },
    { model: "Redmi Note 12 4G",       price: "от 5 000 ₽" },
    { model: "Redmi Note 13 4G",       price: "от 6 500 ₽" },
    { model: "Redmi Note 13 Pro 5G",   price: "от 12 000 ₽" },
    { model: "POCO X6 Pro",            price: "от 14 000 ₽" },
    { model: "POCO F5",                price: "от 16 000 ₽" },
    { model: "Xiaomi 13T",             price: "от 20 000 ₽" },
    { model: "Xiaomi 14",              price: "от 35 000 ₽" },
    { model: "Xiaomi 14 Ultra",        price: "от 55 000 ₽" },
  ],
  extraBlocks: MI_ACCOUNT_BLOCK,
  advantages: [
    { icon: "Cpu",         title: "Знаем Xiaomi",            desc: "Проверяем Mi Account, MIUI, батарею и состояние корпуса." },
    { icon: "UserCheck",   title: "Помогаем с аккаунтом",    desc: "Подскажем как выйти из Mi Account до продажи." },
    { icon: "Banknote",    title: "Деньги сразу",            desc: "Наличные или карта — прямо на месте." },
    { icon: "FileCheck",   title: "Договор купли-продажи",   desc: "Юридически оформляем каждую сделку." },
    { icon: "Award",       title: "9 лет опыта",             desc: "3460+ отзывов на Яндекс.Картах с рейтингом 5.0." },
    { icon: "Calendar",    title: "Круглосуточно 24/7",      desc: "Без выходных и праздников — в любое время." },
  ],
  steps: [
    { n: "01", icon: "LogOut",      title: "Выйдите",     desc: "Из Mi Account в настройках перед визитом." },
    { n: "02", icon: "Smartphone",  title: "Приходите",   desc: "С телефоном в любое время суток." },
    { n: "03", icon: "Search",      title: "Осмотр",      desc: "Проверяем экран, батарею, аккаунт." },
    { n: "04", icon: "Banknote",    title: "Выплата",     desc: "Договор и деньги сразу." },
  ],
  formCategory: "Скупка Xiaomi",
  formDataTrack: "cta_xiaomi_page",
  reviews: [
    { name: "Николай П.", date: "12 мая 2026", text: "Продал Xiaomi 14 Ultra — дали 54 000. Вышел из Mi Account заранее как посоветовали на сайте. Процесс занял 15 минут максимум." },
    { name: "Светлана К.", date: "29 апреля 2026", text: "POCO F5 приняли за 16 500. Немного торговалась, но мастер объяснил из чего складывается цена — всё понятно и честно." },
    { name: "Илья В.", date: "7 марта 2026", text: "Сдал Redmi Note 13 Pro с разбитым задним стеклом. Предупредили о снижении цены, но всё равно дали 10 000 — быстро и без лишних вопросов." },
  ],
  faq: [
    { q: "Принимаете ли Xiaomi с привязанным Mi Account?", a: "Принимаем, но Mi Account значительно снижает цену выкупа. Рекомендуем заранее выйти из аккаунта в настройках (Аккаунт Mi → Выйти) и сделать сброс до заводских настроек." },
    { q: "Принимаете ли Xiaomi с любыми дефектами?", a: "Да, принимаем Xiaomi с разбитым экраном, трещинами на задней панели, не работающими кнопками. Итоговая цена зависит от характера и масштаба повреждений." },
    { q: "Что лучше сдать нам — разбитый Xiaomi или сначала отремонтировать?", a: "Зависит от стоимости ремонта и модели. Если ремонт экрана стоит 2000 ₽, а разбитый телефон выкупим за 3000 ₽ вместо 7000 ₽ — выгоднее починить. Мастер поможет просчитать." },
    { q: "Принимаете ли телефоны Xiaomi для Китайского рынка?", a: "Принимаем, но цена китайских версий обычно ниже из-за другого набора частот LTE и отсутствия сертификации РКН. Уточните заранее по телефону." },
    { q: "Как узнать серийный номер Xiaomi?", a: "Зайдите в Настройки → Об устройстве → все характеристики. IMEI также указан на коробке и под лотком SIM-карты." },
    { q: "Принимаете ли Redmi 9 и старше?", a: "Да, принимаем старые модели Redmi 9, 10, Note 10/11 и другие. Цена зависит от года и состояния — от 500 до 5000 ₽ за рабочий аппарат в хорошем состоянии." },
  ],
  related: [
    { href: "/skupka-samsung-kaluga",  icon: "Monitor",    title: "Скупка Samsung",   desc: "Galaxy S, A, Z серии — дорого." },
    { href: "/skupka-iphone-kaluga",   icon: "Smartphone", title: "Скупка iPhone",    desc: "Все модели до 17 Pro Max." },
    { href: "/skupka-noutbukov-kaluga",icon: "Laptop",     title: "Скупка ноутбуков", desc: "Любые марки за 15 минут." },
  ],
  breadcrumbLabel: "Скупка Xiaomi в Калуге",
};

export default function SkupkaXiaomiKaluga() {
  return <SeoPageLayout config={config} />;
}
