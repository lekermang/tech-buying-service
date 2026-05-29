import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/03c0735b-fa5a-4052-b02e-8c836039ff02";
const ADMIN_TOKEN = "Mark2015N";

const WATERMARK_PREVIEW = "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/e8e1312b-1620-4239-b89f-9b88afd67d1a.jpeg";

type CatalogItem = {
  id: number;
  category: string;
  brand: string;
  model: string;
  color: string | null;
  storage: string | null;
  sim_type: string | null;
  photo_url: string | null;
  has_photo: boolean;
};

type ImportRow = CatalogItem & {
  inputUrl: string;
  status: "idle" | "loading" | "done" | "error";
  resultUrl?: string;
  errorMsg?: string;
};

export default function CatalogPhotoImport() {
  const [items, setItems] = useState<ImportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Apple");
  const [search, setSearch] = useState("");
  const [batchUrl, setBatchUrl] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=list&brand=${encodeURIComponent(brand)}&limit=200`);
      const data = await res.json();
      setItems((data.items || []).map((it: CatalogItem) => ({
        ...it,
        inputUrl: "",
        status: "idle" as const,
      })));
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(it => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (it.model + " " + (it.color || "") + " " + (it.storage || "")).toLowerCase().includes(q);
  });

  const importOne = async (id: number) => {
    const item = items.find(it => it.id === id);
    if (!item || !item.inputUrl.trim()) return;

    setItems(prev => prev.map(it => it.id === id ? { ...it, status: "loading" } : it));

    try {
      const res = await fetch(`${API_URL}?action=import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": ADMIN_TOKEN,
        },
        body: JSON.stringify({ item_id: id, photo_url: item.inputUrl.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        setItems(prev => prev.map(it => it.id === id
          ? { ...it, status: "done", resultUrl: data.url, photo_url: data.url }
          : it
        ));
      } else {
        throw new Error(data.error || "Ошибка");
      }
    } catch (e: unknown) {
      setItems(prev => prev.map(it => it.id === id
        ? { ...it, status: "error", errorMsg: String((e as Error).message) }
        : it
      ));
    }
  };

  // Массовый импорт выбранных с одним URL-шаблоном (или вставить по одному)
  const importSelected = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    setBatchResult(null);
    let ok = 0, fail = 0;
    for (const id of Array.from(selectedIds)) {
      await importOne(id);
      const item = items.find(it => it.id === id);
      if (item?.status === "done") ok++;
      else fail++;
    }
    setBatchResult(`Готово: ${ok} успешно, ${fail} ошибок`);
    setBatchLoading(false);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(it => it.id)));
  };

  const doneCount = items.filter(it => it.status === "done").length;
  const loadingCount = items.filter(it => it.status === "loading").length;

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Шапка */}
      <div className="sticky top-0 z-20 bg-[#050508]/95 backdrop-blur border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <a href="/staff" className="text-white/40 hover:text-white transition-colors">
              <Icon name="ArrowLeft" size={18} />
            </a>
            <div>
              <div className="font-oswald font-bold text-lg uppercase tracking-wide text-[#FFD700]">
                Импорт фото каталога
              </div>
              <div className="text-[11px] text-white/40 font-roboto">
                Товаров без фото: <span className="text-white font-bold">{total}</span>
                {doneCount > 0 && <span className="text-emerald-400 ml-2">· загружено: {doneCount}</span>}
              </div>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="ml-auto p-2 rounded-lg border border-white/10 hover:border-[#FFD700]/30 transition-all"
            >
              <Icon name={loading ? "Loader2" : "RefreshCw"} size={14} className={loading ? "animate-spin text-[#FFD700]" : "text-white/50"} />
            </button>
          </div>

          {/* Поиск */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по модели, цвету..."
                className="w-full pl-8 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-white/25 outline-none focus:border-[#FFD700]/30"
              />
            </div>
            <select
              value={brand}
              onChange={e => setBrand(e.target.value)}
              className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white/70 outline-none"
            >
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">

        {/* Инструкция */}
        <div className="rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[0.04] p-4 mb-4">
          <div className="flex gap-3">
            <img
              src={WATERMARK_PREVIEW}
              alt="Заставка Скупка24"
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
            <div>
              <div className="font-oswald font-bold text-[#FFD700] text-sm uppercase tracking-wide mb-1">
                Как это работает
              </div>
              <div className="text-[11px] text-white/50 font-roboto leading-relaxed">
                Вставь ссылку на фото с <span className="text-white/70">kaluga.istudio-shop.ru</span> рядом с нужным товаром.
                Система скачает фото, наложит заставку Скупки24 на экран устройства и сохранит в каталог.
              </div>
            </div>
          </div>
        </div>

        {/* Массовые действия */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-xl bg-[#FFD700]/[0.08] border border-[#FFD700]/20">
            <Icon name="CheckSquare" size={14} className="text-[#FFD700]" />
            <span className="text-sm text-[#FFD700] font-roboto">Выбрано: {selectedIds.size}</span>
            <button
              onClick={importSelected}
              disabled={batchLoading || loadingCount > 0}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide bg-[#FFD700] text-black disabled:opacity-40"
            >
              {batchLoading ? "Загружаю..." : "Импортировать выбранные"}
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-white/30 hover:text-white/60">
              <Icon name="X" size={14} />
            </button>
          </div>
        )}

        {batchResult && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-roboto">
            {batchResult}
          </div>
        )}

        {/* Выбрать все */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-white/30 font-roboto">{filtered.length} товаров</span>
            <button onClick={selectAll} className="text-[11px] text-[#FFD700]/60 hover:text-[#FFD700] font-roboto transition-colors">
              Выбрать все
            </button>
          </div>
        )}

        {/* Список товаров */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader2" size={24} className="animate-spin text-[#FFD700]" />
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <div
                key={item.id}
                className={`rounded-xl border transition-all ${
                  item.status === "done"
                    ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                    : item.status === "error"
                    ? "border-red-500/30 bg-red-500/[0.04]"
                    : selectedIds.has(item.id)
                    ? "border-[#FFD700]/30 bg-[#FFD700]/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3 p-3">
                  {/* Чекбокс */}
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="mt-0.5 shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                      selectedIds.has(item.id)
                        ? "bg-[#FFD700] border-[#FFD700]"
                        : "border-white/20"
                    }`}>
                      {selectedIds.has(item.id) && <Icon name="Check" size={10} className="text-black" />}
                    </div>
                  </button>

                  {/* Превью фото (если есть результат) */}
                  {item.resultUrl ? (
                    <img src={item.resultUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-emerald-500/30" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <Icon name="Image" size={18} className="text-white/15" />
                    </div>
                  )}

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="font-oswald font-bold text-sm text-white leading-tight">
                      {item.brand} {item.model}
                      {item.storage && <span className="text-white/50 ml-1">{item.storage}</span>}
                    </div>
                    <div className="text-[10px] text-white/35 font-roboto mt-0.5">
                      {[item.color, item.sim_type].filter(Boolean).join(" · ")}
                      <span className="ml-2 text-white/20">#{item.id}</span>
                    </div>

                    {/* Поле URL */}
                    {item.status !== "done" && (
                      <div className="flex gap-1.5 mt-2">
                        <input
                          value={item.inputUrl}
                          onChange={e => setItems(prev => prev.map(it =>
                            it.id === item.id ? { ...it, inputUrl: e.target.value } : it
                          ))}
                          placeholder="https://kaluga.istudio-shop.ru/upload/..."
                          className="flex-1 px-2.5 py-1.5 text-[11px] font-roboto bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder-white/20 outline-none focus:border-[#FFD700]/30 min-w-0"
                          onKeyDown={e => e.key === "Enter" && importOne(item.id)}
                        />
                        <button
                          onClick={() => importOne(item.id)}
                          disabled={!item.inputUrl.trim() || item.status === "loading"}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#FFD700] text-black disabled:opacity-30 transition-all shrink-0 hover:bg-[#FFE34D] active:scale-95"
                        >
                          {item.status === "loading"
                            ? <Icon name="Loader2" size={12} className="animate-spin" />
                            : <Icon name="Download" size={12} />
                          }
                        </button>
                      </div>
                    )}

                    {/* Статус */}
                    {item.status === "done" && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Icon name="CheckCircle2" size={12} className="text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-roboto">Фото загружено</span>
                      </div>
                    )}
                    {item.status === "error" && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Icon name="AlertTriangle" size={12} className="text-red-400" />
                        <span className="text-[10px] text-red-400 font-roboto truncate">{item.errorMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-white/25 font-roboto text-sm">
                {search ? "Ничего не найдено" : "Все товары уже имеют фото 🎉"}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
