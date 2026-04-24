import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const IMPORT_PARTS_URL = "https://functions.poehali.dev/71d1796e-9ac1-4330-abfb-b6713d9dfaf5";

type CategoryRow = {
  category: string;
  parts_count: number;
  avg_supplier_price: number;
  min_supplier_price: number;
  max_supplier_price: number;
  markup_percent: number;
  is_latest: boolean;
};

type Props = { token: string };

export default function RepairPriceListTab({ token }: Props) {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [bulkMarkup, setBulkMarkup] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(IMPORT_PARTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ action: "list-categories" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Ошибка загрузки");
        return;
      }
      const list: CategoryRow[] = data.categories || [];
      setRows(list);
      const d: Record<string, string> = {};
      list.forEach((c) => { d[c.category] = String(c.markup_percent); });
      setDrafts(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveCategory = async (category: string) => {
    const raw = drafts[category] ?? "0";
    const markup = parseFloat(raw.replace(",", ".")) || 0;
    setSavingCat(category);
    try {
      const res = await fetch(IMPORT_PARTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ action: "save-markup", category, markup_percent: markup }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Ошибка: " + (data.error || res.status));
        return;
      }
      setRows((prev) => prev.map((r) => (r.category === category ? { ...r, markup_percent: markup } : r)));
    } finally {
      setSavingCat(null);
    }
  };

  const applyBulkMarkup = async () => {
    const markup = parseFloat(bulkMarkup.replace(",", ".")) || 0;
    if (!rows.length) return;
    if (!confirm(`Применить наценку ${markup}% ко всем ${rows.length} категориям?\n\nПересчитаются итоговые цены всех позиций прайса.`)) return;
    setBulkSaving(true);
    try {
      const res = await fetch(IMPORT_PARTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders(token) },
        body: JSON.stringify({ action: "save-markup-all", markup_percent: markup }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        alert("Ошибка: " + (data.error || res.status));
        return;
      }
      setBulkMarkup("");
      await load();
    } finally {
      setBulkSaving(false);
    }
  };

  const finalPrice = (supplier: number, markup: number) => Math.round(supplier * (1 + markup / 100));

  const visible = rows.filter((r) =>
    search ? r.category.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-oswald font-bold text-white text-sm uppercase">Прайс: цены поставщика + наценка</h3>
          <p className="font-roboto text-white/40 text-[11px]">
            Наценка задаётся отдельно по каждой категории. Итоговая цена сохраняется в базе и автоматически подтягивается при поиске запчастей.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-[#FFD700]/70 hover:text-[#FFD700] text-xs border border-[#333] hover:border-[#FFD700]/40 px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* Массовая наценка + поиск */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#222] px-3 py-2">
          <Icon name="Percent" size={14} className="text-[#FFD700]/60" />
          <input
            type="text"
            placeholder="Наценка ко всем категориям, %"
            value={bulkMarkup}
            onChange={(e) => setBulkMarkup(e.target.value)}
            className="bg-transparent outline-none text-white text-xs font-roboto flex-1 min-w-0"
          />
          <button
            onClick={applyBulkMarkup}
            disabled={!bulkMarkup || bulkSaving}
            className="bg-[#FFD700] text-black font-oswald font-bold px-3 py-1 text-[11px] uppercase disabled:opacity-40 flex items-center gap-1.5"
          >
            {bulkSaving && <Icon name="Loader" size={11} className="animate-spin" />}
            {bulkSaving ? "Применяю..." : "Применить ко всем"}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-[#0D0D0D] border border-[#222] px-3 py-2">
          <Icon name="Search" size={14} className="text-white/30" />
          <input
            type="text"
            placeholder="Поиск по категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white text-xs font-roboto flex-1 min-w-0"
          />
        </div>
      </div>

      {error && <p className="font-roboto text-xs text-red-400">Ошибка: {error}</p>}

      {!loading && !rows.length && (
        <div className="border border-dashed border-[#333] p-6 text-center">
          <Icon name="FileQuestion" size={28} className="text-white/20 mx-auto mb-2" />
          <p className="font-roboto text-white/50 text-xs">
            Пока нет загруженного прайса. Зайди во вкладку «Импорт» и загрузи .xlsx/.xls от поставщика — здесь появятся категории для наценки.
          </p>
        </div>
      )}

      {!!rows.length && (
        <div className="overflow-x-auto border border-[#222]">
          <table className="w-full text-[11px] font-roboto">
            <thead className="bg-[#0D0D0D] sticky top-0">
              <tr className="text-white/40 border-b border-[#222]">
                <th className="text-left px-3 py-2">Категория</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Позиций</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Цена поставщика (сред.)</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Диапазон</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Наценка, %</th>
                <th className="text-right px-3 py-2 whitespace-nowrap">Итоговая цена</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const draft = drafts[r.category] ?? String(r.markup_percent);
                const draftNum = parseFloat(draft.replace(",", ".")) || 0;
                const isDirty = Math.abs(draftNum - r.markup_percent) > 0.001;
                return (
                  <tr key={r.category} className="border-b border-[#111] hover:bg-[#0F0F0F]">
                    <td className="px-3 py-2 text-white/80 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate" title={r.category}>{r.category}</span>
                        {r.is_latest && (
                          <span className="inline-flex items-center gap-0.5 bg-[#FFD700] text-black text-[9px] font-oswald font-bold px-1.5 py-0.5 uppercase tracking-wide shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-white/60">{r.parts_count}</td>
                    <td className="px-3 py-2 text-right text-white/70">{Math.round(r.avg_supplier_price).toLocaleString("ru-RU")} ₽</td>
                    <td className="px-3 py-2 text-right text-white/40 whitespace-nowrap">
                      {Math.round(r.min_supplier_price).toLocaleString("ru-RU")} – {Math.round(r.max_supplier_price).toLocaleString("ru-RU")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [r.category]: e.target.value }))}
                        className={`w-16 text-right bg-[#0A0A0A] border ${isDirty ? "border-[#FFD700]" : "border-[#222]"} px-2 py-1 text-xs outline-none focus:border-[#FFD700]`}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-[#FFD700] font-oswald font-bold">
                      {finalPrice(r.avg_supplier_price, draftNum).toLocaleString("ru-RU")} ₽
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => saveCategory(r.category)}
                        disabled={!isDirty || savingCat === r.category}
                        className="bg-[#FFD700] text-black font-oswald font-bold px-2.5 py-1 text-[10px] uppercase disabled:opacity-30 disabled:cursor-not-allowed hover:bg-yellow-400"
                      >
                        {savingCat === r.category ? "..." : isDirty ? "Сохранить" : "✓"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}