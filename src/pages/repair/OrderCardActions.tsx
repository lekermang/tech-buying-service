import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, printReceipt, printAct, printActHTML } from "./types";

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
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [smsSentKey, setSmsSentKey] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [actSending, setActSending] = useState(false);
  const [actSent, setActSent] = useState(false);

  // Дата выдачи (для кнопки "Выдано")
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const [issuedAt, setIssuedAt] = useState<string>(nowLocal);

  const handleSendAct = async () => {
    setActSending(true);
    try {
      const res = await fetch("https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04", {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "send_act", id: o.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));
      if (data.ok) { setActSent(true); setTimeout(() => setActSent(false), 3000); }
    } catch (_e) { /* ignore */ }
    setActSending(false);
  };

  const handleSend = async (statusKey: string) => {
    setSentKey(statusKey);
    setNotifyError(null);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "notify", order_id: o.id, status_key: statusKey }),
      });
      if (!res.ok) {
        setNotifyError(`Ошибка сервера (${res.status})`);
      } else {
        const data = await res.json().catch(() => ({}));
        if (!data.ok) setNotifyError(data.error || "Ошибка отправки");
      }
    } catch {
      setNotifyError("Ошибка соединения");
    }
    setTimeout(() => setSentKey(null), 3000);
  };

  const handleSendSms = async (statusKey: string) => {
    setSmsSentKey(statusKey);
    setSmsError(null);
    try {
      const res = await fetch(REPAIR_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "notify_sms", order_id: o.id, status_key: statusKey }),
      });
      if (!res.ok) {
        setSmsError(`Ошибка сервера (${res.status})`);
      } else {
        const data = await res.json().catch(() => ({}));
        if (!data.ok) setSmsError(data.error || "Ошибка SMS");
      }
    } catch {
      setSmsError("Ошибка соединения");
    }
    setTimeout(() => setSmsSentKey(null), 3000);
  };

  return (
    <>
      {/* Смена статуса — премиум */}
      <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 space-y-2">
        <div className="font-oswald font-bold text-white/50 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
          <Icon name="RefreshCw" size={11} />
          Сменить статус
        </div>

        {/* Поле даты выдачи */}
        {o.status !== "done" && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-md px-3 py-2">
            <Icon name="CalendarCheck" size={13} className="text-[#FFD700] shrink-0" />
            <span className="font-roboto text-[10px] text-[#FFD700]/70 shrink-0 uppercase tracking-wide">Дата выдачи:</span>
            <input
              type="datetime-local"
              value={issuedAt}
              onChange={e => setIssuedAt(e.target.value)}
              className="flex-1 bg-transparent font-roboto text-[11px] text-white outline-none min-w-0 cursor-pointer tabular-nums"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {STATUSES.filter(s => s.key !== o.status).map(s => {
            const needsFinance = s.key === "ready" || s.key === "done";
            const blocked = needsFinance && financeBlocked;
            return (
              <button key={s.key}
                onClick={() => {
                  if (s.key === "ready") onOpenReadyModal(o);
                  else if (s.key === "done") onIssueOrder(o, issuedAt);
                  else onChangeStatus(o.id, s.key, { admin_note: ef.admin_note });
                }}
                disabled={saving || blocked}
                title={blocked ? "Введите суммы закупки и выдачи" : undefined}
                className={`font-roboto text-xs py-2.5 px-3 rounded-md border transition-all flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 ${
                  blocked
                    ? "border-white/5 bg-[#0A0A0A] text-white/20 cursor-not-allowed"
                    : saving
                    ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                    : `${s.color} border-current/30 hover:ring-1 hover:ring-current/40 font-bold`
                }`}>
                {blocked ? <Icon name="Lock" size={11} /> : <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot} animate-pulse`} />}
                {s.label}
              </button>
            );
          })}
        </div>
        {financeBlocked && (
          <div className="text-[10px] font-roboto text-white/40 flex items-center gap-1 bg-orange-500/5 border border-orange-500/15 rounded px-2 py-1.5">
            <Icon name="Info" size={10} className="text-orange-400" />
            Для статусов «Готово» и «Выдано» укажите суммы закупки и ремонта
          </div>
        )}
      </div>

      {/* Telegram уведомление — премиум */}
      <div className="relative bg-gradient-to-br from-[#229ED9]/10 to-transparent border border-[#229ED9]/25 rounded-lg p-3">
        <div className="font-oswald font-bold text-[#229ED9]/80 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Icon name="Send" size={11} />
          <span>Telegram клиенту</span>
          {sentKey && !notifyError && (
            <span className="ml-auto flex items-center gap-1 bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full text-[9px] font-normal animate-in fade-in zoom-in-95">
              <Icon name="Check" size={9} />Отправлено
            </span>
          )}
          {notifyError && (
            <span className="ml-auto bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-normal">
              {notifyError}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(STATUS_LABEL).map(([key, label]) => {
            const sent = sentKey === key;
            return (
              <button key={key} type="button" onClick={() => handleSend(key)}
                disabled={sent}
                title={label}
                className={`font-roboto text-[9px] py-1.5 rounded-md border transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 min-h-[38px] ${
                  sent
                    ? "border-green-500/50 text-green-400 bg-green-500/15 font-bold"
                    : "border-[#229ED9]/25 bg-[#229ED9]/5 text-[#229ED9] hover:bg-[#229ED9]/15 hover:border-[#229ED9]/50"
                }`}>
                <Icon name={sent ? "Check" : "Send"} size={10} />
                <span className="leading-none text-center">{STATUS_SHORT[key]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SMS — премиум */}
      <div className="relative bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/25 rounded-lg p-3">
        <div className="font-oswald font-bold text-green-400/80 text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Icon name="MessageSquare" size={11} />
          <span>SMS · <span className="text-white/60 font-roboto normal-case tabular-nums">{o.phone || "—"}</span></span>
          {smsSentKey && !smsError && (
            <span className="ml-auto flex items-center gap-1 bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full text-[9px] font-normal animate-in fade-in zoom-in-95">
              <Icon name="Check" size={9} />Отправлено
            </span>
          )}
          {smsError && (
            <span className="ml-auto bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full text-[9px] font-normal">
              {smsError}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(STATUS_LABEL).map(([key, label]) => {
            const sent = smsSentKey === key;
            return (
              <button key={key} type="button" onClick={() => handleSendSms(key)}
                disabled={sent}
                title={label}
                className={`font-roboto text-[9px] py-1.5 rounded-md border transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 min-h-[38px] ${
                  sent
                    ? "border-green-500/50 text-green-400 bg-green-500/15 font-bold"
                    : "border-green-500/25 bg-green-500/5 text-green-400 hover:bg-green-500/15 hover:border-green-500/50"
                }`}>
                <Icon name={sent ? "Check" : "MessageSquare"} size={10} />
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