import { useMemo } from "react";
import Icon from "@/components/ui/icon";
import { fmt } from "./employee.types";
import type { DayRow, PayoutRow, RepairDayRow } from "./employee.types";

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

type Cell = {
  date: string | null;
  total: number;
  bonus: number;
  payout: number;
  isRepair: boolean;
};

interface Props {
  viewMonth: Date;
  todayIso: string;
  isCurrentMonth: boolean;
  days: DayRow[];
  payouts: PayoutRow[];
  repairDays?: RepairDayRow[];
  isRepairMaster: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onDayClick: (date: string) => void;
}

export default function EmployeeCalendar({
  viewMonth, todayIso, isCurrentMonth,
  days, payouts, repairDays = [], isRepairMaster,
  onPrevMonth, onNextMonth, onCurrentMonth, onDayClick,
}: Props) {
  const color = isRepairMaster ? "#34d399" : "#FFD700";
  const colorBg = isRepairMaster ? "rgba(52,211,153,0.12)" : "rgba(255,215,0,0.12)";
  const colorBorder = isRepairMaster ? "rgba(52,211,153,0.35)" : "rgba(255,215,0,0.3)";

  const grid = useMemo<Cell[]>(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWd = (first.getDay() + 6) % 7;

    // Строим карты
    const totalMap = new Map<string, number>();
    const bonusMap = new Map<string, number>();

    if (isRepairMaster) {
      for (const d of repairDays) {
        const k = d.repair_date.slice(0, 10);
        totalMap.set(k, Number(d.master_income) || 0);
      }
    } else {
      for (const d of days) {
        const k = d.shift_date.slice(0, 10);
        totalMap.set(k, Number(d.total) || 0);
        bonusMap.set(k, Number(d.bonus_amount) || 0);
      }
    }

    const payMap = new Map<string, number>();
    for (const p of payouts) {
      const k = p.payout_date.slice(0, 10);
      payMap.set(k, (payMap.get(k) || 0) + Number(p.amount || 0));
    }

    const cells: Cell[] = [];
    for (let i = 0; i < firstWd; i++) cells.push({ date: null, total: 0, bonus: 0, payout: 0, isRepair: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = isoLocal(new Date(y, m, d));
      cells.push({
        date: iso,
        total: totalMap.get(iso) || 0,
        bonus: bonusMap.get(iso) || 0,
        payout: payMap.get(iso) || 0,
        isRepair: isRepairMaster && (totalMap.get(iso) || 0) > 0,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, total: 0, bonus: 0, payout: 0, isRepair: false });
    return cells;
  }, [viewMonth, days, payouts, repairDays, isRepairMaster]);

  const fmtCell = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}к` : String(n);

  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      {/* Навигация */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
          <Icon name="ChevronLeft" size={16} />
        </button>
        <div className="text-center">
          <div className="font-oswald font-bold text-white text-base uppercase tracking-wide">
            {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </div>
          {!isCurrentMonth && (
            <button onClick={onCurrentMonth}
              className="font-roboto text-[11px] underline mt-0.5"
              style={{ color: `${color}99` }}>
              К текущему месяцу
            </button>
          )}
        </div>
        <button onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>
          <Icon name="ChevronRight" size={16} />
        </button>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className="text-center font-oswald text-[10px] uppercase tracking-wide py-1"
            style={{ color: "rgba(255,255,255,0.3)" }}>{w}</div>
        ))}
      </div>

      {/* Ячейки */}
      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((cell, i) => {
          if (!cell.date) return <div key={`e-${i}`} className="aspect-square" />;
          const isToday = cell.date === todayIso;
          const hasEarning = cell.total > 0;

          return (
            <button
              key={cell.date}
              onClick={() => onDayClick(cell.date!)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all active:scale-90"
              style={{
                background: hasEarning ? colorBg : "rgba(255,255,255,0.03)",
                border: isToday
                  ? `2px solid ${color}`
                  : hasEarning
                  ? `1px solid ${colorBorder}`
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: isToday ? `0 0 8px ${color}40` : "none",
              }}
            >
              <span className="font-oswald font-bold text-[11px] leading-none"
                style={{ color: hasEarning ? color : "rgba(255,255,255,0.45)" }}>
                {Number(cell.date.slice(8, 10))}
              </span>
              {hasEarning && (
                <span className="font-oswald font-bold leading-none mt-0.5"
                  style={{ fontSize: "8px", color }}>
                  {fmtCell(cell.total)}
                </span>
              )}
              {cell.bonus > 0 && (
                <span className="font-bold leading-none" style={{ fontSize: "7px", color: "#a78bfa" }}>
                  +{fmtCell(cell.bonus)}
                </span>
              )}
              {cell.payout > 0 && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: "#34d399" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="mt-3 flex flex-wrap gap-3 font-roboto" style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: colorBg, border: `1px solid ${colorBorder}` }} />
          Рабочий день
        </span>
        {!isRepairMaster && (
          <span className="flex items-center gap-1">
            <span style={{ color: "#a78bfa", fontWeight: 700 }}>+₽</span>
            Бонус с продаж
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#34d399" }} />
          Выплата
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ border: `2px solid ${color}` }} />
          Сегодня
        </span>
      </div>
    </div>
  );
}
