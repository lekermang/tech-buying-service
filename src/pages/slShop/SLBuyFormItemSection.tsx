import Icon from "@/components/ui/icon";
import { type SLCategory, CONDITION_OPTIONS } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";
import { Section, Field, Inp } from "./SLBuyFormParts";

type Props = {
  cats: SLCategory[];
  categoryId: number | "";
  setCategoryId: (id: number | "") => void;
  title: string;
  setTitle: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  specsShort: string;
  setSpecsShort: (v: string) => void;
  specs: string;
  setSpecs: (v: string) => void;
  ramGb: string;
  setRamGb: (v: string) => void;
  storageGb: string;
  setStorageGb: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  battery: string;
  setBattery: (v: string) => void;
  condition: string;
  setCondition: (v: string) => void;
  imei: string;
  setImei: (v: string) => void;
  serial: string;
  setSerial: (v: string) => void;
  hasBox: boolean;
  setHasBox: (v: boolean) => void;
  hasCharger: boolean;
  setHasCharger: (v: boolean) => void;
  autofilled: boolean;
  isPhoneCategory: boolean;
  aiBusy: boolean;
  aiMsg: string | null;
  generateSpecsAI: () => void;
};

export default function SLBuyFormItemSection(p: Props) {
  return (
    <Section title="Товар">
      <Field label="Категория">
        <CategoryTreeSelect categories={p.cats} value={p.categoryId} onChange={(id) => p.setCategoryId(id)} />
      </Field>

      <Field label={<>Наименование {p.autofilled && <span className="text-emerald-400 text-[10px] ml-1">автозаполнено</span>}</>}>
        <input value={p.title} onChange={e => {
          const v = e.target.value;
          if (!p.model || p.model === p.title) p.setModel(v);
          p.setTitle(v);
        }}
          placeholder="iPhone 13 / Samsung Galaxy S22 / Антикварные часы..."
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/50 outline-none" />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Бренд"><Inp v={p.brand} s={p.setBrand} /></Field>
        <Field label="Модель"><Inp v={p.model} s={p.setModel} /></Field>
      </div>

      <Field label="Краткие характеристики (для ценника)">
        <input value={p.specsShort} onChange={e => p.setSpecsShort(e.target.value)}
          placeholder='6.1" OLED 120Hz, 8/128GB, A16, 48+12MP, 3349mAh'
          maxLength={200}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
        <div className="text-[10px] text-white/30 mt-0.5">{p.specsShort.length}/200 — будет на ценнике</div>
      </Field>

      <Field label="Полные характеристики (опц.)">
        <textarea value={p.specs} onChange={e => p.setSpecs(e.target.value)} rows={2}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
      </Field>

      <button type="button" onClick={p.generateSpecsAI} disabled={p.aiBusy}
        className="w-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/20 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-all">
        {p.aiBusy
          ? <><Icon name="Loader" size={13} className="inline mr-1 animate-spin" />Генерирую...</>
          : <><Icon name="Sparkles" size={13} className="inline mr-1" />Заполнить характеристики ИИ</>}
      </button>
      {p.aiMsg && <div className="text-[11px] text-center text-white/60 -mt-1">{p.aiMsg}</div>}

      <div className="grid grid-cols-4 gap-2">
        <Field label={<>ОЗУ ГБ{p.isPhoneCategory && <span className="text-red-400 ml-0.5">*</span>}</>}>
          <Inp v={p.ramGb} s={(v) => p.setRamGb(v.replace(/\D/g, ""))} ph="4" />
        </Field>
        <Field label={<>Память ГБ{p.isPhoneCategory && <span className="text-red-400 ml-0.5">*</span>}</>}>
          <Inp v={p.storageGb} s={(v) => p.setStorageGb(v.replace(/\D/g, ""))} ph="128" />
        </Field>
        <Field label="Цвет"><Inp v={p.color} s={p.setColor} ph="Чёрный" /></Field>
        <Field label="АКБ %"><Inp v={p.battery} s={p.setBattery} ph="100" /></Field>
      </div>

      <Field label="Состояние">
        <div className="flex gap-1 flex-wrap">
          {CONDITION_OPTIONS.map(c => (
            <button key={c} onClick={() => p.setCondition(c)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${
                p.condition === c ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
              }`}>{c}</button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="IMEI"><Inp v={p.imei} s={p.setImei} /></Field>
        <Field label="Серийный номер"><Inp v={p.serial} s={p.setSerial} /></Field>
      </div>

      <div className="flex gap-3 text-sm">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={p.hasBox} onChange={e => p.setHasBox(e.target.checked)} />
          <span>Коробка</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={p.hasCharger} onChange={e => p.setHasCharger(e.target.checked)} />
          <span>Зарядка</span>
        </label>
      </div>
    </Section>
  );
}
