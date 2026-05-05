import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Section, Field, Inp } from "./SLBuyFormParts";

type Props = {
  source: "buyout" | "consignment";
  buyPrice: string;
  setBuyPrice: (v: string) => void;
  sellPrice: string;
  setSellPrice: (v: string) => void;
  minPrice: string;
  setMinPrice: (v: string) => void;
  consignmentPercent: string;
  setConsignmentPercent: (v: string) => void;
  status: "stock" | "showcase" | "consignment";
  setStatus: (v: "stock" | "showcase" | "consignment") => void;
};

/** Правило авто-розницы: ≤ 500 ₽ → ×3, иначе → ×2.
 *  Рассчитываем суммарный множитель и подставляем в поле «Продажа», если оно
 *  пустое или содержит предыдущее авто-значение. Ручную правку не трогаем. */
function autoSellByBuy(buy: number): number {
  if (!buy || buy <= 0) return 0;
  return buy <= 500 ? buy * 3 : buy * 2;
}

export default function SLBuyFormPricesAndPlace(p: Props) {
  const buyNum = Number(p.buyPrice) || 0;
  const suggestedSell = autoSellByBuy(buyNum);
  const sellNum = Number(p.sellPrice) || 0;
  // Запомним последнее авто-значение, чтобы понимать, можно ли его перезаписать
  const lastAutoSell = useRef<number>(0);

  useEffect(() => {
    if (p.source !== "buyout") return;
    if (suggestedSell <= 0) return;
    // Авто-подставляем только если поле пустое или содержит предыдущее авто-значение
    if (!p.sellPrice.trim() || sellNum === lastAutoSell.current) {
      p.setSellPrice(String(suggestedSell));
      lastAutoSell.current = suggestedSell;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSell, p.source]);

  const applySuggested = () => {
    if (suggestedSell > 0) {
      p.setSellPrice(String(suggestedSell));
      lastAutoSell.current = suggestedSell;
    }
  };

  const showHint = p.source === "buyout" && buyNum > 0 && suggestedSell > 0 && sellNum !== suggestedSell;

  return (
    <>
      <Section title="Цены" icon="Wallet" tooltip="Авто-розница: до 500 ₽ — ×3, дороже — ×2. Можно изменить вручную.">
        <div className="grid grid-cols-3 gap-2">
          {p.source === "buyout" && (
            <Field label="Закупка ₽"><Inp v={p.buyPrice} s={p.setBuyPrice} ph="0" /></Field>
          )}
          <Field label="Продажа ₽"><Inp v={p.sellPrice} s={p.setSellPrice} ph="0" /></Field>
          <Field label="Мин. цена ₽"><Inp v={p.minPrice} s={p.setMinPrice} ph="0" /></Field>
          {p.source === "consignment" && (
            <Field label="Комиссия %"><Inp v={p.consignmentPercent} s={p.setConsignmentPercent} ph="20" /></Field>
          )}
        </div>
        {p.source === "buyout" && buyNum > 0 && suggestedSell > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-white/45">
              Правило ×{buyNum <= 500 ? 3 : 2}: рекомендованная розница{" "}
              <b className="text-[#FFD700] tabular-nums">{suggestedSell.toLocaleString("ru-RU")} ₽</b>
            </span>
            {showHint && (
              <button
                type="button"
                onClick={applySuggested}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFD700]/15 hover:bg-[#FFD700]/25 border border-[#FFD700]/40 text-[#FFD700] font-bold uppercase tracking-wide text-[9px] active:scale-95"
                title={`Подставить ${suggestedSell.toLocaleString("ru-RU")} ₽ в поле «Продажа»`}
              >
                <Icon name="Sparkles" size={9} /> применить
              </button>
            )}
          </div>
        )}
      </Section>

      {p.source === "buyout" && (
        <Section title="Куда поставить">
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "stock", l: "На склад" },
              { v: "showcase", l: "На витрину" },
            ].map(o => (
              <button key={o.v} onClick={() => p.setStatus(o.v as "stock" | "showcase")}
                className={`p-2 rounded-lg border text-sm font-bold transition-all ${
                  p.status === o.v ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/60"
                }`}>{o.l}</button>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}