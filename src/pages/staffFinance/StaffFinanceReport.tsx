import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useFinanceHistory } from "./useFinanceHistory";
import type { ReportResult as HistReportResult } from "./useFinanceHistory";
import FinanceHistoryView from "./FinanceHistoryView";

const FINANCE_URL = "https://functions.poehali.dev/f7e6a419-7cd3-4768-86b6-8a63dfc212ee";
const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

type ExpCat  = { name: string; amount: number; percent: number; trend?: string; comment?: string };
type IncCat  = { name: string; amount: number; percent: number };
type TopExp  = { date: string; desc: string; amount: number };

type Parsed = {
  debit_balance: string | null;
  savings_balance: string | null;
  total_money: string | null;
  profit_total: string | null;
  profit_period: string | null;
  days_runway: string | null;
  safety_level: "green" | "yellow" | "red" | null;
  main_problem: string | null;
  budget_today: string | null;
  budget_today_explain: string | null;
  actions: string[];
  expense_categories: ExpCat[];
  income_categories: IncCat[];
  top_expenses: TopExp[];
  savings_tips: string[];
  cash_flow_summary: string | null;
};

type StockData = {
  in_stock: number; stock_value: number; stock_sell_value: number;
  total_profit: number; total_invested: number; total_revenue: number;
  sold_count: number; last30_buy: number; last30_revenue: number; last30_profit: number;
};

type ReportResult = {
  parsed: Parsed; stock: StockData;
  generated_at: string; days_left_month: number; day_of_month: number;
};

type PdfState = { file: File | null; text: string; loading: boolean; pages: number; error: string | null };

const SAFE = {
  green:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  text: "#34d399", label: "Зелёный ✓" },
  yellow: { bg: "rgba(255,215,0,0.1)",   border: "rgba(255,215,0,0.3)",   text: "#FFD700", label: "Жёлтый ⚠" },
  red:    { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Красный ✗" },
};

const CAT_COLORS = ["#FFD700","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#e879f9","#38bdf8"];
const INC_COLORS = ["#34d399","#60a5fa","#a78bfa","#FFD700","#fb923c"];
const TREND_ICON: Record<string, string> = { up: "TrendingUp", down: "TrendingDown", stable: "Minus" };
const TREND_COLOR: Record<string, string> = { up: "#f87171", down: "#34d399", stable: "#FFD700" };

