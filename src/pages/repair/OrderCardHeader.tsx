import Icon from "@/components/ui/icon";
import { Order, STATUSES, fmt } from "./types";

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

type UrgencyLevel = 0 | 1 | 2 | 3 | 4 | 5;
function getUrgencyLevel(createdAt: string | null | undefined): UrgencyLevel {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return 0;
  const hours = (Date.now() - created) / 3_600_000;
  if (hours >= 48) return 5;
  if (hours >= 24) return 4;
  if (hours >= 12) return 3;
  if (hours >= 6) return 2;
  if (hours >= 3) return 1;
  return 0;
}

const URGENCY_TITLES: Record<UrgencyLevel, string> = {
  0: "Только что",
  1: "Принята более 3 часов назад — пора брать в работу",
  2: "Принята более 6 часов назад — обратите внимание",
  3: "Принята более 12 часов назад — задерживается",
  4: "Принята более суток назад — критично",
  5: "Принята более 48 часов назад — СРОЧНО, максимальное внимание!",
};

type StatusAccent = { bar: string; barColor: string; text: string; bg: string; label: string };

function getStatusAccent(status: string): StatusAccent {
  switch (status) {
    case "new":              return { bar: "bg-orange-400",   barColor: "#fb923c", text: "text-orange-300",   bg: "bg-orange-500/12",  label: "Новая"      };
    case "pending_approval": return { bar: "bg-purple-400",   barColor: "#c084fc", text: "text-purple-300",   bg: "bg-purple-500/12",  label: "Согласование" };
    case "accepted":         return { bar: "bg-violet-400",   barColor: "#a78bfa", text: "text-violet-300",   bg: "bg-violet-500/12",  label: "У мастера"  };
    case "in_progress":      return { bar: "bg-blue-400",     barColor: "#60a5fa", text: "text-blue-300",     bg: "bg-blue-500/12",    label: "В работе"   };
    case "waiting_parts":    return { bar: "bg-amber-400",    barColor: "#fbbf24", text: "text-amber-300",    bg: "bg-amber-500/12",   label: "Ждём зап."  };
    case "ready":            return { bar: "bg-[#FFD700]",    barColor: "#FFD700", text: "text-[#FFD700]",    bg: "bg-[#FFD700]/12",   label: "Готов"      };
    case "done":             return { bar: "bg-emerald-400",  barColor: "#34d399", text: "text-emerald-300",  bg: "bg-emerald-500/12", label: "Выдан"      };
    case "warranty":         return { bar: "bg-teal-400",     barColor: "#2dd4bf", text: "text-teal-300",     bg: "bg-teal-500/12",    label: "Гарантия"   };
    case "cancelled":        return { bar: "bg-red-400",      barColor: "#f87171", text: "text-red-300",      bg: "bg-red-500/12",     label: "Отменено"   };
    default:                 return { bar: "bg-white/30",     barColor: "#666",    text: "text-white/60",     bg: "bg-white/5",        label: status       };
  }
}

type Props = {
  o: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onQuickCall?: () => void;
  onQuickStatus?: (status: string) => void;
};

