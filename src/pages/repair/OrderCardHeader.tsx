import Icon from "@/components/ui/icon";
import { Order, STATUSES } from "./types";

const _si = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

type UrgencyLevel = 0 | 1 | 2 | 3 | 4 | 5;
function getUrgency(iso: string | null | undefined): UrgencyLevel {
  if (!iso) return 0;
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (!Number.isFinite(h)) return 0;
  if (h >= 48) return 5; if (h >= 24) return 4; if (h >= 12) return 3;
  if (h >= 6)  return 2; if (h >= 3)  return 1; return 0;
}
const URGENCY_HINT: Record<UrgencyLevel, string> = {
  0: "Только что", 1: "Более 3 ч", 2: "Более 6 ч — внимание",
  3: "Более 12 ч — задерживается", 4: "Более суток — критично", 5: "Более 48 ч — СРОЧНО!",
};

type A = { bar: string; card: string; lbl: string };
function accent(s: string): A {
  switch (s) {
    case "new":              return { bar: "#fb923c", card: "rgba(251,146,60,0.055)",  lbl: "Новая"         };
    case "pending_approval": return { bar: "#c084fc", card: "rgba(192,132,252,0.055)", lbl: "Согласование"  };
    case "accepted":         return { bar: "#a78bfa", card: "rgba(167,139,250,0.045)", lbl: "У мастера"     };
    case "in_progress":      return { bar: "#60a5fa", card: "rgba(96,165,250,0.045)",  lbl: "В работе"      };
    case "waiting_parts":    return { bar: "#fbbf24", card: "rgba(251,191,36,0.055)",  lbl: "Ждём запчасть" };
    case "ready":            return { bar: "#FFD700", card: "rgba(255,215,0,0.07)",    lbl: "Готов"         };
    case "done":             return { bar: "#34d399", card: "rgba(52,211,153,0.04)",   lbl: "Выдан"         };
    case "warranty":         return { bar: "#2dd4bf", card: "rgba(45,212,191,0.04)",   lbl: "Гарантия"      };
    case "cancelled":        return { bar: "#f87171", card: "rgba(248,113,113,0.04)",  lbl: "Отменено"      };
    default:                 return { bar: "#555",    card: "rgba(255,255,255,0.02)",   lbl: s               };
  }
}

const FLOW: Record<string, string> = {
  new: "accepted", accepted: "in_progress", in_progress: "ready",
  waiting_parts: "in_progress", ready: "done",
};
const FLOW_LBL: Record<string, string> = {
  new: "Мастер", accepted: "В работу", in_progress: "Готово",
  waiting_parts: "В работу", ready: "Выдать",
};

