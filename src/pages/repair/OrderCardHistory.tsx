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
export default function OrderCardHistory({ orderId, token, authHeader, autoLoad = true }: Props) {
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

  // Находим того, кто первым взял заявку в работу (перевёл в accepted/in_progress)
  const tookIntoWork = (() => {
    if (!data) return null;
    // история отсортирована по убыванию даты — переворачиваем чтобы найти ПЕРВЫЙ переход
    const asc = [...data].reverse();
    const e = asc.find(h => h.field_name === "status" && h.new_value && /Принят|работ|accept|progress/i.test(h.new_value));
    if (!e) return null;
    return { by: e.changed_by || "система", at: e.changed_at };
  })();

  return (
    <div className="rounded-lg border border-[#FFD700]/25 bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] overflow-hidden shadow-[inset_0_1px_0_rgba(255,215,0,0.05)]">
      {/* Pinned-блок: кто первым взял заявку в работу */}
      {tookIntoWork && (
        <div className="px-3 py-2 bg-gradient-to-r from-emerald-500/12 via-emerald-500/5 to-transparent border-b border-emerald-500/20 flex items-center gap-2">
          <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
            <Icon name="UserCheck" size={12} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-wider text-emerald-300/70 font-oswald font-bold">Взял в работу</div>
            <div className="text-[12px] text-white font-roboto truncate">
              <span className="font-bold text-emerald-200">{tookIntoWork.by}</span>
              {tookIntoWork.at && (
                <span className="text-white/50 ml-1.5 text-[11px] tabular-nums">· {fmt(tookIntoWork.at)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.04] transition-colors group"
      >
        <span className="inline-flex items-center gap-2 text-white/80">
          <Icon name="History" size={14} className="text-[#FFD700]/80" />
          <span className="font-oswald uppercase text-[12px] tracking-wider font-bold">История заявки</span>
          {data && data.length > 0 && (
            <span className="text-[10px] text-[#FFD700]/70 tabular-nums bg-[#FFD700]/10 border border-[#FFD700]/20 rounded px-1.5 py-0.5">
              {data.length}
            </span>
          )}
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/50 group-hover:text-[#FFD700] transition-colors" />
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