import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";
import PremiumSection from "@/components/skupka/PremiumSection";
import { ymGoal, Goals } from "@/lib/ym";

const BRANCHES = [
  { city: "Калуга", addr: "ул. Кирова, 11", metro: "г. Калуга, центр города", time: "24/7 без выходных", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
  { city: "Калуга", addr: "ул. Кирова, 7/47", metro: "г. Калуга, центр города", time: "24/7 без выходных", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
];

const InfoBranchesAbout = () => {
  return (
    <>
      {/* BRANCHES — премиум в стиле Trade In */}
      <PremiumSection
        id="branches"
        badge={{ icon: "MapPin", label: "Калуга · 24/7", color: "purple" }}
        eyebrow="Филиалы"
        title={<><span className="text-[#FFD700]">Два офиса</span><br />в центре Калуги.</>}
        accentA="rgba(255,215,0,0.08)"
        accentB="rgba(139,92,246,0.08)"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {BRANCHES.map((b, i) => (
              <Reveal key={b.city} delay={(i) as 0|1|2|3|4|5}>
              <div className="border border-[#FFD700]/20 p-6 hover:border-[#FFD700]/60 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-0 group-hover:h-full bg-[#FFD700] transition-all duration-300" />
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-oswald text-xl font-bold uppercase text-[#FFD700]">{b.city}</h3>
                  <span className="font-oswald text-5xl font-bold text-[#FFD700]/5">0{i + 1}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Icon name="MapPin" size={14} className="text-[#FFD700] mt-0.5 shrink-0" />
                    <span className="font-roboto text-white/70 text-sm">{b.addr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Train" size={14} className="text-[#FFD700] shrink-0" />
                    <span className="font-roboto text-white/70 text-sm">{b.metro}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Clock" size={14} className="text-[#FFD700] shrink-0" />
                    <span className="font-roboto text-white/70 text-sm">{b.time}</span>
                  </div>
                  {b.phones.map(phone => (
                    <div key={phone} className="flex items-center gap-2">
                      <Icon name="Phone" size={14} className="text-[#FFD700] shrink-0" />
                      <a href={`tel:${phone.replace(/\D/g, '')}`} onClick={() => ymGoal(Goals.CALL_CLICK, { place: "info_section" })} className="font-roboto text-white/70 text-sm hover:text-[#FFD700] transition-colors">{phone}</a>
                    </div>
                  ))}
                </div>
              </div>
              </Reveal>
            ))}
          </div>

          {/* Карты офисов */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
            <Reveal>
              <div className="border border-[#FFD700]/20 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#FFD700]/5 border-b border-[#FFD700]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="MapPin" size={14} className="text-[#FFD700] shrink-0" />
                    <span className="font-oswald font-bold text-sm uppercase text-white truncate">Кирова, 11</span>
                  </div>
                  <a
                    href="https://yandex.ru/profile/114124804072?lang=ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
                    title="Отзывы на Яндекс Картах"
                  >
                    <span className="flex items-center gap-0.5 text-[#FFD700] text-xs leading-none">
                      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                    </span>
                    <span className="font-oswald font-bold text-[#FFD700] text-sm leading-none">5.0</span>
                    <span className="font-roboto text-white/50 text-[10px] leading-none">· 90+ отзывов</span>
                  </a>
                </div>
                <iframe
                  src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=114124804072"
                  className="w-full h-[320px] md:h-[400px] block"
                  frameBorder="0"
                  loading="lazy"
                  title="Скупка24 — Кирова 11"
                />
                <div className="px-4 py-2.5 bg-[#0A0A0A] border-t border-[#FFD700]/10 flex items-center justify-between gap-3 text-xs font-roboto">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Icon name="Footprints" size={13} className="text-[#FFD700]" />
                    ~8 мин пешком от пл. Победы
                  </span>
                  <span className="flex items-center gap-1.5 text-white/40">
                    <Icon name="Car" size={13} className="text-[#FFD700]/70" />
                    ~5 мин
                  </span>
                </div>
                <a
                  href="https://yandex.ru/maps/?rtext=~54.513845,36.261215&rtt=auto&oid=52473097879"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold-premium btn-md w-full"
                >
                  <Icon name="Navigation" size={16} />
                  Построить маршрут
                </a>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="border border-[#FFD700]/20 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#FFD700]/5 border-b border-[#FFD700]/20 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon name="MapPin" size={14} className="text-[#FFD700] shrink-0" />
                    <span className="font-oswald font-bold text-sm uppercase text-white truncate">Кирова, 7/47</span>
                  </div>
                  <a
                    href="https://yandex.ru/profile/52473097879?lang=ru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity"
                    title="Отзывы на Яндекс Картах"
                  >
                    <span className="flex items-center gap-0.5 text-[#FFD700] text-xs leading-none">
                      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                    </span>
                    <span className="font-oswald font-bold text-[#FFD700] text-sm leading-none">5.0</span>
                    <span className="font-roboto text-white/50 text-[10px] leading-none">· 180+ отзывов</span>
                  </a>
                </div>
                <iframe
                  src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=52473097879"
                  className="w-full h-[320px] md:h-[400px] block"
                  frameBorder="0"
                  loading="lazy"
                  title="Скупка24 — Кирова 7/47"
                />
                <div className="px-4 py-2.5 bg-[#0A0A0A] border-t border-[#FFD700]/10 flex items-center justify-between gap-3 text-xs font-roboto">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Icon name="Footprints" size={13} className="text-[#FFD700]" />
                    ~5 мин пешком от пл. Победы
                  </span>
                  <span className="flex items-center gap-1.5 text-white/40">
                    <Icon name="Car" size={13} className="text-[#FFD700]/70" />
                    ~3 мин
                  </span>
                </div>
                <a
                  href="https://yandex.ru/maps/?rtext=~54.510800,36.253900&rtt=auto&oid=114124804072"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold-premium btn-md w-full"
                >
                  <Icon name="Navigation" size={16} />
                  Построить маршрут
                </a>
              </div>
            </Reveal>
          </div>
      </PremiumSection>

      {/* ABOUT — премиум */}
      <section id="about" className="relative py-14 md:py-20 border-t border-[#FFD700]/10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.05) 0%, transparent 60%)" }} />
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.08)" }} />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <Reveal>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
                  <Icon name="BadgeCheck" size={12} />
                  С 2015 года
                </span>
                <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">О компании</span>
              </div>
              <h2 className="font-oswald text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-[1.05]">
                МЫ ЦЕНИМ<br /><span className="text-[#FFD700]">честность.</span>
              </h2>
              <p className="font-roboto text-white/60 leading-relaxed mb-4 text-sm md:text-base">
                Скупка24 работает в Калуге с 2015 года. Наши офисы — ул. Кирова, 11 и ул. Кирова, 7/47. За это время мы провели более 50 000 сделок и выплатили клиентам сотни миллионов рублей. Наш принцип прост: честная цена и уважение к каждому клиенту.
              </p>
              <p className="font-roboto text-white/60 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
                Все наши оценщики — сертифицированные специалисты. Мы не занижаем цены и не используем серые схемы. Только прозрачные сделки, официальный договор и выплата день в день. Работаем в Калуге круглосуточно, 24/7.
              </p>
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[["50 000+", "сделок"], ["₽ 500 млн", "выплачено"]].map(([num, label]) => (
                  <div key={label} className="border-l-2 border-[#FFD700] pl-3 md:pl-4">
                    <div className="font-oswald text-lg md:text-2xl font-bold text-[#FFD700]">{num}</div>
                    <div className="font-roboto text-white/40 text-[10px] md:text-xs uppercase tracking-wide">{label}</div>
                  </div>
                ))}
                <div className="border-l-2 border-[#FFD700] pl-3 md:pl-4">
                  <div className="font-oswald text-lg md:text-2xl font-bold text-[#FFD700]">5.0 ★</div>
                  <div className="font-roboto text-white/40 text-[10px] md:text-xs uppercase tracking-wide">рейтинг</div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={2}>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#FFD700]/5" />
                <div className="absolute top-0 right-0 w-1/2 h-1 bg-[#FFD700]" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#FFD700]" />
                <img
                  src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/a1949b69-d0e9-4258-a070-4865807b102b.jpg"
                  alt="Офис Скупка24 в Калуге — Кирова, 11"
                  className="w-full h-64 md:h-80 object-cover relative"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default InfoBranchesAbout;