import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";

const CATEGORIES = [
  { icon: "Smartphone", title: "Смартфоны", desc: "iPhone, Samsung, Xiaomi и другие", price: "до 95 000 ₽" },
  { icon: "Laptop", title: "Ноутбуки", desc: "MacBook, Dell, Lenovo, HP, Asus", price: "до 150 000 ₽" },
  { icon: "Tablet", title: "Планшеты", desc: "iPad, Samsung Tab, Huawei", price: "до 70 000 ₽" },
  { icon: "Watch", title: "Умные часы", desc: "Apple Watch, Samsung Galaxy Watch", price: "до 40 000 ₽" },
  { icon: "Gem", title: "Ювелирные", desc: "Золото, серебро, бриллианты", price: "до 500 000 ₽" },
  { icon: "Camera", title: "Фотоаппараты", desc: "Зеркальные, беззеркальные, объективы", price: "до 80 000 ₽" },
  { icon: "Gamepad2", title: "Игровые консоли", desc: "PlayStation, Xbox, Nintendo", price: "до 45 000 ₽" },
  { icon: "Headphones", title: "Аудио", desc: "AirPods, Beats, Sony, Bose", price: "до 30 000 ₽" },
];

const InfoCatalogTradeIn = () => {
  return (
    <>
      {/* CATEGORIES */}
      <section id="catalog" className="py-14 md:py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Что принимаем</p>
              <h2 className="font-oswald text-3xl md:text-5xl font-bold">ВСЁ ЧТО ИМЕЕТ<br />ЦЕННОСТЬ</h2>
            </div>
            <div className="hidden md:block w-24 h-1 bg-[#FFD700] mb-4" />
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-[#FFD700]/10">
            {CATEGORIES.map((cat, i) => (
              <Reveal key={cat.title} delay={(i % 4) as 0|1|2|3|4|5}>
                <div className="bg-[#0D0D0D] p-4 sm:p-5 md:p-6 hover:bg-[#1A1A1A] transition-colors group cursor-pointer relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 w-0 group-hover:w-full h-0.5 bg-[#FFD700] transition-all duration-300" />
                  <Icon name={cat.icon} size={28} className="text-[#FFD700] mb-3" />
                  <h3 className="font-oswald text-base sm:text-lg md:text-xl font-bold mb-1 uppercase">{cat.title}</h3>
                  <p className="font-roboto text-white/50 text-xs md:text-sm mb-2 md:mb-3 hidden sm:block">{cat.desc}</p>
                  <span className="font-oswald text-[#FFD700] font-bold text-sm">{cat.price}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TRADE-IN */}
      <section id="tradein" className="relative py-14 md:py-20 border-t border-[#FFD700]/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-[#FFD700]/[0.04] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full">
                <Icon name="Leaf" size={12} />
                Эко-программа
              </span>
              <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">Trade In</span>
            </div>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">
              ВЫГОДНАЯ СДЕЛКА<br />
              <span className="text-[#FFD700]">для вас.</span>{" "}
              <span className="text-emerald-400">И для планеты.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6 md:gap-10 items-start">
            <Reveal>
              <p className="font-roboto text-white/70 text-sm md:text-base leading-relaxed mb-5 md:mb-6">
                С программой <span className="text-[#FFD700] font-bold">Скупка24 Trade In</span> вы можете выгодно сдать своё текущее устройство и обменять его на новое — онлайн или в магазине Скупка24.
              </p>
              <p className="font-roboto text-white/60 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
                Если ваше устройство не подлежит обмену, мы <span className="text-emerald-400 font-semibold">безопасно и бесплатно утилизируем</span> его вместе со всеми аксессуарами, которые вам больше не нужны. Это выгодная сделка для вас и отличный способ защитить ценные ресурсы нашей планеты.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 md:gap-3 mb-6 md:mb-8">
                {[
                  { icon: "RefreshCw", label: "Обмен онлайн" },
                  { icon: "Store", label: "Обмен в магазине" },
                  { icon: "Recycle", label: "Эко-утилизация" },
                  { icon: "ShieldCheck", label: "Безопасно" },
                  { icon: "Banknote", label: "Доплата сразу" },
                  { icon: "Leaf", label: "Бесплатно" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 bg-[#0D0D0D] border border-[#FFD700]/15 px-3 py-2.5 hover:border-[#FFD700]/40 transition-colors">
                    <Icon name={f.icon} size={16} className="text-[#FFD700] shrink-0" />
                    <span className="font-roboto text-white/80 text-xs md:text-sm">{f.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/catalog"
                  className="inline-flex items-center justify-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm md:text-base px-6 md:px-8 py-3 md:py-4 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all">
                  <Icon name="ShoppingBag" size={18} />
                  В магазин Скупка24
                  <Icon name="ArrowRight" size={16} />
                </a>
                <a href="tel:+79929990333"
                  className="inline-flex items-center justify-center gap-2 border border-[#FFD700]/40 text-[#FFD700] font-oswald font-bold text-sm md:text-base px-6 py-3 md:py-4 uppercase tracking-wide hover:border-[#FFD700] hover:bg-[#FFD700]/5 transition-all">
                  <Icon name="Phone" size={16} />
                  Узнать детали
                </a>
              </div>
            </Reveal>

            <Reveal delay={2}>
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-[#FFD700]/20 to-emerald-500/20 blur-xl" />
                <div className="relative bg-[#0D0D0D] border border-[#FFD700]/20 p-5 md:p-7">
                  <div className="flex items-center justify-between mb-5 md:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
                        <Icon name="Repeat" size={18} className="text-[#FFD700]" />
                      </div>
                      <div>
                        <div className="font-oswald font-bold text-white text-sm uppercase leading-tight">Как это работает</div>
                        <div className="font-roboto text-white/40 text-[11px]">3 простых шага</div>
                      </div>
                    </div>
                    <span className="font-oswald font-bold text-emerald-400 text-[11px] tracking-widest uppercase">Eco</span>
                  </div>

                  <div className="space-y-4">
                    {[
                      { n: "01", icon: "Search", title: "Оцените устройство", desc: "Онлайн или в одном из наших офисов на ул. Кирова, 11 и 7/47" },
                      { n: "02", icon: "ArrowLeftRight", title: "Обменяйте с доплатой", desc: "Стоимость старого устройства идёт в зачёт покупки нового" },
                      { n: "03", icon: "Recycle", title: "Или бесплатно утилизируем", desc: "Безопасно и экологично — вместе со всеми аксессуарами" },
                    ].map((s, i) => (
                      <div key={s.n} className="flex gap-3 md:gap-4 items-start group">
                        <div className="shrink-0 relative">
                          <div className="w-10 h-10 md:w-11 md:h-11 border border-[#FFD700]/30 flex items-center justify-center group-hover:border-[#FFD700] group-hover:bg-[#FFD700]/10 transition-colors">
                            <Icon name={s.icon} size={16} className="text-[#FFD700]" />
                          </div>
                          {i < 2 && <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-[#FFD700]/20" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="font-oswald font-bold text-[#FFD700]/40 text-xs">{s.n}</span>
                            <span className="font-oswald font-bold text-white text-sm md:text-base uppercase">{s.title}</span>
                          </div>
                          <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 md:mt-6 pt-5 border-t border-[#FFD700]/10 flex items-center gap-3 text-xs">
                    <Icon name="TreePine" size={16} className="text-emerald-400 shrink-0" />
                    <span className="font-roboto text-white/50">
                      Уже <span className="text-emerald-400 font-bold">12 000+</span> устройств спасено от свалки
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
};

export default InfoCatalogTradeIn;
