import { useState } from "react";
import Icon from "@/components/ui/icon";

type Row = {
  service: string;
  price: string;
  urgent: string;
  note?: string;
};

const ROWS: Row[] = [
  { service: "Замена аккумулятора", price: "490 ₽", urgent: "+30%", note: "Цена работы без стоимости детали" },
  { service: "Замена экрана", price: "890 ₽", urgent: "+30%", note: "Цена работы без стоимости детали" },
  { service: "Замена стекла (дисплей в сборе)", price: "690 ₽", urgent: "+30%", note: "Цена работы без стоимости детали" },
  { service: "Ремонт после воды", price: "990 ₽", urgent: "Невозможен", note: "Чистка и восстановление платы" },
  { service: "Замена разъёма зарядки", price: "490 ₽", urgent: "+30%" },
  { service: "Замена кнопки включения", price: "490 ₽", urgent: "Да" },
  { service: "Замена динамика/микрофона", price: "490 ₽", urgent: "Да" },
  { service: "Прошивка / Установка ПО", price: "890 ₽", urgent: "Нет" },
];

function UrgentBadge({ value }: { value: string }) {
  if (value === "Невозможен" || value === "Нет") {
    return <span className="text-white/35 text-xs">{value}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[#FFD700] text-xs font-semibold">
      <Icon name="Zap" size={12} />
      {value}
    </span>
  );
}

export default function RepairPriceTable({ onOrder }: { onOrder: () => void }) {
  const [tip, setTip] = useState<number | null>(null);

  return (
    <section id="prices" className="px-4 sm:px-8 py-14 max-w-4xl mx-auto scroll-mt-20">
      <div className="text-center mb-7">
        <h2 className="font-oswald text-3xl sm:text-4xl font-bold uppercase">
          Прайс-лист на <span className="text-[#FFD700]">ремонт</span>
        </h2>
        <p className="text-white/50 text-sm mt-2">Цена за работу — указана стоимость без детали. Диагностика бесплатно.</p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#111]">
        {/* Шапка таблицы */}
        <div className="hidden sm:grid grid-cols-[1fr_140px_140px] bg-white/[0.04] px-5 py-3 text-[11px] uppercase tracking-wide text-white/40 font-roboto">
          <div>Услуга</div>
          <div className="text-right">Цена за работу</div>
          <div className="text-right">Срочный ремонт</div>
        </div>

        {ROWS.map((r, i) => (
          <div
            key={r.service}
            className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_140px] items-center px-5 py-3.5 border-t border-white/[0.06] hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-roboto text-sm text-white/90">{r.service}</span>
              {r.note && (
                <button
                  type="button"
                  className="relative shrink-0 text-white/30 hover:text-[#FFD700]"
                  onClick={() => setTip(tip === i ? null : i)}
                  aria-label="Подробнее о цене"
                >
                  <Icon name="Info" size={13} />
                  {tip === i && (
                    <span className="absolute left-0 bottom-full mb-1.5 z-10 w-52 bg-black border border-[#FFD700]/30 rounded-lg p-2 text-[11px] text-white/70 text-left font-roboto shadow-xl">
                      {r.note}
                    </span>
                  )}
                </button>
              )}
            </div>
            <div className="font-oswald font-bold text-[#FFD700] text-base text-right sm:text-right whitespace-nowrap pl-3">
              {r.price}
            </div>
            <div className="col-span-2 sm:col-span-1 text-right mt-0.5 sm:mt-0">
              <span className="sm:hidden text-white/30 text-[10px] uppercase mr-2">Срочно:</span>
              <UrgentBadge value={r.urgent} />
            </div>
          </div>
        ))}
      </div>

      {/* Под таблицей */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-5">
        <div className="text-center sm:text-left">
          <div className="font-oswald text-lg font-semibold uppercase">Не нашли свою проблему?</div>
          <div className="text-white/50 text-sm mt-0.5">
            Стоимость ремонта с деталью назовём после бесплатной диагностики.
          </div>
        </div>
        <button
          onClick={onOrder}
          className="group relative overflow-hidden shrink-0 text-black font-oswald font-bold uppercase tracking-wide px-7 py-3 rounded-lg text-sm active:scale-95 transition-all inline-flex items-center gap-2
                     bg-[linear-gradient(180deg,#fff3a0_0%,#ffd700_45%,#d4a017_100%)]
                     shadow-[0_0_0_1px_rgba(255,215,0,0.5),0_6px_20px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)]
                     hover:shadow-[0_0_0_1px_rgba(255,215,0,0.8),0_10px_28px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)]"
        >
          <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <Icon name="Calculator" size={16} className="relative" />
          <span className="relative">Рассчитать стоимость</span>
        </button>
      </div>
    </section>
  );
}