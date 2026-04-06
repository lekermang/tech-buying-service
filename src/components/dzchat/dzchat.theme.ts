export interface DzTheme {
  id: string;
  label: string;
  emoji: string;
  // Основные цвета чата
  bg: string;           // корневой фон
  sidebar: string;      // фон сайдбара
  sidebarHeader: string;
  chatBg: string;       // фон области сообщений
  input: string;        // фон поля ввода
  inputBar: string;     // нижняя панель ввода
  header: string;       // шапка чата
  bubbleOut: string;    // пузырь исходящих
  bubbleIn: string;     // пузырь входящих
  accent: string;       // акцентный цвет (кнопки, онлайн)
  accentHover: string;
  text: string;
  textMuted: string;
  border: string;
  // Прозрачность (для glass-эффекта)
  glassBlur?: string;
  isGlass?: boolean;
}

export const THEMES: DzTheme[] = [
  {
    id: "dark",
    label: "Тёмный",
    emoji: "🌑",
    bg: "#0a1929",
    sidebar: "#111b26",
    sidebarHeader: "#1a2634",
    chatBg: "#0a1929",
    input: "#0f1923",
    inputBar: "#1a2634",
    header: "#1a2634",
    bubbleOut: "#005c4b",
    bubbleIn: "#1e2d3d",
    accent: "#25D366",
    accentHover: "#1da851",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
  },
  {
    id: "midnight",
    label: "Полночь",
    emoji: "🌌",
    bg: "#08061a",
    sidebar: "#100d28",
    sidebarHeader: "#1a1640",
    chatBg: "#08061a",
    input: "#100d28",
    inputBar: "#1a1640",
    header: "#1a1640",
    bubbleOut: "#3d1fa8",
    bubbleIn: "#1a1640",
    accent: "#7c5af0",
    accentHover: "#6344d9",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(124,90,240,0.2)",
  },
  {
    id: "forest",
    label: "Лес",
    emoji: "🌿",
    bg: "#071a0e",
    sidebar: "#0d2318",
    sidebarHeader: "#133020",
    chatBg: "#071a0e",
    input: "#0d2318",
    inputBar: "#133020",
    header: "#133020",
    bubbleOut: "#1a5c30",
    bubbleIn: "#133020",
    accent: "#2ecc71",
    accentHover: "#27ae60",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(46,204,113,0.15)",
  },
  {
    id: "ocean",
    label: "Океан",
    emoji: "🌊",
    bg: "#030f1f",
    sidebar: "#071929",
    sidebarHeader: "#0c2540",
    chatBg: "#030f1f",
    input: "#071929",
    inputBar: "#0c2540",
    header: "#0c2540",
    bubbleOut: "#0b4d7a",
    bubbleIn: "#0c2540",
    accent: "#0ea5e9",
    accentHover: "#0284c7",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(14,165,233,0.15)",
  },
  {
    id: "sunset",
    label: "Закат",
    emoji: "🌅",
    bg: "#1a0a05",
    sidebar: "#261208",
    sidebarHeader: "#38190a",
    chatBg: "#1a0a05",
    input: "#261208",
    inputBar: "#38190a",
    header: "#38190a",
    bubbleOut: "#7a2e00",
    bubbleIn: "#38190a",
    accent: "#f97316",
    accentHover: "#ea6c0e",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(249,115,22,0.15)",
  },
  {
    id: "rose",
    label: "Роза",
    emoji: "🌸",
    bg: "#1a0510",
    sidebar: "#260a18",
    sidebarHeader: "#3a1025",
    chatBg: "#1a0510",
    input: "#260a18",
    inputBar: "#3a1025",
    header: "#3a1025",
    bubbleOut: "#7a1040",
    bubbleIn: "#3a1025",
    accent: "#ec4899",
    accentHover: "#db2777",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.45)",
    border: "rgba(236,72,153,0.15)",
  },
  {
    id: "light",
    label: "Светлый",
    emoji: "☀️",
    bg: "#e8edf2",
    sidebar: "#f0f4f8",
    sidebarHeader: "#ffffff",
    chatBg: "#dce4ec",
    input: "#ffffff",
    inputBar: "#f0f4f8",
    header: "#ffffff",
    bubbleOut: "#25D366",
    bubbleIn: "#ffffff",
    accent: "#25D366",
    accentHover: "#1da851",
    text: "#111827",
    textMuted: "rgba(0,0,0,0.45)",
    border: "rgba(0,0,0,0.08)",
  },
  {
    id: "glass-dark",
    label: "Стекло",
    emoji: "🪟",
    bg: "transparent",
    sidebar: "rgba(10,20,35,0.55)",
    sidebarHeader: "rgba(20,35,55,0.7)",
    chatBg: "transparent",
    input: "rgba(5,12,22,0.65)",
    inputBar: "rgba(15,28,44,0.75)",
    header: "rgba(20,35,55,0.7)",
    bubbleOut: "rgba(0,92,75,0.75)",
    bubbleIn: "rgba(30,45,61,0.65)",
    accent: "#25D366",
    accentHover: "#1da851",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    border: "rgba(255,255,255,0.1)",
    glassBlur: "blur(20px) saturate(180%)",
    isGlass: true,
  },
  {
    id: "glass-purple",
    label: "Стекло фиолет",
    emoji: "💜",
    bg: "transparent",
    sidebar: "rgba(20,10,50,0.55)",
    sidebarHeader: "rgba(35,18,80,0.75)",
    chatBg: "transparent",
    input: "rgba(15,8,38,0.7)",
    inputBar: "rgba(30,15,65,0.75)",
    header: "rgba(35,18,80,0.75)",
    bubbleOut: "rgba(80,30,180,0.75)",
    bubbleIn: "rgba(35,18,80,0.65)",
    accent: "#a855f7",
    accentHover: "#9333ea",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    border: "rgba(168,85,247,0.2)",
    glassBlur: "blur(20px) saturate(200%)",
    isGlass: true,
  },
  {
    id: "amoled",
    label: "AMOLED",
    emoji: "⬛",
    bg: "#000000",
    sidebar: "#000000",
    sidebarHeader: "#0a0a0a",
    chatBg: "#000000",
    input: "#0a0a0a",
    inputBar: "#0a0a0a",
    header: "#0a0a0a",
    bubbleOut: "#003d2e",
    bubbleIn: "#111111",
    accent: "#25D366",
    accentHover: "#1da851",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.05)",
  },
];

