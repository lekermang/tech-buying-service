export interface SiteTheme {
  id: string;
  name: string;
  bg: string;
  card: string;
  border: string;
  accent: string;
  accentFg: string;
  preview: string;
}

export const THEMES: SiteTheme[] = [
  {
    id: "classic-black",
    name: "Классический чёрный",
    bg: "#0d0d0d",
    card: "#1a1a1a",
    border: "#262626",
    accent: "#ffd700",
    accentFg: "#0d0d0d",
    preview: "bg-[#0d0d0d]",
  },
  {
    id: "deep-night",
    name: "Глубокая ночь",
    bg: "#060608",
    card: "#0f0f14",
    border: "#1e1e28",
    accent: "#ffd700",
    accentFg: "#060608",
    preview: "bg-[#060608]",
  },
  {
    id: "dark-graphite",
    name: "Тёмный графит",
    bg: "#141414",
    card: "#1f1f1f",
    border: "#2e2e2e",
    accent: "#ffd700",
    accentFg: "#141414",
    preview: "bg-[#141414]",
  },
  {
    id: "dark-navy",
    name: "Тёмно-синий",
    bg: "#0a0d14",
    card: "#111827",
    border: "#1e2a3a",
    accent: "#60a5fa",
    accentFg: "#0a0d14",
    preview: "bg-[#0a0d14]",
  },
  {
    id: "midnight-blue",
    name: "Полночный синий",
    bg: "#080c18",
    card: "#0f1729",
    border: "#1a2540",
    accent: "#ffd700",
    accentFg: "#080c18",
    preview: "bg-[#080c18]",
  },
  {
    id: "dark-green",
    name: "Тёмно-зелёный",
    bg: "#080e0a",
    card: "#0f1a11",
    border: "#1a2e1d",
    accent: "#4ade80",
    accentFg: "#080e0a",
    preview: "bg-[#080e0a]",
  },
  {
    id: "forest",
    name: "Лесной",
    bg: "#0c1210",
    card: "#141f1c",
    border: "#1f3028",
    accent: "#ffd700",
    accentFg: "#0c1210",
    preview: "bg-[#0c1210]",
  },
  {
    id: "dark-wine",
    name: "Бордо",
    bg: "#0e0809",
    card: "#1a0d10",
    border: "#2d1318",
    accent: "#f87171",
    accentFg: "#0e0809",
    preview: "bg-[#0e0809]",
  },
  {
    id: "charcoal",
    name: "Уголь",
    bg: "#111111",
    card: "#1c1c1c",
    border: "#2a2a2a",
    accent: "#e2e8f0",
    accentFg: "#111111",
    preview: "bg-[#111111]",
  },
  {
    id: "dark-purple",
    name: "Тёмно-фиолетовый",
    bg: "#0b080e",
    card: "#140f1a",
    border: "#221629",
    accent: "#c084fc",
    accentFg: "#0b080e",
    preview: "bg-[#0b080e]",
  },
  {
    id: "space",
    name: "Космос",
    bg: "#07090f",
    card: "#0d1021",
    border: "#161a30",
    accent: "#818cf8",
    accentFg: "#07090f",
    preview: "bg-[#07090f]",
  },
  {
    id: "dark-amber",
    name: "Янтарный",
    bg: "#0d0a04",
    card: "#1a1408",
    border: "#2e2010",
    accent: "#f59e0b",
    accentFg: "#0d0a04",
    preview: "bg-[#0d0a04]",
  },
  {
    id: "cold-steel",
    name: "Холодная сталь",
    bg: "#0a0c0e",
    card: "#141820",
    border: "#1e2430",
    accent: "#94a3b8",
    accentFg: "#0a0c0e",
    preview: "bg-[#0a0c0e]",
  },
  {
    id: "dark-teal",
    name: "Тёмный бирюзовый",
    bg: "#070e0e",
    card: "#0e1a1a",
    border: "#152828",
    accent: "#2dd4bf",
    accentFg: "#070e0e",
    preview: "bg-[#070e0e]",
  },
  {
    id: "obsidian",
    name: "Обсидиан",
    bg: "#0f0e0d",
    card: "#1a1917",
    border: "#2a2825",
    accent: "#fbbf24",
    accentFg: "#0f0e0d",
    preview: "bg-[#0f0e0d]",
  },
];

export const DEFAULT_THEME_ID = "classic-black";
const STORAGE_KEY = "site_theme_id";

export function getSavedThemeId(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
}

export function applyTheme(theme: SiteTheme) {
  const root = document.documentElement;
  const hex2hsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  root.style.setProperty("--background", hex2hsl(theme.bg));
  root.style.setProperty("--card", hex2hsl(theme.card));
  root.style.setProperty("--popover", hex2hsl(theme.card));
  root.style.setProperty("--border", hex2hsl(theme.border));
  root.style.setProperty("--input", hex2hsl(theme.border));
  root.style.setProperty("--primary", hex2hsl(theme.accent));
  root.style.setProperty("--accent", hex2hsl(theme.accent));
  root.style.setProperty("--ring", hex2hsl(theme.accent));
  root.style.setProperty("--black", theme.bg);
  root.style.setProperty("--yellow", theme.accent);
  root.style.setProperty("--gray-dark", theme.card);
  root.style.setProperty("--gray-mid", theme.border);
  document.body.style.backgroundColor = theme.bg;
}

export function saveAndApplyTheme(themeId: string) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  localStorage.setItem(STORAGE_KEY, themeId);
  applyTheme(theme);
}
