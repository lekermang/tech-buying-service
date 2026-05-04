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
  const isNew = o.status === "new";

  return (
    <div id={`order-${o.id}`} className="relative scroll-mt-24 h-full">
      {/* HALO — внешний золотой ореол вокруг раскрытой карточки */}
      {isExpanded && (
        <span
          aria-hidden
          className="absolute -inset-1.5 rounded-2xl pointer-events-none"
          style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.25),rgba(255,215,0,0.06) 60%,transparent 85%)", filter: "blur(14px)" }}
        />
      )}

      {/* Подсветка для НОВЫХ заявок (status === "new") — пульсирующий ореол */}
      {!isExpanded && isNew && (
        <span
          aria-hidden
          className="absolute -inset-1 rounded-2xl pointer-events-none animate-pulse"
          style={{ background: "radial-gradient(closest-side,rgba(255,165,0,0.30),rgba(255,165,0,0.05) 60%,transparent 85%)", filter: "blur(10px)" }}
        />
      )}

      {/* Conic-gradient рамка для раскрытой / премиум для НОВОЙ / простая для свёрнутой */}
      <div className={`relative rounded-xl transition-all duration-300 overflow-hidden h-full ${
        isExpanded
          ? "p-[1.5px] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.7)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.7)_360deg)] shadow-[0_8px_28px_rgba(255,215,0,0.18)]"
          : isNew
            ? "p-[1.5px] bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,165,0,0.85)_0deg,rgba(255,215,0,0.45)_120deg,rgba(255,243,160,0.85)_240deg,rgba(255,165,0,0.85)_360deg)] shadow-[0_4px_18px_rgba(255,140,0,0.35)] hover:shadow-[0_6px_24px_rgba(255,140,0,0.55)]"
            : "border border-[#1F1F1F] bg-gradient-to-br from-[#141414] to-[#0E0E0E] hover:border-[#FFD700]/30 hover:shadow-[0_0_14px_rgba(255,215,0,0.15)]"
      }`}>
        <div className={`relative rounded-[10px] overflow-hidden h-full ${
          isExpanded
            ? "bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E]"
            : isNew
              ? "bg-gradient-to-br from-[#1A1410] via-[#0F0C08] to-[#0A0806]"
              : ""
        }`}>
          {/* Декор раскрытой */}
          {isExpanded && (
            <>
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent pointer-events-none" />
            </>
          )}

          {/* ── Шапка карточки ── */}
          <OrderCardHeader o={o} isExpanded={isExpanded} onToggle={onToggle} />

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
          />

        </div>
      )}
        </div>
      </div>
    </div>
  );
}