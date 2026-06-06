import { useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const PRICE_EMAIL_URL = (funcUrls as Record<string, string>)["price-email"];
const LEAD_URL = (funcUrls as Record<string, string>)["send-lead"];

/* Бренды в наличии — краткая подсказка */
const BRANDS = ["iPhone", "MacBook", "iPad", "Samsung", "Xiaomi", "BORK"];

interface Props {
  onClose: () => void;
}

/* Форматирует телефон при вводе: +7 (999) 999-99-99 */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 1) return "+7";
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1,4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7,9)}-${digits.slice(9)}`;
}

export default function ApplePriceEmailModal({ onClose }: Props) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneOk = phoneDigits.length === 11;
  const canSend = name.trim().length >= 2 && phoneOk;

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    if (raw.length === 0) { setPhone("+7"); return; }
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true); setError(null);
    try {
      /* 1. Отправляем заявку (виден в разделе заявок у сотрудников) */
      const leadBody: Record<string, string> = {
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        category: "Прайс Apple",
        desc: `Запросил прайс-лист${email ? ` | Email: ${email}` : ""}`,
      };
      fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadBody),
      }).catch(() => {/* ignore */});

      /* 2. Отправляем прайс на email (если указан) */
      if (email.trim() && email.includes("@")) {
        await fetch(PRICE_EMAIL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markup: 3000,
            email: email.trim(),
            send_max: false,
            only_available: true,
          }),
        });
      }
      setDone(true);
    } catch {
      setError("Ошибка сети. Позвоните нам: 8 992 999-03-33");
    }
    setSending(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(7px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#111)",
          border: "1px solid rgba(255,215,0,0.25)",
          boxShadow: "0 0 0 1px rgba(255,215,0,0.08), 0 32px 80px rgba(0,0,0,0.75)",
        }}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFD700]/15 flex items-center justify-center">
              <Icon name="FileText" size={18} className="text-[#FFD700]" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-base uppercase tracking-wide">Прайс-лист</div>
              <div className="font-roboto text-[10px] text-white/35 -mt-0.5">только в наличии</div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Бренды */}
        <div className="px-5 pb-2 flex gap-1.5 flex-wrap">
          {BRANDS.map(b => (
            <span key={b} className="font-roboto text-[10px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}>
              {b}
            </span>
          ))}
        </div>

        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[#FFD700]/15 to-transparent mb-4" />

        {/* Тело */}
        <div className="px-5 pb-5 space-y-3.5">
          {!done ? (
            <>
              <p className="font-roboto text-[13px] text-white/55 leading-relaxed">
                Укажите имя и телефон — пришлём актуальные цены и перезвоним, если нужно.
              </p>

              {/* Имя */}
              <div>
                <div className="font-roboto text-[11px] text-white/40 mb-1">Ваше имя <span className="text-red-400">*</span></div>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Иван"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${name.trim().length >= 2 ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.1)"}` }}
                />
              </div>

              {/* Телефон */}
              <div>
                <div className="font-roboto text-[11px] text-white/40 mb-1">Телефон <span className="text-red-400">*</span></div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  placeholder="+7 (999) 999-99-99"
                  className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${phoneOk ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.1)"}` }}
                />
              </div>

              {/* Email (опционально) */}
              <div>
                <div className="font-roboto text-[11px] text-white/40 mb-1">Email <span className="text-white/20">(необязательно — пришлём PDF)</span></div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="example@mail.ru"
                  className="w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
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
                disabled={sending || !canSend}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}
              >
                <Icon name={sending ? "Loader2" : "Send"} size={17} className={sending ? "animate-spin" : ""} />
                {sending ? "Отправляю…" : "Получить прайс"}
              </button>

              <p className="font-roboto text-[10px] text-white/20 text-center">
                Только актуальные цены — без спама. Один раз.
              </p>
            </>
          ) : (
            <div className="py-4 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <Icon name="CheckCircle2" size={28} className="text-green-400" />
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-lg uppercase mb-1">Готово!</div>
                <div className="font-roboto text-sm text-white/55 leading-relaxed">
                  {email.trim() ? `Прайс отправляем на ${email}. ` : ""}
                  Скоро перезвоним!
                </div>
              </div>
              <button onClick={onClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-oswald font-bold text-sm uppercase text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
