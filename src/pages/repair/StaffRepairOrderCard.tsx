import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, INP, LBL, fmt, printReceipt, printAct, printActHTML } from "./types";
import { formatPhone } from "@/lib/phoneFormat";

const STATUS_LABEL: Record<string, string> = {
  in_progress:   "В работе",
  waiting_parts: "Ждём запчасть",
  ready:         "Готово ✓",
  done:          "Выдано",
  cancelled:     "Отменено",
};

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean;
};

type Props = {
  o: Order;
  isExpanded: boolean;
  ef: EditForm;
  saving: boolean;
  saveError: string | null;
  isOwner: boolean;
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
  onToggle: () => void;
  onEditFormChange: (id: number, ef: EditForm) => void;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order) => void;
  onSaveCard: (o: Order) => void;
  onDelete: (id: number) => void;
};

const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

export default function StaffRepairOrderCard({
  o, isExpanded, ef, saving, saveError, isOwner, token, authHeader,
  onToggle, onEditFormChange, onChangeStatus, onOpenReadyModal, onIssueOrder, onSaveCard, onDelete,
}: Props) {
  const st = statusInfo(o.status);
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [smsSentKey, setSmsSentKey] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [actSending, setActSending] = useState(false);
  const [actSent, setActSent] = useState(false);

  const handleSendAct = async () => {
    setActSending(true);
    try {
      const res = await fetch("https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04", {
        method: "POST",
        headers: { "Content-Type": "application/json", [authHeader]: token },
        body: JSON.stringify({ action: "send_act", id: o.id }),
      });
      const data = await res.json();
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
      const data = await res.json();
      if (!data.ok) setNotifyError(data.error || "Ошибка отправки");
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
      const data = await res.json();
      if (!data.ok) setSmsError(data.error || "Ошибка SMS");
    } catch {
      setSmsError("Ошибка соединения");
    }
    setTimeout(() => setSmsSentKey(null), 3000);
  };

  const hasAmount = ef.repair_amount !== "" && ef.repair_amount != null;
  const hasPurchase = ef.purchase_amount !== "" && ef.purchase_amount != null;
  const financeBlocked = !hasAmount || !hasPurchase;

  return (
    <div className={`bg-[#1A1A1A] border transition-colors ${isExpanded ? "border-[#FFD700]/50" : "border-[#2A2A2A]"}`}>

      {/* ── Шапка карточки ── */}
      <div className="p-3 active:bg-white/5 transition-colors cursor-pointer select-none" onClick={onToggle}>
        {/* Строка 1: номер + статус + имя */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span className="font-oswald font-bold text-[#FFD700] text-base shrink-0">#{o.id}</span>
            <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0 rounded-sm ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
            </span>
            <span className="font-roboto text-sm text-white font-semibold truncate">{o.name}</span>
          </div>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/30 shrink-0 mt-0.5" />
        </div>

        {/* Строка 2: телефон + устройство */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
            className="font-roboto text-sm text-[#FFD700] font-medium flex items-center gap-1.5">
            <Icon name="Phone" size={13} className="opacity-60" />
            {o.phone}
          </a>
          <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[#229ED9] flex items-center gap-1 font-roboto text-xs">
            <Icon name="Send" size={13} />
          </a>
          {o.model && <span className="text-white/40 font-roboto text-xs">📱 {o.model}</span>}
          {o.repair_type && <span className="text-white/40 font-roboto text-xs">🔧 {o.repair_type}</span>}
        </div>

        {/* Строка 3: цены + даты */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {o.price && <span className="text-[#FFD700] font-roboto text-xs font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
          {o.repair_amount != null && <span className="text-green-400 font-roboto text-xs">✓ {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
          {o.master_income != null && <span className="text-green-300/70 font-roboto text-[10px]">мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
        </div>
        <div className="flex gap-3 mt-0.5 flex-wrap">
          <span className="text-white/20 font-roboto text-[9px]">📥 {fmt(o.created_at)}</span>
          {o.picked_up_at && <span className="text-green-400/50 font-roboto text-[9px]">📤 {fmt(o.picked_up_at)}</span>}
          {o.completed_at && !o.picked_up_at && <span className="text-yellow-400/40 font-roboto text-[9px]">✅ {fmt(o.completed_at)}</span>}
        </div>
      </div>

      {/* ── Раскрытая часть ── */}
      {isExpanded && (
        <div className="border-t border-[#2A2A2A] p-3 space-y-4">

          {/* Комментарий */}
          {o.comment && (
            <div className="px-3 py-2 bg-white/5 border border-white/8 text-xs font-roboto text-white/55 italic">"{o.comment}"</div>
          )}

          {/* Финансы */}
          <div className="space-y-2">
            <div>
              <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть</label>
              <input value={ef.parts_name}
                onChange={e => onEditFormChange(o.id, { ...ef, parts_name: e.target.value })}
                placeholder="Дисплей iPhone 14..." className={INP} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽)</label>
                <input type="number" inputMode="numeric" value={ef.purchase_amount}
                  onChange={e => onEditFormChange(o.id, { ...ef, purchase_amount: e.target.value })}
                  placeholder="0" className={INP} />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer active:opacity-70"
                  onClick={() => onEditFormChange(o.id, { ...ef, purchase_amount: "0" })}>
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${ef.purchase_amount === "0" ? "bg-[#FFD700] border-[#FFD700]" : "border-white/30"}`}>
                    {ef.purchase_amount === "0" && <Icon name="Check" size={10} className="text-black" />}
                  </div>
                  <span className="font-roboto text-[10px] text-white/40">Без закупки (0 ₽)</span>
                </label>
              </div>
              <div>
                <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽)</label>
                <input type="number" inputMode="numeric" value={ef.repair_amount}
                  onChange={e => onEditFormChange(o.id, { ...ef, repair_amount: e.target.value })}
                  placeholder="1500" className={INP} />
              </div>
            </div>

            {ef.repair_amount && ef.purchase_amount && (
              <div className="bg-green-500/10 border border-green-500/20 px-3 py-2 flex gap-4 text-xs font-roboto">
                <span className="text-white/40">Прибыль: <span className={`font-bold ml-1 ${parseInt(ef.repair_amount) - parseInt(ef.purchase_amount) >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                  {(parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)).toLocaleString("ru-RU")} ₽
                </span></span>
                <span className="text-white/40">Мастер: <span className="text-green-400 font-bold ml-1">
                  {Math.max(0, Math.round((parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                </span></span>
              </div>
            )}

            {/* Аванс + Оплачено */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
              <div>
                <label className={LBL + " text-blue-400/80"}>💵 Аванс (₽)</label>
                <input type="number" inputMode="numeric" value={ef.advance}
                  onChange={e => onEditFormChange(o.id, { ...ef, advance: e.target.value })}
                  placeholder="0" className={INP} />
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer active:opacity-70"
                  onClick={() => onEditFormChange(o.id, { ...ef, is_paid: !ef.is_paid })}>
                  <div className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${ef.is_paid ? "bg-green-500 border-green-500" : "border-white/30"}`}>
                    {ef.is_paid && <Icon name="Check" size={10} className="text-white" />}
                  </div>
                  <span className="font-roboto text-xs text-white/60">Оплачено полностью</span>
                </label>
              </div>
            </div>
            {ef.is_paid && (
              <div className="text-[10px] font-roboto text-green-400/70 px-1">✓ Клиент оплатил ремонт полностью</div>
            )}
            {!ef.is_paid && ef.advance && parseInt(ef.advance) > 0 && (
              <div className="text-[10px] font-roboto text-blue-400/70 px-1">
                Аванс: {parseInt(ef.advance).toLocaleString("ru-RU")} ₽
                {ef.repair_amount && ` · Остаток: ${(parseInt(ef.repair_amount) - parseInt(ef.advance)).toLocaleString("ru-RU")} ₽`}
              </div>
            )}
          </div>

          {/* Поля заявки */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL}>Имя</label>
              <input value={ef.name} onChange={e => onEditFormChange(o.id, { ...ef, name: e.target.value })} className={INP} placeholder="Иван" />
            </div>
            <div>
              <label className={LBL}>Телефон</label>
              <input type="tel" value={ef.phone} onChange={e => onEditFormChange(o.id, { ...ef, phone: formatPhone(e.target.value) })} className={INP} placeholder="+7..." />
            </div>
            <div>
              <label className={LBL}>Модель</label>
              <input value={ef.model} onChange={e => onEditFormChange(o.id, { ...ef, model: e.target.value })} className={INP} placeholder="iPhone 14" />
            </div>
            <div>
              <label className={LBL}>Тип ремонта</label>
              <input value={ef.repair_type} onChange={e => onEditFormChange(o.id, { ...ef, repair_type: e.target.value })} className={INP} placeholder="Дисплей" />
            </div>
          </div>
          <div>
            <label className={LBL}>Заметка</label>
            <textarea value={ef.admin_note}
              onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
              rows={2} placeholder="Внутренняя заметка..."
              className={INP + " resize-none"} />
          </div>

          {saveError && <div className="text-red-400 font-roboto text-xs px-1">{saveError}</div>}

          {/* Кнопка сохранить */}
          <button onClick={() => onSaveCard(o)} disabled={saving}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase text-sm disabled:opacity-40 flex items-center justify-center gap-2 transition-colors active:bg-yellow-400">
            <Icon name="Save" size={15} />{saving ? "Сохраняю..." : "Сохранить изменения"}
          </button>

          {/* Смена статуса */}
          <div>
            <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wider mb-2">Сменить статус</div>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.filter(s => s.key !== o.status).map(s => {
                const needsFinance = s.key === "ready" || s.key === "done";
                const blocked = needsFinance && financeBlocked;
                return (
                  <button key={s.key}
                    onClick={() => {
                      if (s.key === "ready") onOpenReadyModal(o);
                      else if (s.key === "done") onIssueOrder(o);
                      else onChangeStatus(o.id, s.key, { admin_note: ef.admin_note });
                    }}
                    disabled={saving || blocked}
                    title={blocked ? "Введите суммы закупки и выдачи" : undefined}
                    className={`font-roboto text-xs py-2.5 px-3 border transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                      blocked
                        ? "border-white/10 text-white/15 cursor-not-allowed"
                        : saving
                        ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                        : `${s.color} border-current/20 active:opacity-70`
                    }`}>
                    {blocked ? <Icon name="Lock" size={11} /> : <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telegram уведомление */}
          <div className="border border-[#229ED9]/20 bg-[#229ED9]/5 p-3 rounded-sm">
            <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Icon name="Send" size={10} className="text-[#229ED9]" /> Telegram клиенту
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <button key={key} type="button" onClick={() => handleSend(key)}
                  disabled={sentKey === key}
                  className={`font-roboto text-xs py-2 px-2 border transition-colors flex items-center justify-center gap-1.5 min-h-[40px] ${
                    sentKey === key
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-[#229ED9]/20 text-[#229ED9]/70 active:bg-[#229ED9]/10"
                  }`}>
                  <Icon name={sentKey === key ? "Check" : "Send"} size={10} />
                  {label}
                </button>
              ))}
            </div>
            {notifyError && <div className="mt-1.5 font-roboto text-xs text-orange-400">{notifyError}</div>}
            {sentKey && !notifyError && <div className="mt-1.5 font-roboto text-xs text-green-400/70">✓ Отправлено</div>}
          </div>

          {/* SMS */}
          <div className="border border-green-500/20 bg-green-500/5 p-3 rounded-sm">
            <div className="font-roboto text-white/30 text-[10px] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Icon name="MessageSquare" size={10} className="text-green-400" /> SMS на {o.phone || "—"}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <button key={key} type="button" onClick={() => handleSendSms(key)}
                  disabled={smsSentKey === key}
                  className={`font-roboto text-xs py-2 px-2 border transition-colors flex items-center justify-center gap-1.5 min-h-[40px] ${
                    smsSentKey === key
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-green-500/20 text-green-400/70 active:bg-green-500/10"
                  }`}>
                  <Icon name={smsSentKey === key ? "Check" : "MessageSquare"} size={10} />
                  {label}
                </button>
              ))}
            </div>
            {smsError && <div className="mt-1.5 font-roboto text-xs text-orange-400">{smsError}</div>}
            {smsSentKey && !smsError && <div className="mt-1.5 font-roboto text-xs text-green-400/70">✓ SMS отправлено</div>}
          </div>

          {/* Печать + удаление */}
          <div className="flex gap-2">
            <button onClick={handleSendAct} disabled={actSending}
              className={`flex-1 font-roboto text-xs py-2.5 border transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${actSent ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-[#229ED9]/30 text-[#229ED9]/70 active:bg-[#229ED9]/10"}`}>
              <Icon name={actSent ? "Check" : actSending ? "Loader2" : "Send"} size={14} className={actSending ? "animate-spin" : ""} />
              {actSent ? "Отправлен!" : "Акт в TG"}
            </button>
            <button onClick={() => printActHTML(o)}
              className="flex-1 font-roboto text-xs py-2.5 border border-[#FFD700]/40 text-[#FFD700] active:bg-[#FFD700]/10 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]">
              <Icon name="FileText" size={14} /> Акт
            </button>
            <button onClick={() => printAct(o)}
              className="flex-1 font-roboto text-xs py-2.5 border border-[#FFD700]/20 text-[#FFD700]/60 active:bg-[#FFD700]/10 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]">
              <Icon name="Download" size={14} /> .docx
            </button>
            <button onClick={() => printReceipt(o)}
              className="flex-1 font-roboto text-xs py-2.5 border border-white/10 text-white/40 active:bg-white/5 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]">
              <Icon name="Printer" size={14} /> Чек
            </button>
            {isOwner && (
              <button onClick={() => onDelete(o.id)}
                className="font-roboto text-xs py-2.5 px-4 border border-red-500/20 text-red-400 active:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]">
                <Icon name="Trash2" size={14} />
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}