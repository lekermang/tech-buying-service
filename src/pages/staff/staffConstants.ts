export type StaffTab =
  | "goods"
  | "sales"
  | "clients"
  | "analytics"
  | "employees"
  | "repair"
  | "chat"
  | "gold";

export const PRICE_SCHEDULER_URL =
  "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

export const VIP_CHAT_URL =
  "https://functions.poehali.dev/f4a88e67-03e7-4387-a091-32588d90df73";

// Пароль для разделов, доступных только сотрудникам по доп. подтверждению
export const SECRET_PW = "Mark2015N";

// Какие вкладки требуют доп. пароль (для НЕ-владельца)
export const PROTECTED_TABS: ReadonlyArray<StaffTab> = ["gold", "analytics", "employees"];

// Тип записи табов в нижней панели
export type TabConfig = {
  k: StaffTab;
  l: string;
  icon: string;
  badge?: number;
  ownerOnly?: boolean;
};

export const ROLE_BADGE: Record<string, string> = {
  owner: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20",
  admin: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30",
  staff: "bg-white/10 text-white/60 border border-white/10",
};

export const ROLE_LABEL: Record<string, string> = {
  owner: "Владелец",
  admin: "Админ",
  staff: "Сотрудник",
};

export function getInitials(name: string): string {
  const t = (name || "").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2);
  return parts.join("").toUpperCase() || "?";
}

const TAB_KEY = "staff_active_tab";

export function readSavedTab(fallback: StaffTab): StaffTab {
  try {
    // Приоритет: ?tab= в URL → localStorage → fallback
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("tab");
    const allowed: StaffTab[] = [
      "goods",
      "sales",
      "clients",
      "analytics",
      "employees",
      "repair",
      "chat",
      "gold",
    ];
    if (fromUrl && (allowed as string[]).includes(fromUrl)) return fromUrl as StaffTab;
    const saved = localStorage.getItem(TAB_KEY);
    if (saved && (allowed as string[]).includes(saved)) return saved as StaffTab;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function saveTab(tab: StaffTab): void {
  try {
    localStorage.setItem(TAB_KEY, tab);
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== tab) {
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    /* ignore */
  }
}