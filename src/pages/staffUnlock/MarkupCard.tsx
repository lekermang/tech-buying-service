import { useState } from "react";
import Icon from "@/components/ui/icon";
import {
  MarkupRow,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  apiPost,
} from "@/pages/staffUnlock/unlockTypes";

export default function MarkupCard({ row, onSaved }: { row: MarkupRow; onSaved: () => void }) {
  const color = CATEGORY_COLORS[row.category] ?? "#FFD700";
  const currentPct = Math.round((parseFloat(row.multiplier) - 1) * 100);
  const [mode, setMode] = useState<"pct" | "rub">("pct");
  const [pctInput, setPctInput] = useState(String(currentPct));
  const [rubInput, setRubInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    let newMult: number;
    if (mode === "pct") {
      const p = parseFloat(pctInput);
      if (isNaN(p) || p < 0 || p > 999) return;
      newMult = 1 + p / 100;
    } else {
      const rub = parseFloat(rubInput);
      if (isNaN(rub) || rub < 0) return;
      newMult = -Math.abs(rub);
    }
    setSaving(true); setMsg(null);
    const d = await apiPost({ action: "setMarkup", category: row.category, multiplier: newMult });
    if (d.ok) {
      setMsg({ ok: true, text: "Сохранено!" });
      setTimeout(() => { setMsg(null); onSaved(); }, 1200);
    } else {
      setMsg({ ok: false, text: d.error || "Ошибка" });
    }
    setSaving(false);
  }

  const presets = mode === "pct" ? ["10","20","30","40","50","100"] : ["50","100","200","500"];

  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(145deg,rgba(12,10,6,0.98),rgba(8,7,10,0.99))", border: `1px solid ${color}22` }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${color}55,transparent)` }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}16`, border: `1px solid ${color}28` }}>
            <Icon name={CATEGORY_ICONS[row.category] ?? "Tag"} size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-bold text-base uppercase text-white/90">
              {CATEGORY_LABELS[row.category] ?? row.category}
            </div>
            <div className="font-roboto text-[10px] text-white/35 mt-0.5">{row.note}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-oswald font-black text-2xl" style={{ color }}>
              {currentPct > 0 ? `+${currentPct}%` : row.multiplier}
            </div>
            <div className="font-roboto text-[9px] text-white/30">сейчас</div>
          </div>
        </div>
        <div className="flex rounded-xl overflow-hidden mb-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["pct","rub"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setMsg(null); }}
              className="flex-1 py-2 font-roboto text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              style={{
                background: mode === m ? `${color}18` : "transparent",
                color: mode === m ? color : "rgba(255,255,255,0.4)",
                borderRight: m === "pct" ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
              <Icon name={m === "pct" ? "Percent" : "RussianRuble"} size={11} />
              {m === "pct" ? "В процентах" : "+ фиксированно ₽"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div className="relative">
            {mode === "pct" ? (
              <input type="number" min="0" max="999" step="1" value={pctInput}
                onChange={e => setPctInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                placeholder="40" />
            ) : (
              <input type="number" min="0" step="10" value={rubInput}
                onChange={e => setRubInput(e.target.value)}
                className="w-full px-4 py-3 pr-14 rounded-xl font-oswald font-bold text-lg text-white/90 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${color}25` }}
                placeholder="100" />
            )}
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-oswald font-bold text-sm pointer-events-none"
              style={{ color: `${color}80` }}>{mode === "pct" ? "%" : "₽"}</div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {presets.map(p => (
              <button key={p} onClick={() => mode === "pct" ? setPctInput(p) : setRubInput(p)}
                className="px-2.5 py-1 rounded-lg font-oswald font-bold text-xs transition-all"
                style={{
                  background: (mode === "pct" ? pctInput : rubInput) === p ? `${color}20` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${(mode === "pct" ? pctInput : rubInput) === p ? `${color}45` : "rgba(255,255,255,0.08)"}`,
                  color: (mode === "pct" ? pctInput : rubInput) === p ? color : "rgba(255,255,255,0.4)",
                }}>
                {mode === "pct" ? `+${p}%` : `+${p}₽`}
              </button>
            ))}
          </div>
          {mode === "pct" && pctInput && !isNaN(parseFloat(pctInput)) && (
            <div className="px-3 py-2 rounded-xl text-xs font-roboto flex items-center justify-between"
              style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>Пример: услуга 1000 ₽ → клиент</span>
              <span className="font-bold" style={{ color }}>{(1000*(1+parseFloat(pctInput)/100)).toFixed(0)} ₽</span>
            </div>
          )}
          {msg && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs"
              style={{
                background: msg.ok ? "rgba(110,231,183,0.08)" : "rgba(252,165,165,0.08)",
                border: `1px solid ${msg.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)"}`,
                color: msg.ok ? "#6ee7b7" : "#fca5a5",
              }}>
              <Icon name={msg.ok ? "CheckCircle" : "AlertCircle"} size={13} />
              {msg.text}
            </div>
          )}
          <button onClick={save} disabled={saving}
            className="group relative w-full overflow-hidden py-3 rounded-xl font-oswald font-bold uppercase text-sm text-black transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(180deg,${color}dd 0%,${color} 50%,${color}99 100%)` }}>
            {saving
              ? <><Icon name="Loader" size={14} className="animate-spin relative" />Сохраняю...</>
              : <><Icon name="Save" size={14} className="relative" />Сохранить наценку</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
