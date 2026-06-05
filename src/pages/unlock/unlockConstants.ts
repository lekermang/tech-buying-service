/* ── URLs ───────────────────────────────────────────────────────────────── */
export const AUTH_URL   = "https://functions.poehali.dev/420ad7e7-26c9-4540-9369-6bca5d26d3aa";
export const UNLOCK_URL = "https://functions.poehali.dev/06607e09-1cc5-4df8-bccf-ed619806e834";
export const AI_URL     = "https://functions.poehali.dev/fe968c8f-eb07-4a9c-9993-341972bfef48";

/* ── Token helpers ───────────────────────────────────────────────────────── */
export function getToken() { return localStorage.getItem("unlock_token") || ""; }
export function setToken(t: string) { localStorage.setItem("unlock_token", t); }
export function clearToken() { localStorage.removeItem("unlock_token"); }

/* ── API helpers ─────────────────────────────────────────────────────────── */
export async function aiCall(body: object) {
  const r = await fetch(AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Token": getToken() },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function authCall(body: object) {
  const r = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export async function apiCall(action: string, params: Record<string, unknown> = {}, method: "GET" | "POST" = "GET") {
  const token = getToken();
  if (method === "GET") {
    const qs = new URLSearchParams({ action });
    const r = await fetch(`${UNLOCK_URL}?${qs}`, {
      headers: { "X-Client-Token": token },
    });
    return r.json();
  }
  const r = await fetch(UNLOCK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Client-Token": token },
    body: JSON.stringify({ action, ...params }),
  });
  return r.json();
}

/* ── Стили ───────────────────────────────────────────────────────────────── */
export const INP = [
  "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all",
  "bg-white/[0.04] border border-white/10",
  "focus:border-[rgba(255,215,0,0.4)] focus:bg-white/[0.06]",
  "placeholder:text-white/25",
].join(" ");

export const STATUS_COLOR: Record<string, string> = {
  completed: "#6ee7b7", approved: "#6ee7b7", success: "#6ee7b7",
  sent: "#7dd3fc", processing: "#7dd3fc", inprogress: "#7dd3fc",
  pending: "#FFD700", queued: "#c4b5fd",
  error: "#fca5a5", failed: "#fca5a5",
};

export const STATUS_LABEL: Record<string, string> = {
  completed: "Выполнен", approved: "Одобрен", sent: "Отправлен",
  processing: "В обработке", inprogress: "В работе", pending: "Ожидает",
  queued: "В очереди", error: "Ошибка", failed: "Не выполнен",
};
