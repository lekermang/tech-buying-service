import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";
import { isoLocal, type LogRow } from "./ownerSalaryTypes";

// === Модалка редактирования дня ===
export function DayEditModal({
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
export function PayoutModal({
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

// === Модалка массового заполнения дней по шаблону ===
export function BulkFillModal({
  open, employeeId, defaultRate, defaultPercent, token, onClose, onSaved,
}: {
  open: boolean;
  employeeId: number;
  defaultRate: number;
  defaultPercent: number;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hours, setHours] = useState("8");
  const [rate, setRate] = useState(String(defaultRate));
  const [autoBonus, setAutoBonus] = useState(true);
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [skipExisting, setSkipExisting] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(isoLocal(monthStart));
      setTo(isoLocal(now));
      setHours("8");
      setRate(String(defaultRate));
      setAutoBonus(true);
      setWeekdaysOnly(false);
      setSkipExisting(true);
    }
  }, [open, defaultRate]);

  if (!open) return null;

  const apply = async () => {
    if (!from || !to) { alert("Укажи даты"); return; }
    setBusy(true);
    try {
      const r = await fetch(`${SALARY_URL}?action=owner_bulk_fill`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          from, to,
          hours_worked: Number(hours) || 0,
          base_rate: Number(rate) || 0,
          auto_bonus: autoBonus,
          weekdays_only: weekdaysOnly,
          skip_existing: skipExisting,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        alert(`Заполнено: ${d.filled} дн., пропущено: ${d.skipped}`);
      } else {
        alert("Не удалось заполнить");
      }
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
          <h3 className="font-oswald font-bold text-white text-lg uppercase">Заполнить дни</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><Icon name="X" size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-white/50 text-[10px] uppercase font-oswald">С даты</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
          <label className="block">
            <span className="text-white/50 text-[10px] uppercase font-oswald">По дату</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
          <label className="block">
            <span className="text-white/50 text-[10px] uppercase font-oswald">Часов в день</span>
            <input type="number" step="0.1" value={hours} onChange={e => setHours(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
          <label className="block">
            <span className="text-white/50 text-[10px] uppercase font-oswald">Ставка, ₽</span>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-black/40 border border-white/15 text-white font-roboto" />
          </label>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoBonus} onChange={e => setAutoBonus(e.target.checked)} className="w-4 h-4 accent-[#FFD700]" />
          <span className="text-white/80 text-sm font-roboto">Авто-бонус {defaultPercent}% от продаж Смарт-Ломбарда</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={weekdaysOnly} onChange={e => setWeekdaysOnly(e.target.checked)} className="w-4 h-4 accent-[#FFD700]" />
          <span className="text-white/80 text-sm font-roboto">Только будни (Пн–Пт)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={skipExisting} onChange={e => setSkipExisting(e.target.checked)} className="w-4 h-4 accent-[#FFD700]" />
          <span className="text-white/80 text-sm font-roboto">Не трогать уже заполненные дни</span>
        </label>
        <div className="text-white/40 text-xs font-roboto">
          Выходные (отмеченные тобой) пропускаются всегда.
        </div>
        <button onClick={apply} disabled={busy}
          className="w-full py-2 rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black font-oswald font-bold uppercase tracking-wide text-sm disabled:opacity-50">
          {busy ? "Заполняю..." : "Заполнить"}
        </button>
      </div>
    </div>
  );
}
