import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { getOfflineCount, getLastSync } from "@/lib/offlineClients";

export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [cacheCount, setCacheCount] = useState<number>(0);
  const [lastSync, setLastSync] = useState<number | null>(null);

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

  useEffect(() => {
    if (online) return;
    (async () => {
      try {
        const [c, ls] = await Promise.all([getOfflineCount(), getLastSync()]);
        setCacheCount(c);
        setLastSync(ls);
      } catch {/* ignore */}
    })();
  }, [online]);

  if (online) return null;

  const ago = lastSync ? formatAgo(Date.now() - lastSync) : "ещё не было";

  return (
    <div className="w-full py-1.5 px-3 text-center text-[11px] font-roboto font-bold bg-red-500/15 text-red-300 border-b border-red-500/20 flex items-center justify-center gap-2">
      <Icon name="WifiOff" size={12} />
      Нет интернета · {cacheCount > 0
        ? <>в кэше <b>{cacheCount}</b> клиентов · синхр. {ago}</>
        : <>работаем офлайн</>}
    </div>
  );
}

function formatAgo(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return "только что";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const d = Math.floor(hr / 24);
  return `${d} дн назад`;
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