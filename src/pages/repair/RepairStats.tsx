import { DayStat, fmtDay } from "./types";

type Props = {
  loading: boolean;
  stats: DayStat[];
};

export default function RepairStats({ loading, stats }: Props) {
  return (
    <div className="px-4 py-3">
      {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
      {!loading && stats.length === 0 && (
        <div className="text-center py-10 text-white/30 font-roboto text-sm">Нет данных за последние 30 дней</div>
      )}
      {!loading && stats.length > 0 && (
        <>
          {/* Итого за период */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Всего заявок", value: stats.reduce((a, s) => a + s.total, 0), unit: "шт", color: "text-white" },
              { label: "Выручка", value: stats.reduce((a, s) => a + s.revenue, 0).toLocaleString("ru-RU"), unit: "₽", color: "text-green-400" },
              { label: "Прибыль", value: stats.reduce((a, s) => a + s.profit, 0).toLocaleString("ru-RU"), unit: "₽", color: "text-[#FFD700]" },
            ].map(card => (
              <div key={card.label} className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 text-center">
                <div className="font-roboto text-white/30 text-[10px] mb-1">{card.label}</div>
                <div className={`font-oswald font-bold text-lg ${card.color}`}>{card.value}</div>
                <div className="font-roboto text-white/30 text-[10px]">{card.unit}</div>
              </div>
            ))}
          </div>

          {/* Дневная таблица */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A]">
            <div className="grid grid-cols-6 gap-0 border-b border-[#333] px-3 py-1.5">
              {["День", "Заявок", "Выдано", "Закупка", "Выручка", "Прибыль"].map(h => (
                <div key={h} className="font-roboto text-[9px] text-white/30 uppercase tracking-wide text-center">{h}</div>
              ))}
            </div>
            {stats.map(s => (
              <div key={s.day} className="grid grid-cols-6 gap-0 border-b border-[#222] px-3 py-2 hover:bg-white/2 transition-colors">
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
