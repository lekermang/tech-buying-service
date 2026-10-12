import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GoldOrder, GOLD_STATUSES, PURITY_OPTIONS, PAYMENT_OPTIONS, money } from "./types";
import { toNum, to585, fmtG, fmtRub } from "./goldCalc";

type Props = {
  order: GoldOrder;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (id: number, status: string, extra?: Partial<EditForm>) => void;
  onSave: (order: GoldOrder, form: EditForm) => void | Promise<void>;
  onDelete: (id: number) => void;
  onQuickSell: (order: GoldOrder, price585: number) => void | Promise<void>;
  onOpenTag: (order: GoldOrder) => void;
  saving: boolean;
  saveError: string | null;
};

type EditForm = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string;
  sell_price_per_gram: string;
  comment: string; admin_note: string; payment_method: string;
};

const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]";
const LBL = "font-roboto text-[10px] text-white/30 mb-0.5";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function GoldOrderCard({ order, expanded, onToggle, onStatusChange, onSave, onDelete, onQuickSell, onOpenTag, saving, saveError }: Props) {
  const [quickSpg, setQuickSpg] = useState("");
  const [form, setForm] = useState<EditForm>({
    name: order.name, phone: order.phone,
    item_name: order.item_name || "", weight: order.weight ? String(order.weight) : "",
    purity: order.purity || "585", buy_price: order.buy_price ? String(order.buy_price) : "",
    sell_price: order.sell_price ? String(order.sell_price) : "",
    sell_price_per_gram: order.sell_price_per_gram ? String(order.sell_price_per_gram) : "",
    comment: order.comment || "", admin_note: order.admin_note || "",
    payment_method: order.payment_method || "",
  });

  const st = GOLD_STATUSES.find(s => s.key === order.status) || GOLD_STATUSES[0];

  // Live-расчёт: если задана цена за грамм и вес — итог = цена × вес.
  // Если оператор ввёл общую сумму вручную (sell_price) — берём её.
  const wNum = parseFloat(form.weight.replace(",", "."));
  const spgNum = parseFloat(form.sell_price_per_gram.replace(",", "."));
  const computedSell =
    !isNaN(spgNum) && spgNum > 0 && !isNaN(wNum) && wNum > 0
      ? Math.round(spgNum * wNum)
      : (form.sell_price ? parseInt(form.sell_price) : null);

  const qSpg = toNum(quickSpg);
  const qW585 = to585(order.weight || 0, order.purity);
  const qTotal = qSpg * qW585;
  const qProfit = qTotal - (order.buy_price || 0);
  const w585Card = order.weight ? to585(order.weight, order.purity) : 0;
  const isConverted = !!order.purity && toNum(order.purity) !== 585;

  const buyNum = form.buy_price ? parseInt(form.buy_price) : (order.buy_price || 0);
  const profit = computedSell != null ? computedSell - buyNum : order.profit;

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
        {isConverted && w585Card > 0 && (
          <div className="font-roboto text-[11px] text-[#FFD700]/70 mt-0.5">в пересчёте на 585: <b>{fmtG(w585Card)} г</b></div>
        )}
        {(order.buy_price || order.sell_price || order.sell_price_per_gram) && (
          <div className="flex gap-3 mt-1 flex-wrap items-baseline">
            {order.buy_price != null && <span className="font-oswald font-bold text-[#FFD700] text-sm">{money(order.buy_price)}</span>}
            {order.sell_price_per_gram != null && (
              <span className="font-roboto text-blue-400 text-xs">
                продажа: {Math.round(order.sell_price_per_gram).toLocaleString("ru-RU")} ₽/г
              </span>
            )}
            {order.sell_price != null && order.sell_price > 0 && (
              <span className="font-roboto text-blue-300 text-xs">
                сумма: <span className="font-bold">{money(order.sell_price)}</span>
              </span>
            )}
            {order.profit != null && order.profit !== 0 && (
              <span className={`font-roboto text-xs ${order.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                прибыль: <span className="font-bold">{money(order.profit)}</span>
              </span>
            )}
          </div>
        )}
        <div className="font-roboto text-white/20 text-[10px] mt-0.5">{fmt(order.created_at)}</div>
      </div>

      {order.status === "new" && order.weight ? (
        <div className="px-4 pb-3 -mt-1" onClick={e => e.stopPropagation()}>
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <input type="number" inputMode="decimal" value={quickSpg} onChange={e => setQuickSpg(e.target.value)}
                placeholder="Цена за 1 г (585)"
                className="w-full h-11 bg-[#0D0D0D] border border-blue-500/40 text-blue-300 pl-3 pr-8 rounded-md font-oswald font-bold text-base focus:outline-none focus:border-blue-400" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/50 text-sm">₽</span>
            </div>
            <button disabled={saving || qSpg <= 0}
              onClick={() => onQuickSell(order, qSpg)}
              className="h-11 px-4 rounded-md bg-gradient-to-b from-green-400 to-green-600 text-black font-oswald font-bold text-xs uppercase flex items-center gap-1.5 disabled:opacity-35 active:scale-95 transition shrink-0">
              <Icon name="BadgeCheck" size={15} />Продано
            </button>
            <button onClick={() => onOpenTag(order)} title="Ценник"
              className="h-11 w-11 rounded-md border border-[#FFD700]/40 text-[#FFD700] flex items-center justify-center active:scale-95 transition shrink-0">
              <Icon name="Printer" size={16} />
            </button>
          </div>
          {qSpg > 0 && (
            <div className="mt-1.5 flex items-center justify-between font-roboto text-[11px]">
              <span className="text-white/45">{fmtG(qW585)} г × {fmtRub(qSpg)} = <b className="text-blue-300">{fmtRub(qTotal)} ₽</b></span>
              <span className={qProfit >= 0 ? "text-green-400" : "text-red-400"}>
                прибыль: <b>{qProfit >= 0 ? "+" : "−"}{fmtRub(Math.abs(qProfit))} ₽</b>
              </span>
            </div>
          )}
        </div>
      ) : order.status === "done" ? (
        <div className="px-4 pb-3 -mt-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => onOpenTag(order)}
            className="h-8 px-3 rounded-md border border-[#FFD700]/30 text-[#FFD700]/80 flex items-center gap-1.5 font-roboto text-[11px] active:scale-95 transition">
            <Icon name="Printer" size={13} />Печать ценника
          </button>
        </div>
      ) : null}

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
              <div className={LBL}>Продажа ₽/г</div>
              <input type="number" step="0.01" className={INP + " border-blue-500/30"} placeholder="6200"
                value={form.sell_price_per_gram}
                onChange={e => setForm(f => ({ ...f, sell_price_per_gram: e.target.value }))} />
            </div>
          </div>

          {/* Live-итог продажи и прибыли */}
          {(computedSell != null && computedSell > 0) && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded px-3 py-2 mb-2 grid grid-cols-2 gap-2">
              <div>
                <div className="font-roboto text-[10px] text-white/40 uppercase">Сумма продажи</div>
                <div className="font-oswald font-bold text-blue-300 text-base tabular-nums">
                  {money(computedSell)}
                </div>
                {!isNaN(spgNum) && spgNum > 0 && !isNaN(wNum) && wNum > 0 && (
                  <div className="font-roboto text-[10px] text-white/30">
                    {spgNum.toLocaleString("ru-RU")} × {wNum}г
                  </div>
                )}
              </div>
              <div>
                <div className="font-roboto text-[10px] text-white/40 uppercase">Прибыль</div>
                <div className={`font-oswald font-bold text-base tabular-nums ${(profit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {money(profit)}
                </div>
                {buyNum > 0 && (
                  <div className="font-roboto text-[10px] text-white/30">продажа − закупка</div>
                )}
              </div>
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

          <div className="flex gap-2">
            <button onClick={() => onSave(order, form)} disabled={saving}
              className="flex-1 bg-[#FFD700] text-black font-oswald font-bold py-2 text-xs uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
              {saving ? <><Icon name="Loader" size={12} className="animate-spin" />Сохраняю...</> : "Сохранить"}
            </button>
            <button
              onClick={() => { if (window.confirm(`Удалить заявку #${order.id} (${order.name})?`)) onDelete(order.id); }}
              disabled={saving}
              className="px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-1 font-roboto text-xs">
              <Icon name="Trash2" size={13} />
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}