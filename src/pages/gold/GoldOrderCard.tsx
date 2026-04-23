import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldOrder, GOLD_STATUSES, PURITY_OPTIONS, PAYMENT_OPTIONS, money } from "./types";

type Props = {
  order: GoldOrder;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: number, status: string, extra?: Partial<EditForm>) => void;
  onSave: (order: GoldOrder, form: EditForm) => void;
  saving: boolean;
  saveError: string | null;
};

type EditForm = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string;
  comment: string; admin_note: string; payment_method: string;
};

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]";
const LBL = "font-roboto text-[10px] text-white/30 mb-0.5";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function GoldOrderCard({ order, expanded, onToggle, onStatusChange, onSave, saving, saveError }: Props) {
  const [form, setForm] = useState<EditForm>({
    name: order.name, phone: order.phone,
    item_name: order.item_name || "", weight: order.weight ? String(order.weight) : "",
    purity: order.purity || "585", buy_price: order.buy_price ? String(order.buy_price) : "",
    sell_price: order.sell_price ? String(order.sell_price) : "",
    comment: order.comment || "", admin_note: order.admin_note || "",
    payment_method: order.payment_method || "",
  });

  const st = GOLD_STATUSES.find(s => s.key === order.status) || GOLD_STATUSES[0];

  const profit = form.buy_price && form.sell_price
    ? parseInt(form.sell_price) - parseInt(form.buy_price) : order.profit;

  return (
    <div className="border-b border-[#1A1A1A]">
      {/* Заголовок карточки */}
      <div className="px-4 py-3 cursor-pointer active:bg-white/[0.02]" onClick={onToggle}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-oswald font-bold text-[#FFD700] text-sm">#{order.id}</span>
            <span className={`font-roboto text-[10px] px-1.5 py-0.5 ${st.color}`}>{st.label}</span>
            <span className="font-roboto font-bold text-white text-sm">{order.name}</span>
          </div>
          <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30 shrink-0" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-roboto text-[#FFD700] text-xs">{order.phone}</span>
          {order.item_name && <span className="font-roboto text-white/40 text-xs">· {order.item_name}</span>}
          {order.purity && <span className="font-roboto text-white/30 text-xs">· {order.purity}</span>}
          {order.weight && <span className="font-roboto text-white/30 text-xs">· {order.weight}г</span>}
        </div>
        {(order.buy_price || order.sell_price) && (
          <div className="flex gap-3 mt-1 flex-wrap">
            {order.buy_price && <span className="font-oswald font-bold text-[#FFD700] text-sm">{money(order.buy_price)}</span>}
            {order.sell_price && <span className="font-roboto text-blue-400 text-xs">продажа: {money(order.sell_price)}</span>}
            {order.profit != null && order.profit > 0 && <span className="font-roboto text-green-400 text-xs">прибыль: {money(order.profit)}</span>}
          </div>
        )}
        <div className="font-roboto text-white/20 text-[10px] mt-0.5">{fmt(order.created_at)}</div>
      </div>

      {/* Развёрнутая форма */}
      {expanded && (
        <div className="px-4 pb-4 bg-[#0A0A0A] border-t border-[#1A1A1A]">

          {/* Смена статуса */}
          <div className="flex gap-1.5 flex-wrap py-3">
            {GOLD_STATUSES.map(s => (
              <button key={s.key}
                onClick={() => onStatusChange(order.id, s.key)}
                disabled={saving}
                className={`font-roboto text-[10px] px-2.5 py-1 border transition-colors ${order.status === s.key ? s.color + " border-current" : "border-[#2A2A2A] text-white/30 hover:text-white"}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${s.dot}`} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Поля редактирования */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className={LBL}>Имя клиента</div>
              <input className={INP} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <div className={LBL}>Телефон</div>
              <input className={INP} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className={LBL}>Изделие</div>
              <input className={INP} placeholder="Кольцо, цепочка..." value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} />
            </div>
            <div>
              <div className={LBL}>Проба</div>
              <select className={INP} value={form.purity} onChange={e => setForm(f => ({ ...f, purity: e.target.value }))}>
                <option value="">— не указана —</option>
                {PURITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <div className={LBL}>Вес (г)</div>
              <input type="number" step="0.01" className={INP} placeholder="0.00" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div>
              <div className={LBL}>Закупка ₽</div>
              <input type="number" className={INP} placeholder="0" value={form.buy_price} onChange={e => setForm(f => ({ ...f, buy_price: e.target.value }))} />
            </div>
            <div>
              <div className={LBL}>Продажа ₽</div>
              <input type="number" className={INP} placeholder="0" value={form.sell_price} onChange={e => setForm(f => ({ ...f, sell_price: e.target.value }))} />
            </div>
          </div>

          {profit != null && profit > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 mb-2 font-roboto text-green-400 text-xs">
              Прибыль: <span className="font-bold">{money(profit)}</span>
            </div>
          )}

          <div className="mb-2">
            <div className={LBL}>Способ оплаты</div>
            <select className={INP} value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}>
              <option value="">— не указан —</option>
              {PAYMENT_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </div>

          <div className="mb-2">
            <div className={LBL}>Комментарий</div>
            <input className={INP} value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
          </div>

          <div className="mb-3">
            <div className={LBL}>Заметка</div>
            <input className={INP} value={form.admin_note} onChange={e => setForm(f => ({ ...f, admin_note: e.target.value }))} />
          </div>

          {saveError && <div className="text-red-400 font-roboto text-xs mb-2">{saveError}</div>}

          <button onClick={() => onSave(order, form)} disabled={saving}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2 text-xs uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving ? <><Icon name="Loader" size={12} className="animate-spin" />Сохраняю...</> : "Сохранить"}
          </button>
        </div>
      )}
    </div>
  );
}
