import { useState } from "react";
import Icon from "@/components/ui/icon";
import OrderCardStatusBlock from "./orderCardActions/OrderCardStatusBlock";
import OrderCardNotifyBlock from "./orderCardActions/OrderCardNotifyBlock";
import OrderCardDocsBlock from "./orderCardActions/OrderCardDocsBlock";
import { OrderCardActionsProps } from "./orderCardActions/orderCardActionsTypes";

/**
 * Действия в раскрытой карточке заявки на ремонт.
 *
 * Воронка статусов (главное) + документы (всегда виден).
 * Ручная отправка SMS/Telegram — теперь скрыта в свёрнутом блоке «Уведомления вручную»,
 * так как авто-уведомления при смене статуса покрывают 95% случаев:
 *   - SMS клиенту: при переходе в «Готов»
 *   - Telegram мастеру: при переходе в «На согласование»
 */
export default function OrderCardActions({
  o, ef, saving, isOwner, token, authHeader, financeBlocked,
  onChangeStatus, onOpenReadyModal, onIssueOrder, onDelete,
}: OrderCardActionsProps) {
  const [showManualNotify, setShowManualNotify] = useState(false);

  return (
    <>
      <OrderCardStatusBlock
        o={o}
        ef={ef}
        saving={saving}
        financeBlocked={financeBlocked}
        onChangeStatus={onChangeStatus}
        onOpenReadyModal={onOpenReadyModal}
        onIssueOrder={onIssueOrder}
      />

      {/* Ручные уведомления — свёрнуто по умолчанию, открывается по запросу */}
      <div className="rounded-lg border border-white/10 bg-[#0E0E0E]/60 overflow-hidden">
        <button
          onClick={() => setShowManualNotify(v => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors"
        >
          <span className="inline-flex items-center gap-2 text-white/65">
            <Icon name="Send" size={13} />
            <span className="font-oswald uppercase text-[11px] tracking-wider">Отправить вручную</span>
            <span className="text-[10px] text-white/35">SMS · Telegram</span>
          </span>
          <Icon name={showManualNotify ? "ChevronUp" : "ChevronDown"} size={12} className="text-white/40" />
        </button>
        {showManualNotify && (
          <div className="px-3 pb-3 pt-1">
            <OrderCardNotifyBlock
              o={o}
              token={token}
              authHeader={authHeader}
            />
          </div>
        )}
      </div>

      <OrderCardDocsBlock
        o={o}
        isOwner={isOwner}
        token={token}
        authHeader={authHeader}
        onDelete={onDelete}
      />
    </>
  );
}