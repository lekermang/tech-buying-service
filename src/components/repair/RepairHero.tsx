import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "./repairContacts";

const ADVANTAGES = [
  { icon: "MapPin", text: "Ул. Кирова, 7 — центр Калуги" },
  { icon: "Zap", text: "Ремонт за 20–60 минут при вас" },
  { icon: "Cpu", text: "BGA-пайка и компонентный ремонт" },
  { icon: "Gift", text: "Бесплатная диагностика" },
  { icon: "Clock", text: "Ежедневно с 9:00 до 21:00" },
  { icon: "BadgeCheck", text: "Гарантия до 12 месяцев" },
];

/** Apple-параллакс: слой уходит вверх при скролле (ощущение глубины) */
function useParallax(ref: React.RefObject<HTMLElement | null>, speed = 0.35) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const y = window.scrollY;
      el.style.transform = `translateY(${y * speed}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, speed]);
}

export default function RepairHero({ onOrder }: { onOrder: () => void }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef, 0.4);   // фоновое свечение — быстрее
  useParallax(textRef, 0.15); // текст — медленнее (как Apple)

  return (
    <section className="relative overflow-hidden px-4 sm:px-8 pt-14 pb-16 sm:pt-24 sm:pb-24 min-h-[70vh] flex items-center">
      {/* Параллакс-слой: фоновые свечения */}
      <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[130px]"
          style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(255,215,0,0.13) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]"
          style={{ background: "rgba(34,158,217,0.06)" }} />
        {/* Сетка в стиле Apple */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        {/* Горизонтальный линейный акцент */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.2), transparent)" }} />
      </div>

      {/* Параллакс-слой: контент — медленнее фона */}
      <div ref={textRef} className="relative will-change-transform max-w-3xl mx-auto w-full z-10">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5 backdrop-blur-sm">
          <Icon name="Wrench" size={14} />
          Ремонт телефонов в Калуге
        </div>

        {/* H1 + H2 в стиле Apple */}
        <h1 className="font-oswald font-bold uppercase leading-[1.0] text-4xl sm:text-6xl lg:text-7xl mb-4 tracking-tight">
          <span
            className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}
          >
            Ремонт24
          </span>
          <br />
          <span className="text-white/90">в Калуге</span>
        </h1>

        <h2 className="font-oswald text-lg sm:text-2xl text-white/60 font-normal uppercase tracking-wide mb-6 leading-snug">
          Сервисный центр Скупка24.<br className="hidden sm:block" />
          Ремонт телефонов, планшетов и ноутбуков любой сложности
        </h2>

        <p className="text-white/50 text-sm sm:text-lg max-w-2xl leading-relaxed mb-7">
          iPhone, Android — все бренды мира. Замена экранов и аккумуляторов,&nbsp;
          <strong className="text-white/75 font-medium">BGA-пайка и компонентный ремонт плат</strong>,
          снятие FRP, разблокировка iCloud. Срочный ремонт прямо при вас.
        </p>

        {/* Преимущества-галочки */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-5 mb-9 text-left">
          {ADVANTAGES.map((a) => (
            <li key={a.text} className="flex items-center gap-2 text-white/75 text-[13px] sm:text-[14px]">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/20 flex items-center justify-center">
                <Icon name={a.icon} size={13} className="text-[#FFD700]" />
              </span>
              {a.text}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOrder}
            className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center justify-center gap-2
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]"
          >
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <Icon name="Zap" size={18} className="relative" />
            <span className="relative">Рассчитать стоимость</span>
            <Icon name="ArrowRight" size={16} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
          <a
            href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_hero" })}
            className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center justify-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
              <Icon name="Phone" size={14} />
            </div>
            {REPAIR_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}