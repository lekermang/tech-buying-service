export const UNLOCK_URL = "https://functions.poehali.dev/06607e09-1cc5-4df8-bccf-ed619806e834";
export const ADMIN_TOKEN = "Mark2015N";

// Все запросы через POST с токеном в body — обходим фильтрацию заголовков платформой
export async function apiPost(body: object) {
  const r = await fetch(UNLOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": ADMIN_TOKEN },
    body: JSON.stringify({ ...body, admin_token: ADMIN_TOKEN }),
  });
  return r.json();
}
export async function apiGet(action: string) {
  return apiPost({ action });
}

export interface MarkupRow { id: number; category: string; multiplier: string; pct: string; note: string; }
export interface Order {
  id: number; gsm_order_id: string | null; service_name: string;
  imei: string; quantity: number; price_credits: string | null;
  price_client: string | null; status: string; created_at: string;
  client_name?: string; client_email?: string; client_id?: number;
}
export interface Tx {
  id: number; type: string; amount: string; payment_status: string;
  description: string | null; created_at: string;
  client_name?: string; client_email?: string; client_id?: number;
}
export interface Client {
  id: number; full_name: string; email: string; phone: string;
  registered_at: string; order_count: number; total_spent: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  default: "Все остальные", icloud: "iCloud unlock",
  frp: "FRP / Google", server: "Server unlock", imei: "IMEI check",
};
export const CATEGORY_COLORS: Record<string, string> = {
  default: "#FFD700", icloud: "#fff3a0", frp: "#7dd3fc",
  server: "#fca5a5", imei: "#86efac",
};
export const CATEGORY_ICONS: Record<string, string> = {
  default: "Settings2", icloud: "Apple", frp: "ShieldOff",
  server: "Cpu", imei: "Smartphone",
};
export const STATUS_COLOR: Record<string, string> = {
  sent: "#7dd3fc", completed: "#6ee7b7", approved: "#6ee7b7",
  pending: "#FFD700", processing: "#c4b5fd", error: "#fca5a5",
};
export const STATUS_LABEL: Record<string, string> = {
  sent: "Отправлен", completed: "Выполнен", approved: "Одобрен",
  pending: "Ожидает", processing: "В работе", error: "Ошибка",
};
