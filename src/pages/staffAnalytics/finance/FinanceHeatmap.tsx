import type { FinanceDay } from "./types";
import { fmtMoney } from "./types";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

type Cell = { date: string; value: number; weekday: number };

export default function FinanceHeatmap({ daily }: { daily: FinanceDay[] }) {
  if (!daily.length) return null;

  const max = Math.max(...daily.map(d => d.profit), 1);
  const min = Math.min(...daily.map(d => d.profit), 0);

  // Группируем по неделям
  const cells: Cell[] = daily.map(d => {
    const dt = new Date(d.day);
    const wd = (dt.getDay() + 6) % 7; // понедельник = 0
    return { date: d.day, value: d.profit, weekday: wd };
  });

  // Сетка: колонки = недели
  const weeks: (Cell | null)[][] = [];
  let curWeek: (Cell | null)[] = new Array(7).fill(null);
  cells.forEach((c, i) => {
    if (i > 0 && c.weekday === 0) {
      weeks.push(curWeek);
      curWeek = new Array(7).fill(null);
    }
    curWeek[c.weekday] = c;
  });
  weeks.push(curWeek);

  const colorFor = (v: number) => {
    if (v === 0) return "#0F0F0F";
    if (v > 0) {
      const intensity = Math.min(1, v / max);
      const alpha = 0.15 + intensity * 0.75;
      return `rgba(52, 211, 153, ${alpha})`;
    }
    const intensity = Math.min(1, Math.abs(v) / Math.abs(min || 1));
    const alpha = 0.15 + intensity * 0.75;
    return `rgba(251, 113, 133, ${alpha})`;
  };

  return (
    <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wider text-white/60 font-bold">Тепловая карта прибыли по дням</div>
        <div className="flex items-center gap-2 text-[9px] text-white/40">
          <span>Убыток</span>
          <div className="flex gap-px">
            {[-1, -0.5, 0, 0.5, 1].map(v => (
              <div key={v} className="w-3 h-3 rounded-sm" style={{
                background: v < 0
                  ? `rgba(251,113,133,${0.2 + Math.abs(v) * 0.7})`
                  : v > 0
                    ? `rgba(52,211,153,${0.2 + v * 0.7})`
                    : "#0F0F0F",
              }} />
            ))}
          </div>
          <span>Прибыль</span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        <div className="flex flex-col gap-1 pr-1">
          {WEEKDAYS.map(w => (
            <div key={w} className="w-5 h-5 flex items-center justify-end text-[8px] text-white/30 pr-1">{w}</div>
          ))}
        </div>
        {weeks.map((wk, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {wk.map((c, di) => (
              <div
                key={di}
                title={c ? `${c.date}: ${fmtMoney(c.value)} ₽` : ""}
                className="w-5 h-5 rounded-sm border border-[#1F1F1F] hover:ring-2 hover:ring-[#FFD700]/50 transition cursor-default"
                style={{ background: c ? colorFor(c.value) : "transparent" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
