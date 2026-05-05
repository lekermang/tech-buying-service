import StaffRepairReadyModal from "../StaffRepairReadyModal";
import StatusOrdersModal from "../StatusOrdersModal";
import RepairHistoryModal from "@/components/admin/repair/RepairHistoryModal";
import type { StaffRepairState } from "./useStaffRepairState";
import type { StaffRepairActions } from "./useStaffRepairActions";

/**
 * Все модалки вкладки StaffRepair (StatusOrders / Ready / History).
 * Вынесено из StaffRepairTab.tsx 1:1 без изменения логики.
 */
export default function StaffRepairModals({
  token,
  st,
  actions,
}: {
  token: string;
  st: StaffRepairState;
  actions: StaffRepairActions;
}) {
  return (
    <>
      {st.ordersModal && (
        <StatusOrdersModal
          token={token}
          period={st.period}
          statuses={st.ordersModal.statuses}
          title={st.ordersModal.title}
          accent={st.ordersModal.accent}
          onClose={() => st.setOrdersModal(null)}
          onOrderClick={(orderId) => {
            st.setOrdersModal(null);
            st.setFilterStatus("all");
            st.setSearch("");
            st.setDateFrom("");
            st.setDateTo("");
            st.setView("list");
            st.setExpandedId(orderId);
            setTimeout(() => {
              const el = document.getElementById(`order-${orderId}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 350);
          }}
        />
      )}

      {/* ── Модалка «Готово» ── */}
      {st.readyModal && (
        <StaffRepairReadyModal
          order={st.readyModal}
          form={st.readyForm}
          error={st.readyError}
          saving={st.readySaving}
          onFormChange={st.setReadyForm}
          onSubmit={actions.submitReady}
          onClose={() => st.setReadyModal(null)}
        />
      )}

      {st.showHistory && (
        <RepairHistoryModal token={token} onClose={() => st.setShowHistory(false)} />
      )}
    </>
  );
}
