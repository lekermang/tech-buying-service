import Icon from "@/components/ui/icon";
import { Order, STATUSES, fmt } from "./types";

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

// Уровень срочности для НОВЫХ заявок (по часам с created_at)
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

// Цвет статус-маркера слева (тонкая полоска)
function getStatusAccent(status: string): { bar: string; text: string; bg: string } {
  switch (status) {
    case "new": return { bar: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-500/10" };
    case "accepted": return { bar: "bg-purple-400", text: "text-purple-300", bg: "bg-purple-500/10" };
    case "in_progress": return { bar: "bg-blue-400", text: "text-blue-300", bg: "bg-blue-500/10" };
    case "waiting_parts": return { bar: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-500/10" };
    case "ready": return { bar: "bg-[#FFD700]", text: "text-[#FFD700]", bg: "bg-[#FFD700]/10" };
    case "done": return { bar: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10" };
    case "warranty": return { bar: "bg-teal-400", text: "text-teal-300", bg: "bg-teal-500/10" };
    case "cancelled": return { bar: "bg-red-400", text: "text-red-300", bg: "bg-red-500/10" };
    default: return { bar: "bg-white/30", text: "text-white/60", bg: "bg-white/5" };
  }
}

type Props = {
  o: Order;
  isExpanded: boolean;
  onToggle: () => void;
};

/** Компактный заголовок заявки на ремонт.
 *  Дизайн: тонкая граница, цветной маркер слева, ВСЯ ключевая информация в 2 строки —
 *  имя · телефон · модель · статус · сумма · мастер · дата. Без неоновых рамок и пульсаций. */
export default function OrderCardHeader({ o, isExpanded, onToggle }: Props) {
  const st = statusInfo(o.status);
  const accent = getStatusAccent(o.status);
  const initials = (o.name || "")
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const urgency: UrgencyLevel = o.status === "new" ? getUrgencyLevel(o.created_at) : 0;
  const isCritical = urgency === 5;

  // Описание неисправности — комментарий клиента или заметка мастера
  const description = o.comment || o.admin_note || "";

  // Сумма выдачи + расчёт мастера
  const profit =
    o.repair_amount != null && o.purchase_amount != null
      ? o.repair_amount - o.purchase_amount
      : null;
  const masterCalc = profit != null ? Math.max(0, Math.round(profit * 0.5)) : null;

  // Главная цена для отображения в строке: выдано > оценка
  const mainPrice = o.repair_amount != null
    ? { v: o.repair_amount, label: "выдано", color: "text-emerald-300" }
    : o.price != null
      ? { v: o.price, label: "оценка", color: "text-[#FFD700]" }
      : null;

  return (
    <div
      className={`relative cursor-pointer select-none transition-colors ${
        isExpanded ? "" : "hover:bg-white/[0.02] active:bg-white/[0.04]"
      }`}
      onClick={onToggle}
    >
      {/* Цветной маркер слева — тонкая полоса по высоте всей строки */}
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${accent.bar} ${isCritical ? "animate-pulse" : ""}`} />

      <div className="pl-2.5 pr-2 py-2">
        {/* ── Строка 1: аватар(мини) + имя + статус + сумма + дата + шеврон ── */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Мини-аватар с инициалами и #ID */}
          <div className="shrink-0 flex items-center gap-1">
            <div className="w-7 h-7 rounded-md bg-[#181818] border border-[#2A2A2A] flex items-center justify-center font-oswald font-bold text-[#FFD700] text-[11px] leading-none">
              {initials}
            </div>
            <span className="font-oswald text-[9px] text-white/40 tabular-nums">#{o.id}</span>
          </div>

          {/* Имя — без обрезки, перенос если слишком длинное */}
          <span className="font-oswald font-bold text-[14px] text-white uppercase tracking-tight truncate flex-1 min-w-0">
            {o.name}
          </span>

          {/* Бейдж статуса — компактный */}
          {o.status === "new" ? (
            <span
              title={URGENCY_TITLES[urgency]}
              className={`shrink-0 font-oswald font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                isCritical
                  ? "bg-red-500/25 text-red-200 border border-red-500/50 animate-pulse"
                  : urgency >= 3
                    ? "bg-orange-500/20 text-orange-200 border border-orange-500/40"
                    : "bg-orange-500/15 text-orange-300 border border-orange-500/30"
              }`}
            >
              {isCritical ? "🚨 СРОЧНО" : urgency >= 3 ? "🔥 НОВАЯ" : "Новая"}
            </span>
          ) : (
            <span className={`shrink-0 font-oswald text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${accent.bg} ${accent.text} border border-current/20`}>
              {st.label}
            </span>
          )}

          {/* Главная сумма — выдано или оценка */}
          {mainPrice && (
            <span className={`shrink-0 font-oswald font-bold text-[12px] tabular-nums ${mainPrice.color}`}>
              {mainPrice.v.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Шеврон */}
          <Icon
            name={isExpanded ? "ChevronUp" : "ChevronDown"}
            size={14}
            className={`shrink-0 ${isExpanded ? "text-[#FFD700]" : "text-white/30"}`}
          />
        </div>

        {/* ── Строка 2: телефон · модель/тип ремонта · мастер · дата ── */}
        <div className="flex items-center gap-2 mt-1 text-[11px] flex-wrap pl-[34px]">
          <a
            href={`tel:${o.phone}`}
            onClick={e => e.stopPropagation()}
            className="font-roboto text-[#FFD700] hover:text-[#FFE34D] tabular-nums inline-flex items-center gap-1 shrink-0"
            title="Позвонить"
          >
            <Icon name="Phone" size={10} />
            {o.phone}
          </a>

          {/* Модель + тип ремонта объединены */}
          <span className="text-white/70 inline-flex items-center gap-1 min-w-0 truncate">
            <Icon name="Smartphone" size={10} className="text-white/40 shrink-0" />
            <span className="truncate">
              {o.model || <span className="text-white/30 italic">без модели</span>}
              {o.repair_type && <span className="text-purple-300/80"> · {o.repair_type}</span>}
            </span>
          </span>

          {/* Мастер — заработок (если есть) */}
          {masterCalc != null && masterCalc > 0 && (
            <span className="text-emerald-400/80 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Заработок мастера (50% прибыли)">
              <Icon name="Award" size={10} />
              {masterCalc.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Аванс */}
          {!o.is_paid && o.advance != null && o.advance > 0 && (
            <span className="text-blue-300/80 inline-flex items-center gap-0.5 shrink-0 tabular-nums" title="Получен аванс">
              <Icon name="Wallet" size={10} />
              {o.advance.toLocaleString("ru-RU")}₽
            </span>
          )}

          {/* Способ оплаты */}
          {o.is_paid && o.payment_method && (
            <span className="text-emerald-400/80 inline-flex items-center gap-0.5 shrink-0" title="Оплачено">
              <Icon name={o.payment_method === "cash" ? "Banknote" : o.payment_method === "card" ? "CreditCard" : "Smartphone"} size={10} />
            </span>
          )}

          {/* Дата создания — справа в углу */}
          <span className="ml-auto text-white/35 font-roboto text-[10px] tabular-nums shrink-0">
            {fmt(o.created_at)}
          </span>
        </div>

        {/* ── Строка 3 (только если есть описание) — превью неисправности ── */}
        {description && !isExpanded && (
          <div className="mt-1 pl-[34px] pr-1">
            <div className="text-[11px] text-white/55 truncate font-roboto leading-tight">
              <Icon name="Wrench" size={9} className="inline mr-1 text-white/40" />
              {description}
            </div>
          </div>
        )}

        {/* ── Строка 4 (только если есть запчасть в работе) ── */}
        {o.part_name && !isExpanded && (
          <div className="mt-1 pl-[34px]">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
              o.part_source === "stock"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                : "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/25"
            }`}>
              <Icon name={o.part_source === "stock" ? "Zap" : "Truck"} size={9} />
              {o.part_source === "stock" ? "со склада" : "под заказ"}: <span className="truncate max-w-[180px]">{o.part_name}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
