import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PUBLIC_PRICE_URL = "https://functions.poehali.dev/b39f271a-3a63-4998-b83b-3c64eeace265";
const DEFAULT_MARKUP = 2000;
const REFRESH_MS = 3 * 60 * 60 * 1000; // 3 часа

interface PriceItem {
  name: string;
  price: string;
  price_num: number | null;
  region: string;
  photo: string | null;
}

interface PriceData {
  ok: boolean;
  total: number;
  markup: number;
  generated_at: string;
  groups: Record<string, PriceItem[]>;
}

const CAT_EMOJI: Record<string, string> = {
  "iPhone": "📱", "MacBook": "💻", "iPad": "🖥️",
  "Apple Watch": "⌚", "AirPods": "🎧",
  "Смартфоны Samsung": "📲", "Смартфоны Xiaomi": "📲", "Смартфоны Honor": "📲",
  "Наушники": "🎧", "Планшеты": "📋", "Умные часы": "⌚",
  "Игровые консоли": "🎮", "Аксессуары Apple": "🔌",
  "Аксессуары": "🔌", "Прочее": "📦",
};

const CAT_COLORS: Record<string, string> = {
  "iPhone": "#60a5fa",
  "MacBook": "#a78bfa",
  "iPad": "#34d399",
  "Apple Watch": "#f472b6",
  "AirPods": "#fbbf24",
  "Смартфоны Samsung": "#22d3ee",
  "Смартфоны Xiaomi": "#f97316",
};

