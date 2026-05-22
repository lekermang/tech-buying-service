/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { STAFF_DAILY_URL, type ChecklistTask } from "./types";
import funcUrls from "../../../backend/func2url.json";

const AVITO_SYNC_URL = (funcUrls as Record<string, string>)["avito-sync"];

type Props = {
  task: ChecklistTask;
  token: string;
  accent: string;
  busy: boolean;
  onToggle: (key: string, isDone: boolean) => Promise<void>;
  onRefresh?: () => void;
};

const money = (n: number) => `${(n || 0).toLocaleString("ru-RU")} ₽`;
const phoneHref = (p?: string | null) => (p ? `tel:${p.replace(/[^+0-9]/g, "")}` : "#");

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
    <li className={`rounded-lg bg-[#0A0A0A] border-l-2 ${accent} hover:bg-[#0F0F0F] transition`}>
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
        <div className="px-2 pb-3 pt-1 border-t border-white/5">
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

/* ====== вспомогательные карточки ====== */

function RepairList({
  items, count, emptyText, showFrozen, showAmount, actionLabel,
}: {
  items: any[]; count: number; emptyText: string;
  showFrozen?: boolean; showAmount?: boolean; actionLabel?: string;
}) {
  if (count === 0) return <Empty text={emptyText} />;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">Всего: {count}</div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 truncate">{it.name} · <span className="text-white/55">{it.model || "—"}</span></div>
            <div className="text-[10px] text-white/45 flex gap-2 flex-wrap">
              <span>#{it.id}</span>
              {showFrozen && <span className="text-amber-300">заморожено {money(it.frozen)}</span>}
              {showAmount && <span className="text-emerald-300">{money(it.amount)}</span>}
              {it.days != null && <span>· {it.days}д</span>}
            </div>
          </div>
          {it.phone && (
            <a href={phoneHref(it.phone)} className="px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold hover:bg-emerald-500/25">
              <Icon name="Phone" size={11} className="inline mr-1" />
              {actionLabel || "Звонок"}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function RepairCalls({ items, count }: { items: any[]; count: number }) {
  if (count === 0) return <Empty text="Нет клиентов для звонков" />;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">К обзвону: {count}</div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 truncate">{it.name}</div>
            <div className="text-[10px] text-white/45">{it.model || "—"} · {it.days}д · {it.phone}</div>
          </div>
          <a href={phoneHref(it.phone)} className="px-3 py-1.5 rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-[11px] font-bold hover:brightness-110">
            <Icon name="Phone" size={11} className="inline mr-1" />
            Позвонить
          </a>
        </div>
      ))}
    </div>
  );
}

