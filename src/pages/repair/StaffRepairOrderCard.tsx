import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, INP, LBL, fmt, printReceipt, printAct } from "./types";
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

  return (
    <div className={`bg-[#1A1A1A] border transition-colors ${isExpanded ? "border-[#FFD700]/40" : "border-[#2A2A2A]"}`}>
      {/* Шапка карточки — клик раскрывает */}
      <div className="p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-oswald font-bold text-[#FFD700] text-sm shrink-0">#{o.id}</span>
            <span className={`font-roboto text-[10px] px-1.5 py-0.5 flex items-center gap-1 shrink-0 ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
            </span>
            <span className="font-roboto text-sm text-white font-medium truncate">{o.name}</span>
            <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()}
              className="font-roboto text-xs text-[#FFD700] hover:underline shrink-0">{o.phone}</a>
            {o.phone && (
              <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Telegram бот @Skypkaklgbot"
                className="text-[#229ED9] hover:text-[#1a8cc2] transition-colors flex items-center">
                <Icon name="Send" size={13} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="font-roboto text-[9px] text-white/25 hidden sm:inline">{fmt(o.created_at)}</span>
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={13} className="text-white/25" />
          </div>
        </div>

        {/* Краткая инфо */}
        <div className="flex gap-2 mt-1 flex-wrap text-[10px] font-roboto">
          {o.model && <span className="text-white/40">📱 {o.model}</span>}
          {o.repair_type && <span className="text-white/40">🔧 {o.repair_type}</span>}
          {o.price && <span className="text-[#FFD700]/70 font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
          {o.repair_amount != null && <span className="text-green-400">▸ выдано {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
          {o.master_income != null && <span className="text-green-300">мастеру {o.master_income.toLocaleString("ru-RU")} ₽</span>}
        </div>
      </div>

      {/* Раскрытая часть */}
      {isExpanded && (
        <div className="border-t border-[#2A2A2A] p-3 space-y-3">
          {o.comment && (
            <div className="p-2 bg-white/5 border border-white/8 text-[10px] font-roboto text-white/55 italic">"{o.comment}"</div>
          )}

          {/* Блок запчасть + суммы */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={LBL + " text-orange-400/80"}>🛒 Купленная запчасть</label>
              <input value={ef.parts_name}
                onChange={e => onEditFormChange(o.id, { ...ef, parts_name: e.target.value })}
                placeholder="Дисплей iPhone 14..." className={INP} />
            </div>
            <div>
              <label className={LBL + " text-orange-400/80"}>💸 Закупка (₽)</label>
              <input type="number" value={ef.purchase_amount}
                onChange={e => onEditFormChange(o.id, { ...ef, purchase_amount: e.target.value })}
                placeholder="500" className={INP} />
            </div>
            <div>
              <label className={LBL + " text-green-400/80"}>💰 Выдано за ремонт (₽)</label>
              <input type="number" value={ef.repair_amount}
                onChange={e => onEditFormChange(o.id, { ...ef, repair_amount: e.target.value })}
                placeholder="1500" className={INP} />
            </div>
          </div>

          {/* Расчёт дохода мастера */}
          {ef.repair_amount && ef.purchase_amount && (
            <div className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 flex gap-4 text-xs font-roboto">
              <span className="text-white/40">Прибыль:
                <span className={`font-bold ml-1 ${parseInt(ef.repair_amount) - parseInt(ef.purchase_amount) >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>
                  {(parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)).toLocaleString("ru-RU")} ₽
                </span>
              </span>
              <span className="text-white/40">Доход мастера:
                <span className="text-green-400 font-bold ml-1">
                  {Math.max(0, Math.round((parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
                </span>
              </span>
            </div>
          )}

          {/* Заметка + поля заявки */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL}>Имя</label>
              <input value={ef.name} onChange={e => onEditFormChange(o.id, { ...ef, name: e.target.value })} className={INP} placeholder="Иван" />
            </div>
            <div>
              <label className={LBL}>Телефон</label>
              <input value={ef.phone} onChange={e => onEditFormChange(o.id, { ...ef, phone: formatPhone(e.target.value) })} className={INP} placeholder="+7 (___) ___-__-__" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={LBL}>Модель</label>
              <input value={ef.model} onChange={e => onEditFormChange(o.id, { ...ef, model: e.target.value })} className={INP} placeholder="iPhone 14" />
            </div>
            <div>
              <label className={LBL}>Тип ремонта</label>
              <input value={ef.repair_type} onChange={e => onEditFormChange(o.id, { ...ef, repair_type: e.target.value })} className={INP} placeholder="Замена дисплея" />
            </div>
          </div>
          <div>
            <label className={LBL}>Заметка</label>
            <textarea value={ef.admin_note}
              onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
              rows={2} placeholder="Внутренняя заметка..."
              className={INP + " resize-none"} />
          </div>

          {saveError && <div className="text-red-400 font-roboto text-[10px]">{saveError}</div>}

          {/* Telegram — статус клиенту через @Skypkaklgbot */}
          <div className="border border-[#229ED9]/15 bg-[#229ED9]/5 p-2.5">
            <div className="font-roboto text-white/30 text-[9px] uppercase tracking-wide mb-2 flex items-center gap-1">
              <Icon name="Send" size={9} className="text-[#229ED9]" /> Статус клиенту — бот @Skypkaklgbot
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <button key={key} type="button" onClick={() => handleSend(key)}
                  disabled={sentKey === key}
                  className={`font-roboto text-[9px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${
                    sentKey === key
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-[#229ED9]/20 text-[#229ED9]/70 hover:bg-[#229ED9]/10 hover:text-[#229ED9]"
                  }`}>
                  <Icon name={sentKey === key ? "Check" : "Send"} size={9} />
                  {label}
                </button>
              ))}
            </div>
            {sentKey && !notifyError && (
              <div className="mt-1.5 font-roboto text-[9px] text-green-400/70 flex items-center gap-1">
                <Icon name="CheckCircle" size={9} /> Сообщение отправлено клиенту в Telegram
              </div>
            )}
            {notifyError && (
              <div className="mt-1.5 font-roboto text-[9px] text-orange-400 flex items-center gap-1">
                <Icon name="AlertCircle" size={9} /> {notifyError}
              </div>
            )}
          </div>

          {/* Кнопки статусов */}
          {(() => {
            const hasAmount = !!ef.repair_amount && ef.repair_amount !== "0";
            const hasPurchase = !!ef.purchase_amount && ef.purchase_amount !== "0";
            const financeBlocked = !hasAmount || !hasPurchase;
            return (
              <div className="space-y-1.5">
                <div className="flex gap-1.5 flex-wrap">
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
                        title={blocked ? "Введите закупку и сумму выдачи" : undefined}
                        className={`font-roboto text-[10px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${
                          blocked
                            ? "border-white/10 text-white/15 cursor-not-allowed"
                            : saving
                            ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                            : `${s.color} border-current/20 hover:opacity-80`
                        }`}>
                        {blocked ? <Icon name="Lock" size={9} /> : <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                        {s.label}
                      </button>
                    );
                  })}
                  <button onClick={() => onSaveCard(o)} disabled={saving}
                    className="ml-auto font-roboto text-[10px] px-3 py-1.5 bg-[#FFD700] text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1">
                    <Icon name="Save" size={11} />{saving ? "Сохраняю..." : "Сохранить"}
                  </button>
                  <button onClick={() => printAct(o)}
                    title="Акт приёмки"
                    className="font-roboto text-[10px] px-2.5 py-1.5 border border-[#FFD700]/20 text-[#FFD700]/50 hover:text-[#FFD700] hover:border-[#FFD700]/40 transition-colors flex items-center gap-1">
                    <Icon name="FileText" size={11} />
                    <span>Акт</span>
                  </button>
                  <button onClick={() => { printReceipt(o); }}
                    title="Чек / квитанция"
                    className="font-roboto text-[10px] px-2.5 py-1.5 border border-white/10 text-white/40 hover:text-white transition-colors flex items-center gap-1">
                    <Icon name="Printer" size={11} />
                  </button>
                  {isOwner && (
                    <button onClick={() => onDelete(o.id)}
                      className="font-roboto text-[10px] px-2.5 py-1.5 border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
                {financeBlocked && (
                  <div className="font-roboto text-[9px] text-white/25 flex items-center gap-1">
                    <Icon name="Lock" size={9} /> «Готово» и «Выдано» — введите закупку и сумму выдачи
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}