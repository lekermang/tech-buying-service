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

export default function Repair() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("repair-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      <RepairSEO />

      {/* ── Премиум-фон: золотые частицы + свечения, как на главной ── */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "rgba(255,215,0,0.10)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(255,215,0,0.06)" }}
        />
        <div
          className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(34,158,217,0.05)" }}
        />
        {/* тонкая золотая сетка */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,215,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.025) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10">

        {/* ══ БРЕНДОВАЯ ШАПКА — самый верх, видна сразу на мобильном ══ */}
        <div className="w-full border-b border-[#FFD700]/10 bg-[#0a0a0a]/60 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
            {/* Лого + бренд */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
                <Icon name="Wrench" size={17} className="text-black" />
              </div>
              <div className="min-w-0">
                <div className="font-oswald font-black text-lg sm:text-2xl leading-none tracking-wide"
                  style={{ background: "linear-gradient(90deg,#fff3a0,#FFD700,#b8860b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Ремонт24
                </div>
                <div className="font-roboto text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-white/35 mt-0.5">
                  Сервисный центр · Калуга
                </div>
              </div>
            </div>
            {/* Телефон + кнопка */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_brand" })}
                className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors">
                <Icon name="Phone" size={14} />
                {REPAIR_PHONE_DISPLAY}
              </a>
              <a href={REPAIR_PHONE_TEL}
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_brand_mobile" })}
                className="sm:hidden w-9 h-9 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center text-[#FFD700] active:bg-[#FFD700]/25 transition-colors">
                <Icon name="Phone" size={17} />
              </a>
              <button onClick={scrollToForm}
                className="inline-flex items-center gap-1.5 text-black font-oswald font-bold uppercase tracking-wide px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm active:scale-95 transition-all"
                style={{ background: "linear-gradient(180deg,#fff3a0 0%,#ffd700 45%,#d4a017 100%)", boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 4px 14px rgba(255,215,0,0.3)" }}>
                <Icon name="Zap" size={14} />
                <span>Заявка</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══ ГОРИЗОНТАЛЬНАЯ НАВИГАЦИЯ — все услуги, скролл на мобиле ══ */}
        <div className="sticky top-0 z-50 border-b border-[#FFD700]/10 backdrop-blur-md"
          style={{ background: scrolled ? "rgba(13,13,13,0.97)" : "rgba(13,13,13,0.85)" }}>
          {/* Строка 1 — разделы страницы */}
          <div className="flex items-center gap-1 px-3 sm:px-6 overflow-x-auto scrollbar-none border-b border-white/[0.05]"
            style={{ WebkitOverflowScrolling: "touch" }}>
            {[
              { href: "#repair-form",  label: "Заявка",     icon: "Zap" },
              { href: "#prices",       label: "Цены",        icon: "Tag" },
              { href: "#services",     label: "Услуги",      icon: "Wrench" },
              { href: "#all-devices",  label: "Бренды",      icon: "Smartphone" },
              { href: "#reviews",      label: "Отзывы",      icon: "Star" },
              { href: "#contacts",     label: "Контакты",    icon: "MapPin" },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 font-roboto text-xs text-white/50 hover:text-[#FFD700] transition-colors shrink-0">
                <Icon name={item.icon} size={12} />
                {item.label}
              </a>
            ))}
            <div className="ml-auto pl-2 shrink-0 hidden sm:block">
              <Link to="/" className="flex items-center gap-1 text-white/30 hover:text-white/60 text-xs font-roboto transition-colors">
                <Icon name="ChevronLeft" size={12} />
                Скупка24
              </Link>
            </div>
          </div>
          {/* Строка 2 — услуги по устройствам */}
          <div className="flex items-center gap-1 px-3 sm:px-6 overflow-x-auto scrollbar-none py-1"
            style={{ WebkitOverflowScrolling: "touch" }}>
            {[
              { to: "/remont-iphone-kaluga",        label: "iPhone",       color: "#fff3a0" },
              { to: "/remont-samsung-kaluga",        label: "Samsung",      color: "#93c5fd" },
              { to: "/remont-xiaomi-kaluga",         label: "Xiaomi",       color: "#86efac" },
              { to: "/zamena-stekla-kaluga",         label: "Стекло",       color: "#c4b5fd" },
              { to: "/zamena-akkumulyatora-kaluga",  label: "Аккумулятор",  color: "#6ee7b7" },
              { to: "/remont-posle-vody-kaluga",     label: "После воды",   color: "#7dd3fc" },
              { to: "/bga-pajka-kaluga",             label: "BGA-пайка",    color: "#fca5a5" },
              { to: "/snyatie-frp-kaluga",           label: "FRP/iCloud",   color: "#fdba74" },
            ].map(s => (
              <Link key={s.to} to={s.to}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg font-roboto text-[11px] font-semibold shrink-0 transition-all active:scale-95"
                style={{ background: s.color + "12", color: s.color, border: `1px solid ${s.color}25` }}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <RepairTopBlock />
        <RepairBeforeAfter onOrder={scrollToForm} />
        <RepairHero onOrder={scrollToForm} />
        <RepairStats />
        <RepairPriceTable onOrder={scrollToForm} />
        <RepairFeatures />
        <RepairServices onOrder={scrollToForm} />
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
        <footer className="border-t border-[#FFD700]/10 bg-[#0a0a0a]/80 px-4 py-10 text-center text-white/40 text-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon name="Wrench" size={16} className="text-[#FFD700]" />
            <span className="font-oswald text-white/70 uppercase tracking-wide">Скупка 24 · Сервис ремонта · Калуга</span>
          </div>
          <a
            href={REPAIR_PHONE_TEL}
            onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_footer" })}
            className="text-[#FFD700] font-oswald font-bold text-2xl hover:underline"
          >
            {REPAIR_PHONE_DISPLAY}
          </a>
          <p className="mt-3">
            Калуга, ул. Кирова, 7 · ежедневно 9:00–21:00
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 mt-4 text-[#FFD700] hover:text-[#ffed4a] font-roboto transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
            Вернуться в Скупку24
          </Link>
        </footer>
      </div>
    </div>
  );
}