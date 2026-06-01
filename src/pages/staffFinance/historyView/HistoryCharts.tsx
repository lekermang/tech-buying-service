import type { HistoryEntry, ExpCat } from "../useFinanceHistory";
import { parseAmount } from "../useFinanceHistory";
import {
  fmt, PERIOD_COLORS, SAFE_COLOR,
  OverlayBar, Delta, CompareBlock, CompareRow,
} from "./HistoryPrimitives";
import Icon from "@/components/ui/icon";

function getAllExpCategories(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  entries.forEach(e => (e.result.parsed.expense_categories || []).forEach(c => set.add(c.name)));
  return Array.from(set);
}

function getAllIncCategories(entries: HistoryEntry[]): string[] {
  const set = new Set<string>();
  entries.forEach(e => (e.result.parsed.income_categories || []).forEach(c => set.add(c.name)));
  return Array.from(set);
}

function getCatAmount(entry: HistoryEntry, catName: string, type: "exp" | "inc"): number {
  const list = type === "exp"
    ? (entry.result.parsed.expense_categories || [])
    : (entry.result.parsed.income_categories || []);
  return (list.find((c: ExpCat) => c.name === catName) as ExpCat | undefined)?.amount || 0;
}

const SECTIONS = [
  { k: "overview", l: "Обзор", icon: "LayoutDashboard" },
  { k: "expenses", l: "Расходы", icon: "TrendingDown" },
  { k: "income",   l: "Доходы",  icon: "TrendingUp" },
  { k: "problems", l: "Проблемы", icon: "AlertTriangle" },
] as const;

type Section = typeof SECTIONS[number]["k"];

interface Props {
  active: HistoryEntry[];
  section: Section;
  onSection: (s: Section) => void;
}

