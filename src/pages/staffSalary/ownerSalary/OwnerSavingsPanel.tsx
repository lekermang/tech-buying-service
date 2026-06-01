import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const SAVINGS_URL = "https://functions.poehali.dev/4b6d2cd3-a8ca-4aac-aec2-ba9664b21b07";
const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  emoji: string;
  color: string;
  deadline: string | null;
  status: "active" | "done" | "paused" | "cancelled";
  auto_save_percent: number;
  deposited: number;
  withdrawn: number;
  tx_count: number;
};

type Tx = {
  id: number;
  amount: number;
  note: string | null;
  source: string;
  created_at: string;
  goal_title: string | null;
  goal_emoji: string | null;
};

export default function OwnerSavingsPanel({
  employeeId,
  employeeName,
  token,
}: {
  employeeId: number;
  employeeName: string;
  token: string;
}) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [recentTx, setRecentTx] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"goals" | "history">("goals");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(
      `${SAVINGS_URL}?action=owner_employee_goals&employee_id=${employeeId}`,
      { headers: { "X-Employee-Token": token } },
    );
    if (r.ok) {
      const d = await r.json();
      setGoals(d.goals || []);
      setTotalSaved(d.total_saved || 0);
      setRecentTx(d.recent_tx || []);
    }
    setLoading(false);
  }, [employeeId, token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="py-8 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
      <Icon name="Loader2" size={16} className="animate-spin" />
      <span className="font-roboto text-sm">Загрузка копилки...</span>
    </div>
  );

  const activeGoals = goals.filter(g => g.status === "active");
  const doneGoals = goals.filter(g => g.status === "done");
  const otherGoals = goals.filter(g => g.status === "paused" || g.status === "cancelled");

  return (
    <div className="space-y-4">
      {/* Шапка копилки */}
      <div className="rounded-xl p-4" style={{
        background: "linear-gradient(145deg,rgba(167,139,250,0.1),rgba(167,139,250,0.03))",
        border: "1.5px solid rgba(167,139,250,0.25)",
      }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
            }}>
              <Icon name="PiggyBank" size={16} className="text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white">Копилка {employeeName}</div>
              <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                только просмотр
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-roboto text-[10px] uppercase tracking-widest" style={{ color: "rgba(167,139,250,0.6)" }}>
              Всего накоплено
            </div>
            <div className="font-oswald font-black text-2xl tabular-nums" style={{ color: "#a78bfa" }}>
              {fmt(totalSaved)} ₽
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-3 pt-3 grid grid-cols-3 gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-center">
            <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.5)" }}>
              Активных
            </div>
            <div className="font-oswald font-bold text-lg" style={{ color: "#FFD700" }}>
              {activeGoals.length}
            </div>
          </div>
          <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.5)" }}>
              Выполнено
            </div>
            <div className="font-oswald font-bold text-lg" style={{ color: "#34d399" }}>
              {doneGoals.length}
            </div>
          </div>
          <div className="text-center">
            <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Операций
            </div>
            <div className="font-oswald font-bold text-lg text-white">
              {recentTx.length}
            </div>
          </div>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="text-4xl">🎯</div>
          <div className="font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            У {employeeName} пока нет целей накопления
          </div>
        </div>
      ) : (
        <>
          {/* Вкладки */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {([
              { k: "goals", label: "Цели", icon: "Target" },
              { k: "history", label: "История", icon: "History" },
            ] as const).map(({ k, label, icon }) => (
              <button key={k} onClick={() => setTab(k)}
                className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1"
                style={{
                  background: tab === k ? "rgba(167,139,250,0.18)" : "transparent",
                  color: tab === k ? "#a78bfa" : "rgba(255,255,255,0.4)",
                  border: tab === k ? "1px solid rgba(167,139,250,0.35)" : "1px solid transparent",
                }}>
                <Icon name={icon} size={12} />{label}
              </button>
            ))}
          </div>

          {/* ── ЦЕЛИ ── */}
          {tab === "goals" && (
            <div className="space-y-3">
              {activeGoals.map(g => <GoalRow key={g.id} goal={g} />)}
              {doneGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-1" style={{ color: "rgba(52,211,153,0.5)" }}>
                    ✓ Выполненные
                  </div>
                  {doneGoals.map(g => <GoalRow key={g.id} goal={g} />)}
                </>
              )}
              {otherGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                    На паузе / отменены
                  </div>
                  {otherGoals.map(g => <GoalRow key={g.id} goal={g} />)}
                </>
              )}
            </div>
          )}

          {/* ── ИСТОРИЯ ── */}
          {tab === "history" && (
            <div className="space-y-1.5">
              {recentTx.length === 0 ? (
                <div className="py-6 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Транзакций нет
                </div>
              ) : recentTx.map(tx => {
                const isPos = tx.amount > 0;
                const d = new Date(tx.created_at);
                const label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
                const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                        style={{ background: isPos ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)" }}>
                        {tx.goal_emoji || (isPos ? "+" : "−")}
                      </div>
                      <div>
                        <div className="font-roboto text-sm text-white">{tx.goal_title || "Общая"}</div>
                        <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {label} · {time}{tx.note ? ` · ${tx.note}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="font-oswald font-bold tabular-nums"
                      style={{ color: isPos ? "#34d399" : "#f87171" }}>
                      {isPos ? "+" : "−"}{fmt(Math.abs(tx.amount))} ₽
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const pct = goal.target_amount > 0
    ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
    : 0;
  const isDone = goal.status === "done";
  const isPaused = goal.status === "paused";

  let daysLeft: number | null = null;
  if (goal.deadline) {
    daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
  }

  return (
    <div className="rounded-xl px-4 py-3" style={{
      background: isDone ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.03)",
      border: isDone ? "1px solid rgba(52,211,153,0.25)" : `1px solid ${goal.color}25`,
      opacity: isPaused ? 0.65 : 1,
    }}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl shrink-0">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-oswald font-bold text-sm text-white truncate">{goal.title}</span>
            {isDone && (
              <span className="text-[9px] font-roboto font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>✓ Выполнено</span>
            )}
            {isPaused && (
              <span className="text-[9px] font-roboto px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }}>⏸ Пауза</span>
            )}
          </div>
          {goal.description && (
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{goal.description}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-oswald font-bold text-base tabular-nums" style={{ color: isDone ? "#34d399" : goal.color }}>
            {fmt(goal.current_amount)} ₽
          </div>
          <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            из {fmt(goal.target_amount)} ₽
          </div>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-full rounded-full" style={{
          width: `${pct}%`,
          background: isDone
            ? "linear-gradient(90deg,#34d399,#6ee7b7)"
            : `linear-gradient(90deg,${goal.color},${goal.color}88)`,
        }} />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          {pct}% · {goal.tx_count} операций
        </span>
        {daysLeft !== null && (
          <span className="font-roboto text-[10px]" style={{
            color: daysLeft < 0 ? "#f87171" : daysLeft < 7 ? "#fb923c" : "rgba(255,255,255,0.25)",
          }}>
            {daysLeft > 0 ? `${daysLeft} дн. до срока` : daysLeft === 0 ? "Срок сегодня" : "Срок истёк"}
          </span>
        )}
      </div>
    </div>
  );
}
