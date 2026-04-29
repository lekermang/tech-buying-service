import { Order } from "../types";

export const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";

export const STATUS_LABEL: Record<string, string> = {
  accepted:      "Принят мастером",
  in_progress:   "В работе",
  waiting_parts: "Ждём запчасть",
  ready:         "Готово ✓",
  done:          "Выдано",
  warranty:      "На гарантии",
  cancelled:     "Отменено",
};

export const STATUS_SHORT: Record<string, string> = {
  accepted:      "Принят",
  in_progress:   "Работа",
  waiting_parts: "Запчасть",
  ready:         "Готово",
  done:          "Выдано",
  warranty:      "Гарантия",
  cancelled:     "Отмена",
};

// Иконка + цвет акцента для каждой статус-кнопки в блоке уведомлений
export const STATUS_META: Record<string, { icon: string; tint: string; ring: string }> = {
  accepted:      { icon: "UserCheck",     tint: "text-violet-300",  ring: "ring-violet-400/40" },
  in_progress:   { icon: "Wrench",        tint: "text-sky-300",     ring: "ring-sky-400/40" },
  waiting_parts: { icon: "PackageSearch", tint: "text-amber-300",   ring: "ring-amber-400/40" },
  ready:         { icon: "CheckCircle2",  tint: "text-[#FFD700]",   ring: "ring-[#FFD700]/40" },
  done:          { icon: "PackageCheck",  tint: "text-emerald-300", ring: "ring-emerald-400/40" },
  warranty:      { icon: "ShieldCheck",   tint: "text-teal-300",    ring: "ring-teal-400/40" },
  cancelled:     { icon: "XCircle",       tint: "text-rose-300",    ring: "ring-rose-400/40" },
};

// Премиум-палитра для блока «Сменить статус» — заметные градиенты + glow
export const STATUS_FX: Record<string, {
  icon: string; grad: string; bg: string; border: string; text: string; dot: string; glow: string;
}> = {
  new:           { icon: "Inbox",         grad: "from-white/10 to-white/5",            bg: "bg-white/[0.04]",       border: "border-white/15",            text: "text-white/80",      dot: "bg-white/60",      glow: "shadow-white/10" },
  accepted:      { icon: "UserCheck",     grad: "from-violet-500/25 to-violet-500/5",  bg: "bg-violet-500/10",      border: "border-violet-400/30",       text: "text-violet-200",    dot: "bg-violet-400",    glow: "shadow-violet-500/20" },
  in_progress:   { icon: "Wrench",        grad: "from-sky-500/25 to-sky-500/5",        bg: "bg-sky-500/10",         border: "border-sky-400/30",          text: "text-sky-200",       dot: "bg-sky-400",       glow: "shadow-sky-500/20" },
  waiting_parts: { icon: "PackageSearch", grad: "from-amber-500/25 to-amber-500/5",    bg: "bg-amber-500/10",       border: "border-amber-400/30",        text: "text-amber-200",     dot: "bg-amber-400",     glow: "shadow-amber-500/20" },
  ready:         { icon: "CheckCircle2",  grad: "from-[#FFD700]/30 to-[#FFD700]/5",    bg: "bg-[#FFD700]/10",       border: "border-[#FFD700]/40",        text: "text-[#FFD700]",     dot: "bg-[#FFD700]",     glow: "shadow-[#FFD700]/30" },
  done:          { icon: "PackageCheck",  grad: "from-emerald-500/25 to-emerald-500/5",bg: "bg-emerald-500/10",     border: "border-emerald-400/30",      text: "text-emerald-200",   dot: "bg-emerald-400",   glow: "shadow-emerald-500/20" },
  warranty:      { icon: "ShieldCheck",   grad: "from-teal-500/25 to-teal-500/5",      bg: "bg-teal-500/10",        border: "border-teal-400/30",         text: "text-teal-200",      dot: "bg-teal-400",      glow: "shadow-teal-500/20" },
  cancelled:     { icon: "XCircle",       grad: "from-rose-500/25 to-rose-500/5",      bg: "bg-rose-500/10",        border: "border-rose-400/30",         text: "text-rose-200",      dot: "bg-rose-400",      glow: "shadow-rose-500/20" },
};

export type Channel = "tg" | "sms" | "both";

export type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

export type AuthHeader = "X-Admin-Token" | "X-Employee-Token";

export type OrderCardActionsProps = {
  o: Order;
  ef: EditForm;
  saving: boolean;
  isOwner: boolean;
  token: string;
  authHeader: AuthHeader;
  financeBlocked: boolean;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order, issuedAt?: string) => void;
  onDelete: (id: number) => void;
};
