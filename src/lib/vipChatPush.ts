/**
 * Web Push для чата СКУПКА24Vip.
 * Регистрирует service worker, оформляет подписку и сохраняет её на бэкенде.
 */

const VIP_CHAT_URL = "https://functions.poehali.dev/f4a88e67-03e7-4387-a091-32588d90df73";

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

const callApi = async (action: string, token: string, extra: Record<string, unknown> = {}) => {
  const res = await fetch(VIP_CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Employee-Token": token },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json();
};

export const isPushSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getNotificationPermission = (): NotificationPermission => {
  if (typeof Notification === "undefined") return "denied";
  return Notification.permission;
};

/** Полный поток: запросить разрешение → SW → подписка → сохранить на сервере. */
export async function enableVipChatPush(token: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: "Браузер не поддерживает push-уведомления" };
  if (!token) return { ok: false, error: "Нет токена сотрудника" };

  // 1. Разрешение
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, error: "Разрешение на уведомления отклонено" };

  // 2. Service Worker
  let registration: ServiceWorkerRegistration | null = null;
  try {
    registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register("/sw.js");
    }
    await navigator.serviceWorker.ready;
  } catch (e) {
    return { ok: false, error: `SW не зарегистрирован: ${e instanceof Error ? e.message : e}` };
  }

  // 3. VAPID public
  let pubKey = "";
  try {
    const { public_key } = await callApi("vapid_public", token);
    pubKey = public_key || "";
  } catch (e) {
    return { ok: false, error: "Не удалось получить VAPID public key" };
  }
  if (!pubKey) return { ok: false, error: "VAPID public key не настроен на сервере" };

  // 4. Подписка
  let sub: PushSubscription | null = null;
  try {
    sub = await registration.pushManager.getSubscription();
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pubKey),
      });
    }
  } catch (e) {
    return { ok: false, error: `Подписка не создана: ${e instanceof Error ? e.message : e}` };
  }

  // 5. Сохранить на сервере
  try {
    const json = sub.toJSON();
    const data = await callApi("push_subscribe", token, {
      subscription: json,
      user_agent: navigator.userAgent,
    });
    if (data.error) return { ok: false, error: data.error };
  } catch (e) {
    return { ok: false, error: "Не удалось сохранить подписку на сервере" };
  }

  return { ok: true };
}

/** Отключение: тихо снимает подписку у браузера и сообщает серверу. */
export async function disableVipChatPush(token: string): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      try { await sub.unsubscribe(); } catch (_) { /* ignore */ }
      await callApi("push_unsubscribe", token, { endpoint });
    }
  } catch (_) { /* ignore */ }
}

/** Текущее состояние подписки: есть ли активная, разрешено ли. */
export async function vipChatPushState(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (!isPushSupported()) {
    return { supported: false, permission: "denied", subscribed: false };
  }
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    subscribed = !!sub;
  } catch (_) { /* ignore */ }
  return {
    supported: true,
    permission: Notification.permission,
    subscribed,
  };
}
