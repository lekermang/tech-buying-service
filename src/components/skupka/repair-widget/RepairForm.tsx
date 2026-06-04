import Icon from "@/components/ui/icon";
import ContactChannelsBlock from "@/components/forms/ContactChannelsBlock";
import { formatPhone } from "@/lib/phoneFormat";
import { INP, Part, ExtraWork, ClientInfo } from "./types";
import RepairPartsSelector from "./RepairPartsSelector";
import PayButton from "@/components/payment/PayButton";

type Props = {
  form: { name: string; phone: string; model: string; fault: string };
  setForm: (updater: (prev: { name: string; phone: string; model: string; fault: string }) => { name: string; phone: string; model: string; fault: string }) => void;
  sending: boolean;
  orderId: number | null;
  agreed: boolean;
  setAgreed: (updater: (v: boolean) => boolean) => void;
  canSubmit: boolean;
  grandTotal: number;
  selectedPart: Part | null;
  clientInfo: ClientInfo | null;
  partsLoading: boolean;
  parts: Part[];
  showPartsList: boolean;
  groupedParts: Record<string, Part[]>;
  extraWorks: string[];
  extraWorksList: ExtraWork[];
  extraTotal: number;
  onSelectPart: (part: Part) => void;
  onToggleExtra: (id: string) => void;
  onChangeSelection: () => void;
  onSubmit: () => void;
  onReset: () => void;
  contactChannels: string[];
  setContactChannels: React.Dispatch<React.SetStateAction<string[]>>;
  contactTime: string;
  setContactTime: React.Dispatch<React.SetStateAction<string>>;
  onCheckStatus: () => void;
  setStatusId: (id: string) => void;
  setTab: (tab: "form" | "status") => void;
};

