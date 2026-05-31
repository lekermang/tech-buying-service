import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

interface HeroLeftProps {
  onOpenModal: () => void;
}

export default function HeroLeft({ onOpenModal }: HeroLeftProps) {
  return (
    <div className="flex flex-col">

      {/* Бейдж «24/7» — премиум-капсула как в секциях Trade In */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 px-3.5 py-1.5 mb-5 md:mb-6 self-start rounded-full shadow-[0_0_24px_rgba(255,215,0,0.1)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
        </span>
        <span className="font-roboto text-[11px] md:text-xs text-[#FFD700] uppercase tracking-[0.25em] font-semibold">Работаем 24/7 без выходных</span>
      </div>

      {/* Продающий заголовок с премиум-градиентом */}
      <h1 className="font-oswald text-[3rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.92] mb-4 md:mb-5 tracking-tight">
        <span className="block text-white">ПРОДАЙ</span>
        <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">ТЕХНИКУ</span>
        <span className="block text-white">
          ВЫГОДНО
          <span className="text-[#FFD700]">.</span>
        </span>
      </h1>

      {/* Подзаголовок с ключевыми триггерами */}
      <p className="font-roboto text-white/75 text-sm sm:text-base md:text-lg mb-5 md:mb-7 max-w-md leading-relaxed">
        Честная оценка <span className="text-[#FFD700] font-semibold">за 15 минут</span>. Смартфоны, ноутбуки, ювелирные украшения — принимаем всё. <span className="text-[#FFD700] font-semibold">Выплата</span> в день обращения.
      </p>

      {/* USP-чипы (продающие триггеры) */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {[
          { icon: "Zap" as const, label: "За 15 минут" },
          { icon: "BadgeCheck" as const, label: "Честная цена" },
          { icon: "Banknote" as const, label: "Деньги сразу" },
          { icon: "FileText" as const, label: "Договор" },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-1.5 bg-black/40 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-2.5 py-1.5 rounded-md transition-colors">
            <Icon name={f.icon} size={12} className="text-[#FFD700]" />
            <span className="font-roboto text-white/80 text-[11px] uppercase tracking-wide">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Премиум-CTA */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7 md:mb-9">
        <button onClick={() => { onOpenModal(); ymGoal(Goals.FORM_OPEN, { place: "hero" }); }}
          className="group relative overflow-hidden font-oswald font-bold text-black text-base sm:text-lg px-7 sm:px-9 py-4 uppercase tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 rounded-md
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_12px_40px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]">
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <Icon name="Zap" size={18} className="relative" />
          <span className="relative">Оценить онлайн</span>
          <Icon name="ArrowRight" size={16} className="relative opacity-60 group-hover:translate-x-1 transition-transform" />
        </button>
        <a href="tel:+79929990333"
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "hero" })}
          className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] font-oswald font-bold text-base sm:text-lg px-6 sm:px-8 py-4 uppercase tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2.5 rounded-md">
          <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
            <Icon name="Phone" size={14} />
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-[#FFD700]/60 tracking-wider">Звонок бесплатный</span>
            <span>Позвонить</span>
          </div>
        </a>
      </div>

      {/* Социальные доказательства — премиум-стат-блок */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 pb-6 md:pb-8">
        {[
          { num: "50 000+", label: "клиентов", icon: "Users" as const },
          { num: "9 лет", label: "на рынке", icon: "Award" as const },
          { num: "4.9 ★", label: "на картах", icon: "Star" as const },
        ].map((s) => (
          <div key={s.label} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative bg-black/50 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-3 py-3 md:py-4 transition-colors rounded-md">
              <Icon name={s.icon} size={14} className="text-[#FFD700]/50 mb-1.5" />
              <div className="font-oswald text-xl md:text-2xl font-bold text-[#FFD700] leading-none">{s.num}</div>
              <div className="font-roboto text-white/50 text-[10px] md:text-xs uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Нижний слоган-триггер */}
      <div className="hidden lg:flex items-center gap-2 self-start bg-black/40 border border-[#FFD700]/25 px-4 py-2 rounded-full">
        <span className="text-lg">🍎</span>
        <span className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide">Купим дороже всех Apple технику!</span>
      </div>
    </div>
  );
}
