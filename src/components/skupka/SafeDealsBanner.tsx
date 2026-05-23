/** Крупный CTA-баннер «Безопасная сделка» — ставится сразу после Hero на главной. */
import Icon from "@/components/ui/icon";

export default function SafeDealsBanner() {
  return (
    <section className="relative py-10 sm:py-14 px-4 overflow-hidden">
      <div aria-hidden className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(255,215,0,0.06), transparent 70%)" }} />
      <div aria-hidden className="absolute -top-20 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.08)" }} />

      <div className="relative max-w-5xl mx-auto">
        <a
          href="/safe-deals"
          className="group block rounded-3xl overflow-hidden bg-gradient-to-br from-[#1a1400] via-[#0D0D0D] to-[#1a1400] border-2 border-[#FFD700]/40 hover:border-[#FFD700] transition-all duration-500 hover:shadow-[0_25px_70px_-15px_rgba(255,215,0,0.5)] active:scale-[0.99]"
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-5 p-6 sm:p-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFD700]/[0.15] border border-[#FFD700]/40 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#FFD700] mb-3">
                <Icon name="Shield" size={12} /> Новинка · Скупка24
              </div>
              <h2 className="font-oswald font-bold uppercase text-2xl sm:text-3xl md:text-4xl leading-tight">
                <span className="text-white">Безопасная сделка </span>
                <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent">через гаранта</span>
              </h2>
              <p className="text-sm sm:text-base text-white/65 mt-3 max-w-xl leading-relaxed">
                Продайте телефон, ноутбук или технику <b className="text-white">безопасно</b> — мы выступаем гарантом сделки.
                Проверяем товар, находим покупателя, передаём вам деньги. Комиссия 10%.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-5 text-[11px] sm:text-xs uppercase tracking-wider text-white/55">
                <Feature icon="Eye" text="Проверка в офисе" />
                <span className="opacity-30">·</span>
                <Feature icon="ShieldCheck" text="QR-сделка" />
                <span className="opacity-30">·</span>
                <Feature icon="MapPin" text="Только Кирова, 11" />
                <span className="opacity-30">·</span>
                <Feature icon="Wallet" text="Деньги сразу" />
              </div>
            </div>

            <div className="md:text-right">
              <div className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFE033] to-[#FFD700] text-black font-bold text-sm sm:text-base shadow-[0_15px_40px_-10px_rgba(255,215,0,0.5)] group-hover:shadow-[0_20px_50px_-10px_rgba(255,215,0,0.8)] transition">
                <Icon name="Shield" size={18} />
                Подать заявку
                <Icon name="ArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider mt-2">Бесплатно · 2 минуты</div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon name={icon} size={13} className="text-[#FFD700]" />
      {text}
    </span>
  );
}
