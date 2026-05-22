/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { Empty, Stat, money } from "./taskCardShared";

export function AvitoSyncDetail({ d, syncing, syncMsg, onSync }: any) {
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

export function AvitoStaleList({ items, count }: { items: any[]; count: number }) {
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

export function AvitoPricesList({ items, count }: { items: any[]; count: number }) {
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

export function TodayBuyouts({ d }: { d: any }) {
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

export function IncompleteItems({ items, count }: { items: any[]; count: number }) {
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
