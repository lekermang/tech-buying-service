import Icon from "@/components/ui/icon";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

type StockData = {
  in_stock: number; stock_value: number; stock_sell_value: number;
  total_profit: number; total_invested: number; total_revenue: number;
  sold_count: number; last30_buy: number; last30_revenue: number; last30_profit: number;
};

interface Props {
  stock: StockData | null;
  stockLoading: boolean;
}

export default function FinanceStockWidget({ stock, stockLoading }: Props) {
  return (
    <div className="rounded-xl p-3" style={{
      background: "linear-gradient(145deg,rgba(255,215,0,0.06),rgba(255,215,0,0.02))",
      border: "1px solid rgba(255,215,0,0.15)",
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Package" size={12} style={{ color: "rgba(255,215,0,0.7)" }} />
        <span className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Данные склада (авто)</span>
        {stockLoading && <Icon name="Loader2" size={10} className="animate-spin ml-auto" style={{ color: "rgba(255,215,0,0.4)" }} />}
      </div>
      {stock ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Склад", v: fmt(stock.stock_value) + " ₽", c: "#FFD700" },
            { l: "Прибыль", v: fmt(stock.total_profit) + " ₽", c: "#34d399" },
            { l: "Продажи 30д", v: fmt(stock.last30_revenue) + " ₽", c: "#60a5fa" },
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
  );
}
