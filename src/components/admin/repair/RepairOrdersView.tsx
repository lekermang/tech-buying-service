import Icon from "@/components/ui/icon";
import { STATUSES, Order, EditForm, EMPTY_FORM, EMPTY_READY } from "./repairTypes";
import RepairOrderCard from "./RepairOrderCard";

type Props = {
  orders: Order[];
  loading: boolean;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  creating: boolean;
  createOrder: () => void;
  expandedId: number | null;
  setExpandedId: (v: number | null) => void;
  editForm: Record<number, EditForm>;
  setEditForm: React.Dispatch<React.SetStateAction<Record<number, EditForm>>>;
  saving: boolean;
  saveError: string | null;
  setSaveError: (v: string | null) => void;
  token: string;
  updateStatus: (id: number, status: string, extra?: Partial<EditForm>) => Promise<boolean>;
  openReadyModal: (o: Order) => void;
  saveEdit: (o: Order) => void;
  deleteOrder: (id: number) => void;
};

export default function RepairOrdersView({
  orders, loading, filterStatus, setFilterStatus,
  showForm, setShowForm, form, setForm, creating, createOrder,
  expandedId, setExpandedId, editForm, setEditForm,
  saving, saveError, setSaveError, token,
  updateStatus, openReadyModal, saveEdit, deleteOrder,
}: Props) {
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const inp = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
  const lbl = "font-roboto text-white/40 text-[10px] block mb-1";

  return (
    <>
      {/* Фильтры по статусу */}
      <div className="px-4 py-2 flex gap-1.5 flex-wrap border-b border-[#222]">
        <button onClick={() => setFilterStatus("all")}
          className={`font-roboto text-xs px-2.5 py-1 border transition-colors ${filterStatus === "all" ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
          Все ({orders.length})
        </button>
        {STATUSES.map(s => (
          <button key={s.key} onClick={() => setFilterStatus(s.key)}
            className={`font-roboto text-xs px-2.5 py-1 border transition-colors flex items-center gap-1 ${filterStatus === s.key ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
            {statusCounts[s.key] ? <span className="text-[10px] opacity-60">({statusCounts[s.key]})</span> : null}
          </button>
        ))}
      </div>

      {/* Форма создания */}
      {showForm && (
        <div className="mx-4 mt-3 mb-1 bg-[#1A1A1A] border border-[#FFD700]/30 p-4">
          <div className="font-roboto text-white/50 text-[10px] uppercase tracking-widest mb-3">Новая заявка на ремонт</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Имя клиента *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" className={inp} />
            </div>
            <div>
              <label className={lbl}>Телефон *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 999 123-45-67" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Модель устройства</label>
              <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="iPhone 14, Samsung A54..." className={inp} />
            </div>
            <div>
              <label className={lbl}>Тип ремонта</label>
              <input value={form.repair_type} onChange={e => setForm(p => ({ ...p, repair_type: e.target.value }))} placeholder="Замена дисплея, зарядка..." className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className={lbl}>Стоимость (₽)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="1500" className={inp} />
            </div>
            <div>
              <label className={lbl}>Комментарий</label>
              <input value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} placeholder="Разбитый экран..." className={inp} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={createOrder} disabled={creating || !form.name || !form.phone}
              className="bg-[#FFD700] text-black font-oswald font-bold px-5 py-2 uppercase text-xs hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <Icon name="Check" size={13} />{creating ? "Создаю..." : "Создать заявку"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="text-white/30 font-roboto text-xs hover:text-white transition-colors px-2">Отмена</button>
          </div>
        </div>
      )}

      {/* Список заявок */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <div className="text-center py-10 text-white/30 font-roboto text-sm">Загружаю...</div>}
        {!loading && orders.length === 0 && (
          <div className="text-center py-10 text-white/30 font-roboto text-sm">Заявок нет</div>
        )}
        {orders.map((o) => {
          const isExpanded = expandedId === o.id;
          const ef = editForm[o.id] || {
            purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
            repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
            parts_name: o.parts_name || "",
            admin_note: o.admin_note || "",
          };
          return (
            <div key={o.id} id={`order-${o.id}`} className={`scroll-mt-24 ${isExpanded ? "ring-2 ring-[#FFD700]/30 rounded" : ""}`}>
            <RepairOrderCard
              o={o}
              isExpanded={isExpanded}
              ef={ef}
              saving={saving}
              saveError={saveError}
              token={token}
              authHeader="X-Admin-Token"
              onToggle={() => {
                setExpandedId(isExpanded ? null : o.id);
                setSaveError(null);
                if (!isExpanded) setEditForm(prev => ({ ...prev, [o.id]: {
                  purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
                  repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
                  parts_name: o.parts_name || "",
                  admin_note: o.admin_note || "",
                }}));
              }}
              onEditFormChange={(id, newEf) => setEditForm(prev => ({ ...prev, [id]: newEf }))}
              onUpdateStatus={updateStatus}
              onOpenReadyModal={openReadyModal}
              onSaveEdit={saveEdit}
              onDelete={deleteOrder}
            />
            </div>
          );
        })}
      </div>
    </>
  );
}