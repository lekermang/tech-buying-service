import Icon from "@/components/ui/icon";
import { AvitoProduct, FilterMode, Stats, formatPrice } from "./types";

type Props = {
  query: string;
  onSearch: (val: string) => void;
  filter: FilterMode;
  setFilter: (f: FilterMode) => void;
  stats: Stats;
  loading: boolean;
  items: AvitoProduct[];
  onEdit: (it: AvitoProduct) => void;
};

export default function SLAvitoGrid({ query, onSearch, filter, setFilter, stats, loading, items, onEdit }: Props) {
  return (
    <>
      {/* Sticky фильтры */}
      <div className="sticky top-0 z-10 bg-[#0D0D0D]/95 backdrop-blur-md py-2 -mx-1 px-1 border-b border-white/5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Icon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={e => onSearch(e.target.value)}
              placeholder="Поиск по названию или ID..."
              className="w-full bg-[#0D0D0D] border border-white/15 text-white pl-8 pr-8 py-2 font-roboto text-sm rounded-lg focus:outline-none focus:border-[#FFD700] focus:shadow-[0_0_12px_rgba(255,215,0,0.15)] transition-all"
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
          <div className="flex gap-1">
            {([
              { k: "no", l: "Без фото", n: stats.no_photos, icon: "ImagePlus" },
              { k: "yes", l: "С фото", n: stats.with_photos, icon: "ImageCheck" },
              { k: "all", l: "Все", n: stats.total_active, icon: "Layers" },
            ] as const).map(b => (
              <button
                key={b.k}
                onClick={() => setFilter(b.k)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-roboto px-3 py-2 rounded-lg transition-all ${
                  filter === b.k
                    ? "bg-[#FFD700] text-black font-semibold shadow-[0_0_10px_rgba(255,215,0,0.35)]"
                    : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
                }`}
              >
                <Icon name={b.icon} size={12} />
                <span className="hidden sm:inline">{b.l}</span>
                <span className="opacity-70 text-[10px]">·{b.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <Icon
            name={filter === "no" ? "PartyPopper" : "PackageOpen"}
            size={32}
            className="text-[#FFD700]/50 mx-auto mb-2"
          />
          <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide">
            {filter === "no" ? "Все товары с фото" : "Ничего не найдено"}
          </div>
          <div className="text-white/40 font-roboto text-[11px] mt-1">
            {filter === "no"
              ? "Витрина полностью оформлена — отличная работа!"
              : "Попробуйте изменить фильтр или запрос"}
          </div>
        </div>
      )}

      {/* Сетка товаров */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => onEdit(it)}
            style={{ animationDelay: `${Math.min(idx * 25, 300)}ms` }}
            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#FFD700]/60 rounded-lg overflow-hidden text-left transition-all hover:shadow-[0_4px_20px_rgba(255,215,0,0.15)] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
          >
            <div className="relative aspect-square bg-[#0D0D0D]">
              {it.main_photo ? (
                <>
                  <img src={it.main_photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent border border-dashed border-orange-400/40">
                  <Icon name="ImagePlus" size={28} className="text-orange-400/80" />
                  <span className="text-[9px] text-orange-300/90 font-roboto uppercase tracking-wide font-semibold">
                    Добавить фото
                  </span>
                </div>
              )}
              {it.photos.length > 0 && (
                <div className="absolute top-1 right-1 bg-emerald-500/95 text-white font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded shadow-md flex items-center gap-0.5">
                  <Icon name="Images" size={10} />
                  {it.photos.length}
                </div>
              )}
              {!it.is_visible && (
                <div className="absolute top-1 left-1 bg-red-600/95 text-white font-roboto text-[9px] px-1.5 py-0.5 rounded uppercase shadow-md flex items-center gap-0.5">
                  <Icon name="EyeOff" size={9} />
                  скрыт
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-2 py-1 rounded uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Icon name={it.main_photo ? "Pencil" : "Camera"} size={10} />
                  {it.main_photo ? "Изменить" : "Сфото"}
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="font-roboto text-[11px] text-white truncate">{it.title}</div>
              <div className="flex items-center justify-between mt-0.5">
                <div className="font-oswald font-bold text-[#FFD700] text-sm">{formatPrice(it.price)}</div>
                {it.category && (
                  <div className="font-roboto text-[8px] text-white/40 truncate ml-1 max-w-[60%]">
                    {it.category}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
