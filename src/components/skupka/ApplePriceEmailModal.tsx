import { useState } from "react";
import Icon from "@/components/ui/icon";

const PRICE_EMAIL_URL = "https://functions.poehali.dev/9e9486d9-57f0-454c-bc19-b46e3d4bc682";

interface Props {
  onClose: () => void;
}

export default function ApplePriceEmailModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_token: "Mark2015N",
          markup: 3000,
          email: email.trim(),
          send_max: false,
          only_available: true,
        }),
      });
      const d = await res.json();
      if (d.ok && d.email_sent) {
        setResult(`Прайс отправлен на ${d.email_to}`);
      } else {
        setError(d.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка сети, попробуйте ещё раз");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#111)",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.1), 0 32px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 flex items-center justify-center">
              <Icon name="Mail" size={18} className="text-[#FFD700]" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-base uppercase tracking-wide">Прайс Apple</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Разделитель */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent mb-4" />

        {/* Тело */}
        <div className="px-5 pb-5 space-y-4">
          {!result ? (
            <>
              <p className="font-roboto text-sm text-white/60 leading-relaxed">
                Пришлём актуальный прайс-лист iPhone, MacBook и iPad прямо на почту — только в наличии.
              </p>

              <div>
                <div className="font-roboto text-[11px] text-white/40 mb-1.5">Ваш Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="example@mail.ru"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 font-roboto text-[12px] text-red-400">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}
              >
                <Icon name={sending ? "Loader2" : "Send"} size={17} className={sending ? "animate-spin" : ""} />
                {sending ? "Отправляю…" : "Получить прайс"}
              </button>

              <p className="font-roboto text-[10px] text-white/25 text-center leading-relaxed">
                Только цены — никакого спама. Один раз, по запросу.
              </p>
            </>
          ) : (
            <div className="py-4 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <Icon name="CheckCircle2" size={28} className="text-green-400" />
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-lg uppercase mb-1">Готово!</div>
                <div className="font-roboto text-sm text-white/55 leading-relaxed">{result}</div>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-oswald font-bold text-sm uppercase text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}