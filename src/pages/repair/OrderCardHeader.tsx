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
    <div
      className={`relative p-3 cursor-pointer select-none transition-colors group ${
        isExpanded ? "" : "hover:bg-[#FFD700]/[0.03] active:bg-white/5"
      }`}
      onClick={onToggle}
    >
      {/* Акцент-полоска слева по статусу с glow */}
      <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${st.dot} ${isExpanded ? "shadow-[0_0_8px_currentColor]" : ""}`} />

      {/* Строка 1: премиум медальон #ID + статус + имя */}
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
          {/* Premium медальон номера */}
          <div className={`relative shrink-0 inline-flex items-center justify-center px-2.5 h-7 rounded-md transition-all ${
            isExpanded
              ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] shadow-[0_3px_12px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.55)]"
              : "bg-[#FFD700]/12 border border-[#FFD700]/40 group-hover:bg-[#FFD700]/20 group-hover:border-[#FFD700]/60"
          }`}>
            {isExpanded && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-md pointer-events-none" />}
            <span className={`relative font-oswald font-bold text-sm tabular-nums ${isExpanded ? "text-black" : "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]"}`}>#{o.id}</span>
          </div>

          {/* Светящаяся плашка статуса */}
          <span className={`relative font-roboto text-[10px] px-2 py-0.5 inline-flex items-center gap-1 shrink-0 rounded-full ${st.color} ${isExpanded ? "ring-1 ring-current shadow-[0_0_8px_currentColor]" : ""}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${isExpanded ? "animate-pulse shadow-[0_0_4px_currentColor]" : ""}`} />{st.label}
          </span>

          {o.status === "ready" && (o.repair_amount == null || o.purchase_amount == null) && (
            <span title="Не заполнены суммы для статистики"
              className="font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-orange-500/25 text-orange-200 border border-orange-400/50 inline-flex items-center gap-0.5 shrink-0 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.4)]">
              <Icon name="AlertTriangle" size={10} /> Заполнить
            </span>
          )}
          <span className={`font-roboto text-sm font-semibold truncate ${isExpanded ? "text-white" : "text-white/95"}`}>{o.name}</span>
        </div>
        <div className={`relative shrink-0 mt-0.5 transition-all ${isExpanded ? "rotate-0" : ""}`}>
          {isExpanded && <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md" />}
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className={`relative transition-all ${isExpanded ? "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" : "text-white/40 group-hover:text-[#FFD700]"}`} />
        </div>
      </div>

      {/* Строка 2: телефон + устройство */}
      <div className="flex items-center gap-3 mt-1.5 flex-wrap pl-2">
        <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
          className="font-roboto text-sm text-[#FFD700] font-medium inline-flex items-center gap-1.5 hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.6)] transition">
          <Icon name="Phone" size={13} className="opacity-70" />
          {o.phone}
        </a>
        <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Открыть Telegram-бот"
          className="text-[#229ED9] inline-flex items-center gap-1 font-roboto text-xs hover:drop-shadow-[0_0_6px_rgba(34,158,217,0.7)] transition">
          <Icon name="Send" size={13} />
        </a>
        {o.model && <span className="text-white/50 font-roboto text-xs">📱 {o.model}</span>}
        {o.repair_type && <span className="text-white/50 font-roboto text-xs">🔧 {o.repair_type}</span>}
      </div>

      {/* Строка 3: цены + аванс + оплата */}
      <div className="flex items-center gap-3 mt-1 flex-wrap pl-2">
        {o.price && <span className="text-[#FFD700] font-roboto text-xs font-bold drop-shadow-[0_0_4px_rgba(255,215,0,0.4)]">{o.price.toLocaleString("ru-RU")} ₽</span>}
        {o.repair_amount != null && <span className="text-emerald-400 font-roboto text-xs font-bold">✓ {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
        {o.master_income != null && <span className="text-emerald-300/80 font-roboto text-[10px]">мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
        {o.is_paid && o.payment_method && (
          <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]">
            {o.payment_method === "cash" ? "💵 Нал" : o.payment_method === "card" ? "💳 Карта" : "📲 Перевод"}
          </span>
        )}
        {!o.is_paid && o.advance != null && o.advance > 0 && (
          <span className="font-roboto text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.25)]">
            💵 {o.advance.toLocaleString("ru-RU")} ₽
          </span>
        )}
      </div>

      {/* Информация о выбранной запчасти — премиум блок */}
      {o.part_name && (
        <div
          className={`relative mt-2 ml-2 rounded-lg overflow-hidden border px-2.5 py-1.5 text-xs font-roboto flex items-start gap-2 ${
            o.part_source === "stock"
              ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/8 to-transparent border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
              : "bg-gradient-to-r from-[#FFD700]/15 via-[#FFD700]/8 to-transparent border-[#FFD700]/40 shadow-[0_0_12px_rgba(255,215,0,0.20)]"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <span aria-hidden className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${o.part_source === "stock" ? "via-emerald-400/60" : "via-[#FFD700]/60"} to-transparent`} />
          <div className="relative shrink-0 mt-0.5">
            <span className={`absolute inset-0 rounded-full blur-sm ${o.part_source === "stock" ? "bg-emerald-400/40" : "bg-[#FFD700]/40"}`} />
            <Icon
              name={o.part_source === "stock" ? "Zap" : "Truck"}
              size={14}
              className={`relative ${o.part_source === "stock" ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.7)]" : "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={`font-oswald font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                o.part_source === "stock"
                  ? "bg-emerald-500/30 text-emerald-200"
                  : "bg-[#FFD700]/30 text-[#FFD700]"
              }`}>
                {o.part_source === "stock" ? "🟢 МойСклад · в наличии" : "🟡 Прайс поставщика · под заказ"}
              </span>
              {o.part_quality && (
                <span className="font-oswald font-bold text-[10px] text-[#FFD700]">{o.part_quality}</span>
              )}
              {o.part_code && (
                <span className="font-roboto text-[10px] text-white/50">арт. {o.part_code}</span>
              )}
            </div>
            <div className="text-white/90 leading-snug break-words">{o.part_name}</div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px]">
              {o.part_category && <span className="text-white/45">📁 {o.part_category}</span>}
              {o.part_supplier && <span className="text-white/45">🏭 {o.part_supplier}</span>}
              {o.part_supplier_price != null && (
                <span className="text-orange-300">закупка {o.part_supplier_price.toLocaleString("ru-RU")} ₽</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-1 flex-wrap pl-2">
        <span className="text-white/30 font-roboto text-[9px]">📥 {fmt(o.created_at)}</span>
        {o.picked_up_at && <span className="text-emerald-400/60 font-roboto text-[9px]">📤 {fmt(o.picked_up_at)}</span>}
        {o.completed_at && !o.picked_up_at && <span className="text-yellow-400/50 font-roboto text-[9px]">✅ {fmt(o.completed_at)}</span>}
      </div>
    </div>
  );
}
