import { useMemo, useState } from "react";
import Icon from "@/components/ui/icon";
import { STATUSES, Order, EMPTY_FORM, INP, LBL } from "../types";
import StaffRepairOrderCard from "../StaffRepairOrderCard";
import { EditForm } from "./staffTabTypes";

type SortMode = "urgency" | "date_desc" | "date_asc" | "price_desc" | "price_asc";
type GroupMode = "none" | "time" | "status" | "paid";

// Возраст заявки в часах
function ageHoursAny(o: Order): number {
  if (!o.created_at) return -1;
  const t = new Date(o.created_at).getTime();
  if (!Number.isFinite(t)) return -1;
  return (Date.now() - t) / 3_600_000;
}

function ageHours(o: Order): number {
  if (o.status !== "new" || !o.created_at) return -1;
  const t = new Date(o.created_at).getTime();
  if (!Number.isFinite(t)) return -1;
  return (Date.now() - t) / 3_600_000;
}

// Уровень срочности: 0..5 (5 — критично, 48ч+). Не-новые → -1.
function urgencyLevel(o: Order): number {
  const h = ageHours(o);
  if (h < 0) return -1;
  if (h >= 48) return 5;
  if (h >= 24) return 4;
  if (h >= 12) return 3;
  if (h >= 6) return 2;
  if (h >= 3) return 1;
  return 0;
}

// Временная группа заявки
type TimeGroup = "critical" | "today" | "yesterday" | "week" | "older";
function getTimeGroup(o: Order): TimeGroup {
  const h = ageHoursAny(o);
  if (h < 0) return "older";
  // Срочные новые (>6ч без движения)
  if (o.status === "new" && h >= 6) return "critical";
  if (h < 24) return "today";
  if (h < 48) return "yesterday";
  if (h < 168) return "week";
  return "older";
}

const TIME_GROUP_META: Record<TimeGroup, { label: string; color: string; icon: string; desc?: string }> = {
  critical:  { label: "🚨 Требуют внимания",  color: "#ef4444", icon: "AlertTriangle", desc: "Новые заявки > 6 часов без движения" },
  today:     { label: "Сегодня",              color: "#FFD700", icon: "Clock",         desc: undefined },
  yesterday: { label: "Вчера",               color: "#a78bfa", icon: "CalendarDays",  desc: undefined },
  week:      { label: "Эта неделя",           color: "#60a5fa", icon: "Calendar",      desc: undefined },
  older:     { label: "Старше недели",        color: "#6b7280", icon: "Archive",       desc: undefined },
};

type Props = {
  orders: Order[];
  loading: boolean;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  statusCounts: Record<string, number>;
  showForm: boolean;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  creating: boolean;
  createOrder: () => void;
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
  cardsView?: "grid" | "list";
};

