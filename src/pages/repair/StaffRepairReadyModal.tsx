import Icon from "@/components/ui/icon";
import { Order, INP, LBL } from "./types";

type ReadyForm = { purchase_amount: string; repair_amount: string; parts_name: string; admin_note: string };

type Props = {
  order: Order;
  form: ReadyForm;
  error: string | null;
  saving: boolean;
  onFormChange: (form: ReadyForm) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export default function StaffRepairReadyModal({ order, form, error, saving, onFormChange, onSubmit, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1A1A1A] border border-[#FFD700]/40 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-7 bg-[#FFD700]" />
          <div>
            <div className="font-oswald font-bold text-base uppercase">Перевод в «Готово»</div>
            <div className="font-roboto text-white/40 text-xs">#{order.id} · {order.name}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть *</label>
            <input value={form.parts_name}
              onChange={e => onFormChange({ ...form, parts_name: e.target.value })}
              placeholder="Дисплей iPhone 14, аккумулятор..." className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽) *</label>
              <input type="number" value={form.purchase_amount}
                onChange={e => onFormChange({ ...form, purchase_amount: e.target.value })}
                placeholder="500" className={INP} />
            </div>
            <div>
              <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽) *</label>
              <input type="number" value={form.repair_amount}
                onChange={e => onFormChange({ ...form, repair_amount: e.target.value })}
                placeholder="1500" className={INP} />
            </div>
          </div>

          {form.repair_amount && form.purchase_amount && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 font-roboto text-sm text-center">
              <div className="text-white/40 text-[10px] mb-0.5">Доход мастера (50% от прибыли)</div>
              <div className="text-green-400 font-bold text-xl">
                {Math.max(0, Math.round((parseInt(form.repair_amount) - parseInt(form.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
              </div>
              <div className="text-white/30 text-[10px] mt-0.5">
                прибыль: {(parseInt(form.repair_amount) - parseInt(form.purchase_amount)).toLocaleString("ru-RU")} ₽
              </div>
            </div>
          )}

          <div>
            <label className={LBL}>Заметка</label>
            <textarea value={form.admin_note}
              onChange={e => onFormChange({ ...form, admin_note: e.target.value })}
              rows={2} placeholder="Внутренняя заметка..." className={INP + " resize-none"} />
          </div>

          {error && <div className="text-red-400 font-roboto text-xs">{error}</div>}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onSubmit} disabled={saving}
            className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="Check" size={15} />{saving ? "Сохраняю..." : "Подтвердить"}
          </button>
          <button onClick={onClose}
            className="px-4 text-white/30 font-roboto text-xs hover:text-white transition-colors">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
