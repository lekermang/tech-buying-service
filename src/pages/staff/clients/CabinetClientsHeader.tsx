import Icon from "@/components/ui/icon";
import type { Filter } from "./cabinetClientsTypes";

type Props = {
  total: number;
  loading: boolean;
  onReload: () => void;
  q: string;
  setQ: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
};

export default function CabinetClientsHeader({
  total,
  loading,
  onReload,
  q,
  setQ,
  filter,
  setFilter,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#FFD700]/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center">
          <Icon name="UserCircle" size={18} className="text-[#FFD700]" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-bold text-white">Клиенты кабинета</div>
          <div className="text-[11px] text-white/40">
            Зарегистрированные через личный кабинет · {total} всего
          </div>
        </div>
        <button
          onClick={onReload}
          className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-[#FFD700]"
          title="Обновить"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Icon
            name="Search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Имя, телефон, email, паспорт..."
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white pl-9 pr-3 py-2 rounded-lg text-[13px] focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="bg-[#0A0A0A] border border-[#1F1F1F] text-white px-3 py-2 rounded-lg text-[13px] focus:outline-none focus:border-[#FFD700]/40"
        >
          <option value="">Все клиенты</option>
          <option value="with_email">С email</option>
          <option value="verified">Email подтверждён</option>
          <option value="no_passport">Без паспорта</option>
        </select>
      </div>
    </div>
  );
}
