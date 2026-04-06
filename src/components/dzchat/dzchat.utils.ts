 
export const API = "https://functions.poehali.dev/608c7976-816a-4e3e-b374-5dd617b045bf";

export const api = async (action: string, method = "GET", body?: object, token?: string) => {
  const res = await fetch(`${API}?action=${action}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Session-Token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return d.toLocaleDateString("ru-RU", { weekday: "short" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};
