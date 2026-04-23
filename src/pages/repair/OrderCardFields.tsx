import Icon from "@/components/ui/icon";
import { Order, LBL } from "./types";
import { formatPhone } from "@/lib/phoneFormat";

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

type Props = {
  o: Order;
  ef: EditForm;
  saving: boolean;
  saveError: string | null;
  onEditFormChange: (id: number, ef: EditForm) => void;
  onSaveCard: (o: Order) => void;
};

export default function OrderCardFields({ o, ef, saving, saveError, onEditFormChange, onSaveCard }: Props) {
  return (
    <>
      {/* Поля заявки — премиум блок */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 space-y-2.5">
        <div className="font-oswald font-bold text-white/50 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
          <Icon name="FileEdit" size={11} />
          Данные заявки
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: "name", label: "Имя", ph: "Иван", icon: "User", value: ef.name, set: (v: string) => onEditFormChange(o.id, { ...ef, name: v }) },
            { key: "phone", label: "Телефон", ph: "+7...", icon: "Phone", type: "tel", value: ef.phone, set: (v: string) => onEditFormChange(o.id, { ...ef, phone: formatPhone(v) }) },
            { key: "model", label: "Модель", ph: "iPhone 14", icon: "Smartphone", value: ef.model, set: (v: string) => onEditFormChange(o.id, { ...ef, model: v }) },
            { key: "repair_type", label: "Тип ремонта", ph: "Дисплей", icon: "Wrench", value: ef.repair_type, set: (v: string) => onEditFormChange(o.id, { ...ef, repair_type: v }) },
          ].map(f => (
            <div key={f.key}>
              <label className={LBL + " flex items-center gap-1"}>
                <Icon name={f.icon} size={9} className="opacity-50" />{f.label}
              </label>
              <input type={f.type || "text"} value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 transition-colors" />
            </div>
          ))}
        </div>
        <div>
          <label className={LBL + " flex items-center gap-1"}>
            <Icon name="StickyNote" size={9} className="opacity-50" />Заметка
          </label>
          <textarea value={ef.admin_note}
            onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
            rows={2} placeholder="Внутренняя заметка..."
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 resize-none transition-colors" />
        </div>
      </div>

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 flex items-center gap-1.5 text-red-400 font-roboto text-xs">
          <Icon name="AlertCircle" size={12} />{saveError}
        </div>
      )}

      {/* Кнопка сохранить */}
      <button onClick={() => onSaveCard(o)} disabled={saving}
        className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
        <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
        {saving ? "Сохраняю..." : "Сохранить изменения"}
      </button>
    </>
  );
}
