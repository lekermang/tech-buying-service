/**
 * Утилиты и константы для GoldTicker:
 *  - URL-ы скачивания приложений
 *  - Тип периода графика
 *  - Список проб золота для поповера
 *  - Функция статуса мирового рынка золота (CME + LBMA)
 *  - Функция «X минут назад»
 */

export const APK_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24.apk";
export const EXE_URL = "https://github.com/lekermang/tech-buying-service/releases/latest/download/Skupka24-Setup.exe";

export type Period = 7 | 30 | 90;

export const PROBES_DISPLAY: { label: string; value: number; coeff: number }[] = [
  { label: "375", value: 375, coeff: 0.375 },
  { label: "500", value: 500, coeff: 0.5 },
  { label: "585", value: 585, coeff: 0.585 },
  { label: "750", value: 750, coeff: 0.75 },
  { label: "916", value: 916, coeff: 0.916 },
  { label: "999", value: 999, coeff: 0.999 },
];

export interface MarketStatus {
  open: boolean;
  fixing: boolean;
  label: string;
  sublabel: string;
  nextChange: string;
}

/**
 * Реальное расписание мирового рынка золота:
 *  - CME COMEX (электронные торги GC, формируют мировую цену):
 *      Воскресенье 18:00 EST → Пятница 17:00 EST, с дневным перерывом 17:00–18:00 EST.
 *      В UTC: Вс 23:00 → Пт 22:00, перерыв 22:00–23:00 UTC.
 *  - LBMA Лондонский фиксинг: Пн–Пт 10:30 GMT (auction) и 15:00 GMT (PM fix).
 *  - Биржа SHFE (Шанхай): ночные торги (важны для азиатской сессии).
 *
 * Логика статуса:
 *   open      — идут электронные торги CME (основное окно)
 *   fixing    — идёт лондонский AM/PM-фиксинг (под подсветку)
 *   weekend   — выходной (Сб целиком и часть Вс/Пт)
 *   break     — суточный технический перерыв CME (22:00–23:00 UTC)
 */
export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0=Вс, 1=Пн, ... 6=Сб
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const utcMin = utcH * 60 + utcM;

  // Лондонский AM/PM фиксинг
  const fixingAM = utcDay >= 1 && utcDay <= 5 && utcH === 10 && utcM >= 30 && utcM < 50;
  const fixingPM = utcDay >= 1 && utcDay <= 5 && utcH === 15 && utcM < 20;
  const fixing = fixingAM || fixingPM;

  // Технический перерыв CME (22:00–23:00 UTC по будням и Пт→Сб)
  const inDailyBreak = utcH === 22;

  // Выходные: Сб полностью + Пт после 22:00 + Вс до 23:00
  const isWeekend =
    utcDay === 6 ||
    (utcDay === 5 && utcMin >= 22 * 60) ||
    (utcDay === 0 && utcMin < 23 * 60);

  const open = !isWeekend && !inDailyBreak;

  let label = "Биржа закрыта";
  let sublabel = "выходной";
  let nextChange = "";

  if (fixing) {
    label = "Лондонский фиксинг";
    sublabel = fixingAM ? "AM fix · 10:30 GMT" : "PM fix · 15:00 GMT";
  } else if (open) {
    label = "Биржа открыта";
    sublabel = "торги CME COMEX";
    // До следующего фиксинга или закрытия
    if (utcDay >= 1 && utcDay <= 5) {
      if (utcMin < 10 * 60 + 30) nextChange = "AM-фиксинг в 10:30 GMT";
      else if (utcMin < 15 * 60) nextChange = "PM-фиксинг в 15:00 GMT";
      else if (utcMin < 22 * 60) nextChange = "перерыв в 22:00 GMT";
    }
  } else if (inDailyBreak) {
    label = "Перерыв";
    sublabel = "технический · 1 час";
    nextChange = "торги в 23:00 GMT";
  } else if (isWeekend) {
    label = "Биржа закрыта";
    sublabel = "выходной";
    if (utcDay === 6) nextChange = "торги: Вс 23:00 GMT";
    else if (utcDay === 0) nextChange = "торги в 23:00 GMT";
    else if (utcDay === 5) nextChange = "торги: Вс 23:00 GMT";
  }

  return { open, fixing, label, sublabel, nextChange };
}

export function timeAgo(iso?: string): string {
  if (!iso) return "";
  try {
    const t = new Date(iso).getTime();
    if (isNaN(t)) return "";
    const diffMin = Math.max(0, Math.floor((Date.now() - t) / 60000));
    if (diffMin < 1) return "только что";
    if (diffMin < 60) return `${diffMin} мин назад`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ч назад`;
    return `${Math.floor(diffH / 24)} дн назад`;
  } catch {
    return "";
  }
}
