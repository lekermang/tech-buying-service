/** Дополнительные блоки правой/левой колонки: источники, заявки, поиск по телефону. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { SOURCE_LABEL, searchByPhone, type Conversion } from "./api";
import { fmtAgo } from "./utils";

export function SourcesBlock({ sources }: { sources: { source: string; sessions: number; visitors: number }[] }) {
  const max = Math.max(1, ...sources.map(s => s.sessions));
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="PieChart" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Источники сегодня</span>
      </h3>
      {sources.length === 0 ? (
        <div className="text-[11px] text-white/40 text-center py-3">Данных ещё нет</div>
      ) : (
        <div className="space-y-1.5">
          {sources.map(s => {
            const lbl = SOURCE_LABEL[s.source || "direct"] || SOURCE_LABEL.direct;
            const pct = (s.sessions / max) * 100;
            return (
              <div key={s.source || "direct"} className="text-[11px]">
                <div className="flex items-center justify-between mb-0.5">
                  <span style={{ color: lbl.color }} className="flex items-center gap-1 font-bold">
                    <Icon name={lbl.icon} size={11} /> {lbl.label}
                  </span>
                  <span className="text-white/55">{s.visitors} чел · {s.sessions} сесс.</span>
                </div>
                <div className="h-1.5 rounded bg-white/5 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: lbl.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ConversionsBlock({ items }: { items: Conversion[] }) {
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="Inbox" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Последние заявки</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-[11px] text-white/40 text-center py-3">Заявок ещё нет</div>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 12).map(c => (
            <a key={c.id} href={`/staff/analytics/visitor/${c.visitor_id}`}
              className="block bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded-lg px-2.5 py-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-white/85 truncate">{c.type}</span>
                {c.amount ? <span className="text-[#FFD700] font-extrabold shrink-0">{c.amount.toLocaleString("ru-RU")} ₽</span> : null}
              </div>
              <div className="text-[10px] text-white/45 flex items-center gap-1.5 flex-wrap">
                {c.phone && <span>📞 {c.phone}</span>}
                {c.city && <span>📍 {c.city}</span>}
                {c.source && <span>← {(SOURCE_LABEL[c.source]?.label) || c.source}</span>}
                <span className="ml-auto">{fmtAgo(c.timestamp)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

export function PhoneSearch({ token }: { token: string }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Awaited<ReturnType<typeof searchByPhone>>["data"] extends { items: infer T } | null ? T extends Array<infer I> ? I[] : never : never>([]);

  useEffect(() => {
    const digits = q.replace(/\D/g, "");
    if (digits.length < 3) { setItems([]); return; }
    const id = setTimeout(async () => {
      const r = await searchByPhone(token, q);
      if (r.ok && r.data) setItems(r.data.items);
    }, 300);
    return () => clearTimeout(id);
  }, [q, token]);

  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2">
        <Icon name="Search" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">Поиск по телефону</span>
      </h3>
      <input
        value={q} onChange={e => setQ(e.target.value)}
        placeholder="+7 999 123 45 67"
        className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-md px-3 py-2 text-[12px] focus:border-[#FFD700]/40 outline-none"
      />
      {items.length > 0 && (
        <div className="mt-2 space-y-1">
          {items.map(it => (
            <a key={it.visitor_id} href={`/staff/analytics/visitor/${it.visitor_id}`}
              className="block bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/30 rounded px-2 py-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="font-bold text-white/85">{it.phone || "—"}</span>
                {it.is_converted && <Icon name="CheckCircle2" size={11} className="text-emerald-400" />}
              </div>
              <div className="text-[10px] text-white/45">
                {it.city || "—"} · визитов {it.visit_count} · {fmtAgo(it.last_seen)}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
