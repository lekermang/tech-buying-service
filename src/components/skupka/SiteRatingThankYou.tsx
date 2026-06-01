import { useState } from "react";
import Icon from "@/components/ui/icon";

const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const MAX_CHANNEL_URL = "https://max.ru/id402810962699_biz";

// Что клиенту могло понравиться (быстрые чипсы)
const LIKED_OPTIONS = [
  "Удобно и понятно",
  "Быстрая заявка",
  "Красивый дизайн",
  "Честные цены",
  "Много направлений",
  "Всё на одном сайте",
];

type Props = {
  leadId: number | null;
  onClose: () => void;
};

export default function SiteRatingThankYou({ leadId, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const toggleLiked = (opt: string) =>
    setLiked(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);

  const submit = async () => {
    if (!rating) return;
    setSending(true);
    try {
      if (leadId) {
        await fetch(`${SEND_LEAD_URL}?action=rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rate",
            lead_id: leadId,
            rating,
            liked: liked.join(", "),
            feedback: feedback.trim(),
          }),
        });
      }
    } catch { /* тихо игнорируем — оценка не критична */ }
    setSending(false);
    setSent(true);
  };

  const ratingLabel = (n: number) =>
    n <= 2 ? "Жаль! Расскажите что улучшить" :
    n === 3 ? "Спасибо! Что можно улучшить?" :
    n === 4 ? "Отлично! Почти идеально" :
    "Супер! Вы лучшие 🔥";

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden relative"
        style={{
          background: "linear-gradient(160deg,#161208,#0c0a06)",
          border: "1px solid rgba(255,215,0,0.22)",
          boxShadow: "0 0 60px rgba(255,215,0,0.12), 0 24px 60px rgba(0,0,0,0.6)",
          maxHeight: "92vh", overflowY: "auto",
        }}>

        {/* Закрыть */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
          <Icon name="X" size={16} />
        </button>

        {!sent ? (
          <div className="p-6 pt-7">
            {/* Успех заявки */}
            <div className="text-center mb-5">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}>
                <Icon name="Check" size={32} className="text-black" strokeWidth={3} />
              </div>
              <div className="font-oswald font-black text-2xl text-white uppercase tracking-wide">Заявка принята!</div>
              <div className="font-roboto text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                Перезвоним в течение 15 минут
              </div>
            </div>

            {/* Оценка сайта */}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-roboto text-center text-sm font-semibold text-white mb-3">
                Оцените наш сайт
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform active:scale-90"
                    style={{ transform: (hover || rating) >= n ? "scale(1.12)" : "scale(1)" }}>
                    <Icon name="Star" size={38}
                      className="transition-colors"
                      style={{
                        color: (hover || rating) >= n ? "#FFD700" : "rgba(255,255,255,0.15)",
                        fill: (hover || rating) >= n ? "#FFD700" : "transparent",
                        filter: (hover || rating) >= n ? "drop-shadow(0 0 6px rgba(255,215,0,0.5))" : "none",
                      } as React.CSSProperties} />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="text-center font-roboto text-xs animate-in fade-in"
                  style={{ color: rating <= 2 ? "#fb923c" : "#FFD700" }}>
                  {ratingLabel(rating)}
                </div>
              )}
            </div>

            {/* Что понравилось (показываем при оценке 4-5) */}
            {rating >= 4 && (
              <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="font-roboto text-[11px] uppercase tracking-widest mb-2"
                  style={{ color: "rgba(255,255,255,0.35)" }}>Что понравилось?</div>
                <div className="flex flex-wrap gap-2">
                  {LIKED_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => toggleLiked(opt)}
                      className="px-3 py-1.5 rounded-full font-roboto text-xs transition-all active:scale-95"
                      style={{
                        background: liked.includes(opt) ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.05)",
                        border: liked.includes(opt) ? "1px solid rgba(255,215,0,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        color: liked.includes(opt) ? "#FFD700" : "rgba(255,255,255,0.6)",
                      }}>
                      {liked.includes(opt) && "✓ "}{opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Замечания (показываем при оценке 1-3) */}
            {rating > 0 && rating <= 3 && (
              <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="font-roboto text-[11px] uppercase tracking-widest mb-2"
                  style={{ color: "rgba(255,255,255,0.35)" }}>Что улучшить? (поможете нам)</div>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  rows={3} placeholder="Напишите, что было неудобно или чего не хватило..."
                  className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>
            )}

            {/* Замечания опционально для 4-5 тоже */}
            {rating >= 4 && (
              <div className="mb-4">
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                  rows={2} placeholder="Хотите что-то добавить? (необязательно)"
                  className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>
            )}

            {/* Кнопки */}
            <div className="flex gap-2">
              <button onClick={onClose}
                className="px-4 py-3 rounded-xl font-roboto text-sm transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                Позже
              </button>
              <button onClick={submit} disabled={!rating || sending}
                className="flex-1 py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#FFE34D,#FFD700)", color: "#000" }}>
                {sending ? "Отправляю..." : "Отправить оценку"}
              </button>
            </div>
          </div>
        ) : (
          /* Финальный экран — спасибо + MAX */
          <div className="p-6 pt-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}>
              <Icon name="Heart" size={30} className="text-black" fill="#000" />
            </div>
            <div className="font-oswald font-black text-2xl text-white uppercase tracking-wide mb-1">Спасибо!</div>
            <div className="font-roboto text-sm mb-5" style={{ color: "rgba(255,255,255,0.5)" }}>
              Ваше мнение помогает нам становиться лучше
            </div>

            {/* MAX канал */}
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: "linear-gradient(145deg,rgba(0,119,255,0.12),rgba(0,119,255,0.04))", border: "1px solid rgba(56,184,248,0.3)" }}>
              <div className="font-roboto text-sm font-semibold text-white mb-1">Будьте в курсе выгодных предложений</div>
              <div className="font-roboto text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                Акции, новинки скупки и розыгрыши в нашем канале MAX
              </div>
              <a href={MAX_CHANNEL_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#38B8F8,#0077FF)", color: "#fff" }}>
                <Icon name="MessageCircle" size={18} />
                Вступить в канал MAX
              </a>
            </div>

            <button onClick={onClose}
              className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Закрыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
