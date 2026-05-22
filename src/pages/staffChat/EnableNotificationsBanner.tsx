import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const VIP_CHAT_URL = (funcUrls as Record<string, string>)["vip-chat"];

/** Преобразование VAPID public key (base64url) → Uint8Array для PushManager.subscribe. */
function urlBase64ToUint8(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type Status = "checking" | "unsupported" | "blocked" | "enabled" | "available";

export default function EnableNotificationsBanner({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          setStatus("unsupported");
          return;
        }
        if (Notification.permission === "denied") {
          setStatus("blocked");
          return;
        }
        const reg = await navigator.serviceWorker.getRegistration("/staff");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub && Notification.permission === "granted") {
          setStatus("enabled");
        } else {
          setStatus("available");
        }
      } catch {
        setStatus("unsupported");
      }
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      // 1) Permission
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "blocked" : "available");
        return;
      }
      // 2) VAPID public key
      const r = await fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vapid_public" }),
      });
      const { public_key } = await r.json();
      if (!public_key) throw new Error("Сервер не вернул VAPID ключ");

      // 3) Регистрация SW (если ещё нет)
      let reg = await navigator.serviceWorker.getRegistration("/staff");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/staff-sw.js", { scope: "/staff" });
      }

      // 4) Подписка
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8(public_key),
      });

      // 5) Отправка на backend
      const subJson = sub.toJSON();
      const save = await fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "X-Employee-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push_subscribe",
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
          user_agent: navigator.userAgent,
        }),
      });
      const sv = await save.json();
      if (sv.error) throw new Error(sv.error);

      setStatus("enabled");
      setMsg("Уведомления включены");
    } catch (e) {
      setMsg("Не удалось включить: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking" || status === "enabled") return null;

  if (status === "unsupported") {
    return (
      <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/55 text-[11px] flex items-center gap-2">
        <Icon name="BellOff" size={13} />
        Браузер не поддерживает уведомления. Установи приложение (Windows/Android) для push-сигналов.
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[11px] flex items-center gap-2">
        <Icon name="BellOff" size={13} />
        Уведомления заблокированы. Разреши их в настройках сайта (значок 🔒 рядом с адресом).
      </div>
    );
  }

  return (
    <div className="px-3 py-2 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/10 flex items-center gap-2">
      <Icon name="Bell" size={14} className="text-[#FFD700] shrink-0" />
      <div className="flex-1 text-[11px] text-white/85">
        Включи уведомления — будешь получать сообщения и заявки даже когда вкладка закрыта.
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="px-3 py-1.5 rounded-md bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[11px] font-bold disabled:opacity-50"
      >
        {busy ? "…" : "Включить"}
      </button>
      {msg && <span className="text-[10px] text-emerald-300 ml-2">{msg}</span>}
    </div>
  );
}
