// Яндекс.Метрика — хелпер для отправки целей
const YM_ID = 108421419; // skypka24.com HTTPS

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

export function ymGoal(goalName: string, params?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && window.ym) {
      window.ym(YM_ID, "reachGoal", goalName, params);
    }
  } catch (_e) { /* silent */ }
}

// Зафиксированные цели сайта
export const Goals = {
  // ─── Конверсии — главное (макроцели) ───────────────────────────────────────
  CALL_CLICK:        "call_click",        // клик по номеру телефона
  WHATSAPP_CLICK:    "whatsapp_click",    // переход в WhatsApp
  TELEGRAM_CLICK:    "telegram_click",    // переход в Telegram
  FORM_OPEN:         "form_open",         // открытие формы оценки
  FORM_SUBMIT:       "form_submit",       // отправка заявки (попытка)
  FORM_SUCCESS:      "form_success",      // успешная отправка заявки ★

  // ─── Ремонт (отдельная воронка) ────────────────────────────────────────────
  REPAIR_OPEN:       "repair_open",       // открытие виджета ремонта
  REPAIR_SUBMIT:     "repair_submit",     // отправка заявки на ремонт
  REPAIR_SUCCESS:    "repair_success",    // успешная заявка на ремонт ★
  REPAIR_BOT_CLICK:  "repair_bot_click",  // переход в TG-бот по заявке

  // ─── Apple-виджет (быстрая оценка) ─────────────────────────────────────────
  APPLE_SEARCH:      "apple_search",      // поиск модели в Apple-виджете
  APPLE_SUBMIT:      "apple_submit",      // отправка заявки из Apple ★

  // ─── Exit-popup (удержание) ────────────────────────────────────────────────
  EXIT_POPUP_SHOW:   "exit_popup_show",   // показ поп-апа
  EXIT_POPUP_CLOSE:  "exit_popup_close",  // закрытие
  EXIT_POPUP_SUBMIT: "exit_popup_submit", // отправка номера из поп-апа ★

  // ─── Каталог ───────────────────────────────────────────────────────────────
  CATALOG_OPEN:      "catalog_open",      // переход в каталог
  CATALOG_ITEM:      "catalog_item",      // клик на товар
  CATALOG_ORDER:     "catalog_order",     // заявка на товар из каталога ★
  CATALOG_SEARCH:    "catalog_search",    // поиск по каталогу

  // ─── Навигация / Скроллы ───────────────────────────────────────────────────
  SCROLL_PRICES:     "scroll_prices",     // прокрутка к ценам
  SCROLL_CONTACTS:   "scroll_contacts",   // прокрутка к контактам
  SCROLL_BRANCHES:   "scroll_branches",   // прокрутка к филиалам
  SCROLL_REVIEWS:    "scroll_reviews",    // прокрутка к отзывам
  INSTALL_PWA:       "install_pwa",       // установка PWA-приложения ★

  // ─── Страница ──────────────────────────────────────────────────────────────
  HERO_CTA:          "hero_cta",          // главная кнопка в герое
  CATEGORY_CLICK:    "category_click",    // клик на категорию техники
  MAP_CLICK:         "map_click",         // клик по карте/адресу филиала
} as const;