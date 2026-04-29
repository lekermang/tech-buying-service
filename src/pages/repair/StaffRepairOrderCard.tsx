import { Order } from "./types";
import Icon from "@/components/ui/icon";
import OrderCardHeader from "./OrderCardHeader";
import OrderCardFinance from "./OrderCardFinance";
import OrderCardFields from "./OrderCardFields";
import OrderCardActions from "./OrderCardActions";

type EditForm = {
  name: string; phone: string; model: string; repair_type: string;
  price: string; comment: string; admin_note: string;
  purchase_amount: string; repair_amount: string; parts_name: string;
  advance: string; is_paid: boolean; payment_method: string;
};

type Props = {
  o: Order;
  isExpanded: boolean;
  ef: EditForm;
  saving: boolean;
  saveError: string | null;
  isOwner: boolean;
  token: string;
  authHeader: "X-Admin-Token" | "X-Employee-Token";
  onToggle: () => void;
  onEditFormChange: (id: number, ef: EditForm) => void;
  onChangeStatus: (id: number, status: string, extra?: Record<string, unknown>) => void;
  onOpenReadyModal: (o: Order) => void;
  onIssueOrder: (o: Order, issuedAt?: string) => void;
  onSaveCard: (o: Order) => void;
  onDelete: (id: number) => void;
};

export default function StaffRepairOrderCard({
  o, isExpanded, ef, saving, saveError, isOwner, token, authHeader,
  onToggle, onEditFormChange, onChangeStatus, onOpenReadyModal, onIssueOrder, onSaveCard, onDelete,
}: Props) {
  const hasAmount = ef.repair_amount !== "" && ef.repair_amount != null;
  const hasPurchase = ef.purchase_amount !== "" && ef.purchase_amount != null;
  const financeBlocked = !hasAmount || !hasPurchase;

  return (
    <div id={`order-${o.id}`} className={`border transition-all duration-300 rounded-lg overflow-hidden scroll-mt-24 ${
      isExpanded
        ? "bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/5 ring-2 ring-[#FFD700]/30"
        : "bg-[#141414] border-[#1F1F1F] hover:border-[#2A2A2A]"
    }`}>

      {/* ── Шапка карточки ── */}
      <OrderCardHeader o={o} isExpanded={isExpanded} onToggle={onToggle} />

      {/* ── Раскрытая часть ── */}
      {isExpanded && (
        <div className="border-t border-[#FFD700]/15 p-3 space-y-3 bg-gradient-to-b from-transparent to-black/20">

          {/* Комментарий клиента */}
          {o.comment && (
            <div className="relative px-3 py-2.5 bg-[#FFD700]/5 border-l-2 border-[#FFD700]/40 rounded-r-md">
              <div className="absolute top-1 right-2 text-[9px] font-roboto text-[#FFD700]/40 uppercase tracking-wide">Комментарий клиента</div>
              <div className="text-xs font-roboto text-white/70 italic mt-3 leading-relaxed">"{o.comment}"</div>
            </div>
          )}

          {/* Напоминание для статуса «Готово к выдаче» — нет сумм */}
          {o.status === "ready" && financeBlocked && (
            <div className="relative px-3 py-2.5 bg-gradient-to-r from-orange-500/15 to-orange-500/5 border border-orange-500/40 rounded-md flex items-start gap-2 animate-pulse">
              <Icon name="AlertTriangle" size={16} className="text-orange-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-orange-300 text-xs uppercase tracking-wide">Заполните суммы перед выдачей</div>
                <div className="font-roboto text-orange-200/80 text-[11px] leading-snug mt-0.5">
                  Заявка в статусе «Готово», но не указаны {!ef.repair_amount && "сумма выдачи"}{!ef.repair_amount && !ef.purchase_amount && " и "}{!ef.purchase_amount && "сумма закупки"}. Без них нельзя нажать «Выдано» — данные нужны для статистики.
                </div>
              </div>
            </div>
          )}

          {/* Финансы */}
          <OrderCardFinance
            orderId={o.id}
            ef={ef}
            onEditFormChange={onEditFormChange}
          />

          {/* Поля заявки + Сохранить */}
          <OrderCardFields
            o={o}
            ef={ef}
            saving={saving}
            saveError={saveError}
            onEditFormChange={onEditFormChange}
            onSaveCard={onSaveCard}
          />

          {/* Смена статуса + Telegram + SMS + Документы */}
          <OrderCardActions
            o={o}
            ef={ef}
            saving={saving}
            isOwner={isOwner}
            token={token}
            authHeader={authHeader}
            financeBlocked={financeBlocked}
            onChangeStatus={onChangeStatus}
            onOpenReadyModal={onOpenReadyModal}
            onIssueOrder={onIssueOrder}
            onDelete={onDelete}
          />

        </div>
      )}
    </div>
  );
}