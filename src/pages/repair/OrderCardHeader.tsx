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
  const initials = (o.name || "")
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  const needsAmounts = o.status === "ready" && (o.repair_amount == null || o.purchase_amount == null);
  const profit =
    o.repair_amount != null && o.purchase_amount != null
      ? o.repair_amount - o.purchase_amount
      : null;
  const masterCalc = profit != null ? Math.max(0, Math.round(profit * 0.5)) : null;

  return (
    <div
      className={`relative cursor-pointer select-none transition-colors group ${
        isExpanded ? "" : "hover:bg-[#FFD700]/[0.03] active:bg-white/5"
      }`}
      onClick={onToggle}
    >
      {/* Левая статус-полоса с glow (для новой — оранжевая, пульсирующая) */}
      <span
        className={`absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full ${
          o.status === "new"
            ? "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.9)] animate-pulse"
            : st.dot
        } ${
          isExpanded ? "shadow-[0_0_10px_currentColor]" : "shadow-[0_0_6px_currentColor]"
        }`}
      />

      <div className="pl-3 pr-2.5 py-2.5">
        {/* ───────── Строка 1 — Аватар клиента + Имя + Шеврон ───────── */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Conic-медальон с инициалами клиента + #ID плашка снизу */}
          <div className="relative shrink-0">
            <div
              className={`relative w-11 h-11 rounded-full p-[1.5px] transition-all ${
                isExpanded
                  ? "bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.55)]"
                  : "bg-[conic-gradient(from_0deg,#3a3a3a,#FFD700,#3a3a3a)] shadow-[0_0_10px_rgba(255,215,0,0.18)] group-hover:shadow-[0_0_16px_rgba(255,215,0,0.4)]"
              }`}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center font-oswald font-bold text-[#FFD700] text-sm tracking-wide drop-shadow-[0_0_4px_rgba(255,215,0,0.5)]">
                {initials}
              </div>
            </div>
            {/* #ID плашка-таблетка */}
            <div
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center justify-center px-1.5 h-[15px] rounded-full text-[9px] font-oswald font-bold tabular-nums leading-none whitespace-nowrap transition-all ${
                isExpanded
                  ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black shadow-[0_2px_8px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.55)]"
                  : "bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/45 shadow-[0_0_6px_rgba(255,215,0,0.25)]"
              }`}
            >
              #{o.id}
            </div>
          </div>

          {/* Имя + плашка статуса (компактно, в одну строку) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-oswald font-bold text-[15px] uppercase tracking-tight truncate leading-tight ${
                  isExpanded ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" : "text-white/95"
                }`}
              >
                {o.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {/* НОВАЯ заявка — приоритетный бейдж "взять в работу" */}
              {o.status === "new" ? (
                <span
                  title="Новая заявка — нужно взять в работу"
                  className="relative font-oswald font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500/35 via-amber-400/35 to-orange-500/35 text-amber-100 border border-orange-400/60 shadow-[0_0_10px_rgba(251,146,60,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] animate-pulse"
                >
                  <span aria-hidden className="text-[11px] leading-none">🔥</span>
                  Новая
                </span>
              ) : (
                <span
                  className={`relative font-roboto text-[10px] px-2 py-0.5 inline-flex items-center gap-1 rounded-full ${st.color} ${
                    isExpanded ? "ring-1 ring-current shadow-[0_0_8px_currentColor]" : ""
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${st.dot} ${
                      isExpanded ? "animate-pulse shadow-[0_0_4px_currentColor]" : ""
                    }`}
                  />
                  {st.label}
                </span>
              )}
              {/* Pending — нужно заполнить суммы */}
              {needsAmounts && (
                <span
                  title="Не заполнены суммы для статистики"
                  className="font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-orange-500/25 text-orange-200 border border-orange-400/50 inline-flex items-center gap-0.5 animate-pulse shadow-[0_0_8px_rgba(251,146,60,0.4)]"
                >
                  <Icon name="AlertTriangle" size={9} /> Заполнить
                </span>
              )}
              {/* Оплата */}
              {o.is_paid && o.payment_method && (
                <span className="font-roboto text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)] inline-flex items-center gap-0.5">
                  <Icon
                    name={o.payment_method === "cash" ? "Banknote" : o.payment_method === "card" ? "CreditCard" : "Smartphone"}
                    size={9}
                  />
                  {o.payment_method === "cash" ? "Нал" : o.payment_method === "card" ? "Карта" : "Перевод"}
                </span>
              )}
              {!o.is_paid && o.advance != null && o.advance > 0 && (
                <span className="font-roboto text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.25)] inline-flex items-center gap-0.5">
                  <Icon name="Wallet" size={9} />
                  Аванс {o.advance.toLocaleString("ru-RU")} ₽
                </span>
              )}
            </div>
          </div>

          {/* Шеврон */}
          <div className="shrink-0 self-start mt-0.5 relative">
            {isExpanded && <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md" />}
            <Icon
              name={isExpanded ? "ChevronUp" : "ChevronDown"}
              size={18}
              className={`relative transition-all ${
                isExpanded
                  ? "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]"
                  : "text-white/45 group-hover:text-[#FFD700]"
              }`}
            />
          </div>
        </div>

        {/* ───────── Строка 2 — телефон + устройство (премиум-плашки) ───────── */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <a
            href={`tel:${o.phone}`}
            onClick={e => e.stopPropagation()}
            title="Позвонить клиенту"
            className="relative inline-flex items-center gap-1.5 min-w-0 bg-gradient-to-r from-[#FFD700]/10 via-[#FFD700]/5 to-transparent border border-[#FFD700]/30 hover:border-[#FFD700]/55 hover:shadow-[0_0_10px_rgba(255,215,0,0.25)] rounded-md px-2 py-1.5 transition-all active:scale-[0.98]"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/45 to-transparent rounded-t-md pointer-events-none" />
            <Icon name="Phone" size={12} className="text-[#FFD700] shrink-0 drop-shadow-[0_0_3px_rgba(255,215,0,0.6)]" />
            <span className="font-roboto text-[12px] text-[#FFD700] font-bold tabular-nums truncate">{o.phone}</span>
          </a>

          <div className="relative inline-flex items-center gap-1.5 min-w-0 bg-gradient-to-r from-white/[0.05] to-transparent border border-white/10 rounded-md px-2 py-1.5">
            <Icon name="Smartphone" size={12} className="text-white/55 shrink-0" />
            <span className="font-roboto text-[12px] text-white/80 truncate">
              {o.model || <span className="text-white/35">Без модели</span>}
            </span>
          </div>
        </div>

        {/* ───────── Строка 3 — тип ремонта (если есть) ───────── */}
        {o.repair_type && (
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/12 border border-purple-500/30 max-w-full">
            <Icon name="Wrench" size={11} className="text-purple-300 shrink-0 drop-shadow-[0_0_3px_rgba(168,85,247,0.5)]" />
            <span className="font-roboto text-[11px] text-purple-200/90 truncate">{o.repair_type}</span>
          </div>
        )}

        {/* ───────── Строка 4 — Цены: Сетка 3 ячейки ───────── */}
        {(o.price != null || o.repair_amount != null || o.purchase_amount != null) && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {/* Предв. стоимость */}
            <div
              className={`relative rounded-md px-2 py-1.5 border overflow-hidden ${
                o.price != null
                  ? "bg-gradient-to-br from-[#FFD700]/10 to-transparent border-[#FFD700]/30"
                  : "bg-white/[0.02] border-white/5"
              }`}
            >
              <div className="font-roboto text-[8px] uppercase tracking-wider text-white/40 font-bold">Оценка</div>
              <div
                className={`font-oswald font-bold text-[12px] tabular-nums leading-tight ${
                  o.price != null ? "text-[#FFD700] drop-shadow-[0_0_3px_rgba(255,215,0,0.4)]" : "text-white/25"
                }`}
              >
                {o.price != null ? `${o.price.toLocaleString("ru-RU")} ₽` : "—"}
              </div>
            </div>
            {/* Закупка */}
            <div
              className={`relative rounded-md px-2 py-1.5 border overflow-hidden ${
                o.purchase_amount != null
                  ? "bg-gradient-to-br from-orange-500/12 to-transparent border-orange-500/30"
                  : "bg-white/[0.02] border-white/5"
              }`}
            >
              <div className="font-roboto text-[8px] uppercase tracking-wider text-white/40 font-bold">Закупка</div>
              <div
                className={`font-oswald font-bold text-[12px] tabular-nums leading-tight ${
                  o.purchase_amount != null ? "text-orange-300" : "text-white/25"
                }`}
              >
                {o.purchase_amount != null ? `${o.purchase_amount.toLocaleString("ru-RU")} ₽` : "—"}
              </div>
            </div>
            {/* Выдано */}
            <div
              className={`relative rounded-md px-2 py-1.5 border overflow-hidden ${
                o.repair_amount != null
                  ? "bg-gradient-to-br from-emerald-500/15 to-transparent border-emerald-500/35 shadow-[0_0_10px_rgba(16,185,129,0.18)]"
                  : "bg-white/[0.02] border-white/5"
              }`}
            >
              {o.repair_amount != null && (
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
              )}
              <div className="font-roboto text-[8px] uppercase tracking-wider text-white/40 font-bold">Выдано</div>
              <div
                className={`font-oswald font-bold text-[12px] tabular-nums leading-tight ${
                  o.repair_amount != null ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" : "text-white/25"
                }`}
              >
                {o.repair_amount != null ? `${o.repair_amount.toLocaleString("ru-RU")} ₽` : "—"}
              </div>
            </div>
          </div>
        )}

        {/* ───────── Строка 5 — Доход мастера (если посчитан) ───────── */}
        {masterCalc != null && o.repair_amount != null && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25">
            <Icon name="Award" size={10} className="text-emerald-300 shrink-0 drop-shadow-[0_0_3px_rgba(16,185,129,0.6)]" />
            <span className="font-roboto text-[10px] text-emerald-200/85">
              мастер: <b className="font-oswald tabular-nums text-emerald-200">{masterCalc.toLocaleString("ru-RU")} ₽</b>
            </span>
          </div>
        )}

        {/* ───────── Информация о выбранной запчасти ───────── */}
        {o.part_name && (
          <div
            className={`relative mt-2 rounded-lg overflow-hidden border px-2.5 py-1.5 text-xs font-roboto flex items-start gap-2 ${
              o.part_source === "stock"
                ? "bg-gradient-to-r from-emerald-500/15 via-emerald-500/8 to-transparent border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                : "bg-gradient-to-r from-[#FFD700]/15 via-[#FFD700]/8 to-transparent border-[#FFD700]/40 shadow-[0_0_12px_rgba(255,215,0,0.20)]"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${
                o.part_source === "stock" ? "via-emerald-400/60" : "via-[#FFD700]/60"
              } to-transparent`}
            />
            <div className="relative shrink-0 mt-0.5">
              <span
                className={`absolute inset-0 rounded-full blur-sm ${
                  o.part_source === "stock" ? "bg-emerald-400/40" : "bg-[#FFD700]/40"
                }`}
              />
              <Icon
                name={o.part_source === "stock" ? "Zap" : "Truck"}
                size={14}
                className={`relative ${
                  o.part_source === "stock"
                    ? "text-emerald-300 drop-shadow-[0_0_4px_rgba(16,185,129,0.7)]"
                    : "text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span
                  className={`font-oswald font-bold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                    o.part_source === "stock"
                      ? "bg-emerald-500/30 text-emerald-200"
                      : "bg-[#FFD700]/30 text-[#FFD700]"
                  }`}
                >
                  {o.part_source === "stock" ? "🟢 МойСклад · в наличии" : "🟡 Прайс · под заказ"}
                </span>
                {o.part_quality && (
                  <span className="font-oswald font-bold text-[10px] text-[#FFD700]">{o.part_quality}</span>
                )}
                {o.part_code && <span className="font-roboto text-[10px] text-white/50">арт. {o.part_code}</span>}
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

        {/* ───────── Строка 6 — даты ───────── */}
        <div className="flex items-center gap-2.5 mt-2 flex-wrap">
          <span className="text-white/35 font-roboto text-[9px] inline-flex items-center gap-1">
            <Icon name="Inbox" size={9} className="text-white/40" />
            {fmt(o.created_at)}
          </span>
          {o.picked_up_at && (
            <span className="text-emerald-400/70 font-roboto text-[9px] inline-flex items-center gap-1">
              <Icon name="PackageCheck" size={9} />
              {fmt(o.picked_up_at)}
            </span>
          )}
          {o.completed_at && !o.picked_up_at && (
            <span className="text-yellow-400/60 font-roboto text-[9px] inline-flex items-center gap-1">
              <Icon name="CheckCheck" size={9} />
              {fmt(o.completed_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}