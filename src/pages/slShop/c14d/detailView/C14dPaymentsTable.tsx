import Icon from "@/components/ui/icon";
import { fmt, fmtDate, type C14dDetail } from "../types";
import { SLSection } from "../../slUI";

type Props = {
  c: C14dDetail;
  onCancelPayment: (id: number) => void;
};

export default function C14dPaymentsTable({ c, onCancelPayment }: Props) {
  return (
    <>
      {/* Платежи */}
      <SLSection icon="History" title={`Платежи · ${c.payments?.length || 0}`}>
        {(c.payments?.length || 0) === 0 ? (
          <div className="text-center py-2 text-white/35 text-[12px]">Платежей пока нет</div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[9px] text-white/40 uppercase tracking-wider">
                  <th className="text-left p-1">Дата</th>
                  <th className="text-right p-1">Сумма</th>
                  <th className="text-left p-1">Тип</th>
                  <th className="text-left p-1">Доход</th>
                  <th className="text-left p-1">Касса</th>
                  <th className="text-left p-1">Принял</th>
                  <th className="text-right p-1"></th>
                </tr>
              </thead>
              <tbody>
                {c.payments.map(p => {
                  const il = p.income_type === "interest" ? "%" : p.income_type === "principal" ? "Тело" : p.income_type === "mixed" ? "Микс" : p.income_type === "penalty" ? "Пеня" : "—";
                  return (
                    <tr key={p.id} className="border-t border-[#1A1A1A]">
                      <td className="p-1 text-white/70">{fmtDate(p.paid_at)}</td>
                      <td className="p-1 text-right text-emerald-300 font-bold">{fmt(p.amount)} ₽</td>
                      <td className="p-1 text-white/55">{p.payment_type === "full" ? "Полн." : "Част."}</td>
                      <td className="p-1 text-white/55">{il}</td>
                      <td className="p-1">
                        {p.cash_movement_id
                          ? <span className="inline-flex items-center gap-0.5 text-emerald-300/80 text-[11px]"><Icon name="Wallet" size={10} /></span>
                          : <span className="text-white/25 text-[10px]">—</span>}
                      </td>
                      <td className="p-1 text-white/55 truncate max-w-[80px]">{p.recorded_by || "—"}</td>
                      <td className="p-1 text-right">
                        <button
                          onClick={() => onCancelPayment(p.id)}
                          title="Отменить платёж"
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-white/30 hover:text-red-300 hover:bg-red-500/10 active:scale-90 transition"
                        >
                          <Icon name="Trash2" size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SLSection>

      {/* Журнал */}
      {(c.log?.length || 0) > 0 && (
        <SLSection icon="ClipboardList" title="Журнал">
          <div className="space-y-0.5 max-h-40 overflow-y-auto scrollbar-premium pr-1">
            {c.log.map(l => (
              <div key={l.id} className="text-[11px] text-white/65 flex items-center gap-1.5 py-0.5">
                <span className="text-white/35 shrink-0 w-16">{fmtDate(l.created_at)}</span>
                <span className="text-[#FFD700] shrink-0 font-semibold uppercase tracking-wide text-[10px]">{l.action}</span>
                <span className="text-white/40 truncate">{l.actor_name || "—"}</span>
              </div>
            ))}
          </div>
        </SLSection>
      )}
    </>
  );
}
