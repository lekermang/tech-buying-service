import Icon from "@/components/ui/icon";
import { INP, STATUS_COLOR, OrderStatus } from "./types";

type Props = {
  statusId: string;
  setStatusId: (v: string) => void;
  statusLoading: boolean;
  statusError: string;
  statusResult: OrderStatus | null;
  onCheck: () => void;
};

export default function RepairStatusTab({
  statusId, setStatusId, statusLoading, statusError, statusResult, onCheck,
}: Props) {
  return (
    <div>
      <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">Введите номер заявки</div>
      <div className="flex gap-1.5 mb-2">
        <input type="text" value={statusId} onChange={e => setStatusId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onCheck()}
          placeholder="Например: 42" className={INP} />
        <button onClick={onCheck} disabled={statusLoading}
          className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 shrink-0">
          {statusLoading ? "..." : "Проверить"}
        </button>
      </div>
      {statusError && (
        <div className="text-red-400 font-roboto text-[10px] flex items-center gap-1">
          <Icon name="AlertCircle" size={11} /> {statusError}
        </div>
      )}
      {statusResult && (
        <div className="border border-white/10 p-2.5 bg-black/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-roboto text-white/40 text-[10px]">Заявка #{statusResult.id}</span>
            <span className={`font-oswald font-bold text-xs ${STATUS_COLOR[statusResult.status] || "text-white"}`}>
              {statusResult.status_label}
            </span>
          </div>
          <div className="font-roboto text-white/70 text-[10px]">
            {statusResult.model && <span>{statusResult.model} · </span>}
            {statusResult.repair_type}
          </div>
          {statusResult.admin_note && (
            <div className="mt-1.5 font-roboto text-white/50 text-[10px] border-t border-white/10 pt-1.5">
              {statusResult.admin_note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
