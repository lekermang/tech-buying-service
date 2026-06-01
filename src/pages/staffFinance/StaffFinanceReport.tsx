import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useFinanceHistory } from "./useFinanceHistory";
import type { ReportResult as HistReportResult } from "./useFinanceHistory";
import FinanceHistoryView from "./FinanceHistoryView";
import FinanceStockWidget from "./reportView/FinanceStockWidget";
import FinanceInputView from "./reportView/FinanceInputView";
import FinanceReportView from "./reportView/FinanceReportView";

const FINANCE_URL = "https://functions.poehali.dev/f7e6a419-7cd3-4768-86b6-8a63dfc212ee";

type PdfState = { file: File | null; text: string; loading: boolean; pages: number; error: string | null };
const emptyPdf = (): PdfState => ({ file: null, text: "", loading: false, pages: 0, error: null });

type StockData = {
  in_stock: number; stock_value: number; stock_sell_value: number;
  total_profit: number; total_invested: number; total_revenue: number;
  sold_count: number; last30_buy: number; last30_revenue: number; last30_profit: number;
};

type Parsed = {
  debit_balance: string | null; savings_balance: string | null;
  total_money: string | null; profit_total: string | null; profit_period: string | null;
  days_runway: string | null; safety_level: "green" | "yellow" | "red" | null;
  main_problem: string | null; budget_today: string | null; budget_today_explain: string | null;
  actions: string[]; expense_categories: { name: string; amount: number; percent: number; trend?: string; comment?: string }[];
  income_categories: { name: string; amount: number; percent: number }[];
  top_expenses: { date: string; desc: string; amount: number }[];
  savings_tips: string[]; cash_flow_summary: string | null;
};

type ReportResult = { parsed: Parsed; stock: StockData; generated_at: string; days_left_month: number; day_of_month: number };

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
          body: JSON.stringify({ action: "get_stock", token }),
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
        body: JSON.stringify({ action: "analyze", token, debit_text: debitPdf.text.slice(0, 60000), savings_text: savingsPdf.text.slice(0, 60000), period }),
      });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setResult(d);
      addEntry(period, d as HistReportResult);
      setView("report");
      setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (ex) { setError(String(ex)); }
    finally { setLoading(false); }
  };

  const copyResult = () => {
    if (!result) return;
    const p = result.parsed;
    const lines = [
      p.budget_today ? `Бюджет на сегодня: ${p.budget_today} ₽\n${p.budget_today_explain || ""}` : "",
      p.total_money ? `Итого денег: ${p.total_money}` : "",
      p.profit_total ? `Прибыль с начала: ${p.profit_total}` : "",
      p.main_problem ? `⚠️ ${p.main_problem}` : "",
      p.actions?.length ? "Действия:\n" + p.actions.map((a, i) => `${i + 1}. ${a}`).join("\n") : "",
      p.savings_tips?.length ? "Сэкономить:\n" + p.savings_tips.map((t, i) => `${i + 1}. ${t}`).join("\n") : "",
    ].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(lines).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

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

      <FinanceStockWidget stock={stock} stockLoading={stockLoading} />

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

      {view === "input" && (
        <FinanceInputView
          token={token}
          debitPdf={debitPdf}
          savingsPdf={savingsPdf}
          period={period}
          loading={loading}
          error={error}
          canAnalyze={canAnalyze}
          onDebitFile={setDebitPdf}
          onSavingsFile={setSavingsPdf}
          onDebitClear={() => setDebitPdf(emptyPdf())}
          onSavingsClear={() => setSavingsPdf(emptyPdf())}
          onPeriodChange={setPeriod}
          onAnalyze={analyze}
        />
      )}

      {view === "report" && result && (
        <FinanceReportView
          result={result}
          copied={copied}
          onCopy={copyResult}
        />
      )}

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
