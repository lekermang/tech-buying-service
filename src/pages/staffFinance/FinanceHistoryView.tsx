/**
 * Экран сравнения периодов — наложение до 4 отчётов.
 * Показывает: расходы по категориям, доходы, деньги, прибыль — всё в одном экране.
 */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { HistoryEntry, ExpCat } from "./useFinanceHistory";
import { parseAmount } from "./useFinanceHistory";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

// Цвета периодов (для наложения)
const PERIOD_COLORS = [
  { line: "#FFD700", bg: "rgba(255,215,0,0.15)",  border: "rgba(255,215,0,0.4)",  text: "#FFD700"  },
  { line: "#60a5fa", bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.4)", text: "#60a5fa"  },
  { line: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.4)", text: "#34d399"  },
  { line: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", text: "#f87171" },
];

const SAFE_COLOR: Record<string, string> = {
  green: "#34d399", yellow: "#FFD700", red: "#f87171",
};

// Все уникальные категории расходов из всех выбранных отчётов
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

// Многострочный бар с накладываемыми периодами
function OverlayBar({ values, max, colors }: {
  values: number[]; max: number; colors: typeof PERIOD_COLORS;
}) {
  return (
    <div className="relative h-5 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      {values.map((v, i) => {
        const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
        return (
          <div key={i}
            className="absolute top-0 left-0 h-full rounded-lg transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: colors[i]?.line || "#FFD700",
              opacity: 0.35 + (values.length - i) * 0.15,
              zIndex: values.length - i,
            }}
          />
        );
      })}
      {/* Показываем значения поверх */}
      {values.map((v, i) => {
        const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
        if (pct < 8 || v === 0) return null;
        return (
          <div key={i}
            className="absolute top-0 left-0 h-full flex items-center pl-2"
            style={{ width: `${pct}%`, zIndex: 10 + i }}
          >
            <span className="font-roboto font-bold text-[10px] text-white/90 truncate"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              {fmt(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Дельта между последним и предпоследним значением
function Delta({ curr, prev }: { curr: number; prev: number | null }) {
  if (prev === null || prev === 0) return null;
  const delta = curr - prev;
  const pct = Math.abs(Math.round((delta / prev) * 100));
  const up = delta > 0;
  return (
    <span className="font-roboto text-[10px] font-semibold ml-1" style={{ color: up ? "#f87171" : "#34d399" }}>
      {up ? "▲" : "▼"}{pct}%
    </span>
  );
}

interface Props {
  history: HistoryEntry[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function FinanceHistoryView({ history, onRemove, onClear }: Props) {
  // Выбранные периоды для сравнения (до 4)
  const [selected, setSelected] = useState<string[]>(() =>
    history.slice(0, 4).map(e => e.id)
  );
  const [section, setSection] = useState<"overview" | "expenses" | "income" | "problems">("overview");

  const active = history.filter(e => selected.includes(e.id));

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
          background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)",
        }}>
          <Icon name="History" size={24} style={{ color: "rgba(255,215,0,0.5)" }} />
        </div>
        <div className="font-oswald font-bold text-base uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
          История пуста
        </div>
        <div className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
          Сформируйте первый отчёт — он сохранится автоматически.
          Загружайте выписки за разные периоды для сравнения.
        </div>
      </div>
    );
  }

  // ── Метрики для overview ──────────────────────────────────────────────────
  const moneyValues    = active.map(e => parseAmount(e.result.parsed.total_money));
  const profitValues   = active.map(e => parseAmount(e.result.parsed.profit_period));
  const budgetValues   = active.map(e => parseAmount(e.result.parsed.budget_today));
  const maxMoney  = Math.max(...moneyValues, 1);
  const maxProfit = Math.max(...profitValues.map(Math.abs), 1);
  const maxBudget = Math.max(...budgetValues, 1);

  // ── Категории расходов ───────────────────────────────────────────────────
  const expCats = getAllExpCategories(active);
  const maxExp = Math.max(...expCats.map(cat =>
    Math.max(...active.map(e => getCatAmount(e, cat, "exp")))
  ), 1);

  // ── Категории доходов ────────────────────────────────────────────────────
  const incCats = getAllIncCategories(active);
  const maxInc = Math.max(...incCats.map(cat =>
    Math.max(...active.map(e => getCatAmount(e, cat, "inc")))
  ), 1);

  const SECTIONS = [
    { k: "overview", l: "Обзор", icon: "LayoutDashboard" },
    { k: "expenses", l: "Расходы", icon: "TrendingDown" },
    { k: "income",   l: "Доходы",  icon: "TrendingUp" },
    { k: "problems", l: "Проблемы", icon: "AlertTriangle" },
  ] as const;

  return (
    <div className="space-y-3">

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          История · {history.length} период{history.length > 4 ? "ов" : history.length > 1 ? "а" : ""}
        </div>
        <button onClick={onClear}
          className="font-roboto text-[10px] transition-colors"
          style={{ color: "rgba(248,113,113,0.5)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(248,113,113,0.5)")}
        >Очистить всё</button>
      </div>

      {/* Легенда периодов + выбор */}
      <div className="space-y-2">
        {history.map((entry, idx) => {
          const colorIdx = active.findIndex(e => e.id === entry.id);
          const c = colorIdx >= 0 ? PERIOD_COLORS[colorIdx] : null;
          const isActive = selected.includes(entry.id);
          return (
            <div key={entry.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer"
              style={{
                background: isActive && c ? c.bg : "rgba(255,255,255,0.03)",
                border: `1px solid ${isActive && c ? c.border : "rgba(255,255,255,0.07)"}`,
              }}
              onClick={() => toggleSelect(entry.id)}
            >
              {/* Цветная точка */}
              <div className="w-3 h-3 rounded-full shrink-0" style={{
                background: c ? c.line : "rgba(255,255,255,0.15)",
                boxShadow: c ? `0 0 8px ${c.line}` : "none",
              }} />
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm font-semibold" style={{ color: c ? c.text : "rgba(255,255,255,0.4)" }}>
                  {entry.period}
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {new Date(entry.saved_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                  {entry.result.parsed.total_money ? ` · ${entry.result.parsed.total_money}` : ""}
                  {entry.result.parsed.safety_level ? (
                    <span className="ml-1.5" style={{ color: SAFE_COLOR[entry.result.parsed.safety_level] }}>●</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {isActive && colorIdx >= 0 && (
                  <span className="font-roboto text-[9px] uppercase px-1.5 py-0.5 rounded-md" style={{
                    background: c!.bg, color: c!.text, border: `1px solid ${c!.border}`,
                  }}>#{colorIdx + 1}</span>
                )}
                <button onClick={e => { e.stopPropagation(); onRemove(entry.id); }}
                  className="w-5 h-5 flex items-center justify-center rounded-md transition-all"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={e2 => (e2.currentTarget.style.color = "#f87171")}
                  onMouseLeave={e2 => (e2.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                >
                  <Icon name="X" size={11} />
                </button>
              </div>
            </div>
          );
        })}
        {selected.length < 4 && history.length > selected.length && (
          <div className="font-roboto text-[11px] text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
            Нажмите на период чтобы добавить в сравнение (макс. 4)
          </div>
        )}
      </div>

      {active.length < 2 ? (
        <div className="px-4 py-8 rounded-xl text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)", border: "1px dashed rgba(255,255,255,0.1)" }}>
          Выберите минимум 2 периода для сравнения
        </div>
      ) : (
        <>
          {/* Переключатель разделов */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {SECTIONS.map(s => (
              <button key={s.k} onClick={() => setSection(s.k)}
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

              {/* Деньги */}
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
                {/* Наложение */}
                <div className="mt-2">
                  <div className="font-roboto text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Наложение
                  </div>
                  <OverlayBar values={moneyValues} max={maxMoney} colors={active.map((_, i) => PERIOD_COLORS[i])} />
                </div>
              </CompareBlock>

              {/* Прибыль за период */}
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

              {/* Бюджет на день */}
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

              {/* Светофоры */}
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
                  const maxV = Math.max(...vals, 1);
                  if (vals.every(v => v === 0)) return null;
                  return (
                    <div key={cat} className="mb-3">
                      <div className="font-roboto text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{cat}</div>
                      {/* Накладываем бары всех периодов */}
                      <OverlayBar values={vals} max={maxExp} colors={active.map((_, i) => PERIOD_COLORS[i])} />
                      {/* Значения под барами */}
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
                      {/* Прогресс максимального */}
                      <div className="h-px mt-2" style={{ background: "rgba(255,255,255,0.06)" }} />
                    </div>
                  );
                })}
              </CompareBlock>

              {/* Топ расходов — таблица сравнения */}
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

              {/* Главные проблемы */}
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

              {/* Советы по экономии */}
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

              {/* Действия */}
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
      )}
    </div>
  );
}

// ── Вспомогательные блоки ──────────────────────────────────────────────────

function CompareBlock({ title, icon, iconColor, children }: {
  title: string; icon: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,9,5,0.97)" }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Icon name={icon} size={13} style={{ color: iconColor }} />
        <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function CompareRow({ label, color, children }: {
  label: string; color: typeof PERIOD_COLORS[0]; children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color.line, boxShadow: `0 0 6px ${color.line}` }} />
        <span className="font-roboto text-[11px] uppercase tracking-wide" style={{ color: color.text }}>{label}</span>
      </div>
      {children}
    </div>
  );
}
