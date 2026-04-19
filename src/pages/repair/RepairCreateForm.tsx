import { useState } from "react";
import Icon from "@/components/ui/icon";
import { EMPTY_FORM, INP, LBL } from "./types";
import { formatPhone } from "@/lib/phoneFormat";

type Form = typeof EMPTY_FORM;

type Props = {
  form: Form;
  creating: boolean;
  onChange: (form: Form) => void;
  onCreate: () => void;
  onCancel: () => void;
};

const RISKS = [
  "После контакта с водой аппарат может полностью выйти из строя при любом виде ремонта (чистка, прогрев, пайка). Мастерская не обязана его восстанавливать.",
  "Компонентная пайка сопряжена с риском безвозвратного повреждения платы. Если телефон перестал включаться в процессе ремонта — работа оплачивается в полном объёме.",
  "При снятии дисплея возможно его повреждение (полосы, артефакты, отказ включения). Замена дисплея производится за счёт клиента.",
  "Все пользовательские данные (фото, контакты и др.) могут быть безвозвратно утеряны. Мастерская не занимается восстановлением данных. Клиент сделал резервную копию или согласен на потерю.",
  "Гарантия на результат ремонта не предоставляется. В худшем случае устройство будет возвращено в нерабочем состоянии; клиент оплачивает диагностику и уже выполненные работы.",
];

export default function RepairCreateForm({ form, creating, onChange, onCreate, onCancel }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
      <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Имя клиента *</label>
          <input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })}
            placeholder="Иван Иванов" className={INP} />
        </div>
        <div>
          <label className={LBL}>Телефон *</label>
          <input value={form.phone} onChange={e => onChange({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="+7 (___) ___-__-__" className={INP} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Модель устройства</label>
          <input value={form.model} onChange={e => onChange({ ...form, model: e.target.value })}
            placeholder="iPhone 14, Samsung A54..." className={INP} />
        </div>
        <div>
          <label className={LBL}>Тип ремонта</label>
          <input value={form.repair_type} onChange={e => onChange({ ...form, repair_type: e.target.value })}
            placeholder="Замена дисплея, зарядка..." className={INP} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className={LBL}>Примерная стоимость (₽)</label>
          <input type="number" value={form.price} onChange={e => onChange({ ...form, price: e.target.value })}
            placeholder="1500" className={INP} />
        </div>
        <div>
          <label className={LBL}>Комментарий</label>
          <input value={form.comment} onChange={e => onChange({ ...form, comment: e.target.value })}
            placeholder="Разбитый экран, не включается..." className={INP} />
        </div>
      </div>

      {/* Акт приёмки */}
      <div className="mt-3 border border-white/10 bg-[#111] p-3">
        <div className="font-roboto text-[#FFD700] text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <Icon name="AlertTriangle" size={11} />
          Условия приёмки — клиент ознакомлен
        </div>
        <ol className="space-y-1.5 mb-3">
          {RISKS.map((text, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-roboto text-[#FFD700]/60 text-[10px] mt-0.5 shrink-0">{i + 1}.</span>
              <span className="font-roboto text-white/50 text-[10px] leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
        <div className="flex items-start justify-between gap-3">
          <label className="flex items-start gap-2 cursor-pointer group flex-1">
            <div
              onClick={() => setAgreed(v => !v)}
              className={`mt-0.5 w-4 h-4 shrink-0 border flex items-center justify-center transition-colors ${agreed ? "bg-[#FFD700] border-[#FFD700]" : "border-white/30 group-hover:border-[#FFD700]/60"}`}
            >
              {agreed && <Icon name="Check" size={10} className="text-black" />}
            </div>
            <span className="font-roboto text-white/60 text-[11px] leading-relaxed">
              Клиент ознакомлен с условиями, рисками и согласен на проведение ремонта
            </span>
          </label>
          <a
            href="/act"
            target="_blank"
            className="font-roboto text-[#FFD700]/70 text-[10px] hover:text-[#FFD700] transition-colors shrink-0 underline underline-offset-2 mt-0.5"
          >
            Условия
          </a>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={onCreate} disabled={creating || !form.name || !form.phone || !agreed}
          className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
          <Icon name="Check" size={13} />
          {creating ? "Создаю..." : "Создать заявку"}
        </button>
        <button onClick={onCancel}
          className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">
          Отмена
        </button>
      </div>
    </div>
  );
}