export default function StaffRepairList({
  orders, loading, filterStatus, setFilterStatus, statusCounts,
  showForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder, callRobotReady, inviteToMax,
  cardsView = "list",
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("urgency");
  const [groupMode, setGroupMode] = useState<GroupMode>("time");

  const containerCls = cardsView === "grid"
    ? "px-2 py-1 grid gap-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    : "px-2 py-1 space-y-1";

  const sortedOrders = useMemo(() => {
    return orders
      .map((o, i) => ({ o, i }))
      .sort((a, b) => {
        if (sortMode === "urgency") {
          const la = urgencyLevel(a.o);
          const lb = urgencyLevel(b.o);
          const aIsNew = la >= 0;
          const bIsNew = lb >= 0;
          if (aIsNew && bIsNew) {
            if (lb !== la) return lb - la;
            return ageHours(b.o) - ageHours(a.o);
          }
          if (aIsNew) return -1;
          if (bIsNew) return 1;
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          if (tb !== ta) return tb - ta;
          return a.i - b.i;
        }
        if (sortMode === "date_desc") {
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          return tb - ta;
        }
        if (sortMode === "date_asc") {
          const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
          const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
          return ta - tb;
        }
        if (sortMode === "price_desc") {
          const pa = a.o.repair_amount ?? a.o.price ?? 0;
          const pb = b.o.repair_amount ?? b.o.price ?? 0;
          return pb - pa;
        }
        if (sortMode === "price_asc") {
          const pa = a.o.repair_amount ?? a.o.price ?? 0;
          const pb = b.o.repair_amount ?? b.o.price ?? 0;
          return pa - pb;
        }
        return a.i - b.i;
      })
      .map(x => x.o);
  }, [orders, sortMode]);

  // Группировка
  const groupedOrders = useMemo(() => {
    if (groupMode === "none") {
      return [{ key: "", label: "", color: "", icon: "", desc: "", orders: sortedOrders }];
    }
    if (groupMode === "time") {
      const ORDER: TimeGroup[] = ["critical", "today", "yesterday", "week", "older"];
      const map = new Map<TimeGroup, Order[]>(ORDER.map(k => [k, []]));
      for (const o of sortedOrders) map.get(getTimeGroup(o))!.push(o);
      return ORDER
        .filter(k => map.get(k)!.length > 0)
        .map(k => {
          const meta = TIME_GROUP_META[k];
          return { key: k, label: meta.label, color: meta.color, icon: meta.icon, desc: meta.desc || "", orders: map.get(k)! };
        });
    }
    if (groupMode === "status") {
      const map = new Map<string, Order[]>();
      for (const o of sortedOrders) {
        if (!map.has(o.status)) map.set(o.status, []);
        map.get(o.status)!.push(o);
      }
      return Array.from(map.entries()).map(([key, orders]) => {
        const st = STATUSES.find(s => s.key === key);
        return { key, label: st?.label || key, color: "#888", icon: "Circle", desc: "", orders };
      });
    }
    if (groupMode === "paid") {
      const paid = sortedOrders.filter(o => o.is_paid);
      const unpaid = sortedOrders.filter(o => !o.is_paid);
      return [
        { key: "unpaid", label: "Не оплачено", color: "#fb923c", icon: "Clock", desc: "", orders: unpaid },
        { key: "paid",   label: "Оплачено",    color: "#34d399", icon: "CheckCircle", desc: "", orders: paid },
      ].filter(g => g.orders.length > 0);
    }
    return [{ key: "", label: "", color: "", icon: "", desc: "", orders: sortedOrders }];
  }, [sortedOrders, groupMode]);
  return (
    <>
      {/* Фильтры статуса — премиум chips с свечениями */}
      <div className="relative px-3 py-2.5 flex gap-1.5 flex-wrap">
        <div className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.18),transparent)] pointer-events-none" />
        <button onClick={() => setFilterStatus("all")}
          title={`Показать все заявки (${orders.length})`}
          className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 overflow-hidden group ${
            filterStatus === "all"
              ? "bg-gradient-to-b from-[#FFE34D] via-[#FFD700] to-[#d4a017] text-black font-bold shadow-[0_3px_12px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]"
              : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/60 hover:text-[#FFD700] hover:border-[#FFD700]/40 hover:shadow-[0_0_10px_rgba(255,215,0,0.18)]"
          }`}>
          {filterStatus === "all" && <span aria-hidden className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />}
          <Icon name="Inbox" size={11} />
          <span className="relative">Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span></span>
        </button>
        {STATUSES.map(s => {
          const active = filterStatus === s.key;
          const cnt = statusCounts[s.key] || 0;
          return (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              title={`Фильтр: ${s.label}${cnt > 0 ? ` (${cnt})` : ""}`}
              className={`relative font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 inline-flex items-center gap-1.5 overflow-hidden group ${
                active
                  ? `${s.color} ring-1 ring-current font-bold shadow-[0_2px_10px_currentColor] brightness-110`
                  : "bg-gradient-to-br from-[#141414] to-[#0E0E0E] border border-[#1F1F1F] text-white/55 hover:text-white hover:border-[#FFD700]/30 hover:shadow-[0_0_8px_rgba(255,215,0,0.15)]"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? "animate-pulse shadow-[0_0_6px_currentColor]" : ""}`} />
              {s.label}
              {cnt > 0 && <span className={active ? "opacity-80" : "opacity-50"}>({cnt})</span>}
            </button>
          );
        })}
      </div>

      {/* Форма новой заявки — премиум */}
      {showForm && (
        <div className="relative mx-3 mt-3 mb-1 rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* HALO ореол */}
          <div className="absolute -inset-2 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(closest-side,rgba(255,215,0,0.20),transparent 75%)", filter: "blur(14px)" }} />
          {/* Conic-gradient рамка */}
          <div className="relative p-[1.5px] rounded-xl bg-[conic-gradient(from_180deg_at_50%_50%,rgba(255,215,0,0.6)_0deg,rgba(255,215,0,0.15)_180deg,rgba(255,243,160,0.6)_360deg)] shadow-[0_8px_28px_rgba(255,215,0,0.18)]">
            <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#141414] to-[#0E0E0E] p-4 space-y-3 rounded-[10px] overflow-hidden">
              {/* Декор */}
              <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.10)" }} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent pointer-events-none" />

              <div className="relative flex items-center gap-2">
                {/* Conic-медальон */}
                <div className="relative w-8 h-8 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.4)] shrink-0">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                    <Icon name="FilePlus" size={13} className="text-[#FFD700] drop-shadow-[0_0_4px_rgba(255,215,0,0.7)]" />
                  </div>
                </div>
                <div className="font-oswald font-bold text-xs uppercase tracking-widest bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
                  Новая заявка на ремонт
                </div>
              </div>

              {/* ── Блок 1: Модель (САМОЕ ВАЖНОЕ — первым) ── */}
              <div className="relative">
                <label className={LBL}>
                  Модель устройства <span className="text-[#FFD700]">*</span>
                </label>
                <input
                  value={form.model}
                  onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
                  placeholder="iPhone 15 Pro, Samsung S24, Redmi 12..."
                  className={INP + (!form.model ? " border-[#FFD700]/30" : "")}
                  autoFocus
                />
                {!form.model && (
                  <span className="absolute right-2 top-7 text-[10px] text-[#FFD700]/60 font-roboto pointer-events-none">обязательно</span>
                )}
              </div>

              {/* ── Блок 2: Клиент ── */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <label className={LBL}>Имя клиента <span className="text-white/40">*</span></label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван" className={INP} />
                </div>
                <div className="relative">
                  <label className={LBL}>
                    Телефон <span className="text-[#FFD700]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+7 999 123-45-67"
                    className={INP + (!form.phone ? " border-[#FFD700]/30" : "")}
                  />
                  {!form.phone && (
                    <span className="absolute right-2 top-7 text-[10px] text-[#FFD700]/60 font-roboto pointer-events-none">обязательно</span>
                  )}
                </div>
              </div>

              {/* ── Блок 3: тип ремонта + стоимость ── */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LBL}>Причина / что делать</label>
                  <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Дисплей, батарея..." className={INP} />
                </div>
                <div>
                  <label className={LBL}>Стоимость (₽)</label>
                  <input type="number" inputMode="numeric" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1 500" className={INP} />
                </div>
              </div>

              {/* ── Блок 4: комментарий ── */}
              <div>
                <label className={LBL}>Описание проблемы</label>
                <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Не включается, разбит экран..." className={INP} />
              </div>

              <button
                onClick={createOrder}
                disabled={creating || !form.name || !form.phone || !form.model}
                title={!form.model ? "Укажите модель устройства" : !form.phone ? "Укажите телефон клиента" : "Создать заявку"}
                className="relative w-full btn-gold-premium !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Icon name={creating ? "Loader" : "Check"} size={15} className={creating ? "animate-spin" : ""} />
                {creating ? "Создаю..." : (!form.model ? "Введите модель устройства" : !form.phone ? "Введите телефон клиента" : "Создать заявку")}
              </button>
            </div>
          </div>
        </div>
      )}

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
          {sortedOrders.length} заявок
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
      {!loading && orders.length === 0 && (
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