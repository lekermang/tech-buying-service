import Icon from "@/components/ui/icon";
import { Order, STATUSES, EMPTY_COMPLETE, statusInfo, fmt, printReceipt, INP, LBL } from "./types";

type CompleteForm = { purchase_amount: string; repair_amount: string };

type Props = {
  o: Order;
  editing: number | null;
  completing: number | null;
  noteInput: string;
  saving: boolean;
  completeForm: CompleteForm;
  completeSaving: boolean;
  onEditStart: (id: number, note: string) => void;
  onEditCancel: () => void;
  onNoteChange: (val: string) => void;
  onUpdateStatus: (id: number, status: string, note: string) => void;
  onCompleteStart: (id: number) => void;
  onCompleteCancel: () => void;
  onCompleteFormChange: (val: CompleteForm) => void;
  onCompleteRepair: (id: number) => void;
  onIssueRepair: (id: number) => void;
};

export default function RepairOrderCard({
  o, editing, completing, noteInput, saving,
  completeForm, completeSaving,
  onEditStart, onEditCancel, onNoteChange, onUpdateStatus,
  onCompleteStart, onCompleteCancel, onCompleteFormChange,
  onCompleteRepair, onIssueRepair,
}: Props) {
  const st = statusInfo(o.status);
  const isEditing = editing === o.id;
  const isCompleting = completing === o.id;
  const isDone = o.status === "done";

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
          <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          {isDone && o.completed_at && (
            <span className="font-roboto text-[9px] text-white/25">выдано {fmt(o.completed_at)}</span>
          )}
        </div>
        <span className="font-roboto text-[10px] text-white/30">{fmt(o.created_at)}</span>
      </div>

      {/* Клиент */}
      <div className="flex items-center gap-3 mb-1.5">
        <span className="font-roboto text-sm text-white font-medium">{o.name}</span>
        <a href={`tel:${o.phone}`} className="font-roboto text-sm text-[#FFD700] hover:underline">{o.phone}</a>
      </div>

      {/* Детали ремонта */}
      <div className="flex items-center gap-2 flex-wrap mb-1">
        {o.model && <span className="font-roboto text-xs text-white/60 bg-white/5 px-2 py-0.5">{o.model}</span>}
        {o.repair_type && <span className="font-roboto text-xs text-white/40">🔧 {o.repair_type}</span>}
        {o.price && <span className="ml-auto font-oswald font-bold text-white/50 text-sm">{o.price.toLocaleString("ru-RU")} ₽</span>}
      </div>

      {/* Суммы (если заполнены) */}
      {(o.purchase_amount || o.repair_amount) && (
        <div className="flex gap-3 mb-1.5 bg-black/30 px-2 py-1.5 mt-1">
          {o.purchase_amount && (
            <div className="flex items-center gap-1">
              <span className="font-roboto text-[10px] text-white/30">Закупка:</span>
              <span className="font-oswald font-bold text-orange-400 text-xs">{o.purchase_amount.toLocaleString("ru-RU")} ₽</span>
            </div>
          )}
          {o.repair_amount && (
            <div className="flex items-center gap-1">
              <span className="font-roboto text-[10px] text-white/30">Выручка:</span>
              <span className="font-oswald font-bold text-green-400 text-xs">{o.repair_amount.toLocaleString("ru-RU")} ₽</span>
            </div>
          )}
          {o.purchase_amount && o.repair_amount && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="font-roboto text-[10px] text-white/30">Прибыль:</span>
              <span className={`font-oswald font-bold text-xs ${o.repair_amount - o.purchase_amount >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                {(o.repair_amount - o.purchase_amount).toLocaleString("ru-RU")} ₽
              </span>
            </div>
          )}
        </div>
      )}

      {o.comment && !isEditing && !isCompleting && (
        <div className="font-roboto text-[10px] text-white/30 italic mb-1">💬 {o.comment}</div>
      )}
      {o.admin_note && !isEditing && !isCompleting && (
        <div className="font-roboto text-xs text-white/40 border-t border-white/5 pt-1.5 mt-1 mb-1">📝 {o.admin_note}</div>
      )}

      {/* Форма завершения ремонта */}
      {isCompleting && (
        <div className="border-t border-[#FFD700]/20 pt-3 mt-2">
          <div className="font-roboto text-[10px] text-[#FFD700]/70 mb-2 uppercase tracking-wide">Перевести в «Готово» — укажите суммы</div>
          <div className="grid grid-cols-2 gap-2 mb-1">
            <div>
              <label className={LBL}>Закупочная цена (₽) *</label>
              <input type="number" value={completeForm.purchase_amount}
                onChange={e => onCompleteFormChange({ ...completeForm, purchase_amount: e.target.value })}
                placeholder="500" className={INP} />
            </div>
            <div>
              <label className={LBL}>Итоговая цена (₽) *</label>
              <input type="number" value={completeForm.repair_amount}
                onChange={e => onCompleteFormChange({ ...completeForm, repair_amount: e.target.value })}
                placeholder="1500" className={INP} />
            </div>
          </div>
          {completeForm.purchase_amount && completeForm.repair_amount && (
            <div className="text-[10px] font-roboto text-white/40 mb-2 px-1">
              Прибыль: <span className={`font-bold ${parseInt(completeForm.repair_amount) - parseInt(completeForm.purchase_amount) >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                {(parseInt(completeForm.repair_amount) - parseInt(completeForm.purchase_amount)).toLocaleString("ru-RU")} ₽
              </span>
            </div>
          )}
          {(!completeForm.purchase_amount || !completeForm.repair_amount) && (
            <div className="text-[10px] font-roboto text-red-400/70 mb-2 px-1 flex items-center gap-1">
              <Icon name="AlertCircle" size={11} /> Заполните обе суммы чтобы сохранить
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => onCompleteRepair(o.id)}
              disabled={completeSaving || !completeForm.purchase_amount || !completeForm.repair_amount}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1.5">
              <Icon name="CheckCircle" size={13} />
              {completeSaving ? "Сохраняю..." : "Готово — сохранить"}
            </button>
            <button onClick={onCompleteCancel}
              className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Форма смены статуса */}
      {isEditing && !isCompleting && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="font-roboto text-[10px] text-white/40 mb-1.5 uppercase tracking-wide">Изменить статус</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {STATUSES.filter(s => s.key !== "done").map(s => (
              <button key={s.key} onClick={() => onUpdateStatus(o.id, s.key, noteInput)} disabled={saving}
                className={`font-roboto text-xs px-2.5 py-1 border transition-colors disabled:opacity-50 ${o.status === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {s.label}
              </button>
            ))}
          </div>
          <textarea value={noteInput} onChange={e => onNoteChange(e.target.value)}
            placeholder="Заметка для клиента (необязательно)..." rows={2}
            className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors resize-none mb-1.5" />
          <div className="flex gap-2">
            <button onClick={() => onUpdateStatus(o.id, o.status, noteInput)} disabled={saving}
              className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {saving ? "..." : "Сохранить"}
            </button>
            <button onClick={onEditCancel} className="text-white/30 font-roboto text-xs hover:text-white">Отмена</button>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      {!isEditing && !isCompleting && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap">
          {!isDone && (
            <>
              <button onClick={() => onEditStart(o.id, o.admin_note || "")}
                className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors">
                <Icon name="Pencil" size={11} /> Сменить статус
              </button>
              {o.status !== "ready" && (
                <button onClick={() => onCompleteStart(o.id)}
                  className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors ml-auto">
                  <Icon name="CheckCircle" size={11} /> Готово
                </button>
              )}
              {o.status === "ready" && (
                <button onClick={() => onIssueRepair(o.id)} disabled={saving}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white font-oswald font-bold px-3 py-1 text-xs uppercase transition-colors ml-auto disabled:opacity-50">
                  <Icon name="PackageCheck" size={12} /> Выдать клиенту
                </button>
              )}
            </>
          )}
          {isDone && (
            <span className="font-roboto text-[10px] text-green-400/50 flex items-center gap-1">
              <Icon name="CheckCircle" size={11} /> Ремонт завершён
            </span>
          )}
          {(isDone || o.status === "ready") && (
            <button onClick={() => printReceipt(o)}
              className="flex items-center gap-1 text-white/30 hover:text-white font-roboto text-[10px] transition-colors ml-auto">
              <Icon name="Printer" size={11} /> Печать чека
            </button>
          )}
        </div>
      )}
    </div>
  );
}
