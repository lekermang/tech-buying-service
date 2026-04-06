import { useState, useEffect } from "react";
import Header from "@/components/skupka/Header";
import HeroSection from "@/components/skupka/HeroSection";
import InfoSections from "@/components/skupka/InfoSections";
import ContactsFooter from "@/components/skupka/ContactsFooter";
import Consultant from "@/components/skupka/Consultant";
import Icon from "@/components/ui/icon";

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const SplashScreen = ({ onDone }: { onDone: () => void }) => {
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 3000);
    const t2 = setTimeout(() => onDone(), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${hiding ? "opacity-0" : "opacity-100"}`}
      style={{ background: "radial-gradient(ellipse at center, #1a1400 0%, #0D0D0D 60%, #000 100%)" }}>
      <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.06) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.07) 0%, transparent 65%)" }} />
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700]" />

      <div className="relative flex flex-col items-center gap-8">
        <div className="flex items-center gap-3 animate-[fadeIn_0.4s_ease]">
          <img
            src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/9c9b4fca-bfd7-4841-a827-eb0354dad8da.JPG"
            alt="Скупка24"
            className="w-12 h-12 rounded-full object-cover border border-[#FFD700]/40"
          />
          <span className="font-oswald font-bold text-2xl text-[#FFD700] tracking-widest uppercase">Скупка24</span>
        </div>

        <h2 className="font-oswald text-4xl sm:text-5xl font-bold uppercase text-center animate-[slideDown_0.5s_ease_0.2s_both]">
          Купим дорого{" "}
          <span className="animate-shimmer">всё!</span>
        </h2>

        {/* Полоса загрузки */}
        <div className="w-64 sm:w-80 flex flex-col gap-2 animate-[fadeIn_0.4s_ease_0.5s_both]">
          <div className="h-[3px] w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #ffd700, #fffacd, #ffa500, #ffd700)",
                backgroundSize: "200% auto",
                animation: "splashBar 2.8s cubic-bezier(0.4,0,0.2,1) forwards, shimmer 1.5s linear infinite",
              }}
            />
          </div>
          <span className="font-roboto text-white/30 text-xs text-center uppercase tracking-widest">Загрузка...</span>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [splashDone, setSplashDone] = useState(false);
  const [evalOpen, setEvalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[72px] md:pb-0">
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <Header scrollTo={scrollTo} />
      <HeroSection scrollTo={scrollTo} externalModalOpen={evalOpen} onExternalModalClose={() => setEvalOpen(false)} />
      <InfoSections />
      <ContactsFooter scrollTo={scrollTo} />
      <Consultant />

      {/* Sticky нижняя панель — только мобильные */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/98 backdrop-blur-sm border-t border-[#FFD700]/20">
        <div className="flex h-[68px]">
          <a href="tel:+79929990333"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors">
            <Icon name="Phone" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">Позвонить</span>
          </a>
          <button onClick={() => setEvalOpen(true)}
            className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#FFD700] text-black active:bg-yellow-400 transition-colors">
            <Icon name="Zap" size={22} />
            <span className="font-oswald font-bold text-sm uppercase tracking-wide">Оценить онлайн</span>
          </button>
          <a href="https://t.me/skypka24" target="_blank" rel="noopener noreferrer"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-[#FFD700] hover:bg-[#FFD700]/5 active:bg-[#FFD700]/10 transition-colors">
            <Icon name="MessageCircle" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">Telegram</span>
          </a>
          <a href="/catalog"
            className="flex-1 flex flex-col items-center justify-center gap-1 text-white/50 hover:text-[#FFD700] active:text-[#FFD700] transition-colors">
            <Icon name="ShoppingBag" size={22} />
            <span className="font-roboto text-[10px] uppercase tracking-wide">Каталог</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;