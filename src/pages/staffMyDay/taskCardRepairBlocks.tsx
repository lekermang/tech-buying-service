/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { Empty, money, phoneHref } from "./taskCardShared";

export function RepairList({
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

export function RepairCalls({ items, count }: { items: any[]; count: number }) {
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
