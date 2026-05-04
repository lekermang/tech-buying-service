import Icon from "@/components/ui/icon";

type StatusFilter = "all" | "active" | "inactive";

type Props = {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  roleFilter: string;
  setRoleFilter: (v: string) => void;
};

export default function EmployeesFilters({
  search, setSearch, statusFilter, setStatusFilter, roleFilter, setRoleFilter,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по ФИО, логину, email, телефону, должности"
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {[
          { v: "all", l: "Все" },
          { v: "active", l: "Активные" },
          { v: "inactive", l: "Неактивные" },
        ].map(s => {
          const a = statusFilter === s.v;
          return (
            <button key={s.v} onClick={() => setStatusFilter(s.v as StatusFilter)}
              className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                a ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
              }`}>{s.l}</button>
          );
        })}
        <span className="text-white/15">|</span>
        {[
          { v: "all", l: "Все роли" },
          { v: "owner", l: "👑" },
          { v: "admin", l: "🛡️" },
          { v: "master", l: "🔧" },
          { v: "staff", l: "👤" },
        ].map(s => {
          const a = roleFilter === s.v;
          return (
            <button key={s.v} onClick={() => setRoleFilter(s.v)}
              className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                a ? "bg-blue-500/30 border border-blue-400 text-blue-200 font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
              }`}>{s.l}</button>
          );
        })}
      </div>
    </div>
  );
}
