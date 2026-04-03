import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "Главная", href: "#hero" },
  { label: "Что принимаем", href: "#catalog" },
  { label: "Как работает", href: "#how" },
  { label: "Гарантии", href: "#guarantees" },
  { label: "Филиалы", href: "#branches" },
  { label: "О нас", href: "#about" },
  { label: "Контакты", href: "#contacts" },
];

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
  { city: "Филиал 1", addr: "ул. Кирова, 11", metro: "", time: "10:00 — 21:00", phone: "+7 (992) 999-03-33" },
  { city: "Филиал 2", addr: "ул. Кирова, 7/47", metro: "", time: "10:00 — 21:00", phone: "8 (800) 600-68-33" },
];

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const Index = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", category: "", desc: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        setPhotoPreview(result);
        setPhotoBase64(result.split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photo: photoBase64 }),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      setSubmitted(true);
    } catch {
      setError("Не удалось отправить заявку. Позвоните нам по телефону.");
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-sm border-b border-[#FFD700]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700] flex items-center justify-center">
              <span className="font-oswald font-bold text-black text-sm leading-none">С24</span>
            </div>
            <span className="font-oswald font-bold text-xl tracking-wider text-[#FFD700]">СКУПКА24</span>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="font-roboto text-sm text-white/70 hover:text-[#FFD700] transition-colors uppercase tracking-wide">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:+79929990333" className="hidden md:flex items-center gap-2 text-[#FFD700] font-oswald font-semibold text-base hover:opacity-80 transition-opacity">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-white hover:text-[#FFD700]">
              <Icon name={menuOpen ? "X" : "Menu"} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden bg-[#1A1A1A] border-t border-[#FFD700]/20 px-4 py-4">
            {NAV_LINKS.map(l => (
              <button key={l.href} onClick={() => scrollTo(l.href)}
                className="block w-full text-left py-3 font-roboto text-white/80 hover:text-[#FFD700] border-b border-white/5 uppercase tracking-wide text-sm">
                {l.label}
              </button>
            ))}
            <a href="tel:+79929990333" className="flex items-center gap-2 mt-4 text-[#FFD700] font-oswald font-semibold text-lg">
              <Icon name="Phone" size={16} />
              +7 (992) 999-03-33
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16" style={{backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px"}}>
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/47a9e726-1666-459a-824f-d2c990b98092.jpg"
            alt="Скупка24"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/85 to-[#0D0D0D]/40" />
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700]" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 px-3 py-1 mb-6">
              <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
              <span className="font-roboto text-xs text-[#FFD700] uppercase tracking-widest">Работаем сегодня 10:00 — 21:00</span>
            </div>

            <h1 className="font-oswald text-5xl md:text-7xl font-bold leading-none mb-6">
              ПРОДАЙ<br />
              <span className="text-[#FFD700]">ТЕХНИКУ</span><br />
              ВЫГОДНО
            </h1>

            <p className="font-roboto text-white/65 text-lg mb-8 max-w-md leading-relaxed">
              Честная оценка за 15 минут. Смартфоны, ноутбуки, ювелирные украшения — принимаем всё. Выплата в день обращения.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => scrollTo("#evaluate")}
                className="bg-[#FFD700] text-black font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
                Оценить онлайн
              </button>
              <a href="tel:+74951234567"
                className="border-2 border-[#FFD700] text-[#FFD700] font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide hover:bg-[#FFD700] hover:text-black transition-colors">
                Позвонить
              </a>
            </div>

            <div className="flex gap-8 mt-10">
              {[["50 000+", "клиентов"], ["9 лет", "на рынке"], ["4", "филиала"]].map(([num, label]) => (
                <div key={label}>
                  <div className="font-oswald text-3xl font-bold text-[#FFD700]">{num}</div>
                  <div className="font-roboto text-white/45 text-sm uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick evaluate form */}
          <div id="evaluate">
            <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-[#FFD700]" />
                <h2 className="font-oswald text-2xl font-bold uppercase">Быстрая оценка</h2>
              </div>

              {submitted ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-[#FFD700] flex items-center justify-center mx-auto mb-4">
                    <Icon name="Check" size={32} className="text-black" />
                  </div>
                  <h3 className="font-oswald text-2xl font-bold text-[#FFD700] mb-2">ЗАЯВКА ОТПРАВЛЕНА</h3>
                  <p className="font-roboto text-white/60">Перезвоним в течение 15 минут</p>
                  <button onClick={() => setSubmitted(false)} className="mt-6 text-[#FFD700] text-sm hover:underline font-roboto">
                    Отправить ещё одну заявку
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                      <input type="text" required
                        value={formData.name}
                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Иван"
                        className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
                    </div>
                    <div>
                      <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                      <input type="tel" required
                        value={formData.phone}
                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+7 (___) ___-__-__"
                        className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Категория</label>
                    <select value={formData.category}
                      onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors appearance-none cursor-pointer">
                      <option value="">Выберите категорию</option>
                      {CATEGORIES.map(c => <option key={c.title} value={c.title}>{c.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Описание товара</label>
                    <textarea value={formData.desc}
                      onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                      placeholder="Модель, состояние, комплектация..."
                      rows={3}
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors resize-none" />
                  </div>

                  <div>
                    <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Фото товара</label>
                    <div onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-[#333] hover:border-[#FFD700] transition-colors cursor-pointer p-4 flex items-center justify-center gap-3 min-h-[80px]">
                      {photoPreview ? (
                        <img src={photoPreview} alt="preview" className="h-16 w-auto object-contain" />
                      ) : (
                        <>
                          <Icon name="Upload" size={20} className="text-[#FFD700]" />
                          <span className="font-roboto text-white/50 text-sm">Загрузить фото</span>
                        </>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    </div>
                  </div>

                  {error && (
                    <p className="font-roboto text-red-400 text-sm text-center">{error}</p>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full bg-[#FFD700] text-black font-oswald font-bold text-lg py-4 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Отправляем..." : "Получить оценку бесплатно"}
                  </button>

                  <p className="font-roboto text-white/30 text-xs text-center">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

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
                  <div className="flex items-center gap-2">
                    <Icon name="Phone" size={14} className="text-[#FFD700] shrink-0" />
                    <a href={`tel:${b.phone.replace(/\D/g, '')}`} className="font-roboto text-white/70 text-sm hover:text-[#FFD700] transition-colors">{b.phone}</a>
                  </div>
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
                src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/47a9e726-1666-459a-824f-d2c990b98092.jpg"
                alt="О компании"
                className="w-full h-80 object-cover relative grayscale"
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
          <a href="https://avito.ru" target="_blank" rel="noopener noreferrer"
            className="border-2 border-[#00AAFF] text-[#00AAFF] font-oswald font-bold px-6 py-3 uppercase tracking-wide hover:bg-[#00AAFF] hover:text-white transition-colors">
            Открыть на Авито
          </a>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-20 border-t border-[#FFD700]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <p className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest mb-2">Связь</p>
            <h2 className="font-oswald text-4xl md:text-5xl font-bold">КОНТАКТЫ</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "Phone", title: "Телефон", lines: ["+7 (992) 999-03-33", "8 (800) 600-68-33 (бесплатно)"], href: "tel:+79929990333" },
              { icon: "MessageCircle", title: "WhatsApp / Telegram", lines: ["@skupka24", "Ответим за 5 минут"], href: "https://t.me/skupka24" },
              { icon: "Mail", title: "Email", lines: ["info@skupka24.ru", "Для деловых запросов"], href: "mailto:info@skupka24.ru" },
            ].map((c) => (
              <a key={c.title} href={c.href}
                className="border border-[#FFD700]/20 p-6 hover:border-[#FFD700] transition-colors group block">
                <div className="w-12 h-12 border border-[#FFD700]/20 flex items-center justify-center mb-4 group-hover:bg-[#FFD700]/10 transition-colors">
                  <Icon name={c.icon} size={22} className="text-[#FFD700]" />
                </div>
                <h3 className="font-oswald text-lg font-bold uppercase mb-2">{c.title}</h3>
                {c.lines.map(l => <p key={l} className="font-roboto text-white/60 text-sm">{l}</p>)}
              </a>
            ))}
          </div>

          <div className="mt-12 bg-[#FFD700] p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-oswald text-2xl font-bold text-black uppercase">Готовы продать технику?</h3>
              <p className="font-roboto text-black/60 text-sm mt-1">Оценим бесплатно. Деньги в день обращения.</p>
            </div>
            <button onClick={() => scrollTo("#evaluate")}
              className="bg-black text-[#FFD700] font-oswald font-bold text-lg px-8 py-4 uppercase tracking-wide hover:bg-[#1A1A1A] transition-colors">
              Оценить сейчас
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A0A0A] border-t border-[#FFD700]/10 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <span className="font-oswald font-bold text-black text-xs">С24</span>
            </div>
            <span className="font-oswald font-bold text-[#FFD700]">СКУПКА24</span>
          </div>
          <p className="font-roboto text-white/30 text-sm">© 2015–2026 Скупка24. Все права защищены.</p>
          <div className="flex gap-6">
            {["Политика конфиденциальности", "Договор оферты"].map(l => (
              <a key={l} href="#" className="font-roboto text-white/30 text-xs hover:text-white/60 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;