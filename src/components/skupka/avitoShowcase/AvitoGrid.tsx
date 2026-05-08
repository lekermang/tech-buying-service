import { useState } from "react";
import Icon from "@/components/ui/icon";
import AvitoImg from "../AvitoImg";
import { AvitoItem, formatPrice } from "./types";

type Props = {
  loading: boolean;
  items: AvitoItem[];
  sortedItems: AvitoItem[];
  sortedList: AvitoItem[];
  hasFilter: boolean;
  totalPages: number;
  currentPage: number;
  limit: number;
  onOpen: (it: AvitoItem) => void;
  onPage: (off: number) => void;
};

export default function AvitoGrid({
  loading,
  items,
  sortedItems,
  sortedList,
  hasFilter,
  totalPages,
  currentPage,
  limit,
  onOpen,
  onPage,
}: Props) {
  const [showList, setShowList] = useState(false);

  return (
    <>
      {loading && items.length === 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg bg-white/5">
              <div className="aspect-square bg-gradient-to-br from-white/5 via-white/[0.08] to-white/5 animate-pulse" />
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="relative text-center py-8 border border-dashed border-[#FFD700]/20 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-transparent" />
          <Icon name="Sparkles" size={28} className="text-[#FFD700]/50 mx-auto mb-2 relative" />
          <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide relative">
            Витрина пополняется
          </div>
          <div className="text-white/40 font-roboto text-[10px] mt-1 relative">
            {hasFilter
              ? "По вашему запросу пока ничего нет — посмотрите ниже список или сбросьте фильтры"
              : "Сотрудник магазина сейчас добавляет фото товаров"}
          </div>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {sortedItems.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => onOpen(it)}
              style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
              className="group relative bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent border border-[#FFD700]/25 hover:border-[#FFD700]/80 rounded-lg overflow-hidden text-left transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,215,0,0.3)] hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            >
              <div className="relative aspect-square bg-[#0D0D0D] overflow-hidden">
                <AvitoImg
                  src={it.main_photo}
                  alt={it.title}
                  width={idx < 4 ? 480 : 360}
                  priority={idx < 2}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/0 group-hover:via-white/10 group-hover:to-white/20 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between gap-1">
                  <span className="bg-gradient-to-r from-[#FFD700] to-[#FFE55C] text-black font-oswald font-bold text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide shadow-[0_2px_8px_rgba(255,215,0,0.4)]">
                    В наличии
                  </span>
                  {it.photos && it.photos.length > 1 && (
                    <span className="bg-black/70 backdrop-blur text-white/95 font-roboto text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10">
                      <Icon name="Images" size={9} />
                      {it.photos.length}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="font-oswald font-bold text-white text-base leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {formatPrice(it.price)}
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-[#FFD700] text-black font-oswald font-bold text-[10px] px-2.5 py-1 rounded uppercase tracking-wider shadow-[0_4px_16px_rgba(255,215,0,0.5)]">
                    Подробнее
                  </div>
                </div>
              </div>

              <div className="p-2">
                <div className="font-roboto text-[11px] text-white/95 line-clamp-2 leading-tight min-h-[28px]">
                  {it.title}
                </div>
                {it.category && (
                  <div className="font-roboto text-[9px] text-[#FFD700]/70 mt-1 uppercase tracking-wide truncate">
                    {it.category}
                  </div>
                )}
              </div>

              <span aria-hidden className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute top-0 right-0 w-2.5 h-2.5 border-r border-t border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 left-0 w-2.5 h-2.5 border-l border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
              <span aria-hidden className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b border-[#FFD700]/60 group-hover:border-[#FFD700] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => onPage((currentPage - 2) * limit)}
            className="w-9 h-9 flex items-center justify-center border border-[#FFD700]/30 rounded-lg text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all"
          >
            <Icon name="ChevronLeft" size={16} />
          </button>
          <div className="px-3 py-1.5 bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-lg">
            <span className="font-oswald font-bold text-xs text-[#FFD700]">
              {currentPage}
            </span>
            <span className="font-roboto text-[10px] text-white/50 mx-1">из</span>
            <span className="font-oswald text-xs text-white/80">{totalPages}</span>
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => onPage(currentPage * limit)}
            className="w-9 h-9 flex items-center justify-center border border-[#FFD700]/30 rounded-lg text-[#FFD700] disabled:opacity-30 hover:bg-[#FFD700]/10 hover:border-[#FFD700] transition-all"
          >
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}

      {sortedList.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/10">
          <button
            onClick={() => setShowList(v => !v)}
            className="flex items-center justify-between w-full text-left group hover:bg-white/[0.02] -mx-2 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div>
              <div className="font-oswald font-bold text-white/95 text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Icon name="List" size={14} className="text-[#FFD700]/70" />
                Ещё в наличии
              </div>
              <div className="font-roboto text-[10px] text-white/40 mt-0.5">
                Товары без фото — нажмите, чтобы посмотреть на Авито
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="bg-white/10 text-white/85 font-oswald font-bold text-xs px-2 py-1 rounded">
                {sortedList.length}
              </span>
              <Icon
                name={showList ? "ChevronUp" : "ChevronDown"}
                size={18}
                className="text-[#FFD700]/60 group-hover:text-[#FFD700] transition-all group-hover:translate-y-0.5"
              />
            </div>
          </button>

          {showList && (
            <div className="mt-2 divide-y divide-white/5 max-h-[60vh] overflow-y-auto scrollbar-premium pr-1">
              {sortedList.map(it => (
                <a
                  key={it.id}
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 py-2.5 group hover:bg-white/[0.03] -mx-1 px-2 rounded transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-roboto text-xs text-white/90 truncate group-hover:text-[#FFD700] transition-colors">
                      {it.title}
                    </div>
                    {it.category && (
                      <div className="font-roboto text-[9px] text-white/40 mt-0.5 uppercase tracking-wide truncate">
                        {it.category}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="font-oswald font-bold text-[#FFD700] text-sm">
                      {formatPrice(it.price)}
                    </div>
                    <Icon name="ExternalLink" size={11} className="text-white/30 group-hover:text-[#FFD700] transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
