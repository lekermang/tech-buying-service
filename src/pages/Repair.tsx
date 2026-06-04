import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import DigitalParticles from "@/components/fx/DigitalParticles";
import RepairWidget from "@/components/skupka/RepairWidget";
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
import RepairFAQ from "@/components/repair/RepairFAQ";
import RepairSEOText from "@/components/repair/RepairSEOText";
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
        {/* Навбар */}
        <nav
          className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-colors ${
            scrolled ? "bg-[#0d0d0d]/90 border-[#FFD700]/15 backdrop-blur-md" : "bg-transparent border-transparent"
          }`}
        >
          {/* Возврат в Скупку24 — премиум-лейбл */}
          <Link
            to="/"
            className="group flex items-center gap-2.5"
            aria-label="Вернуться в Скупка24"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 group-hover:bg-[#FFD700]/20 transition-colors">
              <Icon name="ChevronLeft" size={18} className="text-[#FFD700]" />
            </span>
            <span className="font-oswald text-xl sm:text-2xl font-bold leading-none">
              <span className="bg-gradient-to-r from-[#fff3a0] via-[#FFD700] to-[#b8860b] bg-clip-text text-transparent">
                Скупка 24
              </span>
              <span className="block text-[9px] sm:text-[10px] text-white/35 font-roboto font-normal uppercase tracking-[0.25em] mt-0.5">
                Сервис ремонта
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-5">
            <a href="#prices" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">Цены</a>
            <a href="#services" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">Услуги</a>
            <a href="#all-devices" className="hidden lg:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">Все бренды</a>
            <a href="#contacts" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">Контакты</a>
            <a
              href={REPAIR_PHONE_TEL}
              onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_nav" })}
              className="hidden sm:inline-flex items-center gap-1.5 text-[#FFD700] font-oswald font-bold text-sm hover:text-[#ffed4a] transition-colors"
            >
              <Icon name="Phone" size={15} />
              {REPAIR_PHONE_DISPLAY}
            </a>
            <button
              onClick={scrollToForm}
              className="bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-4 sm:px-5 py-2.5 rounded-lg text-sm transition-colors shadow-[0_0_20px_rgba(255,215,0,0.25)]"
            >
              Заявка
            </button>
          </div>
        </nav>

        <RepairHero onOrder={scrollToForm} />
        <RepairStats />
        <RepairPriceTable onOrder={scrollToForm} />
        <RepairFeatures />
        <RepairServices onOrder={scrollToForm} />
        <RepairAllDevices onOrder={scrollToForm} />
        <RepairParts onOrder={scrollToForm} />
        <RepairModels onOrder={scrollToForm} />
        <RepairHowItWorks />
        <RepairLocation />

        {/* Форма заявки */}
        <section id="repair-form" className="px-4 sm:px-8 py-14 max-w-3xl mx-auto scroll-mt-20">
          <div className="text-center mb-7">
            <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
              Рассчитать <span className="text-[#FFD700]">стоимость</span>
            </h2>
            <p className="text-white/50 text-sm mt-2">
              Опишите проблему — мастер свяжется с вами и назовёт точную цену
            </p>
          </div>
          <RepairWidget />
        </section>

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
