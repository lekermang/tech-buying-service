import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getActiveHoliday } from "@/components/holidays/holidays";

/** Премиум-секция «Топ услуг» — 4 лакшери-карточки + слоган + праздничный акцент.
 *
 *  Дизайн: тёмное премиум-стекло, золотые рамки, hover-сияние, иконки в круглых медальонах.
 *  Если активен праздник — сверху отображается праздничный жетон.
 */

type ServiceCard = {
  href: string;
  icon: string;
  badge: string;
  title: string;
  subtitle: string;
  guaranteeIcon: string;
  guarantee: string;
  accent: string; // hsl-цвет акцента в hover-свечении
};

const SERVICES: ServiceCard[] = [
  {
    href: "/catalog?tab=new",
    icon: "Smartphone",
    badge: "Новое",
    title: "Каталог новой техники",
    subtitle: "iPhone, MacBook, iPad, Apple Watch",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 2 года",
    accent: "rgba(255,215,0,0.18)",
  },
  {
    href: "/catalog?tab=used",
    icon: "RefreshCw",
    badge: "Б/У",
    title: "Б/У техника",
    subtitle: "Проверенная, в идеальном состоянии",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 1 год",
    accent: "rgba(180,210,255,0.18)",
  },
  {
    href: "#repair",
    icon: "Wrench",
    badge: "Ремонт",
    title: "Ремонт телефонов",
    subtitle: "При вас за 20 минут · от 300 ₽",
    guaranteeIcon: "Clock",
    guarantee: "Срочный ремонт",
    accent: "rgba(255,140,0,0.20)",
  },
  {
    href: "/tools",
    icon: "Hammer",
    badge: "Инструменты",
    title: "Каталог инструментов",
    subtitle: "Расходники для мастерских",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 3 года",
    accent: "rgba(120,255,180,0.16)",
  },
];

