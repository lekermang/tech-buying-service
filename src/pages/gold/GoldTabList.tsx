import Icon from "@/components/ui/icon";
import { GoldOrder } from "./types";
import GoldOrderCard from "./GoldOrderCard";

type EditForm = {
  name: string; phone: string; item_name: string; weight: string;
  purity: string; buy_price: string; sell_price: string;
  comment: string; admin_note: string; payment_method: string;
};

type Props = {
  orders: GoldOrder[];
  loading: boolean;
  expandedId: number | null;
  onToggle: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onSave: (order: GoldOrder, ef: EditForm) => void;
  onDelete: (id: number) => void;
  saving: boolean;
  saveError: string | null;
};

export default function GoldTabList({
  orders, loading, expandedId, onToggle, onStatusChange, onSave, onDelete, saving, saveError,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
      {loading && (
        <div className="flex items-center justify-center py-14 gap-2 text-white/40">
          <Icon name="Loader" size={18} className="animate-spin text-[#FFD700]" />
          <span className="font-roboto text-sm">Загружаю заявки...</span>
        </div>
      )}
      {!loading && orders.length === 0 && (
        <div className="text-center py-14 px-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#FFD700]/10 to-[#0D0D0D] border border-[#FFD700]/20 rounded-full flex items-center justify-center">
            <Icon name="Gem" size={28} className="text-[#FFD700]/50" />
          </div>
          <div className="font-oswald font-bold text-white/60 text-base uppercase mb-1">Заявок по золоту нет</div>
          <div className="font-roboto text-white/30 text-xs">Создайте первую заявку кнопкой «+»</div>
        </div>
      )}
      {orders.map(order => (
        <GoldOrderCard
          key={order.id}
          order={order}
          expanded={expandedId === order.id}
          onToggle={() => onToggle(order.id)}
          onStatusChange={onStatusChange}
          onSave={onSave}
          onDelete={onDelete}
          saving={saving}
          saveError={saveError}
        />
      ))}
    </div>
  );
}
