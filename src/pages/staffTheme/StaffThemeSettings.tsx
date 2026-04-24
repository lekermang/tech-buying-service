import Icon from "@/components/ui/icon";
import { ACCENTS, BG_STYLES, CHARACTERS, CURSOR_EFFECTS, DENSITIES, FONTS } from "./characters";
import { useStaffTheme } from "./StaffThemeContext";

export default function StaffThemeSettings({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, saving } = useStaffTheme();

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#0F0F0F] border border-[#2A2A2A] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-[#2A2A2A] px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${theme.accent_color}22`, border: `1px solid ${theme.accent_color}55` }}>
              <Icon name="Sparkles" size={16} style={{ color: theme.accent_color }} />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-sm uppercase">Моя аниме-тема</div>
              <div className="font-roboto text-white/40 text-[10px]">{saving ? "Сохраняю..." : "Сохраняется автоматически"}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={20} /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Включить */}
          <label className="flex items-center justify-between bg-[#141414] border border-[#1F1F1F] rounded-lg px-4 py-3 cursor-pointer">
            <div>
              <div className="font-oswald font-bold text-white text-sm uppercase">Включить тему</div>
              <div className="font-roboto text-white/40 text-[11px] mt-0.5">Маскот, фон и эффекты</div>
            </div>
            <div
              onClick={() => setTheme({ enabled: !theme.enabled })}
              className={`w-11 h-6 rounded-full relative transition-colors ${theme.enabled ? "" : "bg-[#333]"}`}
              style={theme.enabled ? { background: theme.accent_color } : undefined}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${theme.enabled ? "left-[22px]" : "left-0.5"}`} />
            </div>
          </label>

          {/* Персонаж */}
          <Section title="Персонаж" icon="User">
            <div className="grid grid-cols-5 gap-2">
              {CHARACTERS.map(c => {
                const active = theme.character_id === c.id;
                return (
                  <button key={c.id}
                    onClick={() => setTheme({ character_id: c.id })}
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

          {/* Эффект курсора */}
          <Section title="Эффект курсора" icon="MousePointer2">
            <Chips
              items={CURSOR_EFFECTS}
              active={theme.cursor_effect}
              onPick={id => setTheme({ cursor_effect: id })}
              accent={theme.accent_color}
            />
          </Section>

          {/* Акцент */}
          <Section title="Акцентный цвет" icon="Palette">
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map(a => {
                const active = theme.accent_color === a.color;
                return (
                  <button key={a.id} onClick={() => setTheme({ accent_color: a.color })}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-md border transition-all ${active ? "border-white/40" : "border-[#1F1F1F] hover:border-[#333]"}`}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ background: a.color, boxShadow: active ? `0 0 10px ${a.color}` : undefined }} />
                    <span className="font-roboto text-[11px] text-white/80">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Фон */}
          <Section title="Фоновый эффект" icon="Cloud">
            <Chips
              items={BG_STYLES}
              active={theme.bg_style}
              onPick={id => setTheme({ bg_style: id })}
              accent={theme.accent_color}
            />
          </Section>

          {/* Плотность */}
          <Section title="Размер меню" icon="LayoutGrid">
            <Chips
              items={DENSITIES}
              active={theme.ui_density}
              onPick={id => setTheme({ ui_density: id })}
              accent={theme.accent_color}
            />
          </Section>

          {/* Шрифт */}
          <Section title="Шрифт" icon="Type">
            <Chips
              items={FONTS}
              active={theme.font_family}
              onPick={id => setTheme({ font_family: id })}
              accent={theme.accent_color}
            />
          </Section>
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
