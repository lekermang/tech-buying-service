import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { formatPhone } from "@/lib/phoneFormat";

const EVALUATOR_URL = "https://functions.poehali.dev/c19fbf1e-d61d-4b21-8f8a-d478faacdaad";

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

const QUICK = [
  { l: "iPhone 15 Pro", brand: "Apple", cat: "смартфон", storage: "256 GB", year: "2023" },
  { l: "iPhone 14", brand: "Apple", cat: "смартфон", storage: "128 GB", year: "2022" },
  { l: "iPhone 13", brand: "Apple", cat: "смартфон", storage: "128 GB", year: "2021" },
  { l: "Samsung S24", brand: "Samsung", cat: "смартфон", storage: "128 GB", year: "2024" },
  { l: "MacBook Air M2", brand: "Apple", cat: "ноутбук", storage: "8/256 GB", year: "2022" },
  { l: "PlayStation 5", brand: "Sony", cat: "игровая консоль", storage: "825 GB", year: "2021" },
  { l: "iPad Air 5", brand: "Apple", cat: "планшет", storage: "64 GB", year: "2022" },
  { l: "AirPods Pro 2", brand: "Apple", cat: "наушники", storage: "", year: "2022" },
];

const CONDITIONS = ["новый", "хорошее", "среднее", "плохое"];
const KITS = ["без коробки", "с коробкой", "полный комплект"];
const CATEGORIES = ["смартфон", "ноутбук", "планшет", "игровая консоль", "наушники", "умные часы", "фотоаппарат", "компьютер", "телевизор", "другое"];

type EvalResult = {
  min_price: number; avg_price: number; max_price: number;
  recommended_buy: number; recommended_sell: number; margin_pct: number;
  liquidity: string; sell_time: string; sell_days: number;
  tips: string[]; factors: string; ad_title: string; risk: string;
  db_stats?: { found?: number; our_avg_buy?: number; our_avg_sell?: number; our_min_sell?: number; our_max_sell?: number };
};

type HistoryEntry = { model: string; result: EvalResult; ts: number; condition: string };

const LSKEY = "sl_eval_history";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(LSKEY) || "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  try { localStorage.setItem(LSKEY, JSON.stringify(h.slice(0, 30))); } catch { /* ignore */ }
}

