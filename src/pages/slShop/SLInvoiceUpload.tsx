import { useRef, useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory, type SLBranch } from "./types";
import { SLModal, SLButton, SLField, SLInput, SLSelect, SLPageWrap } from "./slUI";

type InvoiceItem = {
  name: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  specs: string;
  // UI-флаг: добавлять ли эту строку при импорте
  enabled: boolean;
};

type Props = {
  token: string;
  onClose: () => void;
  onDone: () => void;
};

/** Модалка «Загрузить накладную»: фото → ИИ → таблица для проверки → массовый импорт. */
export default function SLInvoiceUpload({ token, onClose, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Общие параметры партии
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [branches, setBranches] = useState<SLBranch[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [brand, setBrand] = useState<string>("AWEI");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; totalBuy: number; totalQty: number } | null>(null);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
    slApi<SLBranch[]>(token, "branches").then(r => {
      if (r.ok && r.data) {
        setBranches(r.data);
        const def = r.data.find(b => b.is_default) || r.data[0];
        if (def) setBranchId(def.id);
      }
    });
  }, [token]);

  const onPhoto = async (file: File) => {
    setPhotoBusy(true); setErr(null); setInfo(null);
    try {
      const compressed = await compressImage(file, 2000, 0.85);
      const r = await slApi<{ items: InvoiceItem[]; count: number }>(token, "invoice_ocr", {
        method: "POST",
        body: { image_base64: compressed },
      });
      if (r.ok && r.data) {
        const list = (r.data.items || []).map(it => ({ ...it, enabled: true }));
        setItems(list);
        setInfo(`ИИ распознал ${list.length} позиций. Проверь и поправь, если нужно.`);
      } else {
        setErr(r.error || "Не удалось распознать накладную");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPhotoBusy(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Авто-расчёт розницы для строки: ≤500 → ×3, иначе ×2
  const recalcSell = (idx: number) => {
    const it = items[idx];
    if (!it) return;
    const sell = it.buy_price <= 500 ? it.buy_price * 3 : it.buy_price * 2;
    updateItem(idx, { sell_price: sell });
  };

  const enabledItems = items.filter(it => it.enabled);
  const totalQty = enabledItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalBuy = enabledItems.reduce((s, it) => s + (Number(it.buy_price) || 0) * (Number(it.quantity) || 0), 0);
  const totalSell = enabledItems.reduce((s, it) => s + (Number(it.sell_price) || 0) * (Number(it.quantity) || 0), 0);

  const submit = async () => {
    if (!enabledItems.length) { setErr("Нет товаров для импорта"); return; }
    setSaving(true); setErr(null);
    const r = await slApi<{ created_count: number; failed_count: number; total_buy: number; total_qty: number }>(
      token, "items_bulk_create",
      {
        method: "POST",
        body: {
          items: enabledItems.map(it => ({
            title: it.name,
            quantity: it.quantity,
            buy_price: it.buy_price,
            sell_price: it.sell_price,
            specs: it.specs,
          })),
          category_id: categoryId || null,
          branch_id: branchId || null,
          brand: brand.trim(),
          status: "stock",
          source: "buyout",
        },
      },
    );
    setSaving(false);
    if (r.ok && r.data) {
      setResult({
        created: r.data.created_count,
        failed: r.data.failed_count,
        totalBuy: r.data.total_buy,
        totalQty: r.data.total_qty,
      });
      if (r.data.failed_count === 0) {
        setTimeout(() => { onDone(); }, 1500);
      }
    } else {
      setErr(r.error || "Ошибка импорта");
    }
  };

  return (
    <SLModal
      open={true}
      onClose={onClose}
      title="Загрузить накладную"
      icon="ScanLine"
      maxWidth="max-w-3xl"
      footer={
        !result ? (
          <SLButton variant="gold" size="md" icon={saving ? "Loader2" : "Check"} onClick={submit}
            disabled={saving || enabledItems.length === 0} className="w-full">
            {saving ? "Импортирую…" : `Принять всё (${enabledItems.length} поз. · ${totalQty} шт)`}
          </SLButton>
        ) : (
          <SLButton variant="gold" size="md" icon="Check" onClick={onDone} className="w-full">
            Готово, к складу
          </SLButton>
        )
      }
    >
      <SLPageWrap max="full">
        <div className="space-y-2">
          {/* Фото накладной */}
          {items.length === 0 && !result && (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={photoBusy}
              className="w-full bg-gradient-to-br from-[#FFD700]/12 to-transparent border-2 border-dashed border-[#FFD700]/40 rounded-xl py-6 flex flex-col items-center gap-1.5 hover:border-[#FFD700] active:scale-[0.98] transition-all disabled:opacity-50">
              <Icon name={photoBusy ? "Loader2" : "Camera"} size={26} className={`text-[#FFD700] ${photoBusy ? "animate-spin" : ""}`} />
              <div className="font-bold text-[#FFD700] text-[13px] uppercase tracking-wide">
                {photoBusy ? "Распознаю…" : "Сфотографировать накладную"}
              </div>
              <div className="text-[10px] text-white/55 text-center px-3 leading-tight max-w-md">
                ИИ прочитает все строки: наименование, количество, цену.<br />
                Розница рассчитается автоматически (≤500₽ × 3, иначе × 2)
              </div>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }}
          />

          {info && (
            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 px-2 py-1.5 text-[11px] flex items-start gap-1.5">
              <Icon name="Sparkles" size={11} className="mt-0.5 shrink-0 text-emerald-300" />
              <span>{info}</span>
            </div>
          )}
          {err && (
            <div className="rounded-md bg-red-500/10 border border-red-500/30 text-red-300 px-2 py-1.5 text-[12px] flex items-center gap-1.5">
              <Icon name="AlertTriangle" size={11} />{err}
            </div>
          )}

          {/* Результат импорта */}
          {result && (
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/15 to-transparent border border-emerald-500/40 p-3 space-y-1">
              <div className="font-bold text-emerald-300 text-[14px] flex items-center gap-1.5">
                <Icon name="CheckCircle2" size={16} /> Импортировано: {result.created} поз. · {result.totalQty} шт
              </div>
              <div className="text-[11px] text-white/70">
                Сумма закупки: <b className="text-[#FFD700] tabular-nums">{Math.round(result.totalBuy).toLocaleString("ru-RU")} ₽</b>
              </div>
              {result.failed > 0 && (
                <div className="text-[11px] text-red-300">
                  Не удалось добавить: {result.failed} строк (см. в списке)
                </div>
              )}
            </div>
          )}

          {/* Параметры партии */}
          {items.length > 0 && !result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <SLField label="Бренд (для всех)">
                <SLInput value={brand} onChange={e => setBrand(e.target.value)} placeholder="AWEI" />
              </SLField>
              <SLField label="Категория">
                <SLSelect value={categoryId} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">— не выбрана —</option>
                  {cats.map(c => (
                    <option key={c.id} value={c.id}>{c.path || c.name}</option>
                  ))}
                </SLSelect>
              </SLField>
              <SLField label="Филиал">
                <SLSelect value={branchId} onChange={e => setBranchId(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">— не выбран —</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </SLSelect>
              </SLField>
            </div>
          )}

          {/* Таблица товаров */}
          {items.length > 0 && !result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1">
                  <div className="text-[9px] text-white/45 uppercase tracking-wide">Позиций</div>
                  <div className="font-bold text-white tabular-nums">{enabledItems.length}</div>
                </div>
                <div className="bg-[#0F0F0F] border border-[#FFD700]/30 rounded-md px-2 py-1">
                  <div className="text-[9px] text-[#FFD700]/70 uppercase tracking-wide">Штук всего</div>
                  <div className="font-bold text-[#FFD700] tabular-nums">{totalQty}</div>
                </div>
                <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-md px-2 py-1">
                  <div className="text-[9px] text-white/45 uppercase tracking-wide">Закупка ∑</div>
                  <div className="font-bold text-white tabular-nums">{Math.round(totalBuy).toLocaleString("ru-RU")} ₽</div>
                </div>
                <div className="bg-[#0F0F0F] border border-emerald-500/30 rounded-md px-2 py-1">
                  <div className="text-[9px] text-emerald-300/80 uppercase tracking-wide">Розница ∑</div>
                  <div className="font-bold text-emerald-300 tabular-nums">{Math.round(totalSell).toLocaleString("ru-RU")} ₽</div>
                </div>
              </div>

              <div className="border border-[#1F1F1F] rounded-lg overflow-x-auto bg-[#0A0A0A]">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#0F0F0F] border-b border-[#1F1F1F]">
                    <tr className="text-[10px] uppercase text-white/45">
                      <th className="px-1 py-1 w-7"></th>
                      <th className="px-1 py-1 w-7 text-center">№</th>
                      <th className="px-2 py-1 text-left">Наименование</th>
                      <th className="px-2 py-1 w-16 text-center">Кол-во</th>
                      <th className="px-2 py-1 w-20 text-right">Закуп ₽</th>
                      <th className="px-2 py-1 w-20 text-right">Розн. ₽</th>
                      <th className="px-1 py-1 w-7"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className={`border-b border-[#1F1F1F]/60 ${!it.enabled ? "opacity-40" : ""}`}>
                        <td className="px-1 py-1 text-center">
                          <button onClick={() => updateItem(idx, { enabled: !it.enabled })}
                            title={it.enabled ? "Исключить из импорта" : "Включить обратно"}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${it.enabled ? "bg-[#FFD700] border-[#FFD700]" : "border-white/20"}`}>
                            {it.enabled && <Icon name="Check" size={9} className="text-black" />}
                          </button>
                        </td>
                        <td className="px-1 py-1 text-center text-[10px] text-white/40 tabular-nums">{idx + 1}</td>
                        <td className="px-1 py-1">
                          <input value={it.name}
                            onChange={e => updateItem(idx, { name: e.target.value })}
                            className="w-full bg-transparent border border-transparent hover:border-[#1F1F1F] focus:border-[#FFD700]/50 focus:bg-[#0F0F0F] rounded px-1 py-0.5 text-[12px] outline-none" />
                          {it.specs && (
                            <input value={it.specs}
                              onChange={e => updateItem(idx, { specs: e.target.value })}
                              placeholder="характеристики"
                              className="w-full bg-transparent border border-transparent hover:border-[#1F1F1F] focus:border-[#FFD700]/50 focus:bg-[#0F0F0F] rounded px-1 py-0.5 text-[10px] text-white/55 outline-none" />
                          )}
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" inputMode="numeric" value={it.quantity}
                            onChange={e => updateItem(idx, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                            className="w-full bg-[#0F0F0F] border border-[#1F1F1F] focus:border-[#FFD700]/50 rounded px-1 py-1 text-center font-bold tabular-nums outline-none" />
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" inputMode="numeric" value={it.buy_price}
                            onChange={e => {
                              const buy = Math.max(0, parseInt(e.target.value, 10) || 0);
                              updateItem(idx, { buy_price: buy });
                            }}
                            onBlur={() => recalcSell(idx)}
                            className="w-full bg-[#0F0F0F] border border-[#1F1F1F] focus:border-[#FFD700]/50 rounded px-1 py-1 text-right tabular-nums outline-none" />
                        </td>
                        <td className="px-1 py-1">
                          <input type="number" inputMode="numeric" value={it.sell_price}
                            onChange={e => updateItem(idx, { sell_price: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                            className="w-full bg-[#0F0F0F] border border-[#FFD700]/30 focus:border-[#FFD700]/60 rounded px-1 py-1 text-right tabular-nums text-[#FFD700] font-bold outline-none" />
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button onClick={() => removeItem(idx)} title="Удалить строку"
                            className="text-white/30 hover:text-red-400 p-0.5">
                            <Icon name="Trash2" size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={() => inputRef.current?.click()}
                className="w-full text-[11px] text-white/55 hover:text-[#FFD700] py-1.5 border border-dashed border-[#1F1F1F] hover:border-[#FFD700]/40 rounded-md transition">
                <Icon name="RefreshCcw" size={11} className="inline mr-1" />
                Сделать другое фото / добавить ещё
              </button>
            </>
          )}
        </div>
      </SLPageWrap>
    </SLModal>
  );
}

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas error"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image error"));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Read error"));
    reader.readAsDataURL(file);
  });
}
