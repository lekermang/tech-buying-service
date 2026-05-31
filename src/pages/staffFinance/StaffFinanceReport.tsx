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

const SAFETY_COLORS = {
  green:  { bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", text: "#34d399", label: "Зелёный ✓" },
  yellow: { bg: "rgba(255,215,0,0.1)",  border: "rgba(255,215,0,0.3)",  text: "#FFD700", label: "Жёлтый ⚠" },
  red:    { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Красный ✕" },
};

const PLACEHOLDER_DEBIT = `Пример (вставьте свою выписку):
Остаток на начало: 45 000 руб
22.05 — Скупка телефонов (Яндекс касса) +18 000
23.05 — Аренда офиса -15 000
24.05 — Продажа ноутбука +12 500
...
Остаток на конец: 60 500 руб`;

const PLACEHOLDER_SAVINGS = `Пример:
Остаток на начало: 120 000 руб
Начислены проценты: +1 200 руб
Пополнение с карты: +50 000 руб
Остаток на конец: 171 200 руб`;

export default function StaffFinanceReport({ token }: { token: string }) {
  const [debitText, setDebitText] = useState("");
  const [savingsText, setSavingsText] = useState("");
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.toLocaleString("ru-RU", { month: "long", year: "numeric" })}`;
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [stock, setStock] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [tab, setTab] = useState<"input" | "result">("input");
  const [showRaw, setShowRaw] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Грузим данные склада при открытии
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

  const analyze = async () => {
    if (!debitText.trim() && !savingsText.trim()) {
      setError("Вставьте хотя бы одну выписку");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(FINANCE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "analyze", debit_text: debitText, savings_text: savingsText, period }),
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
    navigator.clipboard.writeText(result.report);
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
            ДДС · Банк + Склад · GPT-4o
          </div>
        </div>
      </div>

      {/* Блок данных склада (всегда видно) */}
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

      {/* Переключатель ввод / результат */}
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
              {v === "input" ? "✏️ Ввод данных" : "📊 Отчёт"}
            </button>
          ))}
        </div>
      )}

      {/* ── Форма ввода ── */}
      {tab === "input" && (
        <div className="space-y-3">
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

          {/* Дебетовая карта */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Выписка · Дебетовая карта
            </label>
            <textarea
              value={debitText}
              onChange={e => setDebitText(e.target.value)}
              placeholder={PLACEHOLDER_DEBIT}
              rows={7}
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all resize-y placeholder:text-white/15"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minHeight: 140 }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.06)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Накопительный счёт */}
          <div>
            <label className="block font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Выписка · Накопительный счёт
            </label>
            <textarea
              value={savingsText}
              onChange={e => setSavingsText(e.target.value)}
              placeholder={PLACEHOLDER_SAVINGS}
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl font-roboto text-sm text-white outline-none transition-all resize-y placeholder:text-white/15"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", minHeight: 100 }}
              onFocus={e => { e.target.style.borderColor = "rgba(255,215,0,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(255,215,0,0.06)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div className="font-roboto text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }}>
            Вставьте текст из банковского приложения или CSV. Данные склада подтянутся автоматически.
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <Icon name="AlertCircle" size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span className="font-roboto text-sm text-red-400">{error}</span>
            </div>
          )}

          <button onClick={analyze} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-oswald font-bold uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #FFE34D, #FFD700)",
              boxShadow: loading ? "none" : "0 0 24px rgba(255,215,0,0.4)",
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

          {/* Деньги на сегодня */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="px-4 py-2.5" style={{ background: "rgba(255,215,0,0.06)", borderBottom: "1px solid rgba(255,215,0,0.12)" }}>
              <div className="flex items-center gap-2">
                <Icon name="Banknote" size={13} style={{ color: "#FFD700" }} />
                <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,215,0,0.8)" }}>Деньги на сегодня</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { l: "Дебетовая карта", v: result.parsed.debit_balance, c: "rgba(255,255,255,0.7)" },
                { l: "Накопительный счёт", v: result.parsed.savings_balance, c: "rgba(255,255,255,0.7)" },
              ].map(({ l, v, c }) => v && (
                <div key={l} className="flex items-center justify-between">
                  <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</span>
                  <span className="font-roboto font-semibold text-sm" style={{ color: c }}>{v}</span>
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

          {/* Прибыль бизнеса */}
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
                  <span className="font-roboto font-semibold text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>{result.parsed.profit_period}</span>
                </div>
              )}
            </div>
          </div>

          {/* Кассовый разрыв */}
          {(result.parsed.days_runway || result.parsed.safety_level) && (
            <div className="rounded-xl overflow-hidden" style={{
              border: `1px solid ${safetyStyle?.border || "rgba(255,255,255,0.1)"}`,
            }}>
              <div className="px-4 py-2.5" style={{ background: safetyStyle?.bg || "rgba(255,255,255,0.04)", borderBottom: `1px solid ${safetyStyle?.border || "rgba(255,255,255,0.08)"}` }}>
                <div className="flex items-center gap-2">
                  <Icon name="AlertTriangle" size={13} style={{ color: safetyStyle?.text || "white" }} />
                  <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: safetyStyle?.text || "rgba(255,255,255,0.6)" }}>Риск кассового разрыва</span>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2">
                {result.parsed.days_runway && (
                  <div className="flex items-center justify-between">
                    <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Денег хватит на</span>
                    <span className="font-roboto font-bold text-sm" style={{ color: safetyStyle?.text || "white" }}>{result.parsed.days_runway}</span>
                  </div>
                )}
                {result.parsed.safety_level && (
                  <div className="flex items-center justify-between">
                    <span className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Порог безопасности</span>
                    <span className="font-roboto font-bold text-sm px-3 py-1 rounded-lg" style={{
                      background: safetyStyle?.bg,
                      color: safetyStyle?.text,
                      border: `1px solid ${safetyStyle?.border}`,
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

          {/* Кнопки действий */}
          <div className="flex gap-2">
            <button onClick={copyReport}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              <Icon name="Copy" size={14} /> Скопировать
            </button>
            <button onClick={() => setShowRaw(v => !v)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-roboto text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              <Icon name="FileText" size={14} /> {showRaw ? "Скрыть" : "Полный текст"}
            </button>
          </div>

          {/* Полный текст */}
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
