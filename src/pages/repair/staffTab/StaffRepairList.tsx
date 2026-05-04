import { useMemo } from "react";
import Icon from "@/components/ui/icon";
import { STATUSES, Order, EMPTY_FORM, INP, LBL } from "../types";
import StaffRepairOrderCard from "../StaffRepairOrderCard";
import { EditForm } from "./staffTabTypes";

// Возраст принятой заявки в часах (от created_at)
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
  cardsView?: "grid" | "list";
};

export default function StaffRepairList({
  orders, loading, filterStatus, setFilterStatus, statusCounts,
  showForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder,
  cardsView = "list",
}: Props) {
  // На мобильном (md и ниже) всегда 1 колонка, на десктопе — зависит от cardsView
  const containerCls = cardsView === "grid"
    ? "px-3 py-3 grid gap-2.5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    : "px-3 py-3 space-y-2.5";

  // Сортировка: сначала "Принята" по убыванию срочности (старше → выше),
  // затем остальные по дате создания (свежие выше). Стабильно через index.
  const sortedOrders = useMemo(() => {
    return orders
      .map((o, i) => ({ o, i }))
      .sort((a, b) => {
        const la = urgencyLevel(a.o);
        const lb = urgencyLevel(b.o);
        const aIsNew = la >= 0;
        const bIsNew = lb >= 0;
        if (aIsNew && bIsNew) {
          if (lb !== la) return lb - la; // выше уровень срочности — выше в списке
          return ageHours(b.o) - ageHours(a.o); // внутри одного уровня — старше выше
        }
        if (aIsNew) return -1;
        if (bIsNew) return 1;
        // обе не "Принята" — по дате (свежие выше)
        const ta = a.o.created_at ? new Date(a.o.created_at).getTime() : 0;
        const tb = b.o.created_at ? new Date(b.o.created_at).getTime() : 0;
        if (tb !== ta) return tb - ta;
        return a.i - b.i; // стабильность
      })
      .map(x => x.o);
  }, [orders]);
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

              <div className="relative">
                <label className={LBL}>Имя клиента *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={INP} />
              </div>
              <div className="relative">
                <label className={LBL}>Телефон *</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={INP} />
              </div>
              <div className="relative grid grid-cols-2 gap-2">
                <div><label className={LBL}>Модель</label>
                  <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14" className={INP} /></div>
                <div><label className={LBL}>Тип ремонта</label>
                  <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Дисплей..." className={INP} /></div>
              </div>
              <div className="relative grid grid-cols-2 gap-2">
                <div><label className={LBL}>Стоимость (₽)</label>
                  <input type="number" inputMode="numeric" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={INP} /></div>
                <div><label className={LBL}>Комментарий</label>
                  <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Описание..." className={INP} /></div>
              </div>
              <button
                onClick={createOrder}
                disabled={creating || !form.name || !form.phone}
                title="Создать заявку и добавить в список"
                className="relative w-full btn-gold-premium !py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name={creating ? "Loader" : "Check"} size={15} className={creating ? "animate-spin" : ""} />
                {creating ? "Создаю..." : "Создать заявку"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Карточки — премиум-список или сетка (адаптивно по cardsView) */}
      <div className={containerCls}>
        {loading && (
          <div className="col-span-full flex items-center justify-center py-14 gap-2 text-white/50">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-md animate-pulse" />
              <Icon name="Loader" size={20} className="relative animate-spin text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.7)]" />
            </div>
            <span className="font-roboto text-sm">Загружаю заявки...</span>
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="col-span-full text-center py-14 px-4">
            <div className="relative inline-block">
              <span className="absolute inset-0 rounded-full bg-[#FFD700]/15 blur-2xl pointer-events-none" />
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.3)]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex items-center justify-center">
                  <Icon name="Inbox" size={26} className="text-[#FFD700]/70" />
                </div>
              </div>
            </div>
            <div className="font-oswald font-bold uppercase text-base mb-1 bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
              Заявок нет
            </div>
            <div className="font-roboto text-white/40 text-xs">Попробуйте изменить фильтры или создать новую заявку</div>
          </div>
        )}
        {sortedOrders.map(o => {
          const isExpanded = expandedId === o.id;
          const ef = editForm[o.id] || initEditForm(o);
          // В режиме сетки раскрытая карточка занимает всю ширину строки
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
              />
            </div>
          );
        })}
      </div>
    </>
  );
}