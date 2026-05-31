import { useState } from "react";
import EvaluateModal from "./hero/EvaluateModal";
import HeroLeft from "./hero/HeroLeft";
import HeroRight from "./hero/HeroRight";

interface HeroSectionProps {
  scrollTo: (href: string) => void;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
}

const HeroSection = ({ scrollTo: _scrollTo, externalModalOpen, onExternalModalClose }: HeroSectionProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const isOpen = modalOpen || !!externalModalOpen;
  const handleClose = () => { setModalOpen(false); onExternalModalClose?.(); };

  return (
    <>
      {isOpen && <EvaluateModal onClose={handleClose} />}

      <section id="hero" className="relative min-h-screen flex items-center pt-[88px] md:pt-[104px] overflow-hidden"
        style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }}>

        {/* Фоновое фото с градиентом */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/47a9e726-1666-459a-824f-d2c990b98092.jpg"
            alt="Скупка24"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/90 to-[#0D0D0D]/40" />
        </div>

        {/* Премиум свечения по углам (Trade-In DNA) */}
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
        <div className="absolute -bottom-32 left-1/3 w-[360px] h-[360px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.06)" }} />
        <div className="absolute top-1/3 -right-24 w-[380px] h-[380px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.05)" }} />

        {/* Левая золотая полоска (золотой акцент-символ бренда) */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#FFD700] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-14 lg:py-16 grid lg:grid-cols-2 gap-8 lg:gap-14 items-start w-full">
          <HeroLeft onOpenModal={() => setModalOpen(true)} />
          <HeroRight />
        </div>
      </section>
    </>
  );
};

export default HeroSection;
