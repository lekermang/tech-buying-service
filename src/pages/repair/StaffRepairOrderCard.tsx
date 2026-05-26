import { Order } from "./types";
import Icon from "@/components/ui/icon";
import OrderCardHeader from "./OrderCardHeader";
import OrderCardFinance from "./OrderCardFinance";
import OrderCardFields from "./OrderCardFields";
import OrderCardActions from "./OrderCardActions";
import OrderCardHistory from "./OrderCardHistory";

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
  onCallRobotReady?: (id: number) => Promise<boolean> | void;
  onInviteToMax?: (id: number) => Promise<boolean> | void;
};

export default function StaffRepairOrderCard({
  o, isExpanded, ef, saving, saveError, isOwner, token, authHeader,
  onToggle, onEditFormChange, onChangeStatus, onOpenReadyModal, onIssueOrder, onSaveCard, onDelete, onCallRobotReady, onInviteToMax,
}: Props) {
  const hasAmount = ef.repair_amount !== "" && ef.repair_amount != null;
  const hasPurchase = ef.purchase_amount !== "" && ef.purchase_amount != null;
  const financeBlocked = !hasAmount || !hasPurchase;
  const isNew = o.status === "new";
  // Критическая срочность для НОВЫХ заявок — > 48 часов с момента создания
  const ageHours = isNew && o.created_at ? (Date.now() - new Date(o.created_at).getTime()) / 3_600_000 : 0;
  const isCritical = isNew && ageHours >= 48;

  return (
    <div id={`order-${o.id}`} className="relative scroll-mt-24">
      <div className={`relative rounded-xl overflow-hidden transition-all duration-150 ${
        isExpanded
          ? "shadow-[0_0_0_1px_rgba(255,215,0,0.4),0_4px_20px_rgba(255,215,0,0.08)]"
          : isCritical
            ? "shadow-[0_0_0_1px_rgba(239,68,68,0.4)]"
            : isNew
              ? "shadow-[0_0_0_1px_rgba(251,146,60,0.25)]"
              : "shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
      } hover:shadow-[0_0_0_1px_rgba(255,215,0,0.2)] bg-[#0D0D0D]`}>
          {/* ── Шапка карточки ── */}
          <OrderCardHeader
            o={o}
            isExpanded={isExpanded}
            onToggle={onToggle}
            onQuickStatus={(status) => onChangeStatus(o.id, status)}
          />

      {/* ── Раскрытая часть ── */}
      {isExpanded && (
        <div className="relative border-t border-[#FFD700]/15 p-3 space-y-3 bg-gradient-to-b from-transparent to-black/30">

          {/* Комментарий клиента — премиум */}
          {o.comment && (
            <div className="relative px-3 py-2.5 bg-gradient-to-r from-[#FFD700]/12 via-[#FFD700]/5 to-transparent border-l-2 border-[#FFD700]/60 rounded-r-md shadow-[inset_0_1px_0_rgba(255,215,0,0.06)]">
              <div className="absolute top-1.5 right-2 text-[9px] font-roboto text-[#FFD700]/60 uppercase tracking-wider font-bold flex items-center gap-1">
                <Icon name="MessageSquare" size={9} />Комментарий клиента
              </div>
              <div className="text-xs font-roboto text-white/85 italic mt-3 leading-relaxed">"{o.comment}"</div>
            </div>
          )}

          {/* Напоминание для статуса «Готово к выдаче» — нет сумм */}
          {o.status === "ready" && financeBlocked && (
            <div className="relative px-3 py-2.5 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-orange-500/5 border border-orange-500/50 rounded-md flex items-start gap-2 shadow-[0_0_18px_rgba(251,146,60,0.20)]">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
              <div className="relative shrink-0 mt-0.5">
                <span className="absolute inset-0 rounded-full bg-orange-400/40 blur-md animate-pulse" />
                <Icon name="AlertTriangle" size={16} className="relative text-orange-300 drop-shadow-[0_0_4px_rgba(251,146,60,0.7)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-orange-200 text-xs uppercase tracking-wide">Заполните суммы перед выдачей</div>
                <div className="font-roboto text-orange-100/85 text-[11px] leading-snug mt-0.5">
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
            onCallRobotReady={onCallRobotReady}
            onInviteToMax={onInviteToMax}
          />

          {/* История изменений (статус, цены, заметки) */}
          <OrderCardHistory orderId={o.id} token={token} authHeader={authHeader} />

        </div>
      )}
      </div>
    </div>
  );
}