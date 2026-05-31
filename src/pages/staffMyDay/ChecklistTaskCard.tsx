/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { STAFF_DAILY_URL, type ChecklistTask } from "./types";
import { AVITO_SYNC_URL } from "./taskCardShared";
import { RepairList, RepairCalls } from "./taskCardRepairBlocks";
import {
  AvitoSyncDetail,
  AvitoStaleList,
  AvitoPricesList,
  TodayBuyouts,
  IncompleteItems,
} from "./taskCardSalesBlocks";
import {
  OwnerReports,
  AvitoIndex,
  DeadMoney,
  TeamPending,
} from "./taskCardOwnerBlocks";

type Props = {
  task: ChecklistTask;
  token: string;
  accent: string;
  busy: boolean;
  onToggle: (key: string, isDone: boolean) => Promise<void>;
  onRefresh?: () => void;
};

export default function ChecklistTaskCard({ task, token, accent, busy, onToggle, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [stratNote, setStratNote] = useState(task.note || "");
  const [stratSaving, setStratSaving] = useState(false);

  const loadDetail = async () => {
    if (detail || loading) return;
    setLoading(true);
    try {
      const r = await fetch(`${STAFF_DAILY_URL}?action=task-detail&task_key=${task.key}`, {
        headers: { "X-Employee-Token": token },
      });
      setDetail(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) await loadDetail();
  };

  const syncAvito = async () => {
    setSyncing(true);
    setSyncMsg("Запускаю синхронизацию с Авито…");
    try {
      const r = await fetch(`${AVITO_SYNC_URL}?action=sync`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (d.error) {
        setSyncMsg(`Ошибка: ${d.error}`);
      } else {
        const added = d.items_added ?? 0;
        const upd = d.items_updated ?? 0;
        setSyncMsg(`Готово. Добавлено: ${added}, обновлено: ${upd}`);
        setDetail(null);
        await loadDetail();
        onRefresh?.();
      }
    } catch {
      setSyncMsg("Не удалось связаться с Авито");
    } finally {
      setSyncing(false);
    }
  };

  const saveStrategic = async () => {
    setStratSaving(true);
    try {
      await fetch(`${STAFF_DAILY_URL}?action=toggle`, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ task_key: task.key, is_done: stratNote.trim().length > 0, note: stratNote.trim() }),
      });
      onRefresh?.();
    } finally {
      setStratSaving(false);
    }
  };

  const d = detail?.detail;
  const k = d?.kind;

  return (
    <li className={`relative rounded-xl overflow-hidden border-l-2 ${accent} transition-all duration-200`}
      style={{
        background: "linear-gradient(145deg, rgba(16,12,7,0.97) 0%, rgba(10,8,5,0.99) 100%)",
        boxShadow: task.is_done
          ? "0 2px 8px rgba(0,0,0,0.4)"
          : "0 2px 0 rgba(255,255,255,0.03) inset, 0 4px 20px rgba(0,0,0,0.5)",
      }}
    >
      {/* Световой блик сверху */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
      <div className="flex items-start gap-2 p-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.key, !task.is_done); }}
          disabled={busy}
          className={`w-5 h-5 rounded border flex items-center justify-center transition shrink-0 mt-0.5 ${
            task.is_done
              ? "bg-emerald-500/30 border-emerald-400 text-emerald-200"
              : "border-white/20 hover:border-[#FFD700]/60"
          }`}
        >
          {busy ? <Icon name="Loader" size={12} className="animate-spin" /> : task.is_done ? <Icon name="Check" size={12} /> : null}
        </button>
        <button onClick={toggleOpen} className="flex-1 text-left min-w-0">
          <div className={`text-[13px] leading-snug ${task.is_done ? "text-white/40 line-through" : "text-white/85"}`}>
            {task.label}
          </div>
          {task.completed_at && (
            <div className="text-[10px] text-emerald-300/70 mt-0.5">
              ✓ {new Date(task.completed_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </button>
        <button onClick={toggleOpen} className="text-white/40 hover:text-[#FFD700] transition p-1">
          <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} />
        </button>
      </div>

      {open && (
        <div className="px-2 pb-3 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {loading && (
            <div className="flex items-center gap-2 text-white/40 text-[11px] py-3 justify-center">
              <Icon name="Loader" size={12} className="animate-spin" /> Загружаю данные…
            </div>
          )}

          {!loading && d && (
            <div className="space-y-2">
              {/* === REPAIR === */}
              {k === "repair_stuck" && (
                <RepairList items={d.items} count={d.count} emptyText="Висяков нет — красиво!" showFrozen />
              )}
              {k === "repair_calls" && (
                <RepairCalls items={d.items} count={d.count} />
              )}
              {k === "repair_ready" && (
                <RepairList items={d.items} count={d.count} emptyText="Готовых к выдаче нет" showAmount actionLabel="Позвонить" />
              )}
              {k === "repair_active" && (
                <RepairList items={d.items} count={d.count} emptyText="Активных ремонтов нет" />
              )}

              {/* === SALES === */}
              {k === "avito_sync" && (
                <AvitoSyncDetail
                  d={d}
                  syncing={syncing}
                  syncMsg={syncMsg}
                  onSync={syncAvito}
                />
              )}
              {k === "avito_stale" && <AvitoStaleList items={d.items} count={d.count} />}
              {k === "avito_prices" && <AvitoPricesList items={d.items} count={d.count} />}
              {k === "today_buyouts" && <TodayBuyouts d={d} />}
              {k === "items_incomplete" && <IncompleteItems items={d.items} count={d.count} />}

              {/* === OWNER === */}
              {k === "owner_reports" && <OwnerReports d={d} />}
              {k === "avito_index" && <AvitoIndex d={d} onSync={syncAvito} syncing={syncing} syncMsg={syncMsg} />}
              {k === "dead_money" && <DeadMoney d={d} />}
              {k === "team_pending" && <TeamPending d={d} />}
              {k === "strategic" && (
                <div className="space-y-2">
                  <div className="text-[11px] text-white/55">Запиши главную стратегическую задачу на завтра — рост, новый канал, эксперимент.</div>
                  <textarea
                    value={stratNote}
                    onChange={(e) => setStratNote(e.target.value)}
                    placeholder="Например: запустить рассылку постоянным клиентам с акцией на ремонт"
                    rows={3}
                    className="w-full text-[12px] bg-black/40 border border-white/10 rounded-md p-2 text-white/85 focus:outline-none focus:border-[#FFD700]/40"
                  />
                  <button
                    onClick={saveStrategic}
                    disabled={stratSaving || !stratNote.trim()}
                    className="w-full py-2 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider disabled:opacity-40 hover:brightness-110"
                  >
                    {stratSaving ? "Сохраняю…" : task.is_done ? "Обновить и оставить утверждённой" : "Утвердить задачу"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}