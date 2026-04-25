import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import { CatalogItem, PHOTOS_URL } from "./types";
import PhotoEditor from "./PhotoEditor";

export default function PhotosManager({ token }: { token: string }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    const url = `${PHOTOS_URL}?search=${encodeURIComponent(q)}&page=${p}`;
    const res = await fetch(url, { headers: { ...adminHeaders(token) } });
    const data = await res.json();
    setItems(data.items || []);
    setTotalPages(data.pages || 1);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(val, 1); }, 400);
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск товара..."
            className="w-full bg-[#0D0D0D] border border-[#333] text-white pl-8 pr-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors"
          />
        </div>
        <button onClick={() => load(search, page)} className="text-white/40 hover:text-white transition-colors px-2">
          <Icon name="RefreshCw" size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-white/30 font-roboto text-sm">Загружаю...</div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id}
              className="bg-[#111] border border-[#222] px-3 py-2 flex items-center gap-3 hover:border-[#333] transition-colors">
              {/* Превью */}
              <div className="w-10 h-10 shrink-0 bg-[#1A1A1A] flex items-center justify-center overflow-hidden">
                {item.photo_url
                  ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                  : <Icon name="Image" size={16} className="text-white/20" />}
              </div>
              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate">
                  {item.brand} {item.model} {item.color} {item.storage}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-roboto text-[10px] text-white/30">{item.category}</span>
                  {item.region && <span className="font-roboto text-[10px] text-white/20">{item.region}</span>}
                </div>
              </div>
              {/* Фото каунтер */}
              <div className={`shrink-0 font-oswald font-bold text-xs px-2 py-0.5 ${
                item.photo_count === 0 ? "text-red-400 bg-red-400/10" :
                item.photo_count < 3 ? "text-yellow-400 bg-yellow-400/10" :
                "text-green-400 bg-green-400/10"
              }`}>
                {item.photo_count}/5
              </div>
              {/* Кнопка */}
              <button
                onClick={() => setEditing(item)}
                className="shrink-0 flex items-center gap-1 font-oswald font-bold text-xs px-2.5 py-1.5 bg-[#FFD700] text-black hover:bg-yellow-400 transition-colors uppercase"
              >
                <Icon name="Camera" size={11} /> Фото
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">Ничего не найдено</div>
          )}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="font-roboto text-white/40 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="text-white/40 hover:text-white disabled:opacity-30 transition-colors">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}

      {editing && (
        <PhotoEditor
          item={editing}
          token={token}
          onClose={() => { setEditing(null); load(search, page); }}
        />
      )}
    </div>
  );
}
