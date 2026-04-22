import { useState } from "react";
import Icon from "@/components/ui/icon";
import { INP, STATUS_COLOR, OrderStatus } from "./types";

type Props = {
  statusId: string;
  setStatusId: (v: string) => void;
  statusLoading: boolean;
  statusError: string;
  statusResult: OrderStatus | null;
  onCheck: () => void;
  onCheckByPhone: (phone: string) => void;
  phoneResults: OrderStatus[];
  phoneLoading: boolean;
  phoneError: string;
};

const STATUS_ICON: Record<string, string> = {
  new: "ClipboardList",
  accepted: "ClipboardCheck",
  in_progress: "Wrench",
  waiting_parts: "Package",
  ready: "CheckCircle",
  done: "PackageCheck",
  warranty: "ShieldCheck",
  cancelled: "XCircle",
};

const STATUS_DESC: Record<string, string> = {
  new: "Заявка зарегистрирована, ожидает приёмки мастером",
  accepted: "Мастер принял устройство и приступает к диагностике",
  in_progress: "Мастер работает над вашим устройством",
  waiting_parts: "Ожидаем поступления необходимых запчастей",
  ready: "Ремонт завершён — устройство готово к выдаче!",
  done: "Устройство выдано владельцу",
  warranty: "Устройство находится на гарантийном обслуживании",
  cancelled: "Заявка отменена",
};

function OrderCard({ o }: { o: OrderStatus }) {
  const iconName = STATUS_ICON[o.status] || "HelpCircle";
  const color = STATUS_COLOR[o.status] || "text-white";
  const desc = STATUS_DESC[o.status] || "";

  return (
    <div className="border border-white/10 bg-black/30 p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-roboto text-white/30 text-[10px]">Заявка</span>
          <span className="font-oswald font-bold text-[#FFD700] text-sm">#{o.id}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 border ${color.replace("text-", "border-").replace("/", "/")} bg-white/5`}>
          <Icon name={iconName as Parameters<typeof Icon>[0]["name"]} size={12} className={color} />
          <span className={`font-oswald font-bold text-xs ${color}`}>{o.status_label}</span>
        </div>
      </div>

      {(o.model || o.repair_type) && (
        <div className="font-roboto text-white/60 text-xs mb-1.5">
          {o.model && <span className="mr-2">📱 {o.model}</span>}
          {o.repair_type && <span className="text-white/40">🔧 {o.repair_type}</span>}
        </div>
      )}

      {desc && (
        <div className="font-roboto text-white/40 text-[10px] border-t border-white/5 pt-2 mt-1">
          {desc}
        </div>
      )}

      {o.admin_note && (
        <div className="mt-2 font-roboto text-white/60 text-xs bg-[#FFD700]/5 border border-[#FFD700]/20 px-2.5 py-2">
          <span className="text-[#FFD700]/60 text-[9px] font-oswald uppercase tracking-wide block mb-0.5">Комментарий мастера</span>
          {o.admin_note}
        </div>
      )}
    </div>
  );
}

export default function RepairStatusTab({
  statusId, setStatusId, statusLoading, statusError, statusResult, onCheck,
  onCheckByPhone, phoneResults, phoneLoading, phoneError,
}: Props) {
  const [mode, setMode] = useState<"id" | "phone">("id");
  const [phoneInput, setPhoneInput] = useState("");

  return (
    <div>
      {/* Подсказка сверху */}
      <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-2.5 mb-3">
        <div className="flex items-start gap-2">
          <Icon name="Info" size={14} className="text-[#FFD700]/70 mt-0.5 shrink-0" />
          <p className="font-roboto text-white/50 text-[10px] leading-relaxed">
            Введите номер заявки (выдаётся при сдаче телефона) или найдите по номеру телефона.
            Не знаете номер? Напишите боту — он подскажет.
          </p>
        </div>
      </div>

      {/* Переключатель режима */}
      <div className="flex gap-1 mb-3">
        <button onClick={() => setMode("id")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-roboto text-[10px] border transition-colors ${
            mode === "id" ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5" : "border-white/10 text-white/30 hover:text-white"
          }`}>
          <Icon name="Hash" size={11} /> По номеру заявки
        </button>
        <button onClick={() => setMode("phone")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-roboto text-[10px] border transition-colors ${
            mode === "phone" ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/5" : "border-white/10 text-white/30 hover:text-white"
          }`}>
          <Icon name="Phone" size={11} /> По номеру телефона
        </button>
      </div>

      {/* Поиск по номеру заявки */}
      {mode === "id" && (
        <div>
          <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">Номер заявки</div>
          <div className="flex gap-1.5 mb-2">
            <input type="text" value={statusId} onChange={e => setStatusId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onCheck()}
              placeholder="Например: 42" className={INP} />
            <button onClick={onCheck} disabled={statusLoading || !statusId.trim()}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5">
              {statusLoading
                ? <><Icon name="Loader2" size={12} className="animate-spin" /> Ищу...</>
                : <><Icon name="Search" size={12} /> Найти</>}
            </button>
          </div>
          {statusError && (
            <div className="text-red-400 font-roboto text-[10px] flex items-center gap-1 mb-2">
              <Icon name="AlertCircle" size={11} /> {statusError}
            </div>
          )}
          {statusResult && <OrderCard o={statusResult} />}
        </div>
      )}

      {/* Поиск по номеру телефона */}
      {mode === "phone" && (
        <div>
          <div className="font-roboto text-white/40 text-[10px] mb-1.5 uppercase tracking-wide">Номер телефона</div>
          <div className="flex gap-1.5 mb-2">
            <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onCheckByPhone(phoneInput)}
              placeholder="+7 (___) ___-__-__" className={INP} />
            <button onClick={() => onCheckByPhone(phoneInput)} disabled={phoneLoading || !phoneInput.trim()}
              className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5">
              {phoneLoading
                ? <><Icon name="Loader2" size={12} className="animate-spin" /> Ищу...</>
                : <><Icon name="Search" size={12} /> Найти</>}
            </button>
          </div>
          {phoneError && (
            <div className="text-red-400 font-roboto text-[10px] flex items-center gap-1 mb-2">
              <Icon name="AlertCircle" size={11} /> {phoneError}
            </div>
          )}
          {phoneResults.length > 0 && (
            <div>
              <div className="font-roboto text-white/30 text-[10px] mb-1">Найдено заявок: {phoneResults.length}</div>
              {phoneResults.map(o => <OrderCard key={o.id} o={o} />)}
            </div>
          )}
        </div>
      )}

      {/* Кнопка Telegram бота */}
      <div className="mt-4 border border-[#229ED9]/25 bg-[#229ED9]/5 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-[#229ED9] flex items-center justify-center shrink-0">
            <Icon name="Send" size={13} className="text-white" />
          </div>
          <div>
            <div className="font-oswald font-bold text-white text-xs">Telegram-бот мастерской</div>
            <div className="font-roboto text-white/40 text-[9px]">Узнайте статус в мессенджере</div>
          </div>
        </div>
        <p className="font-roboto text-white/40 text-[10px] mb-2.5 leading-relaxed">
          Напишите <span className="text-white/60">@Skypkaklgbot</span> в Telegram и отправьте номер своей заявки — бот моментально пришлёт актуальный статус.
        </p>
        <a href="https://t.me/Skypkaklgbot" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 bg-[#229ED9] text-white font-oswald font-bold text-xs uppercase hover:bg-[#1e8fc4] transition-colors">
          <Icon name="Send" size={13} />
          Открыть бота в Telegram
        </a>
      </div>
    </div>
  );
}
