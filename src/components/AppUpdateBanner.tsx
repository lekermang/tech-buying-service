import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

/**
 * Баннер «Доступно обновление приложения» для нативного .exe (Tauri) и .apk (Capacitor).
 *
 * Логика:
 *  - Раз в 6 часов идёт на GitHub Releases API и берёт tag_name последнего релиза.
 *  - Сохраняет известную версию в localStorage. Если её там не было — сохраняет тихо.
 *    Если в новом ответе версия отличается — показывает баннер с кнопкой «Скачать».
 *  - Виден только когда страница открыта внутри обёрнутого приложения (Tauri/Capacitor) — в обычном браузере прячется.
 */

const GITHUB_API = "https://api.github.com/repos/lekermang/tech-buying-service/releases/latest";
const RELEASES_PAGE = "https://github.com/lekermang/tech-buying-service/releases/latest";
const LS_KEY = "skupka24_app_version";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function isNativeApp(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  // Tauri/wry/Capacitor вшивают идентификатор в UA. Также проверяем window.__TAURI__.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return Boolean(w.__TAURI__ || w.Capacitor || ua.includes("tauri") || ua.includes("wry") || ua.includes("capacitor"));
}

export default function AppUpdateBanner() {
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;

    const check = async () => {
      try {
        const r = await fetch(GITHUB_API, { headers: { Accept: "application/vnd.github+json" } });
        if (!r.ok) return;
        const d = await r.json();
        const tag = (d?.tag_name || d?.name || "").trim();
        if (!tag || cancelled) return;
        // Используем поле published_at как сигнатуру (тег "latest" не меняется, а published_at — да)
        const sig = `${tag}|${d?.published_at || ""}`;
        const known = localStorage.getItem(LS_KEY);
        if (!known) {
          localStorage.setItem(LS_KEY, sig);
          return;
        }
        if (known !== sig) {
          setNewVersion(d?.name || tag);
        }
      } catch { /* ignore */ }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!newVersion || dismissed) return null;

  const onUpdate = () => {
    // помечаем как известную, чтобы не предлагал повторно сразу
    try {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = ua.includes("android") || ua.includes("capacitor");
      const url = isAndroid
        ? "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk"
        : "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe";
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(RELEASES_PAGE, "_blank", "noopener,noreferrer");
    }
  };

  const onDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="fixed top-2 left-2 right-2 z-[200] max-w-md mx-auto">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-[#1A1300] via-[#0E0E0E] to-[#1A1300] border border-[#FFD700]/40 shadow-[0_8px_24px_rgba(0,0,0,0.5),0_0_20px_rgba(255,215,0,0.15)] animate-in slide-in-from-top duration-300">
        <div className="w-7 h-7 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0">
          <Icon name="ArrowDownToLine" size={14} className="text-[#FFD700]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white leading-tight">Доступно обновление</div>
          <div className="text-[10px] text-white/55 truncate">{newVersion}</div>
        </div>
        <button
          onClick={onUpdate}
          className="px-3 py-1.5 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[11px] font-bold uppercase tracking-wider hover:brightness-110"
        >
          Скачать
        </button>
        <button onClick={onDismiss} className="text-white/40 hover:text-white p-1">
          <Icon name="X" size={14} />
        </button>
      </div>
    </div>
  );
}
