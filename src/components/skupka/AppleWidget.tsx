import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVITO_PRICE_URL = "https://functions.poehali.dev/5c99f770-dbe8-42ad-b8df-adea87477627";
const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const POPULAR = [
  "iPhone 16 Pro", "iPhone 15 Pro", "iPhone 14 Pro",
  "iPhone 13", "MacBook Air M2", "AirPods Pro 2",
];

type PriceResult = {
  model: string;
  avito_avg: number | null;
  skupka_price: number | null;
  unknown?: boolean;
};

interface AppleWidgetProps {
  compact?: boolean;
}

const AppleLogo = ({ size = 14 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size }} fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const useAppleWidget = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const search = async (q?: string) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSent(false);
    try {
      const res = await fetch(AVITO_PRICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!phone || !result) return;
    setSending(true);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Заявка Apple",
          phone,
          category: "Apple техника",
          desc: `${result.model} — цена скупки: ${result.skupka_price.toLocaleString("ru-RU")} ₽ (Авито ~${result.avito_avg.toLocaleString("ru-RU")} ₽)`,
        }),
      });
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return { query, setQuery, loading, result, error, phone, setPhone, sending, sent, search, handleSell };
};

const AppleWidget = ({ compact }: AppleWidgetProps) => {
  const w = useAppleWidget();

  if (compact) {
    return (
      <div className="border border-white/10 bg-black/30 p-3 mb-5 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0 text-black">
            <AppleLogo size={12} />
          </div>
          <span className="font-oswald font-bold text-xs uppercase text-white tracking-wide">Apple — на 5 000 ₽ ниже Авито</span>
        </div>

        <div className="flex gap-1.5 mb-2">
          <input type="text" value={w.query} onChange={e => w.setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && w.search()}
            placeholder="iPhone 14 Pro, MacBook Air..."
            className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
          <button onClick={() => w.search()} disabled={w.loading}
            className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0">
            {w.loading ? "..." : "Узнать"}
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mb-1">
          {["iPhone 16 Pro", "iPhone 14", "MacBook Air M2"].map(m => (
            <button key={m} onClick={() => { w.setQuery(m); w.search(m); }}
              className="font-roboto text-[10px] text-white/40 hover:text-[#FFD700] border border-white/10 hover:border-[#FFD700]/30 px-2 py-0.5 transition-colors">
              {m}
            </button>
          ))}
        </div>

        {w.error && (
          <div className="text-red-400 font-roboto text-[10px] flex items-center gap-1 mt-1">
            <Icon name="AlertCircle" size={11} />{w.error}
          </div>
        )}

        {w.result && !w.sent && (
          <div className="border-t border-[#FFD700]/20 pt-2 mt-2">
            <div className="font-roboto text-white/40 text-[10px] mb-1">{w.result.model}</div>
            {w.result.unknown ? (
              <div className="font-roboto text-white/50 text-[10px] mb-2">Оставьте заявку — оценим и перезвоним</div>
            ) : (
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-oswald text-white/30 text-sm line-through">{w.result.avito_avg?.toLocaleString("ru-RU")} ₽</span>
                <Icon name="ArrowRight" size={11} className="text-[#FFD700]" />
                <span className="font-oswald font-bold text-[#FFD700] text-xl">{w.result.skupka_price?.toLocaleString("ru-RU")} ₽</span>
              </div>
            )}
            <div className="flex gap-1.5">
              <input type="tel" value={w.phone} onChange={e => w.setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
              <button onClick={w.handleSell} disabled={w.sending || !w.phone}
                className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0">
                {w.sending ? "..." : "Продать"}
              </button>
            </div>
          </div>
        )}

        {w.sent && (
          <div className="flex items-center gap-1.5 text-[#FFD700] font-roboto text-xs border-t border-[#FFD700]/20 pt-2 mt-2">
            <Icon name="CheckCircle" size={13} />
            Заявка принята! Перезвоним через 15 мин.
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="bg-[#111] border-b border-[#FFD700]/20">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 text-black">
            <AppleLogo size={16} />
          </div>
          <div>
            <span className="font-oswald font-bold text-white text-base uppercase tracking-wide">Скупка Apple техники</span>
            <span className="ml-2 bg-[#FFD700] text-black font-oswald font-bold text-xs px-2 py-0.5">−5 000 ₽ от Авито</span>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <input type="text" value={w.query} onChange={e => w.setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && w.search()}
            placeholder="Введите модель: iPhone 14 Pro, MacBook Air..."
            className="flex-1 bg-[#0D0D0D] border border-[#444] text-white px-4 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
          <button onClick={() => w.search()} disabled={w.loading}
            className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-3 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0">
            {w.loading ? "..." : "Узнать цену"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR.map(m => (
            <button key={m} onClick={() => { w.setQuery(m); w.search(m); }}
              className="font-roboto text-xs text-white/60 hover:text-[#FFD700] border border-white/15 hover:border-[#FFD700]/50 px-3 py-1.5 transition-colors">
              {m}
            </button>
          ))}
        </div>
        {w.error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 font-roboto text-sm"><Icon name="AlertCircle" size={16} />{w.error}</div>}
        {w.result && !w.sent && (
          <div className="bg-[#0D0D0D] border border-[#FFD700]/30 p-4">
            <div className="font-roboto text-white/50 text-xs uppercase tracking-wider mb-3">{w.result.model}</div>
            {w.result.unknown ? (
              <div className="font-roboto text-white/50 text-sm mb-4">Оставьте номер — оценим и перезвоним в течение 15 минут</div>
            ) : (
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div><div className="font-roboto text-white/40 text-xs mb-1">Авито (средняя)</div>
                  <div className="font-oswald font-bold text-white/40 text-xl line-through">{w.result.avito_avg?.toLocaleString("ru-RU")} ₽</div>
                </div>
                <Icon name="ArrowRight" size={20} className="text-[#FFD700]" />
                <div><div className="font-roboto text-[#FFD700] text-xs mb-1">Мы платим</div>
                  <div className="font-oswald font-bold text-[#FFD700] text-3xl">{w.result.skupka_price?.toLocaleString("ru-RU")} ₽</div>
                </div>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <input type="tel" value={w.phone} onChange={e => w.setPhone(e.target.value)} placeholder="+7 (___) ___-__-__"
                className="flex-1 min-w-[160px] bg-[#1A1A1A] border border-[#444] text-white px-4 py-3 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
              <button onClick={w.handleSell} disabled={w.sending || !w.phone}
                className="bg-[#FFD700] text-black font-oswald font-bold px-6 py-3 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0">
                <Icon name="Send" size={14} />
                {w.sending ? "Отправляем..." : "Продать"}
              </button>
            </div>
          </div>
        )}
        {w.sent && (
          <div className="flex items-center gap-3 bg-[#FFD700]/10 border border-[#FFD700]/30 px-4 py-3">
            <Icon name="CheckCircle" size={20} className="text-[#FFD700] shrink-0" />
            <div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm uppercase">Заявка принята!</div>
              <div className="font-roboto text-white/50 text-xs">Перезвоним в течение 15 минут</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AppleWidget;