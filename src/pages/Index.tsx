import Header from "@/components/skupka/Header";
import HeroSection from "@/components/skupka/HeroSection";
import InfoSections from "@/components/skupka/InfoSections";
import ContactsFooter from "@/components/skupka/ContactsFooter";

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth" });
};

const Index = () => {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header scrollTo={scrollTo} />
      <HeroSection scrollTo={scrollTo} />
      <InfoSections />
      <ContactsFooter scrollTo={scrollTo} />
    </div>
  );
};

export default Index;