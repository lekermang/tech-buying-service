import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  c14dApi,
  fmt,
  fmtDate,
  STATUS_BADGE,
  type C14dListItem,
  type C14dStats,
} from "./types";
import C14dCreateForm from "./C14dCreateForm";
import C14dDetailView from "./C14dDetailView";

type View = "active" | "archive" | "create" | "search";
type Props = { token: string };

export default function C14dTab({ token }: Props) {
  const [view, setView] = useState<View>("active");
  const [items, setItems] = useState<C14dListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<C14dStats | null>(null);

  // search filters
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [openId, setOpenId] = useState<number | null>(null);

  const fetchStats = useCallback(async () => {
    const r = await c14dApi<C14dStats>(token, "stats");
    if (r.ok && r.data) setStats(r.data);
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const params: Record<string, string> = {};
    if (view === "active") params.status = "active";
    else if (view === "archive") params.status = "archive";
    else if (view === "search") {
      params.status = "all";
      if (q.trim()) params.q = q.trim();
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
    }
    const r = await c14dApi<{ items: C14dListItem[] }>(token, "list", { params });
    setLoading(false);
    if (!r.ok || !r.data) {
      setErr(r.error || "Не удалось загрузить");
      setItems([]);
      return;
    }
    setItems(r.data.items || []);
  }, [view, q, dateFrom, dateTo, token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (view !== "create") load();
  }, [load, view]);

  const subTabs: { k: View; l: string; icon: string; badge?: number }[] = [
    { k: "active",  l: "Активные",   icon: "FileSignature", badge: stats?.active_count },
    { k: "archive", l: "Архив",      icon: "Archive", badge: stats?.archive_count },
    { k: "create",  l: "Создать",    icon: "Plus" },
    { k: "search",  l: "Поиск",      icon: "Search" },
  ];

  if (openId != null) {
    return (
      <C14dDetailView
        token={token}
        contractId={openId}
        onBack={() => { setOpenId(null); load(); fetchStats(); }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Шапка раздела */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 p-3">
        <div className="flex items-center gap-2">
          <Icon name="Handshake" size={18} className="text-[#FFD700]" />
          <div className="flex-1 min-w-0">
            <div className="font-oswald uppercase font-bold text-base">Договор продажи на 14 дней</div>
            <div className="text-[11px] text-white/50">Скупка с правом обратного выкупа · ставка 4% / день</div>
          </div>
        </div>
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <Stat l="Активных" v={String(stats.active_count)} c="text-emerald-300" />
            <Stat l="Просрочка" v={String(stats.overdue_count)} c="text-red-300" />
            <Stat l="В архиве" v={String(stats.archive_count)} c="text-blue-300" />
            <Stat l="Долг к возврату" v={`${fmt(stats.total_active_debt)} ₽`} c="text-[#FFD700]" />
          </div>
        )}
      </div>

      {/* Подвкладки */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {subTabs.map(t => {
          const active = view === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setView(t.k)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.l}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className={`ml-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-black/20 text-black" : "bg-[#FFD700]/15 text-[#FFD700]"}`}>{t.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {view === "create" && (
        <C14dCreateForm
          token={token}
          onCancel={() => setView("active")}
          onCreated={(id) => { fetchStats(); setView("active"); setOpenId(id); }}
        />
      )}

      {view === "search" && (
        <div className="rounded-xl bg-[#141414] border border-[#1F1F1F] p-3">
          <div className="grid sm:grid-cols-3 gap-2">
            <input
              className="rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white sm:col-span-3"
              placeholder="№ договора, ФИО клиента или телефон"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") load(); }}
            />
            <input className="rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="С" />
            <input className="rounded-lg bg-[#0F0F0F] border border-[#222] focus:border-[#FFD700] outline-none px-3 py-2 text-sm text-white" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="По" />
            <button onClick={load} className="rounded-lg bg-[#FFD700] hover:bg-[#FFE34D] text-black px-3 py-2 text-sm font-bold uppercase tracking-wide active:scale-95">Найти</button>
          </div>
        </div>
      )}

      {(view === "active" || view === "archive" || view === "search") && (
        <ContractsList items={items} loading={loading} err={err} onOpen={setOpenId} />
      )}
    </div>
  );
}

function Stat({ l, v, c }: { l: string; v: string; c: string }) {
  return (
    <div className="rounded-lg bg-black/40 border border-white/5 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">{l}</div>
      <div className={`font-oswald text-base font-bold ${c}`}>{v}</div>
    </div>
  );
}

function ContractsList({
  items, loading, err, onOpen,
}: {
  items: C14dListItem[]; loading: boolean; err: string | null; onOpen: (id: number) => void;
}) {
  if (loading) {
    return <div className="text-center py-10 text-white/40"><Icon name="Loader2" size={20} className="animate-spin inline" /></div>;
  }
  if (err) {
    return <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 px-3 py-2 text-sm">{err}</div>;
  }
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-white/40">
        <Icon name="FileText" size={28} className="inline mb-2 opacity-50" />
        <div className="text-sm">Договоров нет</div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {items.map(it => {
        const badge = STATUS_BADGE[it.status];
        const item = [it.item_brand, it.item_model].filter(Boolean).join(" ") || it.item_type || "—";
        return (
          <button
            key={it.id}
            onClick={() => onOpen(it.id)}
            className="w-full text-left rounded-xl bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 p-3 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <div className="font-oswald font-bold text-[#FFD700]">{it.contract_number}</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border uppercase tracking-wide font-semibold ${badge.cls}`}>{badge.l}</span>
                  {it.overdue && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-red-500/15 text-red-300 border-red-500/30 uppercase tracking-wide font-semibold">
                      Просрочка {it.overdue_days} дн.
                    </span>
                  )}
                </div>
                <div className="text-sm text-white/85 truncate">{it.client_name}</div>
                <div className="text-[12px] text-white/50 truncate">{item}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-oswald font-bold text-base text-white">{fmt(it.amount)} ₽</div>
                <div className="text-[11px] text-white/50">До {fmtDate(it.end_date)}</div>
                {Number(it.remaining_debt) > 0 && (
                  <div className="text-[11px] text-red-300 font-semibold mt-0.5">Долг {fmt(it.remaining_debt)} ₽</div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
