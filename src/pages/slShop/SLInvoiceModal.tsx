import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLBranch, type SLCategory } from "./types";
import { SLModal, SLButton, SLField, SLInput, SLGrid } from "./slUI";

type RecognizedItem = {
  title: string;
  quantity: number;
  buy_price: number;
  color?: string;
  suggested_sell_price: number;
};

type Props = {
  token: string;
  branches: SLBranch[];
  cats: SLCategory[];
  defaultBrand?: string;
  defaultBranchId?: number | null;
  onClose: () => void;
  /** Вызывается после успешного создания товаров — для перезагрузки списка */
  onCreated?: () => void;
};

/**
 * Модалка «Накладная»:
 * 1) Скачать накладную в XLSX (по бренду/датам/филиалу).
 * 2) Загрузить товары по фото бумажной накладной — ИИ распознаёт строки,
 *    сотрудник проверяет, потом массовое создание.
 */
export default function SLInvoiceModal({
  token, branches, cats, defaultBrand = "", defaultBranchId = null,
  onClose, onCreated,
}: Props) {
  // ── Tab: 'export' | 'import'
  const [tab, setTab] = useState<"export" | "import">("export");

  // ── Export: фильтры
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [brand, setBrand] = useState(defaultBrand);
  const [branchId, setBranchId] = useState<number | "">(defaultBranchId ?? "");
  const [exporting, setExporting] = useState(false);
  const [exportInfo, setExportInfo] = useState<string | null>(null);

  const downloadXlsx = async () => {
    setExporting(true); setExportInfo(null);
    const params: Record<string, string> = {};
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (brand.trim()) params.brand = brand.trim();
    if (branchId !== "") params.branch_id = String(branchId);
    const r = await slApi<{
      filename: string; content_base64: string; mime_type: string;
      positions: number; total_qty: number; total_buy: number; total_sell: number;
    }>(token, "items_invoice_export", { params });
    setExporting(false);
    if (!r.ok || !r.data) {
      setExportInfo(r.error || "Ошибка экспорта");
      return;
    }
    // Скачиваем файл из base64
    try {
      const bin = atob(r.data.content_base64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: r.data.mime_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportInfo(
        `Готово: ${r.data.positions} позиций, ${r.data.total_qty} шт на ${r.data.total_buy.toLocaleString("ru-RU")} ₽`,
      );
    } catch {
      setExportInfo("Не удалось сохранить файл");
    }
  };

  // ── Import: распознавание накладной
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recItems, setRecItems] = useState<RecognizedItem[]>([]);
  const [importBranchId, setImportBranchId] = useState<number | "">(defaultBranchId ?? "");
  const [importBrand, setImportBrand] = useState(defaultBrand);
  const [importCategoryId, setImportCategoryId] = useState<number | "">("");
  const [importStatus, setImportStatus] = useState<"stock" | "showcase">("stock");
  const [creating, setCreating] = useState(false);
  const [createInfo, setCreateInfo] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const compress = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1800;
        let w = img.width, h = img.height;
        if (w > max || h > max) {
          if (w > h) { h = Math.round(h * max / w); w = max; }
          else { w = Math.round(w * max / h); h = max; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Image error"));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Read error"));
    reader.readAsDataURL(file);
  });

  const onPickFile = async (file: File) => {
    setRecognizing(true); setErrMsg(null); setRecItems([]); setCreateInfo(null);
    try {
      const compressed = await compress(file);
      const r = await slApi<{ photo_url?: string; items: RecognizedItem[]; count: number }>(
        token, "items_invoice_recognize", {
          method: "POST",
          body: { image_base64: compressed },
        },
      );
      if (r.ok && r.data) {
        setPhotoUrl(r.data.photo_url || null);
        setRecItems(r.data.items || []);
        if (!r.data.items || r.data.items.length === 0) {
          setErrMsg("ИИ ничего не распознал — попробуй фото лучше или ярче");
        }
      } else {
        setErrMsg(r.error || "Не удалось распознать накладную");
      }
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setRecognizing(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<RecognizedItem>) => {
    setRecItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeItem = (idx: number) => {
    setRecItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalQty = recItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalBuy = recItems.reduce((s, it) => s + (Number(it.buy_price) || 0) * (Number(it.quantity) || 0), 0);
  const totalSell = recItems.reduce((s, it) => s + (Number(it.suggested_sell_price) || 0) * (Number(it.quantity) || 0), 0);

  const submitBulk = async () => {
    if (recItems.length === 0) { setErrMsg("Нет товаров для добавления"); return; }
    setCreating(true); setCreateInfo(null); setErrMsg(null);
    const payload = {
      items: recItems.map(it => ({
        title: it.title,
        quantity: it.quantity,
        buy_price: it.buy_price,
        sell_price: it.suggested_sell_price,
        color: it.color || "",
      })),
      branch_id: importBranchId === "" ? null : importBranchId,
      brand: importBrand.trim() || null,
      category_id: importCategoryId === "" ? null : importCategoryId,
      status: importStatus,
      source: "buyout",
    };
    const r = await slApi<{
      created: { id: number; sku: string; title: string }[];
      errors: { index: number; title?: string; error: string }[];
      total_count: number; total_qty: number; total_buy: number;
    }>(token, "items_bulk_create", { method: "POST", body: payload });
    setCreating(false);
    if (r.ok && r.data) {
      setCreateInfo(
        `Создано: ${r.data.total_count} позиций, ${r.data.total_qty} шт на ${Math.round(r.data.total_buy).toLocaleString("ru-RU")} ₽`
        + (r.data.errors.length > 0 ? ` · ошибок: ${r.data.errors.length}` : ""),
      );
      if (onCreated) onCreated();
      // Очищаем форму после успешного создания
      if (r.data.errors.length === 0) {
        setRecItems([]);
        setPhotoUrl(null);
      }
    } else {
      setErrMsg(r.error || "Ошибка создания товаров");
    }
  };

  const footer = tab === "export" ? (
    <SLButton variant="gold" size="md" icon={exporting ? "Loader2" : "Download"}
      onClick={downloadXlsx} disabled={exporting} className="w-full">
      {exporting ? "Готовлю файл…" : "Скачать накладную (XLSX)"}
    </SLButton>
  ) : (
    <SLButton variant="gold" size="md" icon={creating ? "Loader2" : "Check"}
      onClick={submitBulk} disabled={creating || recItems.length === 0} className="w-full">
      {creating ? "Создаю…" : `Принять ${recItems.length} позиций (${totalQty} шт)`}
    </SLButton>
  );

  return (
    <SLModal open={true} onClose={onClose} title="Накладная" icon="FileSpreadsheet" footer={footer}>
      {/* Переключатель вкладок */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#0E0E0E] border border-[#1A1A1A] rounded-lg mb-2">
        <button
          onClick={() => setTab("export")}
          className={`py-1.5 rounded text-[11px] font-bold uppercase tracking-wide transition ${
            tab === "export" ? "bg-[#FFD700] text-black" : "text-white/55"
          }`}
        >
          <Icon name="Download" size={11} className="inline mr-1" /> Скачать XLSX
        </button>
        <button
          onClick={() => setTab("import")}
          className={`py-1.5 rounded text-[11px] font-bold uppercase tracking-wide transition ${
            tab === "import" ? "bg-[#FFD700] text-black" : "text-white/55"
          }`}
        >
          <Icon name="Camera" size={11} className="inline mr-1" /> Загрузить по фото
        </button>
      </div>

      {tab === "export" && (
        <div className="space-y-2">
          <div className="text-[11px] text-white/55">
            Сверь добавленные товары с бумажной накладной. Можно фильтровать по бренду, датам и филиалу.
          </div>
          <SLGrid cols={2}>
            <SLField label="Дата с"><SLInput type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></SLField>
            <SLField label="Дата по"><SLInput type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></SLField>
          </SLGrid>
          <SLField label="Бренд (например: Awei)" hint="Оставь пустым — выгрузить всё за период">
            <SLInput value={brand} onChange={e => setBrand(e.target.value)} placeholder="Awei" />
          </SLField>
          <SLField label="Филиал">
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-2 text-[13px]"
            >
              <option value="">Все филиалы</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </SLField>
          {exportInfo && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-1.5 text-[11px] flex items-center gap-1.5">
              <Icon name="CheckCircle2" size={11} className="text-emerald-300" />
              <span>{exportInfo}</span>
            </div>
          )}
        </div>
      )}

      {tab === "import" && (
        <div className="space-y-2">
          <div className="text-[11px] text-white/55">
            Сфотографируй бумажную накладную — ИИ распознает строки, проставит количества и цены.
            Розница рассчитывается автоматически: до 500 ₽ → ×3, иначе ×2.
          </div>

          {/* Фото накладной */}
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Накладная" className="w-full max-h-44 object-contain rounded-md bg-[#0A0A0A] border border-[#1F1F1F]" />
              <button
                onClick={() => { setPhotoUrl(null); setRecItems([]); }}
                className="absolute top-1 right-1 bg-black/70 hover:bg-red-500/80 text-white p-1 rounded-full"
                title="Удалить фото"
              >
                <Icon name="X" size={11} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={recognizing}
              className="w-full bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-lg py-5 flex flex-col items-center gap-1 hover:border-[#FFD700] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Icon name={recognizing ? "Loader2" : "Camera"} size={22} className={`text-[#FFD700] ${recognizing ? "animate-spin" : ""}`} />
              <div className="font-bold text-[#FFD700] text-[12px] uppercase tracking-wide">
                {recognizing ? "Распознаю…" : "Сфотографировать накладную"}
              </div>
              <div className="text-[10px] text-white/50 text-center px-2">
                ИИ прочитает наименования, количества и цены
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f); e.target.value = ""; }}
          />

          {errMsg && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2 py-1.5 text-[11px] flex items-center gap-1.5">
              <Icon name="AlertTriangle" size={11} />{errMsg}
            </div>
          )}

          {/* Распознанные строки */}
          {recItems.length > 0 && (
            <>
              <div className="text-[11px] uppercase font-bold tracking-wider text-white/55 flex items-center gap-1.5 mt-2">
                <Icon name="Sparkles" size={11} className="text-[#FFD700]" />
                Распознано {recItems.length} позиций
              </div>

              <SLGrid cols={2}>
                <SLField label="Бренд (общий)" hint="Поставится всем строкам">
                  <SLInput value={importBrand} onChange={e => setImportBrand(e.target.value)} placeholder="Awei" />
                </SLField>
                <SLField label="Куда">
                  <select
                    value={importStatus}
                    onChange={e => setImportStatus(e.target.value as "stock" | "showcase")}
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-2 text-[13px]"
                  >
                    <option value="stock">На склад</option>
                    <option value="showcase">На витрину</option>
                  </select>
                </SLField>
              </SLGrid>
              <SLGrid cols={2}>
                <SLField label="Филиал">
                  <select
                    value={importBranchId}
                    onChange={e => setImportBranchId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-2 text-[13px]"
                  >
                    <option value="">— не выбран —</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </SLField>
                <SLField label="Категория">
                  <select
                    value={importCategoryId}
                    onChange={e => setImportCategoryId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-2 py-2 text-[13px]"
                  >
                    <option value="">— не выбрана —</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.path || c.name}</option>)}
                  </select>
                </SLField>
              </SLGrid>

              {/* Список — компактная таблица */}
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {recItems.map((it, idx) => (
                  <div key={idx} className="bg-[#0E0E0E] border border-[#1A1A1A] rounded-md p-1.5 space-y-1">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[10px] text-white/35 font-mono mt-1 w-5 text-center shrink-0">{idx + 1}</span>
                      <input
                        value={it.title}
                        onChange={e => updateItem(idx, { title: e.target.value })}
                        className="flex-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded px-2 py-1 text-[12px] font-bold text-white"
                      />
                      <button onClick={() => removeItem(idx)} className="text-white/30 hover:text-red-400 p-0.5 shrink-0" title="Убрать строку">
                        <Icon name="X" size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pl-7">
                      <div>
                        <div className="text-[8px] uppercase text-white/40 mb-0.5">Кол-во</div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.quantity}
                          onChange={e => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                          className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded px-1.5 py-1 text-[12px] text-center font-bold tabular-nums"
                        />
                      </div>
                      <div>
                        <div className="text-[8px] uppercase text-white/40 mb-0.5">Закуп ₽</div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.buy_price || ""}
                          onChange={e => {
                            const buy = Number(e.target.value) || 0;
                            const sell = buy <= 500 ? buy * 3 : buy * 2;
                            updateItem(idx, { buy_price: buy, suggested_sell_price: sell });
                          }}
                          className="w-full bg-[#0A0A0A] border border-[#1A1A1A] rounded px-1.5 py-1 text-[12px] text-right tabular-nums"
                        />
                      </div>
                      <div>
                        <div className="text-[8px] uppercase text-[#FFD700] mb-0.5">Розница ₽</div>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.suggested_sell_price || ""}
                          onChange={e => updateItem(idx, { suggested_sell_price: Number(e.target.value) || 0 })}
                          className="w-full bg-[#0A0A0A] border border-[#FFD700]/40 rounded px-1.5 py-1 text-[12px] text-right tabular-nums text-[#FFD700] font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Сводка */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] mt-2">
                <div className="bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md px-2 py-1">
                  <div className="text-[9px] text-[#FFD700]/70 uppercase">Штук всего</div>
                  <div className="font-bold text-[#FFD700] tabular-nums">{totalQty}</div>
                </div>
                <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1">
                  <div className="text-[9px] text-white/45 uppercase">Закупка ∑</div>
                  <div className="font-bold text-white tabular-nums">{Math.round(totalBuy).toLocaleString("ru-RU")} ₽</div>
                </div>
                <div className="bg-[#0F0F0F] border border-emerald-500/30 rounded-md px-2 py-1">
                  <div className="text-[9px] text-emerald-300/80 uppercase">Розница ∑</div>
                  <div className="font-bold text-emerald-300 tabular-nums">{Math.round(totalSell).toLocaleString("ru-RU")} ₽</div>
                </div>
              </div>

              {createInfo && (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-1.5 text-[11px] flex items-center gap-1.5">
                  <Icon name="CheckCircle2" size={11} className="text-emerald-300" />
                  <span>{createInfo}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SLModal>
  );
}
