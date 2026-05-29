import { useState } from "react";
import Icon from "@/components/ui/icon";

const WANT_TO_BUY_URL = "https://functions.poehali.dev/d5ad3fdc-9ae3-41a2-93da-859bf3cb852b";

const CATEGORIES = [
  "iPhone / iPad / MacBook",
  "Android / Смартфон",
  "Ноутбук / Компьютер",
  "Apple Watch / AirPods",
  "PlayStation / Xbox",
  "Фотоаппарат / Объектив",
  "Золото / Украшения",
  "Другое",
];

const CONDITIONS = [
  { value: "new", label: "Новое" },
  { value: "like_new", label: "Как новое" },
  { value: "good", label: "Хорошее б/у" },
  { value: "any", label: "Любое" },
];

type Step = "form" | "success";

export default function WantToBuySection() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [condition, setCondition] = useState("any");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !itemName.trim()) {
      setError("Заполните имя, телефон и что вы ищете");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(WANT_TO_BUY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: name.trim(),
          phone: phone.trim(),
          item_name: itemName.trim(),
          category,
          budget: budget.trim(),
          condition,
          comment: comment.trim(),
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setStep("success");
      } else {
        setError(d.error || "Ошибка отправки. Попробуйте ещё раз.");
      }
    } catch {
      setError("Нет связи. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="want-to-buy" className="relative py-14 px-4 overflow-hidden">
      {/* Фоновое свечение */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, #3b82f6 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 py-1.5 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
            </span>
            <span className="text-blue-300 text-xs font-roboto uppercase tracking-widest font-semibold">Трейдин / Поиск техники</span>
          </div>
          <h2 className="font-oswald font-bold text-3xl md:text-4xl text-white uppercase tracking-tight mb-3">
            Хочу <span className="text-blue-400">купить</span>
          </h2>
          <p className="text-white/50 font-roboto text-sm max-w-md mx-auto leading-relaxed">
            Не нашли нужное в каталоге? Оставьте заявку — мы найдём для вас б/у или новое устройство по лучшей цене
          </p>
        </div>

        {step === "success" ? (
          <div className="bg-[#111]/80 border border-blue-500/30 rounded-2xl p-8 text-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={32} className="text-blue-400" />
            </div>
            <h3 className="font-oswald font-bold text-xl text-white uppercase mb-2">Заявка принята!</h3>
            <p className="text-white/50 font-roboto text-sm mb-6">
              Мы получили вашу заявку и начнём поиск. Свяжемся с вами, как только найдём подходящий вариант.
            </p>
            <button
              onClick={() => { setStep("form"); setName(""); setPhone(""); setItemName(""); setCategory(""); setBudget(""); setCondition("any"); setComment(""); }}
              className="text-blue-400 hover:text-blue-300 text-sm font-roboto transition-colors underline underline-offset-4"
            >
              Оставить ещё одну заявку
            </button>
          </div>
        ) : (
          <div className="bg-[#111]/80 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_40px_rgba(59,130,246,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Имя + Телефон */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Ваше имя *</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Иван"
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 text-white placeholder:text-white/20 px-4 py-3 rounded-xl font-roboto text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Телефон *</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    type="tel"
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 text-white placeholder:text-white/20 px-4 py-3 rounded-xl font-roboto text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Что ищет */}
              <div>
                <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Что ищете *</label>
                <input
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="Например: iPhone 14 Pro 256GB Space Black"
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 text-white placeholder:text-white/20 px-4 py-3 rounded-xl font-roboto text-sm outline-none transition-colors"
                />
              </div>

              {/* Категория */}
              <div>
                <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat === category ? "" : cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-roboto border transition-all ${
                        category === cat
                          ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/25"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Бюджет + Состояние */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Бюджет (до)</label>
                  <input
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="50 000 ₽"
                    className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 text-white placeholder:text-white/20 px-4 py-3 rounded-xl font-roboto text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Состояние</label>
                  <div className="flex gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCondition(c.value)}
                        className={`flex-1 px-2 py-2.5 rounded-xl text-xs font-roboto border transition-all leading-tight ${
                          condition === c.value
                            ? "bg-blue-500/20 border-blue-500/60 text-blue-300"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Комментарий */}
              <div>
                <label className="block text-white/50 text-xs font-roboto uppercase tracking-wider mb-1.5">Дополнительно</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Цвет, объём памяти, комплектация — любые уточнения"
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 text-white placeholder:text-white/20 px-4 py-3 rounded-xl font-roboto text-sm outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-roboto bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 text-white font-oswald font-bold text-lg uppercase tracking-wide py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(59,130,246,0.35)]"
              >
                {loading
                  ? <><Icon name="Loader" size={20} className="animate-spin" /> Отправляем...</>
                  : <><Icon name="Search" size={20} /> Найдите мне это</>
                }
              </button>

              <p className="text-white/20 text-xs font-roboto text-center">
                Мы свяжемся с вами, как только найдём подходящий вариант. Бесплатно.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}