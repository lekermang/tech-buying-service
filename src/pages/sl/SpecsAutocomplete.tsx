import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { slGet, type SLSpecsTemplate } from "./types";

type Props = {
  token: string;
  title: string;
  brand?: string;
  model?: string;
  value: string;
  onChange: (specs: string) => void;
  onPickTemplate?: (t: SLSpecsTemplate) => void;
  placeholder?: string;
};

/** Поле «Характеристики» с автоподстановкой:
 *  - встроенный справочник популярных моделей
 *  - ранее введённые шаблоны (накапливаются после каждой скупки)
 */
export default function SpecsAutocomplete({ token, title, brand, model, value, onChange, onPickTemplate, placeholder }: Props) {
  const [matches, setMatches] = useState<SLSpecsTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debRef = useRef<number | null>(null);

  useEffect(() => {
    if (debRef.current) window.clearTimeout(debRef.current);
    if (!title && !brand && !model) { setMatches([]); return; }
    debRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const r = await slGet<{ matches: SLSpecsTemplate[] }>(token, "find_specs", { title, brand, model });
        setMatches(r.matches || []);
      } catch {
        setMatches([]);
      } finally { setLoading(false); }
    }, 300);
    return () => { if (debRef.current) window.clearTimeout(debRef.current); };
  }, [title, brand, model, token]);

  const pick = (t: SLSpecsTemplate) => {
    onChange(t.specs);
    onPickTemplate?.(t);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-1">
        <label className="text-[11px] uppercase tracking-wider text-white/50 font-roboto">Характеристики</label>
        {loading && <Icon name="Loader" size={11} className="animate-spin text-[#FFD700]" />}
        {matches.length > 0 && (
          <button type="button" onClick={() => setOpen((v) => !v)}
            className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 hover:bg-[#FFD700]/20">
            <Icon name="Sparkles" size={10} className="inline mr-1" />
            Подсказки ({matches.length})
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => matches.length && setOpen(true)}
        placeholder={placeholder || 'Например: 6.1" OLED, A15, 4/128ГБ, 12+12Мп'}
        rows={2}
        className="w-full bg-[#0A0A0A] border border-[#222] rounded-lg px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:border-[#FFD700]/40 outline-none resize-none"
      />
      {open && matches.length > 0 && (
        <div className="absolute left-0 right-0 z-30 mt-1 bg-[#141414] border border-[#FFD700]/30 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
          {matches.map((m) => (
            <button key={m.id} type="button" onClick={() => pick(m)}
              className="w-full text-left px-3 py-2 hover:bg-[#FFD700]/10 border-b border-[#222] last:border-b-0 transition-colors">
              <div className="flex items-start gap-2">
                {m.is_builtin
                  ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] uppercase">База</span>
                  : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 uppercase">×{m.use_count}</span>}
                <div className="min-w-0 flex-1">
                  {(m.brand || m.model) && (
                    <div className="text-[11px] text-white/60 font-medium">
                      {[m.brand, m.model].filter(Boolean).join(" ")}
                    </div>
                  )}
                  <div className="text-[12px] text-white/85 leading-snug">{m.specs}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
