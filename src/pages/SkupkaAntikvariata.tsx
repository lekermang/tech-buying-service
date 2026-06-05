/**
 * SEO-страница: Скупка антиквариата в Калуге
 * Schema.org: LocalBusiness + ItemList + FAQPage
 */
import { useEffect, useState } from "react";
import DigitalParticles from "@/components/fx/DigitalParticles";
import AntiqueSEO from "@/components/antique/AntiqueSEO";
import AntiqueHero from "@/components/antique/AntiqueHero";
import AntiqueCategories from "@/components/antique/AntiqueCategories";
import AntiqueCTA from "@/components/antique/AntiqueCTA";

export default function SkupkaAntikvariata() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById("antique-contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">
      <AntiqueSEO />

      {/* Фон */}
      <div aria-hidden className="fixed inset-0 z-0 pointer-events-none">
        <DigitalParticles />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[130px]"
          style={{ background: "rgba(255,215,0,0.08)" }} />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(167,139,250,0.05)" }} />
        <div className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,215,0,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,215,0,0.025) 1px,transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%,black,transparent 70%)",
          }} />
      </div>

      <div className="relative z-10">
        <AntiqueHero scrolled={scrolled} onScrollToForm={scrollToForm} />
        <AntiqueCategories />
        <AntiqueCTA />
      </div>
    </div>
  );
}