function AvitoSyncDetail({ d, syncing, syncMsg, onSync }: any) {
  const idxColor = d.avito_index >= 0.7 ? "text-emerald-300" : "text-red-300";
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="На складе" value={String(d.showcase_count)} />
        <Stat label="На Авито" value={String(d.on_avito_count)} />
        <Stat label="Индекс" value={d.avito_index.toFixed(2)} className={idxColor} />
      </div>

      <button
        onClick={onSync}
        disabled={syncing}
        className="w-full py-2 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2"
      >
        <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Синхронизация…" : "Синхронизировать с Авито"}
      </button>

      {syncMsg && (
        <div className="text-[10px] text-white/65 bg-black/30 border border-white/10 rounded px-2 py-1.5">
          {syncMsg}
        </div>
      )}

      {d.last_sync_at && (
        <div className="text-[10px] text-white/40">
          Последняя синхронизация: {new Date(d.last_sync_at).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
        </div>
      )}

      {d.missing_count > 0 && (
        <details className="bg-red-500/5 border border-red-500/20 rounded-md p-2">
          <summary className="cursor-pointer text-[11px] text-red-300 font-bold">
            <Icon name="AlertTriangle" size={11} className="inline mr-1" />
            На складе, но НЕТ на Авито: {d.missing_count}
          </summary>
          <div className="mt-2 space-y-1">
            {d.missing_on_avito.map((m: any) => (
              <div key={m.id} className="text-[11px] text-white/75 bg-black/30 rounded px-2 py-1 flex items-center gap-2">
                <span className="flex-1 truncate">{m.title} {m.model ? `· ${m.model}` : ""}</span>
                <span className="text-amber-300 tabular-nums">{money(m.price)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {d.orphan_count > 0 && (
        <details className="bg-amber-500/5 border border-amber-500/20 rounded-md p-2">
          <summary className="cursor-pointer text-[11px] text-amber-300 font-bold">
            <Icon name="ExternalLink" size={11} className="inline mr-1" />
            На Авито, но НЕТ на складе: {d.orphan_count}
          </summary>
          <div className="mt-2 space-y-1">
            {d.orphan_on_avito.map((o: any) => (
              <a key={o.id} href={o.url || "#"} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-white/75 bg-black/30 rounded px-2 py-1 hover:bg-black/50">
                <span className="truncate">{o.title}</span>
                <span className="text-amber-300 tabular-nums float-right">{money(o.price)}</span>
              </a>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AvitoStaleList({ items, count }: { items: any[]; count: number }) {
  if (count === 0) return <Empty text="Все объявления свежие" />;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">Старых: {count} — нужно поднять</div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 truncate">{it.title}</div>
            <div className="text-[10px] text-white/45">{money(it.price)} · {it.days}д без обновления</div>
          </div>
          {it.url && (
            <a href={it.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-bold hover:bg-[#FFD700]/25">
              <Icon name="ExternalLink" size={10} className="inline mr-1" />
              Открыть
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function AvitoPricesList({ items, count }: { items: any[]; count: number }) {
  if (count === 0) return <Empty text="Объявлений нет" />;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">Проверь цены (топ-{count})</div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 truncate">{it.title}</div>
            <div className="text-[10px] text-amber-300 tabular-nums">{money(it.price)}</div>
          </div>
          {it.url && (
            <a href={it.url} target="_blank" rel="noopener noreferrer" className="text-white/45 hover:text-[#FFD700] p-1">
              <Icon name="ExternalLink" size={12} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function TodayBuyouts({ d }: { d: any }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Скупка б/у" value={String(d.buyouts_count)} />
        <Stat label="Золото" value={String(d.gold_count)} />
      </div>
      {d.buyouts_count === 0 && d.gold_count === 0 && (
        <Empty text="Сегодня скупок ещё не было. Внеси, как только примешь товар." />
      )}
      {d.buyouts.map((it: any) => (
        <div key={`b${it.id}`} className="text-[11px] text-white/75 bg-black/30 rounded px-2 py-1 flex items-center gap-2">
          <Icon name="Smartphone" size={11} className="text-white/45" />
          <span className="flex-1 truncate">{it.title}</span>
          <span className="text-emerald-300 tabular-nums">{money(it.buy_price)}</span>
        </div>
      ))}
      {d.gold.map((g: any) => (
        <div key={`g${g.id}`} className="text-[11px] text-white/75 bg-black/30 rounded px-2 py-1 flex items-center gap-2">
          <Icon name="Coins" size={11} className="text-[#FFD700]" />
          <span className="flex-1">{g.metal} · {g.weight}г</span>
          <span className="text-emerald-300 tabular-nums">{money(g.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function IncompleteItems({ items, count }: { items: any[]; count: number }) {
  if (count === 0) return <Empty text="Все товары с фото и описанием — молодец!" />;
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-white/45 uppercase tracking-wider">Без фото/описания: {count}</div>
      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-2 p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-white/90 truncate">{it.title}</div>
            <div className="text-[10px] text-white/45 flex gap-1.5 mt-0.5">
              {it.no_img && <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">нет фото</span>}
              {it.no_desc && <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">нет описания</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerReports({ d }: { d: any }) {
  const renderRow = (who: any, label: string, color: string) => {
    if (!who) return null;
    const pct = who.total ? (who.done / who.total) * 100 : 0;
    return (
      <div className="p-2 rounded-md bg-black/30 border border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Icon name="User" size={12} className={color} />
          <div className="text-[12px] text-white/90 font-bold">{who.full_name}</div>
          <div className="ml-auto text-[11px] tabular-nums text-white/55">{who.done}/{who.total}</div>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FFD700] to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[10px] text-white/45 mt-1">{label}</div>
      </div>
    );
  };
  return (
    <div className="space-y-1.5">
      {renderRow(d.repair, "Кабинет ремонта", "text-sky-300")}
      {renderRow(d.sales, "Кабинет продаж", "text-emerald-300")}
      {!d.repair && !d.sales && <Empty text="Сотрудники не настроены" />}
    </div>
  );
}

function AvitoIndex({ d, onSync, syncing, syncMsg }: any) {
  const color = d.is_ok ? "text-emerald-300" : "text-red-300";
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Склад" value={String(d.showcase_count)} />
        <Stat label="Авито" value={String(d.on_avito_count)} />
        <Stat label="Индекс" value={d.avito_index.toFixed(2)} className={color} />
      </div>
      {!d.is_ok && (
        <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-2">
          <Icon name="AlertTriangle" size={11} className="inline mr-1" />
          Индекс {d.avito_index.toFixed(2)} ниже нормы 0.70. Не выложено: {d.gap}
        </div>
      )}
      <button
        onClick={onSync}
        disabled={syncing}
        className="w-full py-2 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2"
      >
        <Icon name={syncing ? "Loader" : "RefreshCw"} size={13} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Синхронизация…" : "Синхронизировать с Авито"}
      </button>
      {syncMsg && <div className="text-[10px] text-white/65 bg-black/30 border border-white/10 rounded px-2 py-1.5">{syncMsg}</div>}
    </div>
  );
}

function DeadMoney({ d }: { d: any }) {
  return (
    <div className="space-y-2">
      <div className={`text-center p-3 rounded-md ${d.is_critical ? "bg-red-500/10 border border-red-500/30" : "bg-emerald-500/10 border border-emerald-500/30"}`}>
        <div className="text-[10px] text-white/55 uppercase tracking-wider">Заморожено в ремонтах</div>
        <div className={`text-2xl font-bold tabular-nums ${d.is_critical ? "text-red-300" : "text-emerald-300"}`}>{money(d.total)}</div>
      </div>
      {d.is_critical && d.david_phone && (
        <a
          href={phoneHref(d.david_phone)}
          className="block w-full py-2 rounded-md bg-gradient-to-b from-red-500 to-red-600 text-white text-[12px] font-bold uppercase tracking-wider text-center hover:brightness-110"
        >
          <Icon name="Phone" size={13} className="inline mr-1" />
          Позвонить Давиду — {d.david_phone}
        </a>
      )}
      <details className="bg-black/30 border border-white/5 rounded-md p-2">
        <summary className="cursor-pointer text-[11px] text-white/65">Топ висяков ({d.count})</summary>
        <div className="mt-2 space-y-1">
          {d.items.map((it: any) => (
            <div key={it.id} className="text-[11px] text-white/75 flex items-center gap-2">
              <span className="flex-1 truncate">#{it.id} · {it.name} · {it.days}д</span>
              <span className="text-amber-300 tabular-nums">{money(it.frozen)}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function TeamPending({ d }: { d: any }) {
  const allDone = d.team.every((t: any) => t.pending.length === 0);
  if (allDone) return <Empty text="Вся команда закрыла свои задачи на сегодня!" />;
  return (
    <div className="space-y-2">
      {d.team.map((m: any) => (
        <div key={m.employee_id} className="p-2 rounded-md bg-black/30 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="User" size={12} className="text-white/55" />
            <div className="text-[12px] text-white/90 font-bold">{m.full_name}</div>
            <div className="ml-auto text-[11px] tabular-nums text-white/55">{m.done}/{m.total}</div>
            {m.phone && (
              <a href={phoneHref(m.phone)} className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                <Icon name="Phone" size={10} className="inline mr-1" />Звонок
              </a>
            )}
          </div>
          {m.pending.length === 0 ? (
            <div className="text-[10px] text-emerald-300">✓ Всё закрыто</div>
          ) : (
            <ul className="space-y-0.5 mt-1">
              {m.pending.map((p: any) => (
                <li key={p.key} className="text-[11px] text-white/65 pl-3">• {p.label}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="p-1.5 rounded-md bg-black/30 border border-white/5 text-center">
      <div className="text-[9px] text-white/45 uppercase tracking-wider">{label}</div>
      <div className={`text-[13px] font-bold tabular-nums ${className || "text-white"}`}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-emerald-300/80 bg-emerald-500/5 border border-emerald-500/15 rounded-md py-3 text-center">
      <Icon name="CheckCircle2" size={14} className="inline mr-1" />
      {text}
    </div>
  );
}