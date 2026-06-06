import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "./repairContacts";

const ADVANTAGES = [
  { icon: "MapPin",       text: "Ул. Кирова, 7 — центр Калуги" },
  { icon: "Zap",          text: "Ремонт за 20–60 минут при вас" },
  { icon: "Cpu",          text: "BGA-пайка и компонентный ремонт" },
  { icon: "Gift",         text: "Бесплатная диагностика" },
  { icon: "Clock",        text: "Ежедневно с 9:00 до 21:00" },
  { icon: "BadgeCheck",   text: "Гарантия до 12 месяцев" },
];

function useParallax(ref: React.RefObject<HTMLElement | null>, speed = 0.35) {
  useEffect(() => {
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
  useParallax(bgRef,  0.4);
  useParallax(txtRef, 0.15);

  return (
    <section className="relative overflow-hidden px-4 sm:px-8 pt-10 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-28 min-h-[80vh] sm:min-h-[75vh] flex items-center">

      {/* Параллакс-фон */}
      <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
        <div className="absolute top-[-8%] left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[480px] rounded-full blur-[130px]"
          style={{ background: "radial-gradient(ellipse at 50% 30%,rgba(255,215,0,0.14) 0%,transparent 70%)" }} />
        <div className="absolute bottom-0 right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: "rgba(34,158,217,0.07)" }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.04) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.2),transparent)" }} />
      </div>

      {/* Контент */}
      <div ref={txtRef} className="relative will-change-transform max-w-3xl mx-auto w-full z-10">

        {/* Бейдж */}
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/25 text-[#FFD700] px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-sm font-medium mb-5 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-60 animate-ping" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FFD700]" />
          </span>
          Сервисный центр в центре Калуги
        </div>

        {/* H1 */}
        <h1 className="font-oswald font-black uppercase leading-[0.95] mb-3 tracking-tight
          text-[clamp(2.6rem,11vw,5.5rem)]">
          <span className="block bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
            style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}>
            Ремонт24
          </span>
          <span className="block text-white/90">в Калуге</span>
        </h1>

        {/* H2 */}
        <h2 className="font-oswald font-normal uppercase tracking-wide leading-snug mb-5
          text-[clamp(0.95rem,3.5vw,1.35rem)] text-white/55">
          Сервисный центр «Скупка24».<br className="hidden sm:block" />
          Ремонт телефонов, планшетов и ноутбуков любой сложности
        </h2>

        {/* Описание */}
        <p className="text-white/50 leading-relaxed mb-7
          text-[clamp(0.85rem,2.5vw,1.05rem)] max-w-2xl">
          iPhone, Android — все бренды мира. Замена экранов и аккумуляторов,{" "}
          <strong className="text-white/80 font-medium">BGA-пайка и компонентный ремонт плат</strong>,
          снятие FRP, разблокировка iCloud.{" "}
          <strong className="text-white/80 font-medium">Срочный ремонт прямо при вас.</strong>
        </p>

        {/* Преимущества */}
        <ul className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-8">
          {ADVANTAGES.map(a => (
            <li key={a.text}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]
                text-white/70 text-[12px] sm:text-[13px] font-roboto">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-[#FFD700]/12 border border-[#FFD700]/20 flex items-center justify-center">
                <Icon name={a.icon} size={13} className="text-[#FFD700]" />
              </span>
              {a.text}
            </li>
          ))}
        </ul>

        {/* CTA-кнопки */}
        <div className="flex flex-col xs:flex-row gap-3">
          <button onClick={onOrder}
            className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide
              px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base active:scale-95 transition-all
              inline-flex items-center justify-center gap-2
              bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
              shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_8px_24px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
              hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_12px_32px_rgba(255,215,0,0.5)]">
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)]
              bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <Icon name="Zap" size={16} className="relative" />
            <span className="relative">Рассчитать стоимость</span>
            <Icon name="ArrowRight" size={14} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          <a href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_hero" })}
            className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/35 hover:border-[#FFD700]/70
              text-[#FFD700] px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-oswald font-bold
              uppercase tracking-wide active:scale-95 transition-all inline-flex items-center justify-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/35 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
              <Icon name="Phone" size={13} />
            </div>
            {REPAIR_PHONE_DISPLAY}
          </a>
        </div>
      </div>
    </section>
  );
}
