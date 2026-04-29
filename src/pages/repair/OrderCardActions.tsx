import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, printReceipt, printAct, printActHTML } from "./types";
import { useStaffToast } from "../staff/StaffToast";

const STATUS_LABEL: Record<string, string> = {
  accepted:      "Принят мастером",
  in_progress:   "В работе",
  waiting_parts: "Ждём запчасть",
  ready:         "Готово ✓",
  done:          "Выдано",
  warranty:      "На гарантии",
  cancelled:     "Отменено",
};

const STATUS_SHORT: Record<string, string> = {
  accepted:      "Принят",
  in_progress:   "Работа",
  waiting_parts: "Запчасть",
  ready:         "Готово",
  done:          "Выдано",
  warranty:      "Гарантия",
  cancelled:     "Отмена",
};

// Иконка + цвет акцента для каждой статус-кнопки в блоке уведомлений
const STATUS_META: Record<string, { icon: string; tint: string; ring: string }> = {
  accepted:      { icon: "UserCheck",     tint: "text-violet-300",  ring: "ring-violet-400/40" },
  in_progress:   { icon: "Wrench",        tint: "text-sky-300",     ring: "ring-sky-400/40" },
  waiting_parts: { icon: "PackageSearch", tint: "text-amber-300",   ring: "ring-amber-400/40" },
  ready:         { icon: "CheckCircle2",  tint: "text-[#FFD700]",   ring: "ring-[#FFD700]/40" },
  done:          { icon: "PackageCheck",  tint: "text-emerald-300", ring: "ring-emerald-400/40" },
  warranty:      { icon: "ShieldCheck",   tint: "text-teal-300",    ring: "ring-teal-400/40" },
  cancelled:     { icon: "XCircle",       tint: "text-rose-300",    ring: "ring-rose-400/40" },
};

// Премиум-палитра для блока «Сменить статус» — заметные градиенты + glow
const STATUS_FX: Record<string, {
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

type Channel = "tg" | "sms" | "both";

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

type Props = {
  o: Order;
  ef: EditForm;
  saving: boolean;
  isOwner: boolean;
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
  financeBlocked: boolean;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order, issuedAt?: string) => void;
  onDelete: (id: number) => void;
};

