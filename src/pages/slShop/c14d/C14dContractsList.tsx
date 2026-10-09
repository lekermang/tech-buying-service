import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { c14dApi, fmt, fmtDate, STATUS_BADGE, type C14dListItem } from "./types";
import { dueState, TONE_CLS, TONE_BAR, clientMessage, fmtPhone, pluralDays } from "./helpers";
import C14dContactButtons from "./C14dContactButtons";
import C14dToWarehouseModal from "./C14dToWarehouseModal";
import { SLInput } from "../slUI";

type Filter = "all" | "urgent" | "overdue" | "extended";
type Sort = "term" | "amount" | "new";

type Props = {
  items: C14dListItem[];
  loading: boolean;
  err: string | null;
  onOpen: (id: number) => void;
  token: string;
  onRefresh: () => void;
  showFilters?: boolean;
};

function Cell({ l, v, color }: { l: string; v: string; color?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">{l}</div>
      <div className={`font-oswald font-bold text-[13px] truncate ${color || "text-white"}`}>{v}</div>
    </div>
  );
}

export default function C14dContractsList({ items, loading, err, onOpen, token, onRefresh, showFilters = true }: Props) {
  const [extendingId, setExtendingId] = useState<number | null>(null);
  const [warehouse, setWarehouse] = useState<C14dListItem | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("term");
  const [q, setQ] = useState("");

  const isActiveList = items.some(i => i.status === "active");

  const counts = useMemo(() => {
    const act = items.filter(i => i.status === "active");
    return {
      all: act.length,
      urgent: act.filter(i => i.days_left !== null && i.days_left !== undefined && i.days_left >= 0 && i.days_left <= 1).length,
      overdue: act.filter(i => i.overdue).length,
      extended: act.filter(i => i.extended).length,
      sum: act.reduce((s, i) => s + Number(i.today_remaining || 0), 0),
    };
  }, [items]);

  const visible = useMemo(() => {
    let r = items.slice();
    const t = q.trim().toLowerCase();
    if (t) {
      r = r.filter(i =>
        [i.contract_number, i.client_name, i.client_phone, i.item_brand, i.item_model, i.serial_number]
          .some(x => (x || "").toLowerCase().includes(t)),
      );
    }
    if (isActiveList) {
      if (filter === "urgent") r = r.filter(i => i.days_left !== null && i.days_left !== undefined && i.days_left >= 0 && i.days_left <= 1);
      if (filter === "overdue") r = r.filter(i => i.overdue);
      if (filter === "extended") r = r.filter(i => i.extended);
      if (sort === "term") r.sort((a, b) => (a.days_left ?? 9999) - (b.days_left ?? 9999));
      if (sort === "amount") r.sort((a, b) => Number(b.amount) - Number(a.amount));
      if (sort === "new") r.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    }
    return r;
  }, [items, q, filter, sort, isActiveList]);

  const extend = async (e: React.MouseEvent, it: C14dListItem) => {
    e.stopPropagation();
    if (extendingId) return;
    if (!window.confirm(`Включить продление по договору ${it.contract_number}? Проценты после срока продолжат начисляться.`)) return;
    setExtendingId(it.id);
    await c14dApi(token, "extend", {
      method: "POST",
      body: { contract_id: it.id, enable: true, note: "Продлён из списка" },
    });
    setExtendingId(null);
    onRefresh();
  };

  if (loading) return <div className="text-center py-8 text-white/40"><Icon name="Loader2" size={18} className="animate-spin inline" /></div>;
  if (err) return <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2.5 py-1.5 text-[12px]">{err}</div>;
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-white/35">
        <Icon name="FileText" size={24} className="inline mb-1.5 opacity-50" />
        <div className="text-[12px]">Договоров нет</div>
      </div>
    );
  }

  const chips: { k: Filter; l: string; n: number; cls: string }[] = [
    { k: "all", l: "Все", n: counts.all, cls: "text-white" },
    { k: "urgent", l: "Сегодня и завтра", n: counts.urgent, cls: "text-yellow-300" },
    { k: "overdue", l: "Просрочены", n: counts.overdue, cls: "text-red-300" },
    { k: "extended", l: "Продление", n: counts.extended, cls: "text-orange-300" },
  ];

  return (
    <>
      {showFilters && (
        <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2 space-y-1.5">
          <SLInput iconLeft="Search" placeholder="Найти: ФИО, телефон, номер, устройство, IMEI"
            value={q} onChange={e => setQ(e.target.value)} />
          {isActiveList && (
            <>
              <div className="flex gap-1 overflow-x-auto scrollbar-premium pb-0.5">
                {chips.map(c => (
                  <button key={c.k} onClick={() => setFilter(c.k)}
                    className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-bold transition ${
                      filter === c.k ? "bg-[#FFD700]/15 border-[#FFD700]/50 text-[#FFD700]" : "bg-white/5 border-white/10 text-white/55"
                    }`}>
                    {c.l} <span className={filter === c.k ? "" : c.cls}>{c.n}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px] text-white/45">
                <span>К получению от клиентов: <b className="text-emerald-300">{fmt(counts.sum)} ₽</b></span>
                <label className="flex items-center gap-1">
                  Сортировка
                  <select value={sort} onChange={e => setSort(e.target.value as Sort)}
                    className="bg-[#1A1A1A] border border-white/10 rounded px-1.5 py-0.5 text-white/80 text-[11px]">
                    <option value="term">По сроку</option>
                    <option value="amount">По сумме</option>
                    <option value="new">Сначала новые</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {visible.length === 0 && (
        <div className="text-center py-6 text-white/35 text-[12px]">Ничего не найдено по выбранным условиям</div>
      )}

      <div className="space-y-1.5">
        {visible.map(it => {
          const badge = STATUS_BADGE[it.status];
          const device = [it.item_brand, it.item_model].filter(Boolean).join(" ") || it.item_type || "—";
          const active = it.status === "active";
          const due = dueState(it);
          const open = expanded === it.id;
          const term = Number(it.term_days || 14);
          const passed = Math.min(term, Math.max(0, it.days_passed ?? 0));
          const pct = active ? Math.min(100, Math.round((passed / term) * 100)) : 100;
          const interestPct = Number(it.interest_rate || 4);
          const msg = clientMessage(it, fmtDate);

          return (
            <div key={it.id}
              className={`rounded-lg bg-[#101010] border transition overflow-hidden ${
                open ? "border-[#FFD700]/40" : due.tone === "red" && active ? "border-red-500/30" : "border-[#1A1A1A] hover:border-[#FFD700]/30"
              }`}>
              <button onClick={() => setExpanded(open ? null : it.id)} className="w-full text-left px-2.5 pt-2 pb-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <div className="font-oswald font-bold text-[13px] text-[#FFD700]">{it.contract_number}</div>
                      <span className={`text-[9px] px-1.5 rounded-full border uppercase tracking-wide font-bold ${badge.cls}`}>{badge.l}</span>
                      {active && (
                        <span className={`text-[10px] px-1.5 rounded-full border font-bold ${TONE_CLS[due.tone]}`}>{due.short}</span>
                      )}
                    </div>
                    <div className="text-[13px] text-white/90 truncate leading-tight font-semibold">{it.client_name}</div>
                    <div className="text-[11px] text-white/50 truncate leading-tight">{device}</div>
                    {it.client_phone && (
                      <div className="text-[11px] text-white/60 leading-tight mt-0.5">
                        <Icon name="Phone" size={9} className="inline mr-1 opacity-60" />{fmtPhone(it.client_phone)}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[9px] text-white/40 uppercase tracking-wide">Выдано</div>
                    <div className="font-oswald font-bold text-[14px] text-white leading-tight">{fmt(it.amount)} ₽</div>
                    {active ? (
                      <>
                        <div className="text-[9px] text-emerald-300/70 uppercase tracking-wide mt-0.5">Клиент вернёт</div>
                        <div className="font-oswald font-bold text-[13px] text-emerald-300 leading-tight">{fmt(it.today_remaining ?? it.remaining_debt)} ₽</div>
                      </>
                    ) : (
                      <div className="text-[10px] text-white/45 mt-0.5">Оплачено {fmt(it.paid_total)} ₽</div>
                    )}
                  </div>
                </div>

                {active && (
                  <div className="mt-1.5">
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full ${TONE_BAR[due.tone]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5">
                      <span className={TONE_CLS[due.tone].split(" ").pop()}>{due.label}</span>
                      <span className="text-white/40">до {fmtDate(it.end_date)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-center mt-0.5 text-white/25">
                  <Icon name={open ? "ChevronUp" : "ChevronDown"} size={12} />
                </div>
              </button>

              {open && (
                <div className="px-2.5 pb-2.5 space-y-2 border-t border-white/5 pt-2">
                  {active && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-black/30 p-2">
                      <Cell l="Прошло дней" v={`${it.days_passed ?? 0} из ${term}`} />
                      <Cell l={`% за ${it.days_passed ?? 0} ${pluralDays(it.days_passed ?? 0)}`} v={`${fmt(it.interest_today ?? 0)} ₽`} color="text-orange-300" />
                      <Cell l="Ставка" v={`${interestPct}% / день`} />
                      <Cell l="Выдано" v={`${fmt(it.amount)} ₽`} />
                      <Cell l="Уже оплачено" v={`${fmt(it.paid_total)} ₽`} color="text-emerald-300" />
                      <Cell l="Вернёт сегодня" v={`${fmt(it.today_remaining ?? 0)} ₽`} color="text-emerald-300" />
                      <Cell l="Полная сумма" v={`${fmt(it.total_due)} ₽`} color="text-[#FFD700]" />
                      <Cell l="Выдан" v={fmtDate(it.start_date)} />
                      <Cell l="Оформил" v={it.created_by || "—"} />
                    </div>
                  )}
                  {!active && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-black/30 p-2">
                      <Cell l="Выдано" v={`${fmt(it.amount)} ₽`} />
                      <Cell l="Оплачено" v={`${fmt(it.paid_total)} ₽`} color="text-emerald-300" />
                      <Cell l="Закрыт" v={fmtDate(it.closed_at || it.end_date)} />
                    </div>
                  )}
                  {it.extended && it.extended_note && (
                    <div className="rounded-md bg-orange-500/10 border border-orange-500/30 px-2 py-1 text-[11px] text-orange-200">
                      Продление: {it.extended_note}
                    </div>
                  )}

                  {active && <C14dContactButtons phone={it.client_phone} message={msg} />}

                  <div className="flex gap-1.5">
                    <button onClick={() => onOpen(it.id)}
                      className="flex-[1.4] flex items-center justify-center gap-1 rounded-md py-2 text-[11px] font-bold uppercase tracking-wide bg-gradient-to-r from-[#FFD700] to-[#b8860b] text-black active:scale-[0.97] transition">
                      <Icon name="FileSearch" size={12} /> {active ? "Открыть / платёж" : "Открыть договор"}
                    </button>
                    {active && (
                      <>
                        <button onClick={e => extend(e, it)} disabled={extendingId === it.id || !!it.extended}
                          className={`flex-1 flex items-center justify-center gap-1 rounded-md py-2 text-[11px] font-bold uppercase tracking-wide border transition active:scale-[0.97] ${
                            it.extended
                              ? "bg-orange-500/10 border-orange-500/30 text-orange-300 cursor-default"
                              : "bg-[#1A1A1A] border-[#FFD700]/25 text-[#FFD700] hover:bg-[#FFD700]/10"
                          }`}>
                          {extendingId === it.id ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Timer" size={12} />}
                          {it.extended ? "Продлён" : "Продлить"}
                        </button>
                        <button onClick={e => { e.stopPropagation(); setWarehouse(it); }}
                          className="flex-1 flex items-center justify-center gap-1 rounded-md py-2 text-[11px] font-bold uppercase tracking-wide border bg-[#1A1A1A] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 transition active:scale-[0.97]">
                          <Icon name="PackagePlus" size={12} /> На склад
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {warehouse && (
        <C14dToWarehouseModal
          contract={warehouse}
          token={token}
          onClose={() => setWarehouse(null)}
          onDone={() => { setWarehouse(null); onRefresh(); }}
        />
      )}
    </>
  );
}
