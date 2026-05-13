import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";

type State = {
  today_total: number | null;
  remaining: number;
} | null;

interface Props {
  token: string;
}

export default function EmployeeShiftMiniWidget({ token }: Props) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${SALARY_URL}?action=my_today`, { headers: { "X-Employee-Token": token } })
      .then(r => (r.ok ? r.json() : null))
      .then(setState)
      .catch(() => {});
  }, [token]);

  if (!state) return null;
  const hasToday = state.today_total != null && state.today_total > 0;
  if (!hasToday && state.remaining <= 0) return null;

  return (
    <div className="rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 px-3 py-2 flex items-center gap-3 mb-3">
      <Icon name="Wallet" size={18} className="text-[#FFD700]" />
      <div className="flex-1 min-w-0">
        <div className="text-white/50 text-[10px] uppercase tracking-widest font-oswald">
          {hasToday ? "Сегодня заработано" : "К выплате"}
        </div>
        <div className="text-[#FFD700] font-bold tabular-nums font-oswald">
          {hasToday
            ? `${Number(state.today_total).toLocaleString("ru-RU")} ₽`
            : `${state.remaining.toLocaleString("ru-RU")} ₽`}
        </div>
      </div>
      <a href="/staff?tab=salary" className="text-[#FFD700] text-xs underline font-roboto">Открыть</a>
    </div>
  );
}
