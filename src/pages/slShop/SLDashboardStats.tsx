import { fmt, type SLStats, STATUS_LABEL } from "./types";
import { StatCard, StatusCard, DirectionCard } from "./SLDashboardPrimitives";

const STATUS_META: Record<string, { color: string; nav: string }> = {
  stock:       { color: "#60a5fa", nav: "stock" },
  showcase:    { color: "#34d399", nav: "stock" },
  consignment: { color: "#a78bfa", nav: "stock" },
};

type Props = {
  data: SLStats | null;
  stockCount: number;
  stockSum: number;
  onNav: (k: string) => void;
};

export default function SLDashboardStats({ data, stockCount, stockSum, onNav }: Props) {
  return (
    <>
      {/* ── 4 главные карточки ── */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard
          title="Куплено"
          value={`${data?.bought_count || 0} шт.`}
          sub={`на ${fmt(data?.spent)} ₽`}
          icon="ShoppingCart"
          accentColor="#34d399"
          onClick={() => onNav("buy")}
          arrowLabel="принять"
        />
        <StatCard
          title="Продано"
          value={`${data?.sold_count || 0} шт.`}
          sub={`на ${fmt(data?.revenue)} ₽`}
          icon="HandCoins"
          accentColor="#60a5fa"
          onClick={() => onNav("stock")}
          arrowLabel="продать"
        />
        <StatCard
          title="Прибыль"
          value={`${fmt(Math.max(0, Number(data?.profit ?? 0)))} ₽`}
          sub={(data?.contract_profit ?? 0) > 0
            ? `б/у ${fmt(data?.profit_used)} + ломбард ${fmt(data?.contract_profit)}`
            : "за выбранный период"}
          icon="TrendingUp"
          accentColor="#FFD700"
          onClick={() => onNav("analytics")}
          arrowLabel="аналитика"
        />
        <StatCard
          title="На складе"
          value={`${stockCount} шт.`}
          sub={`${fmt(stockSum)} ₽`}
          icon="Package"
          accentColor="#e2e8f0"
          onClick={() => onNav("stock")}
          arrowLabel="склад"
        />
      </div>

      {/* ── Разбивка по статусам склада ── */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {(["stock", "showcase", "consignment"] as const).map(s => {
          const cfg = STATUS_LABEL[s];
          const v = data?.by_status?.[s];
          const meta = STATUS_META[s];
          return (
            <StatusCard
              key={s}
              label={cfg.l}
              count={v?.count || 0}
              sum={v?.sum || 0}
              accentColor={meta.color}
              onClick={() => onNav(meta.nav)}
            />
          );
        })}
      </div>

      {/* ── Детализация направлений ── */}
      {((data?.profit_used ?? 0) > 0 || (data?.contract_closed_count ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <DirectionCard
            title="Б/У техника"
            icon="Package"
            accentColor="#60a5fa"
            rows={[
              { label: "Продажи", value: `${data?.sold_count || 0} шт · ${fmt(data?.revenue || 0)} ₽`, color: "#34d399" },
              { label: "Скупка",  value: `${data?.bought_count || 0} шт · −${fmt(data?.spent || 0)} ₽`, color: "#7dd3fc" },
            ]}
            footer={{ label: "Прибыль", value: `+${fmt(Math.max(0, Number(data?.profit_used ?? 0)))} ₽` }}
          />
          <DirectionCard
            title="СмартЛомбард"
            icon="Coins"
            accentColor="#a78bfa"
            rows={[
              { label: "Выдано",     value: `${data?.contract_closed_count || 0} дог. · −${fmt(data?.contract_issued || 0)} ₽`, color: "#7dd3fc" },
              { label: "Возвращено", value: `+${fmt(data?.contract_returned || 0)} ₽`, color: "#34d399" },
              ...(((data?.contract_active_count ?? 0) > 0)
                ? [{ label: "В работе", value: `${data?.contract_active_count} дог. на ${fmt(data?.contract_active_issued || 0)} ₽`, color: "#fbbf24" }]
                : []),
            ]}
            footer={{ label: "Прибыль", value: `+${fmt(Math.max(0, Number(data?.contract_profit ?? 0)))} ₽` }}
          />
        </div>
      )}
    </>
  );
}
