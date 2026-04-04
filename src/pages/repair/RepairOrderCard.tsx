import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, statusInfo, fmt, printReceipt, INP, LBL } from "./types";

type CompleteForm = { purchase_amount: string; repair_amount: string };

type EditForm = {
  name: string; phone: string; model: string;
  repair_type: string; price: string; comment: string; admin_note: string;
};

type Props = {
  o: Order;
  editing: number | null;
  completing: number | null;
  noteInput: string;
  saving: boolean;
  completeForm: CompleteForm;
  completeSaving: boolean;
  isOwner?: boolean;
  onEditStart: (id: number, note: string) => void;
  onEditCancel: () => void;
  onNoteChange: (val: string) => void;
  onUpdateStatus: (id: number, status: string, note: string) => void;
  onCompleteStart: (id: number) => void;
  onCompleteCancel: () => void;
  onCompleteFormChange: (val: CompleteForm) => void;
  onCompleteRepair: (id: number) => void;
  onIssueRepair: (id: number) => void;
  onSaveEdit: (id: number, fields: EditForm) => void;
  onDelete?: (id: number) => void;
};

export default function RepairOrderCard({
  o, editing, completing, noteInput, saving,
  completeForm, completeSaving,
  isOwner = false,
  onEditStart, onEditCancel, onNoteChange, onUpdateStatus,
  onCompleteStart, onCompleteCancel, onCompleteFormChange,
  onCompleteRepair, onIssueRepair, onSaveEdit, onDelete,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const st = statusInfo(o.status);
  const isEditing = editing === o.id;
  const isCompleting = completing === o.id;
  const isDone = o.status === "done";

  // Локальное редактирование полей заявки
  const [editFields, setEditFields] = useState<EditForm>({
    name: o.name, phone: o.phone,
    model: o.model || "", repair_type: o.repair_type || "",
    price: o.price ? String(o.price) : "",
    comment: o.comment || "", admin_note: o.admin_note || "",
  });

  // Синхронизировать editFields при открытии редактирования
  const handleEditStart = () => {
    setEditFields({
      name: o.name, phone: o.phone,
      model: o.model || "", repair_type: o.repair_type || "",
      price: o.price ? String(o.price) : "",
      comment: o.comment || "", admin_note: o.admin_note || "",
    });
    onEditStart(o.id, o.admin_note || "");
  };

  const handleIssueAndPrint = async () => {
    await onIssueRepair(o.id);
    // Печать сразу после выдачи — передаём актуальные данные
    printReceipt({ ...o, status: "done" });
  };

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

      {/* Клиент + устройство — всегда видно */}
      {!isEditing && (
        <>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="font-roboto text-sm text-white font-medium">{o.name}</span>
            <a href={`tel:${o.phone}`} className="font-roboto text-sm text-[#FFD700] hover:underline">{o.phone}</a>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            {o.model
              ? <span className="font-roboto text-xs text-white/60 bg-white/5 px-2 py-0.5">📱 {o.model}</span>
              : <span className="font-roboto text-[10px] text-white/20 italic">Модель не указана</span>
            }
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

          {!isCompleting && o.comment && (
            <div className="font-roboto text-[10px] text-white/30 italic mb-1">💬 {o.comment}</div>
          )}
          {!isCompleting && o.admin_note && (
            <div className="font-roboto text-xs text-white/40 border-t border-white/5 pt-1.5 mt-1 mb-1">📝 {o.admin_note}</div>
          )}
        </>
      )}

      {/* Форма полного редактирования заявки */}
      {isEditing && (
        <div className="border-t border-white/10 pt-3 mt-2">
          <div className="font-roboto text-[10px] text-white/40 mb-2 uppercase tracking-wide">Редактировать заявку</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={LBL}>Имя клиента</label>
              <input value={editFields.name} onChange={e => setEditFields(p => ({ ...p, name: e.target.value }))}
                className={INP} placeholder="Иван Иванов" />
            </div>
            <div>
              <label className={LBL}>Телефон</label>
              <input value={editFields.phone} onChange={e => setEditFields(p => ({ ...p, phone: e.target.value }))}
                className={INP} placeholder="+7 999 000-00-00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={LBL}>Модель устройства</label>
              <input value={editFields.model} onChange={e => setEditFields(p => ({ ...p, model: e.target.value }))}
                className={INP} placeholder="iPhone 14, Samsung A54..." />
            </div>
            <div>
              <label className={LBL}>Тип ремонта</label>
              <input value={editFields.repair_type} onChange={e => setEditFields(p => ({ ...p, repair_type: e.target.value }))}
                className={INP} placeholder="Замена дисплея..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={LBL}>Стоимость (₽)</label>
              <input type="number" value={editFields.price} onChange={e => setEditFields(p => ({ ...p, price: e.target.value }))}
                className={INP} placeholder="1500" />
            </div>
            <div>
              <label className={LBL}>Комментарий клиента</label>
              <input value={editFields.comment} onChange={e => setEditFields(p => ({ ...p, comment: e.target.value }))}
                className={INP} placeholder="Описание поломки..." />
            </div>
          </div>
          <div className="mb-2">
            <label className={LBL}>Заметка мастера (для клиента)</label>
            <textarea value={editFields.admin_note} onChange={e => setEditFields(p => ({ ...p, admin_note: e.target.value }))}
              rows={2} className="w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors resize-none"
              placeholder="Заметка видна клиенту при проверке статуса..." />
          </div>

          <div className="font-roboto text-[10px] text-white/40 mb-1.5 uppercase tracking-wide mt-3">Изменить статус</div>
          <div className="flex flex-wrap gap-1 mb-3">
            {STATUSES.map(s => (
              <button key={s.key}
                onClick={() => onUpdateStatus(o.id, s.key, editFields.admin_note)}
                disabled={saving}
                className={`font-roboto text-xs px-2.5 py-1 border transition-colors disabled:opacity-50 ${o.status === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/50 hover:border-white/30"}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => onSaveEdit(o.id, editFields)} disabled={saving}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Icon name="Check" size={13} />
              {saving ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={onEditCancel} className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Форма завершения ремонта (→ статус ready) */}
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

      {/* Кнопки действий */}
      {!isEditing && !isCompleting && (
        <div className="flex gap-2 mt-2 pt-2 border-t border-white/5 flex-wrap items-center">
          {/* Редактировать — всегда */}
          <button onClick={handleEditStart}
            className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors">
            <Icon name="Pencil" size={11} /> Редактировать
          </button>

          {/* Удалить — только владелец */}
          {isOwner && onDelete && (
            confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="font-roboto text-[10px] text-red-400">Удалить заявку?</span>
                <button onClick={() => { onDelete(o.id); setConfirmDelete(false); }}
                  className="font-roboto text-[10px] text-red-400 hover:text-red-300 border border-red-500/40 px-2 py-0.5 transition-colors">
                  Да
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="font-roboto text-[10px] text-white/30 hover:text-white transition-colors px-1">
                  Нет
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-white/20 hover:text-red-400 font-roboto text-[10px] transition-colors">
                <Icon name="Trash2" size={11} /> Удалить
              </button>
            )
          )}

          {/* Перевести в Готово — если не ready и не done */}
          {o.status !== "ready" && o.status !== "done" && (
            <button onClick={() => onCompleteStart(o.id)}
              className="flex items-center gap-1 text-white/30 hover:text-[#FFD700] font-roboto text-[10px] transition-colors ml-auto">
              <Icon name="CheckCircle" size={11} /> Готово
            </button>
          )}

          {/* Выдать клиенту — только ready, сразу печатает */}
          {o.status === "ready" && (
            <button onClick={handleIssueAndPrint} disabled={saving}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white font-oswald font-bold px-3 py-1 text-xs uppercase transition-colors ml-auto disabled:opacity-50">
              <Icon name="PackageCheck" size={12} /> Выдать + Печать
            </button>
          )}

          {/* Статус «завершён» для done */}
          {isDone && (
            <span className="font-roboto text-[10px] text-green-400/50 flex items-center gap-1">
              <Icon name="CheckCircle" size={11} /> Ремонт завершён
            </span>
          )}

          {/* Печать чека — для ready и done */}
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