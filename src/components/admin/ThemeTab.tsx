import { useState } from "react";
import { THEMES, getSavedThemeId, saveAndApplyTheme } from "@/lib/theme";
import Icon from "@/components/ui/icon";

export default function ThemeTab() {
  const [activeId, setActiveId] = useState<string>(getSavedThemeId());

  const handleSelect = (id: string) => {
    setActiveId(id);
    saveAndApplyTheme(id);
  };

  return (
    <div className="p-5 max-w-3xl">
      <div className="mb-5">
        <div className="font-bold text-white text-sm uppercase tracking-wide mb-0.5">Тема оформления</div>
        <div className="text-white/40 text-xs">Выберите цветовую схему сайта. Изменение применяется мгновенно.</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              {/* Превью */}
              <div
                className="w-full h-12 rounded-sm flex items-end p-1.5 gap-1"
                style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
              >
                <div className="h-2 rounded-sm flex-1" style={{ backgroundColor: theme.card }} />
                <div className="h-3 w-4 rounded-sm" style={{ backgroundColor: theme.accent }} />
                <div className="h-2 rounded-sm w-6" style={{ backgroundColor: theme.card }} />
              </div>

              {/* Имя */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-white/60"}`}>
                  {theme.name}
                </span>
                {isActive && (
                  <Icon name="Check" size={13} className="text-[#FFD700] shrink-0" />
                )}
              </div>

              {/* Цветовые точки */}
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.bg }}
                  title="Фон"
                />
                <span
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.card }}
                  title="Карточка"
                />
                <span
                  className="w-3 h-3 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.accent }}
                  title="Акцент"
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 bg-[#111] border border-[#222] p-3 text-white/30 text-[11px] leading-relaxed">
        Тема сохраняется в браузере. Каждый посетитель видит стандартную тему, если не менял — это настройка только для администратора в текущем браузере.
      </div>
    </div>
  );
}
