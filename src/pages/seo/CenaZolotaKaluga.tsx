/**
 * /cena-zolota-kaluga — SEO-страница «Цена золота в Калуге сегодня»
 * Динамически показывает актуальный курс из API, таблицу по пробам,
 * график истории за 7 дней и блок FAQ.
 */
import { useEffect, useState } from "react";
import SeoPageLayout, { type SeoPageConfig } from "@/components/seo/SeoPageLayout";
import PageSEO from "@/components/seo/PageSEO";
import funcUrls from "../../../backend/func2url.json";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const GOLD_URL = (funcUrls as Record<string, string>)["gold-price"];
const TODAY = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
const A = "#FFD700";
const A2 = "#b8860b";

const PROBES = [
  { label: "Золото 375 пробы (9 карат)",  coef: 0.375, desc: "Советские кольца и цепочки" },
  { label: "Золото 500 пробы",            coef: 0.500, desc: "Редкие советские изделия" },
  { label: "Золото 585 пробы (14 карат)", coef: 0.585, desc: "Самая популярная проба в России" },
  { label: "Золото 750 пробы (18 карат)", coef: 0.750, desc: "Ювелирное высшего класса" },
  { label: "Золото 999 пробы (слитки)",   coef: 1.000, desc: "Инвестиционные слитки и монеты" },
];

const SCHEMA_STATIC = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Цена золота в Калуге сегодня",
    "url": "https://skypka24.com/cena-zolota-kaluga",
    "description": "Актуальная цена покупки золота в Калуге. Биржевой курс на сегодня по пробам 375, 585, 750, 999. Скупка24 — Кирова 11 и 7/47.",
    "publisher": { "@type": "Organization", "name": "Скупка24", "url": "https://skypka24.com" },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://skypka24.com/" },
        { "@type": "ListItem", "position": 2, "name": "Скупка золота", "item": "https://skypka24.com/skupka-zolota-kaluga" },
        { "@type": "ListItem", "position": 3, "name": "Цена золота в Калуге", "item": "https://skypka24.com/cena-zolota-kaluga" },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "Как формируется цена на золото?", "acceptedAnswer": { "@type": "Answer", "text": "Цена привязана к биржевым котировкам XAU/USD (Лондонский фиксинг) и курсу доллара ЦБ РФ. Мы обновляем её ежедневно." } },
      { "@type": "Question", "name": "Сколько стоит грамм золота 585 пробы в Калуге?", "acceptedAnswer": { "@type": "Answer", "text": "Цена зависит от биржевого курса. Актуальную цену смотрите в таблице на этой странице — она обновляется автоматически." } },
      { "@type": "Question", "name": "Принимаете ли советские украшения?", "acceptedAnswer": { "@type": "Answer", "text": "Да, принимаем советские украшения с пробами 583, 750, 375. Проба 583 соответствует современной 585." } },
    ],
  },
];

