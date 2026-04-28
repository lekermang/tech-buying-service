import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="w-full py-1.5 px-3 text-center text-[11px] font-roboto font-bold bg-red-500/15 text-red-300 border-b border-red-500/20 flex items-center justify-center gap-2">
      <Icon name="WifiOff" size={12} />
      Нет подключения к интернету — работаем в режиме офлайн
    </div>
  );
}

export function UpdateAvailableBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let mounted = true;
    navigator.serviceWorker.getRegistration("/staff").then((reg) => {
      if (!reg || !mounted) return;
      if (reg.waiting) setWaiting(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(sw);
          }
        });
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!waiting) return null;

  const reload = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
    // SW сам активируется и обновит страницу
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="w-full py-1.5 px-3 text-center text-[11px] font-roboto font-bold bg-blue-500/15 text-blue-300 border-b border-blue-500/20 flex items-center justify-center gap-2">
      <Icon name="Sparkles" size={12} />
      Доступно обновление приложения
      <button
        onClick={reload}
        className="ml-2 px-2 py-0.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white font-bold uppercase tracking-wide"
      >
        Обновить
      </button>
    </div>
  );
}
