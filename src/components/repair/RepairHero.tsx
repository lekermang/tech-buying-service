import { memo, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import TypeWriter from "@/components/fx/TypeWriter";
import FloatingBadges from "@/components/fx/FloatingBadges";
import MagneticButton from "@/components/fx/MagneticButton";
import CountUp from "@/components/fx/CountUp";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "./repairContacts";
// CountUp используется в StatsRow ниже

/* 6 преимуществ — компактная сетка 2×3 */
const ADVANTAGES = [
  { icon: "MapPin",     text: "Кирова, 7 — центр" },
  { icon: "Zap",        text: "20–60 мин при вас"  },
  { icon: "Cpu",        text: "BGA-пайка плат"     },
  { icon: "Gift",       text: "Диагностика 0 ₽"    },
  { icon: "Clock",      text: "9:00–21:00 ежедн."  },
  { icon: "BadgeCheck", text: "Гарантия 12 мес"    },
];

const TYPEWRITER_PHRASES = [
  "iPhone, iPad — любые модели",
  "Samsung Galaxy — все серии",
  "BGA-пайка и ремонт плат",
  "Ремонт после воды — срочно",
  "Xiaomi, POCO, Redmi — ремонт",
  "Снятие FRP и разблокировка",
];

const STATS = [
  { value: 4800, suffix: "+",    label: "ремонтов"  },
  { value: 12,   suffix: " мес", label: "гарантия"  },
  { value: 20,   suffix: " мин", label: "при вас"   },
];

/* Изолируем CountUp-анимацию — не перерисовывает Hero */
const StatsRow = memo(function StatsRow() {
  return (
    <div className="flex items-center gap-5 sm:gap-8 mb-5 flex-wrap">
      {STATS.map(s => (
        <div key={s.label} className="flex flex-col">
          <span className="font-oswald font-black text-xl sm:text-2xl leading-none"
            style={{ color: "#FFD700", textShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
            <CountUp to={s.value} suffix={s.suffix} duration={1800} />
          </span>
          <span className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mt-0.5">{s.label}</span>
        </div>
      ))}
      <div className="hidden sm:flex flex-col ml-auto">
        <div className="flex gap-0.5 mb-0.5">
          {[1,2,3,4,5].map(i => <Icon key={i} name="Star" size={11} style={{ color: "#FFD700", fill: "#FFD700" }} />)}
        </div>
        <span className="font-roboto text-[10px] text-white/30 uppercase tracking-widest">3 460 отзывов</span>
      </div>
    </div>
  );
});

function useParallax(ref: React.RefObject<HTMLElement | null>, speed = 0.35) {
  useEffect(() => {
    /* Параллакс только на десктопе — на мобиле вызывает лаги */
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;
    const onScroll = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref, speed]);
}

export default function RepairHero({ onOrder }: { onOrder: () => void }) {
  const bgRef  = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef,  0.35);
  useParallax(txtRef, 0.1);

  return (
    <section className="relative overflow-hidden px-4 sm:px-8
      pt-8 pb-10 sm:pt-14 sm:pb-18 lg:pt-18 lg:pb-24
      min-h-[90vh] sm:min-h-[80vh] flex items-center">

      {/* Параллакс-фон (только десктоп) */}
      <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform hidden sm:block">
        <div className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[450px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse at 50% 30%,rgba(255,215,0,0.13) 0%,transparent 70%)" }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.035) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.18),transparent)" }} />
      </div>

      {/* Плавающие бейджи — только lg */}
      <FloatingBadges />

      {/* Контент */}
      <div ref={txtRef} className="relative max-w-3xl mx-auto w-full z-10">

        {/* Бейдж */}
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/22
          text-[#FFD700] px-3 py-1.5 rounded-full text-[11px] font-medium mb-4 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
          </span>
          Сервисный центр · центр Калуги
        </div>

        {/* H1 */}
        <h1 className="font-oswald font-black uppercase leading-[0.93] mb-2.5 tracking-tight
          text-[clamp(2.6rem,11vw,5rem)]">
          <span className="block bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 30px rgba(255,215,0,0.25))" }}>
            Ремонт24
          </span>
          <span className="block text-white/90">в Калуге</span>
        </h1>

        {/* H2 */}
        <h2 className="font-oswald font-normal uppercase tracking-wide leading-snug mb-2
          text-[clamp(0.85rem,3vw,1.2rem)] text-white/50">
          Сервисный центр «Скупка24» ·
          Ремонт телефонов, планшетов и ноутбуков
        </h2>

        {/* TypeWriter */}
        <div className="mb-4 h-5 font-roboto text-[0.78rem] text-white/35">
          <TypeWriter phrases={TYPEWRITER_PHRASES} typingSpeed={60} deletingSpeed={30} pauseMs={2200} />
        </div>

        {/* Описание — короткое */}
        <p className="text-white/48 leading-relaxed mb-5 text-[0.88rem] sm:text-[0.95rem] max-w-xl">
          iPhone, Android — все бренды.{" "}
          <strong className="text-white/75 font-medium">BGA-пайка и компонентный ремонт плат</strong>,
          снятие FRP, iCloud.{" "}
          <strong className="text-white/75 font-medium">Срочно — прямо при вас.</strong>
        </p>

        {/* ══ ФИШКА 90% ══ */}
        <div className="relative mb-5 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(255,215,0,0.08) 0%,rgba(255,100,0,0.05) 100%)",
            border: "1px solid rgba(255,215,0,0.2)",
          }}>
          {/* Полоска сверху */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.6),transparent)" }} />

          <div className="px-4 py-3 flex items-center gap-3">
            {/* Большой процент */}
            <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl"
              style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)" }}>
              <span className="font-oswald font-black text-2xl leading-none text-[#FFD700]">90%</span>
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-base sm:text-lg text-white uppercase leading-tight mb-0.5">
                ремонтов за 60 минут
              </div>
              <p className="font-roboto text-[11px] sm:text-xs text-white/45 leading-relaxed">
                Не нужно ждать днями и неделями — большинство задач мастер решает прямо при вас
              </p>
            </div>

            {/* Иконка-индикатор */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <Icon name="Timer" size={20} className="text-[#FFD700]" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.5))" }} />
              <span className="font-roboto text-[9px] text-[#FFD700]/50 uppercase tracking-wider">быстро</span>
            </div>
          </div>

          {/* Прогресс-бар 90% */}
          <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,215,0,0.1)" }}>
            <div className="h-full rounded-full" style={{ width: "90%", background: "linear-gradient(90deg,#b8860b,#FFD700,#fff3a0)", boxShadow: "0 0 8px rgba(255,215,0,0.5)" }} />
          </div>
        </div>

        {/* CountUp статистика — изолирована в memo */}
        <StatsRow />

        {/* Преимущества — компактная 2×3 сетка */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-7">
          {ADVANTAGES.map(a => (
            <li key={a.text}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl
                bg-white/[0.03] border border-white/[0.06]
                text-white/60 text-[11px] sm:text-[12px] font-roboto">
              <span className="shrink-0 w-6 h-6 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/18 flex items-center justify-center">
                <Icon name={a.icon} size={12} className="text-[#FFD700]" />
              </span>
              {a.text}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="flex flex-col xs:flex-row gap-2.5">
          <MagneticButton
            onClick={onOrder}
            strength={0.25}
            className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide
              px-6 sm:px-8 py-3.5 rounded-xl text-sm sm:text-base active:scale-[0.97]
              inline-flex items-center justify-center gap-2 cursor-pointer flex-1 xs:flex-none
              bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
              shadow-[0_0_0_1px_rgba(255,215,0,0.4),0_6px_20px_rgba(255,215,0,0.25)]
              hover:shadow-[0_0_0_1px_rgba(255,215,0,0.7),0_10px_28px_rgba(255,215,0,0.45)]
              transition-shadow duration-150">
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.65)_50%,transparent_65%)]
              bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-600 pointer-events-none" />
            <Icon name="Zap" size={15} className="relative shrink-0" />
            <span className="relative">Рассчитать стоимость</span>
          </MagneticButton>

          <MagneticButton
            as="a"
            href={REPAIR_PHONE_TEL}
            strength={0.2}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_hero" })}
            className="group border border-[#FFD700]/30 hover:border-[#FFD700]/65
              text-[#FFD700] px-5 sm:px-7 py-3.5 rounded-xl text-sm font-oswald font-bold
              uppercase tracking-wide active:scale-[0.97] transition-all
              inline-flex items-center justify-center gap-2 cursor-pointer
              bg-[#FFD700]/[0.06] hover:bg-[#FFD700]/[0.10]">
            <Icon name="Phone" size={14} />
            {REPAIR_PHONE_DISPLAY}
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}