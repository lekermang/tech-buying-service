import { Fragment } from "react";
import Icon from "@/components/ui/icon";
import Sparkline from "./Sparkline";
import { delta, fmtMoneyFull, fmtPct } from "./types";
import type { FinanceDay, FinanceMetrics } from "./types";

type Row = {
  group: string;
  label: string;
  fmt: "money" | "pct" | "x" | "days";
  cur: number;
  prev?: number;
  spark?: number[];
  invert?: boolean;
  hint?: string;
};

const formatVal = (v: number, type: Row["fmt"]) => {
  if (!isFinite(v)) return "—";
  if (type === "money") return fmtMoneyFull(v);
  if (type === "pct") return fmtPct(v);
  if (type === "x") return v.toFixed(2) + "x";
  if (type === "days") return v.toFixed(1) + " дн";
  return String(v);
};

export default function FinanceSummaryTable({
  metrics, prev, daily,
}: {
  metrics: FinanceMetrics;
  prev?: FinanceMetrics;
  daily: FinanceDay[];
}) {
  const rev = daily.map(d => d.revenue);
  const prof = daily.map(d => d.profit);
  const gross = daily.map(d => d.gross);
  const cogs = daily.map(d => d.cogs);

  const rows: Row[] = [
    { group: "P&L", label: "1. Выручка (нетто)", fmt: "money", cur: metrics.revenue, prev: prev?.revenue, spark: rev },
    { group: "P&L", label: "2. Себестоимость (COGS)", fmt: "money", cur: metrics.cogs, prev: prev?.cogs, spark: cogs, invert: true },
    { group: "P&L", label: "3. Валовая прибыль", fmt: "money", cur: metrics.gross_profit, prev: prev?.gross_profit, spark: gross },
    { group: "P&L", label: "Зарплата мастеров (прямые)", fmt: "money", cur: metrics.labor_direct, prev: prev?.labor_direct, invert: true },
    { group: "P&L", label: "4. Операционные расходы", fmt: "money", cur: metrics.opex, prev: prev?.opex, invert: true },
    { group: "P&L", label: "5. Прибыль от продаж (EBIT)", fmt: "money", cur: metrics.ebit, prev: prev?.ebit, spark: prof },
    { group: "P&L", label: "6.1 Проценты к получению", fmt: "money", cur: metrics.interest_received, prev: prev?.interest_received },
    { group: "P&L", label: "6.2 Проценты к уплате", fmt: "money", cur: metrics.interest_paid, prev: prev?.interest_paid, invert: true },
    { group: "P&L", label: "7. Прибыль до налогов (EBT)", fmt: "money", cur: metrics.ebt, prev: prev?.ebt },
    { group: "P&L", label: "Налог", fmt: "money", cur: metrics.tax, prev: prev?.tax, invert: true },
    { group: "P&L", label: "8. Чистая прибыль", fmt: "money", cur: metrics.net_profit, prev: prev?.net_profit, spark: prof },

    { group: "Маржи", label: "Gross Margin", fmt: "pct", cur: metrics.gross_margin_pct, prev: prev?.gross_margin_pct },
    { group: "Маржи", label: "Operating Margin (EBIT)", fmt: "pct", cur: metrics.operating_margin_pct, prev: prev?.operating_margin_pct },
    { group: "Маржи", label: "Net Margin", fmt: "pct", cur: metrics.net_margin_pct, prev: prev?.net_margin_pct },
    { group: "Маржи", label: "Маржинальность (Contribution)", fmt: "pct", cur: metrics.contribution_margin_pct, prev: prev?.contribution_margin_pct },
    { group: "Маржи", label: "Рентабельность затрат", fmt: "pct", cur: metrics.cost_profitability_pct, prev: prev?.cost_profitability_pct },

    { group: "БЕЗ/Рычаг", label: "9. Маржинальная прибыль", fmt: "money", cur: metrics.contribution, prev: prev?.contribution },
    { group: "БЕЗ/Рычаг", label: "10. Постоянные затраты", fmt: "money", cur: metrics.fixed_costs, prev: prev?.fixed_costs, invert: true },
    { group: "БЕЗ/Рычаг", label: "11. Точка безубыточности", fmt: "money", cur: metrics.bep_money, prev: prev?.bep_money, invert: true },
    { group: "БЕЗ/Рычаг", label: "12. Запас фин. прочности", fmt: "pct", cur: metrics.safety_margin_pct, prev: prev?.safety_margin_pct },
    { group: "БЕЗ/Рычаг", label: "Покрытие постоянных затрат", fmt: "x", cur: metrics.fixed_coverage, prev: prev?.fixed_coverage },
    { group: "БЕЗ/Рычаг", label: "Операционный рычаг (DOL)", fmt: "x", cur: metrics.dol, prev: prev?.dol },

    { group: "Доходность", label: "ROA (рентаб. активов)", fmt: "pct", cur: metrics.roa_pct, prev: prev?.roa_pct, hint: "годовая" },
    { group: "Доходность", label: "ROE (рентаб. капитала)", fmt: "pct", cur: metrics.roe_pct, prev: prev?.roe_pct, hint: "годовая" },
    { group: "Доходность", label: "ROIC", fmt: "pct", cur: metrics.roic_pct, prev: prev?.roic_pct, hint: "годовая" },
    { group: "Доходность", label: "WACC (ориентир)", fmt: "pct", cur: metrics.wacc_pct, prev: prev?.wacc_pct },
    { group: "Доходность", label: "EPS (на акцию)", fmt: "money", cur: metrics.eps, prev: prev?.eps },
    { group: "Доходность", label: "Коэф. реинвестирования", fmt: "pct", cur: metrics.retention_ratio_pct, prev: prev?.retention_ratio_pct },
    { group: "Доходность", label: "Качество прибыли (EBIT/Net)", fmt: "x", cur: metrics.quality_of_profit, prev: prev?.quality_of_profit },

    { group: "Циклы", label: "Запасы, дн", fmt: "days", cur: metrics.inventory_days, prev: prev?.inventory_days, invert: true },
    { group: "Циклы", label: "Дебиторка, дн", fmt: "days", cur: metrics.receivables_days, prev: prev?.receivables_days, invert: true },
    { group: "Циклы", label: "Кредиторка, дн", fmt: "days", cur: metrics.payables_days, prev: prev?.payables_days },
    { group: "Циклы", label: "Операционный цикл", fmt: "days", cur: metrics.operating_cycle, prev: prev?.operating_cycle, invert: true },
    { group: "Циклы", label: "Финансовый цикл", fmt: "days", cur: metrics.financial_cycle, prev: prev?.financial_cycle, invert: true },
  ];

  const groups = Array.from(new Set(rows.map(r => r.group)));

  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-[#1F1F1F] flex items-center gap-2">
        <Icon name="Table" size={14} className="text-[#FFD700]" />
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Сводная таблица показателей</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-[10px] uppercase text-white/40 bg-[#0A0A0A]">
            <tr>
              <th className="text-left px-3 py-2 font-normal">Показатель</th>
              <th className="text-right px-2 py-2 font-normal">Текущий</th>
              <th className="text-right px-2 py-2 font-normal">Было</th>
              <th className="text-right px-2 py-2 font-normal">Δ</th>
              <th className="text-right px-3 py-2 font-normal">Тренд</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <Fragment key={g}>
                <tr className="bg-[#0A0A0A] border-y border-[#1F1F1F]">
                  <td colSpan={5} className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#FFD700] font-bold">{g}</td>
                </tr>
                {rows.filter(r => r.group === g).map((r, idx) => {
                  const d = r.prev !== undefined ? delta(r.cur, r.prev) : null;
                  const positive = d !== null ? (r.invert ? d < 0 : d > 0) : null;
                  return (
                    <tr key={`${g}-${idx}`} className="border-b border-[#1F1F1F]/50 hover:bg-[#FFD700]/5">
                      <td className="px-3 py-1.5 text-white/85">
                        {r.label}
                        {r.hint && <span className="text-white/30 text-[10px] ml-1">({r.hint})</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-white font-medium">{formatVal(r.cur, r.fmt)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-white/45">{r.prev !== undefined ? formatVal(r.prev, r.fmt) : "—"}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">
                        {d !== null ? (
                          <span className={`inline-flex items-center gap-0.5 ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                            <Icon name={positive ? "TrendingUp" : "TrendingDown"} size={10} />
                            {d > 0 ? "+" : ""}{d.toFixed(1)}%
                          </span>
                        ) : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {r.spark && r.spark.length > 1 ? (
                          <Sparkline data={r.spark} color="auto" width={70} height={20} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}