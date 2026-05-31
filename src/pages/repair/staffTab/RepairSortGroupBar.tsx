import Icon from "@/components/ui/icon";
import { Order } from "../types";
import StaffRepairOrderCard from "../StaffRepairOrderCard";
import { EditForm } from "./staffTabTypes";
import { SortMode, GroupMode } from "./repairListUtils";

type GroupEntry = {
  key: string;
  label: string;
  color: string;
  icon: string;
  desc: string;
  orders: Order[];
};

type Props = {
  sortMode: SortMode;
  setSortMode: (v: SortMode) => void;
  groupMode: GroupMode;
  setGroupMode: (v: GroupMode) => void;
  sortedOrdersCount: number;
  groupedOrders: GroupEntry[];
  loading: boolean;
  ordersTotal: number;
  cardsView: "grid" | "list";
  expandedId: number | null;
  setExpandedId: React.Dispatch<React.SetStateAction<number | null>>;
  editForm: Record<number, EditForm>;
  setEditForm: React.Dispatch<React.SetStateAction<Record<number, EditForm>>>;
  initEditForm: (o: Order) => EditForm;
  saving: boolean;
  saveError: string | null;
  setSaveError: (v: string | null) => void;
  isOwner: boolean;
  token: string;
  changeStatus: (id: number, status: string, extra?: Record<string, unknown>) => Promise<boolean>;
  openReadyModal: (o: Order) => void;
  issueOrder: (o: Order, issuedAt?: string) => void;
  saveCard: (o: Order) => void;
  deleteOrder: (id: number) => void;
  callRobotReady?: (id: number) => Promise<boolean>;
  inviteToMax?: (id: number) => Promise<boolean>;
};

export default function RepairSortGroupBar({
  sortMode, setSortMode, groupMode, setGroupMode,
  sortedOrdersCount, groupedOrders, loading, ordersTotal, cardsView,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder,
  callRobotReady, inviteToMax,
}: Props) {
  const containerCls = cardsView === "grid"
    ? "px-2 py-1 grid gap-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    : "px-2 py-1 space-y-1";

  return (
    <>
      {/* ── Панель сортировки и группировки ── */}
      <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
        {/* Сортировка */}
        <div className="flex items-center gap-0.5 bg-[#111] border border-[#1F1F1F] rounded-lg p-0.5">
          {([
            { key: "urgency",    icon: "Flame",       title: "По срочности" },
            { key: "date_desc",  icon: "ArrowDown",   title: "Сначала новые" },
            { key: "date_asc",   icon: "ArrowUp",     title: "Сначала старые" },
            { key: "price_desc", icon: "TrendingUp",  title: "Дорогие сначала" },
            { key: "price_asc",  icon: "TrendingDown",title: "Дешёвые сначала" },
          ] as { key: SortMode; icon: string; title: string }[]).map(s => (
            <button key={s.key} onClick={() => setSortMode(s.key)} title={s.title}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                sortMode === s.key
                  ? "bg-[#FFD700] text-black"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <Icon name={s.icon} size={11} />
            </button>
          ))}
        </div>

        {/* Группировка */}
        <div className="flex items-center gap-0.5 bg-[#111] border border-[#1F1F1F] rounded-lg p-0.5">
          {([
            { key: "time",   icon: "CalendarClock", title: "По времени (сегодня/вчера/неделя)" },
            { key: "none",   icon: "List",          title: "Без группировки" },
            { key: "status", icon: "Layers",        title: "По статусу" },
            { key: "paid",   icon: "Banknote",      title: "По оплате" },
          ] as { key: GroupMode; icon: string; title: string }[]).map(g => (
            <button key={g.key} onClick={() => setGroupMode(g.key)} title={g.title}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                groupMode === g.key
                  ? "bg-white/15 text-white"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <Icon name={g.icon} size={11} />
            </button>
          ))}
        </div>

        <span className="text-[10px] text-white/25 font-roboto ml-auto tabular-nums">
          {sortedOrdersCount} заявок
        </span>
      </div>

      {/* ── Карточки — с группировкой ── */}
      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/50">
          <span className="relative">
            <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
            <Icon name="Loader" size={20} className="relative animate-spin text-[#FFD700]" />
          </span>
          <span className="font-roboto text-sm">Загружаю заявки...</span>
        </div>
      )}
      {!loading && ordersTotal === 0 && (
        <div className="text-center py-14 px-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center">
            <Icon name="Inbox" size={24} className="text-[#FFD700]/60" />
          </div>
          <div className="font-oswald font-bold uppercase text-base mb-1 text-white/50">Заявок нет</div>
          <div className="font-roboto text-white/30 text-xs">Попробуйте изменить фильтры или создать новую заявку</div>
        </div>
      )}

      {!loading && groupedOrders.map(group => (
        <div key={group.key} className="mb-1">
          {/* Заголовок группы */}
          {groupMode !== "none" && group.label && (
            <div
              className="mx-2 mb-1 px-3 py-2 rounded-xl flex items-center gap-2.5"
              style={{
                background: `${group.color}10`,
                border: `1px solid ${group.color}25`,
                borderLeft: `3px solid ${group.color}`,
              }}
            >
              <Icon name={group.icon} size={13} style={{ color: group.color, flexShrink: 0 }} />
              <span className="font-oswald font-bold text-[12px] uppercase tracking-wider" style={{ color: group.color }}>
                {group.label}
              </span>
              {group.desc && (
                <span className="font-roboto text-[10px] text-white/30 hidden sm:block">{group.desc}</span>
              )}
              <span
                className="ml-auto font-oswald font-bold text-[11px] px-2 py-0.5 rounded-md tabular-nums"
                style={{ background: `${group.color}20`, color: group.color }}
              >
                {group.orders.length}
              </span>
            </div>
          )}
          <div className={containerCls}>
            {group.orders.map(o => {
              const isExpanded = expandedId === o.id;
              const ef = editForm[o.id] || initEditForm(o);
              const wrapCls = cardsView === "grid" && isExpanded ? "md:col-span-full" : "";
              return (
                <div key={o.id} className={wrapCls}>
                  <StaffRepairOrderCard
                    o={o}
                    isExpanded={isExpanded}
                    ef={ef}
                    saving={saving}
                    saveError={saveError}
                    isOwner={isOwner}
                    token={token}
                    authHeader="X-Employee-Token"
                    onToggle={() => {
                      const opening = expandedId !== o.id;
                      setExpandedId(opening ? o.id : null);
                      setSaveError(null);
                      if (opening) setEditForm(prev => ({ ...prev, [o.id]: initEditForm(o) }));
                    }}
                    onEditFormChange={(id, newEf) => setEditForm(prev => ({ ...prev, [id]: newEf }))}
                    onChangeStatus={(id, status, extra) => {
                      changeStatus(id, status, extra);
                      setExpandedId(null);
                    }}
                    onOpenReadyModal={openReadyModal}
                    onIssueOrder={issueOrder}
                    onSaveCard={saveCard}
                    onDelete={deleteOrder}
                    onCallRobotReady={callRobotReady}
                    onInviteToMax={inviteToMax}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
