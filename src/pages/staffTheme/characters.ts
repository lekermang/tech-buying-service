export type CharacterPreset = {
  id: string;
  name: string;
  image: string;
  /** Позиция глаз на картинке в долях [0..1] — x,y центр каждого глаза */
  eyes: { lx: number; ly: number; rx: number; ry: number; radius: number };
  accent: string;
};

export const CHARACTERS: CharacterPreset[] = [
  { id: "sakura",   name: "Сакура",    image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/8c447ed0-0587-4693-8c31-71a9cc1155fd.jpg", eyes: { lx: 0.40, ly: 0.43, rx: 0.60, ry: 0.43, radius: 0.022 }, accent: "#FF8FB5" },
  { id: "cyber",    name: "Кибер",     image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/79c2bfcc-60a5-43bc-91ec-09d8ad124573.jpg", eyes: { lx: 0.40, ly: 0.44, rx: 0.60, ry: 0.44, radius: 0.022 }, accent: "#38BDF8" },
  { id: "ninja",    name: "Ниндзя",    image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/925756da-83da-4e28-aae4-10929b22b33a.jpg", eyes: { lx: 0.41, ly: 0.44, rx: 0.59, ry: 0.44, radius: 0.02 },  accent: "#EF4444" },
  { id: "cosmo",    name: "Космо",     image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/0061f5b0-4181-46a2-b51f-5aabf822c172.jpg", eyes: { lx: 0.40, ly: 0.42, rx: 0.60, ry: 0.42, radius: 0.022 }, accent: "#A78BFA" },
  { id: "neko",     name: "Неко",      image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/aab5c8d6-5a21-40e8-9535-f0d89aaeb3e2.jpg", eyes: { lx: 0.40, ly: 0.46, rx: 0.60, ry: 0.46, radius: 0.022 }, accent: "#FB923C" },
  { id: "samurai",  name: "Самурай",   image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a060d118-7ab1-4180-8071-776ce39b5cde.jpg", eyes: { lx: 0.41, ly: 0.43, rx: 0.59, ry: 0.43, radius: 0.02 },  accent: "#F59E0B" },
  { id: "magical",  name: "Магичка",   image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/d2281b9f-4111-44f3-8ae3-c474cd3207a6.jpg", eyes: { lx: 0.40, ly: 0.42, rx: 0.60, ry: 0.42, radius: 0.022 }, accent: "#C084FC" },
  { id: "mecha",    name: "Меха",      image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/8fb45de7-819e-422d-9679-6a988b5e1ac0.jpg", eyes: { lx: 0.40, ly: 0.43, rx: 0.60, ry: 0.43, radius: 0.022 }, accent: "#F87171" },
  { id: "kitsune",  name: "Кицунэ",    image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/58f2f2bb-67fd-49b2-b173-b5d535957a2b.jpg", eyes: { lx: 0.40, ly: 0.44, rx: 0.60, ry: 0.44, radius: 0.022 }, accent: "#FCD34D" },
  { id: "dragon",   name: "Дракон",    image: "https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/files/a2b214a3-4115-42e5-8f89-fc6c7d47cebb.jpg", eyes: { lx: 0.40, ly: 0.44, rx: 0.60, ry: 0.44, radius: 0.022 }, accent: "#34D399" },
];

export const CURSOR_EFFECTS: { id: string; label: string }[] = [
  { id: "none",     label: "Без эффекта" },
  { id: "eyes",     label: "Глаза за курсором" },
  { id: "tilt",     label: "Наклон за курсором" },
  { id: "sparkles", label: "Искры за курсором" },
  { id: "trail",    label: "Шлейф" },
  { id: "hearts",   label: "Сердечки" },
];

export const BG_STYLES: { id: string; label: string }[] = [
  { id: "default",   label: "Обычный" },
  { id: "sakura",    label: "Сакура падает" },
  { id: "stars",     label: "Звёзды" },
  { id: "rain",      label: "Дождь" },
  { id: "bubbles",   label: "Пузырьки" },
  { id: "neon-grid", label: "Неон-сетка" },
];

export const ACCENTS: { id: string; color: string; label: string }[] = [
  { id: "gold",    color: "#FFD700", label: "Золото" },
  { id: "pink",    color: "#FF6FB4", label: "Розовый" },
  { id: "cyan",    color: "#38BDF8", label: "Циан" },
  { id: "purple",  color: "#A78BFA", label: "Фиолет" },
  { id: "green",   color: "#34D399", label: "Зелёный" },
  { id: "red",     color: "#EF4444", label: "Красный" },
  { id: "orange",  color: "#FB923C", label: "Оранж" },
  { id: "white",   color: "#E5E7EB", label: "Моно" },
];

export const DENSITIES: { id: string; label: string }[] = [
  { id: "compact",    label: "Компакт" },
  { id: "normal",     label: "Обычный" },
  { id: "comfortable",label: "Просторный" },
];

export const FONTS: { id: string; label: string; css: string }[] = [
  { id: "roboto",    label: "Roboto",    css: "'Roboto', sans-serif" },
  { id: "oswald",    label: "Oswald",    css: "'Oswald', sans-serif" },
  { id: "inter",     label: "Inter",     css: "'Inter', sans-serif" },
  { id: "mplus",     label: "M PLUS",    css: "'M PLUS Rounded 1c', sans-serif" },
];

export type StaffThemeSettings = {
  enabled: boolean;
  character_id: string;
  cursor_effect: string;
  accent_color: string;
  bg_style: string;
  ui_density: string;
  font_family: string;
};

export const DEFAULT_THEME: StaffThemeSettings = {
  enabled: true,
  character_id: "sakura",
  cursor_effect: "eyes",
  accent_color: "#FFD700",
  bg_style: "sakura",
  ui_density: "normal",
  font_family: "roboto",
};

export const STAFF_THEME_URL = "https://functions.poehali.dev/5cc66ff0-f3b5-46ca-9815-8f939e07eff7";