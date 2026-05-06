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
    <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] border border-[#FFD700]/20 rounded-xl p-3 space-y-2.5 shadow-[0_4px_18px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.05)] overflow-hidden">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent pointer-events-none" />
      <span aria-hidden className="absolute -top-10 -left-10 w-28 h-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
      <div className="relative font-oswald font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
        <span className="relative inline-flex">
          <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-sm" />
          <Icon name="Wallet" size={12} className="relative text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
        </span>
        <span className="bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
          Финансы заказа
        </span>
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

      {/* Подсказка из предварительной оценки — для удобства мастера */}
      {ef.price && (!ef.repair_amount || parseInt(ef.repair_amount) === 0) && (
        <button
          type="button"
          onClick={() => onEditFormChange(orderId, { ...ef, repair_amount: ef.price })}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md border border-[#FFD700]/25 bg-[#FFD700]/5 hover:bg-[#FFD700]/10 transition-colors text-[10px] font-roboto text-[#FFD700]/85"
          title="Заполнить «Цена клиенту» из предварительной оценки"
        >
          <span className="inline-flex items-center gap-1.5">
            <Icon name="Sparkles" size={10} />
            Предв. оценка: <span className="font-oswald font-bold tabular-nums">{parseInt(ef.price).toLocaleString("ru-RU")} ₽</span>
          </span>
          <span className="inline-flex items-center gap-0.5 uppercase tracking-wider">
            Перенести
            <Icon name="ArrowRight" size={10} />
          </span>
        </button>
      )}

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
            <Icon name="ArrowUpCircle" size={10} />Цена клиенту ₽
          </label>
          <input type="number" inputMode="numeric" value={ef.repair_amount}
            onChange={e => onEditFormChange(orderId, { ...ef, repair_amount: e.target.value })}
            placeholder="1500"
            className="w-full bg-[#0A0A0A] border border-green-500/20 text-green-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-green-500/60 tabular-nums transition-colors" />
          <div className="text-[9px] text-white/40 mt-1 leading-tight">
            Можно вписать на любом этапе — даже до «Готов».
          </div>
        </div>
      </div>

      {ef.repair_amount && ef.purchase_amount && (() => {
        const profit = parseInt(ef.repair_amount) - parseInt(ef.purchase_amount);
        const master = Math.max(0, Math.round(profit * 0.5));
        const clean = profit - master;
        return (
          <div className="relative bg-gradient-to-r from-[#FFD700]/15 via-emerald-500/8 to-transparent border border-[#FFD700]/30 rounded-lg px-3 py-2.5 animate-in fade-in duration-300 shadow-[0_2px_12px_rgba(255,215,0,0.15)] overflow-hidden">
            <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/55 to-transparent" />
            <div className="relative font-roboto text-[9px] text-[#FFD700]/80 uppercase tracking-[0.08em] font-bold mb-1.5 flex items-center gap-1">
              <Icon name="Calculator" size={10} className="text-[#FFD700] drop-shadow-[0_0_3px_rgba(255,215,0,0.6)]" />
              Расчёт прибыли
            </div>
            <div className="relative grid grid-cols-3 gap-2">
              <div>
                <div className="font-roboto text-[9px] text-white/50 uppercase tracking-wider">Прибыль</div>
                <div className={`font-oswald font-bold text-base tabular-nums ${profit >= 0 ? "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]" : "text-red-400"}`}>
                  {profit.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div>
                <div className="font-roboto text-[9px] text-blue-400/80 uppercase tracking-wider">Мастер 50%</div>
                <div className="font-oswald font-bold text-base text-blue-300 tabular-nums drop-shadow-[0_0_4px_rgba(59,130,246,0.35)]">
                  {master.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div>
                <div className="font-roboto text-[9px] text-emerald-400/80 uppercase tracking-wider">Чистая</div>
                <div className={`font-oswald font-bold text-base tabular-nums ${clean >= 0 ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]" : "text-red-400"}`}>
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
                  title={opt.label}
                  className={`relative font-roboto text-[11px] py-2 rounded-md transition-all active:scale-95 flex flex-col items-center gap-0.5 overflow-hidden ${
                    active
                      ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
                      : `${opt.color} border border-[#1F1F1F] text-white/65 hover:text-white hover:border-[#FFD700]/30 hover:shadow-[0_0_10px_rgba(255,215,0,0.15)]`
                  }`}>
                  {active && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-md pointer-events-none" />}
                  <span className="relative text-sm leading-none">{opt.emoji}</span>
                  <span className="relative leading-none text-[10px]">{opt.label}</span>
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