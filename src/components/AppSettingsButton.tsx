import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const GITHUB_API = "https://api.github.com/repos/lekermang/tech-buying-service/releases/latest";
const APK_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk";
const EXE_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe";

type Platform = "tauri" | "capacitor-android" | "web";

const detectPlatform = (): Platform => {
  const w = window as unknown as { __TAURI__?: unknown; Capacitor?: { getPlatform?: () => string } };
  if (w.__TAURI__) return "tauri";
  if (w.Capacitor?.getPlatform?.() === "android") return "capacitor-android";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("tauri")) return "tauri";
  if (ua.includes("skupka24app")) return "capacitor-android";
  return "web";
};

export default function AppSettingsButton() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [latest, setLatest] = useState<{ name: string; published_at: string; tag_name: string } | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [platform] = useState<Platform>(() => detectPlatform());
  const ref = useRef<HTMLDivElement>(null);

  // Закрывать меню при клике вне
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const r = await fetch(GITHUB_API);
      const d = await r.json();
      setLatest({ name: d.name, published_at: d.published_at, tag_name: d.tag_name });
      const known = localStorage.getItem("app_release_seen");
      setUpdateAvailable(known !== d.published_at);
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (platform === "web") return;
    checkUpdate();
  }, [platform]);

  // Только в нативном приложении показываем кнопку
  if (platform === "web") return null;

  const installUpdate = () => {
    if (latest) localStorage.setItem("app_release_seen", latest.published_at);
    const url = platform === "tauri" ? EXE_URL : APK_URL;
    window.open(url, "_blank");
    setOpen(false);
  };

  const clearCache = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Сохраняем токен, чтобы не разлогиниться
      const t = localStorage.getItem("auth_token");
      const tExp = localStorage.getItem("token_expires_at");
      sessionStorage.clear();
      // Не трогаем localStorage целиком, только убираем кэшевые ключи
      const keep = new Set(["auth_token", "token_expires_at", "client_token", "theme_id"]);
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && !keep.has(k)) localStorage.removeItem(k);
      }
      if (t) localStorage.setItem("auth_token", t);
      if (tExp) localStorage.setItem("token_expires_at", tExp);
      alert("Кэш очищен. Приложение перезапустится.");
      window.location.reload();
    } catch (e) {
      alert("Не удалось очистить кэш: " + String(e));
    }
  };

  const restart = () => {
    window.location.reload();
  };

  const buildDate = latest ? new Date(latest.published_at).toLocaleString("ru-RU") : "—";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-md transition-all hover:bg-[#FFD700]/10 hover:shadow-[0_0_10px_rgba(255,215,0,0.15)] ${
          updateAvailable ? "text-[#FFD700]" : "text-white/40 hover:text-[#FFD700]"
        }`}
        title="Настройки приложения"
      >
        <Icon name="Settings" size={16} />
        {updateAvailable && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0E0E0E] border border-[#FFD700]/30 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1F1F1F] bg-gradient-to-r from-[#FFD700]/10 to-transparent">
            <div className="text-[10px] text-[#FFD700]/80 uppercase tracking-wider font-bold">
              Скупка 24 · {platform === "tauri" ? "Windows" : "Android"}
            </div>
            <div className="text-[12px] text-white/70 mt-0.5">
              Сборка: <span className="text-white">{buildDate}</span>
            </div>
            {latest?.tag_name && (
              <div className="text-[11px] text-white/40">Версия: {latest.tag_name}</div>
            )}
          </div>

          {updateAvailable && (
            <button
              onClick={installUpdate}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#FFD700]/10 text-left border-b border-[#1F1F1F]"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FFD700] text-black flex items-center justify-center shrink-0">
                <Icon name="Download" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-[#FFD700]">Доступно обновление</div>
                <div className="text-[11px] text-white/50">Нажмите для установки</div>
              </div>
            </button>
          )}

          <button
            onClick={async () => {
              await checkUpdate();
              if (!updateAvailable) alert("У вас актуальная версия приложения");
            }}
            disabled={checking}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] text-left border-b border-[#1F1F1F]/60 disabled:opacity-50"
          >
            <Icon
              name={checking ? "Loader" : "RefreshCw"}
              size={16}
              className={`text-[#FFD700] ${checking ? "animate-spin" : ""}`}
            />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">Проверить обновление</div>
              <div className="text-[11px] text-white/40">Запросить свежую версию с сервера</div>
            </div>
          </button>

          <button
            onClick={restart}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] text-left border-b border-[#1F1F1F]/60"
          >
            <Icon name="RotateCw" size={16} className="text-white/70" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">Перезапустить</div>
              <div className="text-[11px] text-white/40">Обновить интерфейс</div>
            </div>
          </button>

          <button
            onClick={clearCache}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] text-left border-b border-[#1F1F1F]/60"
          >
            <Icon name="Trash2" size={16} className="text-white/70" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">Очистить кэш</div>
              <div className="text-[11px] text-white/40">Освободить место (логин останется)</div>
            </div>
          </button>

          <a
            href="https://github.com/lekermang/tech-buying-service/releases/latest"
            target="_blank"
            rel="noreferrer"
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] text-left"
          >
            <Icon name="Info" size={16} className="text-white/70" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-white">О приложении</div>
              <div className="text-[11px] text-white/40">Что нового, история сборок</div>
            </div>
            <Icon name="ExternalLink" size={12} className="text-white/30" />
          </a>
        </div>
      )}
    </div>
  );
}