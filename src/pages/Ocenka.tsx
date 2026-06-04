/**
 * Рекламная посадочная страница /ocenka
 * Оценка устройства онлайн — Скупка24 Калуга
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import DigitalParticles from "@/components/fx/DigitalParticles";
import EvaluateInline from "@/components/skupka/EvaluateInline";
import { REPAIR_PHONE_TEL } from "@/components/repair/repairContacts";

const PHONE_DISPLAY = "8 992 999-03-33";

const STEPS = [
  { icon: "ClipboardList", title: "Заполните форму", text: "Укажите модель и состояние устройства — это займёт 1 минуту" },
  { icon: "MessageCircle", title: "Получите оценку", text: "Менеджер свяжется за 15 минут и назовёт точную цену" },
  { icon: "MapPin", title: "Приезжайте", text: "Калуга, ул. Кирова, 7 — проверим и выплатим деньги сразу" },
];

const ACCEPTS = [
  { icon: "Smartphone", label: "iPhone 6–16", sub: "любое состояние" },
  { icon: "Tablet", label: "iPad / планшеты", sub: "все поколения" },
  { icon: "Laptop", label: "MacBook / ноутбуки", sub: "любые бренды" },
  { icon: "Gamepad2", label: "PlayStation / Xbox", sub: "PS4, PS5, Xbox" },
  { icon: "Watch", label: "Apple Watch / AirPods", sub: "и другие TWS" },
  { icon: "Smartphone", label: "Android-смартфоны", sub: "Samsung, Xiaomi..." },
];

const REVIEWS = [
  { name: "Алексей Д.", text: "Оценили iPhone 13 онлайн за 10 минут, приехал — деньги на карту сразу. Рекомендую!", stars: 5 },
  { name: "Мария К.", text: "Сдала MacBook Pro — дали больше, чем другие скупки. Всё честно, договор сразу.", stars: 5 },
  { name: "Дмитрий В.", text: "Приятно удивил подход: показали реальную рыночную цену, не пытались занизить.", stars: 5 },
];

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="Star" size={12} className={i < n ? "text-[#FFD700]" : "text-white/20"} />
      ))}
    </div>
  );
}

function useParallax(ref: React.RefObject<HTMLDivElement | null>, speed: number) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fn = () => { el.style.transform = `translateY(${window.scrollY * speed}px)`; };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [ref, speed]);
}

export default function Ocenka() {
  const [scrolled, setScrolled] = useState(false);
  const bgRef = useRef<HTMLDivElement>(null);
  useParallax(bgRef, 0.35);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Оценка онлайн — Скупка24 Калуга | Выкуп техники за 15 минут";
    const desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (desc) desc.content = "Оцените своё устройство онлайн — iPhone, Samsung, MacBook, PlayStation. Скупка24 в Калуге. Ответим за 15 минут, деньги сразу. Честная оценка, официальный договор. Ул. Кирова, 7.";
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("ocenka-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      {/* Фон */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[130px]"
          style={{ background: "rgba(255,215,0,0.10)" }} />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(34,158,217,0.05)" }} />
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 70%)",
          }} />
      </div>

      <div className="relative z-10">
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
              <span className="block text-[9px] text-white/35 font-roboto font-normal uppercase tracking-[0.25em] mt-0.5">Калуга</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href={REPAIR_PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ocenka_nav" })}
              className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
              <Icon name="Phone" size={14} />
              {PHONE_DISPLAY}
            </a>
            <button onClick={scrollToForm}
              className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-6 py-2.5 rounded-lg text-sm active:scale-95 transition-all
                         bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                         shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                         hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_8px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]">
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative">Оценить устройство</span>
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-4 sm:px-8 pt-10 pb-8 sm:pt-16 sm:pb-12">
          <div ref={bgRef} aria-hidden className="pointer-events-none absolute inset-0 will-change-transform">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-[120px]"
              style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(255,215,0,0.12) 0%,transparent 70%)" }} />
          </div>

          <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            {/* Левая колонка — текст */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5">
                <Icon name="Zap" size={14} />
                Оценка за 15 минут · Калуга
              </div>

              <h1 className="font-oswald font-bold uppercase leading-[1.0] text-4xl sm:text-6xl mb-4 tracking-tight">
                <span className="text-white/90">Оцените</span><br />
                <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent"
                  style={{ filter: "drop-shadow(0 0 40px rgba(255,215,0,0.3))" }}>
                  устройство
                </span><br />
                <span className="text-white/90">онлайн</span>
              </h1>

              <p className="text-white/55 text-base sm:text-xl leading-relaxed mb-7 max-w-lg">
                Скупка24 — честный выкуп техники в Калуге с&nbsp;
                <strong className="text-white/85">2015 года</strong>. Ответим за 15 минут,
                выплатим деньги в день обращения.
              </p>

              {/* Доверие-плашки */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                {[
                  { icon: "Clock", v: "15 минут", t: "до ответа менеджера" },
                  { icon: "Banknote", v: "День в день", t: "выплата деньгами" },
                  { icon: "FileCheck", v: "Договор", t: "официальный документ" },
                  { icon: "Star", v: "5.0 ★", t: "на Яндекс.Картах" },
                ].map(p => (
                  <div key={p.t} className="bg-[#111]/70 border border-white/[0.07] rounded-xl p-3.5 flex items-center gap-3 backdrop-blur-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                      <Icon name={p.icon} size={18} className="text-[#FFD700]" />
                    </div>
                    <div>
                      <div className="font-oswald font-bold text-sm text-white">{p.v}</div>
                      <div className="text-white/40 text-[11px]">{p.t}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToForm}
                  className="group relative overflow-hidden text-black font-oswald font-bold uppercase tracking-wide px-7 py-4 rounded-xl text-base active:scale-95 transition-all inline-flex items-center gap-2
                             bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                             shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]
                             hover:shadow-[0_0_0_1px_rgba(255,215,0,0.9),0_14px_40px_rgba(255,215,0,0.55),inset_0_1px_0_rgba(255,255,255,0.6)]">
                  <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  <Icon name="Zap" size={18} className="relative" />
                  <span className="relative">Оценить онлайн</span>
                  <Icon name="ArrowRight" size={16} className="relative opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href={REPAIR_PHONE_TEL}
                  onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ocenka_hero" })}
                  className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] px-7 py-4 rounded-xl text-base font-oswald font-bold uppercase tracking-wide active:scale-95 transition-all inline-flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
                    <Icon name="Phone" size={14} />
                  </div>
                  Позвонить
                </a>
              </div>
            </div>

            {/* Правая колонка — форма (видна сразу) */}
            <div id="ocenka-form" className="scroll-mt-24">
              <EvaluateInline source="ocenka_hero_form" />
            </div>
          </div>
        </section>

        {/* ── Что принимаем ── */}
        <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
          <div className="text-center mb-7">
            <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
              Что мы <span className="text-[#FFD700]">выкупаем</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACCEPTS.map(a => (
              <div key={a.label} className="bg-[#111]/80 border border-white/[0.07] hover:border-[#FFD700]/40 rounded-xl p-4 flex items-center gap-3 transition-all backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center shrink-0">
                  <Icon name={a.icon} size={20} className="text-[#FFD700]" />
                </div>
                <div>
                  <div className="font-oswald text-sm font-semibold uppercase">{a.label}</div>
                  <div className="text-white/40 text-[11px]">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3 шага ── */}
        <section className="border-y border-[#FFD700]/10 bg-[#111]/70 backdrop-blur-sm px-4 sm:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
                Как это <span className="text-[#FFD700]">работает</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#FFD700] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)]">
                    <Icon name={s.icon} size={22} className="text-black" />
                  </div>
                  <div className="text-white/30 text-xs font-roboto mb-1">Шаг {i + 1}</div>
                  <div className="font-oswald text-base font-bold uppercase mb-2">{s.title}</div>
                  <div className="text-white/50 text-[13px] leading-relaxed">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Отзывы ── */}
        <section className="px-4 sm:px-8 py-12 max-w-5xl mx-auto">
          <div className="text-center mb-7">
            <h2 className="font-oswald text-2xl sm:text-3xl font-bold uppercase">
              Отзывы <span className="text-[#FFD700]">клиентов</span>
            </h2>
            <p className="text-white/40 text-sm mt-1">5.0 ★ на Яндекс.Картах</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {REVIEWS.map(r => (
              <div key={r.name} className="bg-[#111]/80 border border-white/[0.07] rounded-2xl p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/30 flex items-center justify-center font-oswald text-[#FFD700] text-sm font-bold">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="font-oswald text-sm font-semibold">{r.name}</div>
                    <Stars n={r.stars} />
                  </div>
                </div>
                <p className="text-white/60 text-[13px] leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Адрес ── */}
        <section className="px-4 sm:px-8 py-12 max-w-3xl mx-auto text-center">
          <div className="bg-[#111]/80 border border-[#FFD700]/20 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="MapPin" size={24} className="text-[#FFD700]" />
            </div>
            <h2 className="font-oswald text-xl font-bold uppercase mb-2">Где мы находимся</h2>
            <p className="text-white/70 text-base mb-1 font-medium">Калуга, ул. Кирова, 7 (1 этаж)</p>
            <p className="text-white/40 text-sm mb-5">Ежедневно с 9:00 до 21:00, без выходных</p>
            <a href={REPAIR_PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "ocenka_address" })}
              className="inline-flex items-center gap-2 text-[#FFD700] font-oswald font-bold text-xl hover:text-[#ffed4a] transition-colors">
              <Icon name="Phone" size={20} />
              {PHONE_DISPLAY}
            </a>
          </div>
        </section>

        {/* Подвал */}
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a]/80 px-4 py-8 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-oswald text-white/60 uppercase tracking-wide">Скупка 24 · Калуга</span>
          </div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-[#FFD700] hover:text-[#ffed4a] font-roboto transition-colors text-sm mt-2">
            <Icon name="ArrowLeft" size={14} />
            На главную
          </Link>
        </footer>
      </div>
    </div>
  );
}