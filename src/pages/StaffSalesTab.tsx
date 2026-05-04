import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { SALES_URL, type Sale } from "./staff.types";

export function SalesTab({ token }: { token: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${SALES_URL}?action=list`, { headers: { "X-Employee-Token": token } })
      .then(r => r.json()).then(d => { setSales(d.sales || []); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  const TYPE_LABELS: Record<string, string> = { goods: "Продажа", repair: "Ремонт", purchase: "Закупка" };
  const TYPE_META: Record<string, { icon: string; color: string; glow: string }> = {
    goods:    { icon: "ShoppingBag", color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10", glow: "shadow-[0_0_10px_rgba(16,185,129,0.20)]" },
    repair:   { icon: "Wrench",      color: "text-blue-300 border-blue-500/40 bg-blue-500/10",       glow: "shadow-[0_0_10px_rgba(59,130,246,0.20)]" },
    purchase: { icon: "Package",     color: "text-[#FFD700] border-[#FFD700]/40 bg-[#FFD700]/10",   glow: "shadow-[0_0_10px_rgba(255,215,0,0.20)]" },
  };

  const total = sales.reduce((a, s) => a + (s.amount || 0), 0);

  return (
    <div className="p-3 sm:p-4">
      {/* Премиум-шапка */}
      <div className="relative rounded-xl overflow-hidden mb-4">
        <div className="absolute -inset-1 rounded-xl pointer-events-none opacity-60" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.15),transparent 70%)", filter: "blur(12px)" }} />
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/25 p-3 rounded-xl shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.05)] flex items-center gap-3">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <span aria-hidden className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
          {/* Conic-медальон */}
          <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.4)] shrink-0">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
              <Icon name="Receipt" size={16} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
            </div>
          </div>
          <div className="relative flex-1 min-w-0">
            <div className="font-oswald font-bold uppercase text-base bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
              Продажи
            </div>
            <div className="font-roboto text-white/55 text-[10px] uppercase tracking-wider">{sales.length} {sales.length === 1 ? "запись" : sales.length < 5 ? "записи" : "записей"}</div>
          </div>
          <div className="relative text-right">
            <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wider">Итого</div>
            <div className="font-oswald font-bold text-[#FFD700] text-lg tabular-nums drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">
              {total.toLocaleString("ru-RU")} ₽
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-2 py-12 text-white/40">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
            <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
          </div>
          <span className="font-roboto text-sm">Загружаю продажи…</span>
        </div>
      )}

      {!loading && sales.length === 0 && (
        <div className="text-center py-14">
          <div className="relative inline-block">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/15 blur-2xl pointer-events-none" />
            <div className="relative w-16 h-16 mx-auto mb-3 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.3)]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="Inbox" size={26} className="text-[#FFD700]/70" />
              </div>
            </div>
          </div>
          <div className="font-oswald font-bold uppercase text-base bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer mb-1">
            Продаж пока нет
          </div>
          <div className="font-roboto text-white/40 text-xs">Записи появятся после первой продажи</div>
        </div>
      )}

      {!loading && sales.length > 0 && (
        <div className="space-y-2">
          {sales.map(s => {
            const meta = TYPE_META[s.type] || TYPE_META.goods;
            return (
              <div key={s.id} className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/30 hover:shadow-[0_0_14px_rgba(255,215,0,0.15)] rounded-lg px-3 py-2.5 transition-all overflow-hidden group">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="relative inline-flex items-center justify-center px-2 h-6 rounded-md bg-[#FFD700]/12 border border-[#FFD700]/40">
                      <span className="font-oswald font-bold text-[#FFD700] text-sm tabular-nums drop-shadow-[0_0_3px_rgba(255,215,0,0.5)]">#{s.id}</span>
                    </span>
                    <span className={`font-roboto text-[10px] inline-flex items-center gap-1 border px-1.5 py-0.5 rounded-md ${meta.color} ${meta.glow}`}>
                      <Icon name={meta.icon} size={10} />
                      {TYPE_LABELS[s.type] || s.type}
                    </span>
                  </div>
                  <span className="font-oswald font-bold text-white tabular-nums">
                    {s.amount.toLocaleString("ru-RU")} <span className="text-[#FFD700]/70">₽</span>
                  </span>
                </div>
                <div className="relative font-roboto text-xs text-white/70">
                  <Icon name="User" size={11} className="inline mr-1 text-white/40" />
                  {s.client || "Без клиента"}
                  {s.phone && <span className="text-white/45"> · {s.phone}</span>}
                </div>
                <div className="relative flex justify-between mt-1">
                  <span className="font-roboto text-[10px] text-white/35">{s.contract || "—"}</span>
                  <span className="font-roboto text-[10px] text-white/45">
                    {s.date ? new Date(s.date).toLocaleDateString("ru-RU") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
