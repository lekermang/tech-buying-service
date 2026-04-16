import { DayStat, fmtDay } from "./types";

type Props = {
  loading: boolean;
  stats: DayStat[];
};

export default function RepairStats({ loading, stats }: Props) {
  const totalRevenue = stats.reduce((a, s) => a + s.revenue, 0);
  const totalCosts = stats.reduce((a, s) => a + s.costs, 0);
  const totalProfit = stats.reduce((a, s) => a + s.profit, 0);
  const totalMaster = stats.reduce((a, s) => a + (s.master_income || 0), 0);
  const totalDone = stats.reduce((a, s) => a + s.done, 0);
  const totalOrders = stats.reduce((a, s) => a + s.total, 0);

  return (
    <div className="px-4 py-3">
      {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
      {!loading && stats.length === 0 && (
        <div className="text-center py-10 text-white/30 font-roboto text-sm">Нет данных за последние 30 дней</div>
      )}
      {!loading && stats.length > 0 && (
        <>
          {/* KPI карточки */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-1">Всего заявок</div>
              <div className="font-oswald font-bold text-white text-xl">{totalOrders}</div>
              <div className="font-roboto text-white/20 text-[10px]">выдано: {totalDone}</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-1">Выручка</div>
              <div className="font-oswald font-bold text-green-400 text-xl">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
              <div className="font-roboto text-orange-400/60 text-[10px]">закупка: {totalCosts.toLocaleString("ru-RU")} ₽</div>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
              <div className="font-roboto text-white/30 text-[10px] mb-1">Прибыль</div>
              <div className={`font-oswald font-bold text-xl ${totalProfit >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                {totalProfit.toLocaleString("ru-RU")} ₽
              </div>
              <div className="font-roboto text-white/20 text-[10px]">
                {totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0}% маржа
              </div>
            </div>
          </div>

          {/* Доход мастера */}
          {totalMaster > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 mb-4 flex items-center justify-between">
              <div>
                <div className="font-roboto text-green-400/60 text-[10px] uppercase tracking-wide mb-0.5">Доход мастера (50% от прибыли)</div>
                <div className="font-oswald font-bold text-green-400 text-2xl">{totalMaster.toLocaleString("ru-RU")} ₽</div>
              </div>
              <div className="text-3xl opacity-40">🏆</div>
            </div>
          )}

          {/* Дневная таблица */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] overflow-x-auto">
            <div className="grid gap-0 border-b border-[#333] px-3 py-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              {["День", "Заявок", "Выдано", "Закупка", "Выручка", "Прибыль", "Мастеру"].map(h => (
                <div key={h} className="font-roboto text-[9px] text-white/30 uppercase tracking-wide text-center">{h}</div>
              ))}
            </div>
            {stats.map(s => {
              const masterIncome = s.master_income || 0;
              return (
                <div key={s.day} className="grid gap-0 border-b border-[#222] px-3 py-2 hover:bg-white/2 transition-colors last:border-0"
                  style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                  <div className="font-roboto text-[11px] text-white/60">{fmtDay(s.day)}</div>
                  <div className="font-roboto text-[11px] text-white text-center">{s.total}</div>
                  <div className="font-roboto text-[11px] text-green-400 text-center">{s.done}</div>
                  <div className="font-roboto text-[11px] text-orange-400 text-center">
                    {s.costs > 0 ? s.costs.toLocaleString("ru-RU") : "—"}
                  </div>
                  <div className="font-roboto text-[11px] text-green-400 text-center">
                    {s.revenue > 0 ? s.revenue.toLocaleString("ru-RU") : "—"}
                  </div>
                  <div className={`font-oswald font-bold text-[11px] text-center ${s.profit > 0 ? "text-[#FFD700]" : s.profit < 0 ? "text-red-400" : "text-white/20"}`}>
                    {s.profit !== 0 ? s.profit.toLocaleString("ru-RU") : "—"}
                  </div>
                  <div className="font-roboto text-[11px] text-green-300 text-center font-bold">
                    {masterIncome > 0 ? masterIncome.toLocaleString("ru-RU") : "—"}
                  </div>
                </div>
              );
            })}
            {/* Итого */}
            <div className="grid gap-0 px-3 py-2 bg-white/3 border-t border-[#333]"
              style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
              <div className="font-roboto text-[10px] text-white/50 font-bold">Итого</div>
              <div className="font-roboto text-[11px] text-white text-center font-bold">{totalOrders}</div>
              <div className="font-roboto text-[11px] text-green-400 text-center font-bold">{totalDone}</div>
              <div className="font-roboto text-[11px] text-orange-400 text-center font-bold">
                {totalCosts > 0 ? totalCosts.toLocaleString("ru-RU") : "—"}
              </div>
              <div className="font-roboto text-[11px] text-green-400 text-center font-bold">
                {totalRevenue > 0 ? totalRevenue.toLocaleString("ru-RU") : "—"}
              </div>
              <div className={`font-oswald font-bold text-[11px] text-center ${totalProfit >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                {totalProfit.toLocaleString("ru-RU")}
              </div>
              <div className="font-roboto text-[11px] text-green-300 text-center font-bold">
                {totalMaster > 0 ? totalMaster.toLocaleString("ru-RU") : "—"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
