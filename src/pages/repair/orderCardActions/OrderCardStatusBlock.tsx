import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES } from "../types";
import { STATUS_FX, EditForm } from "./orderCardActionsTypes";

type Props = {
  o: Order;
  ef: EditForm;
  saving: boolean;
  financeBlocked: boolean;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order, issuedAt?: string) => void;
};

export default function OrderCardStatusBlock({
  o, ef, saving, financeBlocked,
  onChangeStatus, onOpenReadyModal, onIssueOrder,
}: Props) {
  // Дата выдачи (для кнопки "Выдано")
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [issuedAt, setIssuedAt] = useState<string>(nowLocal);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/15 bg-gradient-to-br from-[#1a1a1a] via-[#0E0E0E] to-[#0A0A0A] p-3 shadow-[0_0_30px_-15px_rgba(255,215,0,0.25)]">
      {/* декоративные блики */}
      <div className="pointer-events-none absolute -top-20 -right-10 w-44 h-44 bg-[#FFD700]/8 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 w-44 h-44 bg-violet-500/8 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
          <Icon name="RefreshCw" size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold text-white text-[12px] uppercase tracking-wider leading-tight">Сменить статус</div>
          <div className="font-roboto text-[10px] text-white/40 leading-tight truncate">
            текущий: <span className={STATUS_FX[o.status]?.text || "text-white/60"}>
              {(STATUSES.find(s => s.key === o.status)?.label) || o.status}
            </span>
          </div>
        </div>
        {saving && (
          <span className="flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full text-[9px] font-roboto">
            <Icon name="Loader" size={9} className="animate-spin" />Сохраняю
          </span>
        )}
      </div>

      {/* Поле даты выдачи — премиум */}
      {o.status !== "done" && (
        <div className="relative flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/[0.08] via-[#FFD700]/[0.04] to-transparent border border-[#FFD700]/25 rounded-lg px-3 py-2 mb-3">
          <Icon name="CalendarCheck" size={14} className="text-[#FFD700] shrink-0" />
          <span className="font-roboto text-[10px] text-[#FFD700]/80 shrink-0 uppercase tracking-wider font-bold">Дата выдачи</span>
          <input
            type="datetime-local"
            value={issuedAt}
            onChange={e => setIssuedAt(e.target.value)}
            className="flex-1 bg-transparent font-roboto text-[11px] text-white outline-none min-w-0 cursor-pointer tabular-nums text-right"
          />
        </div>
      )}

      {/* Сетка статусов — премиум-плитки */}
      <div className="relative grid grid-cols-2 gap-2">
        {STATUSES.filter(s => s.key !== o.status).map(s => {
          const fx = STATUS_FX[s.key] || STATUS_FX.new;
          const needsFinance = s.key === "ready" || s.key === "done";
          const blocked = needsFinance && financeBlocked;
          const isLoading = saving;
          return (
            <button key={s.key}
              onClick={() => {
                if (s.key === "ready") onOpenReadyModal(o);
                else if (s.key === "done") onIssueOrder(o, issuedAt);
                else onChangeStatus(o.id, s.key, { admin_note: ef.admin_note });
              }}
              disabled={isLoading || blocked}
              title={blocked ? "Введите суммы закупки и выдачи" : s.label}
              className={`group relative overflow-hidden font-roboto text-[12px] py-2.5 px-3 rounded-lg border transition-all flex items-center gap-2 min-h-[48px] active:scale-95 ${
                blocked
                  ? "border-white/5 bg-black/40 text-white/25 cursor-not-allowed"
                  : isLoading
                  ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                  : `${fx.bg} ${fx.border} ${fx.text} hover:bg-gradient-to-br hover:${fx.grad} hover:shadow-lg hover:${fx.glow} hover:border-current/50 font-bold`
              }`}>
              {/* hover-блик */}
              {!blocked && !isLoading && (
                <span className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${fx.grad}`} />
              )}
              {/* Иконка статуса */}
              <span className="relative w-7 h-7 rounded-md bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                {blocked
                  ? <Icon name="Lock" size={12} />
                  : <Icon name={fx.icon} size={13} />}
              </span>
              <span className="relative flex-1 text-left leading-tight">{s.label}</span>
              {!blocked && (
                <span className={`relative w-1.5 h-1.5 rounded-full shrink-0 ${fx.dot} animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>

      {financeBlocked && (
        <div className="relative mt-2 text-[10px] font-roboto text-orange-300/80 flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/25 rounded-lg px-2.5 py-1.5">
          <Icon name="Info" size={11} className="text-orange-400 shrink-0" />
          Для «Готово» и «Выдано» укажите суммы закупки и ремонта
        </div>
      )}
    </div>
  );
}