export default function OrderCardActions({
  o, ef, saving, isOwner, token, authHeader, financeBlocked,
  onChangeStatus, onOpenReadyModal, onIssueOrder, onDelete,
}: Props) {
  const toast = useStaffToast();
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [smsSentKey, setSmsSentKey] = useState<string | null>(null);
  const [actSending, setActSending] = useState(false);
  const [actSent, setActSent] = useState(false);
  const [channel, setChannel] = useState<Channel>("tg");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  // Дата выдачи (для кнопки "Выдано")
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [issuedAt, setIssuedAt] = useState<string>(nowLocal);

  const handleSendAct = async () => {
    setActSending(true);
    const tid = toast.loading(`Отправляю акт по заявке #${o.id} в Telegram...`);
    try {
      const res = await fetch("https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04", {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "send_act", id: o.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setActSent(true);
        setTimeout(() => setActSent(false), 3000);
        toast.update(tid, { kind: "success", message: "Акт отправлен в Telegram", duration: 3000 });
      } else {
        toast.update(tid, { kind: "error", message: data.error || "Не удалось отправить акт", duration: 5000 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка соединения";
      toast.update(tid, { kind: "error", message: `Ошибка отправки акта: ${msg}`, duration: 5000 });
    } finally {
      setActSending(false);
    }
  };

  const handleSend = async (statusKey: string) => {
    setSentKey(statusKey);
    const tid = toast.loading(`Отправляю Telegram (${STATUS_LABEL[statusKey] || statusKey})...`);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "notify", order_id: o.id, status_key: statusKey }),
      });
      if (!res.ok) {
        toast.update(tid, { kind: "error", message: `Ошибка сервера (${res.status})`, duration: 5000 });
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.ok) toast.update(tid, { kind: "success", message: "Telegram отправлен", duration: 2500 });
        else toast.update(tid, { kind: "error", message: data.error || "Не удалось отправить", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Ошибка соединения", duration: 5000 });
    }
    setTimeout(() => setSentKey(null), 3000);
  };

  const handleSendSms = async (statusKey: string) => {
    setSmsSentKey(statusKey);
    const tid = toast.loading(`Отправляю SMS (${STATUS_LABEL[statusKey] || statusKey})...`);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "notify_sms", order_id: o.id, status_key: statusKey }),
      });
      if (!res.ok) {
        toast.update(tid, { kind: "error", message: `Ошибка сервера (${res.status})`, duration: 5000 });
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.ok) toast.update(tid, { kind: "success", message: `SMS отправлено на ${o.phone || "клиента"}`, duration: 2500 });
        else toast.update(tid, { kind: "error", message: data.error || "Не удалось отправить SMS", duration: 5000 });
      }
    } catch {
      toast.update(tid, { kind: "error", message: "Ошибка соединения", duration: 5000 });
    }
    setTimeout(() => setSmsSentKey(null), 3000);
  };

  // Один тап по статусу — отправка по выбранному каналу (TG / SMS / оба)
  const handleNotify = async (statusKey: string) => {
    if (pendingKey) return;
    setPendingKey(statusKey);
    try {
      if (channel === "tg") {
        await handleSend(statusKey);
      } else if (channel === "sms") {
        await handleSendSms(statusKey);
      } else {
        // both: параллельно
        await Promise.all([handleSend(statusKey), handleSendSms(statusKey)]);
      }
    } finally {
      setTimeout(() => setPendingKey(null), 600);
    }
  };

  return (
    <>
      {/* Смена статуса — премиум */}
      <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/15 bg-gradient-to-br from-[#1a1a1a] via-[#0E0E0E] to-[#0A0A0A] p-3 shadow-[0_0_30px_-15px_rgba(255,215,0,0.25)]">
        {/* декоративные блики */}
        <div className="pointer-events-none absolute -top-20 -right-10 w-44 h-44 bg-[#FFD700]/8 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 w-44 h-44 bg-violet-500/8 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
            <Icon name="RefreshCw" size={13} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold text-white text-[12px] uppercase tracking-wider leading-tight">Сменить статус</div>
            <div className="font-roboto text-[10px] text-white/40 leading-tight truncate">
              текущий: <span className={STATUS_FX[o.status]?.text || "text-white/60"}>
                {(STATUSES.find(s => s.key === o.status)?.label) || o.status}
              </span>
            </div>
          </div>
          {saving && (
            <span className="flex items-center gap-1 bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 px-2 py-0.5 rounded-full text-[9px] font-roboto">
              <Icon name="Loader" size={9} className="animate-spin" />Сохраняю
            </span>
          )}
        </div>

        {/* Поле даты выдачи — премиум */}
        {o.status !== "done" && (
          <div className="relative flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/[0.08] via-[#FFD700]/[0.04] to-transparent border border-[#FFD700]/25 rounded-lg px-3 py-2 mb-3">
            <Icon name="CalendarCheck" size={14} className="text-[#FFD700] shrink-0" />
            <span className="font-roboto text-[10px] text-[#FFD700]/80 shrink-0 uppercase tracking-wider font-bold">Дата выдачи</span>
            <input
              type="datetime-local"
              value={issuedAt}
              onChange={e => setIssuedAt(e.target.value)}
              className="flex-1 bg-transparent font-roboto text-[11px] text-white outline-none min-w-0 cursor-pointer tabular-nums text-right"
            />
          </div>
        )}

        {/* Сетка статусов — премиум-плитки */}
        <div className="relative grid grid-cols-2 gap-2">
          {STATUSES.filter(s => s.key !== o.status).map(s => {
            const fx = STATUS_FX[s.key] || STATUS_FX.new;
            const needsFinance = s.key === "ready" || s.key === "done";
            const blocked = needsFinance && financeBlocked;
            const isLoading = saving;
            return (
              <button key={s.key}
                onClick={() => {
                  if (s.key === "ready") onOpenReadyModal(o);
                  else if (s.key === "done") onIssueOrder(o, issuedAt);
                  else onChangeStatus(o.id, s.key, { admin_note: ef.admin_note });
                }}
                disabled={isLoading || blocked}
                title={blocked ? "Введите суммы закупки и выдачи" : s.label}
                className={`group relative overflow-hidden font-roboto text-[12px] py-2.5 px-3 rounded-lg border transition-all flex items-center gap-2 min-h-[48px] active:scale-95 ${
                  blocked
                    ? "border-white/5 bg-black/40 text-white/25 cursor-not-allowed"
                    : isLoading
                    ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                    : `${fx.bg} ${fx.border} ${fx.text} hover:bg-gradient-to-br hover:${fx.grad} hover:shadow-lg hover:${fx.glow} hover:border-current/50 font-bold`
                }`}>
                {/* hover-блик */}
                {!blocked && !isLoading && (
                  <span className={`pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${fx.grad}`} />
                )}
                {/* Иконка статуса */}
                <span className="relative w-7 h-7 rounded-md bg-black/30 border border-white/10 flex items-center justify-center shrink-0">
                  {blocked
                    ? <Icon name="Lock" size={12} />
                    : <Icon name={fx.icon} size={13} />}
                </span>
                <span className="relative flex-1 text-left leading-tight">{s.label}</span>
                {!blocked && (
                  <span className={`relative w-1.5 h-1.5 rounded-full shrink-0 ${fx.dot} animate-pulse`} />
                )}
              </button>
            );
          })}
        </div>

        {financeBlocked && (
          <div className="relative mt-2 text-[10px] font-roboto text-orange-300/80 flex items-center gap-1.5 bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/25 rounded-lg px-2.5 py-1.5">
            <Icon name="Info" size={11} className="text-orange-400 shrink-0" />
            Для «Готово» и «Выдано» укажите суммы закупки и ремонта
          </div>
        )}
      </div>

      {/* Уведомить клиента — единый премиум-блок (TG / SMS / Оба) */}
      <div className="relative overflow-hidden rounded-xl border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/[0.06] via-[#229ED9]/[0.04] to-emerald-500/[0.04] p-3 shadow-[0_0_30px_-15px_rgba(255,215,0,0.4)]">
        {/* декоративный блик */}
        <div className="pointer-events-none absolute -top-16 -right-10 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-40 h-40 bg-[#229ED9]/10 rounded-full blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
            <Icon name="BellRing" size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold text-white text-[12px] uppercase tracking-wider leading-tight">Уведомить клиента</div>
            <div className="font-roboto text-[10px] text-white/40 leading-tight truncate tabular-nums">
              {o.phone || "телефон не указан"}
            </div>
          </div>
          {(sentKey || smsSentKey) && (
            <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-roboto animate-in fade-in zoom-in-95">
              <Icon name="Check" size={9} />Отправлено
            </span>
          )}
        </div>

        {/* Сегмент-переключатель каналов */}
        <div className="relative grid grid-cols-3 gap-1 p-1 bg-black/40 border border-white/5 rounded-lg mb-3">
          {([
            { k: "tg" as Channel,   l: "Telegram", icon: "Send",          color: "from-[#229ED9] to-[#1a7eb0]" },
            { k: "sms" as Channel,  l: "SMS",      icon: "MessageSquare", color: "from-emerald-500 to-emerald-700" },
            { k: "both" as Channel, l: "Оба",      icon: "Zap",           color: "from-[#FFD700] to-yellow-600" },
          ]).map(c => {
            const active = channel === c.k;
            return (
              <button key={c.k} type="button" onClick={() => setChannel(c.k)}
                className={`relative font-roboto text-[10px] py-1.5 rounded-md transition-all active:scale-95 flex items-center justify-center gap-1 ${
                  active
                    ? `bg-gradient-to-br ${c.color} text-black font-bold shadow-md`
                    : "text-white/50 hover:text-white"
                }`}>
                <Icon name={c.icon} size={11} />
                {c.l}
              </button>
            );
          })}
        </div>

        {/* Сетка статусов — одной кнопкой шлёт по выбранному каналу */}
        <div className="relative grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {Object.entries(STATUS_LABEL).map(([key, label]) => {
            const meta = STATUS_META[key];
            const isPending = pendingKey === key;
            const isSent = (channel === "tg" && sentKey === key)
              || (channel === "sms" && smsSentKey === key)
              || (channel === "both" && sentKey === key && smsSentKey === key);
            const disabled = isPending || isSent;
            return (
              <button key={key} type="button" onClick={() => handleNotify(key)}
                disabled={disabled}
                title={label}
                className={`group relative overflow-hidden font-roboto text-[9px] py-2 px-1 rounded-lg border transition-all active:scale-95 flex flex-col items-center justify-center gap-1 min-h-[54px] ${
                  isSent
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-bold"
                    : isPending
                    ? "border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700]"
                    : `border-white/10 bg-white/[0.02] ${meta.tint} hover:bg-white/[0.05] hover:ring-1 hover:${meta.ring} hover:border-white/20`
                }`}>
                {/* hover-блик */}
                {!disabled && (
                  <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-white/[0.03] to-transparent" />
                )}
                <Icon
                  name={isSent ? "Check" : isPending ? "Loader" : meta.icon}
                  size={14}
                  className={isPending ? "animate-spin" : ""}
                />
                <span className="leading-none text-center">{STATUS_SHORT[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Печать + удаление — премиум action bar */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-2.5">
        <div className="font-oswald font-bold text-white/50 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Icon name="Printer" size={11} />
          Документы и действия
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={handleSendAct} disabled={actSending}
            className={`flex-1 min-w-[72px] font-roboto text-[11px] py-2.5 rounded-md border transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[42px] ${
              actSent
                ? "border-green-500/50 text-green-400 bg-green-500/15 font-bold"
                : "border-[#229ED9]/30 bg-[#229ED9]/5 text-[#229ED9] hover:bg-[#229ED9]/15 hover:border-[#229ED9]/50"
            }`}>
            <Icon name={actSent ? "Check" : actSending ? "Loader" : "Send"} size={13} className={actSending ? "animate-spin" : ""} />
            {actSent ? "Отправлен" : "Акт в TG"}
          </button>
          <button onClick={() => printActHTML(o)}
            className="flex-1 min-w-[72px] font-roboto text-[11px] py-2.5 rounded-md border border-[#FFD700]/40 bg-[#FFD700]/5 text-[#FFD700] hover:bg-[#FFD700]/15 hover:border-[#FFD700]/60 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[42px] font-bold">
            <Icon name="FileText" size={13} />Акт
          </button>
          <button onClick={() => printAct(o)}
            className="flex-1 min-w-[72px] font-roboto text-[11px] py-2.5 rounded-md border border-[#FFD700]/25 bg-[#0A0A0A] text-[#FFD700]/80 hover:bg-[#FFD700]/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[42px]">
            <Icon name="Download" size={13} />.docx
          </button>
          <button onClick={() => printReceipt(o)}
            className="flex-1 min-w-[72px] font-roboto text-[11px] py-2.5 rounded-md border border-[#1F1F1F] bg-[#0A0A0A] text-white/50 hover:text-white hover:border-white/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 min-h-[42px]">
            <Icon name="Printer" size={13} />Чек
          </button>
          {isOwner && (
            <button onClick={() => onDelete(o.id)}
              title="Удалить заявку"
              className="font-roboto text-[11px] py-2.5 px-4 rounded-md border border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/50 active:scale-95 transition-all flex items-center justify-center min-h-[42px]">
              <Icon name="Trash2" size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}