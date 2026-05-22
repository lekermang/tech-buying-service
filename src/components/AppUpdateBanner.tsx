import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

/**
 * Баннер «Доступно обновление приложения» для нативного .exe (Tauri) и .apk (Capacitor).
 *
 * Логика:
 *  - Раз в 30 минут идёт на GitHub Releases API и берёт published_at последнего релиза.
 *  - Если значение отличается от сохранённого — показывает баннер «Установить сейчас».
 *  - Клик «Установить» открывает прямую ссылку на .exe / .apk (браузер скачает, ОС запустит установщик).
 *  - Клик «Позже» — прячет на 24 часа.
 *  - Виден только когда страница открыта внутри обёрнутого приложения (Tauri/Capacitor).
 */

const GITHUB_API = "https://api.github.com/repos/lekermang/tech-buying-service/releases/latest";
const RELEASES_PAGE = "https://github.com/lekermang/tech-buying-service/releases/latest";
const APK_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk";
const EXE_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe";
const LS_KEY = "skupka24_app_version";
const LS_SNOOZE = "skupka24_app_snooze_until";
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const SNOOZE_HOURS = 24;

type Platform = "tauri" | "capacitor" | "browser";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "browser";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__TAURI__) return "tauri";
  if (w.Capacitor) return "capacitor";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("tauri") || ua.includes("wry")) return "tauri";
  if (ua.includes("capacitor") || (ua.includes("android") && ua.includes("wv"))) return "capacitor";
  return "browser";
}

export default function AppUpdateBanner() {
  const [platform] = useState<Platform>(() => detectPlatform());
  const [newRelease, setNewRelease] = useState<{ name: string; published_at: string } | null>(null);
  const [installing, setInstalling] = useState(false);

  const isNative = platform === "tauri" || platform === "capacitor";

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;

    const check = async () => {
      try {
        const snoozeUntil = parseInt(localStorage.getItem(LS_SNOOZE) || "0", 10);
        if (snoozeUntil && Date.now() < snoozeUntil) return;

        const r = await fetch(GITHUB_API, { headers: { Accept: "application/vnd.github+json" } });
        if (!r.ok) return;
        const d = await r.json();
        const sig = `${d?.tag_name || ""}|${d?.published_at || ""}`;
        if (!sig || cancelled) return;

        const known = localStorage.getItem(LS_KEY);
        if (!known) {
          localStorage.setItem(LS_KEY, sig);
          return;
        }
        if (known !== sig) {
          setNewRelease({
            name: d?.name || d?.tag_name || "новая версия",
            published_at: d?.published_at,
          });
        }
      } catch { /* ignore */ }
    };

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [isNative]);

  if (!isNative || !newRelease) return null;

  const onInstall = () => {
    setInstalling(true);
    const url = platform === "capacitor" ? APK_URL : EXE_URL;
    try {
      window.location.href = url;
    } catch {
      window.open(RELEASES_PAGE, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => {
      try {
        const sig = `${newRelease.name}|${newRelease.published_at}`;
        localStorage.setItem(LS_KEY, sig);
      } catch { /* ignore */ }
      setInstalling(false);
      setNewRelease(null);
    }, 1500);
  };

  const onLater = () => {
    try {
      localStorage.setItem(LS_SNOOZE, String(Date.now() + SNOOZE_HOURS * 3600 * 1000));
    } catch { /* ignore */ }
    setNewRelease(null);
  };

  const dateStr = newRelease.published_at
    ? new Date(newRelease.published_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="fixed top-2 left-2 right-2 z-[200] max-w-md mx-auto">
      <div className="rounded-xl bg-gradient-to-br from-[#1A1300] via-[#0E0E0E] to-[#1A1300] border border-[#FFD700]/40 shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_24px_rgba(255,215,0,0.18)] overflow-hidden animate-in slide-in-from-top duration-300">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#FFD700]/15 flex items-center justify-center shrink-0 animate-pulse">
            <Icon name="Download" size={15} className="text-[#FFD700]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-white leading-tight">Доступно обновление</div>
            <div className="text-[10px] text-white/55 truncate">
              {newRelease.name}{dateStr ? ` · ${dateStr}` : ""}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 px-2 pb-2">
          <button
            onClick={onLater}
            className="py-2 rounded-md bg-white/5 border border-white/10 text-white/65 text-[11px] font-semibold hover:bg-white/10 transition"
          >
            Позже
          </button>
          <button
            onClick={onInstall}
            disabled={installing}
            className="py-2 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[11px] font-bold uppercase tracking-wider hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-1"
          >
            {installing ? (
              <Icon name="Loader" size={12} className="animate-spin" />
            ) : (
              <Icon name="ArrowDownToLine" size={12} />
            )}
            Установить
          </button>
        </div>
      </div>
    </div>
  );
}
