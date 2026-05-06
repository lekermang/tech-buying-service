/**
 * Конфиг праздников России для оформления сайта.
 * Активный диапазон: за 3 дня ДО праздника и 3 дня ПОСЛЕ.
 *
 * Чтобы добавить праздник — просто добавь объект в HOLIDAYS.
 */

export type Holiday = {
  /** Уникальный slug — используется в localStorage и для тематики */
  id: string;
  /** Название */
  name: string;
  /** Подзаголовок / приветствие на баннере */
  greeting: string;
  /** Дата праздника: month 1-12, day 1-31 */
  month: number;
  day: number;
  /** Эмодзи для иконки */
  emoji: string;
  /** Главный цвет темы (hex) */
  primaryColor: string;
  /** Вторичный цвет (для градиентов) */
  secondaryColor: string;
  /** Текстовый цвет на баннере */
  textColor?: string;
  /** Тип декорации фона */
  pattern: "ribbon" | "snow" | "hearts" | "fireworks" | "flag" | "stars" | "flowers" | "default";
  /** Сколько дней ДО показывать (по умолчанию 3) */
  daysBefore?: number;
  /** Сколько дней ПОСЛЕ показывать (по умолчанию 3) */
  daysAfter?: number;
};

/** Список праздников. День 0 — само число; диапазон автоматически расширяется на ±3 дня. */
export const HOLIDAYS: Holiday[] = [
  {
    id: "new-year",
    name: "Новый год",
    greeting: "С Новым годом! 🎄",
    month: 1, day: 1,
    emoji: "🎄",
    primaryColor: "#0E7B3A",
    secondaryColor: "#FFD700",
    pattern: "snow",
    daysBefore: 5, daysAfter: 7,
  },
  {
    id: "feb-23",
    name: "День защитника Отечества",
    greeting: "С 23 февраля!",
    month: 2, day: 23,
    emoji: "🎖",
    primaryColor: "#1F3D2E",
    secondaryColor: "#FFD700",
    pattern: "stars",
  },
  {
    id: "mar-8",
    name: "Международный женский день",
    greeting: "С 8 Марта!",
    month: 3, day: 8,
    emoji: "🌷",
    primaryColor: "#C2185B",
    secondaryColor: "#FFD700",
    pattern: "flowers",
  },
  {
    id: "may-1",
    name: "Праздник Весны и Труда",
    greeting: "С 1 Мая!",
    month: 5, day: 1,
    emoji: "🌸",
    primaryColor: "#D32F2F",
    secondaryColor: "#FFD700",
    pattern: "flowers",
    daysBefore: 2, daysAfter: 2,
  },
  {
    id: "may-9",
    name: "День Победы",
    greeting: "С Днём Победы!",
    month: 5, day: 9,
    emoji: "🎗",
    primaryColor: "#8B0000",
    secondaryColor: "#FFD700",
    textColor: "#FFFFFF",
    pattern: "ribbon",
  },
  {
    id: "jun-12",
    name: "День России",
    greeting: "С Днём России!",
    month: 6, day: 12,
    emoji: "🇷🇺",
    primaryColor: "#0033A0",
    secondaryColor: "#FFD700",
    pattern: "flag",
  },
  {
    id: "nov-4",
    name: "День народного единства",
    greeting: "С Днём народного единства!",
    month: 11, day: 4,
    emoji: "🇷🇺",
    primaryColor: "#0033A0",
    secondaryColor: "#FFD700",
    pattern: "flag",
  },
];

// ─── Настройки из админки ──────────────────────────────────────────────────
export type HolidaysSettings = {
  /** Глобальный выключатель — если false, баннеры не показываются вообще */
  enabled: boolean;
  /** id праздников, которые ВЫКЛЮЧЕНЫ (по умолчанию все включены) */
  disabled: string[];
  /** Принудительно показать конкретный праздник (для тестирования). null = автоопределение */
  forced: string | null;
};

const STORAGE_KEY = "holidays_settings";
const DEFAULT_SETTINGS: HolidaysSettings = { enabled: true, disabled: [], forced: null };

export function loadHolidaysSettings(): HolidaysSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveHolidaysSettings(s: HolidaysSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // Сбрасываем "скрытие пользователем" при изменении — чтобы баннер вернулся сразу
  localStorage.removeItem("holiday_dismissed_id");
  window.dispatchEvent(new CustomEvent("holidays-settings-changed"));
}

/** Возвращает активный праздник, если сейчас попадает в диапазон ±3 дня (или индивидуальный) */
export function getActiveHoliday(now: Date = new Date()): { holiday: Holiday; daysToHoliday: number } | null {
  const settings = loadHolidaysSettings();
  if (!settings.enabled) return null;

  // Принудительный показ из админки (для тестирования / превью)
  if (settings.forced) {
    const forced = HOLIDAYS.find(x => x.id === settings.forced);
    if (forced) return { holiday: forced, daysToHoliday: 0 };
  }

  const year = now.getFullYear();
  const today = new Date(year, now.getMonth(), now.getDate()).getTime();

  for (const h of HOLIDAYS) {
    if (settings.disabled.includes(h.id)) continue;
    const before = h.daysBefore ?? 3;
    const after = h.daysAfter ?? 3;
    const eventDate = new Date(year, h.month - 1, h.day).getTime();
    const diffDays = Math.round((eventDate - today) / 86_400_000);
    if (diffDays >= -after && diffDays <= before) {
      return { holiday: h, daysToHoliday: diffDays };
    }
    // Спец-случай для Нового года: если сейчас декабрь, проверим 1 января СЛЕДУЮЩЕГО года
    if (h.id === "new-year" && now.getMonth() === 11) {
      const nextYearEvent = new Date(year + 1, 0, 1).getTime();
      const d2 = Math.round((nextYearEvent - today) / 86_400_000);
      if (d2 >= -after && d2 <= before) {
        return { holiday: h, daysToHoliday: d2 };
      }
    }
  }
  return null;
}

/** Текстовый префикс «До праздника N дней» / «Сегодня!» / «Праздновали N дней назад» */
export function getHolidayCountdownText(daysToHoliday: number): string {
  if (daysToHoliday === 0) return "Сегодня!";
  if (daysToHoliday > 0) {
    const d = daysToHoliday;
    if (d === 1) return "Завтра!";
    if (d >= 2 && d <= 4) return `Через ${d} дня`;
    return `Через ${d} дней`;
  }
  const d = Math.abs(daysToHoliday);
  if (d === 1) return "Был вчера";
  if (d >= 2 && d <= 4) return `${d} дня назад`;
  return `${d} дней назад`;
}