export default function StaffEvaluator() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [model, setModel] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("смартфон");
  const [storage, setStorage] = useState("");
  const [year, setYear] = useState("");
  const [condition, setCondition] = useState("хорошее");
  const [kit, setKit] = useState("без коробки");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [result, setResult] = useState<EvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoHint, setPhotoHint] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const fillQuick = (q: typeof QUICK[0]) => {
    setModel(q.l); setBrand(q.brand); setCategory(q.cat);
    setStorage(q.storage); setYear(q.year);
    setResult(null); setError(null); setPhotoHint(null);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoLoading(true);
    setPhotoHint(null);
    setError(null);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = ev => res((ev.target?.result as string).split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const resp = await fetch(EVALUATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recognize_photo", photo_base64: b64 }),
      });
      const d = await resp.json();
      if (d.error) { setError("Не удалось распознать: " + d.error); return; }
      if (d.model) setModel(d.model);
      if (d.brand) setBrand(d.brand);
      if (d.category && CATEGORIES.includes(d.category)) setCategory(d.category);
      if (d.storage) setStorage(d.storage);
      if (d.year) setYear(d.year);
      if (d.condition_hints) setNotes(d.condition_hints);
      const hint = `ИИ распознал с фото (уверенность: ${d.confidence || "?"})${d.notes ? " · " + d.notes : ""}`;
      setPhotoHint(hint);
    } catch (ex) {
      setError("Ошибка при обработке фото: " + String(ex));
    } finally {
      setPhotoLoading(false);
    }
  };

  const evaluate = async () => {
    if (!model.trim()) { setError("Введите модель устройства"); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch(EVALUATOR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate", model, brand, category, storage, year, condition, kit, region: "Калуга", notes }),
      });
      const d = await resp.json();
      if (d.error) { setError(d.error); return; }
      setResult(d);
      const entry: HistoryEntry = { model: `${brand} ${model}`.trim(), result: d, ts: Date.now(), condition };
      const newH = [entry, ...history].slice(0, 30);
      setHistory(newH);
      saveHistory(newH);
    } catch (ex) {
      setError("Ошибка соединения: " + String(ex));
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    const text = [
      `Оценка: ${brand} ${model}`.trim(),
      `Закупка (рек.): ${fmt(result.recommended_buy)}`,
      `Продажа (рек.): ${fmt(result.recommended_sell)}`,
      `Маржа: ${result.margin_pct}%`,
      `Рынок Авито: ${fmt(result.min_price)} — ${fmt(result.max_price)}`,
      `Ликвидность: ${result.liquidity} · Срок продажи: ${result.sell_time}`,
      `Дата: ${new Date().toLocaleDateString("ru-RU")}`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const liqColor = (l: string) =>
    l === "высокая" ? "#34d399" : l === "средняя" ? "#FFD700" : "#f87171";

  const riskColor = (r: string) =>
    r === "низкий" ? "#34d399" : r === "средний" ? "#FFD700" : "#f87171";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0a0805 0%, #060504 100%)" }}>
      {/* Шапка */}
      <div className="sticky top-0 z-10" style={{
        background: "linear-gradient(180deg, rgba(14,11,6,0.99) 0%, rgba(10,8,4,0.97) 100%)",
        borderBottom: "1px solid rgba(255,215,0,0.15)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Световая полоска */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,248,232,0.8), rgba(255,215,0,0.6), transparent)",
        }} />
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "white")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            <Icon name="ArrowLeft" size={16} />
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
            background: "linear-gradient(135deg, #FFE34D, #FFD700)",
            boxShadow: "0 0 16px rgba(255,215,0,0.5)",
          }}>
            <Icon name="TrendingUp" size={15} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold uppercase tracking-wide text-sm" style={{
              background: "linear-gradient(90deg, #fff8e8, #FFD700)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>ИИ Оценщик</div>
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Авито · База ломбарда · GPT-4o
            </div>
          </div>
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
            style={{
              background: showHistory ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${showHistory ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
              color: showHistory ? "#FFD700" : "rgba(255,255,255,0.5)",
            }}
          >
            <Icon name="History" size={13} />
            {history.length > 0 && <span>{history.length}</span>}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* История */}
        {showHistory && history.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{
            background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
            border: "1px solid rgba(255,215,0,0.12)",
          }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="font-roboto text-[11px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>История оценок</span>
              <button onClick={() => { setHistory([]); saveHistory([]); }} className="font-roboto text-[11px]" style={{ color: "rgba(255,68,68,0.6)" }}>очистить</button>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {history.map((h, i) => (
                <button key={i} onClick={() => {
                  setResult(h.result);
                  setModel(h.model); setCondition(h.condition);
                  setShowHistory(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,215,0,0.04)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div className="font-roboto text-sm text-white/80">{h.model}</div>
                    <div className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {h.condition} · {new Date(h.ts).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>
                      {fmt(h.result.recommended_buy)}
                    </div>
                    <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>закупка</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Быстрый выбор */}
        <div>
          <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Быстрый выбор</div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map(q => (
              <button key={q.l} onClick={() => fillQuick(q)}
                className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,215,0,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,215,0,0.3)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFD700";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
                }}
              >{q.l}</button>
            ))}
          </div>
        </div>

        {/* Форма */}
        <div className="rounded-xl p-4 space-y-4" style={{
          background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
          border: "1px solid rgba(255,215,0,0.12)",
          boxShadow: "0 2px 0 rgba(255,255,255,0.03) inset, 0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Фото-кнопка */}
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={photoLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-roboto text-sm font-semibold transition-all active:scale-95"
              style={{
                background: photoLoading ? "rgba(255,215,0,0.05)" : "linear-gradient(145deg, rgba(255,215,0,0.12), rgba(255,215,0,0.06))",
                border: "1.5px dashed rgba(255,215,0,0.35)",
                color: photoLoading ? "rgba(255,215,0,0.4)" : "rgba(255,215,0,0.9)",
              }}
            >
              {photoLoading
                ? <><Icon name="Loader" size={16} className="animate-spin" /> Распознаю фото...</>
                : <><Icon name="Camera" size={16} /> Сфоткать устройство / коробку для автоопределения</>
              }
            </button>
            {photoHint && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg" style={{
                background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)",
              }}>
                <Icon name="CheckCircle2" size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="font-roboto text-xs" style={{ color: "rgba(52,211,153,0.9)" }}>{photoHint}</span>
              </div>
            )}
          </div>

          {/* Модель + Бренд */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                Модель *
              </label>
              <input value={model} onChange={e => setModel(e.target.value)}
                placeholder="iPhone 14 Pro 128GB"
                className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Бренд</label>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="Apple"
                className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Категория + Память + Год */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Память</label>
              <input value={storage} onChange={e => setStorage(e.target.value)}
                placeholder="128 GB"
                className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>
            <div>
              <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Год</label>
              <input value={year} onChange={e => setYear(e.target.value)}
                placeholder="2023"
                className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all placeholder:text-white/20"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>
          </div>

          {/* Состояние */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Состояние</label>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
                  style={{
                    background: condition === c ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${condition === c ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: condition === c ? "#FFD700" : "rgba(255,255,255,0.5)",
                    fontWeight: condition === c ? "600" : "400",
                  }}
                >{c}</button>
              ))}
            </div>
          </div>

          {/* Комплектация */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>Комплектация</label>
            <div className="flex flex-wrap gap-2">
              {KITS.map(k => (
                <button key={k} onClick={() => setKit(k)}
                  className="px-3 py-1.5 rounded-lg font-roboto text-xs transition-all"
                  style={{
                    background: kit === k ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${kit === k ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: kit === k ? "#FFD700" : "rgba(255,255,255,0.5)",
                    fontWeight: kit === k ? "600" : "400",
                  }}
                >{k}</button>
              ))}
            </div>
          </div>

          {/* Дефекты */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Дефекты / особенности
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Царапина на экране, нет зарядника, Face ID не работает..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all resize-none placeholder:text-white/20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.08)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="font-roboto text-sm text-red-400">{error}</span>
            </div>
          )}

          <button onClick={evaluate} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FFE34D, #FFD700)",
              boxShadow: loading ? "none" : "0 0 24px rgba(255,215,0,0.4), 0 2px 0 rgba(255,255,255,0.25) inset",
            }}
          >
            {loading
              ? <><Icon name="Loader" size={18} className="animate-spin" /> Анализирую рынок...</>
              : <><Icon name="TrendingUp" size={18} /> Оценить стоимость</>
            }
          </button>
        </div>

        {/* Результат */}
        {result && (
          <div className="rounded-xl overflow-hidden" style={{
            background: "linear-gradient(145deg, rgba(18,14,8,0.97), rgba(10,8,5,0.99))",
            border: "1px solid rgba(255,215,0,0.2)",
            boxShadow: "0 0 40px rgba(255,215,0,0.06), 0 2px 0 rgba(255,255,255,0.03) inset",
          }}>
            {/* Световая полоска */}
            <div className="h-px w-full" style={{
              background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.5), rgba(255,248,232,0.7), rgba(255,215,0,0.5), transparent)",
            }} />

            <div className="p-4 space-y-4">
              {/* Заголовок */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-oswald font-bold text-lg text-white leading-tight">{brand} {model}</div>
                  <div className="font-roboto text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {category} · {condition} · {kit}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-lg font-roboto text-xs font-bold" style={{
                    background: `${liqColor(result.liquidity)}18`,
                    border: `1px solid ${liqColor(result.liquidity)}35`,
                    color: liqColor(result.liquidity),
                  }}>
                    {result.liquidity}
                  </div>
                  <div className="px-2.5 py-1 rounded-lg font-roboto text-xs font-bold" style={{
                    background: `${riskColor(result.risk)}18`,
                    border: `1px solid ${riskColor(result.risk)}35`,
                    color: riskColor(result.risk),
                  }}>
                    риск {result.risk}
                  </div>
                </div>
              </div>

              {/* Главные цены — закупка/продажа */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 text-center" style={{
                  background: "linear-gradient(145deg, rgba(52,211,153,0.12), rgba(52,211,153,0.05))",
                  border: "1px solid rgba(52,211,153,0.25)",
                }}>
                  <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.7)" }}>
                    Закупить у клиента
                  </div>
                  <div className="font-oswald font-black text-2xl" style={{ color: "#34d399" }}>
                    {fmt(result.recommended_buy)}
                  </div>
                  <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>рекомендуемая</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{
                  background: "linear-gradient(145deg, rgba(255,215,0,0.12), rgba(255,215,0,0.05))",
                  border: "1px solid rgba(255,215,0,0.25)",
                }}>
                  <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.7)" }}>
                    Продать на витрине
                  </div>
                  <div className="font-oswald font-black text-2xl" style={{ color: "#FFD700" }}>
                    {fmt(result.recommended_sell)}
                  </div>
                  <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>маржа {result.margin_pct}%</div>
                </div>
              </div>

              {/* Рынок Авито */}
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Рынок Авито · {result.sell_time}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Минимум", v: result.min_price },
                    { l: "Средняя", v: result.avg_price },
                    { l: "Максимум", v: result.max_price },
                  ].map(({ l, v }) => (
                    <div key={l}>
                      <div className="font-oswald font-bold text-base text-white/90">{fmt(v)}</div>
                      <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Наша БД */}
              {result.db_stats?.found && result.db_stats.found > 0 && (
                <div className="rounded-xl p-3" style={{
                  background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="Database" size={12} style={{ color: "rgba(96,165,250,0.8)" }} />
                    <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(96,165,250,0.7)" }}>
                      Наши продажи: {result.db_stats.found} похожих за 90 дней
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div>
                      <div className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>
                        {result.db_stats.our_avg_buy ? fmt(result.db_stats.our_avg_buy) : "—"}
                      </div>
                      <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Закупали</div>
                    </div>
                    <div>
                      <div className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                        {result.db_stats.our_avg_sell ? fmt(result.db_stats.our_avg_sell) : "—"}
                      </div>
                      <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Продавали</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Факторы */}
              {result.factors && (
                <div className="font-roboto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {result.factors}
                </div>
              )}

              {/* Советы */}
              {result.tips?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Советы</div>
                  {result.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Icon name="ArrowRight" size={12} className="shrink-0 mt-0.5" style={{ color: "#34d399" }} />
                      <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Заголовок объявления */}
              {result.ad_title && (
                <div className="rounded-xl p-3" style={{
                  background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
                }}>
                  <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(96,165,250,0.6)" }}>
                    Заголовок для Авито
                  </div>
                  <div className="font-roboto text-sm font-semibold" style={{ color: "#60a5fa" }}>{result.ad_title}</div>
                </div>
              )}

              {/* Кнопка копировать */}
              <button onClick={copyResult}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
                style={{
                  background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
                }}
              >
                <Icon name={copied ? "Check" : "Copy"} size={14} />
                {copied ? "Скопировано!" : "Скопировать оценку"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
