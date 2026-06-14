import StaffRepairAnalytics from "../StaffRepairAnalytics";
import LaborPricesTab from "@/components/admin/repair/LaborPricesTab";
import RepairImportTab from "@/components/admin/repair/RepairImportTab";
import StaffRepairToolbar from "./StaffRepairToolbar";
import StaffRepairSearchBar from "./StaffRepairSearchBar";
import StaffRepairList from "./StaffRepairList";
import type { StaffRepairState } from "./useStaffRepairState";
import type { StaffRepairActions } from "./useStaffRepairActions";

/**
 * Все views (Toolbar / SearchBar / Analytics / List / LaborPrices / Import).
 * Вынесено из StaffRepairTab.tsx 1:1 без изменения логики.
 */
export default function StaffRepairViews({
  token,
  isOwner,
  st,
  actions,
  initialUrgentFilter,
}: {
  token: string;
  isOwner: boolean;
  st: StaffRepairState;
  actions: StaffRepairActions;
  initialUrgentFilter?: boolean;
}) {
  // ─── Счётчики статусов ───────────────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  st.orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <>
      {/* ── Premium переключатель вида ── */}
      <StaffRepairToolbar
        view={st.view}
        setView={st.setView}
        isOwner={isOwner}
        showForm={st.showForm}
        setShowForm={st.setShowForm}
        setForm={st.setForm}
        cardsView={st.cardsView}
        setCardsView={st.setCardsView}
      />

      {/* ── Поиск + период ── */}
      {st.view === "list" && (
        <StaffRepairSearchBar
          search={st.search}
          setSearch={st.setSearch}
          dateFrom={st.dateFrom}
          setDateFrom={st.setDateFrom}
          dateTo={st.dateTo}
          setDateTo={st.setDateTo}
          loading={st.loading}
          loadOrders={actions.loadOrders}
        />
      )}

      {/* ── АНАЛИТИКА ── */}
      {st.view === "analytics" && (
        <StaffRepairAnalytics
          analytics={st.analytics}
          analyticsLoading={st.analyticsLoading}
          period={st.period}
          stats={st.stats}
          dateFrom={st.analyticsDateFrom}
          dateTo={st.analyticsDateTo}
          onPeriodChange={st.setPeriod}
          onDateFromChange={st.setAnalyticsDateFrom}
          onDateToChange={st.setAnalyticsDateTo}
          onRefresh={() => actions.loadAnalytics(st.period, undefined, st.analyticsDateFrom, st.analyticsDateTo)}
          onShowHistory={() => st.setShowHistory(true)}
          onShowOrders={(p) => st.setOrdersModal(p)}
        />
      )}

      {/* ── СПИСОК ЗАЯВОК ── */}
      {st.view === "list" && (
        <StaffRepairList
          orders={st.orders}
          loading={st.loading}
          filterStatus={st.filterStatus}
          setFilterStatus={st.setFilterStatus}
          statusCounts={statusCounts}
          showForm={st.showForm}
          form={st.form}
          setForm={st.setForm}
          creating={st.creating}
          createOrder={actions.createOrder}
          expandedId={st.expandedId}
          setExpandedId={st.setExpandedId}
          editForm={st.editForm}
          setEditForm={st.setEditForm}
          initEditForm={actions.initEditForm}
          saving={st.saving}
          saveError={st.saveError}
          setSaveError={st.setSaveError}
          isOwner={isOwner}
          token={token}
          changeStatus={actions.changeStatus}
          openReadyModal={actions.openReadyModal}
          issueOrder={actions.issueOrder}
          saveCard={actions.saveCard}
          deleteOrder={actions.deleteOrder}
          callRobotReady={actions.callRobotReady}
          inviteToMax={actions.inviteToMax}
          cardsView={st.cardsView}
          initialUrgentFilter={initialUrgentFilter}
        />
      )}

      {/* ── Цены работ (только owner) ── */}
      {st.view === "labor_prices" && isOwner && (
        <div className="flex-1 overflow-y-auto">
          <LaborPricesTab token={token} authHeader="X-Employee-Token" />
        </div>
      )}

      {/* ── Импорт Excel (только owner) ── */}
      {st.view === "import_parts" && isOwner && (
        <RepairImportTab token={token} />
      )}
    </>
  );
}