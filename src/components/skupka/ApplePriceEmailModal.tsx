import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import funcUrls from "../../../backend/func2url.json";

const LEAD_URL       = (funcUrls as Record<string, string>)["send-lead"];
const PRICE_EMAIL_URL = (funcUrls as Record<string, string>)["price-email"];
const PRICE_PDF_URL   = (funcUrls as Record<string, string>)["price-pdf"];

const BRANDS = ["iPhone", "MacBook", "iPad", "Samsung", "Xiaomi", "BORK"];

const INP_CLS = [
  "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/90 outline-none transition-colors",
  "bg-white/[0.06] border border-white/10 focus:border-[#FFD700]/40 placeholder:text-white/20",
].join(" ");

const LBL_CLS = "block font-roboto text-[11px] text-white/40 mb-1";

interface Props {
  onClose: () => void;
}

export default function ApplePriceEmailModal({ onClose }: Props) {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const nameOk  = name.trim().length >= 2;
  const phoneOk = isPhoneValid(phone);
  const canSend = nameOk && phoneOk;

  const handlePhone = (v: string) => {
    const formatted = formatPhone(v);
    setPhone(formatted || "+7");
  };

  const handleSend = async () => {
    if (!canSend || sending) return;
    if (!nameOk)  { setError("Введите ваше имя");                                       return; }
    if (!phoneOk) { setError("Введите номер в формате +7 (___) ___-__-__");             return; }
    setError(null);
    setSending(true);

    const sendBg = (body: Record<string, unknown>) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      fetch(LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
        signal: ctrl.signal,
      }).catch(() => {}).finally(() => clearTimeout(t));
    };

    sendBg({
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      category: "Прайс Apple",
      desc: `Запросил прайс-лист Apple${email ? ` | Email: ${email}` : ""}`,
      photos: [],
      contact_channels: [],
      contact_time: "",
    });

    if (email.trim().includes("@")) {
      try {
        await fetch(PRICE_EMAIL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markup: 2000, email: email.trim(), only_available: true }),
        });
      } catch { /* ignore */ }
    } else {
      try {
        const res = await fetch(PRICE_PDF_URL);
        if (res.ok) {
          const blob = await res.blob();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "");
          a.href = url; a.download = `price-skypka24-${date}.pdf`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        }
      } catch { /* ignore */ }
    }

    setSending(false);
    setDone(true);
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
                <label className={LBL_CLS}>Ваше имя <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Иван"
                  autoFocus
                  className={INP_CLS}
                />
              </div>

              {/* Телефон */}
              <div>
                <label className={LBL_CLS}>Телефон <span className="text-red-400">*</span></label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  onFocus={() => { if (!phone || phone === "") setPhone("+7"); }}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="+7 (___) ___-__-__"
                  className={INP_CLS}
                />
              </div>

              {/* Email — если указан, пришлём PDF на почту; иначе скачается */}
              <div>
                <label className={LBL_CLS}>
                  Email <span className="text-white/20">(необязательно — пришлём PDF)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="example@mail.ru"
                  className={INP_CLS}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm font-roboto">{error}</p>
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
                <div className="font-oswald font-bold text-white text-[18px] uppercase tracking-wide mb-1">
                  Готово!
                </div>
                <p className="font-roboto text-[13px] text-white/50 leading-relaxed">
                  {email.trim().includes("@")
                    ? `Прайс отправлен на ${email}. Перезвоним в ближайшее время.`
                    : "Прайс скачивается. Перезвоним в ближайшее время."}
                </p>
              </div>
              <a href="tel:+79929903333"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-oswald font-bold text-sm uppercase text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
                <Icon name="Phone" size={15} />
                +7 (992) 990-33-33
              </a>
              <button onClick={onClose}
                className="font-roboto text-[12px] text-white/30 hover:text-white/50 transition-colors">
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}