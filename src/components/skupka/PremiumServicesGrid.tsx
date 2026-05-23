import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getActiveHoliday } from "@/components/holidays/holidays";

/** Премиум-секция «Топ услуг» — 4 крутые лакшери-кнопки + слоган + праздничный акцент.
 *
 *  Логика навигации:
 *   - "Каталог новой техники" → переход на /catalog
 *   - "Б/У техника" → скролл к виджету Б/У на главной + автооткрытие аккордеона
 *   - "Ремонт телефонов" → скролл к виджету ремонта + автооткрытие аккордеона
 *   - "Каталог инструментов" → переход на /tools
 */

type ServiceAction =
  | { type: "link"; href: string }
  | { type: "open-used" }
  | { type: "open-repair" };

type ServiceButton = {
  action: ServiceAction;
  icon: string;
  badge: string;
  title: string;
  subtitle: string;
  guaranteeIcon: string;
  guarantee: string;
  cta: string;
  accent: string;
};

const SERVICES: ServiceButton[] = [
  {
    action: { type: "link", href: "/catalog" },
    icon: "Smartphone",
    badge: "Новое",
    title: "Каталог новой техники",
    subtitle: "iPhone, MacBook, iPad, Apple Watch",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 2 года",
    cta: "Перейти в каталог",
    accent: "rgba(255,215,0,0.22)",
  },
  {
    action: { type: "open-used" },
    icon: "RefreshCw",
    badge: "Б/У",
    title: "Б/У техника",
    subtitle: "Проверенная, в идеальном состоянии",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 1 год",
    cta: "Открыть витрину",
    accent: "rgba(180,210,255,0.22)",
  },
  {
    action: { type: "open-repair" },
    icon: "Wrench",
    badge: "Ремонт",
    title: "Ремонт телефонов",
    subtitle: "При вас за 20 минут · от 300 ₽",
    guaranteeIcon: "Clock",
    guarantee: "Срочный ремонт",
    cta: "Оставить заявку",
    accent: "rgba(255,140,0,0.24)",
  },
  {
    action: { type: "link", href: "/tools" },
    icon: "Hammer",
    badge: "Инструменты",
    title: "Каталог инструментов",
    subtitle: "Расходники для мастерских",
    guaranteeIcon: "ShieldCheck",
    guarantee: "Гарантия 3 года",
    cta: "Смотреть каталог",
    accent: "rgba(120,255,180,0.20)",
  },
  {
    action: { type: "link", href: "/transfer" },
    icon: "ArrowLeftRight",
    badge: "Новинка",
    title: "Перенос данных",
    subtitle: "Фото, контакты, файлы — на новый телефон",
    guaranteeIcon: "Lock",
    guarantee: "Без приложений · в браузере",
    cta: "Перенести данные",
    accent: "rgba(180,140,255,0.22)",
  },
  {
    action: { type: "link", href: "/safe-deals" },
    icon: "Shield",
    badge: "Безопасно",
    title: "Безопасная сделка",
    subtitle: "Продайте технику через гаранта · комиссия 10%",
    guaranteeIcon: "Shield",
    guarantee: "Гарант Скупка24 · QR-сделка",
    cta: "Подать заявку",
    accent: "rgba(255,200,100,0.22)",
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

  const handleAction = (action: ServiceAction) => {
    if (action.type === "link") {
      window.location.href = action.href;
      return;
    }
    if (action.type === "open-used") {
      window.dispatchEvent(new CustomEvent("open-used-tech"));
      return;
    }
    if (action.type === "open-repair") {
      window.dispatchEvent(new CustomEvent("open-repair"));
    }
  };

  return (
    <section className="relative py-14 sm:py-20 px-4 overflow-hidden">
      {/* Премиум-фон */}
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
      <div aria-hidden className="absolute -top-40 left-1/4 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.07)" }} />
      <div aria-hidden className="absolute -bottom-40 right-1/4 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.05)" }} />

      <div className="relative max-w-6xl mx-auto">
        {/* Праздничная плашка */}
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
            <style>{`@keyframes holiday-shimmer-grid { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
          </div>
        )}

        {/* Слоган */}
        <h2 className="font-oswald font-bold uppercase text-center tracking-wider text-3xl sm:text-4xl md:text-5xl leading-tight mb-2">
          <span className="text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]">Купим </span>
          <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">дороже всех</span>
          <br />
          <span className="text-white">Apple технику!</span>
        </h2>
        <p className="text-center text-white/55 font-roboto text-sm sm:text-base mb-10 sm:mb-14 max-w-2xl mx-auto">
          Премиальный сервис для требовательных. Только оригинал, только лучшие условия.
        </p>

        {/* Сетка КНОПОК */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          {SERVICES.map((s, i) => (
            <ServiceTile key={s.title} card={s} delay={i * 80} onClick={() => handleAction(s.action)} />
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

function ServiceTile({ card, delay, onClick }: { card: ServiceButton; delay: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block text-left rounded-2xl border-2 border-[#FFD700]/25 bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent backdrop-blur-sm p-5 sm:p-6 transition-all duration-500 hover:border-[#FFD700]/70 hover:-translate-y-1.5 hover:shadow-[0_25px_70px_-15px_rgba(255,215,0,0.5)] active:translate-y-0 active:scale-[0.98] overflow-hidden animate-[fadeIn_0.6s_ease_both] cursor-pointer w-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover-свечение */}
      <div
        aria-hidden
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${card.accent} 0%, transparent 50%)` }}
      />
      {/* Постоянное мягкое свечение по верху */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px opacity-60"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.8), transparent)" }}
      />
      {/* Угловые засечки */}
      <span aria-hidden className="absolute top-2 left-2 w-3.5 h-3.5 border-l-2 border-t-2 border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute top-2 right-2 w-3.5 h-3.5 border-r-2 border-t-2 border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-2 left-2 w-3.5 h-3.5 border-l-2 border-b-2 border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
      <span aria-hidden className="absolute bottom-2 right-2 w-3.5 h-3.5 border-r-2 border-b-2 border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />

      <div className="relative flex flex-col h-full gap-3.5">
        {/* Бейдж */}
        <span className="self-start font-roboto text-[9px] font-bold uppercase tracking-[0.25em] text-[#FFD700] bg-[#FFD700]/15 border border-[#FFD700]/40 px-2 py-0.5 rounded-sm">
          {card.badge}
        </span>

        {/* Иконка-медальон с золотой обводкой */}
        <div className="relative w-16 h-16 rounded-full p-[2px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_24px_rgba(255,215,0,0.4)] group-hover:shadow-[0_0_36px_rgba(255,215,0,0.7)] transition-all">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Icon name={card.icon as Parameters<typeof Icon>[0]["name"]} size={30} className="text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
          </div>
        </div>

        {/* Заголовок */}
        <h3 className="font-oswald font-bold text-lg sm:text-xl uppercase tracking-wide text-white leading-tight">
          {card.title}
        </h3>

        {/* Подзаголовок */}
        <p className="font-roboto text-[13px] text-white/65 leading-relaxed flex-1">
          {card.subtitle}
        </p>

        {/* Гарантия */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-[#FFD700]/15 group-hover:border-[#FFD700]/40 transition-colors">
          <Icon name={card.guaranteeIcon as Parameters<typeof Icon>[0]["name"]} size={14} className="text-[#FFD700]" />
          <span className="font-roboto text-[11px] uppercase tracking-wider text-[#FFD700]/95 font-semibold">
            {card.guarantee}
          </span>
        </div>

        {/* CTA-плашка как у настоящей кнопки */}
        <div className="flex items-center justify-between gap-2 mt-1 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-[#FFD700]/10 via-[#FFD700]/15 to-[#FFD700]/10 border border-[#FFD700]/30 group-hover:from-[#FFD700] group-hover:via-[#fff3a0] group-hover:to-[#FFD700] group-hover:border-[#FFD700] transition-all duration-300">
          <span className="font-oswald font-bold text-[12px] uppercase tracking-widest text-[#FFD700] group-hover:text-black transition-colors">
            {card.cta}
          </span>
          <Icon name="ArrowRight" size={16} className="text-[#FFD700] group-hover:text-black group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </button>
  );
}