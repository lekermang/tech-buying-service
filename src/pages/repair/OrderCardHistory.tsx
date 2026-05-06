import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { REPAIR_URL, fmt } from "./types";
import { STATUS_FX } from "./orderCardActions/orderCardActionsTypes";

type HistoryEntry = {
  changed_at: string | null;
  changed_by: string | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
};

const FIELD_LABEL: Record<string, string> = {
  status: "Статус",
  repair_amount: "Цена клиенту",
  purchase_amount: "Закупка",
  parts_name: "Запчасть",
  admin_note: "Заметка",
  master_income: "Мастер %",
};

type Props = {
  orderId: number;
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
  /** Если true — компонент сам грузит данные сразу. Иначе — раскрывается по клику. */
  autoLoad?: boolean;
};

/** История изменений статуса и финансов по заявке.
 *  Тянется с backend action=order_history (таблица repair_order_history).
 *  Сворачивается/разворачивается по кнопке. */
export default function OrderCardHistory({ orderId, token, authHeader, autoLoad = false }: Props) {
  const [open, setOpen] = useState(autoLoad);
  const [data, setData] = useState<HistoryEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${REPAIR_URL}?action=order_history&id=${orderId}`, {
        headers: { [authHeader]: token },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Не удалось загрузить историю");
      setData(j.history || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && data === null) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="rounded-lg border border-white/10 bg-[#0E0E0E]/60 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors"
      >
        <span className="inline-flex items-center gap-2 text-white/65">
          <Icon name="History" size={13} />
          <span className="font-oswald uppercase text-[11px] tracking-wider">История изменений</span>
          {data && data.length > 0 && (
            <span className="text-[10px] text-white/35 tabular-nums">· {data.length}</span>
          )}
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={12} className="text-white/40" />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 max-h-[260px] overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 text-white/40 text-xs py-2">
              <Icon name="Loader" size={12} className="animate-spin" />
              Загружаю...
            </div>
          )}
          {error && (
            <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-1.5">
              {error}
              <button onClick={load} className="ml-2 underline">повторить</button>
            </div>
          )}
          {!loading && !error && data && data.length === 0 && (
            <div className="text-xs text-white/30 italic py-2">Пока никаких изменений</div>
          )}
          {!loading && !error && data && data.map((h, idx) => {
            const isStatus = h.field_name === "status";
            const fxNew = isStatus && h.new_value ? STATUS_FX[h.new_value] : null;
            const fieldLbl = FIELD_LABEL[h.field_name] || h.field_name;
            return (
              <div key={idx} className="text-[11px] font-roboto bg-white/[0.02] border border-white/5 rounded-md px-2.5 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[10px] text-white/40">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="User" size={9} />
                    <span className="truncate max-w-[120px]">{h.changed_by || "система"}</span>
                  </span>
                  <span className="tabular-nums">{h.changed_at ? fmt(h.changed_at) : "—"}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-white/55 text-[10px] uppercase tracking-wide font-bold">{fieldLbl}:</span>
                  {h.old_value && (
                    <span className="text-white/40 line-through text-[11px]">
                      {h.old_value}
                    </span>
                  )}
                  {h.old_value && h.new_value && (
                    <Icon name="ArrowRight" size={10} className="text-white/30" />
                  )}
                  <span className={`text-[11px] ${isStatus && fxNew ? fxNew.text : "text-white/85"} font-bold`}>
                    {h.new_value || "—"}
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
