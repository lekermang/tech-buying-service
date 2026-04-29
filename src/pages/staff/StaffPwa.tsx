import { useState, useEffect, Component, type ReactNode } from "react";
import Icon from "@/components/ui/icon";
import { useStaffTheme } from "../staffTheme/StaffThemeContext";

export class TabErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error) { console.error("[TabError]", e); }
  render() {
    if (this.state.error) return (
      <div className="p-6 text-center">
        <div className="text-red-400 font-roboto text-sm mb-3">Ошибка загрузки раздела</div>
        <div className="text-white/30 font-roboto text-xs mb-4">{this.state.error}</div>
        <button onClick={() => this.setState({ error: null })}
          className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 text-sm uppercase">
          Обновить
        </button>
      </div>
    );
    return this.props.children;
  }
}

export function MskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
  const hh = msk.getHours().toString().padStart(2, "0");
  const mm = msk.getMinutes().toString().padStart(2, "0");
  const ss = msk.getSeconds().toString().padStart(2, "0");
  const date = msk.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", weekday: "short" });
  return (
    <div className="text-center leading-tight">
      <div className="font-oswald font-bold text-[#FFD700] text-base tracking-wider tabular-nums flex items-baseline justify-center gap-0.5">
        <span>{hh}</span>
        <span className="animate-pulse opacity-70">:</span>
        <span>{mm}</span>
        <span className="text-[#FFD700]/40 text-xs ml-0.5 tabular-nums">{ss}</span>
      </div>
      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">{date} · МСК</div>
    </div>
  );
}

export function useStaffPwa() {
  useEffect(() => {
    // Динамически подменяем manifest на /staff
    const head = document.head;
    const prev = head.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevHref = prev?.href || "";
    const link = prev || document.createElement("link");
    link.rel = "manifest";
    link.href = "/staff-manifest.json";
    if (!prev) head.appendChild(link);

    // theme-color для статус-бара
    let themeMeta = head.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prevTheme = themeMeta?.content || "";
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      head.appendChild(themeMeta);
    }
    themeMeta.content = "#0A0A0A";

    // Apple title для иконки на рабочем столе
    let appleTitle = head.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const prevTitle = appleTitle?.content || "";
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      head.appendChild(appleTitle);
    }
    appleTitle.content = "Скупка24";

    // Регистрация лёгкого SW для /staff PWA (offline старт)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/staff-sw.js", { scope: "/staff" }).catch(() => {});
    }

    return () => {
      // Возвращаем как было, чтобы не ломать другие страницы при SPA-навигации
      if (prev && prevHref) prev.href = prevHref;
      if (themeMeta && prevTheme) themeMeta.content = prevTheme;
      if (appleTitle && prevTitle) appleTitle.content = prevTitle;
    };
  }, []);
}

export function FontApplier() {
  const { theme } = useStaffTheme();
  useEffect(() => {
    const root = document.documentElement;
    if (!theme.enabled) { root.style.removeProperty("--staff-font"); return; }
    const map: Record<string, string> = {
      roboto: "'Roboto', sans-serif",
      oswald: "'Oswald', sans-serif",
      inter: "'Inter', sans-serif",
      mplus: "'M PLUS Rounded 1c', sans-serif",
    };
    root.style.setProperty("--staff-font", map[theme.font_family] || map.roboto);
  }, [theme.enabled, theme.font_family]);
  return null;
}

export function ThemeBanner({ onOpen }: { onOpen: () => void }) {
  const { theme, saved } = useStaffTheme();
  if (saved) {
    return (
      <div className="w-full py-1.5 px-3 text-center text-[11px] font-roboto font-bold"
        style={{ background: theme.accent_color + "22", color: theme.accent_color }}>
        ✓ Настройки темы сохранены
      </div>
    );
  }
  return (
    <button onClick={onOpen}
      className="w-full py-1.5 px-3 flex items-center justify-center gap-2 text-[11px] font-roboto transition-colors hover:bg-white/5"
      style={{ background: theme.accent_color + "11", color: theme.accent_color }}>
      <span>✨</span>
      <span className="font-bold">Моя аниме-тема</span>
      <span className="opacity-70 hidden sm:inline">— настроить персонажа и эффекты</span>
    </button>
  );
}
