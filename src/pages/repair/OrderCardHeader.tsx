import Icon from "@/components/ui/icon";
import { Order, STATUSES, fmt } from "./types";

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

type UrgencyLevel = 0 | 1 | 2 | 3 | 4 | 5;
function getUrgencyLevel(createdAt: string | null | undefined): UrgencyLevel {
  if (!createdAt) return 0;
  const h = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (!Number.isFinite(h)) return 0;
  if (h >= 48) return 5;
  if (h >= 24) return 4;
  if (h >= 12) return 3;
  if (h >= 6)  return 2;
  if (h >= 3)  return 1;
  return 0;
}

const URGENCY_TITLES: Record<UrgencyLevel, string> = {
  0: "Только что",
  1: "Более 3 ч — пора брать в работу",
  2: "Более 6 ч — обратите внимание",
  3: "Более 12 ч — задерживается",
  4: "Более суток — критично",
  5: "Более 48 ч — СРОЧНО!",
};

type SA = { barColor: string; text: string; bgCard: string; label: string };
function getAccent(status: string): SA {
  switch (status) {
    case "new":              return { barColor: "#fb923c", text: "#fb923c", bgCard: "rgba(251,146,60,0.06)",   label: "Новая"         };
    case "pending_approval": return { barColor: "#c084fc", text: "#c084fc", bgCard: "rgba(192,132,252,0.06)",  label: "Согласование"  };
    case "accepted":         return { barColor: "#a78bfa", text: "#a78bfa", bgCard: "rgba(167,139,250,0.05)",  label: "У мастера"     };
    case "in_progress":      return { barColor: "#60a5fa", text: "#60a5fa", bgCard: "rgba(96,165,250,0.05)",   label: "В работе"      };
    case "waiting_parts":    return { barColor: "#fbbf24", text: "#fbbf24", bgCard: "rgba(251,191,36,0.06)",   label: "Ждём запчасть" };
    case "ready":            return { barColor: "#FFD700", text: "#FFD700", bgCard: "rgba(255,215,0,0.07)",    label: "Готов"         };
    case "done":             return { barColor: "#34d399", text: "#34d399", bgCard: "rgba(52,211,153,0.04)",   label: "Выдан"         };
    case "warranty":         return { barColor: "#2dd4bf", text: "#2dd4bf", bgCard: "rgba(45,212,191,0.04)",   label: "Гарантия"      };
    case "cancelled":        return { barColor: "#f87171", text: "#f87171", bgCard: "rgba(248,113,113,0.04)",  label: "Отменено"      };
    default:                 return { barColor: "#555",    text: "#888",    bgCard: "rgba(255,255,255,0.02)",   label: status          };
  }
}

const STATUS_FLOW: Record<string, string> = {
  new: "accepted", accepted: "in_progress", in_progress: "ready",
  waiting_parts: "in_progress", ready: "done",
};
const NEXT_LABEL: Record<string, string> = {
  accepted: "→ Мастер", in_progress: "→ Работа",
  ready: "→ Готово", done: "→ Выдан", new: "→ Мастер",
};

type Props = {
  o: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onQuickStatus?: (status: string) => void;
};

