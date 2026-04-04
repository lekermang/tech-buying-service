import Icon from "@/components/ui/icon";
import { EMPTY_FORM, INP, LBL } from "./types";

type Form = typeof EMPTY_FORM;

type Props = {
  form: Form;
  creating: boolean;
  onChange: (form: Form) => void;
  onCreate: () => void;
  onCancel: () => void;
};

export default function RepairCreateForm({ form, creating, onChange, onCreate, onCancel }: Props) {
  return (
    <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
      <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Имя клиента *</label>
          <input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })}
            placeholder="Иван Иванов" className={INP} />
        </div>
        <div>
          <label className={LBL}>Телефон *</label>
          <input value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })}
            placeholder="+7 999 123-45-67" className={INP} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Модель устройства</label>
          <input value={form.model} onChange={e => onChange({ ...form, model: e.target.value })}
            placeholder="iPhone 14, Samsung A54..." className={INP} />
        </div>
        <div>
          <label className={LBL}>Тип ремонта</label>
          <input value={form.repair_type} onChange={e => onChange({ ...form, repair_type: e.target.value })}
            placeholder="Замена дисплея, зарядка..." className={INP} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Примерная стоимость (₽)</label>
          <input type="number" value={form.price} onChange={e => onChange({ ...form, price: e.target.value })}
            placeholder="1500" className={INP} />
        </div>
        <div>
          <label className={LBL}>Комментарий</label>
          <input value={form.comment} onChange={e => onChange({ ...form, comment: e.target.value })}
            placeholder="Разбитый экран, не включается..." className={INP} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={onCreate} disabled={creating || !form.name || !form.phone}
          className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
          <Icon name="Check" size={13} />
          {creating ? "Создаю..." : "Создать заявку"}
        </button>
        <button onClick={onCancel}
          className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
          Отмена
        </button>
      </div>
    </div>
  );
}
