import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SALARY_URL } from "@/pages/staff.types";

type State = {
  shift: { id: number; started_at: string; status: string } | null;
  today_total: number | null;
} | null;

interface Props {
  token: string;
}

export default function EmployeeShiftMiniWidget({ token }: Props) {
  const [state, setState] = useState<State>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!token) return;
    fetch(`${SALARY_URL}?action=my_today`, { headers: { "X-Employee-Token": token } })
      .then(r => (r.ok ? r.json() : null))
      .then(setState)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (state?.shift?.status !== "open") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state?.shift?.status]);

  if (!state) return null;
  const sh = state.shift;
  if (!sh || sh.status === "dayoff") return null;

  if (sh.status === "open") {
    const diff = Math.floor((now - new Date(sh.started_at).getTime()) / 1000);
    const h = String(Math.floor(diff / 3600)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    return (
      <div className="rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 px-3 py-2 flex items-center gap-3 mb-3">
        <Icon name="Clock" size={18} className="text-[#FFD700]" />
        <div className="flex-1 min-w-0">
          <div className="text-white/50 text-[10px] uppercase tracking-widest font-oswald">В смене</div>
          <div className="text-[#FFD700] font-bold tabular-nums font-oswald">{h}:{m}</div>
        </div>
        <a href="/staff?tab=salary" className="text-[#FFD700] text-xs underline font-roboto">Открыть</a>
      </div>
    );
  }
  if (sh.status === "closed") {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 flex items-center gap-3 mb-3">
        <Icon name="CheckCircle2" size={18} className="text-green-400" />
        <div className="flex-1 text-white/70 text-sm font-roboto">
          Смена закрыта. Заработано: <span className="text-[#FFD700] font-bold">{state.today_total?.toLocaleString("ru-RU")} ₽</span>
        </div>
      </div>
    );
  }
  return null;
}