export default function HistoryCharts({ active, section, onSection }: Props) {
  const moneyValues  = active.map(e => parseAmount(e.result.parsed.total_money));
  const profitValues = active.map(e => parseAmount(e.result.parsed.profit_period));
  const budgetValues = active.map(e => parseAmount(e.result.parsed.budget_today));
  const maxMoney  = Math.max(...moneyValues, 1);
  const maxProfit = Math.max(...profitValues.map(Math.abs), 1);
  const maxBudget = Math.max(...budgetValues, 1);

  const expCats = getAllExpCategories(active);
  const maxExp = Math.max(...expCats.map(cat =>
    Math.max(...active.map(e => getCatAmount(e, cat, "exp")))
  ), 1);

  const incCats = getAllIncCategories(active);
  const maxInc = Math.max(...incCats.map(cat =>
    Math.max(...active.map(e => getCatAmount(e, cat, "inc")))
  ), 1);

  void maxProfit;

  return (
    <>
      {/* Переключатель разделов */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {SECTIONS.map(s => (
          <button key={s.k} onClick={() => onSection(s.k)}
            className="flex flex-col items-center gap-0.5 py-1.5 rounded-lg transition-all"
            style={{
              background: section === s.k ? "rgba(255,215,0,0.15)" : "transparent",
              color: section === s.k ? "#FFD700" : "rgba(255,255,255,0.4)",
              border: section === s.k ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
            }}
          >
            <Icon name={s.icon} size={13} />
            <span className="font-roboto text-[9px] uppercase tracking-wide">{s.l}</span>
          </button>
        ))}
      </div>

      {/* ── ОБЗОР ── */}
      {section === "overview" && (
        <div className="space-y-3">
          <CompareBlock title="Общая сумма денег" icon="Banknote" iconColor="#FFD700">
            {active.map((e, i) => (
              <CompareRow key={e.id} label={e.period} color={PERIOD_COLORS[i]}>
                <OverlayBar values={[moneyValues[i]]} max={maxMoney} colors={[PERIOD_COLORS[i]]} />
                <div className="flex items-center mt-1">
                  <span className="font-oswald font-bold text-sm" style={{ color: PERIOD_COLORS[i].text }}>
                    {e.result.parsed.total_money || "—"}
                  </span>
                  {i > 0 && <Delta curr={moneyValues[i]} prev={moneyValues[i - 1]} />}
                </div>
              </CompareRow>
            ))}
            <div className="mt-2">
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Наложение</div>
              <OverlayBar values={moneyValues} max={maxMoney} colors={active.map((_, i) => PERIOD_COLORS[i])} />
            </div>
          </CompareBlock>

          <CompareBlock title="Прибыль за период" icon="TrendingUp" iconColor="#34d399">
            {active.map((e, i) => {
              const v = profitValues[i];
              const pos = v >= 0;
              return (
                <CompareRow key={e.id} label={e.period} color={PERIOD_COLORS[i]}>
                  <div className="flex items-center gap-2">
                    <span className="font-oswald font-bold text-base" style={{ color: pos ? "#34d399" : "#f87171" }}>
                      {pos ? "+" : ""}{fmt(v)} ₽
                    </span>
                    {i > 0 && <Delta curr={v} prev={profitValues[i - 1]} />}
                  </div>
                </CompareRow>
              );
            })}
          </CompareBlock>

          <CompareBlock title="Бюджет на день (рекомендованный)" icon="Wallet" iconColor="#FFD700">
            {active.map((e, i) => (
              <CompareRow key={e.id} label={e.period} color={PERIOD_COLORS[i]}>
                <OverlayBar values={[budgetValues[i]]} max={maxBudget} colors={[PERIOD_COLORS[i]]} />
                <div className="flex items-center mt-1">
                  <span className="font-oswald font-bold text-sm" style={{ color: PERIOD_COLORS[i].text }}>
                    {e.result.parsed.budget_today ? `${fmt(budgetValues[i])} ₽` : "—"}
                  </span>
                  {i > 0 && <Delta curr={budgetValues[i]} prev={budgetValues[i - 1]} />}
                </div>
              </CompareRow>
            ))}
            <div className="mt-2">
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>Наложение</div>
              <OverlayBar values={budgetValues} max={maxBudget} colors={active.map((_, i) => PERIOD_COLORS[i])} />
            </div>
          </CompareBlock>

          <CompareBlock title="Порог безопасности" icon="Shield" iconColor="#60a5fa">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {active.map((e, i) => {
                const sl = e.result.parsed.safety_level;
                const safeC = sl ? SAFE_COLOR[sl] : "rgba(255,255,255,0.3)";
                const safeL = sl === "green" ? "Зелёный" : sl === "yellow" ? "Жёлтый" : sl === "red" ? "Красный" : "—";
                return (
                  <div key={e.id} className="rounded-xl p-3 text-center" style={{
                    background: `${safeC}12`,
                    border: `1px solid ${safeC}35`,
                  }}>
                    <div className="font-roboto text-[9px] uppercase tracking-wider mb-1" style={{ color: PERIOD_COLORS[i].text }}>{e.period}</div>
                    <div className="font-oswald font-bold text-sm" style={{ color: safeC }}>{safeL}</div>
                    {e.result.parsed.days_runway && (
                      <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{e.result.parsed.days_runway}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CompareBlock>
        </div>
      )}

      {/* ── РАСХОДЫ ── */}
      {section === "expenses" && (
        <div className="space-y-3">
          <CompareBlock title="Расходы по категориям" icon="PieChart" iconColor="#f87171">
            {expCats.map(cat => {
              const vals = active.map(e => getCatAmount(e, cat, "exp"));
              if (vals.every(v => v === 0)) return null;
              return (
                <div key={cat} className="mb-3">
                  <div className="font-roboto text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{cat}</div>
                  <OverlayBar values={vals} max={maxExp} colors={active.map((_, i) => PERIOD_COLORS[i])} />
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {active.map((e, i) => {
                      const v = vals[i];
                      if (!v) return null;
                      return (
                        <span key={e.id} className="font-roboto text-[10px] font-semibold" style={{ color: PERIOD_COLORS[i].text }}>
                          {e.period}: {fmt(v)} ₽
                          {i > 0 && vals[i - 1] > 0 && (
                            <Delta curr={v} prev={vals[i - 1]} />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <div className="h-px mt-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              );
            })}
          </CompareBlock>

          <CompareBlock title="Крупные расходы по периодам" icon="Receipt" iconColor="#fb923c">
            {active.map((e, i) => {
              const tops = e.result.parsed.top_expenses || [];
              if (!tops.length) return null;
              return (
                <div key={e.id} className="mb-3">
                  <div className="font-roboto text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: PERIOD_COLORS[i].line }} />
                    <span style={{ color: PERIOD_COLORS[i].text }}>{e.period}</span>
                  </div>
                  {tops.map((t, ti) => (
                    <div key={ti} className="flex items-center gap-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="font-roboto text-[10px] w-8 shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>{t.date}</span>
                      <span className="flex-1 font-roboto text-xs truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{t.desc}</span>
                      <span className="font-oswald font-bold text-xs shrink-0" style={{ color: "#fb923c" }}>−{fmt(t.amount)} ₽</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </CompareBlock>
        </div>
      )}

      {/* ── ДОХОДЫ ── */}
      {section === "income" && (
        <div className="space-y-3">
          <CompareBlock title="Доходы по категориям" icon="ArrowDownLeft" iconColor="#34d399">
            {incCats.map(cat => {
              const vals = active.map(e => getCatAmount(e, cat, "inc"));
              if (vals.every(v => v === 0)) return null;
              return (
                <div key={cat} className="mb-3">
                  <div className="font-roboto text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{cat}</div>
                  <OverlayBar values={vals} max={maxInc} colors={active.map((_, i) => PERIOD_COLORS[i])} />
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {active.map((e, i) => {
                      const v = vals[i];
                      if (!v) return null;
                      return (
                        <span key={e.id} className="font-roboto text-[10px] font-semibold" style={{ color: PERIOD_COLORS[i].text }}>
                          {e.period}: {fmt(v)} ₽
                          {i > 0 && vals[i - 1] > 0 && <Delta curr={v} prev={vals[i - 1]} />}
                        </span>
                      );
                    })}
                  </div>
                  <div className="h-px mt-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              );
            })}
          </CompareBlock>
        </div>
      )}

      {/* ── ПРОБЛЕМЫ И СОВЕТЫ ── */}
      {section === "problems" && (
        <div className="space-y-3">
          <CompareBlock title="Главная проблема периода" icon="Flame" iconColor="#f87171">
            {active.map((e, i) => {
              const prob = e.result.parsed.main_problem;
              return (
                <div key={e.id} className="flex items-start gap-2.5 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: PERIOD_COLORS[i].line, boxShadow: `0 0 6px ${PERIOD_COLORS[i].line}` }} />
                  <div className="flex-1">
                    <div className="font-roboto text-[10px] uppercase tracking-wide mb-0.5" style={{ color: PERIOD_COLORS[i].text }}>{e.period}</div>
                    <div className="font-roboto text-sm" style={{ color: prob ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                      {prob || "Проблем не выявлено"}
                    </div>
                  </div>
                </div>
              );
            })}
          </CompareBlock>

          <CompareBlock title="Где сэкономить" icon="Scissors" iconColor="#60a5fa">
            {active.map((e, i) => {
              const tips = e.result.parsed.savings_tips || [];
              return (
                <div key={e.id} className="mb-3">
                  <div className="font-roboto text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: PERIOD_COLORS[i].line }} />
                    <span style={{ color: PERIOD_COLORS[i].text }}>{e.period}</span>
                  </div>
                  {tips.length > 0 ? tips.map((tip, ti) => (
                    <div key={ti} className="flex items-start gap-2 py-1">
                      <span className="font-roboto text-[10px] w-4 shrink-0 font-bold" style={{ color: PERIOD_COLORS[i].text }}>{ti + 1}.</span>
                      <span className="font-roboto text-xs leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>{tip}</span>
                    </div>
                  )) : (
                    <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Нет данных</span>
                  )}
                </div>
              );
            })}
          </CompareBlock>

          <CompareBlock title="Рекомендованные действия" icon="ListChecks" iconColor="#a78bfa">
            {active.map((e, i) => {
              const acts = e.result.parsed.actions || [];
              return (
                <div key={e.id} className="mb-3">
                  <div className="font-roboto text-[10px] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: PERIOD_COLORS[i].line }} />
                    <span style={{ color: PERIOD_COLORS[i].text }}>{e.period}</span>
                  </div>
                  {acts.map((a, ai) => (
                    <div key={ai} className="flex items-start gap-2 py-1">
                      <span className="font-roboto text-[10px] w-4 shrink-0 font-bold" style={{ color: "#a78bfa" }}>{ai + 1}.</span>
                      <span className="font-roboto text-xs leading-snug" style={{ color: "rgba(255,255,255,0.6)" }}>{a}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </CompareBlock>
        </div>
      )}
    </>
  );
}
