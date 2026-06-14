import { useEffect, useRef } from "react";
import { useStaffRepairState } from "./repair/staffTab/useStaffRepairState";
import { useStaffRepairActions } from "./repair/staffTab/useStaffRepairActions";
import StaffRepairViews from "./repair/staffTab/StaffRepairViews";
import StaffRepairModals from "./repair/staffTab/StaffRepairModals";
import { urgencyLevel } from "./repair/staffTab/repairListUtils";

type Props = {
  token: string;
  isOwner?: boolean;
  onUrgentCount?: (n: number) => void;
  initialUrgentFilter?: boolean;
};

export default function StaffRepairTab({ token, isOwner = false, onUrgentCount, initialUrgentFilter }: Props) {
  const st = useStaffRepairState();
  const actions = useStaffRepairActions(token, st);
  const prevUrgent = useRef(-1);

  // Загружаем заявки или аналитику при смене вкладки/периода/диапазона
  useEffect(() => {
    const ctrl = new AbortController();
    if (st.view === "list") {
      actions.loadOrders(ctrl.signal);
    } else {
      if (st.period === "custom" && !st.analyticsDateFrom && !st.analyticsDateTo) {
        return;
      }
      actions.loadAnalytics(st.period, ctrl.signal, st.analyticsDateFrom, st.analyticsDateTo);
    }
    return () => ctrl.abort();
  }, [st.view, actions.loadOrders, actions.loadAnalytics, st.period, st.analyticsDateFrom, st.analyticsDateTo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Считаем срочные (urgencyLevel >= 2: 6ч+ без движения) и сообщаем наружу
  useEffect(() => {
    if (!onUrgentCount) return;
    const cnt = st.orders.filter(o => urgencyLevel(o) >= 2).length;
    if (cnt !== prevUrgent.current) {
      prevUrgent.current = cnt;
      onUrgentCount(cnt);
    }
  }, [st.orders, onUrgentCount]);

  return (
    <div className="flex flex-col">
      <StaffRepairViews
        token={token}
        isOwner={isOwner}
        st={st}
        actions={actions}
        initialUrgentFilter={initialUrgentFilter}
      />
      <StaffRepairModals token={token} st={st} actions={actions} />
    </div>
  );
}
