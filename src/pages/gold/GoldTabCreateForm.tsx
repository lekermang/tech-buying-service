import Icon from "@/components/ui/icon";
import { PURITY_OPTIONS } from "./types";

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-sm focus:outline-none focus:border-[#FFD700] placeholder:text-white/20";

type FormData = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string; comment: string;
};

type Props = {
  form: FormData;
  onFormChange: (updater: (f: FormData) => FormData) => void;
  creating: boolean;
  onCreate: () => void;
};

export default function GoldTabCreateForm({ form, onFormChange, creating, onCreate }: Props) {
  return (
    <div className="mx-3 mt-3 mb-1 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 rounded-lg p-4 shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
      <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Icon name="Gem" size={12} /> Новая заявка — Золото
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Имя *</div>
          <input className={INP} placeholder="Имя клиента" value={form.name} onChange={e => onFormChange(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Телефон *</div>
          <input className={INP} placeholder="+7..." value={form.phone} onChange={e => onFormChange(f => ({ ...f, phone: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Изделие</div>
          <input className={INP} placeholder="Кольцо, цепочка..." value={form.item_name} onChange={e => onFormChange(f => ({ ...f, item_name: e.target.value }))} />
        </div>
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Проба</div>
          <select className={INP} value={form.purity} onChange={e => onFormChange(f => ({ ...f, purity: e.target.value }))}>
            {PURITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Вес (г)</div>
          <input type="number" step="0.01" className={INP} placeholder="0.00" value={form.weight} onChange={e => onFormChange(f => ({ ...f, weight: e.target.value }))} />
        </div>
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Закупка ₽</div>
          <input type="number" className={INP} placeholder="0" value={form.buy_price} onChange={e => onFormChange(f => ({ ...f, buy_price: e.target.value }))} />
        </div>
        <div>
          <div className="font-roboto text-[10px] text-white/30 mb-0.5">Продажа ₽</div>
          <input type="number" className={INP} placeholder="0" value={form.sell_price} onChange={e => onFormChange(f => ({ ...f, sell_price: e.target.value }))} />
        </div>
      </div>
      <div className="mb-3">
        <div className="font-roboto text-[10px] text-white/30 mb-0.5">Комментарий</div>
        <input className={INP} placeholder="Комментарий..." value={form.comment} onChange={e => onFormChange(f => ({ ...f, comment: e.target.value }))} />
      </div>
      <button onClick={onCreate} disabled={creating || !form.name || !form.phone}
        className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 text-sm uppercase rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {creating ? <><Icon name="Loader" size={14} className="animate-spin" />Создаю...</> : <><Icon name="Check" size={15} />Создать заявку</>}
      </button>
    </div>
  );
}
