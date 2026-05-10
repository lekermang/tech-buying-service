export const PUBLIC_CHAT_URL = "https://functions.poehali.dev/db114166-21ce-4b87-9d05-59286ee73d6e";
export const PCHAT_TOKEN_KEY = "pchat_token";
export const PCHAT_NAME_KEY = "pchat_name";
export const PCHAT_PHONE_KEY = "pchat_phone";
export const PCHAT_DIRECT_KEY = "pchat_direct_room";
export const POLL_INTERVAL_MS = 4000;

export type Room = {
  id: number;
  type: "public" | "direct";
  title: string;
  unread?: number;
  max_id?: number;
  client_phone?: string | null;
  client_name?: string | null;
  last_message_at?: string | null;
  last_message_text?: string | null;
};

export type Message = {
  id: number;
  author_type: "client" | "employee" | "system";
  author_id: number;
  author_name: string;
  author_avatar: string | null;
  text: string | null;
  photo_url: string | null;
  is_system: boolean;
  created_at: string;
  /** Телефон автора-клиента (если есть и не guest:/tg:) — показываем менеджеру в Live */
  author_phone?: string | null;
};

export const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

export const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
  } catch { return ""; }
};

export async function pchatApi(action: string, body: Record<string, unknown> = {}, token?: string): Promise<{ ok: boolean; [k: string]: unknown }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Pchat-Token"] = token;
  try {
    const r = await fetch(`${PUBLIC_CHAT_URL}?action=${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch {
    return { ok: false, error: "network" };
  }
}