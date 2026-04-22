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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[#111] border border-[#2A2A2A] w-full max-w-lg max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <Icon name="History" size={15} className="text-[#FFD700]" />
            <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Последние действия</span>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Список */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12 text-white/30">
              <Icon name="Loader" size={18} className="animate-spin mr-2" />
              <span className="font-roboto text-sm">Загружаю...</span>
            </div>
          )}
          {!loading && history.length === 0 && (
            <div className="text-center py-12 text-white/30 font-roboto text-sm">Действий пока нет</div>
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
  );
}
