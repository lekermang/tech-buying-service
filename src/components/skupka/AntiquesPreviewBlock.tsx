import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const COINS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg";
const BRONZE_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/13c9f8e4-9437-436b-9adc-52f0be22cfae.jpg";
const RU_COINS_IMG = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/cb78bd34-b88a-42fd-9a35-072ba558015a.jpg";
const ICONS_IMG    = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0da20686-81b0-482f-b091-6913209c1edb.jpg";
const PORCELAIN_IMG= "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/3b284dfd-609c-4d3f-8e73-49501a0ae6c3.jpg";
const SOVIET_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/2d93ca66-c5fe-42a7-8b1c-221370af02ff.jpg";

const CARDS = [
  {
    href: "/russian-coins",
    img: RU_COINS_IMG,
    accent: "#FFD700",
    accentDim: "rgba(255,215,0,0.12)",
    accentBorder: "rgba(255,215,0,0.25)",
    tag: "Нумизматика",
    title: "Царские монеты",
    subtitle: "Киевская Русь · Империя · Николай II",
    desc: "Покупаем монеты от Владимира Великого до Николая II. Платиновые монеты — особый приоритет.",
    priceFrom: "от 1 000 ₽",
    priceTo: "до 5 000 000 ₽",
    facts: ["Злотник Владимира от 5 000 000 ₽", "Платина Николая II до 250 000 ₽", "Ефимки Петра I от 10 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#7a5800,#c89b00,#FFD700,#fff7b0,#FFD700,#c89b00,#7a5800)",
    shimmerAnim: "shimGold",
  },
  {
    href: "/icons",
    img: ICONS_IMG,
    accent: "#e2a84b",
    accentDim: "rgba(226,168,75,0.12)",
    accentBorder: "rgba(226,168,75,0.25)",
    tag: "Иконопись",
    title: "Православные иконы",
    subtitle: "XVI–XIX в. · Оклады · Финифть",
    desc: "Покупаем иконы Новгородской, Московской, Строгановской школ. Оклады серебро, золото, эмаль.",
    priceFrom: "от 3 000 ₽",
    priceTo: "до 5 000 000 ₽",
    facts: ["Икона с окладом Фаберже от 500 000 ₽", "Московская школа от 150 000 ₽", "Домашние иконы от 10 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#8a5000,#c47a00,#e2a84b,#fde68a,#e2a84b,#c47a00,#8a5000)",
    shimmerAnim: "shimAmber",
  },
  {
    href: "/porcelain",
    img: PORCELAIN_IMG,
    accent: "#60a5fa",
    accentDim: "rgba(96,165,250,0.10)",
    accentBorder: "rgba(96,165,250,0.22)",
    tag: "Фарфор",
    title: "Фарфор и хрусталь",
    subtitle: "ИФЗ · Гарднер · Кузнецов · Гусь",
    desc: "Покупаем Imperial, Гарднер, Кузнецов. Отдельные предметы и полные сервизы — без разницы.",
    priceFrom: "от 500 ₽",
    priceTo: "до 3 000 000 ₽",
    facts: ["Гарднер «Русские типы» от 100 000 ₽", "Сервиз ИФЗ XIX в. от 50 000 ₽", "Агитфарфор ГФЗ от 50 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#1e3a5f,#2563eb,#60a5fa,#bfdbfe,#60a5fa,#2563eb,#1e3a5f)",
    shimmerAnim: "shimBlue",
  },
  {
    href: "/soviet-antiques",
    img: SOVIET_IMG,
    accent: "#ef4444",
    accentDim: "rgba(239,68,68,0.10)",
    accentBorder: "rgba(239,68,68,0.22)",
    tag: "СССР",
    title: "Советский антиквариат",
    subtitle: "Ордена · Плакаты · Авангард · Мебель",
    desc: "Покупаем ордена и медали, плакаты 1920-х, агитфарфор, мебель конструктивизма.",
    priceFrom: "от 200 ₽",
    priceTo: "до 1 000 000 ₽",
    facts: ["Орден Ленина от 30 000 ₽", "Плакат Родченко от 20 000 ₽", "Агитфарфор ГФЗ от 50 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#7f1d1d,#dc2626,#ef4444,#fca5a5,#ef4444,#dc2626,#7f1d1d)",
    shimmerAnim: "shimRed",
  },
  {
    href: "/ancient-coins",
    img: COINS_IMG,
    accent: "#a3e635",
    accentDim: "rgba(163,230,53,0.09)",
    accentBorder: "rgba(163,230,53,0.20)",
    tag: "Античность",
    title: "Древние монеты",
    subtitle: "Рим · Греция · Парфия · Русь",
    desc: "Покупаем ауреусы, драхмы, сребреники. Оценка по международным каталогам.",
    priceFrom: "от 1 000 ₽",
    priceTo: "до 5 000 000 ₽",
    facts: ["Тетрадрахма Афин от 150 000 ₽", "Ауреус от 300 000 ₽", "Злотник Владимира от 5 000 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#3f6212,#65a30d,#a3e635,#d9f99d,#a3e635,#65a30d,#3f6212)",
    shimmerAnim: "shimGreen",
  },
  {
    href: "/bronze-sculptures",
    img: BRONZE_IMG,
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.10)",
    accentBorder: "rgba(167,139,250,0.22)",
    tag: "Скульптура",
    title: "Бронзовые статуэтки",
    subtitle: "Греция · Рим · Буддизм · XIX–XX в.",
    desc: "Покупаем античную бронзу, буддийские статуи, работы Родена и Бари.",
    priceFrom: "от 30 000 ₽",
    priceTo: "до 10 000 000 ₽",
    facts: ["Роден от 10 000 000 ₽", "Греческая бронза от 300 000 ₽", "Буддийские статуи от 50 000 ₽"],
    shimmerGrad: "linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa,#ddd6fe,#a78bfa,#7c3aed,#4c1d95)",
    shimmerAnim: "shimPurple",
  },
];

export default function AntiquesPreviewBlock() {
  return (
    <section className="relative py-12 md:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A] to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#FFD700]/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-[#a78bfa]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4">

        {/* Заголовок */}
        <div className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            <Icon name="Landmark" size={11} />
            Антиквариат · Скупка24
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
                Покупаем{" "}
                <span className="text-[#FFD700]">антиквариат</span>
              </h2>
              <p className="font-roboto text-white/45 text-sm md:text-base mt-1.5 max-w-xl">
                Честная оценка по аукционным стандартам. Выплата в день обращения.
              </p>
            </div>
            <Link to="/skupka-antikvariata"
              className="group shrink-0 inline-flex items-center gap-2 border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] font-oswald font-bold uppercase text-sm px-5 py-2.5 rounded-xl transition-all hover:bg-[#FFD700]/[0.06] self-start sm:self-auto">
              Все направления
              <Icon name="ArrowRight" size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Сетка: 2 колонки на мобиле → 3 на десктопе */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {CARDS.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="group relative rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300"
              style={{ border: `1px solid ${card.accentBorder}` }}
            >
              {/* Фото */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/25 to-transparent" />

                {/* Тег */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className="inline-flex items-center gap-1 font-roboto text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm"
                    style={{ background: card.accentDim, border: `1px solid ${card.accentBorder}`, color: card.accent }}
                  >
                    <Icon name="Tag" size={8} />
                    {card.tag}
                  </span>
                </div>

                {/* Цена */}
                <div className="absolute top-2.5 right-2.5 text-right">
                  <div
                    className="font-oswald font-black text-base leading-none"
                    style={{
                      background: card.shimmerGrad,
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: `${card.shimmerAnim} 3s linear infinite`,
                    }}
                  >
                    {card.priceTo}
                  </div>
                  <div className="font-roboto text-white/40 text-[10px]">{card.priceFrom}</div>
                </div>
              </div>

              {/* Контент */}
              <div className="bg-[#0D0D0D] p-4 flex flex-col gap-2 flex-1">
                <div>
                  <div className="font-oswald font-black text-lg uppercase leading-tight text-white">
                    {card.title}
                  </div>
                  <div
                    className="font-roboto text-[10px] uppercase tracking-widest mt-0.5"
                    style={{ color: `${card.accent}80` }}
                  >
                    {card.subtitle}
                  </div>
                </div>

                <p className="font-roboto text-white/50 text-xs leading-relaxed">
                  {card.desc}
                </p>

                <div className="flex flex-col gap-1 mt-auto">
                  {card.facts.map((f) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: card.accent }} />
                      <span className="font-roboto text-[11px] text-white/45">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 font-oswald font-bold text-xs uppercase tracking-wide transition-all group-hover:gap-2.5"
                    style={{ color: card.accent }}
                  >
                    Узнать цены
                    <Icon name="ArrowRight" size={13} />
                  </span>
                  <span className="font-roboto text-[10px] text-white/25">оплата в день визита</span>
                </div>
              </div>

              {/* Ховер-свечение */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `inset 0 0 30px ${card.accentDim}` }}
              />
            </a>
          ))}
        </div>

        {/* Нижняя строка */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {[
            { icon: "ShieldCheck", text: "Бесплатная экспертиза" },
            { icon: "Banknote",    text: "Наличные в день визита" },
            { icon: "Lock",        text: "Анонимность продавца" },
            { icon: "Phone",       text: "+7 (992) 999-03-33" },
          ].map((i) => (
            <div key={i.text} className="flex items-center gap-1.5">
              <Icon name={i.icon} size={12} className="text-[#FFD700]/50" />
              <span className="font-roboto text-white/30 text-xs">{i.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimGold   { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimAmber  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimBlue   { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimRed    { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimGreen  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes shimPurple { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>
    </section>
  );
}