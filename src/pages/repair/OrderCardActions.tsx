import OrderCardStatusBlock from "./orderCardActions/OrderCardStatusBlock";
import OrderCardNotifyBlock from "./orderCardActions/OrderCardNotifyBlock";
import OrderCardDocsBlock from "./orderCardActions/OrderCardDocsBlock";
import { OrderCardActionsProps } from "./orderCardActions/orderCardActionsTypes";

export default function OrderCardActions({
  o, ef, saving, isOwner, token, authHeader, financeBlocked,
  onChangeStatus, onOpenReadyModal, onIssueOrder, onDelete,
}: OrderCardActionsProps) {
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

      <OrderCardNotifyBlock
        o={o}
        token={token}
        authHeader={authHeader}
      />

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
