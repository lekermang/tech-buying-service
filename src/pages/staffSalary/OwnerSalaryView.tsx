import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL, type EmployeeOverview, type SalaryLogEntry } from "@/pages/staff.types";

interface Props {
  token: string;
}

type CalendarDay = { shift_date: string; status: "open" | "closed" | "dayoff" };

type DetailState = {
  history: SalaryLogEntry[];
  calendar: CalendarDay[];
};

function fmtShortDate(s: string) {
  return new Date(s).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

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

  const fetchDetail = useCallback(async (empId: number) => {
    const r = await fetch(`${SALARY_URL}?action=owner_employee_detail&employee_id=${empId}`, {
      headers: { "X-Employee-Token": token },
    });
    if (r.ok) setDetail(await r.json());
  }, [token]);

  useEffect(() => {
    fetchOverview().finally(() => setLoading(false));
  }, [fetchOverview]);

  useEffect(() => {
    if (selectedId) {
      setDetail(null);
      fetchDetail(selectedId);
    }
  }, [selectedId, fetchDetail]);

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
      await fetchDetail(selected.id);
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
      await fetchDetail(selected.id);
    } finally {
      setBusy(false);
    }
  };

  // === Календарь на 30 дней назад ===
  const last30Days = (() => {
    const days: { date: string; status: CalendarDay["status"] | null }[] = [];
    const map = new Map((detail?.calendar || []).map(d => [d.shift_date.slice(0, 10), d.status]));
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, status: map.get(iso) || null });
    }
    return days;
  })();

  if (loading) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  // === ЭКРАН СПИСКА СОТРУДНИКОВ ===
  if (!selectedId) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
          <p className="text-white/50 text-sm mt-1 font-roboto">Управление ставкой, % с продаж и графиком сотрудников</p>
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
                  onClick={() => setSelectedId(e.id)}
                  className="w-full text-left rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#FFD700]/30 p-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Аватар-инициалы */}
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
                  <input
                    type="number"
                    value={editing.daily_rate}
                    onChange={e => setEditing({ ...editing, daily_rate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto"
                  />
                </label>
                <label className="block">
                  <span className="text-white/50 text-xs uppercase tracking-wide font-oswald">% с продаж</span>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.bonus_percent}
                    onChange={e => setEditing({ ...editing, bonus_percent: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto"
                  />
                </label>
                <div className="sm:col-span-2 flex gap-2">
                  <button
                    onClick={saveConfig}
                    disabled={busy}
                    className="flex-1 py-2 rounded-lg bg-[#FFD700] text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-50"
                  >
                    Сохранить
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 py-2 rounded-lg bg-white/10 text-white/70 font-oswald uppercase tracking-wide text-sm"
                  >
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

          {/* Календарь 30 дней */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-3">Календарь смен (30 дней)</div>
            <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
              {last30Days.slice().reverse().map(d => {
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                const isPast = new Date(d.date) < new Date(new Date().toISOString().slice(0, 10));
                const color =
                  d.status === "open" ? "bg-green-500/30 border-green-400/50 text-green-200"
                  : d.status === "closed" ? "bg-blue-500/20 border-blue-400/40 text-blue-200"
                  : d.status === "dayoff" ? "bg-white/10 border-white/20 text-white/40"
                  : "bg-black/30 border-white/10 text-white/40";
                const canToggle = d.status !== "closed" && !isPast;
                return (
                  <button
                    key={d.date}
                    onClick={() => canToggle && toggleDayoff(d.date, d.status !== "dayoff")}
                    disabled={!canToggle || busy}
                    title={canToggle ? (d.status === "dayoff" ? "Снять выходной" : "Отметить выходным") : "Закрытые смены и прошлые дни не меняются"}
                    className={`aspect-square rounded-md border ${color} text-[10px] font-oswald tabular-nums flex flex-col items-center justify-center ${canToggle ? "hover:scale-105 cursor-pointer" : "cursor-not-allowed opacity-70"} ${isToday ? "ring-2 ring-[#FFD700]/60" : ""}`}
                  >
                    <span className="font-bold">{fmtShortDate(d.date)}</span>
                    {d.status === "dayoff" && <Icon name="Sunrise" size={9} />}
                    {d.status === "closed" && <Icon name="Check" size={9} />}
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

          {/* История зарплат с расчётом */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-3">История зарплат</div>
            {!detail ? (
              <div className="text-white/40 text-center py-4 font-roboto">Загрузка...</div>
            ) : detail.history.length === 0 ? (
              <div className="text-white/40 text-center py-4 font-roboto">Нет закрытых смен</div>
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
                    {detail.history.map(h => (
                      <tr key={h.id} className="border-t border-white/5">
                        <td className="py-2 px-1 text-white/80 whitespace-nowrap">{fmtShortDate(h.shift_date)}</td>
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
