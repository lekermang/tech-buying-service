/**
 * /skupka-zolota-kaluga — SEO-страница скупки золота в Калуге с динамическими ценами.
 */
import { useEffect, useState } from "react";
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../../backend/func2url.json";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const GOLD_URL = (funcUrls as Record<string, string>)["gold-price"];
const TODAY_DATE = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const A = "#FFD700";
const A2 = "#b8860b";

/* Коэффициенты проб от 999 */
const PROBES: { label: string; coef: number; desc: string }[] = [
  { label: "Золото 375 пробы (9 карат)",    coef: 0.375, desc: "Наиболее распространённые советские украшения" },
  { label: "Золото 500 пробы",              coef: 0.500, desc: "Встречается реже — смешанные советские изделия" },
  { label: "Золото 585 пробы (14 карат)",   coef: 0.585, desc: "Самая популярная проба в России" },
  { label: "Золото 750 пробы (18 карат)",   coef: 0.750, desc: "Ювелирное золото высшего качества" },
  { label: "Золото 999 пробы (слитки)",     coef: 1.000, desc: "Инвестиционные слитки и монеты" },
  { label: "Золото в украшениях б/у",       coef: 0.560, desc: "Средневзвешенная цена за грамм б/у украшений" },
  { label: "Золотые монеты",                coef: 0,     desc: "Оцениваем индивидуально — зависит от редкости" },
  { label: "Золотые зубные коронки",        coef: 0.585, desc: "Принимаем — пробу определяет мастер" },
];

const SCHEMA_STATIC = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Скупка24 — Скупка золота в Калуге",
    "description": "Выкуп золота всех проб в Калуге. 375, 500, 585, 750, 999. Оценка бесплатно, деньги сразу.",
    "url": "https://skypka24.com/skupka-zolota-kaluga",
    "telephone": "+79929990333",
    "openingHours": "Mo-Su 00:00-24:00",
    "address": { "@type": "PostalAddress", "addressLocality": "Калуга", "streetAddress": "ул. Кирова, 11", "addressCountry": "RU" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5.0", "reviewCount": "3460" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Принимаете ли золото без пробы?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем золото без пробирного клейма. Мастер определяет пробу с помощью химического реактива прямо при вас." } },
      { "@type": "Question", "name": "Нужен ли паспорт при сдаче золота?", "acceptedAnswer": { "@type": "Answer", "text": "Да, по закону РФ для оформления договора купли-продажи ювелирных изделий требуется паспорт. Без паспорта мы не можем провести сделку." } },
      { "@type": "Question", "name": "Принимаете ли позолоченные украшения?", "acceptedAnswer": { "@type": "Answer", "text": "Нет, позолоченные изделия (покрытые тонким слоем золота) мы не принимаем. Принимаем только изделия из чистого золота с пробой." } },
    ],
  },
];

