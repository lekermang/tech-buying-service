import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order } from "../types";
import { useStaffToast } from "../../staff/StaffToast";
import {
  STATUS_LABEL,
  STATUS_SHORT,
  STATUS_META,
  Channel,
  REPAIR_ORDER_URL,
  AuthHeader,
} from "./orderCardActionsTypes";

type Props = {
  o: Order;
  token: string;
  authHeader: AuthHeader;
};

export default function OrderCardNotifyBlock({ o, token, authHeader }: Props) {
  const toast = useStaffToast();
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [smsSentKey, setSmsSentKey] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("tg");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

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
  );
}