export default function OrderCardHeader({ o, isExpanded, onToggle, onQuickStatus }: Props) {
  const accent = getAccent(o.status);
  const initials = (o.name || "").trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 1).join("").toUpperCase() || "?";

  const urgency: UrgencyLevel = o.status === "new" ? getUrgencyLevel(o.created_at) : 0;
  const isCritical = urgency >= 4;
  const isWarn    = urgency === 3;

  const description = o.comment || o.admin_note || "";

  const profit = o.repair_amount != null && o.purchase_amount != null
    ? o.repair_amount - o.purchase_amount : null;
  const masterCalc = profit != null ? Math.max(0, Math.round(profit * 0.5)) : null;

  const mainPrice = o.repair_amount != null
    ? { v: o.repair_amount, isReal: true }
    : o.price != null
      ? { v: o.price, isReal: false }
      : null;

  const nextStatus = STATUS_FLOW[o.status];
  const nextAccent = nextStatus ? getAccent(nextStatus) : null;

  // Форматирование даты: время если сегодня, иначе дд.мм чч:мм
  const fmtShort = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " +
           d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={`relative cursor-pointer select-none ${isExpanded ? "" : "hover:brightness-110 active:brightness-125"} transition-[filter]`}
      onClick={onToggle}
      style={{ background: isExpanded ? "rgba(255,215,0,0.03)" : accent.bgCard }}
    >
      {/* Левая цветная полоса */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm"
        style={{
          background: accent.barColor,
          boxShadow: isCritical ? `0 0 10px ${accent.barColor}, 0 0 20px ${accent.barColor}60` : `0 0 4px ${accent.barColor}80`,
          animation: isCritical ? "pulse 1.2s ease-in-out infinite" : "none",
        }}
      />

      <div className="pl-3.5 pr-2 py-2">
        {/* ── ГЛАВНАЯ СТРОКА ── */}
        <div className="flex items-center gap-2 min-w-0">

          {/* Аватар */}
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-oswald font-black text-[14px] leading-none"
            style={{ background: `${accent.barColor}22`, color: accent.barColor, border: `1px solid ${accent.barColor}45` }}
          >
            {initials}
            {o.is_paid && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-[1.5px] border-[#0F0F0F] flex items-center justify-center">
                <Icon name="Check" size={8} className="text-black" />
              </span>
            )}
          </div>

          {/* Имя + модель */}
          <div className="flex-1 min-w-0 flex flex-col gap-0">
            {/* Строка 1: имя + id */}
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-oswald font-bold text-[14px] text-white uppercase tracking-wide truncate leading-tight">
                {o.name}
              </span>
              <span className="font-roboto text-[9px] text-white/25 shrink-0 tabular-nums">#{o.id}</span>
            </div>
            {/* Строка 2: модель — крупно и чётко */}
            {(o.model || o.repair_type) && (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-oswald font-bold text-[13px] truncate leading-tight" style={{ color: accent.barColor }}>
                  {o.model || <span className="opacity-40">без модели</span>}
                </span>
                {o.repair_type && (
                  <span className="font-roboto text-[11px] text-white/50 shrink-0 truncate">
                    · {o.repair_type}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Статус-бейдж */}
          <span
            className="shrink-0 font-oswald font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md"
            title={o.status === "new" ? URGENCY_TITLES[urgency] : accent.label}
            style={{
              background: `${accent.barColor}18`,
              color: accent.barColor,
              border: `1px solid ${accent.barColor}40`,
              boxShadow: (isCritical || o.status === "ready") ? `0 0 8px ${accent.barColor}50` : "none",
              animation: isCritical ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          >
            {o.status === "new"
              ? (isCritical ? "🚨 СРОЧНО" : isWarn ? "🔥 ДОЛГО" : "НОВАЯ")
              : accent.label}
          </span>

          {/* Цена */}
          {mainPrice && (
            <span
              className="shrink-0 font-oswald font-bold text-[14px] tabular-nums"
              style={{ color: mainPrice.isReal ? "#34d399" : accent.barColor }}
            >
              {mainPrice.v.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Быстрые кнопки (только на закрытой) */}
          {!isExpanded && (
            <div className="shrink-0 flex items-center gap-0.5 ml-0.5" onClick={e => e.stopPropagation()}>
              <a
                href={`tel:${o.phone}`}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                style={{ background: `${accent.barColor}18`, color: accent.barColor }}
                title={`Звонить: ${o.phone}`}
              >
                <Icon name="Phone" size={12} />
              </a>
              {nextStatus && nextAccent && onQuickStatus && (
                <button
                  onClick={() => onQuickStatus(nextStatus)}
                  className="h-7 px-2 rounded-lg flex items-center gap-1 font-oswald font-bold text-[10px] uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
                  style={{ background: `${nextAccent.barColor}18`, color: nextAccent.barColor, border: `1px solid ${nextAccent.barColor}35` }}
                  title={NEXT_LABEL[nextStatus] || `→ ${nextAccent.label}`}
                >
                  <Icon name="ArrowRight" size={10} />
                  {nextAccent.label}
                </button>
              )}
            </div>
          )}

          {/* Шеврон */}
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={13}
            className={`shrink-0 transition-colors ${isExpanded ? "text-[#FFD700]" : "text-white/20"}`}
          />
        </div>

        {/* ── СТРОКА 2: телефон · модель · тип · заработок · дата ── */}
        <div className="flex items-center gap-x-2.5 mt-1.5 pl-10 text-[11px] flex-wrap gap-y-0.5">
          {/* Телефон */}
          <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
            className="font-roboto tabular-nums transition-colors shrink-0"
            style={{ color: `${accent.barColor}cc` }}
          >
            {o.phone}
          </a>



          {/* Мастер-заработок */}
          {masterCalc != null && masterCalc > 0 && (
            <>
              <span className="text-white/15 shrink-0">·</span>
              <span className="text-emerald-400/70 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Заработок мастера">
                <Icon name="TrendingUp" size={9} />
                {masterCalc.toLocaleString("ru-RU")}₽
              </span>
            </>
          )}

          {/* Аванс */}
          {!o.is_paid && o.advance != null && o.advance > 0 && (
            <>
              <span className="text-white/15 shrink-0">·</span>
              <span className="text-blue-300/60 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Аванс">
                <Icon name="Wallet" size={9} />
                {o.advance.toLocaleString("ru-RU")}₽
              </span>
            </>
          )}

          {/* Оплачено */}
          {o.is_paid && (
            <>
              <span className="text-white/15 shrink-0">·</span>
              <span className="text-emerald-400/70 inline-flex items-center gap-0.5 shrink-0" title="Оплачено">
                <Icon name={o.payment_method === "cash" ? "Banknote" : o.payment_method === "card" ? "CreditCard" : "CheckCircle"} size={9} />
                <span>оплачено</span>
              </span>
            </>
          )}

          {/* Дата — ПРАВЫЙ КРАЙ, жирнее */}
          <span className="ml-auto font-roboto text-[10px] tabular-nums shrink-0 font-semibold" style={{ color: `${accent.barColor}80` }}>
            {fmtShort(o.created_at)}
          </span>
        </div>

        {/* ── СТРОКА 3: описание неисправности ── */}
        {description && !isExpanded && (
          <div className="mt-1 pl-10 pr-8">
            <span className="font-roboto text-[11px] italic line-clamp-1" style={{ color: "rgba(255,255,255,0.38)" }}>
              {description}
            </span>
          </div>
        )}

        {/* ── СТРОКА 4: запчасть ── */}
        {o.part_name && !isExpanded && (
          <div className="mt-1 pl-10">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-roboto ${
              o.part_source === "stock"
                ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
            }`}>
              <Icon name={o.part_source === "stock" ? "Zap" : "Truck"} size={9} />
              {o.part_source === "stock" ? "склад" : "под заказ"}: {o.part_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}