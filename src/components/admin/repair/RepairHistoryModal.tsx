import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { ADMIN_URL } from "./repairTypes";
import { adminHeaders } from "@/lib/adminFetch";

type HistoryEntry = {
  id: number;
  order_id: number;
  changed_at: string;
  changed_by: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  client_name: string | null;
  device: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  status: "Статус",
  repair_amount: "Сумма ремонта",
  purchase_amount: "Закупка",
  parts_name: "Запчасть",
  admin_note: "Заметка",
  master_income: "Доход мастера",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function RepairHistoryModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(ADMIN_URL + "?action=history&limit=80", { headers: { ...adminHeaders(token) } });
      const data = await res.json();
      setHistory(data.history || []);
      setLoading(false);
    })();
  }, [token]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <span aria-hidden className="absolute -inset-2 rounded-2xl pointer-events-none hidden sm:block" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.20),transparent 75%)", filter: "blur(18px)" }} />
        <div className="relative p-[1.5px] sm:rounded-2xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.6)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.6)_360deg)] shadow-[0_12px_40px_rgba(255,215,0,0.20)] flex flex-col min-h-0 max-h-full">
        <div className="bg-gradient-to-br from-[#1A1A1A] via-[#0F0F0F] to-[#0A0A0A] sm:rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Шапка */}
        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[#FFD700]/15">
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_12px_rgba(255,215,0,0.4)] shrink-0">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                <Icon name="History" size={12} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
              </div>
            </div>
            <span className="font-oswald font-bold text-sm uppercase tracking-wide bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">Последние действия</span>
          </div>
          <button onClick={onClose} title="Закрыть" className="text-white/50 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors p-1.5 active:scale-95">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Список */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
                <Icon name="Loader" size={22} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
              </div>
              <span className="font-roboto text-sm mt-2">Загружаю историю…</span>
            </div>
          )}
          {!loading && history.length === 0 && (
            <div className="text-center py-12 text-white/40 font-roboto text-sm">
              <Icon name="Inbox" size={28} className="mx-auto mb-2 text-[#FFD700]/40" />
              Действий пока нет
            </div>
          )}
          {!loading && history.map((h) => (
            <div key={h.id} className="px-4 py-3 border-b border-[#1A1A1A] hover:bg-white/[0.02]">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-oswald text-[#FFD700] text-sm font-bold">#{h.order_id}</span>
                  {h.client_name && <span className="font-roboto text-white/60 text-xs">{h.client_name}</span>}
                  {h.device && <span className="font-roboto text-white/30 text-xs">· {h.device}</span>}
                </div>
                <span className="font-roboto text-white/20 text-[10px] shrink-0">{formatDate(h.changed_at)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-roboto text-white/40 text-[11px]">{FIELD_LABELS[h.field_name] || h.field_name}:</span>
                {h.old_value && (
                  <>
                    <span className="font-roboto text-white/30 text-[11px] line-through">{h.old_value}</span>
                    <Icon name="ArrowRight" size={10} className="text-white/20" />
                  </>
                )}
                <span className={`font-roboto text-[11px] font-medium ${h.field_name === "status" ? "text-[#FFD700]" : "text-white/80"}`}>
                  {h.new_value || "—"}
                </span>
              </div>
              {h.changed_by && h.changed_by !== "admin" && (
                <div className="mt-0.5 font-roboto text-white/20 text-[10px]">{h.changed_by}</div>
              )}
            </div>
          ))}
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}