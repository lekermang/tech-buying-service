import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const FINANCE_URL = "https://functions.poehali.dev/f7e6a419-7cd3-4768-86b6-8a63dfc212ee";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

type StockData = {
  in_stock: number; stock_value: number; stock_sell_value: number;
  total_profit: number; total_invested: number; total_revenue: number;
  sold_count: number; started_at: string | null;
  last30_buy: number; last30_count: number;
  last30_revenue: number; last30_profit: number; last30_sold: number;
};

type ParsedReport = {
  debit_balance: string | null; savings_balance: string | null; total_money: string | null;
  profit_total: string | null; profit_period: string | null;
  days_runway: string | null; safety_level: "green" | "yellow" | "red" | null;
  main_problem: string | null; actions: string[];
};

type ReportResult = {
  report: string; parsed: ParsedReport; stock: StockData; generated_at: string;
};

type PdfState = {
  file: File | null;
  text: string;
  loading: boolean;
  pages: number;
  error: string | null;
};

const SAFETY_COLORS = {
  green:  { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34d399", label: "Зелёный ✓" },
  yellow: { bg: "rgba(255,215,0,0.1)",  border: "rgba(255,215,0,0.3)",  text: "#FFD700", label: "Жёлтый ⚠" },
  red:    { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Красный ✕" },
};

const emptyPdf = (): PdfState => ({ file: null, text: "", loading: false, pages: 0, error: null });

// Конвертируем File → base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = ev => res((ev.target?.result as string) ?? "");
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

// Зона загрузки одного PDF
function PdfDropZone({
  label, hint, state, onFile, onClear, token,
}: {
  label: string; hint: string;
  state: PdfState;
  onFile: (s: PdfState) => void;
  onClear: () => void;
  token: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      onFile({ ...emptyPdf(), error: "Нужен PDF-файл" });
      return;
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
      if (d.error) {
        onFile({ ...emptyPdf(), file, error: d.error });
      } else {
        onFile({ file, text: d.text || "", loading: false, pages: d.pages || 0, error: d.warning || null });
      }
    } catch (ex) {
      onFile({ ...emptyPdf(), file, error: "Ошибка: " + String(ex) });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const isReady = state.text && !state.loading && !state.error;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.38)" }}>
          {label}
        </label>
        {state.file && (
          <button onClick={onClear} className="font-roboto text-[10px] transition-colors" style={{ color: "rgba(248,113,113,0.7)" }}>
            Удалить
          </button>
        )}
      </div>

      {/* Зона дропа */}
      {!state.file ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className="relative flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl cursor-pointer transition-all select-none"
          style={{
            background: drag ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.03)",
            border: `1.5px dashed ${drag ? "rgba(255,215,0,0.6)" : "rgba(255,255,255,0.12)"}`,
          }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: "rgba(255,255,255,0.06)",
          }}>
            <Icon name="FileUp" size={20} style={{ color: "rgba(255,255,255,0.4)" }} />
          </div>
          <div className="text-center">
            <div className="font-roboto text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              Загрузить PDF
            </div>
            <div className="font-roboto text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
              {hint}
            </div>
          </div>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
          />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{
          border: `1px solid ${isReady ? "rgba(52,211,153,0.3)" : state.error ? "rgba(248,113,113,0.3)" : "rgba(255,215,0,0.25)"}`,
          background: isReady ? "rgba(52,211,153,0.05)" : state.error ? "rgba(248,113,113,0.05)" : "rgba(255,215,0,0.04)",
        }}>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
              background: isReady ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)",
            }}>
              {state.loading
                ? <Icon name="Loader2" size={16} className="animate-spin" style={{ color: "#FFD700" }} />
                : isReady
                  ? <Icon name="CheckCircle2" size={16} style={{ color: "#34d399" }} />
                  : state.error
                    ? <Icon name="AlertCircle" size={16} style={{ color: "#f87171" }} />
                    : <Icon name="FileText" size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-roboto text-sm truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
                {state.file.name}
              </div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {state.loading ? "Извлекаю текст..." :
                  isReady ? `${state.pages} стр. · ${state.text.length.toLocaleString("ru-RU")} симв.` :
                  state.error ? state.error : "Обрабатываю..."}
              </div>
            </div>
          </div>
          {/* Превью текста */}
          {isReady && (
            <div className="px-3 pb-3">
              <div className="rounded-lg px-3 py-2 font-roboto text-[11px] leading-relaxed line-clamp-3" style={{
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.45)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {state.text.slice(0, 300)}…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StaffFinanceReport({ token }: { token: string }) {
  const [debitPdf, setDebitPdf] = useState<PdfState>(emptyPdf());
  const [savingsPdf, setSavingsPdf] = useState<PdfState>(emptyPdf());
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return now.toLocaleString("ru-RU", { month: "long", year: "numeric" });
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [stock, setStock] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [tab, setTab] = useState<"input" | "result">("input");
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setStockLoading(true);
      try {
        const r = await fetch(FINANCE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Employee-Token": token },
          body: JSON.stringify({ action: "get_stock" }),
        });
        const d = await r.json();
        if (d && !d.error) setStock(d);
      } catch { /* ignore */ }
      setStockLoading(false);
    };
    load();
  }, [token]);

  const canAnalyze = (debitPdf.text || savingsPdf.text) &&
    !debitPdf.loading && !savingsPdf.loading;

  const analyze = async () => {
    if (!canAnalyze) {
      setError("Загрузите хотя бы один PDF-файл выписки");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(FINANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({
          action: "analyze",
          debit_text: debitPdf.text,
          savings_text: savingsPdf.text,
          period,
        }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setResult(d);
      setTab("result");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (ex) {
      setError("Ошибка соединения: " + String(ex));
    } finally {
      setLoading(false);
    }
  };

  const copyReport = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const safetyStyle = result?.parsed.safety_level
    ? SAFETY_COLORS[result.parsed.safety_level]
    : null;

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

      {/* Шапка */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
          background: "linear-gradient(135deg, #FFE34D, #FFD700)",
          boxShadow: "0 0 16px rgba(255,215,0,0.4)",
        }}>
          <Icon name="LineChart" size={17} className="text-black" />
        </div>
        <div>
          <div className="font-oswald font-black uppercase tracking-wide text-sm" style={{
            background: "linear-gradient(90deg, #fff8e8, #FFD700)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>Финансовый отчёт</div>
          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            ДДС · PDF выписки + Склад · GPT-4o
          </div>
        </div>
      </div>

      {/* Данные склада */}
      <div className="rounded-xl p-3" style={{
        background: "linear-gradient(145deg, rgba(255,215,0,0.06), rgba(255,215,0,0.02))",
        border: "1px solid rgba(255,215,0,0.15)",
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Package" size={12} style={{ color: "rgba(255,215,0,0.7)" }} />
          <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
            Данные склада (автоматически)
          </span>
          {stockLoading && <Icon name="Loader2" size={10} className="animate-spin ml-auto" style={{ color: "rgba(255,215,0,0.4)" }} />}
        </div>
        {stock ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: "Склад (закуп.)", v: fmt(stock.stock_value) + " ₽", c: "#FFD700" },
              { l: "Прибыль всего", v: fmt(stock.total_profit) + " ₽", c: "#34d399" },
              { l: "Закупки 30 дн.", v: fmt(stock.last30_buy) + " ₽", c: "#60a5fa" },
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

      {/* Переключатель */}
      {result && (
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {(["input", "result"] as const).map(v => (
            <button key={v} onClick={() => setTab(v)}
              className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all"
              style={{
                background: tab === v ? "rgba(255,215,0,0.15)" : "transparent",
                color: tab === v ? "#FFD700" : "rgba(255,255,255,0.4)",
                border: tab === v ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
              }}
            >
              {v === "input" ? "📂 Файлы" : "📊 Отчёт"}
            </button>
          ))}
        </div>
      )}

      {/* ── Форма ── */}
      {tab === "input" && (
        <div className="space-y-4">

          {/* Период */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Отчётный период
            </label>
            <input value={period} onChange={e => setPeriod(e.target.value)}
              placeholder="Май 2026"
              className="w-full px-3 py-2 rounded-xl font-roboto text-sm text-white outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
            />
          </div>

          {/* PDF выписки */}
          <PdfDropZone
            label="Выписка · Дебетовая карта"
            hint="Перетащите или нажмите · PDF из банка"
            state={debitPdf}
            onFile={setDebitPdf}
            onClear={() => setDebitPdf(emptyPdf())}
            token={token}
          />

          <PdfDropZone
            label="Выписка · Накопительный счёт"
            hint="Необязательно · PDF из банка"
            state={savingsPdf}
            onFile={setSavingsPdf}
            onClear={() => setSavingsPdf(emptyPdf())}
            token={token}
          />

          {/* Подсказка */}
          {!debitPdf.file && !savingsPdf.file && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{
              background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)",
            }}>
              <Icon name="Info" size={13} className="shrink-0 mt-0.5" style={{ color: "#60a5fa" }} />
              <span className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Скачайте выписку в банковском приложении в формате PDF и загрузите сюда. Текст извлечётся автоматически.
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
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #FFE34D, #FFD700)",
              boxShadow: (!loading && canAnalyze) ? "0 0 24px rgba(255,215,0,0.4)" : "none",
            }}
          >
            {loading
              ? <><Icon name="Loader" size={18} className="animate-spin" /> Анализирую выписки...</>
              : <><Icon name="LineChart" size={18} /> Сформировать отчёт</>
            }
          </button>
        </div>
      )}

      {/* ── Результат ── */}
      {tab === "result" && result && (
        <div ref={resultRef} className="space-y-3">

          {/* Деньги */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="px-4 py-2.5" style={{ background: "rgba(255,215,0,0.06)", borderBottom: "1px solid rgba(255,215,0,0.12)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Banknote" size={13} style={{ color: "#FFD700" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,215,0,0.8)" }}>Деньги на сегодня</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { l: "Дебетовая карта", v: result.parsed.debit_balance },
                { l: "Накопительный счёт", v: result.parsed.savings_balance },
              ].map(({ l, v }) => v && (
                <div key={l} className="flex items-center justify-between">
                  <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</span>
                  <span className="font-roboto font-semibold text-sm text-white/70">{v}</span>
                </div>
              ))}
              {result.parsed.total_money && (
                <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,215,0,0.15)" }}>
                  <span className="font-oswald font-bold text-sm uppercase tracking-wide" style={{ color: "rgba(255,215,0,0.8)" }}>ИТОГО</span>
                  <span className="font-oswald font-black text-xl" style={{ color: "#FFD700" }}>{result.parsed.total_money}</span>
                </div>
              )}
            </div>
          </div>

          {/* Прибыль */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="px-4 py-2.5" style={{ background: "rgba(52,211,153,0.06)", borderBottom: "1px solid rgba(52,211,153,0.12)" }}>
              <div className="flex items-center gap-2">
                <Icon name="TrendingUp" size={13} style={{ color: "#34d399" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(52,211,153,0.8)" }}>Прибыль бизнеса</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {result.parsed.profit_total && (
                <div className="flex items-center justify-between">
                  <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>С начала бизнеса</span>
                  <span className="font-oswald font-bold text-base" style={{ color: "#34d399" }}>{result.parsed.profit_total}</span>
                </div>
              )}
              {result.parsed.profit_period && (
                <div className="flex items-center justify-between">
                  <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>За период ({period})</span>
                  <span className="font-roboto font-semibold text-sm text-white/70">{result.parsed.profit_period}</span>
                </div>
              )}
            </div>
          </div>

          {/* Кассовый разрыв */}
          {(result.parsed.days_runway || result.parsed.safety_level) && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${safetyStyle?.border || "rgba(255,255,255,0.1)"}` }}>
              <div className="px-4 py-2.5" style={{ background: safetyStyle?.bg, borderBottom: `1px solid ${safetyStyle?.border}` }}>
                <div className="flex items-center gap-2">
                  <Icon name="AlertTriangle" size={13} style={{ color: safetyStyle?.text }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: safetyStyle?.text }}>Риск кассового разрыва</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {result.parsed.days_runway && (
                  <div className="flex items-center justify-between">
                    <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Денег хватит на</span>
                    <span className="font-roboto font-bold text-sm" style={{ color: safetyStyle?.text }}>{result.parsed.days_runway}</span>
                  </div>
                )}
                {result.parsed.safety_level && (
                  <div className="flex items-center justify-between">
                    <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Порог безопасности</span>
                    <span className="font-roboto font-bold text-sm px-3 py-1 rounded-lg" style={{
                      background: safetyStyle?.bg, color: safetyStyle?.text, border: `1px solid ${safetyStyle?.border}`,
                    }}>{safetyStyle?.label}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Главная проблема */}
          {result.parsed.main_problem && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
            }}>
              <Icon name="Flame" size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(248,113,113,0.7)" }}>Главная проблема</div>
                <div className="font-roboto text-sm font-semibold text-red-300">{result.parsed.main_problem}</div>
              </div>
            </div>
          )}

          {/* Три действия */}
          {result.parsed.actions.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(96,165,250,0.2)" }}>
              <div className="px-4 py-2.5" style={{ background: "rgba(96,165,250,0.06)", borderBottom: "1px solid rgba(96,165,250,0.12)" }}>
                <div className="flex items-center gap-2">
                  <Icon name="ListChecks" size={13} style={{ color: "#60a5fa" }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(96,165,250,0.8)" }}>Три действия завтра</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {result.parsed.actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-oswald font-black text-xs" style={{
                      background: "rgba(96,165,250,0.15)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)",
                    }}>{i + 1}</div>
                    <span className="font-roboto text-sm leading-snug" style={{ color: "rgba(255,255,255,0.75)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2">
            <button onClick={copyReport}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
              style={{
                background: copied ? "rgba(52,211,153,0.1)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
                color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
              }}
            >
              <Icon name={copied ? "Check" : "Copy"} size={14} />
              {copied ? "Скопировано!" : "Скопировать"}
            </button>
            <button onClick={() => setShowRaw(v => !v)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              <Icon name="FileText" size={14} /> {showRaw ? "Скрыть" : "Полный текст"}
            </button>
          </div>

          {showRaw && (
            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <pre className="font-roboto text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(255,255,255,0.65)" }}>
                {result.report}
              </pre>
              <div className="mt-3 font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                Сформировано: {new Date(result.generated_at).toLocaleString("ru-RU")}
              </div>
            </div>
          )}

          {/* Данные склада в отчёте */}
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>
              Складские данные использованные в отчёте
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { l: "Позиций на складе", v: `${result.stock.in_stock} шт` },
                { l: "Склад (закупочная)", v: `${fmt(result.stock.stock_value)} ₽` },
                { l: "Прибыль с начала", v: `${fmt(result.stock.total_profit)} ₽` },
                { l: "Вложено всего", v: `${fmt(result.stock.total_invested)} ₽` },
                { l: "Выручка всего", v: `${fmt(result.stock.total_revenue)} ₽` },
                { l: "Продано всего", v: `${result.stock.sold_count} шт` },
              ].map(({ l, v }) => (
                <div key={l} className="flex items-center justify-between py-0.5">
                  <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</span>
                  <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
