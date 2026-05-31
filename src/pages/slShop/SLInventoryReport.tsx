import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt } from "./types";

// ─── Типы ────────────────────────────────────────────────────────────────────

type Totals = {
  started_at: string | null;
  total_items: number;
  in_stock_count: number;
  sold_count: number;
  returned_count: number;
  total_invested: number;
  stock_value_buy: number;
  stock_value_sell: number;
  total_revenue: number;
  total_cogs: number;
  total_profit: number;
  roi: number;
};

type MonthBuy  = { month: string; bought_count: number; bought_sum: number };
type MonthSell = { month: string; sold_count: number; revenue: number; cogs: number; profit: number };
type DayBuy    = { day: string; bought_count: number; bought_sum: number };
type DaySell   = { day: string; sold_count: number; revenue: number; cogs: number; profit: number };
type MonthBal  = { month: string; stock_value_end: number; stock_count_end: number };
type CatRow    = { category: string; count: number; buy_sum: number; sell_sum: number; avg_buy: number };

type ReportData = {
  totals: Totals;
  by_month_buy: MonthBuy[];
  by_month_sell: MonthSell[];
  by_day_buy: DayBuy[];
  by_day_sell: DaySell[];
  monthly_balance: MonthBal[];
  by_category: CatRow[];
};

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(15,12,8,0.95)" }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-all"
        style={{ background: open ? "rgba(255,215,0,0.04)" : "transparent" }}
      >
        <Icon name={icon} size={14} style={{ color: "rgba(255,215,0,0.7)" }} />
        <span className="flex-1 font-roboto text-xs uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.55)" }}>{title}</span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    gold:    { bg: "rgba(255,215,0,0.08)",   border: "rgba(255,215,0,0.25)",   text: "#FFD700" },
    green:   { bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)",  text: "#34d399" },
    red:     { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", text: "#f87171" },
    blue:    { bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.25)",  text: "#60a5fa" },
    purple:  { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", text: "#a78bfa" },
    orange:  { bg: "rgba(251,146,60,0.08)",  border: "rgba(251,146,60,0.25)",  text: "#fb923c" },
  };
  const c = colors[color] || colors.gold;
  return (
    <div className="rounded-xl p-3" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon name={icon} size={12} style={{ color: c.text }} />
        <span className="font-roboto text-[10px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
      </div>
      <div className="font-oswald font-black text-xl leading-none" style={{ color: c.text }}>{value}</div>
      {sub && <div className="font-roboto text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ value, max, color = "#FFD700" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// Форматирование даты
const fmtMonth = (m: string) => {
  const [y, mo] = m.split("-");
  const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  return `${months[parseInt(mo) - 1]} ${y}`;
};
const fmtDay = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });

// ─── Основной компонент ───────────────────────────────────────────────────────

type View = "month" | "day";

export default function SLInventoryReport({ token }: { token: string }) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("month");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<ReportData>(token, "inventory_report");
    if (r.ok && r.data) setData(r.data);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="py-16 text-center">
        <Icon name="Loader" size={28} className="animate-spin mx-auto mb-2" style={{ color: "rgba(255,215,0,0.4)" }} />
        <div className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Загружаю балансовый отчёт...</div>
      </div>
    );
  }

  if (!data) return null;

  const { totals, by_month_buy, by_month_sell, by_day_buy, by_day_sell, monthly_balance, by_category } = data;

  // Объединяем месяцы buy + sell + balance
  const allMonths = Array.from(new Set([
    ...by_month_buy.map(r => r.month),
    ...by_month_sell.map(r => r.month),
    ...monthly_balance.map(r => r.month),
  ])).sort();

  const buyMap  = Object.fromEntries(by_month_buy.map(r => [r.month, r]));
  const sellMap = Object.fromEntries(by_month_sell.map(r => [r.month, r]));
  const balMap  = Object.fromEntries(monthly_balance.map(r => [r.month, r]));

  // Объединяем дни
  const allDays = Array.from(new Set([
    ...by_day_buy.map(r => r.day),
    ...by_day_sell.map(r => r.day),
  ])).sort().reverse();
  const dayBuyMap  = Object.fromEntries(by_day_buy.map(r => [r.day, r]));
  const daySellMap = Object.fromEntries(by_day_sell.map(r => [r.day, r]));

  // Максимумы для баров
  const maxBuy   = Math.max(...allMonths.map(m => Number(buyMap[m]?.bought_sum || 0)), 1);
  const maxSell  = Math.max(...allMonths.map(m => Number(sellMap[m]?.revenue || 0)), 1);
  const maxBal   = Math.max(...monthly_balance.map(r => Number(r.stock_value_end || 0)), 1);
  const maxDayBuy  = Math.max(...by_day_buy.map(r => Number(r.bought_sum || 0)), 1);
  const maxDaySell = Math.max(...by_day_sell.map(r => Number(r.revenue || 0)), 1);
  const maxCat   = Math.max(...by_category.map(r => Number(r.buy_sum || 0)), 1);

  const startedDate = totals.started_at
    ? new Date(totals.started_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  // Прирост склада: текущий остаток vs предыдущий месяц
  const lastBal = monthly_balance[monthly_balance.length - 1];
  const prevBal = monthly_balance[monthly_balance.length - 2];
  const stockGrowth = lastBal && prevBal
    ? ((Number(lastBal.stock_value_end) - Number(prevBal.stock_value_end)) / Math.max(Number(prevBal.stock_value_end), 1)) * 100
    : null;

  return (
    <div className="space-y-3">

      {/* ── Кнопка обновить ── */}
      <div className="flex items-center justify-between">
        <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          Бизнес с {startedDate}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-roboto text-xs transition-all"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Icon name={loading ? "Loader2" : "RefreshCw"} size={12} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* ── Главные KPI ── */}
      <Section title="С начала бизнеса · Общий баланс" icon="Wallet">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <KpiCard label="Всего вложено" value={`${fmt(totals.total_invested)} ₽`}
            sub="инвестиции в товар" color="blue" icon="TrendingDown" />
          <KpiCard label="Товар на складе" value={`${fmt(totals.stock_value_buy)} ₽`}
            sub={`${totals.in_stock_count} поз. · себест.`} color="gold" icon="Package" />
          <KpiCard label="Выручка с продаж" value={`${fmt(totals.total_revenue)} ₽`}
            sub={`${totals.sold_count} шт продано`} color="green" icon="HandCoins" />
          <KpiCard label="Прибыль" value={`${fmt(totals.total_profit)} ₽`}
            sub={`маржа ${totals.total_cogs > 0 ? Math.round(totals.total_profit / totals.total_cogs * 100) : 0}%`}
            color="green" icon="TrendingUp" />
          <KpiCard label="ROI" value={`${totals.roi}%`}
            sub="прибыль / себест. продаж" color="purple" icon="Percent" />
          <KpiCard label="Потенциал склада" value={`${fmt(totals.stock_value_sell)} ₽`}
            sub={`если всё продать · ${stockGrowth !== null ? (stockGrowth >= 0 ? "+" : "") + stockGrowth.toFixed(1) + "% к пред. мес." : ""}`}
            color="orange" icon="Store" />
        </div>

        {/* Мини-сводка: вложено / возвращено / в обороте */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Вложено всего", v: fmt(totals.total_invested) + " ₽", hint: "investment", c: "#60a5fa" },
            { l: "Вычет (продажи)", v: fmt(totals.total_cogs) + " ₽", hint: "возврат инвест.", c: "#34d399" },
            { l: "В обороте", v: fmt(totals.stock_value_buy) + " ₽", hint: "на складе сейчас", c: "#FFD700" },
          ].map(({ l, v, hint, c }) => (
            <div key={l} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-oswald font-bold text-base" style={{ color: c }}>{v}</div>
              <div className="font-roboto text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</div>
              <div className="font-roboto text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>{hint}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Переключатель по месяцам / по дням ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {(["month", "day"] as View[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all"
            style={{
              background: view === v ? "rgba(255,215,0,0.15)" : "transparent",
              color: view === v ? "#FFD700" : "rgba(255,255,255,0.4)",
              border: view === v ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
            }}
          >
            {v === "month" ? "По месяцам" : "По дням (90 дн.)"}
          </button>
        ))}
      </div>

      {/* ── Таблица по месяцам ── */}
      {view === "month" && (
        <>
          <Section title="Закупки по месяцам · Инвестиции" icon="TrendingDown">
            <div className="space-y-2">
              {allMonths.map(m => {
                const b = buyMap[m];
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-roboto" style={{ color: "rgba(255,255,255,0.6)" }}>{fmtMonth(m)}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {b ? `${b.bought_count} шт` : "—"}
                        </span>
                        <span className="font-oswald font-bold text-sm" style={{ color: "#60a5fa" }}>
                          {b ? fmt(b.bought_sum) + " ₽" : "—"}
                        </span>
                      </div>
                    </div>
                    <MiniBar value={Number(b?.bought_sum || 0)} max={maxBuy} color="#60a5fa" />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Продажи по месяцам · Выручка и прибыль" icon="HandCoins">
            <div className="space-y-2">
              {allMonths.map(m => {
                const s = sellMap[m];
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-roboto" style={{ color: "rgba(255,255,255,0.6)" }}>{fmtMonth(m)}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {s ? `${s.sold_count} шт` : "—"}
                        </span>
                        <span className="font-roboto text-[11px]" style={{ color: "#34d399" }}>
                          {s ? `+${fmt(s.profit)} ₽` : ""}
                        </span>
                        <span className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                          {s ? fmt(s.revenue) + " ₽" : "—"}
                        </span>
                      </div>
                    </div>
                    <MiniBar value={Number(s?.revenue || 0)} max={maxSell} color="#FFD700" />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Остаток склада на конец месяца · ДДС" icon="BarChart3">
            <div className="space-y-2.5">
              {allMonths.map((m, i) => {
                const bal  = balMap[m];
                const prev = i > 0 ? balMap[allMonths[i - 1]] : null;
                const delta = bal && prev
                  ? Number(bal.stock_value_end) - Number(prev.stock_value_end)
                  : null;
                return (
                  <div key={m}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-roboto" style={{ color: "rgba(255,255,255,0.6)" }}>{fmtMonth(m)}</span>
                      <div className="flex items-center gap-3">
                        {delta !== null && (
                          <span className="font-roboto text-[11px]" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                            {delta >= 0 ? "+" : ""}{fmt(delta)} ₽
                          </span>
                        )}
                        <span className="font-roboto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {bal ? `${bal.stock_count_end} поз.` : "—"}
                        </span>
                        <span className="font-oswald font-bold text-sm" style={{ color: "#fb923c" }}>
                          {bal ? fmt(bal.stock_value_end) + " ₽" : "—"}
                        </span>
                      </div>
                    </div>
                    <MiniBar value={Number(bal?.stock_value_end || 0)} max={maxBal} color="#fb923c" />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 grid grid-cols-2 gap-2 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="font-oswald font-bold text-base" style={{ color: "#fb923c" }}>
                  {lastBal ? fmt(lastBal.stock_value_end) + " ₽" : "—"}
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Склад сейчас (себест.)
                </div>
              </div>
              <div>
                <div className="font-oswald font-bold text-base" style={{ color: stockGrowth !== null && stockGrowth >= 0 ? "#34d399" : "#f87171" }}>
                  {stockGrowth !== null ? (stockGrowth >= 0 ? "+" : "") + stockGrowth.toFixed(1) + "%" : "—"}
                </div>
                <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Прирост к прошлому месяцу
                </div>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* ── Таблица по дням ── */}
      {view === "day" && (
        <Section title="По дням · закупки и продажи (90 дн.)" icon="Calendar">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "rgba(255,255,255,0.35)" }}>
                  <th className="text-left py-2 font-roboto text-[10px] uppercase tracking-wider">День</th>
                  <th className="text-right font-roboto text-[10px] uppercase tracking-wider">Закуп. шт</th>
                  <th className="text-right font-roboto text-[10px] uppercase tracking-wider" style={{ color: "#60a5fa" }}>Вложено</th>
                  <th className="text-right font-roboto text-[10px] uppercase tracking-wider">Прод. шт</th>
                  <th className="text-right font-roboto text-[10px] uppercase tracking-wider" style={{ color: "#FFD700" }}>Выручка</th>
                  <th className="text-right font-roboto text-[10px] uppercase tracking-wider" style={{ color: "#34d399" }}>Прибыль</th>
                </tr>
              </thead>
              <tbody>
                {allDays.slice(0, 60).map(d => {
                  const b = dayBuyMap[d];
                  const s = daySellMap[d];
                  if (!b && !s) return null;
                  return (
                    <tr key={d} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-1.5 font-roboto" style={{ color: "rgba(255,255,255,0.55)" }}>{fmtDay(d)}</td>
                      <td className="text-right font-roboto" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {b ? b.bought_count : "—"}
                      </td>
                      <td className="text-right font-roboto font-semibold" style={{ color: "#60a5fa" }}>
                        {b ? fmt(b.bought_sum) + " ₽" : "—"}
                      </td>
                      <td className="text-right font-roboto" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {s ? s.sold_count : "—"}
                      </td>
                      <td className="text-right font-roboto font-semibold" style={{ color: "#FFD700" }}>
                        {s ? fmt(s.revenue) + " ₽" : "—"}
                      </td>
                      <td className="text-right font-roboto font-semibold" style={{ color: s && Number(s.profit) >= 0 ? "#34d399" : "#f87171" }}>
                        {s ? (Number(s.profit) >= 0 ? "+" : "") + fmt(s.profit) + " ₽" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Мини-визуализация: закупки */}
          <div className="mt-4">
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Вложения по дням (₽)
            </div>
            <div className="space-y-1">
              {[...by_day_buy].reverse().slice(0, 30).map(r => (
                <div key={r.day} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{fmtDay(r.day)}</span>
                  <div className="flex-1"><MiniBar value={Number(r.bought_sum)} max={maxDayBuy} color="#60a5fa" /></div>
                  <span className="w-20 text-right font-roboto text-[10px]" style={{ color: "#60a5fa" }}>{fmt(r.bought_sum)} ₽</span>
                </div>
              ))}
            </div>
          </div>

          {/* Мини-визуализация: продажи */}
          <div className="mt-4">
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
              Выручка по дням (₽)
            </div>
            <div className="space-y-1">
              {[...by_day_sell].reverse().slice(0, 30).map(r => (
                <div key={r.day} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{fmtDay(r.day)}</span>
                  <div className="flex-1"><MiniBar value={Number(r.revenue)} max={maxDaySell} color="#FFD700" /></div>
                  <span className="w-20 text-right font-roboto text-[10px]" style={{ color: "#FFD700" }}>{fmt(r.revenue)} ₽</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── По категориям · текущий склад ── */}
      <Section title="Структура склада по категориям" icon="Grid3x3">
        <div className="space-y-2.5">
          {by_category.map(c => (
            <div key={c.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-roboto truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{c.category}</span>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {c.count} шт · ср. {fmt(c.avg_buy)} ₽
                  </span>
                  <span className="font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                    {fmt(c.buy_sum)} ₽
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <div className="flex-1"><MiniBar value={Number(c.buy_sum)} max={maxCat} color="#FFD700" /></div>
              </div>
            </div>
          ))}
        </div>
        {/* Итого */}
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="font-roboto text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            Итого на складе: {totals.in_stock_count} позиций
          </span>
          <span className="font-oswald font-bold" style={{ color: "#FFD700" }}>
            {fmt(totals.stock_value_buy)} ₽
          </span>
        </div>
      </Section>

    </div>
  );
}