export default function OrderCardHeader({ o, isExpanded, onToggle, onQuickCall, onQuickStatus }: Props) {
  const st = statusInfo(o.status);
  const accent = getStatusAccent(o.status);
  const initials = (o.name || "")
    .trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  const urgency: UrgencyLevel = o.status === "new" ? getUrgencyLevel(o.created_at) : 0;
  const isCritical = urgency === 5;
  const isHot = urgency >= 3;

  const description = o.comment || o.admin_note || "";

  const profit = o.repair_amount != null && o.purchase_amount != null
    ? o.repair_amount - o.purchase_amount : null;
  const masterCalc = profit != null ? Math.max(0, Math.round(profit * 0.5)) : null;

  const mainPrice = o.repair_amount != null
    ? { v: o.repair_amount, color: "text-emerald-300" }
    : o.price != null
      ? { v: o.price, color: "text-[#FFD700]" }
      : null;

  // Следующий «быстрый» статус
  const STATUS_FLOW: Record<string, string> = {
    new: "accepted", accepted: "in_progress", in_progress: "ready",
    waiting_parts: "in_progress", ready: "done",
  };
  const nextStatus = STATUS_FLOW[o.status];
  const nextAccent = nextStatus ? getStatusAccent(nextStatus) : null;

  return (
    <div
      className={`relative cursor-pointer select-none transition-colors ${isExpanded ? "" : "hover:bg-white/[0.015] active:bg-white/[0.03]"}`}
      onClick={onToggle}
    >
      {/* Цветная полоса слева — толщина зависит от срочности */}
      <span
        className={`absolute left-0 top-0 bottom-0 ${isCritical ? "w-[4px] animate-pulse" : isHot ? "w-[4px]" : "w-[3px]"} ${accent.bar}`}
        style={{ boxShadow: isCritical ? `0 0 8px ${accent.barColor}` : isHot ? `0 0 4px ${accent.barColor}80` : "none" }}
      />

      <div className="pl-3 pr-2 py-2">
        {/* ── СТРОКА 1: аватар · #id · имя · бейдж · цена · быстрые кнопки · шеврон ── */}
        <div className="flex items-center gap-1.5 min-w-0">

          {/* Аватар с цветным кольцом статуса */}
          <div className="shrink-0 relative">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-oswald font-bold text-[11px] leading-none"
              style={{
                background: `linear-gradient(135deg, ${accent.barColor}25, ${accent.barColor}10)`,
                border: `1.5px solid ${accent.barColor}50`,
                color: accent.barColor,
              }}
            >
              {initials}
            </div>
            {/* Индикатор оплаты */}
            {o.is_paid && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-[#0F0F0F] flex items-center justify-center">
                <Icon name="Check" size={7} className="text-black" />
              </span>
            )}
          </div>

          {/* #ID */}
          <span className="font-oswald text-[9px] text-white/30 tabular-nums shrink-0">#{o.id}</span>

          {/* Имя */}
          <span className="font-oswald font-bold text-[13px] text-white uppercase tracking-tight truncate flex-1 min-w-0 leading-none">
            {o.name}
          </span>

          {/* Бейдж срочности/статуса */}
          {o.status === "new" ? (
            <span
              title={URGENCY_TITLES[urgency]}
              className={`shrink-0 font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                isCritical
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                  : isHot
                    ? "bg-orange-500/15 text-orange-300 border border-orange-500/35"
                    : "bg-orange-500/10 text-orange-400/80 border border-orange-500/20"
              }`}
            >
              {isCritical ? "🚨 СРОЧНО" : urgency >= 3 ? "🔥" : "NEW"}
            </span>
          ) : (
            <span
              className={`shrink-0 font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md ${accent.bg} ${accent.text}`}
              style={{ border: `1px solid ${accent.barColor}30` }}
            >
              {accent.label}
            </span>
          )}

          {/* Цена */}
          {mainPrice && (
            <span className={`shrink-0 font-oswald font-bold text-[12px] tabular-nums ${mainPrice.color}`}>
              {mainPrice.v.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* ── Быстрые кнопки (только на закрытой) ── */}
          {!isExpanded && (
            <div className="shrink-0 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
              {/* Позвонить */}
              <a
                href={`tel:${o.phone}`}
                className="w-6 h-6 rounded-md bg-[#FFD700]/10 hover:bg-[#FFD700]/25 active:scale-90 flex items-center justify-center transition-all"
                title={`Позвонить: ${o.phone}`}
              >
                <Icon name="Phone" size={11} className="text-[#FFD700]" />
              </a>

              {/* Следующий статус */}
              {nextStatus && nextAccent && onQuickStatus && (
                <button
                  onClick={() => onQuickStatus(nextStatus)}
                  className="w-6 h-6 rounded-md hover:bg-white/8 active:scale-90 flex items-center justify-center transition-all"
                  title={`→ ${nextAccent.label}`}
                  style={{ color: nextAccent.barColor }}
                >
                  <Icon name="ArrowRight" size={11} />
                </button>
              )}
            </div>
          )}

          {/* Шеврон */}
          <Icon
            name={isExpanded ? "ChevronUp" : "ChevronDown"}
            size={13}
            className={`shrink-0 transition-colors ${isExpanded ? "text-[#FFD700]" : "text-white/25"}`}
          />
        </div>

        {/* ── СТРОКА 2: телефон · модель · тип · мастер · аванс · дата ── */}
        <div className="flex items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] flex-wrap pl-[36px]">

          {/* Телефон */}
          <a
            href={`tel:${o.phone}`}
            onClick={e => e.stopPropagation()}
            className="font-roboto text-white/45 hover:text-[#FFD700] tabular-nums inline-flex items-center gap-0.5 shrink-0 transition-colors"
            title="Позвонить"
          >
            {o.phone}
          </a>

          {/* Разделитель */}
          <span className="text-white/15 shrink-0">·</span>

          {/* Модель + тип */}
          <span className="text-white/65 inline-flex items-center gap-1 min-w-0 truncate">
            <Icon name="Smartphone" size={9} className="text-white/30 shrink-0" />
            <span className="truncate">
              {o.model || <span className="text-white/25 italic">без модели</span>}
              {o.repair_type && (
                <span style={{ color: accent.barColor + "cc" }}> · {o.repair_type}</span>
              )}
            </span>
          </span>

          {/* Заработок мастера */}
          {masterCalc != null && masterCalc > 0 && (
            <span className="text-emerald-400/70 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Заработок мастера">
              <Icon name="TrendingUp" size={9} />
              {masterCalc.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Аванс */}
          {!o.is_paid && o.advance != null && o.advance > 0 && (
            <span className="text-blue-300/70 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Аванс">
              <Icon name="Wallet" size={9} />
              {o.advance.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Оплата — иконка способа */}
          {o.is_paid && (
            <span className="text-emerald-400/80 inline-flex items-center gap-0.5 shrink-0" title={`Оплачено: ${o.payment_method || ""}`}>
              <Icon
                name={o.payment_method === "cash" ? "Banknote" : o.payment_method === "card" ? "CreditCard" : o.payment_method === "sbp" ? "Zap" : "CheckCircle"}
                size={10}
              />
              <span className="text-[10px]">оплачено</span>
            </span>
          )}

          {/* Дата — правый край */}
          <span className="ml-auto text-white/25 font-roboto text-[10px] tabular-nums shrink-0">
            {fmt(o.created_at)}
          </span>
        </div>

        {/* ── СТРОКА 3: превью неисправности (закрытая) ── */}
        {description && !isExpanded && (
          <div className="mt-1 pl-[36px] pr-8">
            <div className="text-[11px] text-white/40 truncate font-roboto leading-tight italic">
              {description}
            </div>
          </div>
        )}

        {/* ── СТРОКА 4: запчасть в работе ── */}
        {o.part_name && !isExpanded && (
          <div className="mt-1 pl-[36px]">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] ${
              o.part_source === "stock"
                ? "bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-300/80 border border-amber-500/20"
            }`}>
              <Icon name={o.part_source === "stock" ? "Zap" : "Truck"} size={9} />
              {o.part_source === "stock" ? "склад" : "заказ"}: {o.part_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
