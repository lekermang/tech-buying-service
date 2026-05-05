import Icon from "@/components/ui/icon";
import PrintDocsButton from "../PrintDocsButton";
import { Section, Field } from "../SLBuyFormParts";
import type { SLBuyFormState } from "./useSLBuyFormState";

/**
 * Нижняя часть формы скупки: блок «Количество» (с пресетами для аксессуаров),
 * описание, переключатель автопечати, sticky-кнопка «Принять товар» и
 * success-состояние после создания записи. Вынесено 1:1 из SLBuyForm.tsx.
 */
export default function SLBuyFormFooter({
  st,
  submit,
  token,
  onSaved,
}: {
  st: SLBuyFormState;
  submit: () => void | Promise<void>;
  token: string;
  onSaved: () => void;
}) {
  const {
    isAccessoryCategory, qtyNum, buyPriceNum,
    quantity, setQuantity,
    description, setDescription,
    source,
    autoPrint, setAutoPrint,
    autoPrintLabel, setAutoPrintLabel,
    saving,
    createdItemId,
  } = st;

  return (
    <>
      {/* Количество единиц в партии (чехлы, стёкла, зарядки и т.п.) */}
      <Section
        title={isAccessoryCategory ? "Количество (партия)" : "Количество"}
        icon="Hash"
        tooltip={isAccessoryCategory ? "Укажи, сколько штук принимаешь — например 5 чехлов или 10 стёкол" : "Сколько штук в позиции"}
      >
        {isAccessoryCategory && (
          <div className="text-[10px] text-[#FFD700]/80 -mt-0.5 mb-0.5">
            Укажи, сколько штук принимаешь — это партия аксессуаров
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setQuantity(String(Math.max(1, qtyNum - 1)))}
            className="w-9 h-9 rounded-md bg-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 text-white/80 active:scale-95"
            title="Убрать одну штуку"
          >
            <Icon name="Minus" size={14} className="mx-auto" />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={quantity}
            onChange={e => setQuantity(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => { if (!quantity || qtyNum < 1) setQuantity("1"); }}
            className={`flex-1 bg-[#0A0A0A] border rounded-lg px-3 py-2 text-center font-bold tabular-nums text-lg transition-all ${
              isAccessoryCategory
                ? "border-[#FFD700]/50 text-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.15)]"
                : "border-[#1F1F1F] text-white"
            }`}
          />
          <span className="text-white/50 text-sm w-7 text-center">шт</span>
          <button
            type="button"
            onClick={() => setQuantity(String(qtyNum + 1))}
            className="w-9 h-9 rounded-md bg-[#0E0E0E] border border-[#1F1F1F] hover:border-[#FFD700]/40 text-white/80 active:scale-95"
            title="Добавить одну штуку"
          >
            <Icon name="Plus" size={14} className="mx-auto" />
          </button>
        </div>

        {/* Быстрые пресеты для аксессуаров */}
        {isAccessoryCategory && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {[5, 10, 20, 50, 100].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setQuantity(String(n))}
                className={`px-2.5 py-1 text-[11px] rounded-md border transition-all active:scale-95 ${
                  qtyNum === n
                    ? "bg-[#FFD700]/15 border-[#FFD700]/60 text-[#FFD700]"
                    : "bg-[#0E0E0E] border-[#1F1F1F] text-white/60 hover:border-[#FFD700]/30"
                }`}
              >
                {n} шт
              </button>
            ))}
          </div>
        )}

        {/* Подсказка по сумме партии */}
        {qtyNum > 1 && buyPriceNum > 0 && source === "buyout" && (
          <div className="mt-1.5 text-[11px] text-white/60">
            Итого закупка: <b className="text-[#FFD700]">{(buyPriceNum * qtyNum).toLocaleString("ru-RU")} ₽</b>
            {" "}<span className="text-white/40">({buyPriceNum.toLocaleString("ru-RU")} ₽ × {qtyNum} шт)</span>
          </div>
        )}
      </Section>

      <Field label="Описание / заметки">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm resize-none" />
      </Field>

      {!createdItemId ? (
        <>
          <div className="space-y-1">
            <label
              className="flex items-center justify-between bg-[#101010] border border-[#1A1A1A] hover:border-[#FFD700]/30 rounded-md px-2.5 py-1.5 cursor-pointer transition"
              title="Откроется окно печати договора купли-продажи сразу после успешного приёма"
            >
              <div className="flex items-center gap-1.5">
                <Icon name="FileText" size={12} className="text-[#FFD700]" />
                <span className="text-[12px]">Печатать договор сразу после приёма</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPrint(!autoPrint)}
                aria-label={autoPrint ? "Выключить автопечать договора" : "Включить автопечать договора"}
                className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${autoPrint ? "bg-[#FFD700]" : "bg-[#1A1A1A]"}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoPrint ? "left-4" : "left-0.5"}`} />
              </button>
            </label>

            <label
              className="flex items-center justify-between bg-[#101010] border border-[#1A1A1A] hover:border-[#FFD700]/30 rounded-md px-2.5 py-1.5 cursor-pointer transition"
              title="Сразу после приёма откроется окно печати ценника 58×40 мм для термопринтера"
            >
              <div className="flex items-center gap-1.5">
                <Icon name="Tag" size={12} className="text-[#FFD700]" />
                <span className="text-[12px]">Печатать ценник сразу после приёма</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPrintLabel(!autoPrintLabel)}
                aria-label={autoPrintLabel ? "Выключить автопечать ценника" : "Включить автопечать ценника"}
                className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${autoPrintLabel ? "bg-[#FFD700]" : "bg-[#1A1A1A]"}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoPrintLabel ? "left-4" : "left-0.5"}`} />
              </button>
            </label>
          </div>
          <div
            className="sticky bottom-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent pt-2 -mx-1 px-1 z-10"
            style={{ paddingBottom: 'calc(0.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={submit}
              disabled={saving}
              title={saving ? "Сохранение..." : "Принять товар на склад и завершить операцию (Ctrl+Enter)"}
              className="w-full bg-gradient-to-b from-[#FFE34D] to-[#FFD700] text-black font-oswald font-bold uppercase tracking-wider text-[13px] py-3 rounded-lg shadow-[0_4px_18px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_6px_24px_rgba(255,215,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Icon name={saving ? "Loader2" : "Check"} size={15} className={saving ? "animate-spin" : ""} />
              {saving ? "Сохраняю…" : "Принять товар"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/40 rounded-xl p-2.5 space-y-1.5 shadow-[0_0_24px_rgba(16,185,129,0.12)]">
          <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[13px]">
            <Icon name="CheckCircle2" size={16} />Товар принят #{createdItemId}
          </div>
          <PrintDocsButton token={token} itemId={createdItemId}
            opType={source === "consignment" ? "consignment_in" : "buyout_individual"}
            label="Печать документов" />
          <button
            onClick={onSaved}
            title="Перейти на вкладку «Склад» и увидеть товар"
            className="w-full bg-gradient-to-b from-[#FFE34D] to-[#FFD700] text-black font-bold py-2 rounded-md uppercase tracking-wider text-[12px] shadow-[0_2px_10px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_4px_18px_rgba(255,215,0,0.45)] transition active:scale-[0.97]"
          >
            Готово, к складу
          </button>
        </div>
      )}
    </>
  );
}