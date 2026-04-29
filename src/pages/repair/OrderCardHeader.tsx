import Icon from "@/components/ui/icon";
import { Order, STATUSES, fmt } from "./types";

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

type Props = {
  o: Order;
  isExpanded: boolean;
  onToggle: () => void;
};

export default function OrderCardHeader({ o, isExpanded, onToggle }: Props) {
  const st = statusInfo(o.status);

  return (
    <div className="p-3 active:bg-white/5 transition-colors cursor-pointer select-none relative" onClick={onToggle}>
      {/* Акцент-полоска слева по статусу */}
      <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${st.dot}`} />

      {/* Строка 1: номер + статус + имя */}
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          <span className="font-oswald font-bold text-[#FFD700] text-base shrink-0 tabular-nums">#{o.id}</span>
          <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0 rounded-full ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
          </span>
          {o.status === "ready" && (o.repair_amount == null || o.purchase_amount == null) && (
            <span title="Не заполнены суммы для статистики"
              className="font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-orange-500/20 text-orange-300 border border-orange-400/40 flex items-center gap-0.5 shrink-0 animate-pulse">
              <Icon name="AlertTriangle" size={10} /> Заполнить
            </span>
          )}
          <span className="font-roboto text-sm text-white font-semibold truncate">{o.name}</span>
        </div>
        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className={`shrink-0 mt-0.5 transition-all ${isExpanded ? "text-[#FFD700]" : "text-white/30"}`} />
      </div>

      {/* Строка 2: телефон + устройство */}
      <div className="flex items-center gap-3 mt-1.5 flex-wrap pl-1.5">
        <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
          className="font-roboto text-sm text-[#FFD700] font-medium flex items-center gap-1.5">
          <Icon name="Phone" size={13} className="opacity-60" />
          {o.phone}
        </a>
        <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-[#229ED9] flex items-center gap-1 font-roboto text-xs">
          <Icon name="Send" size={13} />
        </a>
        {o.model && <span className="text-white/40 font-roboto text-xs">📱 {o.model}</span>}
        {o.repair_type && <span className="text-white/40 font-roboto text-xs">🔧 {o.repair_type}</span>}
      </div>

      {/* Строка 3: цены + аванс + оплата */}
      <div className="flex items-center gap-3 mt-1 flex-wrap pl-1.5">
        {o.price && <span className="text-[#FFD700] font-roboto text-xs font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
        {o.repair_amount != null && <span className="text-green-400 font-roboto text-xs">✓ {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
        {o.master_income != null && <span className="text-green-300/70 font-roboto text-[10px]">мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
        {o.is_paid && o.payment_method && (
          <span className="font-roboto text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30">
            {o.payment_method === "cash" ? "💵 Нал" : o.payment_method === "card" ? "💳 Карта" : "📲 Перевод"}
          </span>
        )}
        {!o.is_paid && o.advance != null && o.advance > 0 && (
          <span className="font-roboto text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">
            💵 {o.advance.toLocaleString("ru-RU")} ₽
          </span>
        )}
      </div>
      {/* Информация о выбранной запчасти — откуда заказывать */}
      {o.part_name && (
        <div className={`mt-2 ml-1.5 rounded-md border px-2.5 py-1.5 text-xs font-roboto flex items-start gap-2
          ${o.part_source === "stock"
            ? "bg-green-500/10 border-green-500/30"
            : "bg-[#FFD700]/10 border-[#FFD700]/30"}`}
          onClick={e => e.stopPropagation()}>
          <Icon
            name={o.part_source === "stock" ? "Zap" : "Truck"}
            size={14}
            className={o.part_source === "stock" ? "text-green-400 mt-0.5 shrink-0" : "text-[#FFD700] mt-0.5 shrink-0"}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={`font-oswald font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm
                ${o.part_source === "stock"
                  ? "bg-green-500/25 text-green-300"
                  : "bg-[#FFD700]/25 text-[#FFD700]"}`}>
                {o.part_source === "stock" ? "🟢 МойСклад · в наличии" : "🟡 Прайс поставщика · под заказ"}
              </span>
              {o.part_quality && (
                <span className="font-oswald font-bold text-[10px] text-[#FFD700]">{o.part_quality}</span>
              )}
              {o.part_code && (
                <span className="font-roboto text-[10px] text-white/40">арт. {o.part_code}</span>
              )}
            </div>
            <div className="text-white/85 leading-snug break-words">{o.part_name}</div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px]">
              {o.part_category && <span className="text-white/40">📁 {o.part_category}</span>}
              {o.part_supplier && <span className="text-white/40">🏭 {o.part_supplier}</span>}
              {o.part_supplier_price != null && (
                <span className="text-orange-400/90">закупка {o.part_supplier_price.toLocaleString("ru-RU")} ₽</span>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3 mt-0.5 flex-wrap pl-1.5">
        <span className="text-white/20 font-roboto text-[9px]">📥 {fmt(o.created_at)}</span>
        {o.picked_up_at && <span className="text-green-400/50 font-roboto text-[9px]">📤 {fmt(o.picked_up_at)}</span>}
        {o.completed_at && !o.picked_up_at && <span className="text-yellow-400/40 font-roboto text-[9px]">✅ {fmt(o.completed_at)}</span>}
      </div>
    </div>
  );
}