const emptyPdf = (): PdfState => ({ file: null, text: "", loading: false, pages: 0, error: null });

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = ev => res((ev.target?.result as string) ?? "");
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function PdfZone({ label, hint, state, onFile, onClear, token }: {
  label: string; hint: string; state: PdfState;
  onFile: (s: PdfState) => void; onClear: () => void; token: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      onFile({ ...emptyPdf(), error: "Нужен PDF-файл" }); return;
    }
    onFile({ ...emptyPdf(), file, loading: true });
    try {
      const b64 = await fileToBase64(file);
      const r = await fetch(FINANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "parse_pdf", pdf_base64: b64 }),
      });
      const d = await r.json();
      if (d.error) onFile({ ...emptyPdf(), file, error: d.error });
      else onFile({ file, text: d.text || "", loading: false, pages: d.pages || 0, error: d.warning || null });
    } catch (ex) {
      onFile({ ...emptyPdf(), file, error: String(ex) });
    }
  };

  const isOk = !!state.text && !state.loading;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>{label}</span>
        {state.file && <button onClick={onClear} className="font-roboto text-[10px]" style={{ color: "rgba(248,113,113,0.7)" }}>Удалить</button>}
      </div>
      {!state.file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl cursor-pointer transition-all"
          style={{
            background: drag ? "rgba(255,215,0,0.07)" : "rgba(255,255,255,0.03)",
            border: `1.5px dashed ${drag ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <Icon name="FileUp" size={22} style={{ color: drag ? "#FFD700" : "rgba(255,255,255,0.3)" }} />
          <div className="text-center">
            <div className="font-roboto text-sm font-semibold" style={{ color: drag ? "#FFD700" : "rgba(255,255,255,0.5)" }}>Загрузить PDF</div>
            <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{hint}</div>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }} />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{
          border: `1px solid ${isOk ? "rgba(52,211,153,0.3)" : state.error ? "rgba(248,113,113,0.3)" : "rgba(255,215,0,0.25)"}`,
          background: isOk ? "rgba(52,211,153,0.05)" : state.error ? "rgba(248,113,113,0.05)" : "rgba(255,215,0,0.04)",
        }}>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
              {state.loading ? <Icon name="Loader2" size={16} className="animate-spin" style={{ color: "#FFD700" }} />
                : isOk ? <Icon name="CheckCircle2" size={16} style={{ color: "#34d399" }} />
                : <Icon name="AlertCircle" size={16} style={{ color: "#f87171" }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-sm truncate text-white/80">{state.file.name}</div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {state.loading ? "Извлекаю текст..." : isOk
                  ? `${state.pages} стр. · ${state.text.length.toLocaleString("ru-RU")} симв.`
                  : state.error || ""}
              </div>
            </div>
          </div>
          {isOk && (
            <div className="px-3 pb-3">
              <div className="px-3 py-2 rounded-lg font-roboto text-[11px] leading-relaxed" style={{
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{state.text.slice(0, 280)}…</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StaffFinanceReport({ token }: { token: string }) {
  const [debitPdf, setDebitPdf]     = useState<PdfState>(emptyPdf());
  const [savingsPdf, setSavingsPdf] = useState<PdfState>(emptyPdf());
  const [period, setPeriod] = useState(() => new Date().toLocaleString("ru-RU", { month: "long", year: "numeric" }));
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<ReportResult | null>(null);
  const [stock, setStock]     = useState<StockData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [view, setView]       = useState<"input" | "report" | "history">("input");
  const [copied, setCopied]   = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const { history, addEntry, removeEntry, clearAll } = useFinanceHistory();

  useEffect(() => {
    (async () => {
      setStockLoading(true);
      try {
        const r = await fetch(FINANCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Employee-Token": token },
          body: JSON.stringify({ action: "get_stock" }),
        });
        const d = await r.json();
        if (!d.error) setStock(d);
      } catch { /* ignore */ }
      setStockLoading(false);
    })();
  }, [token]);

  const canAnalyze = (!!debitPdf.text || !!savingsPdf.text) && !debitPdf.loading && !savingsPdf.loading;

  const analyze = async () => {
    if (!canAnalyze) { setError("Загрузите хотя бы один PDF"); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch(FINANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "analyze", debit_text: debitPdf.text, savings_text: savingsPdf.text, period }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setResult(d);
      // Сохраняем в историю
      addEntry(period, d as HistReportResult);
      setView("report");
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (ex) { setError(String(ex)); }
    finally { setLoading(false); }
  };

  const p = result?.parsed;
  const safeStyle = p?.safety_level ? SAFE[p.safety_level] : null;

  return (
    <div ref={topRef} className="max-w-2xl mx-auto px-3 py-3 space-y-3">

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
          background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: "0 0 16px rgba(255,215,0,0.4)",
        }}>
          <Icon name="LineChart" size={17} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-black uppercase tracking-wide text-sm" style={{
            background: "linear-gradient(90deg,#fff8e8,#FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Финансовый отчёт</div>
          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            ДДС · PDF выписки + Склад · GPT-4o
          </div>
        </div>
      </div>

      {/* Склад */}
      <div className="rounded-xl p-3" style={{
        background: "linear-gradient(145deg,rgba(255,215,0,0.06),rgba(255,215,0,0.02))",
        border: "1px solid rgba(255,215,0,0.15)",
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Package" size={12} style={{ color: "rgba(255,215,0,0.7)" }} />
          <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Данные склада (авто)</span>
          {stockLoading && <Icon name="Loader2" size={10} className="animate-spin ml-auto" style={{ color: "rgba(255,215,0,0.4)" }} />}
        </div>
        {stock ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Склад", v: fmt(stock.stock_value) + " ₽", c: "#FFD700" },
              { l: "Прибыль", v: fmt(stock.total_profit) + " ₽", c: "#34d399" },
              { l: "Продажи 30д", v: fmt(stock.last30_revenue) + " ₽", c: "#60a5fa" },
            ].map(({ l, v, c }) => (
              <div key={l} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="font-oswald font-bold text-sm" style={{ color: c }}>{v}</div>
                <div className="font-roboto text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            {stockLoading ? "Загружаю..." : "Нет данных"}
          </div>
        )}
      </div>

      {/* Табы */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { k: "input",   l: "📂 Файлы" },
          { k: "report",  l: "📊 Отчёт",  disabled: !result },
          { k: "history", l: `🕐 История${history.length > 0 ? ` (${history.length})` : ""}` },
        ] as const).map(({ k, l, disabled }) => (
          <button key={k} onClick={() => !disabled && setView(k)}
            className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all"
            style={{
              background: view === k ? "rgba(255,215,0,0.15)" : "transparent",
              color: view === k ? "#FFD700" : disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
              border: view === k ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >{l}</button>
        ))}
      </div>

      {/* ── ВВОД ── */}
      {view === "input" && (
        <div className="space-y-4">
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>Период</label>
            <input value={period} onChange={e => setPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>
          <PdfZone label="Выписка · Дебетовая карта" hint="Перетащите или нажмите · PDF из банка"
            state={debitPdf} onFile={setDebitPdf} onClear={() => setDebitPdf(emptyPdf())} token={token} />
          <PdfZone label="Выписка · Накопительный счёт" hint="Необязательно"
            state={savingsPdf} onFile={setSavingsPdf} onClear={() => setSavingsPdf(emptyPdf())} token={token} />
          {!debitPdf.file && !savingsPdf.file && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <Icon name="Info" size={13} className="shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
              <span className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Скачайте выписку в банковском приложении → формат PDF → загрузите сюда. Текст извлечётся автоматически.
              </span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="font-roboto text-sm text-red-400">{error}</span>
            </div>
          )}
          <button onClick={analyze} disabled={loading || !canAnalyze}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#FFE34D,#FFD700)", boxShadow: canAnalyze && !loading ? "0 0 28px rgba(255,215,0,0.45)" : "none" }}
          >
            {loading ? <><Icon name="Loader" size={18} className="animate-spin" /> Анализирую...</>
              : <><Icon name="LineChart" size={18} /> Сформировать отчёт</>}
          </button>
        </div>
      )}

      {/* ── ОТЧЁТ ── */}
      {view === "report" && result && p && (
        <div className="space-y-3">

          {/* ★ БЮДЖЕТ НА СЕГОДНЯ */}
          {p.budget_today && (
            <div className="rounded-2xl overflow-hidden" style={{
              background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.06))",
              border: "1.5px solid rgba(255,215,0,0.4)",
              boxShadow: "0 0 32px rgba(255,215,0,0.1)",
            }}>
              <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(255,215,0,0.7),rgba(255,248,232,0.9),rgba(255,215,0,0.7),transparent)" }} />
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="Wallet" size={14} style={{ color: "#FFD700" }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,215,0,0.7)" }}>
                    Сегодня можно потратить
                  </span>
                </div>
                <div className="font-oswald font-black leading-none mb-1" style={{ fontSize: 36, color: "#FFD700", textShadow: "0 0 24px rgba(255,215,0,0.4)" }}>
                  {isNaN(Number(String(p.budget_today).replace(/\s/g, "")))
                    ? p.budget_today
                    : fmt(Number(String(p.budget_today).replace(/\s/g, "").replace(",","."))) + " ₽"}
                </div>
                {p.budget_today_explain && (
                  <div className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{p.budget_today_explain}</div>
                )}
                <div className="flex items-center gap-1.5 mt-2">
                  <Icon name="Calendar" size={11} style={{ color: "rgba(255,215,0,0.5)" }} />
                  <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    До конца месяца: {result.days_left_month} дн. · {result.day_of_month}-й день месяца
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Деньги + Прибыль */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,215,0,0.18)", background: "rgba(255,215,0,0.04)" }}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom: "1px solid rgba(255,215,0,0.1)" }}>
                <Icon name="Banknote" size={12} style={{ color: "#FFD700" }} />
                <span className="font-roboto text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,215,0,0.7)" }}>Деньги</span>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                {p.debit_balance && <div className="flex justify-between text-xs"><span style={{ color: "rgba(255,255,255,0.4)" }}>Карта</span><span className="font-semibold text-white/80">{p.debit_balance}</span></div>}
                {p.savings_balance && <div className="flex justify-between text-xs"><span style={{ color: "rgba(255,255,255,0.4)" }}>Вклад</span><span className="font-semibold text-white/80">{p.savings_balance}</span></div>}
                {p.total_money && (
                  <div className="flex justify-between items-center pt-1" style={{ borderTop: "1px solid rgba(255,215,0,0.1)" }}>
                    <span className="font-roboto text-[10px] uppercase" style={{ color: "rgba(255,215,0,0.7)" }}>Итого</span>
                    <span className="font-oswald font-black text-base" style={{ color: "#FFD700" }}>{p.total_money}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(52,211,153,0.18)", background: "rgba(52,211,153,0.04)" }}>
              <div className="px-3 py-2 flex items-center gap-1.5" style={{ borderBottom: "1px solid rgba(52,211,153,0.1)" }}>
                <Icon name="TrendingUp" size={12} style={{ color: "#34d399" }} />
                <span className="font-roboto text-[9px] uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.7)" }}>Прибыль</span>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                {p.profit_total && <div className="flex justify-between text-xs"><span style={{ color: "rgba(255,255,255,0.4)" }}>С начала</span><span className="font-semibold" style={{ color: "#34d399" }}>{p.profit_total}</span></div>}
                {p.profit_period && <div className="flex justify-between text-xs"><span style={{ color: "rgba(255,255,255,0.4)" }}>Период</span><span className="font-semibold text-white/80">{p.profit_period}</span></div>}
                {p.days_runway && (
                  <div className="flex justify-between items-center pt-1" style={{ borderTop: "1px solid rgba(52,211,153,0.1)" }}>
                    <span className="font-roboto text-[10px] uppercase" style={{ color: "rgba(52,211,153,0.7)" }}>Запас</span>
                    <span className="font-oswald font-black text-sm" style={{ color: safeStyle?.text || "#34d399" }}>{p.days_runway}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Светофор */}
          {p.safety_level && safeStyle && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: safeStyle.bg, border: `1px solid ${safeStyle.border}` }}>
              <Icon name={p.safety_level === "green" ? "ShieldCheck" : p.safety_level === "red" ? "ShieldAlert" : "AlertTriangle"} size={18} style={{ color: safeStyle.text }} />
              <div className="flex-1">
                <div className="font-roboto text-xs uppercase tracking-wide" style={{ color: safeStyle.text }}>Порог безопасности</div>
                <div className="font-oswald font-bold text-base" style={{ color: safeStyle.text }}>{safeStyle.label}</div>
              </div>
            </div>
          )}

          {/* Главная проблема */}
          {p.main_problem && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
              <Icon name="Flame" size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(248,113,113,0.7)" }}>Главная проблема</div>
                <div className="font-roboto text-sm font-semibold text-red-300">{p.main_problem}</div>
              </div>
            </div>
          )}

          {/* Расходы */}
          {p.expense_categories?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,12,8,0.95)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon name="PieChart" size={13} style={{ color: "#f87171" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Куда уходят деньги</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {p.expense_categories.map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{cat.name}</span>
                        {cat.trend && cat.trend in TREND_ICON && (
                          <Icon name={TREND_ICON[cat.trend]} size={11} style={{ color: TREND_COLOR[cat.trend] }} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {cat.comment && <span className="font-roboto text-[10px] hidden sm:inline" style={{ color: "rgba(255,255,255,0.25)" }}>{cat.comment}</span>}
                        <span className="font-oswald font-bold text-sm" style={{ color: CAT_COLORS[i % CAT_COLORS.length] }}>{fmt(cat.amount)} ₽</span>
                        <span className="font-roboto text-[10px] w-7 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{cat.percent}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(cat.percent, 100)}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Доходы */}
          {p.income_categories?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,12,8,0.95)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon name="ArrowDownLeft" size={13} style={{ color: "#34d399" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Откуда приходят деньги</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {p.income_categories.map((cat, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: INC_COLORS[i % INC_COLORS.length] }} />
                        <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-sm" style={{ color: "#34d399" }}>{fmt(cat.amount)} ₽</span>
                        <span className="font-roboto text-[10px] w-7 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>{cat.percent}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(cat.percent, 100)}%`, background: INC_COLORS[i % INC_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Крупнейшие расходы */}
          {p.top_expenses?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,12,8,0.95)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Icon name="Receipt" size={13} style={{ color: "#fb923c" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Крупнейшие расходы</span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {p.top_expenses.map((t, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="font-roboto text-[11px] w-10 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{t.date}</div>
                    <div className="flex-1 font-roboto text-sm truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{t.desc}</div>
                    <div className="font-oswald font-bold text-sm shrink-0" style={{ color: "#fb923c" }}>−{fmt(t.amount)} ₽</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Где сэкономить */}
          {p.savings_tips?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(96,165,250,0.2)", background: "rgba(96,165,250,0.04)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(96,165,250,0.12)" }}>
                <Icon name="Scissors" size={13} style={{ color: "#60a5fa" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(96,165,250,0.8)" }}>Где сэкономить</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {p.savings_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-oswald font-black text-[10px]" style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" }}>{i + 1}</div>
                    <span className="font-roboto text-sm leading-snug" style={{ color: "rgba(255,255,255,0.7)" }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Три действия */}
          {p.actions?.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(167,139,250,0.2)", background: "rgba(167,139,250,0.04)" }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
                <Icon name="ListChecks" size={13} style={{ color: "#a78bfa" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(167,139,250,0.8)" }}>Три действия завтра</span>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {p.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-oswald font-black text-xs" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>{i + 1}</div>
                    <span className="font-roboto text-sm leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Резюме */}
          {p.cash_flow_summary && (
            <div className="px-4 py-3 rounded-xl font-roboto text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Activity" size={12} style={{ color: "rgba(255,215,0,0.5)" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Резюме</span>
              </div>
              {p.cash_flow_summary}
            </div>
          )}

          {/* Копировать */}
          <button onClick={() => {
            const lines = [
              p.budget_today ? `Бюджет на сегодня: ${p.budget_today} ₽\n${p.budget_today_explain || ""}` : "",
              p.total_money ? `Итого денег: ${p.total_money}` : "",
              p.profit_total ? `Прибыль с начала: ${p.profit_total}` : "",
              p.main_problem ? `⚠️ ${p.main_problem}` : "",
              p.actions?.length ? "Действия:\n" + p.actions.map((a, i) => `${i + 1}. ${a}`).join("\n") : "",
              p.savings_tips?.length ? "Сэкономить:\n" + p.savings_tips.map((t, i) => `${i + 1}. ${t}`).join("\n") : "",
            ].filter(Boolean).join("\n\n");
            navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
          }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
            }}
          >
            <Icon name={copied ? "Check" : "Copy"} size={14} />
            {copied ? "Скопировано!" : "Скопировать отчёт"}
          </button>

          <div className="font-roboto text-[10px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            Сформировано: {new Date(result.generated_at).toLocaleString("ru-RU")}
          </div>
        </div>
      )}

      {/* ── ИСТОРИЯ / СРАВНЕНИЕ ── */}
      {view === "history" && (
        <FinanceHistoryView
          history={history}
          onRemove={removeEntry}
          onClear={clearAll}
        />
      )}
    </div>
  );
}