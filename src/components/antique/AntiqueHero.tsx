import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const PHONE_TEL = "tel:+79929990333";
const PHONE_DISPLAY = "8 992 999-03-33";

const TRUST = [
  { icon: "Award", v: "10+ лет", t: "скупаем антиквариат" },
  { icon: "Banknote", v: "День в день", t: "выплата деньгами" },
  { icon: "FileCheck", v: "Договор", t: "официальный документ" },
  { icon: "Search", v: "Аукционные", t: "справочные цены" },
];

function useParallax(ref: React.RefObject<HTMLDivElement | null>, speed: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [ref, speed]);
}

type Props = {
  scrolled: boolean;
  onScrollToForm: () => void;
};

export default function AntiqueHero({ scrolled, onScrollToForm }: Props) {
  const bgRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef, 0.35);

  return (
    <>
      {/* ── Навбар ── */}
      <nav className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-colors ${
        scrolled ? "bg-[#0d0d0d]/90 border-[#FFD700]/15 backdrop-blur-md" : "bg-transparent border-transparent"
      }`}>
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 group-hover:bg-[#FFD700]/20 transition-colors">
            <Icon name="ChevronLeft" size={18} className="text-[#FFD700]" />
          </span>
          <span className="font-oswald text-xl font-bold">
            <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent">Скупка 24</span>
            <span className="block text-[9px] text-white/35 font-roboto font-normal uppercase tracking-[0.25em] mt-0.5">Антиквариат · Калуга</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a href={PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_nav" })}
            className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
            <Icon name="Phone" size={14} />
            {PHONE_DISPLAY}
          </a>
          <button onClick={onScrollToForm}
            className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-5 py-2.5 rounded-lg text-sm active:scale-95 transition-all
                       bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                       shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                       hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_8px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative">Оценить</span>
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 sm:px-8 pt-12 pb-14 sm:pt-20 sm:pb-20">
        <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,215,0,0.11) 0%,transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
            </span>
            Оценка за 15 минут · Калуга
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-start">
            <div>
              <h1 className="font-oswald font-bold uppercase leading-[1.0] text-4xl sm:text-6xl lg:text-7xl mb-4 tracking-tight">
                <span className="text-white/90">Скупка</span><br />
                <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
                  style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}>
                  антиквариата
                </span><br />
                <span className="text-white/90">в Калуге</span>
              </h1>

              <p className="text-white/55 text-base sm:text-xl leading-relaxed mb-7 max-w-2xl">
                Монеты, иконы, фарфор, бронза, советские ордена — покупаем всё.
                Оценка по международным аукционным каталогам, выплата в&nbsp;день обращения.
              </p>

              {/* USP-чипы */}
              <div className="flex flex-wrap gap-2 mb-8">
                {["Бесплатная оценка", "Выезд на дом", "Официальный договор", "Деньги сразу", "Аукционные цены", "Работаем с 2014 г."].map(t => (
                  <div key={t} className="flex items-center gap-1.5 bg-black/40 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-2.5 py-1.5 rounded-md transition-colors">
                    <Icon name="Check" size={11} className="text-[#FFD700]" />
                    <span className="font-roboto text-white/75 text-[11px] sm:text-xs">{t}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={onScrollToForm}
                  className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-8 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center justify-center gap-2
                             bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                             shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                             hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <Icon name="Zap" size={18} className="relative" />
                  <span className="relative">Оценить бесплатно</span>
                  <Icon name="ArrowRight" size={16} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href={PHONE_TEL}
                  onClick={() => ymGoal(Goals.CALL_CLICK, { place: "antique_hero" })}
                  className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-8 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center justify-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
                    <Icon name="Phone" size={14} />
                  </div>
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            {/* Плашки доверия */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:w-52">
              {TRUST.map(p => (
                <div key={p.t} className="bg-[#111]/70 border border-white/[0.07] rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-sm lg:flex-row">
                  <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                    <Icon name={p.icon} size={18} className="text-[#FFD700]" />
                  </div>
                  <div>
                    <div className="font-oswald font-bold text-sm text-white">{p.v}</div>
                    <div className="text-white/40 text-[11px] leading-tight">{p.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
