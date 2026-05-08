import Icon from "@/components/ui/icon";
import { TopItem, formatPrice, formatNum } from "./types";

type Props = { items: TopItem[] };

export default function AvitoTopList({ items }: Props) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="Trophy" size={14} className="text-[#FFD700]" />
          <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
            Топ-10 объявлений
          </span>
        </div>
        <span className="text-[10px] text-white/40">по просмотрам</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-white/40 text-xs">
          <Icon name="Inbox" size={24} className="mx-auto mb-2 opacity-40" />
          Пока пусто — синхронизируйте товары и обновите статистику
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((it, idx) => (
            <a
              key={it.id}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-[#FFD700]/40 transition-all group"
            >
              <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-oswald font-bold text-xs ${
                idx === 0
                  ? "bg-gradient-to-br from-[#FFD700] to-[#b8860b] text-black"
                  : idx === 1
                  ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black"
                  : idx === 2
                  ? "bg-gradient-to-br from-amber-700 to-amber-900 text-white"
                  : "bg-white/10 text-white/60"
              }`}>
                {idx + 1}
              </div>

              <div className="shrink-0 w-9 h-9 rounded bg-black overflow-hidden">
                {it.main_photo ? (
                  <img src={it.main_photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="ImageOff" size={14} className="text-white/30" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-roboto text-xs text-white truncate group-hover:text-[#FFD700] transition-colors">
                  {it.title}
                </div>
                <div className="font-oswald font-bold text-[#FFD700] text-[11px]">
                  {formatPrice(it.price)}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 shrink-0 text-[10px]">
                <span className="flex items-center gap-1 text-blue-300" title="Просмотры">
                  <Icon name="Eye" size={10} />
                  <span className="font-oswald font-bold">{formatNum(it.views)}</span>
                </span>
                <span className="flex items-center gap-1 text-violet-300" title="Контакты">
                  <Icon name="Phone" size={10} />
                  <span className="font-oswald font-bold">{formatNum(it.contacts)}</span>
                </span>
                <span className="flex items-center gap-1 text-pink-300" title="В избранном">
                  <Icon name="Heart" size={10} />
                  <span className="font-oswald font-bold">{formatNum(it.favorites)}</span>
                </span>
              </div>
              <div className="sm:hidden text-[10px] text-blue-300 font-oswald font-bold flex items-center gap-1 shrink-0">
                <Icon name="Eye" size={10} />
                {formatNum(it.views)}
              </div>

              <Icon name="ExternalLink" size={11} className="text-white/30 group-hover:text-[#FFD700] transition-colors shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
