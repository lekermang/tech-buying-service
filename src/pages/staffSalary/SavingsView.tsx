import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { SAVINGS_URL, fmt, type Goal, type Tip, type Overview } from "./savings.types";
import { GoalCard, TipCard } from "./SavingsGoalCard";
import { GoalModal, TransactionModal, DeleteGoalModal } from "./SavingsModals";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SavingsView({ token }: { token: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "tips" | "history">("goals");

  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`${SAVINGS_URL}?action=get_goals`, { headers: { "X-Employee-Token": token } }),
      fetch(`${SAVINGS_URL}?action=get_tips`, { headers: { "X-Employee-Token": token } }),
    ]);
    if (r1.ok) setData(await r1.json());
    if (r2.ok) { const d = await r2.json(); setTips(d.tips || []); }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="py-10 flex items-center justify-center gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
      <Icon name="Loader2" size={18} className="animate-spin" />
      <span className="font-roboto text-sm">Загрузка...</span>
    </div>
  );

  const activeGoals = data?.goals.filter(g => g.status === "active") ?? [];
  const doneGoals   = data?.goals.filter(g => g.status === "done") ?? [];
  const otherGoals  = data?.goals.filter(g => g.status === "paused" || g.status === "cancelled") ?? [];

  return (
    <div className="space-y-4 pb-6">
      {/* Шапка */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
            background: "linear-gradient(135deg,#a78bfa,#7c3aed)",
            boxShadow: "0 0 16px rgba(167,139,250,0.35)",
          }}>
            <Icon name="PiggyBank" size={17} className="text-white" />
          </div>
          <div>
            <div className="font-oswald font-black uppercase tracking-wide text-sm text-white">Копилка</div>
            <div className="font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>Накопления и цели</div>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-roboto text-sm font-bold transition-all active:scale-95"
          style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
          <Icon name="Plus" size={14} /> Новая цель
        </button>
      </div>

      {/* Общий баланс */}
      {data && (
        <div className="rounded-2xl p-4" style={{
          background: "linear-gradient(145deg,rgba(167,139,250,0.1),rgba(167,139,250,0.03))",
          border: "1.5px solid rgba(167,139,250,0.3)",
          boxShadow: "0 0 32px rgba(167,139,250,0.06)",
        }}>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(167,139,250,0.6)" }}>
                Всего накоплено
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#a78bfa" }}>
                {fmt(data.total_saved)} ₽
              </div>
            </div>
            <div className="text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(52,211,153,0.6)" }}>
                Заработано / 30 дн.
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#34d399" }}>
                {fmt(data.earned_30d)} ₽
              </div>
            </div>
            <div className="text-center">
              <div className="font-roboto text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,215,0,0.6)" }}>
                Активных целей
              </div>
              <div className="font-oswald font-black text-xl tabular-nums" style={{ color: "#FFD700" }}>
                {activeGoals.length}
              </div>
            </div>
          </div>

          {/* Подсказка если ничего нет */}
          {data.total_saved === 0 && (
            <div className="mt-3 pt-3 font-roboto text-xs text-center leading-relaxed" style={{
              color: "rgba(255,255,255,0.35)", borderTop: "1px solid rgba(255,255,255,0.06)",
            }}>
              💡 Создай первую цель и начни откладывать деньги — даже 500 ₽ в день дают 15 000 ₽ в месяц!
            </div>
          )}
        </div>
      )}

      {/* Вкладки */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { k: "goals",   label: "Цели",    icon: "Target" },
          { k: "tips",    label: "Советы",  icon: "Lightbulb" },
          { k: "history", label: "История", icon: "History" },
        ] as const).map(({ k, label, icon }) => (
          <button key={k} onClick={() => setActiveTab(k)}
            className="flex-1 py-1.5 rounded-lg font-roboto text-xs font-semibold transition-all flex items-center justify-center gap-1"
            style={{
              background: activeTab === k ? "rgba(167,139,250,0.18)" : "transparent",
              color: activeTab === k ? "#a78bfa" : "rgba(255,255,255,0.4)",
              border: activeTab === k ? "1px solid rgba(167,139,250,0.35)" : "1px solid transparent",
            }}>
            <Icon name={icon} size={12} />{label}
          </button>
        ))}
      </div>

      {/* ── ЦЕЛИ ── */}
      {activeTab === "goals" && (
        <div className="space-y-3">
          {activeGoals.length === 0 && doneGoals.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-5xl">🎯</div>
              <div className="font-oswald font-bold text-white text-lg">Нет активных целей</div>
              <div className="font-roboto text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
                Создай первую цель — телефон, ноутбук, отпуск или подушка безопасности. Конкретная цель мотивирует копить!
              </div>
              <button onClick={() => setCreateOpen(true)}
                className="mx-auto flex items-center gap-2 px-5 py-2.5 rounded-xl font-roboto font-bold text-sm transition-all active:scale-95"
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <Icon name="Plus" size={14} /> Создать первую цель
              </button>
            </div>
          ) : (
            <>
              {activeGoals.map(g => (
                <GoalCard key={g.id} goal={g}
                  onDeposit={setDepositGoal}
                  onWithdraw={setWithdrawGoal}
                  onEdit={setEditGoal}
                  onDelete={setDeleteGoal}
                />
              ))}
              {doneGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-2" style={{ color: "rgba(52,211,153,0.5)" }}>
                    ✓ Выполненные цели
                  </div>
                  {doneGoals.map(g => (
                    <GoalCard key={g.id} goal={g}
                      onDeposit={setDepositGoal}
                      onWithdraw={setWithdrawGoal}
                      onEdit={setEditGoal}
                      onDelete={setDeleteGoal}
                    />
                  ))}
                </>
              )}
              {otherGoals.length > 0 && (
                <>
                  <div className="font-roboto text-[10px] uppercase tracking-widest pt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
                    На паузе / отменены
                  </div>
                  {otherGoals.map(g => (
                    <GoalCard key={g.id} goal={g}
                      onDeposit={setDepositGoal}
                      onWithdraw={setWithdrawGoal}
                      onEdit={setEditGoal}
                      onDelete={setDeleteGoal}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── СОВЕТЫ ── */}
      {activeTab === "tips" && (
        <div className="space-y-2">
          {tips.length === 0 ? (
            <div className="py-8 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Советы загружаются...
            </div>
          ) : (
            <>
              <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                Нажми на совет чтобы раскрыть
              </div>
              {tips.map((t, i) => <TipCard key={i} tip={t} />)}

              <div className="rounded-xl p-4 mt-2" style={{
                background: "rgba(255,215,0,0.05)", border: "1px solid rgba(255,215,0,0.15)",
              }}>
                <div className="font-roboto text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <span className="font-bold text-yellow-400">Помни:</span> Накопления — это не про ограничения. Это про свободу. Когда у тебя есть финансовая подушка, ты можешь говорить "нет" неудобным ситуациям и "да" — хорошим возможностям.
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ИСТОРИЯ ── */}
      {activeTab === "history" && (
        <div className="space-y-1.5">
          {!data?.recent_tx.length ? (
            <div className="py-8 text-center font-roboto text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
              Транзакций ещё нет
            </div>
          ) : (
            data.recent_tx.map(tx => {
              const isPos = tx.amount > 0;
              const d = new Date(tx.created_at);
              const label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
              const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl px-3 py-3" style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: isPos ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)" }}>
                      {tx.goal_emoji || (isPos ? "+" : "−")}
                    </div>
                    <div>
                      <div className="font-roboto text-sm text-white">
                        {tx.goal_title || "Общая копилка"}
                      </div>
                      <div className="flex items-center gap-1.5 font-roboto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        <span>{label}</span>
                        <span>·</span>
                        <span>{time}</span>
                        {tx.note && <><span>·</span><span className="italic">{tx.note}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="font-oswald font-bold tabular-nums shrink-0"
                    style={{ color: isPos ? "#34d399" : "#f87171" }}>
                    {isPos ? "+" : "−"}{fmt(Math.abs(tx.amount))} ₽
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Модалки */}
      {createOpen && (
        <GoalModal goal={null} token={token} onClose={() => setCreateOpen(false)} onSave={load} />
      )}
      {editGoal && (
        <GoalModal goal={editGoal} token={token} onClose={() => setEditGoal(null)} onSave={load} />
      )}
      {depositGoal && (
        <TransactionModal goal={depositGoal} mode="deposit" token={token}
          onClose={() => setDepositGoal(null)} onDone={load} />
      )}
      {withdrawGoal && (
        <TransactionModal goal={withdrawGoal} mode="withdraw" token={token}
          onClose={() => setWithdrawGoal(null)} onDone={load} />
      )}
      {deleteGoal && (
        <DeleteGoalModal goal={deleteGoal} token={token}
          onClose={() => setDeleteGoal(null)} onDeleted={load} />
      )}
    </div>
  );
}