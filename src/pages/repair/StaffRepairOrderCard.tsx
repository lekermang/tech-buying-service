import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Order, STATUSES, INP, LBL, fmt, printReceipt } from "./types";
import { formatPhone } from "@/lib/phoneFormat";

const STATUS_LABEL: Record<string, string> = {
  in_progress:   "В работе",
  waiting_parts: "Ждём запчасть",
  ready:         "Готово ✓",
  done:          "Выдано",
  cancelled:     "Отменено",
};

const AD_FOOTER = "\n\n📲 Присоединяйтесь к нам: https://t.me/ProService40";

const STATUS_MSG: Record<string, string> = {
  in_progress:   "В работе 🔧 Ваш телефон принят и сейчас в ремонте. Сообщим, как только будет готово.",
  waiting_parts: "Ждём запчасть ⏳ Запчасть заказана, ожидаем поставку. Сразу приступим к ремонту.",
  ready:         "Готово ✓ 🎉 Ваш телефон готов! Можно забирать в любое время.",
  done:          "Выдано 👍 Спасибо за обращение! Рады видеть вас снова.",
  cancelled:     "Отменено ❌ К сожалению, ремонт отменён. Свяжитесь с нами для уточнения деталей.",
};

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
  o, isExpanded, ef, saving, saveError, isOwner,
  onToggle, onEditFormChange, onChangeStatus, onOpenReadyModal, onIssueOrder, onSaveCard, onDelete,
}: Props) {
  const st = statusInfo(o.status);
  const [sentKey, setSentKey] = useState<string | null>(null);

  const handleSend = (key: string, msg: string) => {
    const amount = o.repair_amount ? `\nСтоимость: ${Number(o.repair_amount).toLocaleString("ru-RU")} ₽` : "";
    const fullMsg = `Скупка24, ремонт #${o.id}:\n${msg}${amount}${AD_FOOTER}`;
    window.open(`https://t.me/Skypkaklgbot?text=${encodeURIComponent(fullMsg)}`, "_blank");
    setSentKey(key);
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
            <div className="flex items-center justify-between mb-2">
              <div className="font-roboto text-white/30 text-[9px] uppercase tracking-wide flex items-center gap-1">
                <Icon name="Send" size={9} className="text-[#229ED9]" /> Статус клиенту — Telegram
              </div>
              <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
                className="font-roboto text-[9px] text-[#229ED9] hover:text-[#1a8cc2] border border-[#229ED9]/30 px-1.5 py-0.5 transition-colors">
                @Skypkaklgbot →
              </a>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(STATUS_MSG).map(([key, msg]) => (
                <button key={key} type="button" onClick={() => handleSend(key, msg)}
                  className={`font-roboto text-[9px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${
                    sentKey === key
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-[#229ED9]/20 text-[#229ED9]/70 hover:bg-[#229ED9]/10 hover:text-[#229ED9]"
                  }`}>
                  <Icon name={sentKey === key ? "Check" : "Send"} size={9} />
                  {STATUS_LABEL[key] || key}
                </button>
              ))}
            </div>
            {sentKey && (
              <div className="mt-1.5 font-roboto text-[9px] text-green-400/70 flex items-center gap-1">
                <Icon name="CheckCircle" size={9} /> Telegram открыт — нажмите «Отправить» боту
              </div>
            )}
          </div>

          {/* Кнопки статусов */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.filter(s => s.key !== o.status).map(s => (
              <button key={s.key}
                onClick={() => {
                  if (s.key === "ready") { onOpenReadyModal(o); }
                  else if (s.key === "done") { onIssueOrder(o); }
                  else { onChangeStatus(o.id, s.key, { admin_note: ef.admin_note }); }
                }}
                disabled={saving}
                className={`font-roboto text-[10px] px-2.5 py-1.5 border transition-colors flex items-center gap-1 ${s.color} border-current/20 hover:opacity-80 disabled:opacity-40`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
              </button>
            ))}
            <button onClick={() => onSaveCard(o)} disabled={saving}
              className="ml-auto font-roboto text-[10px] px-3 py-1.5 bg-[#FFD700] text-black font-bold hover:bg-yellow-400 transition-colors disabled:opacity-40 flex items-center gap-1">
              <Icon name="Save" size={11} />{saving ? "Сохраняю..." : "Сохранить"}
            </button>
            <button onClick={() => { printReceipt(o); }}
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
        </div>
      )}
    </div>
  );
}