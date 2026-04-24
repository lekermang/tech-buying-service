import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { DEFAULT_THEME, STAFF_THEME_URL, StaffThemeSettings } from "./characters";

type Ctx = {
  theme: StaffThemeSettings;
  setTheme: (patch: Partial<StaffThemeSettings>) => void;
  saving: boolean;
  loaded: boolean;
};

const StaffThemeCtx = createContext<Ctx | null>(null);

export function StaffThemeProvider({ token, children }: { token: string; children: ReactNode }) {
  const [theme, setThemeState] = useState<StaffThemeSettings>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Загрузка с сервера
  useEffect(() => {
    if (!token) { setLoaded(true); return; }
    let cancelled = false;
    fetch(STAFF_THEME_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const s = d?.settings || {};
        setThemeState({ ...DEFAULT_THEME, ...s });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [token]);

  // Сохранение с debounce
  const save = useCallback((next: StaffThemeSettings) => {
    if (!token) return;
    setSaving(true);
    fetch(STAFF_THEME_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ settings: next }),
    }).finally(() => setSaving(false));
  }, [token]);

  const setTheme = useCallback((patch: Partial<StaffThemeSettings>) => {
    setThemeState(prev => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }, [save]);

  // Применяем акцент/плотность/шрифт к root через CSS-переменные
  useEffect(() => {
    const root = document.documentElement;
    if (theme.enabled) {
      root.style.setProperty("--staff-accent", theme.accent_color);
      const pad = theme.ui_density === "compact" ? "6px" : theme.ui_density === "comfortable" ? "14px" : "10px";
      root.style.setProperty("--staff-density", pad);
      root.dataset.staffTheme = "on";
    } else {
      root.style.removeProperty("--staff-accent");
      root.style.removeProperty("--staff-density");
      delete root.dataset.staffTheme;
    }
  }, [theme.enabled, theme.accent_color, theme.ui_density]);

  return (
    <StaffThemeCtx.Provider value={{ theme, setTheme, saving, loaded }}>
      {children}
    </StaffThemeCtx.Provider>
  );
}

export function useStaffTheme() {
  const ctx = useContext(StaffThemeCtx);
  if (!ctx) throw new Error("useStaffTheme must be used within StaffThemeProvider");
  return ctx;
}
