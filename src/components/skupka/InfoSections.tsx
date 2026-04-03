import Icon from "@/components/ui/icon";

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

const HOW_STEPS = [
  { num: "01", icon: "MessageSquare", title: "Оставьте заявку", desc: "Опишите товар и загрузите фото через форму или позвоните нам" },
  { num: "02", icon: "Calculator", title: "Получите оценку", desc: "Наш специалист оценит товар за 15 минут и назовёт честную цену" },
  { num: "03", icon: "MapPin", title: "Приезжайте к нам", desc: "Выберите удобный филиал. Осмотр займёт не более 10 минут" },
  { num: "04", icon: "Banknote", title: "Получите деньги", desc: "Выплата наличными или переводом на карту в день обращения" },
];

const GUARANTEES = [
  { icon: "ShieldCheck", title: "Честная оценка", desc: "Работаем по рыночным ценам. Никаких скрытых комиссий и занижений." },
  { icon: "Clock", title: "Быстро — 15 минут", desc: "Оценка и выкуп за одно посещение. Ваше время ценим." },
  { icon: "FileText", title: "Официальный договор", desc: "Каждая сделка оформляется официально. Вы защищены законом." },
  { icon: "BadgeCheck", title: "Работаем с 2015 года", desc: "9 лет на рынке. Более 50 000 довольных клиентов." },
  { icon: "Repeat", title: "Выкуп или обмен", desc: "Можем выкупить или предложить товар в зачёт новой покупки." },
  { icon: "Star", title: "4.9 на картах", desc: "Рейтинг 4.9 на Яндекс Картах и Google. Проверьте отзывы сами." },
];

const BRANCHES = [
  { city: "Филиал 1", addr: "ул. Кирова, 11", metro: "", time: "24/7", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
  { city: "Филиал 2", addr: "ул. Кирова, 7/47", metro: "", time: "24/7", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
];

const InfoSections = () => {
  return (
    <>
      {/* CATEGORIES */}
      <section id="catalog" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Что принимаем</p>
              <h2 className="font-oswald text-4xl md:text-5xl font-bold">ВСЁ ЧТО ИМЕЕТ<br />ЦЕННОСТЬ</h2>
            </div>
            <div className="hidden md:block w-24 h-1 bg-[#FFD700] mb-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#FFD700]/10">
            {CATEGORIES.map((cat) => (
              <div key={cat.title}
                className="bg-[#0D0D0D] p-6 hover:bg-[#1A1A1A] transition-colors group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 left-0 w-0 group-hover:w-full h-0.5 bg-[#FFD700] transition-all duration-300" />
                <Icon name={cat.icon} size={28} className="text-[#FFD700] mb-4" />
                <h3 className="font-oswald text-xl font-bold mb-1 uppercase">{cat.title}</h3>
                <p className="font-roboto text-white/50 text-sm mb-3">{cat.desc}</p>
                <span className="font-oswald text-[#FFD700] font-bold text-sm">{cat.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Процесс</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">КАК ЭТО<br />РАБОТАЕТ</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="text-[6rem] font-oswald font-bold text-[#FFD700]/5 leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="relative">
                  <div className="w-14 h-14 border-2 border-[#FFD700] flex items-center justify-center mb-4">
                    <Icon name={step.icon} size={24} className="text-[#FFD700]" />
                  </div>
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-14 right-0 h-px bg-[#FFD700]/20" />
                  )}
                  <h3 className="font-oswald text-xl font-bold uppercase mb-2">{step.title}</h3>
                  <p className="font-roboto text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Надёжность</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">НАШИ<br />ГАРАНТИИ</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-[#FFD700]/10">
            {GUARANTEES.map((g) => (
              <div key={g.title} className="bg-[#0D0D0D] p-8 hover:bg-[#1A1A1A] transition-colors group">
                <div className="w-12 h-12 bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
                  <Icon name={g.icon} size={24} className="text-[#FFD700]" />
                </div>
                <h3 className="font-oswald text-xl font-bold uppercase mb-2">{g.title}</h3>
                <p className="font-roboto text-white/50 text-sm leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRANCHES */}
      <section id="branches" className="py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Адреса</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">НАШИ<br />ФИЛИАЛЫ</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {BRANCHES.map((b, i) => (
              <div key={b.city} className="border border-[#FFD700]/20 p-6 hover:border-[#FFD700]/60 transition-colors group relative overflow-hidden">
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
                      <a href={`tel:${phone.replace(/\D/g, '')}`} className="font-roboto text-white/70 text-sm hover:text-[#FFD700] transition-colors">{phone}</a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">О компании</p>
              <h2 className="font-oswald text-4xl md:text-5xl font-bold mb-6">МЫ ЦЕНИМ<br />ЧЕСТНОСТЬ</h2>
              <p className="font-roboto text-white/60 leading-relaxed mb-4">
                Скупка24 работает с 2015 года. За это время мы провели более 50 000 сделок и выплатили клиентам сотни миллионов рублей. Наш принцип прост: честная цена и уважение к каждому клиенту.
              </p>
              <p className="font-roboto text-white/60 leading-relaxed mb-8">
                Все наши оценщики — сертифицированные специалисты. Мы не занижаем цены и не используем серые схемы. Только прозрачные сделки, официальный договор и выплата день в день.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[["50 000+", "сделок"], ["₽ 500 млн", "выплачено"], ["4.9 ★", "рейтинг"]].map(([num, label]) => (
                  <div key={label} className="border-l-2 border-[#FFD700] pl-4">
                    <div className="font-oswald text-2xl font-bold text-[#FFD700]">{num}</div>
                    <div className="font-roboto text-white/40 text-xs uppercase tracking-wide">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-[#FFD700]/5" />
              <div className="absolute top-0 right-0 w-1/2 h-1 bg-[#FFD700]" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#FFD700]" />
              <img
                src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/a1949b69-d0e9-4258-a070-4865807b102b.jpg"
                alt="О компании"
                className="w-full h-80 object-cover relative"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AVITO */}
      <section id="avito" className="py-12 bg-[#1A1A1A] border-t border-b border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#00AAFF] flex items-center justify-center font-bold text-white text-lg font-oswald">AV</div>
            <div>
              <h3 className="font-oswald text-xl font-bold uppercase">Мы на Авито</h3>
              <p className="font-roboto text-white/50 text-sm">Смотрите наши объявления и отзывы покупателей</p>
            </div>
          </div>
          <a href="https://www.avito.ru/brands/skupka24kirova7" target="_blank" rel="noopener noreferrer"
            className="border-2 border-[#00AAFF] text-[#00AAFF] font-oswald font-bold px-6 py-3 uppercase tracking-wide hover:bg-[#00AAFF] hover:text-white transition-colors">
            Открыть на Авито
          </a>
        </div>
      </section>
    </>
  );
};

export default InfoSections;