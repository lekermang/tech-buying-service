import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { EmployeeOverview } from "@/pages/staff.types";
import {
  MONTHS, WEEKDAYS,
  type CalendarDay, type DetailState, type LogRow,
} from "./ownerSalaryTypes";
import OwnerSavingsPanel from "./OwnerSavingsPanel";
import OwnerDebtsPanel from "./OwnerDebtsPanel";

type MonthCell = { date: string | null; status: CalendarDay["status"] | null; total: number; payout: number; bonus: number };

export default function OwnerEmployeeDetail({
  selected,
  detail,
  editing,
  busy,
  viewMonth,
  isCurrentMonth,
  todayIso,
  monthGrid,
  monthSummary,
  logByDate,
  onBack,
  onBeginEdit,
  onCancelEdit,
  onChangeEditing,
  onSaveConfig,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  onDayClick,
  onOpenBulk,
  onOpenPayout,
  onDeletePayout,
  onResync,
}: {
  selected: EmployeeOverview;
  detail: DetailState | null;
  editing: { daily_rate: string; bonus_percent: string } | null;
  busy: boolean;
  viewMonth: Date;
  isCurrentMonth: boolean;
  todayIso: string;
  monthGrid: MonthCell[];
  monthSummary: { earned: number; paid: number; remaining: number; bonus: number };
  logByDate: Map<string, LogRow>;
  onBack: () => void;
  onBeginEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditing: (next: { daily_rate: string; bonus_percent: string }) => void;
  onSaveConfig: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth: () => void;
  onDayClick: (date: string, log: LogRow | null) => void;
  onOpenBulk: () => void;
  onOpenPayout: () => void;
  onDeletePayout: (id: number) => void;
  onResync: () => void;
  token: string;
}) {
  const [activeTab, setActiveTab] = useState<"salary" | "savings" | "debts">("salary");

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-roboto"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад к списку
      </button>

      {/* Шапка */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-oswald font-bold text-xl text-white">{selected.full_name}</div>
            <div className="text-white/40 text-xs font-roboto">{selected.position || selected.role} · @{selected.login}</div>
          </div>
          {!editing && (
            <button onClick={onBeginEdit}
              className="px-3 py-1.5 rounded-lg bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/30 text-[#FFD700] text-sm font-oswald uppercase tracking-wide flex items-center gap-1.5">
              <Icon name="Pencil" size={14} />
              Редактировать
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>
              <span className="text-white/50 text-xs uppercase font-oswald">Ставка по умолчанию, ₽</span>
              <input type="number" value={editing.daily_rate}
                onChange={e => onChangeEditing({ ...editing, daily_rate: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
            </label>
            <label>
              <span className="text-white/50 text-xs uppercase font-oswald">% с продаж</span>
              <input type="number" step="0.1" value={editing.bonus_percent}
                onChange={e => onChangeEditing({ ...editing, bonus_percent: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
            </label>
            <div className="sm:col-span-2 flex gap-2">
              <button onClick={onSaveConfig} disabled={busy}
                className="flex-1 py-2 rounded-lg bg-[#FFD700] text-black font-oswald font-bold uppercase text-sm disabled:opacity-50">Сохранить</button>
              <button onClick={onCancelEdit}
                className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 font-oswald uppercase text-sm">Отмена</button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-6 text-sm font-roboto">
            <div><div className="text-white/40 text-[10px] uppercase font-oswald">Ставка</div>
              <div className="text-white font-bold tabular-nums">{selected.daily_rate.toLocaleString("ru-RU")} ₽</div></div>
            <div><div className="text-white/40 text-[10px] uppercase font-oswald">% с продаж</div>
              <div className="text-white font-bold">{selected.bonus_percent}%</div></div>
          </div>
        )}
      </div>

      {/* Переключатель Зарплата / Долги / Копилка */}
      <div className="flex gap-1 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
        <button onClick={() => setActiveTab("salary")}
          className="flex-1 py-2 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "salary" ? "rgba(255,215,0,0.15)" : "transparent",
            color: activeTab === "salary" ? "#FFD700" : "rgba(255,255,255,0.4)",
            border: activeTab === "salary" ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent",
          }}>
          <Icon name="Wallet" size={13} /> Зарплата
        </button>
        <button onClick={() => setActiveTab("debts")}
          className="flex-1 py-2 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "debts" ? "rgba(220,38,38,0.15)" : "transparent",
            color: activeTab === "debts" ? "#fca5a5" : "rgba(255,255,255,0.4)",
            border: activeTab === "debts" ? "1px solid rgba(220,38,38,0.3)" : "1px solid transparent",
          }}>
          <Icon name="AlertTriangle" size={13} /> Долги
        </button>
        <button onClick={() => setActiveTab("savings")}
          className="flex-1 py-2 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "savings" ? "rgba(167,139,250,0.15)" : "transparent",
            color: activeTab === "savings" ? "#a78bfa" : "rgba(255,255,255,0.4)",
            border: activeTab === "savings" ? "1px solid rgba(167,139,250,0.3)" : "1px solid transparent",
          }}>
          <Icon name="PiggyBank" size={13} /> Копилка
        </button>
      </div>

      {/* ── ДОЛГИ ── */}
      {activeTab === "debts" && (
        <OwnerDebtsPanel
          employeeId={selected.id}
          employeeName={selected.full_name}
          token={token}
        />
      )}

      {/* ── КОПИЛКА ── */}
      {activeTab === "savings" && (
        <OwnerSavingsPanel
          employeeId={selected.id}
          employeeName={selected.full_name}
          token={token}
        />
      )}

      {/* ── ЗАРПЛАТА ── */}
      {activeTab === "salary" && <>

      {/* Сводки */}
      {detail?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-white/40 text-[10px] uppercase font-oswald">Всего начислено</div>
            <div className="text-white font-bold font-oswald text-lg tabular-nums mt-1">
              {Number(detail.summary.total_all).toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-3">
            <div className="text-purple-300/70 text-[10px] uppercase font-oswald">Премия</div>
            <div className="text-purple-300 font-bold font-oswald text-lg tabular-nums mt-1">
              {Number(detail.summary.total_bonus || 0).toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
            <div className="text-green-300/70 text-[10px] uppercase font-oswald">Выплачено</div>
            <div className="text-green-300 font-bold font-oswald text-lg tabular-nums mt-1">
              {Number(detail.summary.total_paid).toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div className="rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/5 p-3">
            <div className="text-[#FFD700]/70 text-[10px] uppercase font-oswald">К выплате</div>
            <div className="text-[#FFD700] font-bold font-oswald text-lg tabular-nums mt-1">
              {Number(detail.summary.total_unpaid).toLocaleString("ru-RU")} ₽
            </div>
          </div>
        </div>
      )}

      {/* Навигация по месяцам */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onPrevMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/70" title="Предыдущий месяц">
            <Icon name="ChevronLeft" size={18} />
          </button>
          <div className="text-center">
            <div className="font-oswald font-bold text-white text-lg uppercase tracking-wide">
              {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </div>
            {!isCurrentMonth && (
              <button onClick={onCurrentMonth} className="text-[#FFD700]/70 hover:text-[#FFD700] text-[11px] font-roboto underline">
                К текущему месяцу
              </button>
            )}
          </div>
          <button onClick={onNextMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/70" title="Следующий месяц">
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map(w => (
            <div key={w} className="text-center text-[10px] text-white/40 font-oswald uppercase tracking-wide py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {monthGrid.map((cell, i) => {
            if (!cell.date) return <div key={`e-${i}`} className="aspect-square" />;
            const isToday = cell.date === todayIso;
            const baseColor =
              cell.status === "dayoff" ? "bg-white/8 border-white/15 text-white/40"
              : cell.total > 0 ? "bg-green-500/15 border-green-400/40 text-green-100"
              : "bg-black/30 border-white/10 text-white/55";
            const dayNum = Number(cell.date.slice(8, 10));
            return (
              <button
                key={cell.date}
                onClick={() => cell.date && onDayClick(cell.date, logByDate.get(cell.date) || null)}
                disabled={busy}
                title="Кликни чтобы вписать часы и сумму"
                className={`aspect-square rounded-md border ${baseColor} text-[10px] font-oswald tabular-nums flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer relative ${isToday ? "ring-2 ring-[#FFD700]/60" : ""}`}
              >
                <span className="font-bold text-[11px]">{dayNum}</span>
                {cell.status === "dayoff" && <Icon name="Sunrise" size={9} className="text-white/40" />}
                {cell.total > 0 && (
                  <span className="text-[8px] text-[#FFD700] font-bold leading-none">
                    {cell.total >= 1000 ? `${(cell.total / 1000).toFixed(cell.total % 1000 === 0 ? 0 : 1)}к` : cell.total}
                  </span>
                )}
                {cell.bonus > 0 && (
                  <span className="text-[7px] text-purple-300 font-bold leading-none mt-0.5" title={`Премия за день: ${cell.bonus} ₽`}>
                    +{cell.bonus >= 1000 ? `${(cell.bonus / 1000).toFixed(cell.bonus % 1000 === 0 ? 0 : 1)}к` : cell.bonus}
                  </span>
                )}
                {cell.payout > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-400" title={`Выплата ${cell.payout} ₽`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/50 font-roboto">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/40" />Рабочий день</span>
          <span className="flex items-center gap-1"><span className="text-purple-300 font-bold">+₽</span>Премия</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-white/20" />Выходной</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />Выплата</span>
          <span className="text-white/35">Клик по дню — вписать часы и сумму</span>
        </div>
      </div>

      {/* Сводка месяца */}
      <div className="rounded-xl border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/8 to-transparent p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-6 text-sm font-roboto flex-wrap">
            <div><div className="text-white/40 text-[10px] uppercase font-oswald">Начислено в {MONTHS[viewMonth.getMonth()].toLowerCase()}</div>
              <div className="text-white font-bold tabular-nums font-oswald text-lg">{monthSummary.earned.toLocaleString("ru-RU")} ₽</div></div>
            <div><div className="text-purple-300/70 text-[10px] uppercase font-oswald">Премия {selected.bonus_percent}%</div>
              <div className="text-purple-300 font-bold tabular-nums font-oswald text-lg">{monthSummary.bonus.toLocaleString("ru-RU")} ₽</div></div>
            <div><div className="text-green-300/60 text-[10px] uppercase font-oswald">Выплачено</div>
              <div className="text-green-300 font-bold tabular-nums font-oswald text-lg">{monthSummary.paid.toLocaleString("ru-RU")} ₽</div></div>
            <div><div className="text-[#FFD700]/70 text-[10px] uppercase font-oswald">Остаток</div>
              <div className="text-[#FFD700] font-bold tabular-nums font-oswald text-lg">{monthSummary.remaining.toLocaleString("ru-RU")} ₽</div></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={onResync} disabled={busy}
              className="px-3 py-2 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-200 font-oswald font-bold uppercase tracking-wide text-xs flex items-center gap-1.5 disabled:opacity-50"
              title="Пересчитать премии за месяц по текущему % и продажам Смарт-Ломбарда">
              <Icon name="RefreshCw" size={14} />
              Синхронизировать %
            </button>
            <button onClick={onOpenBulk}
              className="px-3 py-2 rounded-lg bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/30 text-[#FFD700] font-oswald font-bold uppercase tracking-wide text-xs flex items-center gap-1.5">
              <Icon name="CalendarRange" size={14} />
              Заполнить дни
            </button>
            <button onClick={onOpenPayout}
              className="px-3 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-oswald font-bold uppercase tracking-wide text-xs flex items-center gap-1.5">
              <Icon name="Plus" size={14} />
              Записать выплату
            </button>
          </div>
        </div>
      </div>

      {/* Выплаты за месяц */}
      {detail && detail.payouts.filter(p => p.amount > 0).length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-3">Выплаты в {MONTHS[viewMonth.getMonth()].toLowerCase()}</div>
          <div className="space-y-1.5">
            {detail.payouts.filter(p => p.amount > 0).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-md bg-green-500/5 border border-green-500/15 px-3 py-2 text-sm font-roboto">
                <div className="flex items-center gap-2">
                  <Icon name="ArrowDownLeft" size={14} className="text-green-300" />
                  <span className="text-white">
                    {new Date(p.payout_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
                  </span>
                  {p.note && <span className="text-white/40 text-xs">· {p.note}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-300 font-bold font-oswald tabular-nums">
                    {Number(p.amount).toLocaleString("ru-RU")} ₽
                  </span>
                  <button onClick={() => onDeletePayout(p.id)} disabled={busy}
                    className="text-white/30 hover:text-red-400" title="Отменить">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      </>}
    </div>
  );
}