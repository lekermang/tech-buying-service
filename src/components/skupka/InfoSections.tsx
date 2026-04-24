import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";
import { ymGoal, Goals } from "@/lib/ym";

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
  { city: "Калуга", addr: "ул. Кирова, 11", metro: "г. Калуга, центр города", time: "24/7 без выходных", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
  { city: "Калуга", addr: "ул. Кирова, 7/47", metro: "г. Калуга, центр города", time: "24/7 без выходных", phones: ["+7 (992) 999-03-33", "8 (800) 600-68-33"] },
];

const InfoSections = () => {
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

      {/* HOW IT WORKS */}
      <section id="how" className="py-14 md:py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Процесс</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">КАК ЭТО<br />РАБОТАЕТ</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {HOW_STEPS.map((step, i) => (
              <Reveal key={step.num} delay={(i) as 0|1|2|3|4|5}>
                <div className="relative">
                  <div className="text-[4rem] md:text-[5rem] font-oswald font-bold text-[#FFD700]/5 leading-none absolute -top-3 -left-2 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className="relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 border-2 border-[#FFD700] flex items-center justify-center mb-4">
                      <Icon name={step.icon} size={22} className="text-[#FFD700]" />
                    </div>
                    {i < HOW_STEPS.length - 1 && (
                      <div className="hidden md:block absolute top-7 left-14 right-0 h-px bg-[#FFD700]/20" />
                    )}
                    <h3 className="font-oswald text-base md:text-xl font-bold uppercase mb-2">{step.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section id="guarantees" className="py-14 md:py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Надёжность</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">НАШИ<br />ГАРАНТИИ</h2>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#FFD700]/10">
            {GUARANTEES.map((g, i) => (
              <Reveal key={g.title} delay={(i) as 0|1|2|3|4|5}>
                <div className="bg-[#0D0D0D] p-5 md:p-8 hover:bg-[#1A1A1A] transition-colors group h-full flex gap-4 sm:block">
                  <div className="w-12 h-12 shrink-0 bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center sm:mb-4 group-hover:bg-[#FFD700]/20 transition-colors">
                    <Icon name={g.icon} size={24} className="text-[#FFD700]" />
                  </div>
                  <div>
                    <h3 className="font-oswald text-lg md:text-xl font-bold uppercase mb-1 md:mb-2">{g.title}</h3>
                    <p className="font-roboto text-white/50 text-xs md:text-sm leading-relaxed">{g.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BRANCHES */}
      <section id="branches" className="py-14 md:py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <Reveal className="mb-8 md:mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Калуга</p>
            <h2 className="font-oswald text-3xl md:text-5xl font-bold">НАШ<br />ОФИС В КАЛУГЕ</h2>
          </Reveal>

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
                <div className="px-4 py-2.5 bg-[#FFD700]/5 border-b border-[#FFD700]/20 flex items-center gap-2">
                  <Icon name="MapPin" size={14} className="text-[#FFD700]" />
                  <span className="font-oswald font-bold text-sm uppercase text-white">Кирова, 11</span>
                </div>
                <iframe
                  src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=52473097879"
                  className="w-full h-[320px] md:h-[400px] block"
                  frameBorder="0"
                  loading="lazy"
                  title="Скупка24 — Кирова 11"
                />
                <a
                  href="https://yandex.ru/maps/?rtext=~54.513845,36.261215&rtt=auto&oid=52473097879"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase tracking-wide py-3 hover:bg-[#FFED4E] active:scale-[0.98] transition-all"
                >
                  <Icon name="Navigation" size={16} />
                  Построить маршрут
                </a>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="border border-[#FFD700]/20 overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#FFD700]/5 border-b border-[#FFD700]/20 flex items-center gap-2">
                  <Icon name="MapPin" size={14} className="text-[#FFD700]" />
                  <span className="font-oswald font-bold text-sm uppercase text-white">Кирова, 7/47</span>
                </div>
                <iframe
                  src="https://yandex.ru/map-widget/v1/?z=12&ol=biz&oid=114124804072"
                  className="w-full h-[320px] md:h-[400px] block"
                  frameBorder="0"
                  loading="lazy"
                  title="Скупка24 — Кирова 7/47"
                />
                <a
                  href="https://yandex.ru/maps/?rtext=~54.510800,36.253900&rtt=auto&oid=114124804072"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#FFD700] text-black font-oswald font-bold text-sm uppercase tracking-wide py-3 hover:bg-[#FFED4E] active:scale-[0.98] transition-all"
                >
                  <Icon name="Navigation" size={16} />
                  Построить маршрут
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">О компании</p>
              <h2 className="font-oswald text-4xl md:text-5xl font-bold mb-6">МЫ ЦЕНИМ<br />ЧЕСТНОСТЬ</h2>
              <p className="font-roboto text-white/60 leading-relaxed mb-4">
                Скупка24 работает в Калуге с 2015 года. Наш офис — ул. Кирова, 11. За это время мы провели более 50 000 сделок и выплатили клиентам сотни миллионов рублей. Наш принцип прост: честная цена и уважение к каждому клиенту.
              </p>
              <p className="font-roboto text-white/60 leading-relaxed mb-8">
                Все наши оценщики — сертифицированные специалисты. Мы не занижаем цены и не используем серые схемы. Только прозрачные сделки, официальный договор и выплата день в день. Работаем в Калуге круглосуточно, 24/7.
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[["50 000+", "сделок"], ["₽ 500 млн", "выплачено"]].map(([num, label]) => (
                  <div key={label} className="border-l-2 border-[#FFD700] pl-4">
                    <div className="font-oswald text-2xl font-bold text-[#FFD700]">{num}</div>
                    <div className="font-roboto text-white/40 text-xs uppercase tracking-wide">{label}</div>
                  </div>
                ))}
                <div className="border-l-2 border-[#FFD700] pl-4">
                  <div className="font-oswald text-2xl font-bold text-[#FFD700]">5.0 ★★★★★</div>
                  <div className="font-roboto text-white/40 text-xs uppercase tracking-wide">рейтинг</div>
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
                  alt="О компании"
                  className="w-full h-80 object-cover relative"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-20 bg-[#111] border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Яндекс Карты</p>
              <h2 className="font-oswald text-4xl md:text-5xl font-bold">ОТЗЫВЫ<br />КЛИЕНТОВ</h2>
            </div>
            <a href="https://yandex.ru/profile/52473097879?lang=ru" target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold px-5 py-2 uppercase tracking-wide hover:border-[#FFD700] transition-colors text-sm mb-4">
              <Icon name="ExternalLink" size={14} />
              Все отзывы
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Антон К.", rating: 5, text: "Отличный сервис! Сдал iPhone 13, оценили быстро и честно. Деньги получил сразу на карту. Рекомендую!", date: "2024" },
              { name: "Марина С.", rating: 5, text: "Приятно удивлена — предложили хорошую цену за ноутбук, без торга и занижений. Всё официально, договор на руках.", date: "2024" },
              { name: "Дмитрий В.", rating: 5, text: "Быстро, чётко, по делу. Сдал PlayStation 5, оценили за 10 минут. Цена выше, чем в других скупках города.", date: "2024" },
              { name: "Ольга Н.", rating: 5, text: "Уже второй раз обращаюсь. Всегда честная оценка, вежливый персонал. Золотое кольцо приняли по хорошей цене.", date: "2024" },
              { name: "Игорь Р.", rating: 5, text: "Работают 24/7 — это огромный плюс. Приехал поздно вечером, всё оформили быстро. Деньги наличными сразу.", date: "2024" },
              { name: "Светлана М.", rating: 5, text: "Сдала MacBook и умные часы. Оценили честно, никакого обмана. Работают профессионально, советую всем!", date: "2024" },
            ].map((r) => (
              <div key={r.name} className="bg-[#0D0D0D] border border-[#FFD700]/10 p-6 hover:border-[#FFD700]/30 transition-colors">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <span key={i} className="text-[#FFD700] text-sm">★</span>
                  ))}
                </div>
                <p className="font-roboto text-white/70 text-sm leading-relaxed mb-4">«{r.text}»</p>
                <div className="flex items-center justify-between">
                  <span className="font-oswald font-bold text-white/50 text-sm uppercase">{r.name}</span>
                  <span className="font-roboto text-white/30 text-xs">{r.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href="https://yandex.ru/profile/52473097879?lang=ru" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFD700] text-black font-oswald font-bold px-8 py-4 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
              <Icon name="Star" size={16} />
              Читать все отзывы на Яндексе
            </a>
          </div>
        </div>
      </section>

      {/* AVITO */}
      <section id="avito" className="border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Маркетплейс</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">МЫ НА АВИТО</h2>
          </div>

          <a href="https://www.avito.ru/brands/skupka24kirova7" target="_blank" rel="noopener noreferrer"
            className="block group relative overflow-hidden border border-[#00AAFF]/30 hover:border-[#00AAFF] transition-colors">
            <div className="bg-gradient-to-r from-[#003D5C] to-[#001F2E] p-8 md:p-12 flex flex-wrap items-center justify-between gap-8">
              {/* Left */}
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-[#00AAFF] flex items-center justify-center font-oswald font-bold text-white text-2xl shrink-0">AV</div>
                <div>
                  <div className="font-oswald text-2xl md:text-3xl font-bold text-white uppercase mb-1">Скупка24 на Авито</div>
                  <div className="font-roboto text-white/50 text-sm">Актуальные объявления · Отзывы покупателей · Безопасные сделки</div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {[["✓ Быстрый ответ", ""], ["✓ Проверенный продавец", ""], ["✓ Безопасная сделка", ""]].map(([label]) => (
                      <span key={label} className="font-roboto text-[#00AAFF] text-xs">{label}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Right CTA */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="bg-[#00AAFF] text-white font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide group-hover:bg-[#0099EE] transition-colors flex items-center gap-3">
                  <Icon name="ExternalLink" size={18} />
                  Смотреть объявления
                </div>
                <span className="font-roboto text-white/30 text-xs">avito.ru/brands/skupka24kirova7</span>
              </div>
            </div>
            {/* Animated border */}
            <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-0.5 bg-[#00AAFF] transition-all duration-500" />
          </a>
        </div>
      </section>
    </>
  );
};

export default InfoSections;