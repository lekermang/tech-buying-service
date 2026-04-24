import Icon from "@/components/ui/icon";
import { ACCENTS, BG_STYLES, CHARACTERS, CURSOR_EFFECTS, DENSITIES, FONTS } from "./characters";
import { useStaffTheme } from "./StaffThemeContext";

export default function StaffThemeSettings({ onClose }: { onClose: () => void }) {
  const { draft, setDraft, saveDraft, resetDraft, isDirty, saving, saved } = useStaffTheme();

  const handleSave = async () => {
    const ok = await saveDraft();
    if (ok) setTimeout(() => onClose(), 600);
  };

  const handleClose = () => {
    if (isDirty) {
      if (!confirm("Есть несохранённые изменения. Закрыть без сохранения?")) return;
      resetDraft();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={handleClose}>
      <div
        className="bg-[#0F0F0F] border border-[#2A2A2A] w-full sm:max-w-lg max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка c кнопкой Сохранить */}
        <div className="shrink-0 bg-[#0F0F0F] border-b border-[#2A2A2A] px-4 py-3 flex items-center justify-between gap-2 rounded-t-2xl sm:rounded-t-xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: `${draft.accent_color}22`, border: `1px solid ${draft.accent_color}55` }}>
              <Icon name="Sparkles" size={16} style={{ color: draft.accent_color }} />
            </div>
            <div className="min-w-0">
              <div className="font-oswald font-bold text-white text-sm uppercase leading-tight">Моя аниме-тема</div>
              <div className="font-roboto text-white/40 text-[10px] truncate">
                {saving ? "Сохраняю..." : saved ? "✓ Сохранено" : isDirty ? "Есть изменения" : "Без изменений"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving}
              className={`px-3 py-2 rounded-md font-oswald font-bold text-xs uppercase transition-all ${
                !isDirty || saving
                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                  : "text-black hover:brightness-110 active:scale-95"
              }`}
              style={isDirty && !saving ? { background: draft.accent_color, boxShadow: `0 0 14px ${draft.accent_color}55` } : undefined}
            >
              {saving ? "..." : saved ? "✓" : "Сохранить"}
            </button>
            <button onClick={handleClose} className="text-white/40 hover:text-white p-1.5 rounded-md hover:bg-white/5" title="Закрыть">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Контент — прокручивается */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <label className="flex items-center justify-between bg-[#141414] border border-[#1F1F1F] rounded-lg px-4 py-3 cursor-pointer">
            <div>
              <div className="font-oswald font-bold text-white text-sm uppercase">Включить тему</div>
              <div className="font-roboto text-white/40 text-[11px] mt-0.5">Маскот, фон и эффекты</div>
            </div>
            <div
              onClick={() => setDraft({ enabled: !draft.enabled })}
              className={`w-11 h-6 rounded-full relative transition-colors ${draft.enabled ? "" : "bg-[#333]"}`}
              style={draft.enabled ? { background: draft.accent_color } : undefined}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${draft.enabled ? "left-[22px]" : "left-0.5"}`} />
            </div>
          </label>

          <Section title="Персонаж" icon="User">
            <div className="grid grid-cols-5 gap-2">
              {CHARACTERS.map(c => {
                const active = draft.character_id === c.id;
                return (
                  <button key={c.id}
                    onClick={() => setDraft({ character_id: c.id })}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${active ? "scale-105" : "border-[#1F1F1F] hover:border-[#444]"}`}
                    style={active ? { borderColor: c.accent, boxShadow: `0 0 16px ${c.accent}66` } : undefined}
                    title={c.name}
                  >
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" draggable={false} />
                    {active && (
                      <span className="absolute inset-x-0 bottom-0 py-0.5 text-[9px] font-bold text-center text-white" style={{ background: `${c.accent}dd` }}>
                        {c.name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Эффект курсора" icon="MousePointer2">
            <Chips items={CURSOR_EFFECTS} active={draft.cursor_effect} onPick={id => setDraft({ cursor_effect: id })} accent={draft.accent_color} />
          </Section>

          <Section title="Акцентный цвет" icon="Palette">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(a => {
                const active = draft.accent_color === a.color;
                return (
                  <button key={a.id} onClick={() => setDraft({ accent_color: a.color })}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${active ? "border-white/40" : "border-[#1F1F1F] hover:border-[#333]"}`}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ background: a.color, boxShadow: active ? `0 0 10px ${a.color}` : undefined }} />
                    <span className="font-roboto text-[11px] text-white/80">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Фоновый эффект" icon="Cloud">
            <Chips items={BG_STYLES} active={draft.bg_style} onPick={id => setDraft({ bg_style: id })} accent={draft.accent_color} />
          </Section>

          <Section title="Размер меню" icon="LayoutGrid">
            <Chips items={DENSITIES} active={draft.ui_density} onPick={id => setDraft({ ui_density: id })} accent={draft.accent_color} />
          </Section>

          <Section title="Шрифт" icon="Type">
            <Chips items={FONTS} active={draft.font_family} onPick={id => setDraft({ font_family: id })} accent={draft.accent_color} />
          </Section>
        </div>

        {/* Нижний бар c кнопками */}
        <div className="shrink-0 border-t border-[#2A2A2A] bg-[#0A0A0A] px-4 py-3 flex items-center gap-2">
          <button
            onClick={resetDraft}
            disabled={!isDirty || saving}
            className="flex-1 py-2.5 rounded-md font-oswald font-bold text-xs uppercase bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Отменить
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="flex-[2] py-2.5 rounded-md font-oswald font-bold text-xs uppercase text-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: draft.accent_color, boxShadow: isDirty && !saving ? `0 0 16px ${draft.accent_color}77` : undefined }}
          >
            {saving ? "Сохраняю..." : saved ? "✓ Сохранено" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon name={icon} size={12} className="text-white/40" />
        <div className="font-oswald font-bold text-white/70 text-[11px] uppercase tracking-wider">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Chips({ items, active, onPick, accent }: {
  items: { id: string; label: string }[]; active: string; onPick: (id: string) => void; accent: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(it => {
        const isActive = active === it.id;
        return (
          <button key={it.id} onClick={() => onPick(it.id)}
            className={`px-3 py-1.5 rounded-full font-roboto text-[11px] transition-all ${isActive ? "text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"}`}
            style={isActive ? { background: accent, boxShadow: `0 0 12px ${accent}55` } : undefined}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
