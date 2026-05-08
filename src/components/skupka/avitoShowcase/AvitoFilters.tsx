import Icon from "@/components/ui/icon";
import { Category, Sort } from "./types";

type Props = {
  query: string;
  onSearch: (val: string) => void;
  totalCount: number;
  sort: Sort;
  setSort: (s: Sort) => void;
  categories: Category[];
  activeCat: string;
  onCat: (c: string) => void;
  hasFilter: boolean;
  onReset: () => void;
};

export default function AvitoFilters({
  query,
  onSearch,
  totalCount,
  sort,
  setSort,
  categories,
  activeCat,
  onCat,
  hasFilter,
  onReset,
}: Props) {
  return (
    <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-2 bg-gradient-to-b from-[#0D0D0D] via-[#0D0D0D]/95 to-transparent backdrop-blur-md">
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#FFD700]/60" />
          <input
            value={query}
            onChange={e => onSearch(e.target.value)}
            placeholder="iPhone, MacBook, AirPods..."
            className="w-full bg-[#0D0D0D] border border-[#FFD700]/20 text-white pl-8 pr-8 py-2 font-roboto text-xs rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.2)] transition-all"
          />
          {query && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
            >
              <Icon name="X" size={11} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 px-2 py-2 bg-gradient-to-br from-[#FFD700]/15 to-[#FFD700]/5 border border-[#FFD700]/30 rounded-lg shadow-[inset_0_1px_0_rgba(255,215,0,0.15)]">
          <Icon name="Package" size={12} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-[11px] text-[#FFD700]">{totalCount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-premium pb-1">
        <div className="flex gap-1 shrink-0">
          {([
            { v: "fresh", l: "Свежие", icon: "Sparkles" },
            { v: "price_asc", l: "Дешевле", icon: "ArrowDownNarrowWide" },
            { v: "price_desc", l: "Дороже", icon: "ArrowUpWideNarrow" },
          ] as const).map(s => (
            <button
              key={s.v}
              onClick={() => setSort(s.v)}
              className={`shrink-0 flex items-center gap-1 text-[10px] font-roboto px-2 py-1 rounded transition-all uppercase tracking-wide ${
                sort === s.v
                  ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                  : "text-white/55 hover:text-white border border-white/10 hover:border-[#FFD700]/40"
              }`}
            >
              <Icon name={s.icon} size={10} />
              {s.l}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="w-px h-5 bg-white/10 shrink-0 mx-0.5" />
        )}

        {categories.map(c => (
          <button
            key={c.name}
            onClick={() => onCat(c.name)}
            className={`shrink-0 text-[10px] font-roboto px-2.5 py-1 rounded transition-all uppercase tracking-wide ${
              activeCat === c.name
                ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                : "text-white/50 hover:text-white border border-white/10 hover:border-[#FFD700]/40"
            }`}
          >
            {c.name} <span className="opacity-60">·{c.count}</span>
          </button>
        ))}
      </div>

      {hasFilter && (
        <button
          onClick={onReset}
          className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-[#FFD700] transition-colors"
        >
          <Icon name="X" size={10} />
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
