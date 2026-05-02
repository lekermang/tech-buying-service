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

export default function SLBuyFormPricesAndPlace(p: Props) {
  return (
    <>
      <Section title="Цены">
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
