import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import FinancePeriodPicker, { type FinancePeriod } from "./FinancePeriodPicker";
import KpiCard from "./KpiCard";
import FinanceHeatmap from "./FinanceHeatmap";
import FinanceSummaryTable from "./FinanceSummaryTable";
import FinanceParamsModal from "./FinanceParamsModal";
import {
  RevenueProfitChart, StructureChart, CostsBreakdownChart,
  ByDirectionChart, MarginsChart,
} from "./FinanceCharts";
import { FINANCE_URL, fmtMoneyFull, fmtPct, type FinanceResponse } from "./types";

export default function FinanceTab({ token }: { token: string }) {
  const [period, setPeriod] = useState<FinancePeriod>("d30");
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [compare, setCompare] = useState(true);
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const customQS = period === "custom" && customRange
        ? `&date_from=${customRange.from}&date_to=${customRange.to}` : "";
      const url = `${FINANCE_URL}?action=analytics&period=${period}${customQS}&compare=${compare ? "1" : "0"}`;
      const r = await fetch(url, { headers: { "X-Employee-Token": token } });
      const d = await r.json();
      if (d.error) setError(d.error);
      else setData(d);
    } catch (e) {
      setError("Не удалось загрузить финансовую аналитику");
      console.error("[FinanceTab]", e);
    } finally { setLoading(false); }
  }, [period, customRange, compare, token]);

  useEffect(() => { load(); }, [load]);

  const m = data?.metrics;
  const p = data?.compare?.metrics;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Icon name="LineChart" size={16} className="text-[#FFD700]" />
          <div className="text-sm font-bold text-white">Финансовая аналитика</div>
          {data && (
            <span className="text-[10px] text-white/40 tabular-nums">
              {data.date_from} — {data.date_to} ({m?.period_days} дн.)
            </span>
          )}
        </div>
        <button
          onClick={() => setParamsOpen(true)}
          className="text-[11px] px-2.5 py-1.5 rounded-full bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] hover:border-[#FFD700]/40 inline-flex items-center gap-1.5 transition"
        >
          <Icon name="Settings2" size={12} />
          Параметры ROA/ROE/WACC
        </button>
      </div>

      <FinancePeriodPicker
        period={period}
        setPeriod={setPeriod}
        customRange={customRange}
        setCustomRange={setCustomRange}
        compare={compare}
        setCompare={setCompare}
        onRefresh={load}
        loading={loading}
      />

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
          <Icon name="AlertCircle" size={14} />
          {error}
          <button onClick={load} className="ml-auto underline hover:text-white">Повторить</button>
        </div>
      )}

      {loading && !data && (
        <div className="flex flex-col items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Считаю финансы…</span>
        </div>
      )}

      {m && (
        <>
          {/* Главные KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <KpiCard label="Выручка" value={fmtMoneyFull(m.revenue)} accent="gold" big cur={m.revenue} prev={p?.revenue} />
            <KpiCard label="Валовая прибыль" value={fmtMoneyFull(m.gross_profit)} accent="emerald" big cur={m.gross_profit} prev={p?.gross_profit} hint={`Margin: ${fmtPct(m.gross_margin_pct)}`} />
            <KpiCard label="EBIT (опер. прибыль)" value={fmtMoneyFull(m.ebit)} accent="sky" big cur={m.ebit} prev={p?.ebit} hint={`Margin: ${fmtPct(m.operating_margin_pct)}`} />
            <KpiCard label="Чистая прибыль" value={fmtMoneyFull(m.net_profit)} accent={m.net_profit >= 0 ? "emerald" : "rose"} big cur={m.net_profit} prev={p?.net_profit} hint={`Margin: ${fmtPct(m.net_margin_pct)}`} />
          </div>

          {/* Второй ряд KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <KpiCard label="Себестоимость" value={fmtMoneyFull(m.cogs)} invertColor cur={m.cogs} prev={p?.cogs} accent="rose" />
            <KpiCard label="Опер. расходы" value={fmtMoneyFull(m.opex)} invertColor cur={m.opex} prev={p?.opex} accent="rose" />
            <KpiCard label="Маржинальная прибыль" value={fmtMoneyFull(m.contribution)} cur={m.contribution} prev={p?.contribution} accent="violet" hint={fmtPct(m.contribution_margin_pct)} />
            <KpiCard label="Точка безубыточности" value={fmtMoneyFull(m.bep_money)} invertColor cur={m.bep_money} prev={p?.bep_money} accent="sky" hint={`Запас: ${fmtPct(m.safety_margin_pct)}`} />
          </div>

          {/* Доходность */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <KpiCard label="ROA (годовая)" value={fmtPct(m.roa_pct)} cur={m.roa_pct} prev={p?.roa_pct} accent="emerald" />
            <KpiCard label="ROE (годовая)" value={fmtPct(m.roe_pct)} cur={m.roe_pct} prev={p?.roe_pct} accent="emerald" />
            <KpiCard label="ROIC" value={fmtPct(m.roic_pct)} cur={m.roic_pct} prev={p?.roic_pct} accent="violet" />
            <KpiCard label="WACC (ориентир)" value={fmtPct(m.wacc_pct)} cur={m.wacc_pct} prev={p?.wacc_pct} invertColor accent="sky" />
          </div>

          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <RevenueProfitChart daily={data.daily} />
            <ByDirectionChart daily={data.daily} />
            <StructureChart metrics={m} />
            <CostsBreakdownChart metrics={m} />
            <MarginsChart metrics={m} />
            <FinanceHeatmap daily={data.daily} />
          </div>

          {/* Доп. метрики */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <KpiCard label="Опер. рычаг (DOL)" value={m.dol.toFixed(2) + "x"} cur={m.dol} prev={p?.dol} accent="violet" hint="Чувствительность EBIT к выручке" />
            <KpiCard label="Покрытие пост. затрат" value={m.fixed_coverage.toFixed(2) + "x"} cur={m.fixed_coverage} prev={p?.fixed_coverage} accent="emerald" />
            <KpiCard label="Качество прибыли" value={m.quality_of_profit.toFixed(2) + "x"} cur={m.quality_of_profit} prev={p?.quality_of_profit} accent="sky" hint="EBIT / Чистая" />
            <KpiCard label="EPS (на акцию)" value={fmtMoneyFull(m.eps)} cur={m.eps} prev={p?.eps} accent="gold" />
            <KpiCard label="Реинвестирование" value={fmtPct(m.retention_ratio_pct)} cur={m.retention_ratio_pct} prev={p?.retention_ratio_pct} accent="emerald" />
            <KpiCard label="Операц. цикл" value={m.operating_cycle.toFixed(1) + " дн"} invertColor cur={m.operating_cycle} prev={p?.operating_cycle} accent="sky" />
            <KpiCard label="Финанс. цикл" value={m.financial_cycle.toFixed(1) + " дн"} invertColor cur={m.financial_cycle} prev={p?.financial_cycle} accent="violet" />
            <KpiCard label="Рентаб. затрат" value={fmtPct(m.cost_profitability_pct)} cur={m.cost_profitability_pct} prev={p?.cost_profitability_pct} accent="emerald" />
          </div>

          <FinanceSummaryTable metrics={m} prev={p} daily={data.daily} />
        </>
      )}

      <FinanceParamsModal
        token={token}
        open={paramsOpen}
        onClose={() => setParamsOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
