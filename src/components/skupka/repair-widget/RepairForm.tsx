import Icon from "@/components/ui/icon";
import { formatPhone } from "@/lib/phoneFormat";
import { INP, Part, ExtraWork, ClientInfo } from "./types";
import RepairPartsSelector from "./RepairPartsSelector";

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
  onCheckStatus: () => void;
  setStatusId: (id: string) => void;
  setTab: (tab: "form" | "status") => void;
};

export default function RepairForm({
  form, setForm, sending, orderId, agreed, setAgreed, canSubmit, grandTotal,
  selectedPart, clientInfo, partsLoading, parts, showPartsList, groupedParts,
  extraWorks, extraWorksList, extraTotal,
  onSelectPart, onToggleExtra, onChangeSelection, onSubmit, onReset,
  onCheckStatus, setStatusId, setTab,
}: Props) {
  if (orderId) {
    return (
      <div className="border-t border-[#FFD700]/20 pt-2">
        <div className="flex items-center gap-1.5 text-[#FFD700] font-roboto text-xs mb-2">
          <Icon name="CheckCircle" size={13} />
          Заявка #{orderId} принята! Перезвоним через 15 мин.
        </div>
        <div className="font-roboto text-white/40 text-[10px] mb-2">
          Сохраните номер — по нему можно проверить статус ремонта
        </div>
        <div className="flex gap-3">
          <button onClick={onReset} className="text-white/40 hover:text-white font-roboto text-[10px] transition-colors">
            Новая заявка
          </button>
          <button onClick={() => { setStatusId(String(orderId)); setTab("status"); onCheckStatus(); }}
            className="text-[#FFD700] hover:underline font-roboto text-[10px]">
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
      <input type="tel" value={form.phone}
        onChange={e => setForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
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
        className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase text-sm hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1">
        {sending ? "Отправляем..." : selectedPart
          ? `Отправить заявку · ${grandTotal.toLocaleString("ru-RU")} ₽`
          : "Отправить заявку"}
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
