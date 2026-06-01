import Icon from "@/components/ui/icon";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

type ExpCat  = { name: string; amount: number; percent: number; trend?: string; comment?: string };
type IncCat  = { name: string; amount: number; percent: number };
type TopExp  = { date: string; desc: string; amount: number };

type Parsed = {
  debit_balance: string | null; savings_balance: string | null;
  total_money: string | null; profit_total: string | null; profit_period: string | null;
  days_runway: string | null; safety_level: "green" | "yellow" | "red" | null;
  main_problem: string | null; budget_today: string | null; budget_today_explain: string | null;
  actions: string[]; expense_categories: ExpCat[]; income_categories: IncCat[];
  top_expenses: TopExp[]; savings_tips: string[]; cash_flow_summary: string | null;
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

const SAFE = {
  green:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.3)",  text: "#34d399", label: "Зелёный ✓" },
  yellow: { bg: "rgba(255,215,0,0.1)",   border: "rgba(255,215,0,0.3)",   text: "#FFD700", label: "Жёлтый ⚠" },
  red:    { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.3)", text: "#f87171", label: "Красный ✗" },
};

const CAT_COLORS = ["#FFD700","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c","#e879f9","#38bdf8"];
const INC_COLORS = ["#34d399","#60a5fa","#a78bfa","#FFD700","#fb923c"];
const TREND_ICON: Record<string, string> = { up: "TrendingUp", down: "TrendingDown", stable: "Minus" };
const TREND_COLOR: Record<string, string> = { up: "#f87171", down: "#34d399", stable: "#FFD700" };

interface Props {
  result: ReportResult;
  copied: boolean;
  onCopy: () => void;
}

export default function FinanceReportView({ result, copied, onCopy }: Props) {
  const p = result.parsed;
  const safeStyle = p.safety_level ? SAFE[p.safety_level] : null;

  return (
    <div className="space-y-3">
      {/* Бюджет на сегодня */}
      {p.budget_today && (
        <div className="rounded-xl overflow-hidden" style={{
          border: "1px solid rgba(255,215,0,0.25)",
          background: "linear-gradient(145deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03))",
        }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,215,0,0.12)" }}>
            <Icon name="Wallet" size={14} style={{ color: "#FFD700" }} />
            <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,215,0,0.8)" }}>
              Бюджет на сегодня
            </span>
          </div>
          <div className="px-4 py-3">
            <div className="font-oswald font-black text-3xl mb-1" style={{ color: "#FFD700" }}>
              {isNaN(Number(String(p.budget_today).replace(/\s/g, "").replace(",",".")))
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
      <button onClick={onCopy}
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
  );
}
