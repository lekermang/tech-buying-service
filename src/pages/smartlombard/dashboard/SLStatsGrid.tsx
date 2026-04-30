import Icon from "@/components/ui/icon";
import { Stats, fmt } from "./SLDashboardTypes";

type Props = {
  error: string;
  stats: Stats | null;
  loading: boolean;
};

export function SLStatsGrid({ error, stats, loading }: Props) {
  return (
    <>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="font-oswald font-bold text-red-300 text-xs uppercase">Не удалось загрузить</div>
            <div className="font-roboto text-red-300/70 text-[11px] mt-1 break-words">{error}</div>
          </div>
        </div>
      )}

      {!error && stats && (
        <div className="grid grid-cols-2 gap-2">
          {/* ВЫДЕЛЕННАЯ карточка ПРОДАЖИ ТОВАРА */}
          <div className="col-span-2">
            <Card
              label="Продажи товара (Iphone, Sony и т.д.)"
              value={stats.sales_total ?? 0}
              icon="ShoppingCart"
              tint="gold"
              big
              sub={`${stats.sales_count ?? 0} операций`}
            />
          </div>
          <Card label="Приход" value={stats.income} icon="ArrowDownToLine" tint="green" />
          <Card label="Расход" value={stats.expense} icon="ArrowUpFromLine" tint="red" />
          <div className="col-span-2">
            <Card
              label="Скупка (товары у клиентов)"
              value={stats.pledge_total ?? 0}
              icon="PackageOpen"
              tint="red"
              sub={`${stats.pledge_count ?? 0} операций`}
            />
          </div>
          <div className="col-span-2">
            <Card label="Прибыль (Приход − Расход)" value={stats.period_profit}
              icon={stats.period_profit >= 0 ? "Sparkles" : "AlertTriangle"}
              tint={stats.period_profit >= 0 ? "gold" : "red"} big />
          </div>
          <div className="col-span-2 bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="Activity" size={14} className="text-white/40" />
              <span className="font-roboto text-white/50 text-[11px]">Операций за период</span>
            </div>
            <span className="font-oswald font-bold text-white text-base tabular-nums">{stats.operations_total}</span>
          </div>
          <div className="col-span-2 text-center font-roboto text-white/30 text-[10px]">
            {stats.date_from === stats.date_to ? `за ${stats.date_from}` : `${stats.date_from} — ${stats.date_to}`}
            {stats.cached && <span className="ml-2 text-white/20">(из кэша)</span>}
            <span className="ml-2 text-white/30">· источник: Касса и банк</span>
          </div>
        </div>
      )}

      {!error && !stats && loading && (
        <div className="flex items-center justify-center py-12 text-white/30">
          <Icon name="Loader" size={18} className="animate-spin mr-2 text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю данные...</span>
        </div>
      )}
    </>
  );
}

function Card({ label, value, icon, tint, sub, big }: {
  label: string; value: number; icon: string;
  tint: "green" | "red" | "gold"; sub?: string; big?: boolean;
}) {
  const palette = {
    green: { bg: "from-green-500/10 to-green-500/[0.02]", border: "border-green-500/20", text: "text-green-400" },
    red:   { bg: "from-red-500/10 to-red-500/[0.02]",     border: "border-red-500/20",   text: "text-red-400" },
    gold:  { bg: "from-[#FFD700]/15 to-[#FFD700]/[0.02]", border: "border-[#FFD700]/30", text: "text-[#FFD700]" },
  }[tint];
  return (
    <div className={`relative bg-gradient-to-br ${palette.bg} border ${palette.border} rounded-lg p-3 overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-roboto text-white/50 text-[10px] uppercase tracking-wider">{label}</span>
        <Icon name={icon} size={13} className={palette.text} />
      </div>
      <div className={`font-oswald font-bold ${palette.text} tabular-nums leading-none ${big ? "text-3xl" : "text-xl"}`}>
        {fmt(value)} <span className="text-white/30 text-sm">₽</span>
      </div>
      {sub && <div className="font-roboto text-white/30 text-[9px] mt-1">{sub}</div>}
    </div>
  );
}

export default SLStatsGrid;