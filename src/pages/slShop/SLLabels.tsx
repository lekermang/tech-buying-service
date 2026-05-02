import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLItem, type SLLabelTemplate } from "./types";
import { printLabels } from "./labelPrinter";

export default function SLLabels({ token, empName }: { token: string; empName?: string }) {
  const [items, setItems] = useState<SLItem[]>([]);
  const [tmpls, setTmpls] = useState<SLLabelTemplate[]>([]);
  const [tmplId, setTmplId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [q, setQ] = useState("");
  const [editTmpl, setEditTmpl] = useState<SLLabelTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [it, tp] = await Promise.all([
      slApi<SLItem[]>(token, "items", { params: { q, status: "" } }),
      slApi<SLLabelTemplate[]>(token, "label_templates"),
    ]);
    if (it.ok && it.data) setItems(it.data);
    if (tp.ok && tp.data) {
      setTmpls(tp.data);
      if (!tmplId && tp.data.length) {
        const def = tp.data.find(t => t.is_default) || tp.data[0];
        setTmplId(def.id);
      }
    }
  }, [token, q, tmplId]);

  useEffect(() => { load(); }, [load]);

  const tmpl = tmpls.find(t => t.id === tmplId) || null;

  const toggle = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const print = (single?: SLItem) => {
    if (!tmpl) return;
    const list = single ? [single] : items.filter(i => selected.has(i.id));
    if (list.length === 0) return;
    printLabels(list, tmpl, { empName });
  };

  return (
    <div>
      {/* Шаблоны */}
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] uppercase font-bold tracking-wide text-white/50">Шаблон ценника</div>
          <button onClick={() => setCreating(true)} className="text-[10px] text-[#FFD700]"><Icon name="Plus" size={10} className="inline" /> создать</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tmpls.map(t => (
            <button key={t.id} onClick={() => setTmplId(t.id)}
              className={`p-2 rounded-lg border text-left text-sm transition-all ${
                tmplId === t.id ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]" : "bg-[#141414] border-[#1F1F1F] text-white/70"
              }`}>
              <div className="font-bold text-[12px]">{t.name}</div>
              <div className="text-[10px] opacity-70">{t.width_mm}×{t.height_mm} мм • {t.is_thermal ? "термо" : "A4"}</div>
            </button>
          ))}
        </div>
        {tmpl && (
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => setEditTmpl(tmpl)} className="text-[11px] text-white/50 hover:text-[#FFD700]">
              <Icon name="Settings" size={11} className="inline mr-1" />Настроить «{tmpl.name}»
            </button>
          </div>
        )}
      </div>

      {/* Превью */}
      {tmpl && (
        <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 mb-3">
          <div className="text-[11px] uppercase font-bold tracking-wide text-white/50 mb-2">Превью</div>
          <div className="flex justify-center bg-white rounded-lg p-3">
            <LabelPreview tmpl={tmpl} item={items[0]} />
          </div>
        </div>
      )}

      {/* Поиск товаров */}
      <div className="relative mb-2">
        <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по товарам"
          className="w-full bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg pl-9 pr-3 py-2 text-sm" />
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-[#FFD700] text-black rounded-lg p-2.5 mb-2 flex items-center justify-between shadow-lg">
          <div className="font-bold text-sm">Выбрано: {selected.size}</div>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} className="text-xs underline">сброс</button>
            <button onClick={() => print()} className="bg-black text-[#FFD700] font-bold px-3 py-1.5 rounded text-xs">
              <Icon name="Printer" size={12} className="inline mr-1" />Печать {selected.size}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {items.map(it => (
          <div key={it.id}
            className={`bg-[#0F0F0F] border rounded-lg p-2.5 flex items-center gap-2 ${
              selected.has(it.id) ? "border-[#FFD700]" : "border-[#1F1F1F]"
            }`}>
            <button onClick={() => toggle(it.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                selected.has(it.id) ? "bg-[#FFD700] border-[#FFD700]" : "border-white/20"
              }`}>
              {selected.has(it.id) && <Icon name="Check" size={12} className="text-black" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{it.title}</div>
              <div className="text-[11px] text-white/50 truncate">{it.specs_short || it.brand || ""}</div>
            </div>
            <div className="text-[#FFD700] font-bold text-sm shrink-0">{fmt(it.sell_price)} ₽</div>
            <button onClick={() => print(it)}
              className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 p-1.5 rounded">
              <Icon name="Printer" size={12} />
            </button>
          </div>
        ))}
      </div>

      {(editTmpl || creating) && (
        <LabelTmplEditor token={token} tmpl={editTmpl} onClose={() => { setEditTmpl(null); setCreating(false); }} onSaved={() => { setEditTmpl(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function LabelPreview({ tmpl, item }: { tmpl: SLLabelTemplate; item?: SLItem }) {
  const sample: SLItem = item || {
    id: 0, title: "iPhone 13", specs_short: '6.1" Super Retina XDR, 4/128GB, A15 Bionic, 3240mAh', sell_price: 25000, status: "stock", brand: "Apple", model: "iPhone 13", ram_gb: 4, storage_gb: 128,
  };
  const ramStorage = (sample.ram_gb && sample.storage_gb)
    ? `${sample.ram_gb}/${sample.storage_gb}`
    : (sample.storage_gb ? `${sample.storage_gb}` : "");
  const titleWithRam = ramStorage && !String(sample.title).match(/\d+\/\d+/)
    ? `${sample.title} ${ramStorage}`
    : sample.title;
  // 1мм ≈ 3.78px, увеличим в 2 раза для превью
  const scale = 3.78 * 2;
  const w = Number(tmpl.width_mm) * scale;
  const h = Number(tmpl.height_mm) * scale;
  return (
    <div style={{ width: w, height: h }}
      className="border-2 border-black bg-white text-black flex flex-col items-center justify-between p-1 overflow-hidden"
      >
      <div className="text-center font-bold leading-tight w-full" style={{ fontSize: w / 14 }}>
        {titleWithRam}
      </div>
      {tmpl.show_specs && sample.specs_short && (
        <div className="text-center leading-tight w-full px-1" style={{ fontSize: w / 22 }}>
          {sample.specs_short}
        </div>
      )}
      <div className="text-center font-extrabold w-full" style={{ fontSize: w / 7 }}>
        {fmt(sample.sell_price)}₽
      </div>
    </div>
  );
}

function LabelTmplEditor({ token, tmpl, onClose, onSaved }: { token: string; tmpl: SLLabelTemplate | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Partial<SLLabelTemplate>>(tmpl || { name: "Новый", width_mm: 58, height_mm: 40, layout: "classic", show_brand: true, show_specs: true, show_imei: false, show_qr: false, show_barcode: false, font_family: "Arial", is_thermal: true });
  const save = async () => {
    const r = await slApi(token, "label_template_save", { method: "POST", body: { ...d, id: tmpl?.id } });
    if (r.ok) onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-[#1F1F1F] flex items-center justify-between">
          <div className="font-bold">{tmpl ? "Шаблон ценника" : "Новый шаблон"}</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          <Fl l="Название" v={d.name || ""} s={v => setD({ ...d, name: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Fl l="Ширина мм" v={String(d.width_mm)} s={v => setD({ ...d, width_mm: Number(v) || 58 })} />
            <Fl l="Высота мм" v={String(d.height_mm)} s={v => setD({ ...d, height_mm: Number(v) || 40 })} />
          </div>
          <Sw l="Термопринтер (1 ценник на лист)" v={!!d.is_thermal} s={v => setD({ ...d, is_thermal: v })} />
          <Sw l="Показывать бренд" v={!!d.show_brand} s={v => setD({ ...d, show_brand: v })} />
          <Sw l="Показывать характеристики" v={!!d.show_specs} s={v => setD({ ...d, show_specs: v })} />
          <Sw l="Показывать IMEI" v={!!d.show_imei} s={v => setD({ ...d, show_imei: v })} />
          <button onClick={save} className="w-full bg-[#FFD700] text-black font-bold py-2.5 rounded-lg">Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function Fl({ l, v, s }: { l: string; v: string; s: (x: string) => void }) {
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{l}</div>
      <input value={v} onChange={e => s(e.target.value)} className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
    </div>
  );
}

function Sw({ l, v, s }: { l: string; v: boolean; s: (x: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm">{l}</span>
      <button onClick={() => s(!v)}
        className={`w-9 h-5 rounded-full relative transition-colors ${v ? "bg-[#FFD700]" : "bg-[#1F1F1F]"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${v ? "left-4" : "left-0.5"}`} />
      </button>
    </label>
  );
}