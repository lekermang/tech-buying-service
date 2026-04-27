import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { smartlombardCall } from "../staff.types";

type GoodItem = {
  id: number;
  name?: string;
  title?: string;
  category?: string;
  category_name?: string;
  status?: string;
  price?: number;
  sell_price?: number;
  workplace_name?: string;
  reserved?: boolean | number;
  is_repair_goods?: boolean | number;
};

export function SLGoods({ token }: { token: string }) {
  const [items, setItems] = useState<GoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const r = await smartlombardCall<{ goods?: GoodItem[] }>({
      token, path: "/goods", goods: true,
      params: { offset: 0, limit: 100 },
    });
    if (!r.ok) { setError(r.error || "Ошибка"); setItems([]); }
    else setItems(r.data?.goods || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(g => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${g.name || g.title || ""} ${g.category || g.category_name || ""} ${g.id}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-3 space-y-3">
      <div className="relative">
        <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Название, категория..."
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25" />
      </div>

      <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/20 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="font-roboto text-white/60 text-[11px]">Товаров на складе</span>
        <span className="font-oswald font-bold text-[#FFD700] text-lg tabular-nums">{filtered.length}</span>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 font-roboto text-[11px] flex items-start gap-2">
          <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map(g => (
          <div key={g.id} className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="Package" size={13} className="text-[#FFD700] shrink-0" />
                <span className="font-oswald font-bold text-white text-sm truncate uppercase">{g.name || g.title || `#${g.id}`}</span>
              </div>
              {(g.price || g.sell_price) && (
                <span className="font-oswald font-bold text-[#FFD700] text-xs tabular-nums shrink-0">
                  {Number(g.price || g.sell_price || 0).toLocaleString("ru-RU")} ₽
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 font-roboto text-[10px] text-white/40 flex-wrap">
              {(g.category_name || g.category) && <span>{g.category_name || g.category}</span>}
              {g.workplace_name && <span className="flex items-center gap-1"><Icon name="MapPin" size={9} />{g.workplace_name}</span>}
              {(g.reserved === true || g.reserved === 2) && <span className="bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded text-[9px]">резерв</span>}
              <span className="text-white/25">#{g.id}</span>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && !error && (
          <div className="text-center py-12 text-white/30">
            <Icon name="Package" size={32} className="mx-auto mb-2 opacity-50" />
            <div className="font-roboto text-sm">Товары не найдены</div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-6 text-white/30">
            <Icon name="Loader" size={16} className="animate-spin mr-2" />
            <span className="font-roboto text-sm">Загружаю...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SLGoods;
