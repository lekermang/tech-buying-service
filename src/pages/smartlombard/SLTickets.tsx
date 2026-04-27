import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { smartlombardCall } from "../staff.types";

type Ticket = {
  id: number;
  number?: string;
  status?: string;
  open_date?: string;
  close_date?: string;
  expiry_date?: string;
  client_name?: string;
  client_id?: number;
  pawn_sum?: number;
  total_sum?: number;
  category?: string;
};

const STATUS_LABELS: Record<string, { l: string; tint: string }> = {
  active:    { l: "Активный",  tint: "text-green-400 bg-green-500/10 border-green-500/30" },
  buyout:    { l: "Выкуплен",  tint: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  realized:  { l: "Реализован", tint: "text-pink-400 bg-pink-500/10 border-pink-500/30" },
  expired:   { l: "Просрочен",  tint: "text-red-400 bg-red-500/10 border-red-500/30" },
  closed:    { l: "Закрыт",     tint: "text-white/50 bg-white/5 border-white/10" },
};

export function SLTickets({ token }: { token: string }) {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const r = await smartlombardCall<{ pawn_tickets?: Ticket[] }>({
      token, path: "/pawn_tickets",
      params: { page: 1, limit: 50, status: statusFilter !== "all" ? statusFilter : undefined },
    });
    if (!r.ok) { setError(r.error || "Ошибка"); setItems([]); }
    else setItems(r.data?.pawn_tickets || []);
    setLoading(false);
  }, [token, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${t.number || ""} ${t.client_name || ""} ${t.id} ${t.category || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="№ билета, клиент, категория..."
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { v: "active",   l: "Активные" },
          { v: "expired",  l: "Просрочены" },
          { v: "buyout",   l: "Выкуплены" },
          { v: "realized", l: "Реализованы" },
          { v: "all",      l: "Все" },
        ].map(s => {
          const a = statusFilter === s.v;
          return (
            <button key={s.v} onClick={() => setStatusFilter(s.v)}
              className={`shrink-0 font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
              }`}>{s.l}</button>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 font-roboto text-[11px] flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(t => {
          const meta = STATUS_LABELS[t.status || ""] || { l: t.status || "?", tint: "text-white/50 bg-white/5 border-white/10" };
          return (
            <div key={t.id} className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon name="FileText" size={14} className="text-[#FFD700] shrink-0" />
                  <span className="font-oswald font-bold text-white text-sm truncate">№ {t.number || t.id}</span>
                </div>
                <span className={`font-roboto text-[10px] px-2 py-0.5 rounded-full border ${meta.tint}`}>{meta.l}</span>
              </div>
              {t.client_name && (
                <div className="font-roboto text-[11px] text-white/60 truncate flex items-center gap-1">
                  <Icon name="User" size={10} />{t.client_name}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 text-[10px] font-roboto text-white/40 mt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {t.open_date && <span>откр. {t.open_date}</span>}
                  {t.expiry_date && <span className="text-amber-400/80">до {t.expiry_date}</span>}
                </div>
                {(t.pawn_sum || t.total_sum) && (
                  <span className="font-oswald font-bold text-[#FFD700] text-xs tabular-nums shrink-0">
                    {Number(t.pawn_sum || t.total_sum || 0).toLocaleString("ru-RU")} ₽
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-12 text-white/30">
            <Icon name="FileText" size={32} className="mx-auto mb-2 opacity-50" />
            <div className="font-roboto text-sm">Билеты не найдены</div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-white/30">
            <Icon name="Loader" size={16} className="animate-spin mr-2" />
            <span className="font-roboto text-sm">Загружаю...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SLTickets;