function todayStr() {
  return new Date().toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function countdown(nextMs: number) {
  const diff = Math.max(0, nextMs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}ч ${m}мин`;
}

export default function ApplePrice() {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + REFRESH_MS);
  const [timer, setTimer] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PUBLIC_PRICE_URL}?markup=${DEFAULT_MARKUP}`);
      const d: PriceData = await r.json();
      if (d.ok) {
        setData(d);
        const next = Date.now() + REFRESH_MS;
        setNextRefresh(next);
      } else {
        setError("Не удалось загрузить прайс");
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  }, []);

  // Первая загрузка + автообновление каждые 3 часа
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Таймер обратного отсчёта
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(countdown(nextRefresh));
    }, 30000);
    setTimer(countdown(nextRefresh));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextRefresh]);

  const handlePrint = () => window.print();

  return (
    <>
      {/* ── PRINT STYLES ── */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-page {
            background: #fff !important;
            color: #000 !important;
            padding: 0 !important;
          }
          .price-header {
            background: #fff !important;
            border-bottom: 2px solid #FFD700 !important;
            padding: 16px 24px !important;
          }
          .price-header * { color: #000 !important; }
          .cat-block { break-inside: avoid; page-break-inside: avoid; }
          .price-row { break-inside: avoid; }
          .cat-title {
            background: #f5f5f5 !important;
            color: #000 !important;
            border-left: 4px solid #FFD700 !important;
            padding: 6px 12px !important;
            font-weight: 800 !important;
            font-size: 13px !important;
          }
          .price-cell {
            color: #000 !important;
            font-size: 11px !important;
          }
          .price-cell-price {
            color: #c47900 !important;
            font-weight: 700 !important;
          }
          .region-badge {
            background: #eee !important;
            color: #333 !important;
            border: 1px solid #ccc !important;
          }
          table { border-collapse: collapse; width: 100%; }
          td { border-bottom: 1px solid #eee; padding: 4px 8px; }
          .print-footer {
            display: block !important;
            text-align: center;
            color: #888;
            font-size: 10px;
            margin-top: 24px;
            border-top: 1px solid #eee;
            padding-top: 8px;
          }
        }
        @media screen {
          .print-footer { display: none; }
        }
        @page {
          size: A4;
          margin: 12mm 10mm;
        }
      `}</style>

      <div className="min-h-screen print-page" style={{ background: "#0a0a0a" }}>

        {/* ── HEADER ── */}
        <div className="price-header no-print sticky top-0 z-10"
          style={{
            background: "linear-gradient(135deg,#111 0%,#0d0d0d 100%)",
            borderBottom: "2px solid #FFD700",
          }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
                <span className="text-black font-black text-[18px]">С</span>
              </div>
              <div>
                <div className="font-oswald font-black text-white text-[18px] uppercase tracking-wide leading-tight">
                  Скупка24 — Прайс Apple
                </div>
                <div className="text-[11px] text-white/40">
                  {data ? `${data.total} позиций · обновлено ${data.generated_at}` : "Загрузка…"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {timer && (
                <span className="text-[11px] text-white/30 hidden sm:block">
                  Обновление через {timer}
                </span>
              )}
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all"
                style={{
                  background: "rgba(255,215,0,0.1)",
                  border: "1px solid rgba(255,215,0,0.3)",
                  color: "#FFD700",
                }}
              >
                <Icon name={loading ? "Loader2" : "RefreshCw"} size={13}
                  className={loading ? "animate-spin" : ""} />
                Обновить
              </button>
              <button
                onClick={handlePrint}
                disabled={!data}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-black transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}
              >
                <Icon name="Printer" size={13} />
                Печать А4
              </button>
            </div>
          </div>
        </div>

        {/* ── PRINT HEADER (только при печати) ── */}
        <div style={{ display: "none" }} className="print-show">
          <table width="100%" style={{ borderBottom: "2px solid #FFD700", marginBottom: 16, paddingBottom: 8 }}>
            <tbody><tr>
              <td><span style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>СКУПКА24 — ПРАЙС-ЛИСТ</span></td>
              <td style={{ textAlign: "right", fontSize: 12, color: "#888" }}>
                {todayStr()} · Наценка +{DEFAULT_MARKUP.toLocaleString("ru-RU")} ₽<br />
                skypka24.com · +7 (992) 990-33-33
              </td>
            </tr></tbody>
          </table>
        </div>

        {/* ── CONTENT ── */}
        <div className="max-w-5xl mx-auto px-3 py-4">

          {loading && !data && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <Icon name="Loader2" size={28} className="animate-spin text-[#FFD700]" />
              </div>
              <div className="text-white/40 text-[14px]">Загружаю прайс Smartbery…</div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl mx-4 mt-8"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={18} className="text-red-400 shrink-0" />
              <span className="text-red-300 text-[13px]">{error}</span>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Шапка с датой (экран) */}
              <div className="no-print flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="text-white/30 text-[12px]">{todayStr()} · наценка +{DEFAULT_MARKUP.toLocaleString("ru-RU")} ₽</div>
                <div className="text-white/20 text-[11px]">skypka24.com</div>
              </div>

              {Object.entries(data.groups).map(([cat, items]) => {
                const accentColor = CAT_COLORS[cat] || "#FFD700";
                return (
                  <div key={cat} className="cat-block">
                    {/* Заголовок категории */}
                    <div className="cat-title flex items-center gap-2 px-3 py-2 mb-1 rounded-lg no-print"
                      style={{
                        background: `${accentColor}12`,
                        borderLeft: `3px solid ${accentColor}`,
                      }}>
                      <span className="text-[15px]">{CAT_EMOJI[cat] || "📦"}</span>
                      <span className="font-oswald font-bold text-[14px] uppercase tracking-wide"
                        style={{ color: accentColor }}>
                        {cat}
                      </span>
                      <span className="text-[11px] text-white/30 ml-1">({items.length} шт.)</span>
                    </div>
                    {/* Заголовок при печати */}
                    <div className="cat-title" style={{ display: "none" }}>
                      {CAT_EMOJI[cat] || "📦"} {cat} ({items.length} шт.)
                    </div>

                    {/* Таблица товаров */}
                    <table className="w-full" style={{ borderCollapse: "collapse" }}>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={i} className="price-row"
                            style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            {/* Фото */}
                            <td className="price-cell" style={{ width: 48, padding: "4px 6px", verticalAlign: "middle" }}>
                              {item.photo ? (
                                <img src={item.photo} alt="" width={40} height={40}
                                  style={{ borderRadius: 6, objectFit: "cover", display: "block" }} />
                              ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 6,
                                  background: "rgba(255,255,255,0.04)", display: "flex",
                                  alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 18 }}>{CAT_EMOJI[cat] || "📦"}</span>
                                </div>
                              )}
                            </td>
                            {/* Название */}
                            <td className="price-cell" style={{ padding: "6px 8px", fontSize: 13, color: "#ddd", verticalAlign: "middle" }}>
                              {item.name}
                              {item.region && (
                                <span className="region-badge" style={{
                                  fontSize: 9, marginLeft: 5, padding: "1px 5px",
                                  borderRadius: 4, verticalAlign: "middle",
                                  background: item.region === "EU" ? "rgba(74,222,128,0.15)"
                                    : item.region === "US" ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
                                  color: item.region === "EU" ? "#4ade80"
                                    : item.region === "US" ? "#60a5fa" : "#fbbf24",
                                  border: `1px solid ${item.region === "EU" ? "#4ade8044"
                                    : item.region === "US" ? "#60a5fa44" : "#fbbf2444"}`,
                                }}>
                                  {item.region}
                                </span>
                              )}
                            </td>
                            {/* Цена */}
                            <td className="price-cell price-cell-price" style={{
                              padding: "6px 12px", textAlign: "right", whiteSpace: "nowrap",
                              fontSize: 13, fontWeight: 700, verticalAlign: "middle",
                              color: item.price_num ? "#FFD700" : "#555",
                            }}>
                              {item.price}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* Подвал страницы */}
              <div className="no-print py-8 text-center text-white/20 text-[11px]">
                skypka24.com · г. Калуга, Кирова 7/47 и Кирова 11 · +7 (992) 990-33-33
              </div>
              <div className="print-footer">
                skypka24.com · г. Калуга, ул. Кирова 7/47 и ул. Кирова 11 · +7 (992) 990-33-33
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
