import { useState } from "react";
import Icon from "@/components/ui/icon";

const AVITO_PRICE_URL = "https://functions.poehali.dev/5c99f770-dbe8-42ad-b8df-adea87477627";
const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

const POPULAR = [
  "iPhone 16 Pro", "iPhone 15 Pro", "iPhone 14 Pro",
  "iPhone 13", "MacBook Air M2", "MacBook Pro 14",
  "iPad Pro 11", "AirPods Pro 2", "Apple Watch Series 9",
];

type PriceResult = {
  model: string;
  avito_avg: number;
  skupka_price: number;
};

const AppleWidget = () => {
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
      if (!res.ok) throw new Error(data.error || "Модель не найдена");
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

  return (
    <section className="bg-[#111] border-b border-[#FFD700]/10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center gap-6 lg:gap-10">

          {/* Left: title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#000">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <div className="font-oswald font-bold text-base uppercase text-white leading-tight">Скупка Apple</div>
              <div className="font-roboto text-white/40 text-xs">на 5 000 ₽ ниже Авито</div>
            </div>
          </div>

          {/* Center: search */}
          <div className="flex-1 min-w-[220px]">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && search()}
                placeholder="iPhone 14 Pro, MacBook Air M2..."
                className="flex-1 bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors"
              />
              <button onClick={() => search()} disabled={loading}
                className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0">
                {loading ? "..." : "Узнать"}
              </button>
            </div>

            {/* Popular chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {POPULAR.slice(0, 5).map(m => (
                <button key={m} onClick={() => { setQuery(m); search(m); }}
                  className="font-roboto text-[10px] text-white/40 hover:text-[#FFD700] border border-white/10 hover:border-[#FFD700]/30 px-2 py-0.5 transition-colors">
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Right: result */}
          <div className="shrink-0 min-w-[260px]">
            {error && (
              <div className="flex items-center gap-2 text-red-400 font-roboto text-sm">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            {result && !sent && (
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider">{result.model}</div>
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <div>
                      <div className="font-roboto text-white/30 text-[10px]">Авито ~</div>
                      <div className="font-oswald font-bold text-white/50 text-lg line-through">
                        {result.avito_avg.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <Icon name="ArrowRight" size={14} className="text-[#FFD700] mb-1" />
                    <div>
                      <div className="font-roboto text-[#FFD700] text-[10px]">Мы платим</div>
                      <div className="font-oswald font-bold text-[#FFD700] text-2xl">
                        {result.skupka_price.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    className="bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors w-40"
                  />
                  <button onClick={handleSell} disabled={sending || !phone}
                    className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <Icon name="Send" size={12} />
                    Продать
                  </button>
                </div>
              </div>
            )}

            {sent && (
              <div className="flex items-center gap-2 text-[#FFD700] font-roboto text-sm">
                <Icon name="CheckCircle" size={16} />
                Заявка принята! Перезвоним в течение 15 минут.
              </div>
            )}

            {!result && !error && (
              <div className="font-roboto text-white/25 text-xs">
                Введите модель — мгновенно рассчитаем цену
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppleWidget;
