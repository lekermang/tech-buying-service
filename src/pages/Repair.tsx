import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import DigitalParticles from "@/components/fx/DigitalParticles";
import RepairSEO from "@/components/repair/RepairSEO";
import RepairHero from "@/components/repair/RepairHero";
import RepairStats from "@/components/repair/RepairStats";
import RepairFeatures from "@/components/repair/RepairFeatures";
import RepairPriceTable from "@/components/repair/RepairPriceTable";
import RepairServices from "@/components/repair/RepairServices";
import RepairAllDevices from "@/components/repair/RepairAllDevices";
import RepairParts from "@/components/repair/RepairParts";
import RepairHowItWorks from "@/components/repair/RepairHowItWorks";
import RepairModels from "@/components/repair/RepairModels";
import RepairLocation from "@/components/repair/RepairLocation";
import RepairReviews from "@/components/repair/RepairReviews";
import RepairFAQ from "@/components/repair/RepairFAQ";
import RepairSEOText from "@/components/repair/RepairSEOText";
import RepairSEOLinks from "@/components/repair/RepairSEOLinks";
import RepairTopBlock from "@/components/repair/RepairTopBlock";
import RepairBeforeAfter from "@/components/repair/RepairBeforeAfter";
import RepairUnlockBanner from "@/components/repair/RepairUnlockBanner";
import { REPAIR_PHONE_DISPLAY, REPAIR_PHONE_TEL } from "@/components/repair/repairContacts";

const SERVICE_LINKS = [
  { to: "/remont-iphone-kaluga",       label: "iPhone",      color: "#fff3a0" },
  { to: "/remont-samsung-kaluga",      label: "Samsung",     color: "#93c5fd" },
  { to: "/remont-xiaomi-kaluga",       label: "Xiaomi",      color: "#86efac" },
  { to: "/zamena-stekla-kaluga",       label: "Стекло",      color: "#c4b5fd" },
  { to: "/zamena-akkumulyatora-kaluga",label: "Аккумулятор", color: "#6ee7b7" },
  { to: "/remont-posle-vody-kaluga",   label: "После воды",  color: "#7dd3fc" },
  { to: "/bga-pajka-kaluga",           label: "BGA-пайка",   color: "#fca5a5" },
  { to: "/snyatie-frp-kaluga",         label: "FRP / iCloud",color: "#fdba74" },
];

