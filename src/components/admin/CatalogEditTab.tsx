import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import { CATALOG_URL, SYNC_URL, CATEGORIES, type Item } from "./catalogTypes";
import { CatalogItemModal } from "./CatalogItemModal";
import { CatalogMarkupPanel } from "./CatalogMarkupPanel";

export default function CatalogEditTab({ token }: { token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAvail, setFilterAvail] = useState("");
  const [editing, setEditing] = useState<Item | null | "new">(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inserted: number; updated: number; total: number } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const LIMIT = 50;

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(SYNC_URL, {
        method: "POST",
        headers: { ...adminHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const d = await res.json();
      if (d.ok) {
        setSyncResult({ inserted: d.inserted, updated: d.updated, total: d.total });
        load(search, filterCat, filterAvail, 1);
        setPage(1);
      } else {
        alert(d.error || "Ошибка синхронизации");
      }
    } catch {
      alert("Ошибка сети");
    }
    setSyncing(false);
  };

  const load = useCallback(async (q: string, cat: string, avail: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String((p - 1) * LIMIT) });
    if (q) params.set("search", q);
    if (cat) params.set("category", cat);
    if (avail) params.set("availability", avail);
    const res = await fetch(`${CATALOG_URL}?${params}`, { headers: { ...adminHeaders(token) } });
    const d = await res.json();
    setItems(d.items || []);
    setTotal(d.total || 0);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(search, filterCat, filterAvail, page); }, [page]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); load(val, filterCat, filterAvail, 1); }, 350);
  };

  const handleFilter = (cat: string, avail: string) => {
    setFilterCat(cat); setFilterAvail(avail); setPage(1);
    load(search, cat, avail, 1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    setDeleting(id);
    await fetch(`${CATALOG_URL}?id=${id}`, { method: "DELETE", headers: { ...adminHeaders(token) } });
    setDeleting(null);
    load(search, filterCat, filterAvail, page);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const availBadge = (a: string) =>
    a === "in_stock"
      ? "text-green-400 bg-green-400/10"
      : "text-orange-400 bg-orange-400/10";

  return (
    <div className="px-4 py-4">
      {/* Тулбар */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Поиск по товарам..."
            className="w-full bg-[#0D0D0D] border border-[#333] text-white pl-8 pr-3 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors" />
        </div>

        <select value={filterCat} onChange={e => handleFilter(e.target.value, filterAvail)}
          className="bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] appearance-none">
          <option value="">Все категории</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={filterAvail} onChange={e => handleFilter(filterCat, e.target.value)}
          className="bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] appearance-none">
          <option value="">Все</option>
          <option value="in_stock">В наличии</option>
          <option value="on_order">Под заказ</option>
        </select>

        <button onClick={() => load(search, filterCat, filterAvail, page)}
          className="text-white/30 hover:text-white transition-colors p-1.5">
          <Icon name="RefreshCw" size={14} />
        </button>

        <button onClick={handleSync} disabled={syncing}
          className="flex items-center gap-1.5 border border-[#7dd3fc]/40 text-[#7dd3fc] font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-[#7dd3fc]/10 transition-colors disabled:opacity-40">
          <Icon name={syncing ? "Loader" : "RefreshCcw"} size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Синхронизация..." : "Smartbery"}
        </button>

        <button onClick={() => setEditing("new")}
          className="flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-3 py-1.5 text-xs uppercase hover:bg-yellow-400 transition-colors ml-auto">
          <Icon name="Plus" size={13} /> Добавить товар
        </button>
      </div>

      {/* Результат синхронизации */}
      {syncResult && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 border border-[#6ee7b7]/25 bg-[#6ee7b7]/05 font-roboto text-xs text-[#6ee7b7]">
          <Icon name="CheckCircle" size={13} />
          Синхронизировано {syncResult.total} позиций · добавлено {syncResult.inserted} · обновлено {syncResult.updated}
          <button onClick={() => setSyncResult(null)} className="ml-auto text-[#6ee7b7]/40 hover:text-[#6ee7b7]">
            <Icon name="X" size={11} />
          </button>
        </div>
      )}

      {/* Панель наценок и отправки прайса */}
      <CatalogMarkupPanel
        token={token}
        onMarkupApplied={() => load(search, filterCat, filterAvail, page)}
      />

      {/* Счётчик */}
      <div className="font-roboto text-white/20 text-[10px] mb-2">
        {total} товаров {filterCat && `· ${filterCat}`}
      </div>

      {/* Список */}
      {loading ? (
        <div className="text-center py-16 text-white/30 font-roboto text-sm">Загружаю...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-white/30 font-roboto text-sm">Ничего не найдено</div>
      ) : (
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id}
              className="bg-[#111] border border-[#1E1E1E] px-3 py-2.5 flex items-center gap-3 hover:border-[#2A2A2A] transition-colors">
              {/* Фото */}
              <div className="w-10 h-10 shrink-0 bg-[#1A1A1A] overflow-hidden flex items-center justify-center">
                {item.photo_url
                  ? <img src={item.photo_url} alt="" className="w-full h-full object-cover" />
                  : <Icon name="Image" size={14} className="text-white/15" />}
              </div>
              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <div className="font-roboto text-sm text-white truncate">
                  {item.brand} {item.model}
                  {item.storage && <span className="text-white/40"> · {item.storage}</span>}
                  {item.color && <span className="text-white/30"> · {item.color}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-roboto text-[10px] text-white/25">{item.category}</span>
                  {item.region && <span className="font-roboto text-[10px] text-white/20">{item.region}</span>}
                  <span className={`font-roboto text-[10px] px-1.5 py-0.5 ${availBadge(item.availability)}`}>
                    {item.availability === "in_stock" ? "В наличии" : "Под заказ"}
                  </span>
                </div>
              </div>
              {/* Цена */}
              {item.price && (
                <div className="font-oswald font-bold text-[#FFD700] text-sm shrink-0">
                  {item.price.toLocaleString("ru-RU")} ₽
                </div>
              )}
              {/* Действия */}
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(item)}
                  className="text-white/25 hover:text-[#FFD700] transition-colors p-1.5" title="Редактировать">
                  <Icon name="Pencil" size={13} />
                </button>
                <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                  className="text-white/25 hover:text-red-400 transition-colors p-1.5 disabled:opacity-40" title="Удалить">
                  {deleting === item.id
                    ? <Icon name="Loader" size={13} className="animate-spin" />
                    : <Icon name="Trash2" size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="text-white/30 hover:text-white disabled:opacity-20 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <span className="font-roboto text-white/30 text-xs">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="text-white/30 hover:text-white disabled:opacity-20 transition-colors">
            <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      )}

      {/* Модалка */}
      {editing !== null && (
        <CatalogItemModal
          item={editing === "new" ? null : editing}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={() => load(search, filterCat, filterAvail, page)}
        />
      )}
    </div>
  );
}
