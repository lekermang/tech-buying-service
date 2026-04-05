import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import AppleWidget from "@/components/skupka/AppleWidget";
import RepairWidget from "@/components/skupka/RepairWidget";
import UsedGoodsSearch from "@/components/skupka/UsedGoodsSearch";

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

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

interface HeroSectionProps {
  scrollTo: (href: string) => void;
}

const HeroSection = ({ scrollTo }: HeroSectionProps) => {
  const [formData, setFormData] = useState({ name: "", phone: "", category: "", desc: "" });
  const [photos, setPhotos] = useState<{ preview: string; base64: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        setPhotos(prev => prev.length < 5 ? [...prev, { preview: result, base64: result.split(',')[1] }] : prev);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photos: photos.map(p => p.base64) }),
      });
      if (!res.ok) throw new Error("Ошибка отправки");
      setSubmitted(true);
    } catch {
      setError("Не удалось отправить заявку. Позвоните нам по телефону.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-[88px] md:pt-[104px]" style={{ backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }}>
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/47a9e726-1666-459a-824f-d2c990b98092.jpg"
          alt="Скупка24"
          className="w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/85 to-[#0D0D0D]/40" />
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD700]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-14 lg:py-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-start w-full">
        <div className="flex flex-col">
          {/* Бейдж */}
          <div className="inline-flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/30 px-3 py-1.5 mb-4 md:mb-5 self-start">
            <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
            <span className="font-roboto text-[11px] md:text-xs text-[#FFD700] uppercase tracking-widest">Работаем 24/7 без выходных</span>
          </div>

          {/* Заголовок */}
          <h1 className="font-oswald text-[2.8rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none mb-4 md:mb-5">
            ПРОДАЙ<br />
            <span className="animate-shimmer">ТЕХНИКУ</span><br />
            ВЫГОДНО
          </h1>

          <p className="font-roboto text-white/65 text-sm sm:text-base md:text-lg mb-5 md:mb-7 max-w-md leading-relaxed">
            Честная оценка за 15 минут. Смартфоны, ноутбуки, ювелирные украшения — принимаем всё. Выплата в день обращения.
          </p>

          {/* CTA кнопки — большие, удобные для пальцев */}
          <div className="flex gap-3 mb-6 md:mb-8">
            <button onClick={() => scrollTo("#evaluate")}
              className="flex-1 sm:flex-none bg-[#FFD700] text-black font-oswald font-bold text-base sm:text-lg px-6 sm:px-8 py-4 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Icon name="Zap" size={18} />
              Оценить онлайн
            </button>
            <a href="tel:+79929990333"
              className="flex-1 sm:flex-none border-2 border-[#FFD700] text-[#FFD700] font-oswald font-bold text-base sm:text-lg px-6 sm:px-8 py-4 uppercase tracking-wide hover:bg-[#FFD700] hover:text-black active:scale-95 transition-all flex items-center justify-center gap-2">
              <Icon name="Phone" size={18} />
              Позвонить
            </a>
          </div>

          {/* Статистика */}
          <div className="flex gap-6 md:gap-8 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/5">
            {[["50 000+", "клиентов"], ["9 лет", "на рынке"], ["2", "филиала"]].map(([num, label]) => (
              <div key={label}>
                <div className="font-oswald text-xl md:text-2xl font-bold text-[#FFD700]">{num}</div>
                <div className="font-roboto text-white/40 text-[10px] md:text-xs uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>

          {/* Виджеты — компактный блок */}
          <div className="space-y-1.5">
            <a href="/catalog"
              className="flex items-center justify-between bg-black/30 border border-white/10 hover:border-[#FFD700]/40 px-3 py-3 transition-colors group w-full">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
                  <Icon name="ShoppingBag" size={11} className="text-black" />
                </div>
                <span className="font-oswald font-bold text-xs uppercase text-white tracking-wide">Каталог новой техники</span>
                <span className="bg-[#FFD700]/20 text-[#FFD700] font-roboto text-[10px] px-1.5 py-0.5 border border-[#FFD700]/30">Гарантия 2 года</span>
              </div>
              <Icon name="ChevronRight" size={14} className="text-white/40 group-hover:text-[#FFD700] transition-colors shrink-0" />
            </a>
            <UsedGoodsSearch />
            <RepairWidget />
            <a href="/tools"
              className="flex items-center justify-between bg-black/30 border border-white/10 hover:border-[#FFD700]/40 px-3 py-3 transition-colors group w-full">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center shrink-0">
                  <Icon name="Wrench" size={11} className="text-[#FFD700]" />
                </div>
                <span className="font-oswald font-bold text-xs uppercase text-white tracking-wide">Каталог инструментов и расходных материалов</span>
              </div>
              <Icon name="ChevronRight" size={13} className="text-white/40 group-hover:text-[#FFD700] transition-colors shrink-0" />
            </a>
            <AppleWidget compact />
          </div>
        </div>

        {/* Quick evaluate form */}
        <div id="evaluate">
          <div className="bg-[#1A1A1A] border border-[#FFD700]/30 p-4 sm:p-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                    <input type="text" required
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Иван"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
                  </div>
                  <div>
                    <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                    <input type="tel" required
                      value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+7 (___) ___-__-__"
                      className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
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
                  <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">
                    Фото товара <span className="text-[#FFD700]">{photos.length}/5</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative group aspect-square">
                        <img src={p.preview} alt={`фото ${idx + 1}`} className="w-full h-full object-cover border border-[#333]" />
                        <button type="button" onClick={() => removePhoto(idx)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icon name="X" size={10} />
                        </button>
                      </div>
                    ))}
                    {photos.length < 5 && (
                      <div onClick={() => fileRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-[#333] hover:border-[#FFD700] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                        <Icon name="Plus" size={18} className="text-[#FFD700]" />
                        <span className="font-roboto text-white/40 text-[10px]">фото</span>
                      </div>
                    )}
                  </div>
                  {photos.length === 0 && (
                    <p className="font-roboto text-white/30 text-xs">До 5 фотографий</p>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
                </div>

                {error && (
                  <p className="font-roboto text-red-400 text-sm text-center">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full bg-[#FFD700] text-black font-oswald font-bold text-lg sm:text-xl py-4 sm:py-5 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><Icon name="Loader" size={20} className="animate-spin" /> Отправляем...</>
                  ) : (
                    <><Icon name="Check" size={20} /> Получить оценку бесплатно</>
                  )}
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
  );
};

export default HeroSection;