export default function RepairForm({
  form, setForm, sending, orderId, agreed, setAgreed, canSubmit, grandTotal,
  selectedPart, clientInfo, partsLoading, parts, showPartsList, groupedParts,
  extraWorks, extraWorksList, extraTotal,
  onSelectPart, onToggleExtra, onChangeSelection, onSubmit, onReset,
  contactChannels, setContactChannels, contactTime, setContactTime,
  onCheckStatus, setStatusId, setTab,
}: Props) {
  if (orderId) {
    return (
      <div className="border-t border-[#FFD700]/20 pt-3">
        {/* Успех */}
        <div className="flex items-center gap-2 mb-1">
          <Icon name="CheckCircle" size={15} className="text-[#FFD700] shrink-0" />
          <span className="text-[#FFD700] font-oswald font-bold text-sm">Заявка #{orderId} принята!</span>
        </div>
        <div className="font-roboto text-white/40 text-[10px] mb-3">
          Перезвоним через 15 минут. Сохраните номер заявки — по нему можно отслеживать ремонт.
        </div>

        {/* Блок Telegram */}
        <div className="bg-[#229ED9]/10 border border-[#229ED9]/30 px-3 py-3 mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="Send" size={13} className="text-[#229ED9] shrink-0" />
            <span className="font-oswald font-bold text-white text-xs">Получайте уведомления в Telegram</span>
          </div>
          <p className="font-roboto text-white/40 text-[10px] leading-relaxed mb-2.5">
            Напишите боту <span className="text-white/70 font-medium">@Skypkaklgbot</span> и отправьте номер заявки — <span className="text-white/60">#{orderId}</span>.
            Бот пришлёт уведомление, как только статус изменится.
          </p>
          <a
            href={`https://t.me/Skypkaklgbot?start=${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-[#229ED9] text-white font-oswald font-bold text-xs uppercase hover:bg-[#1e8fc4] transition-colors"
          >
            <Icon name="Send" size={12} />
            Написать боту → #{orderId}
          </a>
        </div>

        {/* Доп. опции: предоплата / срочный ремонт */}
        {grandTotal > 0 && (
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 px-3 py-3 mb-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Zap" size={13} className="text-[#FFD700]" />
              <span className="font-oswald font-bold text-white text-xs">Хотите оплатить онлайн?</span>
            </div>
            <p className="font-roboto text-white/45 text-[10px] mb-2">
              Подтвердите заказ предоплатой 30% — мы зарезервируем запчасть и ускорим работу.
            </p>
            <PayButton
              purpose="repair_prepay"
              amount={Math.round(grandTotal * 0.3)}
              description={`Предоплата 30% за ремонт №${orderId} · ${form.model}`}
              contextId={String(orderId)}
              contactInfo={form.phone}
              size="sm"
              className="w-full"
            >
              Внести предоплату 30% · {Math.round(grandTotal * 0.3).toLocaleString("ru-RU")} ₽
            </PayButton>
            <PayButton
              purpose="repair_urgent"
              amount={500}
              description={`Срочный ремонт (приоритет) №${orderId}`}
              contextId={String(orderId)}
              contactInfo={form.phone}
              variant="outline"
              size="sm"
              icon="Zap"
              className="w-full"
            >
              Срочный ремонт (+500 ₽) — без очереди
            </PayButton>
          </div>
        )}

        {/* Нижние кнопки */}
        <div className="flex gap-3">
          <button onClick={onReset} className="text-white/30 hover:text-white font-roboto text-[10px] transition-colors">
            Новая заявка
          </button>
          <button onClick={() => { setStatusId(String(orderId)); setTab("status"); onCheckStatus(); }}
            className="text-[#FFD700]/70 hover:text-[#FFD700] font-roboto text-[10px] transition-colors">
            Проверить статус →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input type="text" value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
        placeholder="Ваше имя *" className={INP} />
      <input type="tel" inputMode="tel" value={form.phone}
        onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
        onFocus={() => { if (!form.phone) setForm(p => ({ ...p, phone: "+7" })); }}
        required
        placeholder="+7 (___) ___-__-__" className={INP} />

      {/* Модель + поиск запчастей */}
      <div>
        <input type="text" value={form.model}
          onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
          placeholder="Модель телефона * (напр: iPhone 13)" className={INP} />

        <RepairPartsSelector
          form={form}
          partsLoading={partsLoading}
          parts={parts}
          showPartsList={showPartsList}
          groupedParts={groupedParts}
          selectedPart={selectedPart}
          extraWorks={extraWorks}
          extraWorksList={extraWorksList}
          extraTotal={extraTotal}
          grandTotal={grandTotal}
          clientInfo={clientInfo}
          onSelectPart={onSelectPart}
          onToggleExtra={onToggleExtra}
          onChangeSelection={onChangeSelection}
        />
      </div>

      <input type="text" value={form.fault}
        onChange={e => setForm(p => ({ ...p, fault: e.target.value }))}
        placeholder="Опишите проблему * (не включается, разбит экран...)"
        className={INP} />

      <div className="mt-1">
        <ContactChannelsBlock
          value={contactChannels}
          onChange={setContactChannels}
          timeNote={contactTime}
          onTimeChange={setContactTime}
          variant="compact"
        />
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <label className="flex items-start gap-2 cursor-pointer flex-1" onClick={() => setAgreed(v => !v)}>
          <div className={`mt-0.5 w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-colors ${agreed ? "bg-[#FFD700] border-[#FFD700]" : "border-white/30"}`}>
            {agreed && <Icon name="Check" size={9} className="text-black" />}
          </div>
          <span className="font-roboto text-[10px] text-white/50 leading-relaxed">
            Ознакомлен с условиями ремонта и согласен
          </span>
        </label>
        <a
          href="/act"
          target="_blank"
          className="font-roboto text-[10px] text-[#FFD700]/60 hover:text-[#FFD700] transition-colors underline underline-offset-2 shrink-0"
        >
          Условия
        </a>
      </div>

      <button onClick={onSubmit} disabled={!canSubmit || sending}
        className="group relative overflow-hidden w-full text-black font-oswald font-bold py-2.5 uppercase text-sm active:scale-[0.98] transition-all mt-1
                   bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                   shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.25),inset_0_1px_0_rgba(255,255,255,0.5)]
                   hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_8px_28px_rgba(255,215,0,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
        <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
        <span className="relative">
          {sending ? "Отправляем..." : selectedPart
            ? `Отправить заявку · ${grandTotal.toLocaleString("ru-RU")} ₽`
            : "Отправить заявку"}
        </span>
      </button>
      <div className="flex items-center justify-between">
        <div className="font-roboto text-white/20 text-[9px]">
          Перезвоним в течение 15 минут
        </div>
        {!clientInfo?.found && (
          <a href="/repair-discount" target="_blank"
            className="font-roboto text-[9px] text-[#FFD700]/50 hover:text-[#FFD700] transition-colors flex items-center gap-0.5">
            <Icon name="Tag" size={9} /> Получить скидку -3%
          </a>
        )}
      </div>
    </div>
  );
}