export default function PremiumServicesGrid() {
  const [holiday, setHoliday] = useState(() => getActiveHoliday());
  useEffect(() => {
    const refresh = () => setHoliday(getActiveHoliday());
    window.addEventListener("holidays-settings-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("holidays-settings-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <section className="relative py-14 sm:py-20 px-4 overflow-hidden">
      {/* Премиум-фон — золотые свечения по углам и тонкая сетка */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)",
          backgroundSize: "70px 70px",
          maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 85%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,215,0,0.07)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(255,184,0,0.05)" }}
      />

      <div className="relative max-w-6xl mx-auto">
        {/* Праздничная плашка над заголовком (если активен праздник) */}
        {holiday && (
          <div className="flex justify-center mb-5 animate-[fadeIn_0.6s_ease_both]">
            <div
              className="relative inline-flex items-center gap-2.5 px-5 py-2 rounded-full border overflow-hidden shadow-lg"
              style={{
                background: `linear-gradient(90deg, ${holiday.holiday.primaryColor}EE, ${holiday.holiday.primaryColor}AA)`,
                borderColor: holiday.holiday.secondaryColor + "AA",
                boxShadow: `0 0 30px ${holiday.holiday.primaryColor}66, inset 0 1px 0 ${holiday.holiday.secondaryColor}40`,
              }}
            >
              {/* Бликовый shimmer */}
              <span
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${holiday.holiday.secondaryColor}55 50%, transparent 100%)`,
                  backgroundSize: "200% 100%",
                  animation: "holiday-shimmer-grid 3s linear infinite",
                }}
              />
              <span className="relative text-xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]" aria-hidden>
                {holiday.holiday.emoji}
              </span>
              <span
                className="relative font-oswald font-bold text-sm sm:text-base uppercase tracking-wider whitespace-nowrap"
                style={{ color: "#fff", textShadow: `0 1px 4px rgba(0,0,0,0.6), 0 0 10px ${holiday.holiday.secondaryColor}AA` }}
              >
                {holiday.holiday.greeting}
              </span>
            </div>
            <style>{`
              @keyframes holiday-shimmer-grid { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
            `}</style>
          </div>
        )}

        {/* Главный слоган */}
        <h2 className="font-oswald font-bold uppercase text-center tracking-wider text-3xl sm:text-4xl md:text-5xl leading-tight mb-2">
          <span className="text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]">Купим </span>
          <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">дороже всех</span>
          <br />
          <span className="text-white">Apple технику!</span>
        </h2>
        <p className="text-center text-white/55 font-roboto text-sm sm:text-base mb-10 sm:mb-14 max-w-2xl mx-auto">
          Премиальный сервис для требовательных. Только оригинал, только лучшие условия.
        </p>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {SERVICES.map((s, i) => (
            <ServiceTile key={s.title} card={s} delay={i * 80} />
          ))}
        </div>

        {/* Низ — мини-доверие */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-white/45 font-roboto uppercase tracking-[0.2em]">
          <span className="flex items-center gap-1.5"><Icon name="ShieldCheck" size={14} className="text-[#FFD700]" />Оригинал</span>
          <span className="opacity-30">·</span>
          <span className="flex items-center gap-1.5"><Icon name="Award" size={14} className="text-[#FFD700]" />9 лет на рынке</span>
          <span className="opacity-30">·</span>
          <span className="flex items-center gap-1.5"><Icon name="Star" size={14} className="text-[#FFD700]" />4.9 на картах</span>
          <span className="opacity-30">·</span>
          <span className="flex items-center gap-1.5"><Icon name="Crown" size={14} className="text-[#FFD700]" />Премиум 24/7</span>
        </div>
      </div>
    </section>
  );
}

function ServiceTile({ card, delay }: { card: ServiceCard; delay: number }) {
  return (
    <a
      href={card.href}
      className="group relative block rounded-2xl border border-[#FFD700]/15 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent backdrop-blur-sm p-5 sm:p-6 transition-all duration-500 hover:border-[#FFD700]/50 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(255,215,0,0.35)] overflow-hidden animate-[fadeIn_0.6s_ease_both]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover-свечение */}
      <div
        aria-hidden
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${card.accent} 0%, transparent 50%)` }}
      />
      {/* Угловые золотые засечки */}
      <span aria-hidden className="absolute top-2 left-2 w-3 h-3 border-l border-t border-[#FFD700]/40 group-hover:border-[#FFD700]/80 transition-colors" />
      <span aria-hidden className="absolute top-2 right-2 w-3 h-3 border-r border-t border-[#FFD700]/40 group-hover:border-[#FFD700]/80 transition-colors" />
      <span aria-hidden className="absolute bottom-2 left-2 w-3 h-3 border-l border-b border-[#FFD700]/40 group-hover:border-[#FFD700]/80 transition-colors" />
      <span aria-hidden className="absolute bottom-2 right-2 w-3 h-3 border-r border-b border-[#FFD700]/40 group-hover:border-[#FFD700]/80 transition-colors" />

      <div className="relative flex flex-col h-full gap-3.5">
        {/* Бейдж */}
        <span className="self-start font-roboto text-[9px] font-bold uppercase tracking-[0.25em] text-[#FFD700]/80 bg-[#FFD700]/10 border border-[#FFD700]/30 px-2 py-0.5 rounded-sm">
          {card.badge}
        </span>

        {/* Иконка-медальон */}
        <div className="relative w-14 h-14 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.3)] group-hover:shadow-[0_0_28px_rgba(255,215,0,0.55)] transition-all">
          <div className="w-full h-full rounded-full bg-[#0D0D0D] flex items-center justify-center">
            <Icon name={card.icon as Parameters<typeof Icon>[0]["name"]} size={26} className="text-[#FFD700] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Заголовок */}
        <h3 className="font-oswald font-bold text-lg sm:text-xl uppercase tracking-wide text-white leading-tight">
          {card.title}
        </h3>

        {/* Подзаголовок */}
        <p className="font-roboto text-[13px] text-white/60 leading-relaxed flex-1">
          {card.subtitle}
        </p>

        {/* Гарантия */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-[#FFD700]/10 group-hover:border-[#FFD700]/30 transition-colors">
          <Icon name={card.guaranteeIcon as Parameters<typeof Icon>[0]["name"]} size={14} className="text-[#FFD700]" />
          <span className="font-roboto text-[11px] uppercase tracking-wider text-[#FFD700]/90 font-semibold">
            {card.guarantee}
          </span>
          <Icon name="ArrowRight" size={14} className="ml-auto text-white/30 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </a>
  );
}
