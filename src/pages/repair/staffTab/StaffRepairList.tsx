import Icon from "@/components/ui/icon";
import { STATUSES, Order, EMPTY_FORM, INP, LBL } from "../types";
import StaffRepairOrderCard from "../StaffRepairOrderCard";
import { EditForm } from "./staffTabTypes";

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
};

export default function StaffRepairList({
  orders, loading, filterStatus, setFilterStatus, statusCounts,
  showForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm, initEditForm,
  saving, saveError, setSaveError, isOwner, token,
  changeStatus, openReadyModal, issueOrder, saveCard, deleteOrder,
}: Props) {
  return (
    <>
      {/* Фильтры статуса — premium chips */}
      <div className="px-3 py-2.5 flex gap-1.5 flex-wrap border-b border-[#1A1A1A] bg-[#0A0A0A]">
        <button onClick={() => setFilterStatus("all")}
          className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
            filterStatus === "all"
              ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
              : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
          }`}>
          <Icon name="Inbox" size={11} />
          Все <span className={filterStatus === "all" ? "opacity-70" : "opacity-50"}>({orders.length})</span>
        </button>
        {STATUSES.map(s => {
          const active = filterStatus === s.key;
          const cnt = statusCounts[s.key] || 0;
          return (
            <button key={s.key} onClick={() => setFilterStatus(s.key)}
              className={`font-roboto text-[11px] px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1.5 ${
                active
                  ? `${s.color} ring-1 ring-current font-bold`
                  : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#333]"
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${active ? "animate-pulse" : ""}`} />
              {s.label}
              {cnt > 0 && <span className={active ? "opacity-70" : "opacity-50"}>({cnt})</span>}
            </button>
          );
        })}
      </div>

      {/* Форма новой заявки */}
      {showForm && (
        <div className="mx-3 mt-3 mb-1 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#FFD700]/30 p-4 space-y-3 rounded-lg shadow-xl shadow-[#FFD700]/5 animate-in slide-in-from-top-2 duration-300">
          <div className="font-oswald font-bold text-[#FFD700] text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Icon name="FilePlus" size={12} /> Новая заявка на ремонт
          </div>
          <div>
            <label className={LBL}>Имя клиента *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={INP} />
          </div>
          <div>
            <label className={LBL}>Телефон *</label>
            <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={INP} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LBL}>Модель</label>
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14" className={INP} /></div>
            <div><label className={LBL}>Тип ремонта</label>
              <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Дисплей..." className={INP} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LBL}>Стоимость (₽)</label>
              <input type="number" inputMode="numeric" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={INP} /></div>
            <div><label className={LBL}>Комментарий</label>
              <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Описание..." className={INP} /></div>
          </div>
          <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
            className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            <Icon name="Check" size={15} />{creating ? "Создаю..." : "Создать заявку"}
          </button>
        </div>
      )}

      {/* Карточки */}
      <div className="px-3 py-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-14 gap-2 text-white/40">
            <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
            <span className="font-roboto text-sm">Загружаю заявки...</span>
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="text-center py-14 px-4">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#222] rounded-full flex items-center justify-center">
              <Icon name="Inbox" size={28} className="text-white/20" />
            </div>
            <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">Заявок нет</div>
            <div className="font-roboto text-white/30 text-xs">Попробуйте изменить фильтры или создать новую заявку</div>
          </div>
        )}
        {orders.map(o => {
          const isExpanded = expandedId === o.id;
          const ef = editForm[o.id] || initEditForm(o);
          return (
            <StaffRepairOrderCard
              key={o.id}
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
          );
        })}
      </div>
    </>
  );
}
