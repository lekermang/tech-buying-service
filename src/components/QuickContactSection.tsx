import Icon from "@/components/ui/icon";

const CHANNELS = [
  {
    icon: "Phone",
    title: "Позвонить",
    desc: "Бесплатно, 8 утра — 10 вечера",
    value: "+7 (992) 999-97-77",
    href: "tel:+79929999777",
    accent: "from-[#FFD700]/25 to-[#FFD700]/5",
    border: "border-[#FFD700]/40",
    iconColor: "text-[#FFD700]",
  },
  {
    icon: "MessageCircle",
    title: "Чат на сайте",
    desc: "Личный кабинет · ответ за 5 минут",
    value: "Открыть чат",
    href: "/client?tab=chat",
    accent: "from-emerald-500/25 to-emerald-700/5",
    border: "border-emerald-500/40",
    iconColor: "text-emerald-400",
  },
  {
    icon: "Send",
    title: "Telegram",
    desc: "@skypka24 · быстро и удобно",
    value: "Написать в Telegram",
    href: "https://t.me/skypka24",
    accent: "from-sky-500/25 to-sky-700/5",
    border: "border-sky-500/40",
    iconColor: "text-sky-400",
    external: true,
  },
  {
    icon: "MapPin",
    title: "Приехать в офис",
    desc: "Калуга · Кирова 11 и 7/47",
    value: "Открыть на карте",
    href: "https://yandex.ru/maps/?text=Кирова+11+Калуга+Скупка24",
    accent: "from-rose-500/25 to-rose-700/5",
    border: "border-rose-500/40",
    iconColor: "text-rose-300",
    external: true,
  },
];

export default function QuickContactSection() {
  return (
    <section
      id="quick-contact"
      className="relative py-14 md:py-20 border-t border-[#FFD700]/10 overflow-hidden"
    >
      {/* Премиум-подложка */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.05] via-transparent to-[#FFD700]/[0.05] pointer-events-none" />
      <div className="absolute -top-20 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
              <Icon name="Zap" size={12} />
              На связи 24/7
            </span>
            <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">
              Быстрая связь
            </span>
          </div>
          <h2 className="font-oswald text-3xl md:text-5xl font-bold">
            СВЯЖИСЬ ЛЮБЫМ СПОСОБОМ
            <br />
            <span className="text-[#FFD700]">за 30 секунд.</span>{" "}
            <span className="text-emerald-400">Мы рядом.</span>
          </h2>
          <p className="font-roboto text-white/60 text-sm md:text-base leading-relaxed mt-4 max-w-2xl">
            Звонок, чат прямо в личном кабинете, Telegram или личный визит — выбирай удобный
            способ. Менеджер отвечает за 5 минут, оценка за 15.
          </p>
        </div>

        {/* Каналы */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              target={c.external ? "_blank" : undefined}
              rel={c.external ? "noopener noreferrer" : undefined}
              className={`group relative bg-[#0D0D0D] border ${c.border} hover:border-opacity-80 p-5 md:p-6 transition-all hover:scale-[1.02] active:scale-[0.99] flex flex-col`}
            >
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${c.accent}`}
                />
              </div>
              <div
                className={`relative w-12 h-12 rounded-lg bg-gradient-to-br ${c.accent} border ${c.border} flex items-center justify-center mb-3`}
              >
                <Icon name={c.icon} size={22} className={c.iconColor} />
              </div>
              <div className="relative">
                <div className="font-oswald font-bold text-white text-lg md:text-xl uppercase leading-tight">
                  {c.title}
                </div>
                <div className="font-roboto text-white/55 text-[11px] md:text-[12px] mt-1 mb-3">
                  {c.desc}
                </div>
                <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-white/5">
                  <span className={`font-roboto text-[12px] md:text-[13px] font-bold ${c.iconColor} truncate`}>
                    {c.value}
                  </span>
                  <Icon
                    name="ArrowUpRight"
                    size={14}
                    className={`${c.iconColor} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0`}
                  />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Полоска часов работы */}
        <div className="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-4 text-[12px] text-white/50">
          <div className="flex items-center gap-1.5">
            <Icon name="Clock" size={12} className="text-emerald-400" />
            <span>Звонки и чат: 8:00 — 22:00</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Icon name="MessageSquare" size={12} className="text-sky-400" />
            <span>Telegram: круглосуточно</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Icon name="Building" size={12} className="text-rose-300" />
            <span>Офисы: 10:00 — 20:00</span>
          </div>
        </div>
      </div>
    </section>
  );
}