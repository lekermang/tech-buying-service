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

type SA = { barColor: string; bgCard: string; label: string };
function getAccent(status: string): SA {
  switch (status) {
    case "new":              return { barColor: "#fb923c", bgCard: "rgba(251,146,60,0.06)",   label: "Новая"         };
    case "pending_approval": return { barColor: "#c084fc", bgCard: "rgba(192,132,252,0.06)",  label: "Согласование"  };
    case "accepted":         return { barColor: "#a78bfa", bgCard: "rgba(167,139,250,0.05)",  label: "У мастера"     };
    case "in_progress":      return { barColor: "#60a5fa", bgCard: "rgba(96,165,250,0.05)",   label: "В работе"      };
    case "waiting_parts":    return { barColor: "#fbbf24", bgCard: "rgba(251,191,36,0.06)",   label: "Ждём запчасть" };
    case "ready":            return { barColor: "#FFD700", bgCard: "rgba(255,215,0,0.07)",    label: "Готов"         };
    case "done":             return { barColor: "#34d399", bgCard: "rgba(52,211,153,0.04)",   label: "Выдан"         };
    case "warranty":         return { barColor: "#2dd4bf", bgCard: "rgba(45,212,191,0.04)",   label: "Гарантия"      };
    case "cancelled":        return { barColor: "#f87171", bgCard: "rgba(248,113,113,0.04)",  label: "Отменено"      };
    default:                 return { barColor: "#555",    bgCard: "rgba(255,255,255,0.02)",   label: status          };
  }
}

const STATUS_FLOW: Record<string, string> = {
  new: "accepted", accepted: "in_progress", in_progress: "ready",
  waiting_parts: "in_progress", ready: "done",
};
const NEXT_LABEL: Record<string, string> = {
  accepted: "Мастер", in_progress: "В работу",
  ready: "Готово", done: "Выдан", new: "Мастер",
};

