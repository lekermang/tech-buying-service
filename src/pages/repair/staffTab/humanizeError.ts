// Превращает любую ошибку (серверную, HTTP, сетевую) в понятный
// "диагноз" с подсказкой что делать — как доктор: "что не так" + "рецепт".
//
// Использование:
//   const msg = humanizeError({ action: "save", httpStatus: 500, serverError: data.error });
//   const msg = humanizeError({ action: "load", thrown: e });

export type StaffAction =
  | "load"        // загрузка списка заявок / данных
  | "create"      // создание заявки
  | "save"        // сохранение карточки
  | "status"      // смена статуса
  | "delete"      // удаление заявки
  | "ready"       // отметка "Готово"
  | "issue"       // выдача клиенту
  | "notify_tg"   // уведомление в Telegram
  | "notify_sms"  // SMS клиенту
  | "send_act"    // отправка акта
  | "print"       // печать
  | "generic";    // что-то ещё

type Args = {
  action: StaffAction;
  httpStatus?: number;       // res.status
  serverError?: string | null; // data.error из ответа
  thrown?: unknown;          // объект из catch
};

const ACTION_LABEL: Record<StaffAction, string> = {
  load: "Не удалось загрузить заявки",
  create: "Не удалось создать заявку",
  save: "Не удалось сохранить карточку",
  status: "Не удалось сменить статус",
  delete: "Не удалось удалить заявку",
  ready: "Не удалось отметить заявку готовой",
  issue: "Не удалось выдать заявку",
  notify_tg: "Не удалось отправить Telegram",
  notify_sms: "Не удалось отправить SMS",
  send_act: "Не удалось отправить акт",
  print: "Не удалось распечатать",
  generic: "Операция не выполнена",
};

// Подсказки "что делать" для типичных HTTP-кодов
function adviceByStatus(status: number, action: StaffAction): string | null {
  if (status === 0) return "Нет связи с сервером — проверь интернет и попробуй ещё раз.";
  if (status === 400) return "Сервер не принял данные. Проверь обязательные поля (телефон, модель, сумма).";
  if (status === 401) return "Сессия сотрудника истекла. Зайди заново под своим логином.";
  if (status === 403) return "Недостаточно прав для этого действия. Обратись к администратору.";
  if (status === 404) {
    if (action === "delete" || action === "save" || action === "status") {
      return "Заявка не найдена — возможно, её уже удалили. Обнови страницу.";
    }
    return "Адрес не найден. Обнови страницу.";
  }
  if (status === 408 || status === 504) return "Сервер не успел ответить. Попробуй ещё раз через минуту.";
  if (status === 409) return "Заявка изменилась параллельно (другой сотрудник). Обнови страницу и повтори.";
  if (status === 413) return "Файл/данные слишком большие для отправки.";
  if (status === 422) return "Данные не прошли проверку. Проверь поля формы.";
  if (status === 429) return "Слишком много запросов подряд. Подожди 10–15 секунд.";
  if (status >= 500) return "Сбой на сервере. Подожди минуту и попробуй снова — если повторится, напиши в поддержку.";
  if (status >= 400) return "Запрос не принят сервером. Обнови страницу и попробуй снова.";
  return null;
}

// Перевод типичных серверных текстов в человеческий вид
function translateServerError(raw: string, action: StaffAction): string {
  const s = raw.toLowerCase();

  // Авторизация
  if (/(unauthorized|invalid token|token.*expired|нет токена|not authorized)/.test(s)) {
    return "Сессия истекла — войди заново под своим логином.";
  }
  if (/(forbidden|access denied|нет прав)/.test(s)) {
    return "Недостаточно прав для этого действия.";
  }

  // Поиск/отсутствие
  if (/(not found|не найдена|order.*not exist)/.test(s)) {
    return "Заявка не найдена — обнови страницу, возможно её удалили.";
  }

  // Валидация
  if (/(phone|телефон)/.test(s)) return "Не заполнен или некорректный телефон клиента.";
  if (/(name|имя)/.test(s) && /(required|обязат|empty|пуст)/.test(s)) return "Не заполнено имя клиента.";
  if (/(amount|сумм)/.test(s) && /(required|обязат|empty|пуст|invalid|некоррект)/.test(s)) {
    return "Не заполнена или некорректна сумма (ремонт/закуп).";
  }
  if (/(status|статус).*(invalid|некоррект|unknown)/.test(s)) return "Передан неизвестный статус заявки.";
  if (/(duplicate|уже существует|already exists)/.test(s)) return "Такая заявка уже существует.";

  // Внешние сервисы
  if (action === "notify_tg" && /(chat.*not.*found|bot.*block|telegram)/.test(s)) {
    return "Telegram-бот не может написать клиенту — он не запускал бот или заблокировал его.";
  }
  if (action === "notify_sms" && /(sms|provider|balance|баланс)/.test(s)) {
    return "SMS-сервис отказал — проверь баланс и настройки SMS-шлюза.";
  }
  if (action === "send_act" && /(pdf|generate|render)/.test(s)) {
    return "Не удалось сформировать PDF акта. Проверь, что заполнены сумма и название работ.";
  }

  // База
  if (/(database|db|sql|psycopg|connection)/.test(s)) {
    return "Сбой базы данных. Подожди минуту и попробуй снова.";
  }

  // Если ничего не подошло — возвращаем оригинал
  return raw;
}

export function humanizeError({ action, httpStatus, serverError, thrown }: Args): string {
  const head = ACTION_LABEL[action];

  // 1) Сетевая ошибка (catch без HTTP-ответа)
  if (thrown && (httpStatus === undefined || httpStatus === 0)) {
    const e = thrown as { name?: string; message?: string };
    if (e?.name === "AbortError") return `${head}: запрос был отменён.`;
    if (typeof navigator !== "undefined" && navigator && navigator.onLine === false) {
      return `${head}: нет интернета. Проверь Wi-Fi / мобильную связь и повтори.`;
    }
    if (/failed to fetch|networkerror|load failed/i.test(e?.message || "")) {
      return `${head}: сервер не отвечает. Проверь интернет и попробуй ещё раз.`;
    }
    if (e?.message) return `${head}: ${e.message}`;
    return `${head}: сбой соединения. Попробуй ещё раз.`;
  }

  // 2) Серверная ошибка с текстом — переводим
  if (serverError && serverError.trim()) {
    const human = translateServerError(serverError.trim(), action);
    return `${head}: ${human}`;
  }

  // 3) HTTP-код без понятного текста
  if (typeof httpStatus === "number") {
    const advice = adviceByStatus(httpStatus, action);
    if (advice) return `${head} (код ${httpStatus}). ${advice}`;
    return `${head} (код ${httpStatus}). Попробуй ещё раз.`;
  }

  // 4) Ничего не известно
  return `${head}. Попробуй ещё раз — если повторится, обнови страницу.`;
}
