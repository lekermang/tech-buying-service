import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const RELEASES_API = "https://api.github.com/repos/lekermang/tech-buying-service/releases/latest";

export default function AppSettingsMenu() {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const checkUpdate = async () => {
    setChecking(true);
    setUpdateMsg(null);
    try {
      const r = await fetch(RELEASES_API);
      const d = await r.json();
      const tag = d.tag_name || d.name || "";
      setLatestVersion(tag);
      const published = d.published_at ? new Date(d.published_at).toLocaleString("ru-RU") : "";
      setUpdateMsg(`Свежая сборка от ${published}. Скачай заново — ниже кнопки.`);
    } catch {
      setUpdateMsg("Не удалось проверить. Проверь интернет.");
    } finally {
      setChecking(false);
    }
  };

  const clearCache = async () => {
    if (!confirm("Очистить кэш приложения и перезагрузить?")) return;
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      localStorage.removeItem("__chunk_reload__");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const reload = () => window.location.reload();

  const downloadExe = () => {
    window.open(
      "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe",
      "_blank",
    );
  };
  const downloadApk = () => {
    window.open(
      "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk",
      "_blank",
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Настройки приложения"
        className="text-white/40 hover:text-[#FFD700] active:text-[#FFD700] transition-all p-2 rounded-md hover:bg-[#FFD700]/10 hover:shadow-[0_0_10px_rgba(255,215,0,0.15)]"
      >
        <Icon name="Settings" size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0E0E0E] border border-[#FFD700]/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-[#1F1F1F] flex items-center gap-2">
            <Icon name="Settings" size={14} className="text-[#FFD700]" />
            <div className="font-oswald font-bold text-[12px] text-white uppercase tracking-wider">
              Настройки приложения
            </div>
          </div>

          <button
            onClick={checkUpdate}
            disabled={checking}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.04] border-b border-[#1F1F1F]/60 text-left transition disabled:opacity-50"
          >
            <Icon
              name={checking ? "Loader" : "RefreshCw"}
              size={15}
              className={`text-[#FFD700] ${checking ? "animate-spin" : ""}`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold">Проверить обновление</div>
              <div className="text-[10px] text-white/40">
                {latestVersion ? `Последняя версия: ${latestVersion}` : "Узнать о новой версии"}
              </div>
            </div>
          </button>

          {updateMsg && (
            <div className="px-4 py-2 text-[10px] text-white/60 bg-[#FFD700]/[0.04] border-b border-[#1F1F1F]/60">
              {updateMsg}
            </div>
          )}

          <button
            onClick={downloadExe}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] border-b border-[#1F1F1F]/60 text-left transition"
          >
            <Icon name="MonitorDown" size={15} className="text-blue-400" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold">Скачать для Windows</div>
              <div className="text-[10px] text-white/40">Установщик .exe</div>
            </div>
            <Icon name="ExternalLink" size={11} className="text-white/30" />
          </button>

          <button
            onClick={downloadApk}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] border-b border-[#1F1F1F]/60 text-left transition"
          >
            <Icon name="Smartphone" size={15} className="text-green-400" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold">Скачать для Android</div>
              <div className="text-[10px] text-white/40">Установщик .apk</div>
            </div>
            <Icon name="ExternalLink" size={11} className="text-white/30" />
          </button>

          <button
            onClick={reload}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] border-b border-[#1F1F1F]/60 text-left transition"
          >
            <Icon name="RotateCw" size={15} className="text-white/70" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold">Перезагрузить</div>
              <div className="text-[10px] text-white/40">Обновить страницу без очистки кэша</div>
            </div>
          </button>

          <button
            onClick={clearCache}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] border-b border-[#1F1F1F]/60 text-left transition"
          >
            <Icon name="Trash2" size={15} className="text-red-400/80" />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white font-semibold">Очистить кэш</div>
              <div className="text-[10px] text-white/40">Если что-то не работает</div>
            </div>
          </button>

          <div className="px-4 py-2.5 text-[10px] text-white/40 text-center bg-[#080808]">
            Скупка 24 · приложение сотрудника
          </div>
        </div>
      )}
    </div>
  );
}
