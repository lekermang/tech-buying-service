import { useState } from "react";
import { THEMES, getSavedThemeId, saveAndApplyTheme, applyTheme, SiteTheme } from "@/lib/theme";
import Icon from "@/components/ui/icon";

const CUSTOM_KEY = "site_theme_custom";

function loadCustom(): SiteTheme | null {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCustom(theme: SiteTheme) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(theme));
}

function darken(hex: string, amount = 0.15): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export default function ThemeTab() {
  const [activeId, setActiveId] = useState<string>(getSavedThemeId());

  const savedCustom = loadCustom();
  const [customBg, setCustomBg] = useState(savedCustom?.bg ?? "#0d0d0d");
  const [customAccent, setCustomAccent] = useState(savedCustom?.accent ?? "#ffd700");
  const [customSaved, setCustomSaved] = useState(false);

  const handleSelect = (id: string) => {
    setActiveId(id);
    saveAndApplyTheme(id);
  };

  const buildCustomTheme = (bg: string, accent: string): SiteTheme => ({
    id: "custom",
    name: "Своя тема",
    bg,
    card: darken(bg, -0.06),
    border: darken(bg, -0.12),
    accent,
    accentFg: bg,
    preview: "",
  });

  const handleCustomChange = (bg: string, accent: string) => {
    const theme = buildCustomTheme(bg, accent);
    applyTheme(theme);
  };

  const handleApplyCustom = () => {
    const theme = buildCustomTheme(customBg, customAccent);
    saveCustom(theme);
    localStorage.setItem("site_theme_id", "custom");
    setActiveId("custom");
    applyTheme(theme);
    setCustomSaved(true);
    setTimeout(() => setCustomSaved(false), 2000);
  };

  return (
    <div className="p-5 max-w-3xl">
      <div className="mb-5">
        <div className="font-bold text-white text-sm uppercase tracking-wide mb-0.5">Тема оформления</div>
        <div className="text-white/40 text-xs">Выберите готовую схему или задайте свои цвета.</div>
      </div>

      {/* Готовые темы */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {THEMES.map(theme => {
          const isActive = theme.id === activeId;
          return (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className={`relative flex flex-col gap-2.5 p-3 border text-left transition-all ${
                isActive
                  ? "border-[#FFD700] bg-[#FFD700]/5"
                  : "border-[#2a2a2a] bg-[#111] hover:border-white/20"
              }`}
            >
              <div
                className="w-full h-12 rounded-sm flex items-end p-1.5 gap-1"
                style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
              >
                <div className="h-2 rounded-sm flex-1" style={{ backgroundColor: theme.card }} />
                <div className="h-3 w-4 rounded-sm" style={{ backgroundColor: theme.accent }} />
                <div className="h-2 rounded-sm w-6" style={{ backgroundColor: theme.card }} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-white/60"}`}>
                  {theme.name}
                </span>
                {isActive && <Icon name="Check" size={13} className="text-[#FFD700] shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: theme.bg }} />
                <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: theme.card }} />
                <span className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: theme.accent }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Своя тема */}
      <div className={`border p-4 mb-4 transition-all ${activeId === "custom" ? "border-[#FFD700] bg-[#FFD700]/5" : "border-[#2a2a2a] bg-[#111]"}`}>
        <div className="flex items-center gap-2 mb-4">
          <Icon name="Palette" size={15} className="text-[#FFD700]" />
          <span className="text-white font-bold text-sm uppercase tracking-wide">Свои цвета</span>
          {activeId === "custom" && <Icon name="Check" size={13} className="text-[#FFD700] ml-auto" />}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Фон */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Цвет фона</div>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={customBg}
                  onChange={e => {
                    setCustomBg(e.target.value);
                    handleCustomChange(e.target.value, customAccent);
                  }}
                  className="sr-only"
                />
                <div
                  className="w-10 h-10 rounded border-2 border-white/20 hover:border-white/40 transition-colors"
                  style={{ backgroundColor: customBg }}
                />
              </label>
              <div>
                <div className="text-white text-sm font-mono">{customBg.toUpperCase()}</div>
                <div className="text-white/30 text-[10px]">Нажмите для выбора</div>
              </div>
            </div>
          </div>

          {/* Акцент */}
          <div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Акцентный цвет</div>
            <div className="flex items-center gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="color"
                  value={customAccent}
                  onChange={e => {
                    setCustomAccent(e.target.value);
                    handleCustomChange(customBg, e.target.value);
                  }}
                  className="sr-only"
                />
                <div
                  className="w-10 h-10 rounded border-2 border-white/20 hover:border-white/40 transition-colors"
                  style={{ backgroundColor: customAccent }}
                />
              </label>
              <div>
                <div className="text-white text-sm font-mono">{customAccent.toUpperCase()}</div>
                <div className="text-white/30 text-[10px]">Кнопки и акценты</div>
              </div>
            </div>
          </div>
        </div>

        {/* Превью */}
        <div
          className="w-full h-10 rounded-sm flex items-end p-1.5 gap-1 mb-4"
          style={{ backgroundColor: customBg, border: `1px solid ${darken(customBg, -0.12)}` }}
        >
          <div className="h-2 rounded-sm flex-1" style={{ backgroundColor: darken(customBg, -0.06) }} />
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: customAccent }} />
          <div className="h-2 rounded-sm w-6" style={{ backgroundColor: darken(customBg, -0.06) }} />
        </div>

        <button
          onClick={handleApplyCustom}
          className="flex items-center gap-2 bg-[#FFD700] text-black font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-yellow-400 transition-colors"
        >
          <Icon name={customSaved ? "Check" : "Save"} size={13} />
          {customSaved ? "Сохранено!" : "Применить и сохранить"}
        </button>
      </div>

      <div className="bg-[#111] border border-[#222] p-3 text-white/30 text-[11px] leading-relaxed">
        Тема сохраняется в браузере на этом устройстве.
      </div>
    </div>
  );
}
