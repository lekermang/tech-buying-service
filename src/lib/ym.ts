// Яндекс.Метрика — хелпер для отправки целей
const YM_ID = 101026698;

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
  // Конверсии — главное
  CALL_CLICK:        "call_click",        // клик на номер телефона
  WHATSAPP_CLICK:    "whatsapp_click",    // переход в WhatsApp
  TELEGRAM_CLICK:    "telegram_click",    // переход в Telegram
  FORM_OPEN:         "form_open",         // открытие формы оценки
  FORM_SUBMIT:       "form_submit",       // отправка заявки
  FORM_SUCCESS:      "form_success",      // успешная отправка

  // Каталог
  CATALOG_OPEN:      "catalog_open",      // переход в каталог
  CATALOG_ITEM:      "catalog_item",      // клик на товар
  CATALOG_ORDER:     "catalog_order",     // заявка на товар из каталога

  // Навигация
  SCROLL_PRICES:     "scroll_prices",     // прокрутка к ценам
  SCROLL_CONTACTS:   "scroll_contacts",   // прокрутка к контактам
  INSTALL_PWA:       "install_pwa",       // установка приложения

  // Страница
  HERO_CTA:          "hero_cta",          // кнопка в герое
  CATEGORY_CLICK:    "category_click",    // клик на категорию
} as const;