function fmtDt(iso: string | null | undefined, short = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (short) return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " +
         d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

type Props = { o: Order; isExpanded: boolean; onToggle: () => void; onQuickStatus?: (s: string) => void };

export default function OrderCardHeader({ o, isExpanded, onToggle, onQuickStatus }: Props) {
  const a    = accent(o.status);
  const init = (o.name || "").trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 1).join("").toUpperCase() || "?";
  const urg: UrgencyLevel = o.status === "new" ? getUrgency(o.created_at) : 0;
  const isCrit = urg >= 4;
  const isWarn = urg === 3;

  const note = o.comment || o.admin_note || "";
  const issuedAt = o.picked_up_at || o.completed_at;
  const profit   = (o.repair_amount != null && o.purchase_amount != null)
    ? o.repair_amount - o.purchase_amount : null;

  const nextSt  = FLOW[o.status];
  const nextA   = nextSt ? accent(nextSt) : null;

  return (
    <div
      className={`relative cursor-pointer select-none transition-[filter] ${isExpanded ? "" : "hover:brightness-[1.07] active:brightness-125"}`}
      onClick={onToggle}
      style={{ background: isExpanded ? "rgba(255,215,0,0.025)" : a.card }}
    >
      {/* ─── Левая полоса статуса ─── */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{
        background: a.bar,
        boxShadow: isCrit ? `0 0 12px ${a.bar}, 0 0 24px ${a.bar}55` : `0 0 5px ${a.bar}70`,
        animation: isCrit ? "pulse 1.2s ease-in-out infinite" : "none",
      }} />

      <div className="pl-3.5 pr-2 pt-2.5 pb-2">

        {/* ══════════ ВЕРХНИЙ БЛОК: модель (ГЛАВНЫЙ) ══════════ */}
        <div className="flex items-start gap-2 min-w-0">

          {/* Аватар */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-oswald font-black text-[15px]"
              style={{ background: `${a.bar}20`, color: a.bar, border: `1.5px solid ${a.bar}45` }}>
              {init}
            </div>
            {o.is_paid && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[1.5px] border-[#0D0D0D] flex items-center justify-center">
                <Icon name="Check" size={8} className="text-black" />
              </span>
            )}
          </div>

          {/* Центр: имя + МОДЕЛЬ с золотым переливом */}
          <div className="flex-1 min-w-0">

            {/* Имя + номер */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-oswald font-bold text-[13px] text-white/80 uppercase tracking-wide truncate leading-none">
                {o.name}
              </span>
              <span className="font-roboto text-[9px] text-white/20 tabular-nums shrink-0">#{o.id}</span>
            </div>

            {/* ★ МОДЕЛЬ — главная, золотой перелив ★ */}
            <div className="mt-[2px]">
              {o.model ? (
                <span className="font-oswald font-black text-[18px] leading-none tracking-tight" style={{
                  background: "linear-gradient(90deg,#7a5800 0%,#c89b00 18%,#FFD700 32%,#fff7b0 48%,#FFD700 62%,#c89b00 78%,#7a5800 100%)",
                  backgroundSize: "250% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "goldShimmer 3s linear infinite",
                  display: "inline-block",
                  textShadow: "none",
                  filter: "drop-shadow(0 0 8px rgba(255,215,0,0.25))",
                }}>
                  {o.model}
                </span>
              ) : (
                <span className="font-oswald text-[13px] text-white/20 italic">без модели</span>
              )}
              {o.repair_type && (
                <span className="ml-2 font-roboto text-[11px] text-white/40 align-middle">
                  {o.repair_type}
                </span>
              )}
            </div>
          </div>

          {/* Правая колонка: статус + быстрые кнопки */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {/* Бейдж */}
            <span className="font-oswald font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md whitespace-nowrap"
              title={o.status === "new" ? URGENCY_HINT[urg] : a.lbl}
              style={{
                background: `${a.bar}1a`, color: a.bar, border: `1px solid ${a.bar}45`,
                boxShadow: (isCrit || o.status === "ready") ? `0 0 10px ${a.bar}55` : "none",
                animation: isCrit ? "pulse 1.2s ease-in-out infinite" : "none",
              }}>
              {o.status === "new" ? (isCrit ? "🚨 СРОЧНО" : isWarn ? "🔥 ДОЛГО" : "НОВАЯ") : a.lbl}
            </span>

            {/* Кнопки действий (только закрытая) */}
            {!isExpanded && (
              <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <a href={`tel:${o.phone}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  style={{ background: `${a.bar}1a`, color: a.bar }}
                  title={`Звонить: ${o.phone}`}>
                  <Icon name="Phone" size={12} />
                </a>
                {nextSt && nextA && onQuickStatus && (
                  <button onClick={() => onQuickStatus(nextSt)}
                    className="h-7 px-1.5 rounded-lg flex items-center gap-0.5 font-oswald font-bold text-[10px] uppercase transition-all hover:scale-105 active:scale-95"
                    style={{ background: `${nextA.bar}1a`, color: nextA.bar, border: `1px solid ${nextA.bar}35` }}
                    title={FLOW_LBL[nextSt]}>
                    <Icon name="ArrowRight" size={9} />
                    {FLOW_LBL[nextSt]}
                  </button>
                )}
                <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={13}
                  className="text-white/20 ml-0.5" />
              </div>
            )}
            {isExpanded && (
              <Icon name="ChevronUp" size={13} className="text-[#FFD700] mr-0.5" />
            )}
          </div>
        </div>

        {/* ══════════ НИЖНИЙ БЛОК: даты · суммы · описание ══════════ */}
        {!isExpanded && (
          <div className="mt-2 pl-11 space-y-1">

            {/* Ряд 1: телефон · дата приёма → дата выдачи */}
            <div className="flex items-center gap-x-2.5 gap-y-0 flex-wrap">
              {/* Телефон */}
              <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
                className="font-roboto text-[11px] tabular-nums transition-colors"
                style={{ color: `${a.bar}cc` }}>
                {o.phone}
              </a>

              <span className="text-white/15 text-[10px] shrink-0">·</span>

              {/* Дата приёма */}
              <div className="flex items-center gap-1 shrink-0">
                <Icon name="CalendarPlus" size={9} className="text-white/30" />
                <span className="font-roboto text-[10px] text-white/45 tabular-nums">
                  {fmtDt(o.created_at)}
                </span>
              </div>

              {/* → Дата выдачи */}
              {issuedAt && (
                <>
                  <span className="text-white/20 text-[10px] shrink-0">→</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="CalendarCheck" size={9} className="text-emerald-400/60" />
                    <span className="font-roboto text-[10px] text-emerald-400/75 tabular-nums font-semibold">
                      {fmtDt(issuedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Ряд 2: закупка · стрелка · цена выдачи · прибыль */}
            {(o.purchase_amount != null || o.repair_amount != null || o.price != null) && (
              <div className="flex items-center gap-x-2 gap-y-0 flex-wrap">

                {/* Закупка */}
                {o.purchase_amount != null && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="ArrowDownLeft" size={9} className="text-red-400/50" />
                    <span className="font-roboto text-[10px] text-red-400/70 tabular-nums">
                      {o.purchase_amount.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}

                {o.purchase_amount != null && (o.repair_amount != null || o.price != null) && (
                  <span className="text-white/20 text-[10px]">→</span>
                )}

                {/* Цена выдачи */}
                {(o.repair_amount != null || o.price != null) && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="ArrowUpRight" size={9} className="text-emerald-400/60" />
                    <span className="font-roboto font-bold text-[11px] text-emerald-300/90 tabular-nums">
                      {(o.repair_amount ?? o.price ?? 0).toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}

                {/* Прибыль */}
                {profit != null && (
                  <div className="flex items-center gap-1 shrink-0 px-1.5 py-[2px] rounded-md"
                    style={{ background: profit > 0 ? "rgba(255,215,0,0.10)" : "rgba(248,113,113,0.10)", border: `1px solid ${profit > 0 ? "rgba(255,215,0,0.22)" : "rgba(248,113,113,0.22)"}` }}>
                    <Icon name={profit > 0 ? "TrendingUp" : "TrendingDown"} size={9}
                      style={{ color: profit > 0 ? "#FFD700" : "#f87171" }} />
                    <span className="font-oswald font-bold text-[10px] tabular-nums"
                      style={{ color: profit > 0 ? "#FFD700" : "#f87171" }}>
                      {profit > 0 ? "+" : ""}{profit.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}

                {/* Аванс */}
                {!o.is_paid && o.advance != null && o.advance > 0 && (
                  <div className="flex items-center gap-1 shrink-0" title="Аванс">
                    <Icon name="Wallet" size={9} className="text-blue-300/50" />
                    <span className="font-roboto text-[10px] text-blue-300/65 tabular-nums">
                      авт. {o.advance.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}

                {/* Оплачено */}
                {o.is_paid && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name={o.payment_method === "cash" ? "Banknote" : o.payment_method === "card" ? "CreditCard" : "CheckCircle"} size={9} className="text-emerald-400/60" />
                    <span className="font-roboto text-[10px] text-emerald-400/70">оплачено</span>
                  </div>
                )}
              </div>
            )}

            {/* Ряд 3: Причина / описание — ВСЕГДА ОТДЕЛЬНОЙ СТРОКОЙ, не перекрывает модель */}
            {note && (
              <div className="flex items-start gap-1.5 pt-0.5 border-t border-white/[0.04]">
                <Icon name="MessageSquare" size={9} className="text-white/25 mt-[2px] shrink-0" />
                <span className="font-roboto text-[10px] italic text-white/40 line-clamp-1 min-w-0">
                  {note}
                </span>
              </div>
            )}

            {/* Ряд 4: запчасть */}
            {o.part_name && (
              <div className="flex items-center gap-1">
                <span className={`inline-flex items-center gap-1 px-1.5 py-[2px] rounded text-[9px] font-roboto ${
                  o.part_source === "stock"
                    ? "bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
                }`}>
                  <Icon name={o.part_source === "stock" ? "Zap" : "Truck"} size={8} />
                  {o.part_source === "stock" ? "склад" : "заказ"}: {o.part_name}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes goldShimmer {
          0%   { background-position: 250% center; }
          100% { background-position: -250% center; }
        }
      `}</style>
    </div>
  );
}