export default function Repair() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("repair-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      <RepairSEO />

      {/* Фон */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(255,215,0,0.10)" }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(255,215,0,0.06)" }} />
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 75%)",
          }} />
      </div>

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════════
            STICKY HEADER — одна шапка на всю страницу
            ══════════════════════════════════════════════════════════ */}
        <header className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0d0d0d]/95 border-b border-[#FFD700]/15 backdrop-blur-lg shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            : "bg-[#0d0d0d]/70 border-b border-white/[0.06] backdrop-blur-sm"
        }`}>

          {/* Строка 1 — бренд + действия */}
          <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-3">

            {/* Левая часть: кнопка назад + бренд */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link to="/" aria-label="На главную Скупка24"
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#FFD700]/30 transition-all shrink-0 active:scale-95">
                <Icon name="ChevronLeft" size={18} className="text-white/60" />
              </Link>
              <div className="min-w-0 hidden xs:block">
                <div className="font-oswald font-black text-base sm:text-xl leading-none tracking-wide truncate"
                  style={{ background: "linear-gradient(90deg,#fff3a0,#FFD700,#b8860b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Ремонт24
                </div>
                <div className="font-roboto text-[9px] uppercase tracking-[0.2em] text-white/30 mt-0.5 hidden sm:block">
                  Сервисный центр · Калуга
                </div>
              </div>
            </div>

            {/* Правая часть: телефон + заявка */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_header" })}
                className="hidden md:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
                <Icon name="Phone" size={14} />
                {REPAIR_PHONE_DISPLAY}
              </a>
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_header_mobile" })}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#FFD700]/25 bg-[#FFD700]/10 text-[#FFD700] active:bg-[#FFD700]/20 transition-all">
                <Icon name="Phone" size={16} />
              </a>
              <button onClick={scrollToForm}
                className="inline-flex items-center gap-1.5 text-black font-oswald font-bold uppercase tracking-wide px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm active:scale-95 transition-all"
                style={{
                  background: "linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%)",
                  boxShadow: "0 0 0 1px rgba(255,215,0,0.4),0 4px 16px rgba(255,215,0,0.25)",
                }}>
                <Icon name="Zap" size={13} />
                Заявка
              </button>
            </div>
          </div>

          {/* Строка 2 — навигация по услугам (горизонтальный скролл) */}
          <div className="border-t border-white/[0.05] overflow-x-auto"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
            <div className="flex items-center gap-1 px-4 sm:px-8 py-1.5 min-w-max">
              {/* Разделы страницы */}
              {[
                { href: "#repair-form", label: "Заявка"   },
                { href: "#prices",      label: "Цены"     },
                { href: "#services",    label: "Услуги"   },
                { href: "#all-devices", label: "Бренды"   },
                { href: "#reviews",     label: "Отзывы"   },
                { href: "#contacts",    label: "Контакты" },
              ].map(item => (
                <a key={item.href} href={item.href}
                  className="whitespace-nowrap px-3 py-1.5 font-roboto text-[11px] text-white/40 hover:text-white/80 transition-colors shrink-0">
                  {item.label}
                </a>
              ))}

              <span className="w-px h-4 bg-white/10 mx-1 shrink-0" />

              {/* Услуги */}
              {SERVICE_LINKS.map(s => (
                <Link key={s.to} to={s.to}
                  className="whitespace-nowrap px-2.5 py-1 rounded-md font-roboto text-[11px] font-medium shrink-0 transition-all active:scale-95"
                  style={{ background: s.color + "14", color: s.color, border: `1px solid ${s.color}28` }}>
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════
            HERO — сразу под шапкой, без лишних отступов
            ══════════════════════════════════════════════════════════ */}
        <RepairHero onOrder={scrollToForm} />

        {/* ══════════════════════════════════════════════════════════
            ОСНОВНОЙ КОНТЕНТ — логика поведенческого сайта:
            1. Форма + услуги (конверсия)
            2. Цены (убеждение)
            3. Как работаем (доверие)
            4. Все бренды + модели
            5. Доп. услуги
            6. Отзывы + локация (социальное доказательство)
            7. FAQ + SEO
            ══════════════════════════════════════════════════════════ */}
        <RepairTopBlock />
        <RepairStats />
        <RepairPriceTable onOrder={scrollToForm} />
        <RepairServices onOrder={scrollToForm} />
        <RepairFeatures />
        <RepairBeforeAfter onOrder={scrollToForm} />
        <RepairAllDevices onOrder={scrollToForm} />
        <RepairParts onOrder={scrollToForm} />
        <RepairModels onOrder={scrollToForm} />
        <RepairUnlockBanner />
        <RepairHowItWorks />
        <RepairLocation />
        <RepairReviews />
        <RepairSEOLinks />
        <RepairFAQ />
        <RepairSEOText />

        {/* Подвал */}
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a] px-4 py-10 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="Wrench" size={15} className="text-[#FFD700]" />
            <span className="font-oswald text-white/60 uppercase tracking-wide text-sm">
              Ремонт24 · Сервисный центр · Калуга
            </span>
          </div>
          <a href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_footer" })}
            className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline block mb-2">
            {REPAIR_PHONE_DISPLAY}
          </a>
          <p className="text-white/35">Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00</p>
          <Link to="/"
            className="inline-flex items-center gap-1.5 mt-5 text-white/30 hover:text-[#FFD700] font-roboto text-sm transition-colors">
            <Icon name="ChevronLeft" size={14} />
            Скупка24 — главная
          </Link>
        </footer>
      </div>
    </div>
  );
}
