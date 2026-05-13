import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";

interface Props {
  token: string;
  employeeName: string;
}

type TodayState = {
  config: { daily_rate: number; bonus_percent: number };
  shift: { id: number; started_at: string; ended_at: string | null; status: string } | null;
  today_total: number | null;
};

type HistoryRow = {
  shift_date: string;
  hours_worked: number;
  total: number;
  is_paid: boolean;
};

export default function EmployeeSalaryView({ token, employeeName }: Props) {
  const [state, setState] = useState<TodayState | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fetchState = useCallback(async () => {
    const r = await fetch(`${SALARY_URL}?action=my_today`, {
      headers: { "X-Employee-Token": token },
    });
    if (r.ok) setState(await r.json());
  }, [token]);

  const fetchHistory = useCallback(async () => {
    const r = await fetch(`${SALARY_URL}?action=my_history`, {
      headers: { "X-Employee-Token": token },
    });
    if (r.ok) {
      const d = await r.json();
      setHistory(d.history || []);
    }
  }, [token]);

  useEffect(() => {
    Promise.all([fetchState(), fetchHistory()]).finally(() => setLoading(false));
  }, [fetchState, fetchHistory]);

  // Таймер раз в секунду — только если смена открыта
  useEffect(() => {
    if (state?.shift?.status !== "open") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state?.shift?.status]);

  const startShift = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${SALARY_URL}?action=shift_start`, {
        method: "POST",
        headers: { "X-Employee-Token": token },
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        alert(d.message || "Не удалось открыть смену");
      }
      await fetchState();
    } finally {
      setBusy(false);
    }
  };

  const endShift = async () => {
    if (!confirm("Закончить смену? Зарплата за сегодня будет начислена.")) return;
    setBusy(true);
    try {
      const r = await fetch(`${SALARY_URL}?action=shift_end`, {
        method: "POST",
        headers: { "X-Employee-Token": token },
      });
      if (r.ok) {
        const d = await r.json();
        if (!d.reached_minimum) {
          alert(
            `Смена закрыта. Отработано ${Number(d.hours_worked).toFixed(1)} ч — это меньше полной смены, ставка не зачлась. Начислено: ${Number(d.total).toLocaleString("ru-RU")} ₽`,
          );
        } else {
          alert(`Смена закрыта! Заработано ${Number(d.total).toLocaleString("ru-RU")} ₽`);
        }
      }
      await Promise.all([fetchState(), fetchHistory()]);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !state) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  const shift = state.shift;
  const isOpen = shift?.status === "open";
  const isClosed = shift?.status === "closed";
  const isDayoff = shift?.status === "dayoff";

  let elapsed = "00:00:00";
  if (isOpen && shift?.started_at) {
    const diff = Math.max(0, Math.floor((now - new Date(shift.started_at).getTime()) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const s = String(diff % 60).padStart(2, "0");
    elapsed = `${h}:${m}:${s}`;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Моя зарплата</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">{employeeName}</p>
      </div>

      {/* Центральная карточка — состояние смены */}
      <div className="rounded-2xl border border-[#FFD700]/30 bg-gradient-to-b from-[#FFD700]/5 to-transparent p-6 text-center">
        {isDayoff && (
          <>
            <Icon name="Sunrise" size={48} className="text-[#FFD700] mx-auto mb-3" />
            <div className="text-white text-lg font-bold font-oswald uppercase">Сегодня выходной</div>
            <div className="text-white/50 text-sm mt-1 font-roboto">Хорошего отдыха!</div>
          </>
        )}
        {!isDayoff && !shift && (
          <>
            <Icon name="Clock" size={48} className="text-[#FFD700] mx-auto mb-3" />
            <div className="text-white/70 mb-4 font-roboto">Смена ещё не открыта</div>
            <button
              onClick={startShift}
              disabled={busy}
              className="w-full bg-[#FFD700] hover:bg-[#FFE34D] text-black font-oswald font-bold text-lg py-3 rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Начать смену
            </button>
          </>
        )}
        {isOpen && (
          <>
            <div className="text-white/50 text-xs uppercase tracking-widest mb-1 font-oswald">Смена идёт</div>
            <div className="font-oswald text-5xl font-bold text-[#FFD700] tabular-nums my-3">{elapsed}</div>
            <div className="text-white/50 text-xs mb-4 font-roboto">
              с {new Date(shift!.started_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <button
              onClick={endShift}
              disabled={busy}
              className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-oswald font-bold py-3 rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Закончить смену
            </button>
          </>
        )}
        {isClosed && (
          <>
            <Icon name="CheckCircle2" size={48} className="text-green-400 mx-auto mb-3" />
            <div className="text-white/50 text-xs uppercase tracking-widest font-oswald">Заработано сегодня</div>
            <div className="font-oswald text-5xl font-bold text-[#FFD700] my-2">
              {state.today_total != null ? state.today_total.toLocaleString("ru-RU") : "—"} ₽
            </div>
            <div className="text-white/50 text-sm font-roboto">Смена закрыта</div>
          </>
        )}
      </div>

      {/* Личный % с продаж */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
        <div>
          <div className="text-white/50 text-xs uppercase tracking-wide font-oswald">Мой % с продаж</div>
          <div className="text-white font-bold text-2xl mt-1 font-oswald">{state.config.bonus_percent}%</div>
        </div>
        <Icon name="Percent" size={32} className="text-[#FFD700]" />
      </div>

      {/* История смен */}
      <div>
        <h3 className="font-oswald font-bold text-lg text-white mb-3 uppercase tracking-wide">История</h3>
        {history.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-4 font-roboto">Пока нет закрытых смен</div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-3"
              >
                <div>
                  <div className="text-white text-sm font-medium font-roboto">
                    {new Date(h.shift_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
                  </div>
                  <div className="text-white/40 text-xs font-roboto">{Number(h.hours_worked).toFixed(1)} ч</div>
                </div>
                <div className="text-right">
                  <div className="text-[#FFD700] font-bold font-oswald tabular-nums">
                    {Number(h.total).toLocaleString("ru-RU")} ₽
                  </div>
                  <div className={`text-xs font-roboto ${h.is_paid ? "text-green-400" : "text-white/40"}`}>
                    {h.is_paid ? "Выплачено" : "К выплате"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
