import Dexie, { type Table } from "dexie";

/**
 * Локальная база клиентов на устройстве (IndexedDB через Dexie).
 *
 * Назначение: при наличии интернета подкачиваем последние 200 клиентов
 * с бэкенда. Когда сети нет — сотрудник всё равно может найти клиента
 * по имени/телефону через поиск в табе "Клиенты".
 *
 * Создание новых клиентов офлайн НЕ поддерживается (этап 3 урезан
 * до режима "только просмотр", чтобы избежать конфликтов синхронизации).
 */

export type OfflineClient = {
  id: number;
  full_name: string;
  phone: string;
  email?: string | null;
  source: "registered" | "repair" | "wh" | "manual";
  discount_pct?: number;
  loyalty_points?: number;
  /** Когда последний раз обновили запись локально */
  updated_at: number;
};

class OfflineClientsDB extends Dexie {
  clients!: Table<OfflineClient, number>;
  meta!: Table<{ key: string; value: string | number }, string>;

  constructor() {
    super("skupka24-offline");
    this.version(1).stores({
      clients: "id, phone, full_name, source, updated_at",
      meta: "key",
    });
  }
}

export const offlineDb = new OfflineClientsDB();

/** Положить пачку клиентов (заменяя одинаковые по id) */
export async function saveClients(list: OfflineClient[]): Promise<void> {
  if (!list.length) return;
  await offlineDb.clients.bulkPut(list);
  await offlineDb.meta.put({ key: "last_sync", value: Date.now() });
}

/** Очистить устаревшие записи, оставив последние 200 по updated_at */
export async function trimToLast200(): Promise<void> {
  const count = await offlineDb.clients.count();
  if (count <= 200) return;
  const toRemove = count - 200;
  const oldest = await offlineDb.clients
    .orderBy("updated_at")
    .limit(toRemove)
    .primaryKeys();
  await offlineDb.clients.bulkDelete(oldest);
}

/** Когда последняя синхронизация (timestamp в мс) */
export async function getLastSync(): Promise<number | null> {
  const row = await offlineDb.meta.get("last_sync");
  return row ? (row.value as number) : null;
}

/** Поиск офлайн по имени или телефону (по подстроке, без регистра) */
export async function searchOffline(query: string): Promise<OfflineClient[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return offlineDb.clients
      .orderBy("updated_at")
      .reverse()
      .limit(50)
      .toArray();
  }
  const digits = q.replace(/\D/g, "");
  const all = await offlineDb.clients.toArray();
  return all
    .filter((c) => {
      const name = (c.full_name || "").toLowerCase();
      const phone = (c.phone || "").replace(/\D/g, "");
      return (
        name.includes(q) ||
        (digits.length > 0 && phone.includes(digits))
      );
    })
    .sort((a, b) => b.updated_at - a.updated_at)
    .slice(0, 100);
}

/** Текущее количество клиентов в офлайн-базе */
export async function getOfflineCount(): Promise<number> {
  return offlineDb.clients.count();
}
