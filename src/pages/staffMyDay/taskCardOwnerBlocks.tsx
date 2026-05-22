/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { Empty, Stat, money, phoneHref } from "./taskCardShared";

export function OwnerReports({ d }: { d: any }) {
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

export function AvitoIndex({ d, onSync, syncing, syncMsg }: any) {
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

export function DeadMoney({ d }: { d: any }) {
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

export function TeamPending({ d }: { d: any }) {
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
