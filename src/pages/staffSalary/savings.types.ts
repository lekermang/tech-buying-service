export const SAVINGS_URL = "https://functions.poehali.dev/4b6d2cd3-a8ca-4aac-aec2-ba9664b21b07";
export const fmt = (n: number) => Math.round(n).toLocaleString("ru-RU");

export type Goal = {
  id: number;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  emoji: string;
  color: string;
  deadline: string | null;
  status: "active" | "done" | "paused" | "cancelled";
  auto_save_percent: number;
  created_at: string;
  deposited: number;
  withdrawn: number;
  tx_count: number;
};

export type Tx = {
  id: number;
  amount: number;
  note: string | null;
  source: string;
  created_at: string;
  goal_title: string | null;
  goal_emoji: string | null;
};

export type Tip = {
  icon: string;
  title: string;
  text: string;
  level: "beginner" | "advanced" | "important" | "info";
};

export type Overview = {
  goals: Goal[];
  total_saved: number;
  earned_30d: number;
  days_worked: number;
  recent_tx: Tx[];
};

export const EMOJIS = ["🎯","📱","💻","🏠","✈️","🚗","👟","📚","🎸","🎮","💍","🌴","🎓","🛡️","💰","🏋️","🐶","🎁"];
export const COLORS = ["#FFD700","#34d399","#60a5fa","#f472b6","#a78bfa","#fb923c","#f87171","#38bdf8"];

export const LEVEL_STYLES: Record<string, { bg: string; border: string; badge: string }> = {
  beginner:  { bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.2)",  badge: "#34d399" },
  advanced:  { bg: "rgba(96,165,250,0.06)",  border: "rgba(96,165,250,0.2)",  badge: "#60a5fa" },
  important: { bg: "rgba(255,215,0,0.06)",   border: "rgba(255,215,0,0.2)",   badge: "#FFD700" },
  info:      { bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.2)", badge: "#a78bfa" },
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Начало", advanced: "Продвинутый", important: "Важно", info: "Факт",
};
