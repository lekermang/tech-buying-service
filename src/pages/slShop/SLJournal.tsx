import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLEvent } from "./types";

const ACTION_LABELS: Record<string, { l: string; icon: string; color: string }> = {
  buy: { l: "Скупка", icon: "ShoppingCart", color: "text-emerald-300" },
  sale: { l: "Продажа", icon: "HandCoins", color: "text-blue-300" },
  return: { l: "Возврат", icon: "Undo2", color: "text-orange-300" },
  cash_in: { l: "Касса: приход", icon: "ArrowDownToLine", color: "text-emerald-300" },
  cash_out: { l: "Касса: расход", icon: "ArrowUpFromLine", color: "text-red-300" },
  remove: { l: "Удаление", icon: "Trash2", color: "text-red-300" },
};

export default function SLJournal({ token }: { token: string }) {
  const [list, setList] = useState<SLEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLEvent[]>(token, "events", {
      params: { event_type: filterAction || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined },
    });
    if (r.ok && r.data) setList(r.data);
    setLoading(false);
  }, [token, filterAction, dateFrom, dateTo]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3 space-y-2">
        <div>
          <div className="text-[11px] text-white/50 mb-1">Период</div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="bg-[#0A0A0A] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="bg-[#0A0A0A] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div>
          <div className="text-[11px] text-white/50 mb-1">Действие</div>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setFilterAction("")}
              className={`text-[10px] px-2.5 py-1 rounded-full ${filterAction === "" ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
              Все
            </button>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setFilterAction(k)}
                className={`text-[10px] px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                  filterAction === k ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
                }`}>
                <Icon name={v.icon} size={9} />{v.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[10px] text-white/40 mb-2 px-1">
        Журнал фиксирует все важные действия сотрудников: продажи, возвраты, удаления, изменения товаров и прав.
      </div>

      {loading && <div className="text-white/30 text-sm py-6 text-center">Загрузка...</div>}
      {!loading && list.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          <Icon name="ClipboardList" size={32} className="mx-auto mb-2 opacity-30" />
          В журнале пока нет записей за выбранный период.
        </div>
      )}

      <div className="space-y-1.5">
        {list.map(e => {
          const cfg = ACTION_LABELS[e.event_type] || { l: e.event_type, icon: "Circle", color: "text-white/60" };
          return (
            <div key={e.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 flex items-start gap-2">
              <div className={`w-7 h-7 rounded-full bg-[#141414] flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon name={cfg.icon} size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold uppercase ${cfg.color}`}>{cfg.l}</span>
                  <span className="text-[10px] text-white/30">{new Date(e.created_at).toLocaleString("ru-RU")}</span>
                </div>
                {e.title && <div className="text-sm font-medium truncate">{e.title}</div>}
                <div className="text-[10px] text-white/40 truncate">
                  {e.branch_name && <>{e.branch_name} · </>}
                  {e.employee_name && <>{e.employee_name}</>}
                  {e.description && <> · {e.description}</>}
                </div>
              </div>
              {e.amount && Number(e.amount) !== 0 && (
                <div className={`text-right shrink-0 font-bold text-sm ${cfg.color}`}>{fmt(e.amount)} ₽</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}