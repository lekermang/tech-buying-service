import { useEffect, useState, useRef } from "react";
import { SALARY_URL } from "@/pages/staff.types";
import Icon from "@/components/ui/icon";

interface Debt {
  id: number;
  amount: number;
  reason: string;
  comment: string | null;
  created_at: string;
}

interface Props {
  token: string;
}

const CORNERS = [
  { bottom: "80px", left: "12px", top: "auto", right: "auto" },
  { bottom: "80px", right: "12px", top: "auto", left: "auto" },
  { top: "70px", left: "12px", bottom: "auto", right: "auto" },
  { top: "70px", right: "12px", bottom: "auto", left: "auto" },
];

export default function DebtBouncer({ token }: Props) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [corner, setCorner] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${SALARY_URL}?action=my_debts`, {
      headers: { "X-Employee-Token": token },
    })
      .then(r => r.json())
      .then(d => {
        if (d.debts && d.debts.length > 0) {
          setDebts(d.debts);
          setTotalDebt(d.total_debt || 0);
        }
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (debts.length === 0 || expanded) return;
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCorner(c => (c + 1) % CORNERS.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [debts.length, expanded]);

  if (debts.length === 0) return null;

  const pos = CORNERS[corner];

  return (
    <div
      className="fixed z-[9999] transition-all duration-300"
      style={{
        ...pos,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.3s, transform 0.3s",
      }}
    >
      {!expanded ? (
        <button
          onClick={() => { setExpanded(true); if (intervalRef.current) clearInterval(intervalRef.current); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs font-bold shadow-2xl animate-pulse"
          style={{
            background: "linear-gradient(135deg, #dc2626, #991b1b)",
            border: "1.5px solid rgba(248,113,113,0.5)",
            color: "#fff",
            boxShadow: "0 0 18px rgba(220,38,38,0.6), 0 4px 12px rgba(0,0,0,0.5)",
            maxWidth: "180px",
          }}
        >
          <Icon name="AlertTriangle" size={14} className="shrink-0 text-red-200" />
          <span className="leading-tight">Долг: {totalDebt.toLocaleString("ru-RU")} ₽</span>
        </button>
      ) : (
        <div
          className="rounded-xl overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #1a0505, #2d0808)",
            border: "1.5px solid rgba(220,38,38,0.4)",
            boxShadow: "0 0 24px rgba(220,38,38,0.4), 0 8px 24px rgba(0,0,0,0.7)",
            width: "260px",
          }}
        >
          {/* Шапка */}
          <div className="flex items-center justify-between px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.12)" }}>
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={14} className="text-red-400" />
              <span className="font-oswald font-bold text-sm text-red-300 uppercase tracking-wide">
                Долг к возврату
              </span>
            </div>
            <button onClick={() => setExpanded(false)}
              className="text-white/40 hover:text-white/70 transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>

          {/* Список долгов */}
          <div className="px-3 py-2 space-y-2 max-h-[280px] overflow-y-auto">
            {debts.map(d => (
              <div key={d.id} className="rounded-lg p-2.5"
                style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.18)" }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-roboto text-xs text-white/80 leading-tight">{d.reason}</span>
                  <span className="font-oswald font-bold text-sm text-red-300 whitespace-nowrap shrink-0">
                    {Number(d.amount).toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                {d.comment && (
                  <div className="mt-1.5 px-2 py-1 rounded-md"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="font-roboto text-[10px] text-white/50 leading-tight block">
                      💬 {d.comment}
                    </span>
                  </div>
                )}
                <div className="mt-1 font-roboto text-[9px] text-white/25">
                  {new Date(d.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            ))}
          </div>

          {/* Итого */}
          <div className="px-3 py-2.5 flex items-center justify-between"
            style={{ borderTop: "1px solid rgba(220,38,38,0.2)", background: "rgba(220,38,38,0.08)" }}>
            <span className="font-roboto text-xs text-white/50">Итого к возврату</span>
            <span className="font-oswald font-bold text-base text-red-300">
              {totalDebt.toLocaleString("ru-RU")} ₽
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
