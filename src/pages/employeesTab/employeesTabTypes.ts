export type Employee = {
  id: number;
  full_name: string;
  login: string;
  role: string;
  is_active: boolean;
  created_at: string;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
};

export type EmployeeSession = {
  id: number;
  employee_id: number;
  full_name: string;
  role: string;
  login_at: string;
  last_seen_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

// Онлайн если last_seen_at < 5 минут назад
export function isOnline(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000;
}

// Форматирование времени последнего визита
export function fmtLastSeen(lastSeen: string | null | undefined): string {
  if (!lastSeen) return "никогда";
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return new Date(lastSeen).toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const ROLE_LABELS: Record<string, string> = { owner: "Владелец", admin: "Администратор", staff: "Сотрудник", master: "Мастер" };
export const ROLE_STYLES: Record<string, { badge: string; avatar: string; icon: string; emoji: string }> = {
  owner: { badge: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black", avatar: "from-[#FFD700] to-yellow-600 text-black", icon: "Crown", emoji: "👑" },
  admin: { badge: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30", avatar: "from-blue-500 to-blue-700 text-white", icon: "Shield", emoji: "🛡️" },
  master: { badge: "bg-gradient-to-r from-purple-500/30 to-purple-600/20 text-purple-300 border border-purple-400/30", avatar: "from-purple-500 to-purple-700 text-white", icon: "Wrench", emoji: "🔧" },
  staff: { badge: "bg-white/10 text-white/70 border border-white/10", avatar: "from-[#333] to-[#1a1a1a] text-white/70", icon: "User", emoji: "👤" },
};

export const POSITION_SUGGESTIONS = ["Приёмщик", "Мастер по ремонту", "Оценщик золота", "Управляющий", "Курьер"];

export type FormFields = {
  full_name: string;
  login: string;
  password: string;
  role: string;
  position: string;
  email: string;
  phone: string;
  note: string;
};

export const EMPTY_FORM: FormFields = { full_name: "", login: "", password: "", role: "staff", position: "", email: "", phone: "", note: "" };