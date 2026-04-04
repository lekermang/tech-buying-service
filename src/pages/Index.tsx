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

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[72px] md:pb-0">
      <Header scrollTo={scrollTo} />
      <HeroSection scrollTo={scrollTo} />
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
          <button onClick={() => scrollTo("#evaluate")}
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