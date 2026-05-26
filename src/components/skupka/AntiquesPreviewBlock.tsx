import Icon from "@/components/ui/icon";

const COINS_IMG   = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0d17247e-bac8-456f-9aa9-00bfe13e451d.jpg";
const BRONZE_IMG  = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/13c9f8e4-9437-436b-9adc-52f0be22cfae.jpg";

const CARDS = [
  {
    href: "/ancient-coins",
    img: COINS_IMG,
    accent: "#FFD700",
    accentDim: "rgba(255,215,0,0.12)",
    accentBorder: "rgba(255,215,0,0.25)",
    tag: "Нумизматика",
    title: "Древние монеты",
    subtitle: "Рим · Греция · Парфия · Киевская Русь",
    desc: "Покупаем ауреусы, драхмы, сребреники и денарии. Оценка по международным каталогам — выплата в день визита.",
    priceFrom: "от 1 000 ₽",
    priceTo: "до 5 000 000 ₽",
    facts: ["Ауреус от 300 000 ₽", "Тетрадрахма от 150 000 ₽", "Злотник Владимира от 5 000 000 ₽"],
    cta: "Узнать цены",
    shimmerAnim: "goldShimmerPrev",
    shimmerGrad: "linear-gradient(90deg,#7a5800,#c89b00,#FFD700,#fff7b0,#FFD700,#c89b00,#7a5800)",
  },
  {
    href: "/bronze-sculptures",
    img: BRONZE_IMG,
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.10)",
    accentBorder: "rgba(167,139,250,0.22)",
    tag: "Скульптура",
    title: "Бронзовые статуэтки",
    subtitle: "Греция · Рим · Буддизм · Европа XIX–XX в.",
    desc: "Покупаем античную бронзу, буддийские статуи, работы Родена и Бари. Бесплатная атрибуция, оплата сразу.",
    priceFrom: "от 30 000 ₽",
    priceTo: "до 10 000 000 ₽",
    facts: ["Работы Родена от 10 млн ₽", "Греческая бронза от 300 000 ₽", "Буддийские статуи от 50 000 ₽"],
    cta: "Узнать цены",
    shimmerAnim: "purpleShimmerPrev",
    shimmerGrad: "linear-gradient(90deg,#4c1d95,#7c3aed,#a78bfa,#ddd6fe,#a78bfa,#7c3aed,#4c1d95)",
  },
];

export default function AntiquesPreviewBlock() {
  return (
    <section className="relative py-12 md:py-18 overflow-hidden">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A] to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#FFD700]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-[#a78bfa]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4">

        {/* Заголовок секции */}
        <div className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/50 font-roboto text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            <Icon name="Landmark" size={11} />
            Антиквариат · Скупка24
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl uppercase">
            Покупаем{" "}
            <span className="text-[#FFD700]">антиквариат</span>
          </h2>
          <p className="font-roboto text-white/45 text-sm md:text-base mt-1.5 max-w-xl">
            Честная оценка по мировым аукционным стандартам. Выплата в день обращения.
          </p>
        </div>

        {/* Карточки */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-6">
          {CARDS.map((card) => (
            <a
              key={card.href}
              href={card.href}
              className="group relative rounded-2xl overflow-hidden flex flex-col transition-transform hover:-translate-y-1 duration-300"
              style={{ border: `1px solid ${card.accentBorder}` }}
            >
              {/* Фото */}
              <div className="relative h-52 md:h-64 overflow-hidden">
                <img
                  src={card.img}
                  alt={card.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-transparent" />

                {/* Тег */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 font-roboto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full backdrop-blur-sm"
                    style={{ background: card.accentDim, border: `1px solid ${card.accentBorder}`, color: card.accent }}>
                    <Icon name="Tag" size={9} />
                    {card.tag}
                  </span>
                </div>

                {/* Цена в углу */}
                <div className="absolute top-3 right-3 text-right">
                  <div className="font-oswald font-black text-lg leading-none"
                    style={{
                      background: card.shimmerGrad,
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: `${card.shimmerAnim} 3s linear infinite`,
                    }}>
                    {card.priceTo}
                  </div>
                  <div className="font-roboto text-white/40 text-[10px]">{card.priceFrom}</div>
                </div>
              </div>

              {/* Контент */}
              <div className="bg-[#0D0D0D] p-5 flex flex-col gap-3 flex-1">
                <div>
                  <div className="font-oswald font-black text-xl md:text-2xl uppercase leading-tight text-white mb-0.5">
                    {card.title}
                  </div>
                  <div className="font-roboto text-[11px] uppercase tracking-widest"
                    style={{ color: `${card.accent}90` }}>
                    {card.subtitle}
                  </div>
                </div>

                <p className="font-roboto text-white/55 text-sm leading-relaxed">
                  {card.desc}
                </p>

                {/* Факты */}
                <div className="flex flex-col gap-1.5">
                  {card.facts.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full shrink-0" style={{ background: card.accent }} />
                      <span className="font-roboto text-xs text-white/50">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 font-oswald font-bold text-sm uppercase tracking-wide transition-all group-hover:gap-3"
                    style={{ color: card.accent }}>
                    {card.cta}
                    <Icon name="ArrowRight" size={15} />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Icon name="Banknote" size={13} className="text-white/25" />
                    <span className="font-roboto text-[11px] text-white/30">оплата в день визита</span>
                  </div>
                </div>
              </div>

              {/* Свечение при ховере */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `inset 0 0 40px ${card.accentDim}` }} />
            </a>
          ))}
        </div>

        {/* Нижняя строка */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {[
            { icon: "ShieldCheck", text: "Бесплатная экспертиза" },
            { icon: "Banknote",    text: "Наличные в день визита" },
            { icon: "Lock",        text: "Анонимность продавца" },
            { icon: "Phone",       text: "+7 (992) 999-03-33" },
          ].map(i => (
            <div key={i.text} className="flex items-center gap-1.5">
              <Icon name={i.icon} size={12} className="text-[#FFD700]/50" />
              <span className="font-roboto text-white/35 text-xs">{i.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes goldShimmerPrev {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes purpleShimmerPrev {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </section>
  );
}
