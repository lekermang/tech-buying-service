import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";
import RepairWidget from "@/components/skupka/RepairWidget";
import RepairSEO from "@/components/repair/RepairSEO";
import RepairHero from "@/components/repair/RepairHero";
import RepairStats from "@/components/repair/RepairStats";
import RepairFeatures from "@/components/repair/RepairFeatures";
import RepairPriceTable from "@/components/repair/RepairPriceTable";
import RepairServices from "@/components/repair/RepairServices";
import RepairAllDevices from "@/components/repair/RepairAllDevices";
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
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <RepairSEO />

      {/* Навбар */}
      <nav
        className={`sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b transition-colors ${
          scrolled ? "bg-[#0d0d0d]/95 border-white/10 backdrop-blur-md" : "bg-transparent border-transparent"
        }`}
      >
        <Link to="/" className="flex items-center gap-2 font-oswald text-2xl font-bold">
          <span className="text-[#FFD700]">Скупка24</span>
          <span className="text-white/40 text-sm font-roboto font-normal hidden sm:inline">· Ремонт</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-5">
          <a href="#prices" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">
            Цены
          </a>
          <a href="#services" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">
            Услуги
          </a>
          <a href="#all-devices" className="hidden lg:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">
            Все бренды
          </a>
          <a href="#contacts" className="hidden md:block text-sm text-white/60 hover:text-[#FFD700] transition-colors">
            Контакты
          </a>
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
            className="bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-4 sm:px-5 py-2.5 rounded-lg text-sm transition-colors"
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
      <footer className="border-t border-white/10 bg-[#0a0a0a] px-4 py-8 text-center text-white/40 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon name="Wrench" size={16} className="text-[#FFD700]" />
          <span className="font-oswald text-white/70 uppercase tracking-wide">Ремонт Apple · Калуга</span>
        </div>
        <a
          href={REPAIR_PHONE_TEL}
          onClick={() => ymGoal(Goals.CALL_CLICK, { place: "repair_footer" })}
          className="text-[#FFD700] font-oswald font-bold text-lg hover:underline"
        >
          {REPAIR_PHONE_DISPLAY}
        </a>
        <p className="mt-2">
          Калуга, ул. Кирова, 7 ·{" "}
          <Link to="/" className="text-[#FFD700] hover:underline">
            На главную
          </Link>
        </p>
      </footer>
    </div>
  );
}