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
      <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#1F1F1F] rounded-xl p-3 space-y-2.5 shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.04)] overflow-hidden">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent pointer-events-none" />
        <div className="relative font-oswald font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
          <Icon name="FileEdit" size={12} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]" />
          <span className="text-[#FFD700]/85">Данные заявки</span>
        </div>
        <div className="relative grid grid-cols-2 gap-2">
          {[
            { key: "name", label: "Имя", ph: "Иван", icon: "User", value: ef.name, set: (v: string) => onEditFormChange(o.id, { ...ef, name: v }) },
            { key: "phone", label: "Телефон", ph: "+7...", icon: "Phone", type: "tel", value: ef.phone, set: (v: string) => onEditFormChange(o.id, { ...ef, phone: formatPhone(v) }) },
            { key: "model", label: "Модель", ph: "iPhone 14", icon: "Smartphone", value: ef.model, set: (v: string) => onEditFormChange(o.id, { ...ef, model: v }) },
            { key: "repair_type", label: "Тип ремонта", ph: "Дисплей", icon: "Wrench", value: ef.repair_type, set: (v: string) => onEditFormChange(o.id, { ...ef, repair_type: v }) },
          ].map(f => (
            <div key={f.key}>
              <label className={LBL + " flex items-center gap-1"}>
                <Icon name={f.icon} size={9} className="text-[#FFD700]/70" />{f.label}
              </label>
              <input type={f.type || "text"} value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none placeholder:text-white/25 transition-all" />
            </div>
          ))}
        </div>
        <div className="relative">
          <label className={LBL + " flex items-center gap-1"}>
            <Icon name="StickyNote" size={9} className="text-[#FFD700]/70" />Заметка
          </label>
          <textarea value={ef.admin_note}
            onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
            rows={2} placeholder="Внутренняя заметка..."
            className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08)] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none placeholder:text-white/25 resize-none transition-all" />
        </div>
      </div>

      {saveError && (
        <div className="relative bg-gradient-to-r from-red-500/15 to-red-500/5 border border-red-500/40 rounded-md px-3 py-2 flex items-center gap-1.5 text-red-300 font-roboto text-xs shadow-[0_0_12px_rgba(239,68,68,0.2)]">
          <span className="relative">
            <span className="absolute inset-0 rounded-full bg-red-400/40 blur-sm animate-pulse" />
            <Icon name="AlertCircle" size={12} className="relative" />
          </span>
          {saveError}
        </div>
      )}

      {/* Кнопка сохранить — премиум */}
      <button
        onClick={() => onSaveCard(o)}
        disabled={saving}
        title="Сохранить изменения в заявке"
        className="w-full btn-gold-premium !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
        {saving ? "Сохраняю..." : "Сохранить изменения"}
      </button>
    </>
  );
}