import { useEffect } from "react";
import { useStaffRepairState } from "./repair/staffTab/useStaffRepairState";
import { useStaffRepairActions } from "./repair/staffTab/useStaffRepairActions";
import StaffRepairViews from "./repair/staffTab/StaffRepairViews";
import StaffRepairModals from "./repair/staffTab/StaffRepairModals";

export default function StaffRepairTab({ token, isOwner = false }: { token: string; isOwner?: boolean }) {
  const st = useStaffRepairState();
  const actions = useStaffRepairActions(token, st);

  // Загружаем заявки или аналитику при смене вкладки/периода/диапазона
  useEffect(() => {
    const ctrl = new AbortController();
    if (st.view === "list") {
      actions.loadOrders(ctrl.signal);
    } else {
      // Для custom-периода загружаем только если задан хотя бы один край диапазона
      if (st.period === "custom" && !st.analyticsDateFrom && !st.analyticsDateTo) {
        return;
      }
      actions.loadAnalytics(st.period, ctrl.signal, st.analyticsDateFrom, st.analyticsDateTo);
    }
    return () => ctrl.abort();
  }, [st.view, actions.loadOrders, actions.loadAnalytics, st.period, st.analyticsDateFrom, st.analyticsDateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col">
      <StaffRepairViews token={token} isOwner={isOwner} st={st} actions={actions} />
      <StaffRepairModals token={token} st={st} actions={actions} />
    </div>
  );
}