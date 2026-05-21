import { useEffect, useRef, useState } from "react";
import {
  saveClients,
  trimToLast200,
  getLastSync,
  getOfflineCount,
  type OfflineClient,
} from "@/lib/offlineClients";

const REPAIR_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";
const AUTH_CLIENT_URL = "https://functions.poehali.dev/58edd0bc-cce3-4ece-acca-a003e2260758";

/** Интервал синхронизации — каждые 10 минут пока есть сеть */
const SYNC_EVERY_MS = 10 * 60 * 1000;

type Status = {
  online: boolean;
  syncing: boolean;
  lastSync: number | null;
  count: number;
};

/**
 * Хук поддерживает офлайн-кэш последних 200 клиентов.
 * Запускается на /staff после логина (когда есть token).
 *
 * При наличии сети:
 *   - дёргает /auth-client?action=list  (база программы скидок)
 *   - дёргает /repair-admin?action=sms_contacts&group=all  (все клиенты)
 *   - сливает, оставляет последние 200 по updated_at, кладёт в IndexedDB.
 */
export function useOfflineClientsSync(token: string): Status {
  const [status, setStatus] = useState<Status>({
    online: navigator.onLine,
    syncing: false,
    lastSync: null,
    count: 0,
  });
  const inFlight = useRef(false);

  // Обновляем флаг "онлайн"
  useEffect(() => {
    const on = () => setStatus((s) => ({ ...s, online: true }));
    const off = () => setStatus((s) => ({ ...s, online: false }));
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Подтянем стартовые метрики
  useEffect(() => {
    (async () => {
      const [ls, count] = await Promise.all([getLastSync(), getOfflineCount()]);
      setStatus((s) => ({ ...s, lastSync: ls, count }));
    })();
  }, []);

  // Главная синхронизация
  useEffect(() => {
    if (!token) return;

    const sync = async () => {
      if (inFlight.current || !navigator.onLine) return;
      inFlight.current = true;
      setStatus((s) => ({ ...s, syncing: true }));
      try {
        const headers = { "X-Employee-Token": token };

        const [discRes, smsRes] = await Promise.allSettled([
          fetch(`${AUTH_CLIENT_URL}?action=list`, { headers }),
          fetch(`${REPAIR_URL}?action=sms_contacts&group=all`, { headers }),
        ]);

        const merged = new Map<string, OfflineClient>();
        const now = Date.now();

        if (discRes.status === "fulfilled" && discRes.value.ok) {
          const d = await discRes.value.json();
          for (const c of d.clients || []) {
            const key = `disc-${c.id}`;
            merged.set(key, {
              id: c.id,
              full_name: c.full_name || "",
              phone: c.phone || "",
              email: c.email || null,
              source: "registered",
              discount_pct: c.discount_pct,
              loyalty_points: c.loyalty_points,
              updated_at: now,
            });
          }
        }

        if (smsRes.status === "fulfilled" && smsRes.value.ok) {
          const d = await smsRes.value.json();
          for (const c of d.contacts || []) {
            const numericId =
              typeof c.id === "number" ? c.id : Number(String(c.id).replace(/\D/g, "")) || 0;
            if (!numericId) continue;
            const key = `sms-${numericId}`;
            // Если такого ещё нет — кладём, иначе оставляем приоритет discount-источника
            if (!merged.has(key)) {
              merged.set(key, {
                id: numericId + 1_000_000, // защита от коллизий
                full_name: c.full_name || "",
                phone: c.phone || "",
                source: (c.source as OfflineClient["source"]) || "repair",
                updated_at: now,
              });
            }
          }
        }

        const list = Array.from(merged.values());
        if (list.length) {
          await saveClients(list);
          await trimToLast200();
        }
        const [ls, count] = await Promise.all([getLastSync(), getOfflineCount()]);
        setStatus((s) => ({ ...s, lastSync: ls, count, syncing: false }));
      } catch (e) {
        console.warn("[offline-sync] failed", e);
        setStatus((s) => ({ ...s, syncing: false }));
      } finally {
        inFlight.current = false;
      }
    };

    sync();
    const iv = setInterval(sync, SYNC_EVERY_MS);
    const onOnline = () => sync();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(iv);
      window.removeEventListener("online", onOnline);
    };
  }, [token]);

  return status;
}
