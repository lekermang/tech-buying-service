import Icon from "@/components/ui/icon";

export default function RepairHero({ onOrder }: { onOrder: () => void }) {
  return (
    <section className="relative overflow-hidden text-center px-4 sm:px-8 pt-16 pb-14 sm:pt-24 sm:pb-20 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-5">
          <Icon name="Flame" size={14} />
          Профессиональный сервис с гарантией
        </div>
        <h1 className="font-oswald font-bold uppercase leading-[1.05] text-4xl sm:text-6xl mb-4">
          Ремонт телефонов
          <br />
          <span className="text-[#FFD700]">быстро и с гарантией</span>
        </h1>
        <p className="text-white/50 text-sm sm:text-lg max-w-xl mx-auto leading-relaxed mb-8">
          Замена экранов, аккумуляторов, разблокировка и восстановление устройств. Срочный ремонт при вас за 20 минут.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onOrder}
            className="bg-[#FFD700] hover:bg-[#ffed4a] text-black font-oswald font-bold tracking-wide px-8 py-3.5 rounded-lg text-base transition-colors inline-flex items-center justify-center gap-2"
          >
            Оставить заявку
            <Icon name="ArrowRight" size={18} />
          </button>
          <a
            href="#services"
            className="border border-white/20 hover:border-[#FFD700] hover:text-[#FFD700] text-white px-8 py-3.5 rounded-lg text-base font-medium transition-colors inline-flex items-center justify-center gap-2"
          >
            <Icon name="List" size={18} />
            Посмотреть услуги
          </a>
        </div>
      </div>
    </section>
  );
}
