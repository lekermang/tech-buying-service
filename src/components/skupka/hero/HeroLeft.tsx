import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

interface HeroLeftProps {
  onOpenModal: () => void;
}

/* ── Эффект 5: счётчик от 0 до target ── */
function useCountUp(target: number, decimals = 0, enabled: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const duration = 1800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(parseFloat((eased * target).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, enabled]);
  return val;
}

const STATS = [
  { id: "clients", target: 50000, label: "клиентов", suffix: "+", icon: "Users" as const, decimals: 0, formatFn: (v: number) => v >= 1000 ? `${Math.round(v / 1000) * 1000 >= 50000 ? "50 000" : (Math.round(v / 1000)).toString() + " 000"}` : String(Math.round(v)) },
  { id: "years",   target: 9,     label: "на рынке", suffix: " лет", icon: "Award" as const, decimals: 0, formatFn: (v: number) => String(Math.round(v)) },
  { id: "rating",  target: 4.9,   label: "на картах", suffix: " ★",  icon: "Star" as const,  decimals: 1, formatFn: (v: number) => v.toFixed(1) },
];

export default function HeroLeft({ onOpenModal }: HeroLeftProps) {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const c0 = useCountUp(STATS[0].target, STATS[0].decimals, statsVisible);
  const c1 = useCountUp(STATS[1].target, STATS[1].decimals, statsVisible);
  const c2 = useCountUp(STATS[2].target, STATS[2].decimals, statsVisible);
  const counts = [c0, c1, c2];

  return (
    <div className="flex flex-col">

      {/* Бейдж «24/7» с настоящей пульсирующей точкой онлайн */}
      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 px-3.5 py-1.5 mb-5 md:mb-6 self-start rounded-full shadow-[0_0_24px_rgba(255,215,0,0.1)]">
        <span className="online-dot" />
        <span className="font-roboto text-[11px] md:text-xs text-[#FFD700] uppercase tracking-[0.25em] font-semibold">Работаем 24/7 без выходных</span>
      </div>

      {/* Продающий заголовок */}
      <h1 className="font-oswald text-[3rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.92] mb-4 md:mb-5 tracking-tight">
        <span className="block text-white">ПРОДАЙ</span>
        <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">ТЕХНИКУ</span>
        <span className="block text-white">
          ВЫГОДНО
          <span className="text-[#FFD700]">.</span>
        </span>
      </h1>

      {/* Подзаголовок */}
      <p className="font-roboto text-white/75 text-sm sm:text-base md:text-lg mb-5 md:mb-7 max-w-md leading-relaxed">
        Честная оценка <span className="text-[#FFD700] font-semibold">за 15 минут</span>. Смартфоны, ноутбуки, ювелирные украшения — принимаем всё. <span className="text-[#FFD700] font-semibold">Выплата</span> в день обращения.
      </p>

      {/* USP-чипы */}
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

      {/* Премиум-CTA — Эффект 1 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-7 md:mb-9">
        <button
          onClick={() => { onOpenModal(); ymGoal(Goals.FORM_OPEN, { place: "hero" }); }}
          className="btn-cta-yellow group relative overflow-hidden font-oswald font-bold text-black text-base sm:text-lg px-7 sm:px-9 py-4 uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 rounded-md
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]">
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

      {/* Счётчики доверия — Эффект 5 */}
      <div ref={statsRef} className="grid grid-cols-3 gap-2 md:gap-3 pb-6 md:pb-8">
        {STATS.map((s, i) => (
          <div key={s.label} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative bg-black/50 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-3 py-3 md:py-4 transition-colors rounded-md">
              <Icon name={s.icon} size={14} className="text-[#FFD700]/50 mb-1.5" />
              <div className="trust-counter-value font-oswald text-xl md:text-2xl font-bold text-[#FFD700] leading-none">
                {statsVisible ? `${s.formatFn(counts[i])}${s.suffix}` : "—"}
              </div>
              <div className="font-roboto text-white/50 text-[10px] md:text-xs uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Нижний слоган */}
      <div className="hidden lg:flex items-center gap-2 self-start bg-black/40 border border-[#FFD700]/25 px-4 py-2 rounded-full">
        <span className="text-lg">🍎</span>
        <span className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide">Купим дороже всех Apple технику!</span>
      </div>
    </div>
  );
}