export default function CenaZolotaKaluga() {
  const [price999, setPrice999] = useState<number | null>(null);
  const [usdRub, setUsdRub]     = useState<number | null>(null);
  const [xauUsd, setXauUsd]     = useState<number | null>(null);
  const [history, setHistory]   = useState<{ date: string; price: number }[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    fetch(GOLD_URL)
      .then(r => r.json())
      .then(d => {
        if (d?.buy)     setPrice999(Number(d.buy));
        if (d?.usd_rub) setUsdRub(Number(d.usd_rub));
        if (d?.xau_usd) setXauUsd(Number(d.xau_usd));
        if (Array.isArray(d?.history)) setHistory(d.history);
        setUpdatedAt(new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => {});
  }, []);

  const fmt = (n: number) => n.toLocaleString("ru");
  const priceOf = (coef: number) =>
    price999 ? `${fmt(Math.round(price999 * coef))} ₽/г` : "—";

  const p585 = price999 ? Math.round(price999 * 0.585) : null;

  const dynamicTitle = p585
    ? `Цена золота в Калуге сегодня — ${fmt(p585)} ₽/г | Скупка24`
    : `Цена золота в Калуге сегодня ${TODAY} | Скупка24`;

  const dynamicDesc = p585
    ? `Актуальная цена золота в Калуге на ${TODAY}: 585 проба — ${fmt(p585)} ₽/г. Биржевой курс, таблица по пробам. Скупка24 на Кирова 11.`
    : `Цена золота в Калуге сегодня. Актуальный курс по пробам 375, 585, 750, 999. Биржевые котировки. Скупка24 — Кирова 11, работаем 24/7.`;

  const dynamicSchema = [
    ...SCHEMA_STATIC,
    price999 ? {
      "@context": "https://schema.org",
      "@type": "PriceSpecification",
      "name": `Цена золота 999 пробы в Калуге на ${TODAY}`,
      "price": String(price999),
      "priceCurrency": "RUB",
      "unitText": "грамм",
      "validFrom": new Date().toISOString().slice(0, 10),
      "eligibleQuantity": { "@type": "QuantitativeValue", "unitText": "грамм", "minValue": 1 },
    } : null,
  ].filter(Boolean);

  /* Блок с биржевыми данными */
  const ExchangeBlock = (
    <section className="px-4 py-10" style={{ background: "#0a0a0a" }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="font-oswald font-black uppercase text-white mb-6" style={{ fontSize: "clamp(1.1rem,2.5vw,1.6rem)" }}>
          Биржевые данные
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "XAU/USD (тройская унция)", value: xauUsd ? `$${fmt(Math.round(xauUsd))}` : "—", icon: "TrendingUp" },
            { label: "USD/RUB (курс ЦБ)",         value: usdRub ? `${usdRub.toFixed(2)} ₽`       : "—", icon: "DollarSign" },
            { label: "Золото 999 пробы (1 г)",    value: price999 ? `${fmt(price999)} ₽`         : "—", icon: "Gem" },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: `${A}08`, border: `1px solid ${A}20` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name={c.icon as Parameters<typeof Icon>[0]["name"]} size={14} style={{ color: A }} />
                <span className="font-roboto text-white/40 text-xs">{c.label}</span>
              </div>
              <p className="font-oswald font-black text-xl" style={{ color: A }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Мини-график истории */}
        {history.length > 1 && (
          <div className="rounded-xl p-4" style={{ background: `${A}06`, border: `1px solid ${A}15` }}>
            <p className="font-oswald font-bold text-white/70 text-sm uppercase mb-3">
              История цены за 7 дней (₽/г, 999 проба)
            </p>
            <div className="flex items-end gap-1 h-16">
              {(() => {
                const prices = history.map(h => h.price);
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const range = max - min || 1;
                return history.map((h, i) => {
                  const heightPct = ((h.price - min) / range) * 70 + 20;
                  const isLast = i === history.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm"
                        style={{
                          height: `${heightPct}%`,
                          background: isLast ? A : `${A}50`,
                          minHeight: 4,
                        }}
                        title={`${h.date}: ${fmt(Math.round(h.price))} ₽`}
                      />
                      <span className="font-roboto text-white/25" style={{ fontSize: 9 }}>
                        {h.date.slice(5)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {updatedAt && (
          <p className="font-roboto text-white/25 text-xs mt-3">
            Данные обновлены сегодня в {updatedAt} · Источник: Лондонский фиксинг XAU/USD + ЦБ РФ
          </p>
        )}

        <p className="font-roboto text-white/30 text-sm mt-4">
          Хотите сдать золото по этой цене?{" "}
          <Link to="/skupka-zolota-kaluga" className="underline" style={{ color: A }}>
            Подробнее о скупке золота →
          </Link>
        </p>
      </div>
    </section>
  );

  const config: SeoPageConfig = {
    title:       dynamicTitle,
    description: dynamicDesc,
    keywords:    "цена золота Калуга, сколько стоит грамм золота Калуга, курс золота сегодня, 585 проба цена Калуга, биржевая цена золота",
    url:         "https://skypka24.com/cena-zolota-kaluga",
    schema:      dynamicSchema as object[],
    badge:       `Актуальный курс · ${TODAY}`,
    h1:          `Цена золота в Калуге сегодня — ${TODAY}`,
    heroText:    "Биржевой курс золота в Калуге обновляется ежедневно. Таблица цен по пробам 375, 585, 750, 999 — привязана к Лондонскому фиксингу и курсу ЦБ РФ.",
    heroSubText: "Хотите продать золото? Оценка занимает 10 минут, деньги выдаём сразу. Принимаем украшения, монеты, зубные коронки и слитки.",
    accentColor:  A,
    accentColor2: A2,
    priceTableTitle: "Цены на золото по пробам сегодня",
    priceTableNote:  updatedAt
      ? `Обновлено в ${updatedAt} · Привязано к биржевым котировкам · Итоговая цена зависит от состояния изделия`
      : "Цены привязаны к биржевым котировкам XAU/USD и курсу доллара ЦБ РФ.",
    priceRows: PROBES.map(p => ({ model: p.label, price: priceOf(p.coef) })),
    extraBlocks: ExchangeBlock,
    advantages: [
      { icon: "TrendingUp",  title: "Биржевой курс",       desc: "Цены привязаны к Лондонскому фиксингу XAU/USD в режиме реального времени." },
      { icon: "Scale",       title: "Точное взвешивание",  desc: "Ювелирные весы с погрешностью 0.01 г при каждой оценке." },
      { icon: "Search",      title: "Определение пробы",   desc: "Пробирный реактив или спектральный анализ — при вас и бесплатно." },
      { icon: "Banknote",    title: "Выплата в минуту",    desc: "Наличные или перевод на карту сразу после подписания договора." },
      { icon: "Clock",       title: "Работаем 24/7",       desc: "Два офиса в центре Калуги, без выходных и праздников." },
      { icon: "FileCheck",   title: "Официальный договор", desc: "Каждая сделка оформляется по ФЗ о ломбардах, вы получаете свой экземпляр." },
    ],
    steps: [
      { n: "01", icon: "Gem",        title: "Принесите",   desc: "Украшения, монеты, зубные коронки или слитки — в любом виде." },
      { n: "02", icon: "Scale",      title: "Взвешивание", desc: "Точные весы, проверка пробы реактивом при вас." },
      { n: "03", icon: "Calculator", title: "Расчёт цены", desc: "Вес × актуальная цена пробы = ваша сумма." },
      { n: "04", icon: "Banknote",   title: "Выплата",     desc: "Деньги сразу после подписания договора купли-продажи." },
    ],
    formCategory:  "Оценка золота",
    formDataTrack: "cta_gold_price_page",
    reviews: [
      { name: "Ирина Н.", date: "2 июня 2026",   text: "Пришла узнать цену на кольца 585 пробы. Взвесили при мне, рассчитали по биржевой цене — всё прозрачно. Сдала сразу, дали 12 400 ₽ за 11 грамм." },
      { name: "Андрей Т.", date: "18 мая 2026",  text: "Продавал советские золотые монеты. Оценили грамотно, дали чуть выше, чем в другом месте. Порадовало что всё официально, с договором." },
      { name: "Наталья В.", date: "5 апреля 2026", text: "Сдавала зубные коронки — немного стеснялась. Приняли без лишних вопросов, определили пробу, рассчитали честно. Рекомендую." },
    ],
    faq: [
      { q: "Как формируется цена на золото?",              a: "Цена рассчитывается ежедневно по формуле: XAU/USD (Лондонский фиксинг) ÷ 31.1035 (г в тройской унции) × курс доллара ЦБ РФ × коэффициент вашей пробы." },
      { q: "Чем отличается проба 583 от 585?",             a: "Советская проба 583 и современная 585 — практически одинаковое содержание золота (58.3% и 58.5%). Покупаем по одной цене." },
      { q: "Принимаете ли сломанные украшения?",           a: "Да, принимаем в любом состоянии — помятые, без камней, сломанные застёжки. Цена считается только за чистый вес золота." },
      { q: "Как быстро можно получить деньги?",            a: "Весь процесс занимает 10-20 минут: взвешивание, проверка пробы, оформление договора и выплата. Сразу наличными или переводом на карту." },
      { q: "Принимаете ли золото в слитках?",              a: "Да, принимаем инвестиционные слитки 999.9 пробы. Оцениваем по биржевому курсу с минимальным дисконтом. Потребуется паспорт и сертификат на слиток." },
      { q: "Нужен ли паспорт для сдачи золота?",           a: "Да, по закону РФ о ломбардной деятельности для оформления договора купли-продажи ювелирных изделий паспорт обязателен." },
    ],
    related: [
      { href: "/skupka-zolota-kaluga",    icon: "Gem",        title: "Скупка золота",     desc: "Принимаем украшения, монеты, слитки." },
      { href: "/skupka-iphone-kaluga",    icon: "Smartphone", title: "Скупка iPhone",     desc: "Все модели от 6s до 17 Pro." },
      { href: "/skupka-macbook-kaluga",   icon: "Laptop",     title: "Скупка MacBook",    desc: "Air и Pro всех поколений." },
    ],
    breadcrumbLabel: "Цена золота в Калуге",
  };

  return (
    <>
      <PageSEO
        title={dynamicTitle}
        description={dynamicDesc}
        keywords={config.keywords}
        url={config.url}
        schema={dynamicSchema as object[]}
      />
      <SeoPageLayout config={config} />
    </>
  );
}
