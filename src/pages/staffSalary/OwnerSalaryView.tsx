import { useEffect, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL, type EmployeeOverview } from "@/pages/staff.types";

interface Props {
  token: string;
}

type CalendarDay = { shift_date: string; status: "open" | "closed" | "dayoff" };

type LogRow = {
  id: number;
  shift_date: string;
  hours_worked: number;
  base_rate: number;
  personal_profit: number;
  bonus_percent_at_time: number;
  bonus_amount: number;
  total: number;
  owner_set: boolean;
};

type PayoutRow = {
  id: number;
  payout_date: string;
  amount: number;
  note: string | null;
};

type DetailState = {
  history: LogRow[];
  calendar: CalendarDay[];
  payouts: PayoutRow[];
  summary: { total_all: number; total_paid: number; total_unpaid: number };
};

const MONTHS = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const WEEKDAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

const isoLocal = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const statusDot = (s: EmployeeOverview["shift_status"]) => {
  if (s === "open") return { color: "bg-green-400", label: "В работе" };
  if (s === "closed") return { color: "bg-blue-400", label: "Закрыт" };
  if (s === "dayoff") return { color: "bg-white/30", label: "Выходной" };
  return { color: "bg-white/15", label: "Не отмечен" };
};

// === Модалка редактирования дня ===
function DayEditModal({
  open, day, employeeId, defaultRate, defaultPercent, currentLog, token,
  onClose, onSaved,
}: {
  open: boolean;
  day: string;
  employeeId: number;
  defaultRate: number;
  defaultPercent: number;
  currentLog: LogRow | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [hours, setHours] = useState("8");
  const [rate, setRate] = useState(String(defaultRate));
  const [bonus, setBonus] = useState("0");
  const [profit, setProfit] = useState("0");
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      if (currentLog) {
        setHours(String(currentLog.hours_worked || 0));
        setRate(String(currentLog.base_rate || 0));
        setBonus(String(currentLog.bonus_amount || 0));
        setProfit(String(currentLog.personal_profit || 0));
        setAuto(false);
      } else {
        setHours("8");
        setRate(String(defaultRate));
        setBonus("0");
        setProfit("0");
        setAuto(true);
      }
    }
  }, [open, currentLog, defaultRate]);

  if (!open) return null;

  const total = (Number(rate) || 0) + (auto ? 0 : (Number(bonus) || 0));

  const save = async () => {
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_set_day`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          date: day,
          hours_worked: Number(hours) || 0,
          base_rate: Number(rate) || 0,
          auto_bonus: auto,
          bonus_amount: auto ? 0 : (Number(bonus) || 0),
          personal_profit: auto ? 0 : (Number(profit) || 0),
        }),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const clearDay = async () => {
    if (!confirm("Обнулить начисление за этот день?")) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_delete_day`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, date: day }),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const setDayoff = async () => {
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_set_dayoff`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, date: day, is_dayoff: true }),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0D0D0D] border border-[#FFD700]/30 p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-oswald font-bold text-white text-lg uppercase">
            {new Date(day).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><Icon name="X" size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="text-white/50 text-[10px] uppercase font-oswald">Часы</span>
            <input type="number" step="0.1" value={hours} onChange={e => setHours(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
          <label>
            <span className="text-white/50 text-[10px] uppercase font-oswald">Ставка, ₽</span>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="w-4 h-4 accent-[#FFD700]" />
          <span className="text-white/80 text-sm font-roboto">
            Бонус автоматом: {defaultPercent}% от продаж в Смарт-Ломбарде за этот день
          </span>
        </label>

        {!auto && (
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-white/50 text-[10px] uppercase font-oswald">Прибыль за день, ₽</span>
              <input type="number" value={profit} onChange={e => setProfit(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
            </label>
            <label>
              <span className="text-white/50 text-[10px] uppercase font-oswald">Бонус, ₽</span>
              <input type="number" value={bonus} onChange={e => setBonus(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
            </label>
          </div>
        )}

        {!auto && (
          <div className="text-white/60 text-sm font-roboto">
            Итого за день: <span className="text-[#FFD700] font-bold font-oswald">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
        )}
        {auto && (
          <div className="text-white/50 text-xs font-roboto">
            Итог посчитается при сохранении: ставка + {defaultPercent}% от прибыли Смарт-Ломбарда.
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={busy}
            className="flex-1 py-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-50">
            Сохранить
          </button>
          <button onClick={setDayoff} disabled={busy}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 font-oswald uppercase tracking-wide text-xs disabled:opacity-50">
            Выходной
          </button>
          {currentLog && (
            <button onClick={clearDay} disabled={busy}
              className="px-3 py-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 font-oswald uppercase tracking-wide text-xs disabled:opacity-50">
              Обнулить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// === Модалка добавления выплаты ===
function PayoutModal({
  open, employeeId, token, onClose, onSaved,
}: {
  open: boolean;
  employeeId: number;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [day, setDay] = useState(isoLocal(new Date()));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setDay(isoLocal(new Date()));
      setAmount("");
      setNote("");
    }
  }, [open]);

  if (!open) return null;

  const save = async () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) { alert("Введите сумму больше нуля"); return; }
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_add_payout`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, date: day, amount: amt, note: note || null }),
      });
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[#0D0D0D] border border-green-500/30 p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-oswald font-bold text-white text-lg uppercase">Записать выплату</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><Icon name="X" size={18} /></button>
        </div>
        <label className="block">
          <span className="text-white/50 text-[10px] uppercase font-oswald">Дата выплаты</span>
          <input type="date" value={day} onChange={e => setDay(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
        </label>
        <label className="block">
          <span className="text-white/50 text-[10px] uppercase font-oswald">Сумма, ₽</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="например 20000"
            className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
        </label>
        <label className="block">
          <span className="text-white/50 text-[10px] uppercase font-oswald">Заметка (необяз.)</span>
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder="наличные, аванс и т.п."
            className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
        </label>
        <button onClick={save} disabled={busy}
          className="w-full py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-50">
          Записать выплату
        </button>
      </div>
    </div>
  );
}

export default function OwnerSalaryView({ token }: Props) {
  const [employees, setEmployees] = useState<EmployeeOverview[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [editing, setEditing] = useState<{ daily_rate: string; bonus_percent: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [dayEdit, setDayEdit] = useState<{ date: string; log: LogRow | null } | null>(null);
  const [payoutOpen, setPayoutOpen] = useState(false);

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

  const reloadAfterChange = async () => {
    if (selected) {
      await fetchDetail(selected.id, viewMonth);
      await fetchOverview();
    }
  };

  const deletePayout = async (id: number) => {
    if (!confirm("Отменить эту выплату?")) return;
    setBusy(true);
    try {
      await fetch(`${SALARY_URL}?action=owner_delete_payout`, {
        method: "POST",
        headers,
        body: JSON.stringify({ payout_id: id }),
      });
      await reloadAfterChange();
    } finally {
      setBusy(false);
    }
  };

  const goPrevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goCurrentMonth = () => setViewMonth(startOfMonth(new Date()));

  // Сетка месяца, понедельник-первый
  const monthGrid = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const daysInMonth = last.getDate();
    const firstWd = (first.getDay() + 6) % 7;
    type Cell = { date: string | null; status: CalendarDay["status"] | null; total: number; payout: number };
    const cells: Cell[] = [];
    const calMap = new Map((detail?.calendar || []).map(d => [d.shift_date.slice(0, 10), d.status]));
    const logMap = new Map((detail?.history || []).map(l => [l.shift_date.slice(0, 10), l.total || 0]));
    const payMap = new Map<string, number>();
    for (const p of detail?.payouts || []) {
      const k = p.payout_date.slice(0, 10);
      payMap.set(k, (payMap.get(k) || 0) + (p.amount || 0));
    }
    for (let i = 0; i < firstWd; i++) cells.push({ date: null, status: null, total: 0, payout: 0 });
    for (let d = 1; d <= daysInMonth; d++) {
      const cur = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
      const iso = isoLocal(cur);
      cells.push({
        date: iso,
        status: calMap.get(iso) || null,
        total: logMap.get(iso) || 0,
        payout: payMap.get(iso) || 0,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, status: null, total: 0, payout: 0 });
    return cells;
  }, [viewMonth, detail]);

  const monthSummary = useMemo(() => {
    if (!detail) return { earned: 0, paid: 0, remaining: 0 };
    const from = isoLocal(startOfMonth(viewMonth));
    const to = isoLocal(endOfMonth(viewMonth));
    let earned = 0;
    for (const h of detail.history) {
      const d = h.shift_date.slice(0, 10);
      if (d >= from && d <= to) earned += Number(h.total) || 0;
    }
    let paid = 0;
    for (const p of detail.payouts) {
      const d = p.payout_date.slice(0, 10);
      if (d >= from && d <= to) paid += Number(p.amount) || 0;
    }
    return { earned, paid, remaining: earned - paid };
  }, [detail, viewMonth]);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return now.getFullYear() === viewMonth.getFullYear() && now.getMonth() === viewMonth.getMonth();
  }, [viewMonth]);

  const todayIso = isoLocal(new Date());
  const logByDate = useMemo(() => {
    const m = new Map<string, LogRow>();
    for (const h of detail?.history || []) m.set(h.shift_date.slice(0, 10), h);
    return m;
  }, [detail]);

  if (loading) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  // === ЭКРАН СПИСКА ===
  if (!selectedId) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Зарплаты</h2>
          <p className="text-white/50 text-sm mt-1 font-roboto">Полное управление: смены, выходные, выплаты</p>
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

  // === ЭКРАН ДЕТАЛЕЙ ===
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
          {/* Шапка */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-oswald font-bold text-xl text-white">{selected.full_name}</div>
                <div className="text-white/40 text-xs font-roboto">{selected.position || selected.role} · @{selected.login}</div>
              </div>
              {!editing && (
                <button onClick={beginEdit}
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
                    onChange={e => setEditing({ ...editing, daily_rate: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
                </label>
                <label>
                  <span className="text-white/50 text-xs uppercase font-oswald">% с продаж</span>
                  <input type="number" step="0.1" value={editing.bonus_percent}
                    onChange={e => setEditing({ ...editing, bonus_percent: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
                </label>
                <div className="sm:col-span-2 flex gap-2">
                  <button onClick={saveConfig} disabled={busy}
                    className="flex-1 py-2 rounded-lg bg-[#FFD700] text-black font-oswald font-bold uppercase text-sm disabled:opacity-50">Сохранить</button>
                  <button onClick={() => setEditing(null)}
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

          {/* Сводки */}
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
                    onClick={() => cell.date && setDayEdit({ date: cell.date, log: logByDate.get(cell.date) || null })}
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
                    {cell.payout > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-400" title={`Выплата ${cell.payout} ₽`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-white/50 font-roboto">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/40" />Рабочий день</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-white/20" />Выходной</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" />Выплата</span>
              <span className="text-white/35">Клик по дню — вписать часы и сумму</span>
            </div>
          </div>

          {/* Сводка месяца */}
          <div className="rounded-xl border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/8 to-transparent p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-6 text-sm font-roboto">
                <div><div className="text-white/40 text-[10px] uppercase font-oswald">Начислено в {MONTHS[viewMonth.getMonth()].toLowerCase()}</div>
                  <div className="text-white font-bold tabular-nums font-oswald text-lg">{monthSummary.earned.toLocaleString("ru-RU")} ₽</div></div>
                <div><div className="text-green-300/60 text-[10px] uppercase font-oswald">Выплачено</div>
                  <div className="text-green-300 font-bold tabular-nums font-oswald text-lg">{monthSummary.paid.toLocaleString("ru-RU")} ₽</div></div>
                <div><div className="text-[#FFD700]/70 text-[10px] uppercase font-oswald">Остаток</div>
                  <div className="text-[#FFD700] font-bold tabular-nums font-oswald text-lg">{monthSummary.remaining.toLocaleString("ru-RU")} ₽</div></div>
              </div>
              <button onClick={() => setPayoutOpen(true)}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-400 text-black font-oswald font-bold uppercase tracking-wide text-sm flex items-center gap-1.5">
                <Icon name="Plus" size={14} />
                Записать выплату
              </button>
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
                      <button onClick={() => deletePayout(p.id)} disabled={busy}
                        className="text-white/30 hover:text-red-400" title="Отменить">
                        <Icon name="X" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Модалки */}
      {dayEdit && selected && (
        <DayEditModal
          open={!!dayEdit}
          day={dayEdit.date}
          employeeId={selected.id}
          defaultRate={selected.daily_rate}
          defaultPercent={selected.bonus_percent}
          currentLog={dayEdit.log}
          token={token}
          onClose={() => setDayEdit(null)}
          onSaved={reloadAfterChange}
        />
      )}
      {selected && (
        <PayoutModal
          open={payoutOpen}
          employeeId={selected.id}
          token={token}
          onClose={() => setPayoutOpen(false)}
          onSaved={reloadAfterChange}
        />
      )}
    </div>
  );
}