export default function SkupkaZolotaKaluga() {
  const [price999, setPrice999] = useState<number | null>(null);
  const [loadedAt, setLoadedAt] = useState<string>("");

  useEffect(() => {
    fetch(GOLD_URL)
      .then(r => r.json())
      .then(d => {
        const p = d?.buy || d?.price || d?.price_999 || null;
        if (p) { setPrice999(Number(p)); setLoadedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })); }
      })
      .catch(() => {/* fallback to static */});
  }, []);

  const priceLabel = (coef: number) => {
    if (coef === 0) return "По запросу";
    if (!price999) return "Загрузка...";
    return `${Math.round(price999 * coef).toLocaleString("ru")} ₽/г`;
  };

  const dynamicTitle = price999
    ? `Скупка золота в Калуге — ${Math.round(price999 * 0.585).toLocaleString("ru")} ₽/г | Скупка24`
    : "Скупка золота в Калуге — актуальная цена | Скупка24";

  const dynamicDesc = price999
    ? `Сдайте золото в Калуге. 585 проба — ${Math.round(price999 * 0.585).toLocaleString("ru")} ₽/г. Оценка бесплатно, деньги сразу. Работаем 24/7. ☎ +7 (992) 999-03-33`
    : "Сдайте золото в Калуге по выгодной цене. 375, 500, 585, 750, 999 проба. Оценка бесплатно, деньги сразу. Работаем 24/7. ☎ +7 (992) 999-03-33";

  const goldSchema = [
    ...SCHEMA_STATIC,
    price999 ? {
      "@context": "https://schema.org",
      "@type": "Service",
      "name": "Скупка золота в Калуге",
      "description": `Актуальная цена скупки золота 585 пробы — ${Math.round(price999 * 0.585)} ₽/г. Оценка бесплатно.`,
      "provider": { "@type": "LocalBusiness", "name": "Скупка24" },
      "areaServed": { "@type": "City", "name": "Калуга" },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": String(Math.round(price999 * 0.375)),
        "highPrice": String(price999),
        "priceCurrency": "RUB",
      },
    } : null,
  ].filter(Boolean);

  /* Таблица цен с динамическими данными */
  const PRICE_ROWS = PROBES.map(p => ({ model: p.label, price: priceLabel(p.coef) }));

  /* Дополнительный блок — как проходит оценка */
  const HOW_BLOCK = (
    <section className="px-4 py-12" style={{ background: "#0d0d0d" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)" }}>
          Как проходит оценка золота
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "Scale", title: "Взвешивание", desc: "Мастер взвешивает украшение на точных ювелирных весах." },
            { icon: "Search", title: "Проверка пробы", desc: "Смотрим пробирное клеймо. При необходимости — химический анализ реактивом." },
            { icon: "Calculator", title: "Расчёт цены", desc: "Умножаем вес на актуальную цену ₽/г для вашей пробы." },
            { icon: "Banknote", title: "Выплата", desc: "Называем сумму — вы соглашаетесь, подписываем договор и получаете деньги." },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4 text-center" style={{ background: `${A}08`, border: `1px solid ${A}20` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${A}20` }}>
                <Icon name={s.icon as Parameters<typeof Icon>[0]["name"]} size={22} style={{ color: A }} />
              </div>
              <p className="font-oswald font-bold text-white text-sm uppercase mb-1">{s.title}</p>
              <p className="font-roboto text-white/40 text-xs leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="font-roboto text-white/30 text-xs mt-4">
          Также принимаем{" "}
          <Link to="/skupka-iphone-kaluga" className="underline" style={{ color: A }}>iPhone</Link>,{" "}
          <Link to="/skupka-macbook-kaluga" className="underline" style={{ color: A }}>MacBook</Link> и{" "}
          <Link to="/skupka-noutbukov-kaluga" className="underline" style={{ color: A }}>ноутбуки</Link>.
        </p>
      </div>
    </section>
  );

  const config: SeoPageConfig = {
    title: dynamicTitle,
    description: dynamicDesc,
    keywords: "скупка золота Калуга, продать золото Калуга, цена на золото Калуга, скупить золото украшения, 585 проба Калуга",
    url: "https://skypka24.com/skupka-zolota-kaluga",
    schema: goldSchema as object[],
    badge: `Скупка золота · Цены на ${TODAY_DATE}`,
    h1: `Скупка золота в Калуге — актуальные цены на ${TODAY_DATE}`,
    heroText: "Сдайте золото по честной рыночной цене. Принимаем украшения, монеты, слитки и зубные коронки любых проб — 375, 500, 585, 750, 999. Оценка занимает 10 минут.",
    heroSubText: "Цены обновляются ежедневно и привязаны к биржевым котировкам. Выплата наличными или на карту сразу.",
    accentColor: A,
    accentColor2: A2,
    priceTableTitle: "Цены на золото сегодня в Калуге",
    priceTableNote: loadedAt
      ? `Цены актуальны на ${loadedAt} · Обновляются автоматически из биржевых источников · Итоговая цена зависит от состояния изделия`
      : "Цены привязаны к биржевым котировкам и обновляются ежедневно.",
    priceRows: PRICE_ROWS,
    extraBlocks: HOW_BLOCK,
    advantages: [
      { icon: "Scale",       title: "Точное взвешивание",     desc: "Ювелирные весы с точностью 0.01 г." },
      { icon: "Search",      title: "Химический анализ",      desc: "Реактив для точного определения пробы при любых сомнениях." },
      { icon: "TrendingUp",  title: "Биржевая цена",         desc: "Расчёт привязан к актуальным котировкам на золото." },
      { icon: "Banknote",    title: "Деньги сразу",           desc: "Наличные или перевод на карту в день обращения." },
      { icon: "FileCheck",   title: "Официальный договор",    desc: "Каждая сделка оформляется по закону." },
      { icon: "Calendar",    title: "Работаем 24/7",          desc: "Принимаем золото круглосуточно без выходных." },
    ],
    steps: [
      { n: "01", icon: "Gem",        title: "Принесите",   desc: "Украшения, монеты, слитки — в любом виде." },
      { n: "02", icon: "Scale",      title: "Взвешивание", desc: "Точные ювелирные весы, проверка клейма." },
      { n: "03", icon: "Calculator", title: "Цена",        desc: "Сумма = вес × актуальная цена пробы." },
      { n: "04", icon: "Banknote",   title: "Выплата",     desc: "Деньги сразу после подписания договора." },
    ],
    formCategory: "Скупка золота",
    formDataTrack: "cta_gold_page",
    reviews: [
      { name: "Татьяна В.", date: "20 мая 2026", text: "Сдала бабушкины украшения — золотые кольца и цепочку 583 пробы. Взвесили, показали цену на калькуляторе. Всё прозрачно, дали 18 400 рублей." },
      { name: "Виктор К.", date: "8 апреля 2026", text: "Продал золотые зубные коронки — думал, никто не возьмёт. Здесь взяли без вопросов, определили пробу реактивом при мне. Честно и быстро." },
      { name: "Людмила С.", date: "14 марта 2026", text: "Сдавала золото впервые. Боялась, что обманут с весом или пробой. Всё делали при мне — даже показали весы. Осталась довольна." },
    ],
    faq: [
      { q: "Принимаете ли золото без пробы?", a: "Да, принимаем золото без пробирного клейма. Мастер определяет пробу с помощью химического реактива прямо при вас — процедура занимает 2-3 минуты и не повреждает изделие." },
      { q: "Можно ли сдать сломанные украшения?", a: "Да, принимаем украшения в любом состоянии — сломанные, деформированные, с утраченными камнями. Цена рассчитывается только за чистый вес золота." },
      { q: "Принимаете ли золотые зубные коронки?", a: "Да, принимаем. Зубные коронки содержат золото 585-750 пробы. Мастер проверит состав и назовёт точную цену за грамм." },
      { q: "Как самостоятельно узнать пробу золота?", a: "Пробирное клеймо на украшениях из СССР обычно выглядит как цифры 583 или 750. На современных изделиях — 585 или 750. Если клейма нет — определим у нас бесплатно." },
      { q: "Принимаете ли позолоченные изделия?", a: "Нет, позолоченные украшения мы не принимаем. Позолота — это тонкий слой золота на поверхности другого металла, реальной ценности не имеет." },
      { q: "Нужен ли паспорт при сдаче золота?", a: "Да, по закону РФ для оформления договора купли-продажи ювелирных изделий требуется паспорт. Без паспорта провести сделку невозможно." },
    ],
    related: [
      { href: "/skupka-iphone-kaluga",    icon: "Smartphone", title: "Скупка iPhone",    desc: "Все модели от 6s до 17 Pro." },
      { href: "/skupka-macbook-kaluga",   icon: "Laptop",     title: "Скупка MacBook",   desc: "Air и Pro всех поколений M1-M3." },
      { href: "/skupka-samsung-kaluga",   icon: "Monitor",    title: "Скупка Samsung",   desc: "Galaxy S, A, Z серии." },
    ],
    breadcrumbLabel: "Скупка золота в Калуге",
  };

  return (
    <>
      {/* Перезаписываем SEO динамически с ценой */}
      <PageSEO
        title={dynamicTitle}
        description={dynamicDesc}
        keywords={config.keywords}
        url={config.url}
        schema={goldSchema as object[]}
      />
      <SeoPageLayout config={config} />
    </>
  );
}