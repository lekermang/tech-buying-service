import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";

interface Props {
  token: string;
  employeeName: string;
}

type TodayState = {
  config: { daily_rate: number; bonus_percent: number };
  today_total: number | null;
  total_earned: number;
  total_paid: number;
  remaining: number;
};

type DayRow = { shift_date: string; hours_worked: number; total: number };
type PayoutRow = { id: number; payout_date: string; amount: number; note: string | null };

export default function EmployeeSalaryView({ token, employeeName }: Props) {
  const [state, setState] = useState<TodayState | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch(`${SALARY_URL}?action=my_today`, { headers: { "X-Employee-Token": token } }),
      fetch(`${SALARY_URL}?action=my_history`, { headers: { "X-Employee-Token": token } }),
    ]);
    if (r1.ok) setState(await r1.json());
    if (r2.ok) {
      const d = await r2.json();
      setDays(d.days || []);
      setPayouts(d.payouts || []);
    }
  }, [token]);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  if (loading || !state) {
    return <div className="p-6 text-center text-white/50">Загрузка...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="text-center">
        <h2 className="font-oswald font-bold text-2xl text-white uppercase tracking-wide">Моя зарплата</h2>
        <p className="text-white/50 text-sm mt-1 font-roboto">{employeeName}</p>
      </div>

      <div className="rounded-2xl border border-[#FFD700]/30 bg-gradient-to-b from-[#FFD700]/8 to-transparent p-6 text-center">
        <div className="text-white/50 text-xs uppercase tracking-widest mb-1 font-oswald">К выплате</div>
        <div className="font-oswald text-5xl font-bold text-[#FFD700] tabular-nums my-2">
          {state.remaining.toLocaleString("ru-RU")} ₽
        </div>
        <div className="text-white/40 text-xs font-roboto">
          Заработано {state.total_earned.toLocaleString("ru-RU")} ₽ · Выплачено {state.total_paid.toLocaleString("ru-RU")} ₽
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-white/50 text-xs uppercase tracking-wide font-oswald">Сегодня</div>
          <div className="text-white font-bold text-2xl mt-1 font-oswald tabular-nums">
            {state.today_total != null ? `${state.today_total.toLocaleString("ru-RU")} ₽` : "—"}
          </div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-white/50 text-xs uppercase tracking-wide font-oswald">% с продаж</div>
          <div className="text-white font-bold text-2xl mt-1 font-oswald">{state.config.bonus_percent}%</div>
        </div>
      </div>

      <div>
        <h3 className="font-oswald font-bold text-lg text-white mb-3 uppercase tracking-wide">Доход по дням</h3>
        {days.length === 0 ? (
          <div className="text-white/40 text-sm text-center py-4 font-roboto">Пока нет начислений</div>
        ) : (
          <div className="space-y-2">
            {days.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-3">
                <div>
                  <div className="text-white text-sm font-medium font-roboto">
                    {new Date(h.shift_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
                  </div>
                  <div className="text-white/40 text-xs font-roboto">{Number(h.hours_worked).toFixed(1)} ч</div>
                </div>
                <div className="text-[#FFD700] font-bold font-oswald tabular-nums">
                  {Number(h.total).toLocaleString("ru-RU")} ₽
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {payouts.length > 0 && (
        <div>
          <h3 className="font-oswald font-bold text-lg text-white mb-3 uppercase tracking-wide">Выплаты</h3>
          <div className="space-y-2">
            {payouts.filter(p => p.amount > 0).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-green-500/5 border border-green-500/20 p-3">
                <div>
                  <div className="text-white text-sm font-medium font-roboto">
                    {new Date(p.payout_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
                  </div>
                  {p.note && <div className="text-white/40 text-xs font-roboto">{p.note}</div>}
                </div>
                <div className="text-green-300 font-bold font-oswald tabular-nums flex items-center gap-1">
                  <Icon name="ArrowDownLeft" size={14} />
                  {Number(p.amount).toLocaleString("ru-RU")} ₽
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
