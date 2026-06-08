import { useEffect, useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const PUBLIC_PRICE_URL = "https://functions.poehali.dev/b39f271a-3a63-4998-b83b-3c64eeace265";
const SEND_LEAD_URL    = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";
const DEFAULT_MARKUP   = 2000;
const REFRESH_MS       = 3 * 60 * 60 * 1000;

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
  "iPhone": "#60a5fa", "MacBook": "#a78bfa", "iPad": "#34d399",
  "Apple Watch": "#f472b6", "AirPods": "#fbbf24",
  "Смартфоны Samsung": "#22d3ee", "Смартфоны Xiaomi": "#f97316",
};

function todayStr() {
  return new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}
function countdown(nextMs: number) {
  const diff = Math.max(0, nextMs - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}ч ${m}мин`;
}

// ── Модал заказа ───────────────────────────────────────────────────────────────
function OrderModal({ item, onClose }: { item: PriceItem; onClose: () => void }) {
  const [name, setName]     = useState("");
  const [phone, setPhone]   = useState("+7");
  const [sending, setSending] = useState(false);
  const [done, setDone]     = useState(false);
  const [err, setErr]       = useState<string | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSend = name.trim().length >= 2 && phoneDigits.length === 11;

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (!d) return "+7";
    if (d.length <= 1) return "+7";
    if (d.length <= 4) return `+7 (${d.slice(1)}`;
    if (d.length <= 7) return `+7 (${d.slice(1,4)}) ${d.slice(4)}`;
    if (d.length <= 9) return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
    return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9)}`;
  };

  const handlePhone = (v: string) => {
    const raw = v.replace(/\D/g, "");
    setPhone(formatPhone(raw.startsWith("7") || raw.startsWith("8") ? raw : "7" + raw));
  };

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true); setErr(null);
    try {
      await fetch(SEND_LEAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phoneDigits,
          category: "Прайс Apple",
          desc: `Хочет купить: ${item.name}${item.price_num ? ` — ${item.price}` : ""}`,
        }),
      });
      setDone(true);
    } catch {
      setErr("Ошибка сети, попробуйте ещё раз");
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#1a1a1a,#0f0f0f)",
          border: "1px solid rgba(255,215,0,0.2)",
          boxShadow: "0 -8px 60px rgba(255,215,0,0.12)",
        }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-oswald font-bold text-[20px] text-white uppercase mb-2">Заявка принята!</div>
              <div className="text-white/50 text-[13px] mb-6">Перезвоним в течение 15 минут</div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
                Закрыть
              </button>
            </div>
          ) : (
            <>
              {/* Товар */}
              <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {item.photo ? (
                  <img src={item.photo} alt={item.name} width={52} height={52}
                    style={{ borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ background: "rgba(255,215,0,0.08)" }}>📱</div>
                )}
                <div>
                  <div className="font-bold text-white text-[14px] leading-tight">{item.name}</div>
                  {item.price_num && (
                    <div className="font-oswald font-black text-[18px] mt-0.5" style={{ color: "#FFD700" }}>
                      {item.price}
                    </div>
                  )}
                </div>
              </div>

              <div className="font-oswald font-bold text-[16px] text-white uppercase tracking-wide mb-4">
                Заказать / уточнить
              </div>

              <div className="space-y-3">
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
                <input value={phone} onChange={e => handlePhone(e.target.value)}
                  type="tel" placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>

              {err && (
                <div className="text-red-400 text-[12px] mt-2 flex items-center gap-1.5">
                  <Icon name="AlertCircle" size={13} /> {err}
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-oswald font-bold text-[13px] uppercase text-white/40"
                  style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                  Отмена
                </button>
                <button onClick={handleSend} disabled={sending || !canSend}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-oswald font-bold text-[14px] uppercase tracking-wide text-black disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", boxShadow: "0 4px 20px rgba(255,215,0,0.35)" }}>
                  <Icon name={sending ? "Loader2" : "Phone"} size={16} className={sending ? "animate-spin" : ""} />
                  {sending ? "Отправка…" : "Перезвоните мне"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Скелетон-загрузка ─────────────────────────────────────────────────────────
function SkeletonLoader() {
  const rows = [8, 12, 7, 10, 6, 9, 5];
  return (
    <div className="max-w-5xl mx-auto px-3 py-4 space-y-6">
      {/* Прогресс-полоска */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,215,0,0.1)" }}>
        <div className="h-full rounded-full animate-progress-bar"
          style={{ background: "linear-gradient(90deg,#FFD700,#f59e0b,#FFD700)", backgroundSize: "200% 100%" }} />
      </div>
      <div className="text-center text-white/30 text-[13px] tracking-wide">Загружаем актуальные цены…</div>
      {rows.map((count, ci) => (
        <div key={ci}>
          <div className="h-8 rounded-lg mb-2 animate-pulse" style={{ background: "rgba(255,255,255,0.05)", width: "30%" }} />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div className="w-10 h-10 rounded-lg animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="flex-1 h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              <div className="w-20 h-4 rounded animate-pulse" style={{ background: "rgba(255,215,0,0.08)" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Красивая печать А4 через новое окно ───────────────────────────────────────
function buildPrintHtml(data: PriceData): string {
  const today = todayStr();

  const catColors: Record<string, string> = {
    "iPhone": "#1a56db", "MacBook": "#7e3af2", "iPad": "#057a55",
    "Apple Watch": "#be185d", "AirPods": "#b45309",
    "Смартфоны Samsung": "#0e7490", "Смартфоны Xiaomi": "#c2410c",
  };

  let sectionsHtml = "";
  for (const [cat, items] of Object.entries(data.groups)) {
    const emoji  = CAT_EMOJI[cat] || "📦";
    const color  = catColors[cat] || "#374151";

    let rows = "";
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const bg = i % 2 === 0 ? "#fff" : "#fafafa";
      const regionBadge = item.region
        ? `<span style="font-size:8px;padding:1px 5px;border-radius:3px;margin-left:5px;vertical-align:middle;
              background:${item.region === "EU" ? "#dcfce7" : item.region === "US" ? "#dbeafe" : "#fef9c3"};
              color:${item.region === "EU" ? "#166534" : item.region === "US" ? "#1e40af" : "#854d0e"};
              border:1px solid ${item.region === "EU" ? "#bbf7d0" : item.region === "US" ? "#bfdbfe" : "#fef08a"}"
          >${item.region}</span>`
        : "";

      const photoCell = item.photo
        ? `<td style="width:46px;padding:3px 6px 3px 8px;background:${bg};border-bottom:1px solid #f0f0f0;vertical-align:middle">
             <img src="${item.photo}" width="36" height="36" style="border-radius:5px;object-fit:cover;display:block">
           </td>`
        : `<td style="width:46px;padding:3px 6px 3px 8px;background:${bg};border-bottom:1px solid #f0f0f0;text-align:center;font-size:18px;vertical-align:middle">${emoji}</td>`;

      const priceColor = item.price_num ? "#92400e" : "#d1d5db";

      rows += `<tr>
        ${photoCell}
        <td style="padding:6px 8px;background:${bg};border-bottom:1px solid #f0f0f0;font-size:11.5px;font-weight:600;color:#111;vertical-align:middle">
          ${item.name}${regionBadge}
        </td>
        <td style="padding:6px 14px;background:${bg};border-bottom:1px solid #f0f0f0;text-align:right;
                   font-size:12.5px;font-weight:800;color:${priceColor};white-space:nowrap;vertical-align:middle">
          ${item.price}
        </td>
      </tr>`;
    }

    sectionsHtml += `
      <tr style="page-break-inside:avoid">
        <td colspan="3" style="padding:14px 8px 5px;background:#f8f8f8">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:4px;height:20px;border-radius:2px;background:${color};flex-shrink:0"></div>
            <span style="font-size:13px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.5px">
              ${emoji} ${cat}
            </span>
            <span style="font-size:10px;color:#9ca3af;font-weight:400">${items.length} шт.</span>
          </div>
        </td>
      </tr>
      ${rows}`;
  }

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Прайс Скупка24 — ${today}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    @page { size: A4; margin: 10mm 8mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #111; }
    table { width: 100%; border-collapse: collapse; }
    .header { background: linear-gradient(135deg,#111,#1a1a1a); color: #fff; padding: 16px 20px; border-bottom: 3px solid #FFD700; }
    .header-title { font-size: 22px; font-weight: 900; letter-spacing: 1px; color: #fff; }
    .header-sub   { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .header-right { text-align: right; font-size: 11px; color: rgba(255,255,255,0.6); line-height: 1.8; }
    .header-right strong { color: #FFD700; font-size: 13px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #FFD700; color: #000; margin-top: 4px; }
    .footer { text-align: center; padding: 12px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; margin-top: 16px; }
    .cta-row { background: #111; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
    .cta-text { color: #fff; font-size: 12px; }
    .cta-phone { color: #FFD700; font-size: 15px; font-weight: 900; }
  </style>
</head>
<body>

  <!-- Шапка -->
  <table class="header">
    <tr>
      <td>
        <div class="header-title">🏪 СКУПКА24 — ПРАЙС-ЛИСТ</div>
        <div class="header-sub">${data.total} позиций · Актуальные цены · ${today}</div>
      </td>
      <td class="header-right">
        <strong>skypka24.com</strong><br>
        г. Калуга, Кирова 7/47 и Кирова 11<br>
        <span class="cta-phone">+7 (992) 990-33-33</span><br>
        <span class="badge">Покупаем и продаём 24/7</span>
      </td>
    </tr>
  </table>

  <!-- Прайс -->
  <table>${sectionsHtml}</table>

  <!-- CTA-полоса -->
  <table class="cta-row" style="margin-top:16px">
    <tr>
      <td class="cta-text">Не нашли нужную модель? Позвоните — найдём под заказ за 1–3 дня</td>
      <td class="cta-phone" style="text-align:right">+7 (992) 990-33-33</td>
    </tr>
  </table>

  <!-- Подвал -->
  <div class="footer">
    skypka24.com · г. Калуга, ул. Кирова 7/47 и ул. Кирова 11 · +7 (992) 990-33-33 · © ${new Date().getFullYear()} Скупка24
  </div>

</body>
</html>`;
}


// ── SEO-блок ──────────────────────────────────────────────────────────────────
const SEO_MODELS = [
  "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
  "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
  "MacBook Air M2", "MacBook Air M3", "MacBook Pro 14", "MacBook Pro 16",
  "iPad Air", "iPad Pro", "iPad mini", "Apple Watch Series 9",
  "AirPods Pro 2", "Samsung Galaxy S24", "Samsung Galaxy S23",
];

function SeoBlock() {
  return (
    <section style={{ background: "#0d0d0d", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ color: "#FFD700", fontFamily: "oswald, sans-serif", fontSize: 18, fontWeight: 700,
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Купить iPhone и технику Apple в Калуге
        </h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, lineHeight: 1.8, marginBottom: 20, maxWidth: 680 }}>
          Скупка24 — официальная продажа новых и б/у iPhone, MacBook, iPad, Apple Watch в Калуге.
          Все устройства проверены, с гарантией. Доставка по Калуге и РФ.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SEO_MODELS.map(m => (
            <span key={m} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 12,
              fontWeight: 700, letterSpacing: 0.3,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
              cursor: "default",
            }}>{m}</span>
          ))}
        </div>
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 16 }}>
          Адрес: г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11 · Режим работы: ежедневно 10:00–21:00
        </p>
      </div>
    </section>
  );
}


// ── Главный компонент ─────────────────────────────────────────────────────────
export default function ApplePrice() {
  const [data, setData]               = useState<PriceData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [nextRefresh, setNextRefresh] = useState(Date.now() + REFRESH_MS);
  const [timer, setTimer]             = useState("");
  const [orderItem, setOrderItem]     = useState<PriceItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${PUBLIC_PRICE_URL}?markup=${DEFAULT_MARKUP}&_t=${Date.now()}`);
      const text = await r.text();
      const d: PriceData = JSON.parse(text);
      if (d.ok) {
        setData(d);
        setNextRefresh(Date.now() + REFRESH_MS);
      } else {
        setError("Не удалось загрузить прайс");
      }
    } catch {
      setError("Ошибка сети");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    const tick = () => setTimer(countdown(nextRefresh));
    tick();
    timerRef.current = setInterval(tick, 30000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [nextRefresh]);

  const handlePrint = () => {
    if (!data) return;
    const html = buildPrintHtml(data);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.focus(); win.print(); };
    }
  };

  return (
    <>
      <style>{`
        @keyframes progressBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-bar {
          animation: progressBar 1.6s ease-in-out infinite;
        }
        .order-btn {
          opacity: 0;
          transform: translateX(6px);
          transition: opacity 0.18s, transform 0.18s;
        }
        .price-row:hover .order-btn {
          opacity: 1;
          transform: translateX(0);
        }
        @media (max-width: 640px) {
          .order-btn { opacity: 1; transform: none; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10"
        style={{ background: "linear-gradient(135deg,#111,#0d0d0d)", borderBottom: "2px solid #FFD700" }}>
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
                {loading && !data ? "Обновляем цены…"
                  : data ? `${data.total} позиций · ${data.generated_at}` : ""}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timer && !loading && (
              <span className="text-[11px] text-white/25 hidden sm:block">
                обновление через {timer}
              </span>
            )}
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all active:scale-95"
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={13}
                className={loading ? "animate-spin" : ""} />
              Обновить
            </button>
            <button onClick={handlePrint} disabled={!data || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-black transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#FFD700,#d97706)" }}>
              <Icon name="Printer" size={13} />
              Печать А4
            </button>
          </div>
        </div>
        {/* Прогресс-полоска под шапкой при обновлении */}
        {loading && (
          <div className="h-[3px] overflow-hidden" style={{ background: "rgba(255,215,0,0.1)" }}>
            <div className="h-full animate-progress-bar"
              style={{ background: "linear-gradient(90deg,transparent,#FFD700,transparent)", width: "40%" }} />
          </div>
        )}
      </div>

      <div className="min-h-screen" style={{ background: "#0a0a0a" }}>

        {/* Загрузка — скелетон */}
        {loading && !data && <SkeletonLoader />}

        {/* Ошибка */}
        {error && (
          <div className="max-w-5xl mx-auto px-4 pt-12">
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <Icon name="AlertCircle" size={18} className="text-red-400 shrink-0" />
              <div>
                <div className="text-red-300 text-[13px] font-semibold">{error}</div>
                <button onClick={load} className="text-red-400/60 text-[11px] underline mt-1">Попробовать снова</button>
              </div>
            </div>
          </div>
        )}

        {/* Данные */}
        {data && (
          <div className="max-w-5xl mx-auto px-3 py-4">
            {/* Заголовок даты */}
            <div className="flex items-center justify-between flex-wrap gap-2 px-1 mb-4">
              <div className="text-white/25 text-[12px]">{todayStr()}</div>
              <a href="https://skypka24.com" className="text-white/20 text-[11px] hover:text-white/40 transition-colors">
                skypka24.com
              </a>
            </div>

            <div className="space-y-5">
              {Object.entries(data.groups).map(([cat, items]) => {
                const accentColor = CAT_COLORS[cat] || "#FFD700";
                return (
                  <div key={cat}>
                    {/* Заголовок категории */}
                    <div className="flex items-center gap-2 px-3 py-2.5 mb-0.5 rounded-xl"
                      style={{ background: `${accentColor}10`, borderLeft: `3px solid ${accentColor}` }}>
                      <span className="text-[16px]">{CAT_EMOJI[cat] || "📦"}</span>
                      <span className="font-oswald font-bold text-[15px] uppercase tracking-wide"
                        style={{ color: accentColor }}>{cat}</span>
                      <span className="text-[11px] text-white/25 ml-1">({items.length} шт.)</span>
                    </div>

                    {/* Строки товаров */}
                    <div>
                      {items.map((item, i) => (
                        <div key={i} className="price-row flex items-center gap-0 group"
                          style={{
                            background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,0.04)",
                          }}>
                          {/* Фото */}
                          <div style={{ width: 52, padding: "3px 6px", flexShrink: 0 }}>
                            {item.photo ? (
                              <img src={item.photo} alt={item.name} width={40} height={40}
                                style={{ borderRadius: 6, objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{
                                width: 40, height: 40, borderRadius: 6,
                                background: `${accentColor}10`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 18,
                              }}>{CAT_EMOJI[cat] || "📦"}</div>
                            )}
                          </div>

                          {/* Название */}
                          <div style={{ flex: 1, padding: "8px 6px", minWidth: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#e5e7eb", lineHeight: 1.3 }}>
                              {item.name}
                            </span>
                            {item.region && (
                              <span style={{
                                fontSize: 9, marginLeft: 6, padding: "1px 5px", borderRadius: 4,
                                verticalAlign: "middle", fontWeight: 700,
                                background: item.region === "EU" ? "rgba(74,222,128,0.15)"
                                  : item.region === "US" ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)",
                                color: item.region === "EU" ? "#4ade80"
                                  : item.region === "US" ? "#60a5fa" : "#fbbf24",
                                border: `1px solid ${item.region === "EU" ? "#4ade8033"
                                  : item.region === "US" ? "#60a5fa33" : "#fbbf2433"}`,
                              }}>{item.region}</span>
                            )}
                          </div>

                          {/* Цена */}
                          <div style={{
                            padding: "8px 8px 8px 4px", textAlign: "right",
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            <span style={{
                              fontSize: 14, fontWeight: 800, lineHeight: 1,
                              color: item.price_num ? "#FFD700" : "rgba(255,255,255,0.2)",
                            }}>{item.price}</span>
                          </div>

                          {/* Кнопка Заказать */}
                          {item.price_num && (
                            <div style={{ padding: "4px 8px 4px 2px", flexShrink: 0 }}>
                              <button
                                className="order-btn"
                                onClick={() => setOrderItem(item)}
                                style={{
                                  padding: "5px 10px", borderRadius: 8,
                                  fontSize: 11, fontWeight: 700,
                                  color: "#000", cursor: "pointer",
                                  background: "linear-gradient(135deg,#FFD700,#f59e0b)",
                                  border: "none", whiteSpace: "nowrap",
                                  boxShadow: "0 2px 8px rgba(255,215,0,0.3)",
                                }}>
                                Заказать
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA-блок */}
            <div className="mt-10 p-6 rounded-3xl text-center"
              style={{
                background: "linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03))",
                border: "1px solid rgba(255,215,0,0.2)",
              }}>
              <div className="font-oswald font-black text-[22px] text-white uppercase tracking-wide mb-2">
                Не нашли нужное?
              </div>
              <div className="text-white/50 text-[13px] mb-5">
                Позвоните — найдём любую модель за 1–3 дня. Скупаем и покупаем 24/7.
              </div>
              <a href="tel:+79929903333"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-oswald font-bold text-[16px] uppercase text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#d97706)", boxShadow: "0 4px 24px rgba(255,215,0,0.35)" }}>
                <Icon name="Phone" size={18} />
                +7 (992) 990-33-33
              </a>
              <div className="text-white/25 text-[11px] mt-3">
                г. Калуга, ул. Кирова 7/47 и ул. Кирова 11
              </div>
            </div>
          </div>
        )}

        {/* SEO-блок */}
        <SeoBlock />
      </div>

      {/* Модал заказа */}
      {orderItem && <OrderModal item={orderItem} onClose={() => setOrderItem(null)} />}
    </>
  );
}
