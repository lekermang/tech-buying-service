import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, EditForm, STATUSES, statusInfo, fmt, inp, lbl } from "./repairTypes";

const STATUS_LABEL: Record<string, string> = {
  in_progress:   "В работе",
  waiting_parts: "Ждём запчасть",
  ready:         "Готово ✓",
  done:          "Выдано",
  cancelled:     "Отменено",
};

const REPAIR_ORDER_URL = "https://functions.poehali.dev/8d0ee3bd-41eb-44fe-9d30-aab6ddc2042d";

type Props = {
  o: Order;
  isExpanded: boolean;
  ef: EditForm;
  saving: boolean;
  saveError: string | null;
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
  onToggle: () => void;
  onEditFormChange: (id: number, ef: EditForm) => void;
  onUpdateStatus: (id: number, status: string, ef: EditForm) => void;
  onOpenReadyModal: (o: Order) => void;
  onSaveEdit: (o: Order) => void;
  onDelete: (id: number) => void;
};

export default function RepairOrderCard({
  o, isExpanded, ef, saving, saveError, token, authHeader,
  onToggle, onEditFormChange, onUpdateStatus, onOpenReadyModal, onSaveEdit, onDelete,
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
      {/* Шапка карточки */}
      <div className="p-3 cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
            <span className={`font-roboto text-[10px] px-2 py-0.5 flex items-center gap-1 ${st.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
            </span>
            <span className="font-oswald font-bold text-white text-sm">{o.name}</span>
            <a href={`tel:${o.phone}`} onClick={e => e.stopPropagation()} className="text-[#FFD700] hover:text-yellow-400 text-xs font-roboto">{o.phone}</a>
            {o.phone && (
              <a href={`https://t.me/Skypkaklgbot`} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title="Открыть бота Telegram"
                className="text-[#229ED9] hover:text-[#1a8cc2] transition-colors flex items-center gap-0.5">
                <Icon name="Send" size={13} />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-roboto text-[10px] text-white/30 hidden sm:inline">{fmt(o.created_at)}</span>
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={14} className="text-white/30" />
          </div>
        </div>

        <div className="flex gap-3 mt-1.5 flex-wrap text-xs font-roboto">
          {o.model && <span className="text-white/40">📱 {o.model}</span>}
          {o.repair_type && <span className="text-white/40">🔧 {o.repair_type}</span>}
          {o.price && <span className="text-[#FFD700]/80 font-bold">{o.price.toLocaleString("ru-RU")} ₽</span>}
          {o.repair_amount && <span className="text-green-400 text-[10px]">Выдано: {o.repair_amount.toLocaleString("ru-RU")} ₽</span>}
          {o.master_income && <span className="text-green-300 text-[10px]">Мастер: {o.master_income.toLocaleString("ru-RU")} ₽</span>}
        </div>
      </div>

      {/* Раскрытая часть */}
      {isExpanded && (
        <div className="border-t border-[#2A2A2A] p-3 space-y-3">
          {o.comment && (
            <div className="p-2 bg-white/5 border border-white/10 text-xs font-roboto text-white/60 italic">"{o.comment}"</div>
          )}

          {/* Поля закупки и выдачи */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={lbl + " text-orange-400/80"}>🛒 Купленная запчасть</label>
              <input value={ef.parts_name} onChange={e => onEditFormChange(o.id, { ...ef, parts_name: e.target.value })}
                placeholder="Дисплей iPhone 14, аккумулятор..." className={inp} />
            </div>
            <div>
              <label className={lbl + " text-orange-400/80"}>💸 Закупка (₽)</label>
              <input type="number" value={ef.purchase_amount} onChange={e => onEditFormChange(o.id, { ...ef, purchase_amount: e.target.value })}
                placeholder="500" className={inp} />
            </div>
            <div>
              <label className={lbl + " text-green-400/80"}>💰 Выдано за ремонт (₽)</label>
              <input type="number" value={ef.repair_amount} onChange={e => onEditFormChange(o.id, { ...ef, repair_amount: e.target.value })}
                placeholder="1500" className={inp} />
            </div>
          </div>

          {/* Расчёт дохода мастера */}
          {ef.repair_amount && ef.purchase_amount && (
            <div className="bg-green-500/10 border border-green-500/20 p-2 font-roboto text-xs">
              <span className="text-green-400/70">Доход мастера (50% от прибыли): </span>
              <span className="text-green-400 font-bold">
                {Math.max(0, Math.round((parseInt(ef.repair_amount) - parseInt(ef.purchase_amount)) * 0.5)).toLocaleString("ru-RU")} ₽
              </span>
            </div>
          )}

          {/* Заметка */}
          <div>
            <label className={lbl}>Заметка</label>
            <textarea value={ef.admin_note} onChange={e => onEditFormChange(o.id, { ...ef, admin_note: e.target.value })}
              rows={2} placeholder="Внутренняя заметка..."
              className={inp + " resize-none"} />
          </div>

          {saveError && <div className="text-red-400 font-roboto text-xs">{saveError}</div>}

          {/* Telegram — статус клиенту через @Skypkaklgbot */}
          <div className="border border-[#229ED9]/15 bg-[#229ED9]/5 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="font-roboto text-white/30 text-[9px] uppercase tracking-wide flex items-center gap-1">
                <Icon name="Send" size={9} className="text-[#229ED9]" /> Статус клиенту — бот @Skypkaklgbot
              </div>
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

          {/* Кнопки управления статусом */}
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
                          else onUpdateStatus(o.id, s.key, ef);
                        }}
                        disabled={saving || blocked}
                        title={blocked ? "Введите закупку и сумму выдачи" : undefined}
                        className={`font-roboto text-[10px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${
                          blocked
                            ? "border-white/10 text-white/15 cursor-not-allowed"
                            : saving
                            ? "opacity-50 cursor-not-allowed border-white/10 text-white/30"
                            : `${s.color} border-current/30 hover:opacity-80`
                        }`}>
                        {blocked ? <Icon name="Lock" size={9} /> : <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
                        {s.label}
                      </button>
                    );
                  })}
                  <button onClick={() => onSaveEdit(o)} disabled={saving}
                    className="ml-auto font-roboto text-[10px] px-3 py-1.5 bg-[#FFD700] text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1">
                    <Icon name="Save" size={11} />{saving ? "Сохраняю..." : "Сохранить"}
                  </button>
                  <button onClick={() => onDelete(o.id)} className="font-roboto text-[10px] px-2.5 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1">
                    <Icon name="Trash2" size={11} />
                  </button>
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