import Icon from "@/components/ui/icon";
import { Section } from "../SLBuyFormParts";
import type { SLBuyFormState } from "./useSLBuyFormState";

/**
 * Верхняя часть формы скупки: сообщение (msg), выбор филиала и типа приёма.
 * Вынесено из SLBuyForm.tsx 1:1 без изменения логики.
 */
export default function SLBuyFormHeader({ st }: { st: SLBuyFormState }) {
  const { msg, branches, branchId, setBranchId, source, setSource } = st;

  return (
    <>
      {msg && (
        <div className={`px-2.5 py-1.5 rounded-md text-[12px] flex items-center gap-1.5 ${msg.startsWith("Принято") ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>
          <Icon name={msg.startsWith("Принято") ? "CheckCircle2" : "AlertTriangle"} size={12} />
          {msg}
        </div>
      )}

      <Section title="Филиал / склад">
        <div className="grid grid-cols-2 gap-1.5">
          {branches.map(b => (
            <button key={b.id} onClick={() => setBranchId(b.id)}
              title={`Принять товар в филиал «${b.name}»${b.address ? ` (${b.address})` : ""}`}
              className={`px-2.5 py-2 rounded-md border text-left transition-all active:scale-[0.98] ${
                branchId === b.id
                  ? "bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border-[#FFD700] text-[#FFD700] shadow-[0_2px_10px_rgba(255,215,0,0.18)]"
                  : "bg-[#0E0E0E] border-[#1A1A1A] text-white/60 hover:border-[#FFD700]/30 hover:bg-[#131313]"
              }`}>
              <div className="font-bold text-[12px] flex items-center gap-1 leading-tight">
                <Icon name="MapPin" size={11} />{b.name}
              </div>
              {b.address && <div className="text-[10px] opacity-70 truncate mt-0.5">{b.address}</div>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Тип приёма">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { v: "buyout", l: "Скупка", d: "купили навсегда", icon: "ShoppingCart", t: "Покупаем у клиента навсегда — товар становится нашим" },
            { v: "consignment", l: "Комиссия", d: "на реализацию", icon: "Handshake", t: "Берём на реализацию — клиент получает деньги после продажи" },
          ].map(o => (
            <button key={o.v} onClick={() => setSource(o.v as "buyout" | "consignment")}
              title={o.t}
              className={`px-2.5 py-2 rounded-md border text-left transition-all active:scale-[0.98] ${
                source === o.v
                  ? "bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border-[#FFD700] text-[#FFD700] shadow-[0_2px_10px_rgba(255,215,0,0.18)]"
                  : "bg-[#0E0E0E] border-[#1A1A1A] text-white/60 hover:border-[#FFD700]/30 hover:bg-[#131313]"
              }`}>
              <Icon name={o.icon} size={14} />
              <div className="font-bold text-[12px] mt-0.5 leading-tight">{o.l}</div>
              <div className="text-[10px] opacity-70 leading-tight">{o.d}</div>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}
