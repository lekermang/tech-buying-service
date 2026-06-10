import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { formatPhone, isPhoneValid } from "@/lib/phoneFormat";
import funcUrls from "../../backend/func2url.json";

const LEAD_URL        = (funcUrls as Record<string, string>)["send-lead"];
const PRICE_EMAIL_URL = (funcUrls as Record<string, string>)["price-email"];
const PRICE_PDF_URL   = (funcUrls as Record<string, string>)["price-pdf"];

const BRANDS = ["iPhone", "MacBook", "iPad", "Samsung", "Xiaomi", "BORK"];

const INP_CLS = [
  "w-full px-4 py-3.5 rounded-2xl font-roboto text-[15px] text-white/90 outline-none transition-colors",
  "bg-white/[0.07] border border-white/10 focus:border-[#FFD700]/50 placeholder:text-white/20",
].join(" ");

export default function PriceRequest() {
  const [name,    setName]    = useState("");
  const [phone,   setPhone]   = useState("+7");
  const [email,   setEmail]   = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    document.title = "Получить прайс — Скупка24 Калуга";
  }, []);

  const nameOk  = name.trim().length >= 2;
  const phoneOk = isPhoneValid(phone);
  const canSend = nameOk && phoneOk;

  const handlePhone = (v: string) => {
    setPhone(formatPhone(v) || "+7");
  };

  const handleSend = async () => {
    if (!nameOk)  { setError("Введите ваше имя");                               return; }
    if (!phoneOk) { setError("Введите номер в формате +7 (___) ___-__-__");     return; }
    if (sending)  return;
    setError(null);
    setSending(true);

    // Отправляем заявку в фоне
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    fetch(LEAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.replace(/\D/g, ""),
        category: "Прайс Apple",
        desc: `Запросил прайс-лист Apple${email ? ` | Email: ${email}` : ""}`,
        photos: [],
        contact_channels: [],
        contact_time: "",
      }),
      keepalive: true,
      signal: ctrl.signal,
    }).catch(() => {}).finally(() => clearTimeout(t));

    // Если есть email — отправляем PDF на почту
    if (email.trim().includes("@")) {
      fetch(PRICE_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markup: 2000, email: email.trim(), only_available: true }),
      }).catch(() => {});
    } else {
      // Без email — скачиваем PDF
      const pCtrl = new AbortController();
      const pt = setTimeout(() => pCtrl.abort(), 25000);
      fetch(PRICE_PDF_URL, { signal: pCtrl.signal })
        .then(async res => {
          if (!res.ok) return;
          const blob = await res.blob();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          const date = new Date().toLocaleDateString("ru-RU").replace(/\./g, "");
          a.href = url; a.download = `price-skypka24-${date}.pdf`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a); URL.revokeObjectURL(url);
        })
        .catch(() => {})
        .finally(() => clearTimeout(pt));
    }

    setSending(false);
    setDone(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(160deg,#0d0d0d 0%,#111 60%,#0a0a0a 100%)" }}>

      {/* Фоновые акценты */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#FFD700,transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle,#FFD700,transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Логотип */}
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
              <span className="font-black text-black text-xl">С</span>
            </div>
            <div>
              <div className="font-oswald font-black text-white text-[18px] uppercase tracking-wide leading-tight">Скупка24</div>
              <div className="text-[10px] text-white/30 -mt-0.5">г. Калуга</div>
            </div>
          </a>
        </div>

        {!done ? (
          <div className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(160deg,#1a1a1a,#141414)",
              border: "1px solid rgba(255,215,0,0.2)",
              boxShadow: "0 0 0 1px rgba(255,215,0,0.06), 0 32px 80px rgba(0,0,0,0.6)",
            }}>

            {/* Шапка карточки */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-[#FFD700]/15 flex items-center justify-center shrink-0">
                  <Icon name="FileText" size={20} className="text-[#FFD700]" />
                </div>
                <div>
                  <div className="font-oswald font-black text-white text-[20px] uppercase tracking-wide">Прайс-лист</div>
                  <div className="font-roboto text-[11px] text-white/30">iPhone · MacBook · iPad и другие</div>
                </div>
              </div>
            </div>

            {/* Бренды */}
            <div className="px-6 pb-3 flex gap-1.5 flex-wrap">
              {BRANDS.map(b => (
                <span key={b} className="font-roboto text-[10px] px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.18)", color: "#FFD700" }}>
                  {b}
                </span>
              ))}
            </div>

            <div className="mx-6 h-px mb-5" style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.12),transparent)" }} />

            {/* Форма */}
            <div className="px-6 pb-6 space-y-4">
              <p className="font-roboto text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Укажите имя и телефон — пришлём актуальные цены и перезвоним, если нужно.
              </p>

              {/* Имя */}
              <div>
                <div className="font-roboto text-[11px] text-white/35 mb-1.5">
                  Ваше имя <span className="text-red-400">*</span>
                </div>
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
                <div className="font-roboto text-[11px] text-white/35 mb-1.5">
                  Телефон <span className="text-red-400">*</span>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={e => handlePhone(e.target.value)}
                  onFocus={() => { if (!phone) setPhone("+7"); }}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="+7 (___) ___-__-__"
                  className={INP_CLS}
                />
              </div>

              {/* Email */}
              <div>
                <div className="font-roboto text-[11px] text-white/35 mb-1.5">
                  Email <span className="text-white/20">(необязательно — пришлём PDF)</span>
                </div>
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
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm font-roboto">{error}</p>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !canSend}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-oswald font-bold text-[15px] uppercase tracking-wider text-black transition-all active:scale-[0.98] disabled:opacity-35"
                style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)", boxShadow: canSend ? "0 4px 24px rgba(255,215,0,0.25)" : "none" }}
              >
                <Icon name={sending ? "Loader2" : "Send"} size={18} className={sending ? "animate-spin" : ""} />
                {sending ? "Отправляю…" : "Получить прайс"}
              </button>

              <p className="font-roboto text-[10px] text-center" style={{ color: "rgba(255,255,255,0.15)" }}>
                Только актуальные цены — без спама
              </p>
            </div>
          </div>
        ) : (
          /* Экран успеха */
          <div className="rounded-3xl px-6 py-10 text-center"
            style={{
              background: "linear-gradient(160deg,#1a1a1a,#141414)",
              border: "1px solid rgba(255,215,0,0.2)",
              boxShadow: "0 0 0 1px rgba(255,215,0,0.06), 0 32px 80px rgba(0,0,0,0.6)",
            }}>
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-5">
              <Icon name="CheckCircle2" size={32} className="text-green-400" />
            </div>
            <div className="font-oswald font-black text-white text-[24px] uppercase tracking-wide mb-2">
              Готово!
            </div>
            <p className="font-roboto text-[13px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              {email.trim().includes("@")
                ? `Прайс отправлен на ${email}. Перезвоним в ближайшее время.`
                : "Прайс скачивается. Перезвоним в ближайшее время."}
            </p>
            <a href="tel:+79929903333"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-oswald font-bold text-[15px] uppercase tracking-wide text-black mb-4"
              style={{ background: "linear-gradient(135deg,#FFD700,#d4a017)" }}>
              <Icon name="Phone" size={16} />
              +7 (992) 990-33-33
            </a>
            <div>
              <a href="/" className="font-roboto text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                ← На главную
              </a>
            </div>
          </div>
        )}

        {/* Адрес */}
        <div className="mt-6 text-center">
          <p className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            г. Калуга · Кирова 7/47 и Кирова 11 · Ежедневно 10:00–21:00
          </p>
        </div>
      </div>
    </div>
  );
}