export const DEFAULT_THEME_ID = "dark";

export function getTheme(id: string): DzTheme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function applyTheme(theme: DzTheme) {
  const root = document.documentElement;
  root.style.setProperty("--dz-bg", theme.bg);
  root.style.setProperty("--dz-sidebar", theme.sidebar);
  root.style.setProperty("--dz-sidebar-header", theme.sidebarHeader);
  root.style.setProperty("--dz-chat-bg", theme.chatBg);
  root.style.setProperty("--dz-input", theme.input);
  root.style.setProperty("--dz-input-bar", theme.inputBar);
  root.style.setProperty("--dz-header", theme.header);
  root.style.setProperty("--dz-bubble-out", theme.bubbleOut);
  root.style.setProperty("--dz-bubble-in", theme.bubbleIn);
  root.style.setProperty("--dz-accent", theme.accent);
  root.style.setProperty("--dz-accent-hover", theme.accentHover);
  root.style.setProperty("--dz-text", theme.text);
  root.style.setProperty("--dz-text-muted", theme.textMuted);
  root.style.setProperty("--dz-border", theme.border);
  root.style.setProperty("--dz-blur", theme.glassBlur ?? "none");
}

export function loadAndApplyTheme(): DzTheme {
  const id = localStorage.getItem("dzchat_theme") ?? DEFAULT_THEME_ID;
  const theme = getTheme(id);
  applyTheme(theme);
  return theme;
}

export function saveTheme(id: string) {
  localStorage.setItem("dzchat_theme", id);
  applyTheme(getTheme(id));
}
