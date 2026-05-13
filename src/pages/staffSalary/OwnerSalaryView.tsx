import { useEffect, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL, type EmployeeOverview, type SalaryLogEntry } from "@/pages/staff.types";

interface Props {
  token: string;
}

type CalendarDay = { shift_date: string; status: "open" | "closed" | "dayoff" };

type Summary = {
  total_all: number;
  total_paid: number;
  total_unpaid: number;
};

type DetailState = {
  history: SalaryLogEntry[];
  calendar: CalendarDay[];
  summary: Summary;
};

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

function isoLocal(d: Date) {
  // YYYY-MM-DD по локали (не UTC), чтобы не съезжать на день
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }

function statusDot(s: EmployeeOverview["shift_status"]) {
  if (s === "open") return { color: "bg-green-400", label: "В смене" };
  if (s === "closed") return { color: "bg-blue-400", label: "Смена закрыта" };
  if (s === "dayoff") return { color: "bg-white/30", label: "Выходной" };
  return { color: "bg-white/15", label: "Не начал" };
}

export default function OwnerSalaryView({ token }: Props) {
  const [employees, setEmployees] = useState<EmployeeOverview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [editing, setEditing] = useState<{ daily_rate: string; bonus_percent: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Выбранный месяц для просмотра (по умолчанию — текущий, 1-е число)
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));

  const headers = {
    "X-Employee-Token": token,
    "Content-Type": "application/json",
  };

  const fetchOverview = useCallback(async () => {
    const r = await fetch(`${SALARY_URL}?action=owner_overview`, { headers: { "X-Employee-Token": token } });
    if (r.ok) {
      const d = await r.json();
      setEmployees(d.employees || []);
    }
  }, [token]);

  const fetchDetail = useCallback(async (empId: number, month: Date) => {
    const from = isoLocal(startOfMonth(month));
    const to = isoLocal(endOfMonth(month));
    const r = await fetch(
      `${SALARY_URL}?action=owner_employee_detail&employee_id=${empId}&from=${from}&to=${to}`,
      { headers: { "X-Employee-Token": token } },
    );
    if (r.ok) setDetail(await r.json());
  }, [token]);

  useEffect(() => {
    fetchOverview().finally(() => setLoading(false));
  }, [fetchOverview]);

  useEffect(() => {
    if (selectedId) {
      setDetail(null);
      fetchDetail(selectedId, viewMonth);
    }
  }, [selectedId, viewMonth, fetchDetail]);

  const selected = employees.find(e => e.id === selectedId) || null;

  const beginEdit = () => {
    if (!selected) return;
    setEditing({
      daily_rate: String(selected.daily_rate),
      bonus_percent: String(selected.bonus_percent),
    });
  };

  const saveConfig = async () => {
    if (!selected || !editing) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_set_config`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employee_id: selected.id,
          daily_rate: Number(editing.daily_rate) || 0,
          bonus_percent: Number(editing.bonus_percent) || 0,
        }),
      });
      setEditing(null);
      await fetchOverview();
    } finally {
      setBusy(false);
    }
  };

  const toggleDayoff = async (dateStr: string, isDayoff: boolean) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_mark_dayoff`, {
        method: "POST",
        headers,
        body: JSON.stringify({ employee_id: selected.id, date: dateStr, is_dayoff: isDayoff }),
      });
      await fetchDetail(selected.id, viewMonth);
      await fetchOverview();
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async (logId: number) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_mark_paid`, {
        method: "POST",
        headers,
        body: JSON.stringify({ log_id: logId }),
      });
      await fetchDetail(selected.id, viewMonth);
      await fetchOverview();
    } finally {
      setBusy(false);
    }
  };

  const payAllMonth = async () => {
    if (!selected) return;
    const from = isoLocal(startOfMonth(viewMonth));
    const to = isoLocal(endOfMonth(viewMonth));
    const monthLabel = `${MONTHS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
    if (!confirm(`Пометить все неоплаченные смены за ${monthLabel} как выплаченные?`)) return;
    setBusy(true);
    try {
      const r = await fetch(`${SALARY_URL}?action=owner_pay_all`, {
        method: "POST",
        headers,
        body: JSON.stringify({ employee_id: selected.id, from, to }),
      });
      if (r.ok) {
        const d = await r.json();
        alert(`Помечено выплаченными: ${d.paid_count || 0} смен`);
      }
      await fetchDetail(selected.id, viewMonth);
      await fetchOverview();
    } finally {
      setBusy(false);
    }
  };

  const goPrevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goCurrentMonth = () => setViewMonth(startOfMonth(new Date()));

  // === Сетка календаря для выбранного месяца ===
  const monthGrid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const daysInMonth = last.getDate();
    // День недели первого числа (0=Вс ... 6=Сб) → переводим в Пн-first
    const firstWd = (first.getDay() + 6) % 7;
    const cells: Array<{ date: string | null; status: CalendarDay["status"] | null }> = [];
    const map = new Map((detail?.calendar || []).map(d => [d.shift_date.slice(0, 10), d.status]));
    for (let i = 0; i < firstWd; i++) cells.push({ date: null, status: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      const iso = isoLocal(cur);
      cells.push({ date: iso, status: map.get(iso) || null });
    }
    // Доводим до полной недели
    while (cells.length % 7 !== 0) cells.push({ date: null, status: null });
    return cells;
  }, [viewMonth, detail?.calendar]);

  // История за выбранный месяц
  const historyMonth = useMemo(() => {
    if (!detail) return [];
    const from = isoLocal(startOfMonth(viewMonth));
    const to = isoLocal(endOfMonth(viewMonth));
    return detail.history.filter(h => {
      const d = h.shift_date.slice(0, 10);
      return d >= from && d <= to;
    });
  }, [detail, viewMonth]);

  // Сумма за выбранный месяц
  const monthSummary = useMemo(() => {
    let total = 0, paid = 0, unpaid = 0;
    for (const h of historyMonth) {
      total += Number(h.total) || 0;
      if (h.is_paid) paid += Number(h.total) || 0;
      else unpaid += Number(h.total) || 0;
    }
    return { total, paid, unpaid };
  }, [historyMonth]);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === viewMonth.getFullYear() && now.getMonth() === viewMonth.getMonth();
  }, [viewMonth]);

  const todayIso = isoLocal(new Date());

  if (loading) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  // === ЭКРАН СПИСКА СОТРУДНИКОВ ===
  if (!selectedId) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
          <p className="text-white/50 text-sm mt-1 font-roboto">Управление ставкой, % с продаж, графиком и выплатами</p>
        </div>

        {employees.length === 0 ? (
          <div className="text-white/40 text-center py-8 font-roboto">Нет активных сотрудников</div>
        ) : (
          <div className="space-y-3">
            {employees.map(e => {
              const dot = statusDot(e.shift_status);
              return (
                <button
                  key={e.id}
                  onClick={() => { setSelectedId(e.id); setViewMonth(startOfMonth(new Date())); }}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FFD700]/30 p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/30 flex items-center justify-center font-oswald font-bold text-[#FFD700]">
                      {(e.full_name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-oswald font-bold text-white text-base truncate">{e.full_name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/50 font-roboto">
                          <span className={`w-1.5 h-1.5 rounded-full ${dot.color}`} />
                          {dot.label}
                        </span>
                      </div>
                      <div className="text-white/40 text-xs font-roboto mt-0.5">
                        {e.position || e.role} · {e.daily_rate.toLocaleString("ru-RU")} ₽/смена · {e.bonus_percent}%
                      </div>
                    </div>
                    {(e.unpaid_total ?? 0) > 0 && (
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wide text-white/50 font-oswald">К выплате</div>
                        <div className="text-[#FFD700] font-bold font-oswald tabular-nums">
                          {Number(e.unpaid_total).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    )}
                    <Icon name="ChevronRight" size={16} className="text-white/30 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // === ЭКРАН ДЕТАЛЕЙ СОТРУДНИКА ===
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => { setSelectedId(null); setEditing(null); setDetail(null); }}
        className="flex items-center gap-1 text-white/60 hover:text-white text-sm font-roboto"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад к списку
      </button>

      {selected && (
        <>
          {/* Шапка: имя + ставка/% */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-oswald font-bold text-xl text-white">{selected.full_name}</div>
                <div className="text-white/40 text-xs font-roboto">{selected.position || selected.role} · @{selected.login}</div>
              </div>
              {!editing && (
                <button
                  onClick={beginEdit}
                  className="px-3 py-1.5 rounded-lg bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/30 text-[#FFD700] text-sm font-oswald uppercase tracking-wide flex items-center gap-1.5"
                >
                  <Icon name="Pencil" size={14} />
                  Редактировать
                </button>
              )}
            </div>

            {editing ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-white/50 text-xs uppercase tracking-wide font-oswald">Ставка за смену, ₽</span>
                  <input type="number" value={editing.daily_rate}
                    onChange={e => setEditing({ ...editing, daily_rate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
                </label>
                <label className="block">
                  <span className="text-white/50 text-xs uppercase tracking-wide font-oswald">% с продаж</span>
                  <input type="number" step="0.1" value={editing.bonus_percent}
                    onChange={e => setEditing({ ...editing, bonus_percent: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
                </label>
                <div className="sm:col-span-2 flex gap-2">
                  <button onClick={saveConfig} disabled={busy}
                    className="flex-1 py-2 rounded-lg bg-[#FFD700] text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-50">
                    Сохранить
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 font-oswald uppercase tracking-wide text-sm">
                    Отмена
                  </button>
                </div>
                <p className="sm:col-span-2 text-white/40 text-[11px] font-roboto">
                  Изменение применится к будущим сменам. Старые записи в логе не пересчитываются.
                </p>
              </div>
            ) : (
              <div className="mt-3 flex gap-6 text-sm font-roboto">
                <div>
                  <div className="text-white/40 text-[10px] uppercase font-oswald">Ставка</div>
                  <div className="text-white font-bold tabular-nums">{selected.daily_rate.toLocaleString("ru-RU")} ₽</div>
                </div>
                <div>
                  <div className="text-white/40 text-[10px] uppercase font-oswald">% с продаж</div>
                  <div className="text-white font-bold">{selected.bonus_percent}%</div>
                </div>
                <div>
                  <div className="text-white/40 text-[10px] uppercase font-oswald">Мин. часов</div>
                  <div className="text-white font-bold">{selected.min_hours_for_rate} ч</div>
                </div>
              </div>
            )}
          </div>

          {/* Сводка по сотруднику в целом */}
          {detail?.summary && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-white/40 text-[10px] uppercase font-oswald">Всего начислено</div>
                <div className="text-white font-bold font-oswald text-lg tabular-nums mt-1">
                  {Number(detail.summary.total_all).toLocaleString("ru-RU")} ₽
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
              <button onClick={goPrevMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/70" title="Предыдущий месяц">
                <Icon name="ChevronLeft" size={18} />
              </button>
              <div className="text-center">
                <div className="font-oswald font-bold text-white text-lg uppercase tracking-wide">
                  {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </div>
                {!isCurrentMonth && (
                  <button onClick={goCurrentMonth} className="text-[#FFD700]/70 hover:text-[#FFD700] text-[11px] font-roboto underline">
                    К текущему месяцу
                  </button>
                )}
              </div>
              <button onClick={goNextMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/70" title="Следующий месяц">
                <Icon name="ChevronRight" size={18} />
              </button>
            </div>

            {/* Календарь */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(w => (
                <div key={w} className="text-center text-[10px] text-white/40 font-oswald uppercase tracking-wide py-1">{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthGrid.map((cell, i) => {
                if (!cell.date) return <div key={`e-${i}`} className="aspect-square" />;
                const isToday = cell.date === todayIso;
                const isPast = cell.date < todayIso;
                const color =
                  cell.status === "open" ? "bg-green-500/30 border-green-400/50 text-green-200"
                  : cell.status === "closed" ? "bg-blue-500/20 border-blue-400/40 text-blue-200"
                  : cell.status === "dayoff" ? "bg-white/10 border-white/20 text-white/40"
                  : "bg-black/30 border-white/10 text-white/40";
                const canToggle = cell.status !== "closed" && !isPast;
                const dayNum = Number(cell.date.slice(8, 10));
                return (
                  <button
                    key={cell.date}
                    onClick={() => canToggle && cell.date && toggleDayoff(cell.date, cell.status !== "dayoff")}
                    disabled={!canToggle || busy}
                    title={canToggle ? (cell.status === "dayoff" ? "Снять выходной" : "Отметить выходным") : "Закрытые смены и прошлые дни не меняются"}
                    className={`aspect-square rounded-md border ${color} text-[11px] font-oswald tabular-nums flex flex-col items-center justify-center ${canToggle ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed opacity-70"} ${isToday ? "ring-2 ring-[#FFD700]/60" : ""}`}
                  >
                    <span className="font-bold">{dayNum}</span>
                    {cell.status === "dayoff" && <Icon name="Sunrise" size={9} />}
                    {cell.status === "closed" && <Icon name="Check" size={9} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/50 font-roboto">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/40" />Открыта</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/30" />Закрыта</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-white/20" />Выходной</span>
              <span className="text-white/35">Клик — отметить/снять выходной</span>
            </div>
          </div>

          {/* Сводка за выбранный месяц + кнопка выплаты */}
          <div className="rounded-xl border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/8 to-transparent p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-6 text-sm font-roboto">
                <div>
                  <div className="text-white/40 text-[10px] uppercase font-oswald">Начислено за {MONTHS[viewMonth.getMonth()]}</div>
                  <div className="text-white font-bold tabular-nums font-oswald text-lg">
                    {monthSummary.total.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div>
                  <div className="text-green-300/60 text-[10px] uppercase font-oswald">Выплачено</div>
                  <div className="text-green-300 font-bold tabular-nums font-oswald text-lg">
                    {monthSummary.paid.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div>
                  <div className="text-[#FFD700]/70 text-[10px] uppercase font-oswald">К выплате</div>
                  <div className="text-[#FFD700] font-bold tabular-nums font-oswald text-lg">
                    {monthSummary.unpaid.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              </div>
              <button
                onClick={payAllMonth}
                disabled={busy || monthSummary.unpaid === 0}
                className="px-4 py-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Icon name="Wallet" size={14} />
                Выплатить за месяц
              </button>
            </div>
          </div>

          {/* История зарплат за выбранный месяц */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-3">
              Смены за {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </div>
            {!detail ? (
              <div className="text-white/40 text-center py-4 font-roboto">Загрузка...</div>
            ) : historyMonth.length === 0 ? (
              <div className="text-white/40 text-center py-4 font-roboto">В этом месяце нет закрытых смен</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-roboto">
                  <thead>
                    <tr className="text-white/40 text-[10px] uppercase tracking-wide font-oswald">
                      <th className="text-left py-2 px-1">Дата</th>
                      <th className="text-right py-2 px-1">Часы</th>
                      <th className="text-right py-2 px-1">Ставка</th>
                      <th className="text-right py-2 px-1">Прибыль</th>
                      <th className="text-right py-2 px-1">%</th>
                      <th className="text-right py-2 px-1">Бонус</th>
                      <th className="text-right py-2 px-1">Итого</th>
                      <th className="text-right py-2 px-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyMonth.map(h => (
                      <tr key={h.id} className="border-t border-white/5">
                        <td className="py-2 px-1 text-white/80 whitespace-nowrap">
                          {new Date(h.shift_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                        </td>
                        <td className="py-2 px-1 text-right text-white/70 tabular-nums">{Number(h.hours_worked).toFixed(1)}</td>
                        <td className="py-2 px-1 text-right text-white/70 tabular-nums">{Number(h.base_rate || 0).toLocaleString("ru-RU")}</td>
                        <td className="py-2 px-1 text-right text-white/70 tabular-nums">{Number(h.personal_profit || 0).toLocaleString("ru-RU")}</td>
                        <td className="py-2 px-1 text-right text-white/70">{h.bonus_percent_at_time}%</td>
                        <td className="py-2 px-1 text-right text-white/70 tabular-nums">{Number(h.bonus_amount || 0).toLocaleString("ru-RU")}</td>
                        <td className="py-2 px-1 text-right text-[#FFD700] font-bold tabular-nums">{Number(h.total).toLocaleString("ru-RU")}</td>
                        <td className="py-2 px-1 text-right">
                          {h.is_paid ? (
                            <span className="text-green-400 text-[10px] uppercase font-oswald">Выплачено</span>
                          ) : (
                            <button
                              onClick={() => h.id && markPaid(h.id)}
                              disabled={busy}
                              className="px-2 py-1 rounded bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] uppercase font-oswald hover:bg-[#FFD700]/25"
                            >
                              Выплатить
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