// Форматирование даты: время если сегодня, дд.мм если текущий год, иначе дд.мм.гг
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " +
         d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

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
  const isWarn     = urgency === 3;

  const description = o.comment || o.admin_note || "";

  const hasFinance = o.purchase_amount != null || o.repair_amount != null;
  const isIssued   = o.status === "done" || o.status === "warranty";
  const issuedAt   = o.picked_up_at || o.completed_at;

  const nextStatus = STATUS_FLOW[o.status];
  const nextAccent = nextStatus ? getAccent(nextStatus) : null;

  return (
    <div
      className={`relative cursor-pointer select-none transition-[filter] ${isExpanded ? "" : "hover:brightness-[1.08] active:brightness-125"}`}
      onClick={onToggle}
      style={{ background: isExpanded ? "rgba(255,215,0,0.03)" : accent.bgCard }}
    >
      {/* Левая цветная полоса */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm"
        style={{
          background: accent.barColor,
          boxShadow: isCritical
            ? `0 0 10px ${accent.barColor}, 0 0 20px ${accent.barColor}60`
            : `0 0 4px ${accent.barColor}80`,
          animation: isCritical ? "pulse 1.2s ease-in-out infinite" : "none",
        }}
      />

      <div className="pl-3.5 pr-2 pt-2 pb-2">

        {/* ══════════ СТРОКА 1: аватар · имя · модель (ЗОЛОТО) · статус · цена · кнопки ══════════ */}
        <div className="flex items-center gap-2 min-w-0">

          {/* Аватар */}
          <div className="relative shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-oswald font-black text-[14px] leading-none"
              style={{ background: `${accent.barColor}22`, color: accent.barColor, border: `1px solid ${accent.barColor}45` }}
            >
              {initials}
            </div>
            {o.is_paid && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-[1.5px] border-[#0F0F0F] flex items-center justify-center">
                <Icon name="Check" size={8} className="text-black" />
              </span>
            )}
          </div>

          {/* Имя + ID + модель с золотым переливом */}
          <div className="flex-1 min-w-0 flex flex-col leading-none gap-[3px]">
            {/* Имя + ID */}
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-oswald font-bold text-[14px] text-white uppercase tracking-wide truncate">
                {o.name}
              </span>
              <span className="font-roboto text-[9px] text-white/25 shrink-0 tabular-nums">#{o.id}</span>
            </div>

            {/* Модель — ЗОЛОТОЙ ПЕРЕЛИВ */}
            {(o.model || o.repair_type) && (
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                <span
                  className="font-oswald font-bold text-[13px] truncate"
                  style={{
                    background: "linear-gradient(90deg, #b8860b 0%, #FFD700 30%, #fff7a0 50%, #FFD700 70%, #b8860b 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "goldShimmer 2.8s linear infinite",
                  }}
                >
                  {o.model || "без модели"}
                </span>
                {o.repair_type && (
                  <span className="font-roboto text-[10px] text-white/45 shrink-0 truncate">
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

          {/* Быстрые кнопки (на закрытой) */}
          {!isExpanded && (
            <div className="shrink-0 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
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
                  className="h-7 px-1.5 rounded-lg flex items-center gap-1 font-oswald font-bold text-[10px] uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
                  style={{ background: `${nextAccent.barColor}18`, color: nextAccent.barColor, border: `1px solid ${nextAccent.barColor}35` }}
                  title={NEXT_LABEL[nextStatus]}
                >
                  <Icon name="ArrowRight" size={10} />
                  {NEXT_LABEL[nextStatus]}
                </button>
              )}
            </div>
          )}

          {/* Шеврон */}
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={13}
            className={`shrink-0 transition-colors ${isExpanded ? "text-[#FFD700]" : "text-white/20"}`}
          />
        </div>

        {/* ══════════ СТРОКА 2: финансовая лента ══════════ */}
        {!isExpanded && (
          <div className="mt-1.5 pl-10 flex items-center gap-x-3 gap-y-0.5 flex-wrap">

            {/* Дата приёма */}
            <div className="flex items-center gap-1 shrink-0">
              <Icon name="CalendarPlus" size={9} className="text-white/30" />
              <span className="font-roboto text-[10px] text-white/45 tabular-nums">
                {fmtDate(o.created_at)}
              </span>
            </div>

            {/* Дата выдачи (если есть) */}
            {issuedAt && (
              <>
                <span className="text-white/15 text-[10px]">→</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Icon name="CalendarCheck" size={9} className="text-emerald-400/60" />
                  <span className="font-roboto text-[10px] text-emerald-400/70 tabular-nums">
                    {fmtDate(issuedAt)}
                  </span>
                </div>
              </>
            )}

            {/* Закупка */}
            {o.purchase_amount != null && (
              <>
                <span className="text-white/10 hidden sm:inline">·</span>
                <div className="flex items-center gap-1 shrink-0" title="Закупка">
                  <Icon name="ArrowDownLeft" size={9} className="text-red-400/50" />
                  <span className="font-roboto text-[10px] text-red-400/70 tabular-nums">
                    {o.purchase_amount.toLocaleString("ru-RU")}₽
                  </span>
                </div>
              </>
            )}

            {/* Цена выдачи */}
            {o.repair_amount != null && (
              <>
                <span className="text-white/10 hidden sm:inline">·</span>
                <div className="flex items-center gap-1 shrink-0" title="Цена выдачи">
                  <Icon name="ArrowUpRight" size={9} className="text-emerald-400/60" />
                  <span className="font-roboto font-semibold text-[10px] text-emerald-400/90 tabular-nums">
                    {o.repair_amount.toLocaleString("ru-RU")}₽
                  </span>
                </div>
              </>
            )}

            {/* Прибыль (если есть обе суммы) */}
            {o.repair_amount != null && o.purchase_amount != null && (
              <>
                <span className="text-white/10">·</span>
                <div
                  className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.18)" }}
                  title="Прибыль"
                >
                  <Icon name="TrendingUp" size={9} className="text-[#FFD700]/70" />
                  <span className="font-oswald font-bold text-[10px] text-[#FFD700]/90 tabular-nums">
                    {(o.repair_amount - o.purchase_amount).toLocaleString("ru-RU")}₽
                  </span>
                </div>
              </>
            )}

            {/* Телефон — справа */}
            <a
              href={`tel:${o.phone}`}
              onClick={e => e.stopPropagation()}
              className="ml-auto font-roboto text-[10px] tabular-nums transition-colors shrink-0"
              style={{ color: `${accent.barColor}99` }}
            >
              {o.phone}
            </a>
          </div>
        )}

        {/* ══════════ СТРОКА 3: описание (на закрытой) ══════════ */}
        {description && !isExpanded && (
          <div className="mt-1 pl-10 pr-2">
            <span className="font-roboto text-[10px] italic line-clamp-1 text-white/35">
              {description}
            </span>
          </div>
        )}

        {/* ══════════ СТРОКА 4: запчасть ══════════ */}
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

      {/* Глобальная CSS-анимация золотого перелива */}
      <style>{`
        @keyframes goldShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
