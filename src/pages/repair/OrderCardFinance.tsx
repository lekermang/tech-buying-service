import Icon from "@/components/ui/icon";
import { LBL } from "./types";

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

type Props = {
  orderId: number;
  ef: EditForm;
  onEditFormChange: (id: number, ef: EditForm) => void;
};

export default function OrderCardFinance({ orderId, ef, onEditFormChange }: Props) {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 space-y-2.5">
      <div className="font-oswald font-bold text-[#FFD700]/70 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
        <Icon name="Wallet" size={11} />
        Финансы заказа
      </div>

      <div>
        <label className={LBL + " text-orange-400/80 flex items-center gap-1"}>
          <Icon name="ShoppingBag" size={10} />Купленная запчасть
        </label>
        <input value={ef.parts_name}
          onChange={e => onEditFormChange(orderId, { ...ef, parts_name: e.target.value })}
          placeholder="Дисплей iPhone 14..."
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={LBL + " text-orange-400/80 flex items-center gap-1"}>
            <Icon name="ArrowDownCircle" size={10} />Закупка ₽
          </label>
          <input type="number" inputMode="numeric" value={ef.purchase_amount}
            onChange={e => onEditFormChange(orderId, { ...ef, purchase_amount: e.target.value })}
            placeholder="0"
            className="w-full bg-[#0A0A0A] border border-orange-500/20 text-orange-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-orange-500/60 tabular-nums transition-colors" />
          <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer active:opacity-70"
            onClick={() => onEditFormChange(orderId, { ...ef, purchase_amount: "0" })}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${ef.purchase_amount === "0" ? "bg-[#FFD700] border-[#FFD700] shadow-md shadow-[#FFD700]/30" : "border-white/30"}`}>
              {ef.purchase_amount === "0" && <Icon name="Check" size={10} className="text-black" />}
            </div>
            <span className="font-roboto text-[10px] text-white/40">Без закупки</span>
          </label>
        </div>
        <div>
          <label className={LBL + " text-green-400/80 flex items-center gap-1"}>
            <Icon name="ArrowUpCircle" size={10} />Выдано за ремонт ₽
          </label>
          <input type="number" inputMode="numeric" value={ef.repair_amount}
            onChange={e => onEditFormChange(orderId, { ...ef, repair_amount: e.target.value })}
            placeholder="1500"
            className="w-full bg-[#0A0A0A] border border-green-500/20 text-green-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-green-500/60 tabular-nums transition-colors" />
        </div>
      </div>

      {ef.repair_amount && ef.purchase_amount && (() => {
        const profit = parseInt(ef.repair_amount) - parseInt(ef.purchase_amount);
        const master = Math.max(0, Math.round(profit * 0.5));
        const clean = profit - master;
        return (
          <div className="bg-gradient-to-r from-[#FFD700]/10 via-green-500/5 to-transparent border border-[#FFD700]/20 rounded-md px-3 py-2.5 animate-in fade-in duration-300">
            <div className="font-roboto text-[9px] text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Icon name="Calculator" size={10} className="text-[#FFD700]/60" />
              Расчёт прибыли
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="font-roboto text-[9px] text-white/40">Прибыль</div>
                <div className={`font-oswald font-bold text-sm tabular-nums ${profit >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                  {profit.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div>
                <div className="font-roboto text-[9px] text-blue-400/70">Мастер 50%</div>
                <div className="font-oswald font-bold text-sm text-blue-400 tabular-nums">
                  {master.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div>
                <div className="font-roboto text-[9px] text-green-400/70">Чистая</div>
                <div className={`font-oswald font-bold text-sm tabular-nums ${clean >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {clean.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Аванс + Способ оплаты */}
      <div className="pt-2.5 border-t border-[#1F1F1F] space-y-2">
        <div>
          <label className={LBL + " text-blue-400/80 flex items-center gap-1"}>
            <Icon name="Coins" size={10} />Аванс ₽
          </label>
          <input type="number" inputMode="numeric" value={ef.advance}
            onChange={e => onEditFormChange(orderId, { ...ef, advance: e.target.value })}
            placeholder="0"
            className="w-full bg-[#0A0A0A] border border-blue-500/20 text-blue-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-blue-500/60 tabular-nums transition-colors" />
          {ef.advance && parseInt(ef.advance) > 0 && ef.repair_amount && (
            <div className="text-[10px] font-roboto text-blue-400/80 mt-1 flex items-center gap-1 bg-blue-500/5 border border-blue-500/15 rounded px-2 py-1">
              <Icon name="Info" size={10} />
              Остаток к доплате: <span className="font-bold tabular-nums">{(parseInt(ef.repair_amount) - parseInt(ef.advance)).toLocaleString("ru-RU")} ₽</span>
            </div>
          )}
        </div>
        <div>
          <label className={LBL + " flex items-center gap-1"}>
            <Icon name="CreditCard" size={10} />Способ оплаты
          </label>
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {[
              { v: "",        label: "Нет",     emoji: "—",  color: "bg-white/5" },
              { v: "cash",    label: "Нал",     emoji: "💵", color: "bg-green-500/10" },
              { v: "card",    label: "Карта",   emoji: "💳", color: "bg-blue-500/10" },
              { v: "transfer",label: "Перевод", emoji: "📲", color: "bg-purple-500/10" },
            ].map(opt => {
              const active = ef.payment_method === opt.v;
              return (
                <button key={opt.v} type="button"
                  onClick={() => onEditFormChange(orderId, { ...ef, payment_method: opt.v, is_paid: opt.v !== "" })}
                  className={`font-roboto text-[11px] py-2 rounded-md transition-all active:scale-95 flex flex-col items-center gap-0.5 ${
                    active
                      ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-md shadow-[#FFD700]/20"
                      : `${opt.color} border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]`
                  }`}>
                  <span className="text-sm leading-none">{opt.emoji}</span>
                  <span className="leading-none text-[10px]">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {ef.is_paid && ef.payment_method && (
            <div className="text-[10px] font-roboto text-green-400 mt-1.5 flex items-center gap-1 bg-green-500/5 border border-green-500/15 rounded px-2 py-1">
              <Icon name="CheckCircle2" size={10} />
              Оплачено: {ef.payment_method === "cash" ? "наличными" : ef.payment_method === "card" ? "картой" : "переводом"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
