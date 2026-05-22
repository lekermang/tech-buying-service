import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const CAB_URL = (funcUrls as Record<string, string>)["client-cabinet"];

type Status = "checking" | "unsupported" | "denied" | "off" | "on" | "subscribing";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export default function ClientNotificationsBanner({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [hidden, setHidden] = useState(false);

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!isSupported) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    // Регистрируем SW кабинета клиента
    navigator.serviceWorker
      .register("/client-sw.js", { scope: "/client" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, [isSupported]);

  const enable = async () => {
    setStatus("subscribing");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      // Получаем VAPID public key
      const vapidRes = await fetch(CAB_URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vapid_public" }),
      });
      const { public_key } = await vapidRes.json();
      if (!public_key) {
        setStatus("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });
      const subJson = sub.toJSON();
      await fetch(CAB_URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push_subscribe",
          subscription: { endpoint: subJson.endpoint, keys: subJson.keys },
          user_agent: navigator.userAgent,
        }),
      });
      setStatus("on");
    } catch {
      setStatus("off");
    }
  };

  const disable = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(CAB_URL, {
          method: "POST",
          headers: { "X-Client-Token": token, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "push_unsubscribe", endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      // ignore
    }
  };

  if (hidden) return null;
  if (status === "checking") return null;
  if (status === "unsupported") return null;

  if (status === "on") {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center shrink-0">
          <Icon name="BellRing" size={14} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white">Уведомления включены</div>
          <div className="text-[10px] text-white/50">
            Получишь сигнал при готовности ремонта или ответе менеджера.
          </div>
        </div>
        <button
          onClick={disable}
          className="text-[10px] text-white/40 hover:text-red-400 underline whitespace-nowrap"
        >
          Отключить
        </button>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
          <Icon name="BellOff" size={14} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold text-white">Уведомления заблокированы</div>
          <div className="text-[10px] text-white/50">
            Разреши их в настройках браузера, чтобы получать статус ремонта.
          </div>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="p-1 rounded hover:bg-white/10"
          title="Скрыть"
        >
          <Icon name="X" size={14} className="text-white/40" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#FFD700]/10 via-[#FFD700]/5 to-transparent border border-[#FFD700]/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
        <Icon name="Bell" size={14} className="text-[#FFD700]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-white">Включи уведомления</div>
        <div className="text-[10px] text-white/55">
          Узнавай мгновенно: ремонт готов, менеджер ответил, статус залога.
        </div>
      </div>
      <button
        onClick={enable}
        disabled={status === "subscribing"}
        className="shrink-0 px-3 py-1.5 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[11px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 active:scale-95 transition"
      >
        {status === "subscribing" ? (
          <Icon name="Loader" size={12} className="animate-spin" />
        ) : (
          "Включить"
        )}
      </button>
      <button
        onClick={() => setHidden(true)}
        className="p-1 rounded hover:bg-white/10"
        title="Скрыть"
      >
        <Icon name="X" size={12} className="text-white/40" />
      </button>
    </div>
  );
}
