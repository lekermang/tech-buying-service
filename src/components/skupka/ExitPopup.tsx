import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ymGoal, Goals } from "@/lib/ym";

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const STORAGE_KEY = "exit_popup_shown";
const COOLDOWN_HOURS = 48; // не показывать повторно N часов

interface ExitPopupProps {
  onOpenEval: () => void; // открыть форму оценки
}

const ExitPopup = ({ onOpenEval }: ExitPopupProps) => {
  const [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const triggered = useRef(false);

  useEffect(() => {
    // Проверяем не был ли показан недавно
    const last = localStorage.getItem(STORAGE_KEY);
    if (last) {
      const diff = (Date.now() - parseInt(last)) / 3600000;
      if (diff < COOLDOWN_HOURS) return;
    }

    // Десктоп: mouseout при уходе к адресной строке
    const handleMouseOut = (e: MouseEvent) => {
      if (triggered.current) return;
      if (e.clientY <= 10 && e.relatedTarget === null) {
        triggered.current = true;
        show();
      }
    };

    // Мобайл: срабатывает через 25 сек нахождения на странице
    let mobileTimer: ReturnType<typeof setTimeout>;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      mobileTimer = setTimeout(() => {
        if (!triggered.current) {
          triggered.current = true;
          show();
        }
      }, 25000);
    } else {
      document.addEventListener("mouseout", handleMouseOut);
    }

    return () => {
      document.removeEventListener("mouseout", handleMouseOut);
      clearTimeout(mobileTimer);
    };
  }, []);

  const show = () => {
    setVisible(true);
    ymGoal("exit_popup_show");
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  const close = () => {
    setVisible(false);
    ymGoal("exit_popup_close");
  };

  const handleEval = () => {
    close();
    ymGoal("exit_popup_eval_click");
    onOpenEval();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: "Клиент (поп-ап)", category: "", desc: "Оставил номер в поп-апе" }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      ymGoal(Goals.FORM_SUCCESS, { place: "exit_popup" });
    } catch {
      setError("Не удалось отправить. Позвоните нам.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div
        className="relative w-full max-w-md bg-[#0D0D0D] border border-[#FFD700]/40 shadow-2xl overflow-hidden animate-[slideDown_0.3s_ease]"
        style={{ boxShadow: "0 0 60px rgba(255,215,0,0.12)" }}
      >
        {/* Декоративная полоса сверху */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700]" />

        {/* Кнопка закрытия */}
        <button
          onClick={close}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-white/30 hover:text-white transition-colors z-10"
        >
          <Icon name="X" size={16} />
        </button>

        <div className="p-6">
          {sent ? (
            /* Успех */
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-[#FFD700] flex items-center justify-center mx-auto mb-4">
                <Icon name="Check" size={28} className="text-black" />
              </div>
              <p className="font-oswald text-xl font-bold text-[#FFD700] uppercase mb-2">Перезвоним!</p>
              <p className="text-white/50 text-sm">Ждите звонка в ближайшие 15 минут</p>
              <button
                onClick={close}
                className="mt-5 text-white/30 text-xs underline hover:text-white transition-colors"
              >
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Заголовок */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-1 h-12 bg-[#FFD700] shrink-0 mt-1" />
                <div>
                  <p className="font-oswald text-xl font-bold uppercase text-white leading-tight">
                    Подождите!<br />
                    <span className="text-[#FFD700]">Оценим за 5 минут</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    Оставьте номер — перезвоним и назовём цену прямо сейчас
                  </p>
                </div>
              </div>

              {/* Быстрые иконки */}
              <div className="flex gap-3 mb-5">
                {[
                  { icon: "Smartphone", label: "Телефоны" },
                  { icon: "Laptop",     label: "Ноутбуки" },
                  { icon: "Gem",        label: "Золото" },
                ].map(item => (
                  <div key={item.label} className="flex-1 flex flex-col items-center gap-1 py-2 border border-white/8 rounded text-center">
                    <Icon name={item.icon as "Smartphone"} size={18} className="text-[#FFD700]" />
                    <span className="text-white/40 text-[10px]">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Форма */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+7 (___) ___-__-__"
                  className="w-full bg-[#1A1A1A] border border-[#333] focus:border-[#FFD700] text-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/20"
                />
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3.5 uppercase tracking-widest hover:bg-yellow-400 active:scale-[0.99] transition-all disabled:opacity-60 text-base"
                >
                  {loading ? "Отправляем..." : "Перезвоните мне"}
                </button>
              </form>

              {/* Разделитель */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/20 text-xs">или</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Кнопка оценки */}
              <button
                onClick={handleEval}
                className="w-full border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold py-3 uppercase tracking-wider hover:bg-[#FFD700]/5 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Icon name="Zap" size={16} />
                Заполнить форму с фото
              </button>

              <p className="text-white/20 text-[10px] text-center mt-3">
                Работаем 24/7 · Выплата в день обращения
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitPopup;
