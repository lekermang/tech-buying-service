import Icon from "@/components/ui/icon";

export default function WholesaleBanner() {
  return (
    <section className="relative py-10 md:py-14 overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.05) 0%, transparent 50%, rgba(16,185,129,0.04) 100%)" }} />
      <div className="absolute -top-20 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,215,0,0.08)" }} />

      <div className="relative max-w-7xl mx-auto px-4">

        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
              <Icon name="Store" size={11} />
              Оптовые продажи
            </span>
            <h2 className="font-oswald font-bold text-2xl md:text-3xl text-white leading-tight">
              Новая техника оптом<br />
              <span className="text-[#FFD700]">от 1 штуки</span>
            </h2>
            <p className="font-roboto text-white/50 text-sm mt-2 max-w-md">
              Прямые поставки iPhone, Samsung, MacBook и другой техники. Без торговых наценок — честная цена с регистрацией.
            </p>
          </div>
          <a
            href="/catalog"
            className="btn-gold-premium shrink-0 px-6 py-3 text-sm rounded-xl self-start sm:self-auto"
          >
            <Icon name="ShoppingBag" size={15} />
            Смотреть прайс
          </a>
        </div>

        {/* Карточки преимуществ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "Package", title: "От 1 штуки", desc: "Нет минимального заказа — берите сколько нужно", color: "#FFD700" },
            { icon: "Tag", title: "−1 000 ₽", desc: "Скидка на первый заказ при регистрации", color: "#10B981" },
            { icon: "Truck", title: "Доставка", desc: "Отправим по России и СНГ — СДЭК, Почта России", color: "#3B82F6" },
            { icon: "ShieldCheck", title: "Гарантия", desc: "Официальная гарантия производителя 1–2 года", color: "#A855F7" },
          ].map(c => (
            <div key={c.title}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}>
                <Icon name={c.icon} size={17} style={{ color: c.color }} />
              </div>
              <div className="font-oswald font-bold text-white text-[15px] mb-1">{c.title}</div>
              <div className="font-roboto text-white/40 text-[11px] leading-snug">{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Нижняя строка */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.025] border border-[#FFD700]/15">
          <div className="flex items-center gap-2.5 text-[13px] text-white/60 font-roboto">
            <Icon name="Info" size={15} className="text-[#FFD700] shrink-0" />
            Цена в прайсе — розничная. После регистрации открывается оптовая со скидкой&nbsp;
            <span className="text-[#FFD700] font-bold">−1 000 ₽</span> на первый заказ.
          </div>
          <a href="/client"
            className="shrink-0 text-[12px] font-oswald font-bold uppercase tracking-wider text-[#FFD700] border border-[#FFD700]/40 hover:bg-[#FFD700]/8 px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
            Зарегистрироваться →
          </a>
        </div>

      </div>
    </section>
  );
}
