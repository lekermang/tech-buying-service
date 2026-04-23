import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, INP, LBL, fmt, printReceipt, printAct, printActHTML } from "./types";
import { formatPhone } from "@/lib/phoneFormat";

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
  onIssueOrder: (o: Order, issuedAt?: string) => void;
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
    <div className={`border transition-all duration-300 rounded-lg overflow-hidden ${
      isExpanded
        ? "bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/5"
        : "bg-[#141414] border-[#1F1F1F] hover:border-[#2A2A2A]"
    }`}>

      {/* ── Шапка карточки ── */}
      <div className="p-3 active:bg-white/5 transition-colors cursor-pointer select-none relative" onClick={onToggle}>
        {/* Акцент-полоска слева по статусу */}
        <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${st.dot}`} />

        {/* Строка 1: номер + статус + имя */}
        <div className="flex items-start justify-between gap-2 pl-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
            <span className="font-oswald font-bold text-[#FFD700] text-base shrink-0 tabular-nums">#{o.id}</span>
            <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 shrink-0 rounded-full ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
            </span>
            <span className="font-roboto text-sm text-white font-semibold truncate">{o.name}</span>
          </div>
          <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} className={`shrink-0 mt-0.5 transition-all ${isExpanded ? "text-[#FFD700]" : "text-white/30"}`} />
        </div>

        {/* Строка 2: телефон + устройство */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap pl-1.5">
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

        {/* Строка 3: цены + аванс + оплата */}
        <div className="flex items-center gap-3 mt-1 flex-wrap pl-1.5">
          {o.price && <span className="text-[#FFD700] font-roboto text-xs font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
          {o.repair_amount != null && <span className="text-green-400 font-roboto text-xs">✓ {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
          {o.master_income != null && <span className="text-green-300/70 font-roboto text-[10px]">мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
          {o.is_paid && o.payment_method && (
            <span className="font-roboto text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30">
              {o.payment_method === "cash" ? "💵 Нал" : o.payment_method === "card" ? "💳 Карта" : "📲 Перевод"}
            </span>
          )}
          {!o.is_paid && o.advance != null && o.advance > 0 && (
            <span className="font-roboto text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">
              💵 {o.advance.toLocaleString("ru-RU")} ₽
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-0.5 flex-wrap pl-1.5">
          <span className="text-white/20 font-roboto text-[9px]">📥 {fmt(o.created_at)}</span>
          {o.picked_up_at && <span className="text-green-400/50 font-roboto text-[9px]">📤 {fmt(o.picked_up_at)}</span>}
          {o.completed_at && !o.picked_up_at && <span className="text-yellow-400/40 font-roboto text-[9px]">✅ {fmt(o.completed_at)}</span>}
        </div>
      </div>

      {/* ── Раскрытая часть ── */}
      {isExpanded && (
        <div className="border-t border-[#FFD700]/15 p-3 space-y-3 bg-gradient-to-b from-transparent to-black/20">

          {/* Комментарий клиента */}
          {o.comment && (
            <div className="relative px-3 py-2.5 bg-[#FFD700]/5 border-l-2 border-[#FFD700]/40 rounded-r-md">
              <div className="absolute top-1 right-2 text-[9px] font-roboto text-[#FFD700]/40 uppercase tracking-wide">Комментарий клиента</div>
              <div className="text-xs font-roboto text-white/70 italic mt-3 leading-relaxed">"{o.comment}"</div>
            </div>
          )}

          {/* Финансы — премиум блок */}
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 space-y-2.5">
            <div className="font-oswald font-bold text-[#FFD700]/70 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Icon name="Wallet" size={11} />
              Финансы заказа
            </div>

            <div>
              <label className={LBL + " text-orange-400/80 flex items-center gap-1"}>
                <Icon name="ShoppingBag" size={10} />Купленная запчасть
              </label>
              <input value={ef.parts_name}
                onChange={e => onEditFormChange(o.id, { ...ef, parts_name: e.target.value })}
                placeholder="Дисплей iPhone 14..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LBL + " text-orange-400/80 flex items-center gap-1"}>
                  <Icon name="ArrowDownCircle" size={10} />Закупка ₽
                </label>
                <input type="number" inputMode="numeric" value={ef.purchase_amount}
                  onChange={e => onEditFormChange(o.id, { ...ef, purchase_amount: e.target.value })}
                  placeholder="0"
                  className="w-full bg-[#0A0A0A] border border-orange-500/20 text-orange-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-orange-500/60 tabular-nums transition-colors" />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer active:opacity-70"
                  onClick={() => onEditFormChange(o.id, { ...ef, purchase_amount: "0" })}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${ef.purchase_amount === "0" ? "bg-[#FFD700] border-[#FFD700] shadow-md shadow-[#FFD700]/30" : "border-white/30"}`}>
                    {ef.purchase_amount === "0" && <Icon name="Check" size={10} className="text-black" />}
                  </div>
                  <span className="font-roboto text-[10px] text-white/40">Без закупки</span>
                </label>
              </div>
              <div>
                <label className={LBL + " text-green-400/80 flex items-center gap-1"}>
                  <Icon name="ArrowUpCircle" size={10} />Выдано за ремонт ₽
                </label>
                <input type="number" inputMode="numeric" value={ef.repair_amount}
                  onChange={e => onEditFormChange(o.id, { ...ef, repair_amount: e.target.value })}
                  placeholder="1500"
                  className="w-full bg-[#0A0A0A] border border-green-500/20 text-green-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-green-500/60 tabular-nums transition-colors" />
              </div>
            </div>

            {ef.repair_amount && ef.purchase_amount && (() => {
              const profit = parseInt(ef.repair_amount) - parseInt(ef.purchase_amount);
              const master = Math.max(0, Math.round(profit * 0.5));
              const clean = profit - master;
              return (
                <div className="bg-gradient-to-r from-[#FFD700]/10 via-green-500/5 to-transparent border border-[#FFD700]/20 rounded-md px-3 py-2.5 animate-in fade-in duration-300">
                  <div className="font-roboto text-[9px] text-white/40 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Icon name="Calculator" size={10} className="text-[#FFD700]/60" />
                    Расчёт прибыли
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="font-roboto text-[9px] text-white/40">Прибыль</div>
                      <div className={`font-oswald font-bold text-sm tabular-nums ${profit >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                        {profit.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <div>
                      <div className="font-roboto text-[9px] text-blue-400/70">Мастер 50%</div>
                      <div className="font-oswald font-bold text-sm text-blue-400 tabular-nums">
                        {master.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                    <div>
                      <div className="font-roboto text-[9px] text-green-400/70">Чистая</div>
                      <div className={`font-oswald font-bold text-sm tabular-nums ${clean >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {clean.toLocaleString("ru-RU")} ₽
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Аванс + Способ оплаты */}
            <div className="pt-2.5 border-t border-[#1F1F1F] space-y-2">
              <div>
                <label className={LBL + " text-blue-400/80 flex items-center gap-1"}>
                  <Icon name="Coins" size={10} />Аванс ₽
                </label>
                <input type="number" inputMode="numeric" value={ef.advance}
                  onChange={e => onEditFormChange(o.id, { ...ef, advance: e.target.value })}
                  placeholder="0"
                  className="w-full bg-[#0A0A0A] border border-blue-500/20 text-blue-300 px-3 py-2 font-roboto text-sm font-bold rounded-md focus:outline-none focus:border-blue-500/60 tabular-nums transition-colors" />
                {ef.advance && parseInt(ef.advance) > 0 && ef.repair_amount && (
                  <div className="text-[10px] font-roboto text-blue-400/80 mt-1 flex items-center gap-1 bg-blue-500/5 border border-blue-500/15 rounded px-2 py-1">
                    <Icon name="Info" size={10} />
                    Остаток к доплате: <span className="font-bold tabular-nums">{(parseInt(ef.repair_amount) - parseInt(ef.advance)).toLocaleString("ru-RU")} ₽</span>
                  </div>
                )}
              </div>
              <div>
                <label className={LBL + " flex items-center gap-1"}>
                  <Icon name="CreditCard" size={10} />Способ оплаты
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[
                    { v: "",        label: "Нет",     emoji: "—",  color: "bg-white/5" },
                    { v: "cash",    label: "Нал",     emoji: "💵", color: "bg-green-500/10" },
                    { v: "card",    label: "Карта",   emoji: "💳", color: "bg-blue-500/10" },
                    { v: "transfer",label: "Перевод", emoji: "📲", color: "bg-purple-500/10" },
                  ].map(opt => {
                    const active = ef.payment_method === opt.v;
                    return (
                      <button key={opt.v} type="button"
                        onClick={() => onEditFormChange(o.id, { ...ef, payment_method: opt.v, is_paid: opt.v !== "" })}
                        className={`font-roboto text-[11px] py-2 rounded-md transition-all active:scale-95 flex flex-col items-center gap-0.5 ${
                          active
                            ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-md shadow-[#FFD700]/20"
                            : `${opt.color} border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]`
                        }`}>
                        <span className="text-sm leading-none">{opt.emoji}</span>
                        <span className="leading-none text-[10px]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                {ef.is_paid && ef.payment_method && (
                  <div className="text-[10px] font-roboto text-green-400 mt-1.5 flex items-center gap-1 bg-green-500/5 border border-green-500/15 rounded px-2 py-1">
                    <Icon name="CheckCircle2" size={10} />
                    Оплачено: {ef.payment_method === "cash" ? "наличными" : ef.payment_method === "card" ? "картой" : "переводом"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Поля заявки — премиум блок */}
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-3 space-y-2.5">
            <div className="font-oswald font-bold text-white/50 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Icon name="FileEdit" size={11} />
              Данные заявки
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "name", label: "Имя", ph: "Иван", icon: "User", value: ef.name, set: (v: string) => onEditFormChange(o.id, { ...ef, name: v }) },
                { key: "phone", label: "Телефон", ph: "+7...", icon: "Phone", type: "tel", value: ef.phone, set: (v: string) => onEditFormChange(o.id, { ...ef, phone: formatPhone(v) }) },
                { key: "model", label: "Модель", ph: "iPhone 14", icon: "Smartphone", value: ef.model, set: (v: string) => onEditFormChange(o.id, { ...ef, model: v }) },
                { key: "repair_type", label: "Тип ремонта", ph: "Дисплей", icon: "Wrench", value: ef.repair_type, set: (v: string) => onEditFormChange(o.id, { ...ef, repair_type: v }) },
              ].map(f => (
                <div key={f.key}>
                  <label className={LBL + " flex items-center gap-1"}>
                    <Icon name={f.icon} size={9} className="opacity-50" />{f.label}
                  </label>
                  <input type={f.type || "text"} value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.ph}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 transition-colors" />
                </div>
              ))}
            </div>
            <div>
              <label className={LBL + " flex items-center gap-1"}>
                <Icon name="StickyNote" size={9} className="opacity-50" />Заметка
              </label>
              <textarea value={ef.admin_note}
                onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
                rows={2} placeholder="Внутренняя заметка..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 font-roboto text-xs rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/20 resize-none transition-colors" />
            </div>
          </div>

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 flex items-center gap-1.5 text-red-400 font-roboto text-xs">
              <Icon name="AlertCircle" size={12} />{saveError}
            </div>
          )}

          {/* Кнопка сохранить */}
          <button onClick={() => onSaveCard(o)} disabled={saving}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            <Icon name={saving ? "Loader" : "Save"} size={15} className={saving ? "animate-spin" : ""} />
            {saving ? "Сохраняю..." : "Сохранить изменения"}
          </button>

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

        </div>
      )}
    </div>
  );
}