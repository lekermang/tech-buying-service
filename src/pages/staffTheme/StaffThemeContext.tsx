import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { DEFAULT_THEME, STAFF_THEME_URL, StaffThemeSettings } from "./characters";

type Ctx = {
  /** Применённая (сохранённая) тема — она активна на экране */
  theme: StaffThemeSettings;
  /** Черновик — изменения в форме настроек */
  draft: StaffThemeSettings;
  /** Обновить черновик */
  setDraft: (patch: Partial<StaffThemeSettings>) => void;
  /** Сохранить черновик на сервер и применить */
  saveDraft: () => Promise<boolean>;
  /** Откатить черновик к сохранённой теме */
  resetDraft: () => void;
  /** Есть несохранённые изменения? */
  isDirty: boolean;
  saving: boolean;
  saved: boolean;
  loaded: boolean;
};

const StaffThemeCtx = createContext<Ctx | null>(null);

function equalTheme(a: StaffThemeSettings, b: StaffThemeSettings): boolean {
  return (Object.keys(a) as (keyof StaffThemeSettings)[]).every(k => a[k] === b[k]);
}

const LS_KEY = "staff_theme_cache";

export function StaffThemeProvider({ token, children }: { token: string; children: ReactNode }) {
  // кэш в localStorage — чтобы тема применялась моментально до ответа сервера
  const [theme, setThemeState] = useState<StaffThemeSettings>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return DEFAULT_THEME;
  });
  const [draft, setDraftState] = useState<StaffThemeSettings>(theme);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Загрузка с сервера
  useEffect(() => {
    if (!token) { setLoaded(true); return; }
    let cancelled = false;
    fetch(STAFF_THEME_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const s = d?.settings || {};
        const merged = { ...DEFAULT_THEME, ...s };
        setThemeState(merged);
        setDraftState(merged);
        try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [token]);

  const setDraft = useCallback((patch: Partial<StaffThemeSettings>) => {
    setDraftState(prev => ({ ...prev, ...patch }));
    setSaved(false);
  }, []);

  const resetDraft = useCallback(() => {
    setDraftState(theme);
    setSaved(false);
  }, [theme]);

  const saveDraft = useCallback(async () => {
    if (!token) {
      // оффлайн режим — хотя бы применяем локально
      setThemeState(draft);
      try { localStorage.setItem(LS_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
      setSaved(true);
      return true;
    }
    setSaving(true);
    try {
      const res = await fetch(STAFF_THEME_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ settings: draft }),
      });
      const ok = res.ok;
      if (ok) {
        setThemeState(draft);
        try { localStorage.setItem(LS_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
      return ok;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, token]);

  // Применяем акцент/плотность к root
  useEffect(() => {
    const root = document.documentElement;
    if (theme.enabled) {
      root.style.setProperty("--staff-accent", theme.accent_color);
      const pad = theme.ui_density === "compact" ? "6px" : theme.ui_density === "comfortable" ? "14px" : "10px";
      const scale = theme.ui_density === "compact" ? "0.92" : theme.ui_density === "comfortable" ? "1.08" : "1";
      root.style.setProperty("--staff-density", pad);
      root.style.setProperty("--staff-scale", scale);
      root.dataset.staffTheme = "on";
    } else {
      root.style.removeProperty("--staff-accent");
      root.style.removeProperty("--staff-density");
      root.style.removeProperty("--staff-scale");
      delete root.dataset.staffTheme;
    }
  }, [theme.enabled, theme.accent_color, theme.ui_density]);

  const isDirty = !equalTheme(theme, draft);

  return (
    <StaffThemeCtx.Provider value={{ theme, draft, setDraft, saveDraft, resetDraft, isDirty, saving, saved, loaded }}>
      {children}
    </StaffThemeCtx.Provider>
  );
}

export function useStaffTheme() {
  const ctx = useContext(StaffThemeCtx);
  if (!ctx) throw new Error("useStaffTheme must be used within StaffThemeProvider");
  return ctx;
}
