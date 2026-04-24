import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AppleWidget from "@/components/skupka/AppleWidget";
import RepairWidget from "@/components/skupka/RepairWidget";
import UsedGoodsSearch from "@/components/skupka/UsedGoodsSearch";
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

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const compressImage = (file: File, maxW = 1200, quality = 0.75): Promise<string> =>
  new Promise(resolve => {
    // Fallback: читаем через FileReader если canvas не сработал
    const fallback = () => {
      const reader = new FileReader();
      reader.onload = ev => resolve((ev.target?.result as string).split(",")[1]);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    };
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxW / Math.max(img.width, img.height, 1));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
        resolve(b64 || "");
      } catch {
        fallback();
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallback(); };
    img.src = url;
  });

interface HeroSectionProps {
  scrollTo: (href: string) => void;
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
}

const EvaluateModal = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: "", phone: "", category: "", desc: "", client_price: "" });
  const [photos, setPhotos] = useState<{ preview: string; base64: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      const preview = URL.createObjectURL(file);
      compressImage(file).then(base64 => {
        setPhotos(prev => prev.length < 5 ? [...prev, { preview, base64 }] : prev);
      });
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Введите ваше имя"); return; }
    if (!formData.phone.trim()) { setError("Введите телефон"); return; }
    ymGoal(Goals.FORM_SUBMIT, { category: formData.category });
    setLoading(true);
    setError(null);
    try {
      // Сначала отправляем заявку без фото — быстро и надёжно
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photos: [], client_price: formData.client_price }),
      });
      if (!res.ok) throw new Error("bad_status");
      ymGoal(Goals.FORM_SUCCESS, { category: formData.category });
      setSubmitted(true);
      // Потом тихо досылаем фото если есть (не блокируем UX)
      const readyPhotos = photos.map(p => p.base64).filter(Boolean);
      if (readyPhotos.length > 0) {
        fetch(SEND_LEAD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, desc: `[фото к заявке] ${formData.desc}`, photos: readyPhotos }),
        }).catch(() => {});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("send-lead error:", msg);
      setError(`Ошибка: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-[fadeIn_0.2s_ease]">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-[#141414] border-t sm:border border-[#FFD700]/30 shadow-2xl max-h-[95dvh] sm:max-h-[90vh] overflow-y-auto animate-[slideDown_0.25s_ease] rounded-t-2xl sm:rounded-none">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#141414] z-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-[#FFD700]" />
            <h2 className="font-oswald text-xl font-bold uppercase">Быстрая оценка</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="p-5">
          {submitted ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-[#FFD700] flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={32} className="text-black" />
              </div>
              <h3 className="font-oswald text-2xl font-bold text-[#FFD700] mb-2">ЗАЯВКА ОТПРАВЛЕНА</h3>
              <p className="font-roboto text-white/60 mb-6">Перезвоним в течение 15 минут</p>
              <button onClick={onClose} className="bg-[#FFD700] text-black font-oswald font-bold px-8 py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
                Закрыть
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Ваше имя</label>
                  <input type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Иван"
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors" />
                </div>
                <div>
                  <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Телефон</label>
                  <input type="tel"
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors" />
                </div>
              </div>

              <div>
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Категория</label>
                <select value={formData.category}
                  onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors appearance-none cursor-pointer">
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
                  className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors resize-none" />
              </div>

              <div>
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-1">Ваша цена <span className="text-white/30 normal-case">(необязательно)</span></label>
                <div className="relative">
                  <input type="number" min="0"
                    value={formData.client_price}
                    onChange={e => setFormData(p => ({ ...p, client_price: e.target.value }))}
                    placeholder="0"
                    className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-3 pr-8 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 font-roboto text-sm">₽</span>
                </div>
              </div>

              <div>
                <label className="font-roboto text-white/50 text-xs uppercase tracking-wider block mb-2">
                  Фото товара <span className="text-[#FFD700]">{photos.length}/5</span>
                </label>
                <div className="grid grid-cols-5 gap-2 mb-1">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img src={p.preview} alt={`фото ${idx + 1}`} className="w-full h-full object-cover border border-[#333]" />
                      <button type="button" onClick={() => removePhoto(idx)}
                        className="absolute top-0.5 right-0.5 w-6 h-6 bg-black/80 text-white flex items-center justify-center rounded-full border border-white/20">
                        <Icon name="X" size={11} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <div onClick={() => fileRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-[#444] hover:border-[#FFD700] active:border-[#FFD700] transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 touch-manipulation">
                      <Icon name="Plus" size={18} className="text-[#FFD700]" />
                      <span className="font-roboto text-white/40 text-[9px]">фото</span>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhoto} className="hidden" />
              </div>

              {error && (
                <p className="font-roboto text-red-400 text-sm text-center">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#FFD700] text-black font-oswald font-bold text-lg py-4 uppercase tracking-wide hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
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
  );
};

const HeroSection = ({ scrollTo, externalModalOpen, onExternalModalClose }: HeroSectionProps) => {
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

          {/* ── СЛЕВА — продающий hero ────────────────────────────────────── */}
          <div className="flex flex-col">

            {/* Бейдж «24/7» — премиум-капсула как в секциях Trade In */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/40 px-3.5 py-1.5 mb-5 md:mb-6 self-start rounded-full shadow-[0_0_24px_rgba(255,215,0,0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD700]" />
              </span>
              <span className="font-roboto text-[11px] md:text-xs text-[#FFD700] uppercase tracking-[0.25em] font-semibold">Работаем 24/7 без выходных</span>
            </div>

            {/* Продающий заголовок с премиум-градиентом */}
            <h1 className="font-oswald text-[3rem] sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.92] mb-4 md:mb-5 tracking-tight">
              <span className="block text-white">ПРОДАЙ</span>
              <span className="block bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">ТЕХНИКУ</span>
              <span className="block text-white">
                ВЫГОДНО
                <span className="text-[#FFD700]">.</span>
              </span>
            </h1>

            {/* Подзаголовок с ключевыми триггерами */}
            <p className="font-roboto text-white/75 text-sm sm:text-base md:text-lg mb-5 md:mb-7 max-w-md leading-relaxed">
              Честная оценка <span className="text-[#FFD700] font-semibold">за 15 минут</span>. Смартфоны, ноутбуки, ювелирные украшения — принимаем всё. <span className="text-[#FFD700] font-semibold">Выплата</span> в день обращения.
            </p>

            {/* USP-чипы (продающие триггеры) */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {[
                { icon: "Zap" as const, label: "За 15 минут" },
                { icon: "BadgeCheck" as const, label: "Честная цена" },
                { icon: "Banknote" as const, label: "Деньги сразу" },
                { icon: "FileText" as const, label: "Договор" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-1.5 bg-black/40 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-2.5 py-1.5 rounded-md transition-colors">
                  <Icon name={f.icon} size={12} className="text-[#FFD700]" />
                  <span className="font-roboto text-white/80 text-[11px] uppercase tracking-wide">{f.label}</span>
                </div>
              ))}
            </div>

            {/* Премиум-CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-7 md:mb-9">
              <button onClick={() => { setModalOpen(true); ymGoal(Goals.FORM_OPEN, { place: "hero" }); }}
                className="group relative overflow-hidden font-oswald font-bold text-black text-base sm:text-lg px-7 sm:px-9 py-4 uppercase tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2 rounded-md
                           bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                           shadow-[0_0_0_1px_rgba(255,215,0,0.6),0_10px_30px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                           hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_12px_40px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]">
                <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Icon name="Zap" size={18} className="relative" />
                <span className="relative">Оценить онлайн</span>
                <Icon name="ArrowRight" size={16} className="relative opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="tel:+79929990333"
                onClick={() => ymGoal(Goals.CALL_CLICK, { place: "hero" })}
                className="group bg-black/40 backdrop-blur-sm border border-[#FFD700]/40 hover:border-[#FFD700] text-[#FFD700] font-oswald font-bold text-base sm:text-lg px-6 sm:px-8 py-4 uppercase tracking-wide active:scale-95 transition-all flex items-center justify-center gap-2.5 rounded-md">
                <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/40 flex items-center justify-center group-hover:bg-[#FFD700]/25 transition-colors">
                  <Icon name="Phone" size={14} />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] text-[#FFD700]/60 tracking-wider">Звонок бесплатный</span>
                  <span>Позвонить</span>
                </div>
              </a>
            </div>

            {/* Социальные доказательства — премиум-стат-блок */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 pb-6 md:pb-8">
              {[
                { num: "50 000+", label: "клиентов", icon: "Users" as const },
                { num: "9 лет", label: "на рынке", icon: "Award" as const },
                { num: "4.9 ★", label: "на картах", icon: "Star" as const },
              ].map((s) => (
                <div key={s.label} className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="relative bg-black/50 border border-[#FFD700]/20 hover:border-[#FFD700]/50 px-3 py-3 md:py-4 transition-colors rounded-md">
                    <Icon name={s.icon} size={14} className="text-[#FFD700]/50 mb-1.5" />
                    <div className="font-oswald text-xl md:text-2xl font-bold text-[#FFD700] leading-none">{s.num}</div>
                    <div className="font-roboto text-white/50 text-[10px] md:text-xs uppercase tracking-wide mt-1">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Нижний слоган-триггер */}
            <div className="hidden lg:flex items-center gap-2 self-start bg-black/40 border border-[#FFD700]/25 px-4 py-2 rounded-full">
              <span className="text-lg">🍎</span>
              <span className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide">Купим дороже всех Apple технику!</span>
            </div>
          </div>

          {/* ── СПРАВА — премиум-виджеты ──────────────────────────────────── */}
          <div id="evaluate" className="space-y-2.5 relative">
            {/* Декоративное свечение за стаком */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[#FFD700]/8 via-transparent to-[#FFD700]/5 blur-2xl pointer-events-none" />

            <a href="/catalog"
              className="relative flex items-center justify-between bg-black/50 backdrop-blur-sm border border-[#FFD700]/20 hover:border-[#FFD700]/60 hover:bg-black/70 px-4 py-4 transition-all group w-full rounded-md overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 bg-[linear-gradient(135deg,#fff3a0,#ffd700,#d4a017)] rounded-md flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(255,215,0,0.25)]">
                  <Icon name="ShoppingBag" size={20} className="text-black" />
                </div>
                <div>
                  <span className="font-oswald font-bold text-base uppercase text-white tracking-wide block leading-tight">Каталог новой техники</span>
                  <span className="inline-flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#FFD700]/30 mt-1 uppercase tracking-wider">
                    <Icon name="ShieldCheck" size={9} />
                    Гарантия 2 года
                  </span>
                </div>
              </div>
              <Icon name="ChevronRight" size={20} className="relative text-[#FFD700]/40 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0" />
            </a>

            <div className="relative">
              <UsedGoodsSearch />
            </div>

            <div className="relative">
              <RepairWidget />
            </div>

            <a href="/tools"
              className="relative flex items-center justify-between bg-black/50 backdrop-blur-sm border border-[#FFD700]/20 hover:border-[#FFD700]/60 hover:bg-black/70 px-4 py-4 transition-all group w-full rounded-md overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#FFD700]/15 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 bg-[#FFD700]/15 border border-[#FFD700]/40 rounded-md flex items-center justify-center shrink-0">
                  <Icon name="Wrench" size={20} className="text-[#FFD700]" />
                </div>
                <div>
                  <span className="font-oswald font-bold text-base uppercase text-white tracking-wide leading-tight block">Каталог инструментов и расходных материалов</span>
                  <span className="inline-flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] font-oswald font-bold text-[10px] px-2 py-0.5 rounded-sm border border-[#FFD700]/30 mt-1 uppercase tracking-wider">
                    <Icon name="ShieldCheck" size={9} />
                    Гарантия 3 года
                  </span>
                </div>
              </div>
              <Icon name="ChevronRight" size={20} className="relative text-[#FFD700]/40 group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all shrink-0" />
            </a>

            <div className="relative">
              <AppleWidget compact />
            </div>

            {/* Мобильный Apple-слоган — показывается ниже lg */}
            <div className="lg:hidden flex items-center justify-center gap-2 bg-black/40 border border-[#FFD700]/25 px-4 py-2.5 rounded-full mt-3">
              <span className="text-lg">🍎</span>
              <span className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide">Купим дороже всех Apple технику!</span>
            </div>
          </div>

        </div>
      </section>
    </>
  );
};

export default HeroSection;