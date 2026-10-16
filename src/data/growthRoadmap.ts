export type Phase = "p0" | "p1" | "p2" | "p3" | "p4";
export type Priority = "critical" | "ops" | "analytics" | "growth" | "security";
export type Status = "todo" | "progress" | "done";
export type Module =
  | "Дашборд" | "Лиды" | "Звонки" | "SLA" | "Доступы" | "Финансы" | "Выезды"
  | "BI" | "ML" | "Монетизация" | "Партнёры" | "Безопасность" | "DevOps";

export interface Task {
  id: string;
  title: string;
  desc: string;
  module: Module;
  phase: Phase;
  priority: Priority;
  effort: 1 | 2 | 3 | 4 | 5;
  kpi?: string;
}

export const PHASES: Record<Phase, { label: string; range: string; goal: string }> = {
  p0: { label: "MVP", range: "0–30 дней", goal: "Контроль лидов и скорости ответа" },
  p1: { label: "Операции", range: "30–60 дней", goal: "Порядок в процессах и деньгах" },
  p2: { label: "Аналитика", range: "60–120 дней", goal: "Решения на цифрах" },
  p3: { label: "Рост и ML", range: "120–270 дней", goal: "Маржа и автоматизация" },
  p4: { label: "Масштаб", range: "270+ дней", goal: "Платформа и партнёры" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Критично", color: "bg-red-500/15 text-red-400 ring-red-500/30" },
  ops: { label: "Операции", color: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  analytics: { label: "Аналитика", color: "bg-sky-500/15 text-sky-400 ring-sky-500/30" },
  growth: { label: "Рост", color: "bg-fuchsia-500/15 text-fuchsia-400 ring-fuchsia-500/30" },
  security: { label: "Безопасность", color: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
};

export const TASKS: Task[] = [
  { id: "t01", title: "Дашборд KPI", desc: "Заявки, сделки, CAC, ср. чек, маржа, топ категорий/городов", module: "Дашборд", phase: "p0", priority: "critical", effort: 3, kpi: "Обновление ≤ 1 мин" },
  { id: "t02", title: "Канбан лидов/сделок", desc: "Фильтры: источник, город, категория, менеджер, SLA", module: "Лиды", phase: "p0", priority: "critical", effort: 3 },
  { id: "t03", title: "Авто‑распределение лидов", desc: "Приоритеты по источнику / сегменту / загрузке менеджера", module: "Лиды", phase: "p0", priority: "critical", effort: 2, kpi: "100% лидов назначены" },
  { id: "t04", title: "Запись звонков + транскрипция", desc: "Привязка к лиду, поиск по тексту, контроль качества", module: "Звонки", phase: "p0", priority: "critical", effort: 3 },
  { id: "t05", title: "SLA‑таймеры и эскалации", desc: "Таймер первого ответа, алерт при превышении 1–3 мин", module: "SLA", phase: "p0", priority: "critical", effort: 2, kpi: "Первый контакт ≤ 3 мин" },
  { id: "t06", title: "Карточка сделки 360°", desc: "Фото товара, переписка, оценки, документы, история", module: "Лиды", phase: "p0", priority: "critical", effort: 3 },
  { id: "t07", title: "Возврат потерянных заявок", desc: "Автосерия SMS/мессенджер + оффер через 1ч / 24ч / 72ч", module: "Лиды", phase: "p0", priority: "critical", effort: 2, kpi: "≥ 15% возвращено" },
  { id: "t08", title: "RBAC — роли и доступы", desc: "Админ, супервайзер, менеджер, оценщик, бухгалтер", module: "Доступы", phase: "p0", priority: "critical", effort: 2 },
  { id: "t09", title: "Audit log", desc: "Кто/что/когда менял цену, статус, сделку. Без удаления без следа", module: "Безопасность", phase: "p0", priority: "security", effort: 2 },

  { id: "t10", title: "KPI менеджеров", desc: "Ранжирование, тайм‑трек звонков, конверсия, геймификация", module: "Дашборд", phase: "p1", priority: "ops", effort: 2, kpi: "CR по менеджеру" },
  { id: "t11", title: "Скрипты продаж + A/B", desc: "Скрипты в UI, тесты офферов и формулировок", module: "Лиды", phase: "p1", priority: "ops", effort: 2 },
  { id: "t12", title: "Массовые операции", desc: "Смена статусов, рассылки, экспорт CSV/XLSX", module: "Лиды", phase: "p1", priority: "ops", effort: 1 },
  { id: "t13", title: "Логистика выездов", desc: "Очередь выездов, карта, ETA, статус, маршрутизация", module: "Выезды", phase: "p1", priority: "ops", effort: 3 },
  { id: "t14", title: "P&L по срезам", desc: "Закупки, остатки, прибыль по категории / городу / менеджеру", module: "Финансы", phase: "p1", priority: "ops", effort: 3, kpi: "Маржа по категориям" },
  { id: "t15", title: "Возвраты и споры", desc: "Журнал, SLA разбора, интеграция с бухгалтерией", module: "Финансы", phase: "p1", priority: "ops", effort: 2 },
  { id: "t16", title: "Контроль ломбарда", desc: "Расторжения, просрочки, напоминания должникам, автоначисление", module: "Финансы", phase: "p1", priority: "critical", effort: 3, kpi: "Долг −50%" },

  { id: "t17", title: "ETL → DWH", desc: "Витрины LTV, CAC по каналу/кампании, прибыль на сделку", module: "BI", phase: "p2", priority: "analytics", effort: 4 },
  { id: "t18", title: "Симулятор «что если»", desc: "Бюджет Директа +X → прогноз сделок и прибыли", module: "BI", phase: "p2", priority: "analytics", effort: 3 },
  { id: "t19", title: "Качество лидов", desc: "Доля фейков, зарубежных заходов, аномалий (сумма 112 млн ₽)", module: "BI", phase: "p2", priority: "analytics", effort: 2, kpi: "Фейки ≤ 5%" },
  { id: "t20", title: "Алерты по метрикам", desc: "Падение трафика, рост CAC, простой категории (золото)", module: "BI", phase: "p2", priority: "analytics", effort: 2 },
  { id: "t21", title: "A/B платформа", desc: "Единый механизм экспериментов для сайта и скриптов", module: "BI", phase: "p2", priority: "analytics", effort: 3 },

  { id: "t22", title: "ML‑оценщик по фото", desc: "Ориентир цены / категории / состояния. Старт со сбора датасета", module: "ML", phase: "p3", priority: "growth", effort: 5, kpi: "Точность ±15%" },
  { id: "t23", title: "Динамическое ценообразование", desc: "Рекомендованная цена для менеджера с учётом спроса и остатков", module: "ML", phase: "p3", priority: "growth", effort: 4, kpi: "Маржа +5 п.п." },
  { id: "t24", title: "Канал‑оптимизатор", desc: "Автоперераспределение бюджета по ROI каналов", module: "ML", phase: "p3", priority: "growth", effort: 4 },
  { id: "t25", title: "Платные допуслуги", desc: "Срочный выезд, экспертная оценка, хранение, подписки", module: "Монетизация", phase: "p3", priority: "growth", effort: 2, kpi: "Доп. доход ≥ 10%" },
  { id: "t26", title: "Кабинеты партнёров", desc: "Ломбарды, сервисы, риелторы: реферальные выплаты", module: "Партнёры", phase: "p3", priority: "growth", effort: 3 },
  { id: "t27", title: "AI‑ассистент менеджера", desc: "Подсказки в реальном времени: цена, upsell, возражения", module: "ML", phase: "p3", priority: "growth", effort: 4 },

  { id: "t28", title: "B2B Marketplace перепродажи", desc: "Автоподбор канала сбыта: оптовики, ритейл, экспорт", module: "Монетизация", phase: "p4", priority: "growth", effort: 5 },
  { id: "t29", title: "White‑label API", desc: "Партнёры встраивают оценку/заявку в свои сайты", module: "Партнёры", phase: "p4", priority: "growth", effort: 4 },
  { id: "t30", title: "Полная автоматизация сбыта", desc: "От приёмки до продажи без ручных операций", module: "Монетизация", phase: "p4", priority: "growth", effort: 5 },

  { id: "t31", title: "Шифрование PII и журнал доступа", desc: "Разграничение финансовых данных, стандарты хранения", module: "Безопасность", phase: "p0", priority: "security", effort: 2 },
  { id: "t32", title: "Бэкапы + тест восстановления", desc: "Ежедневно, проверка раз в месяц", module: "Безопасность", phase: "p1", priority: "security", effort: 1 },
  { id: "t33", title: "CI/CD + E2E", desc: "Автотесты workflow заявка → сделка", module: "DevOps", phase: "p1", priority: "ops", effort: 3 },
  { id: "t34", title: "Мониторинг и алерты", desc: "Ошибки и сбои функций → Telegram/MAX", module: "DevOps", phase: "p1", priority: "ops", effort: 2 },
  { id: "t35", title: "Swagger + runbook", desc: "Документация API и инструкции по инцидентам", module: "DevOps", phase: "p2", priority: "ops", effort: 1 },
];

export const KPI_TARGETS = [
  { key: "first_contact", label: "Первый контакт", target: "≤ 3 мин", note: "сейчас: нет замера" },
  { key: "cr", label: "CR заявка → сделка", target: "≥ 25%", note: "по каналу и менеджеру" },
  { key: "cac", label: "CAC", target: "↓ 30%", note: "по каждому каналу" },
  { key: "recovered", label: "Возвращённые лиды", target: "≥ 15%", note: "из потерянных" },
  { key: "fake", label: "Фейковые лиды", target: "≤ 5%", note: "сейчас: искажения" },
  { key: "extra", label: "Доход от допуслуг", target: "≥ 10%", note: "от выручки" },
];

export const RISKS = [
  { risk: "Некачественные данные", fix: "Валидации, дедупликация, ручная проверка новых каналов" },
  { risk: "Сопротивление менеджеров", fix: "Обучение, геймификация KPI, прозрачные метрики" },
  { risk: "Перегруз инфраструктуры", fix: "Мониторинг, автоскейл, тестовая среда с реальными интеграциями" },
  { risk: "Простой категорий (золото 3 мес.)", fix: "Алерты по простою, план закупок, KPI закупщика" },
];

export const TEAM = [
  "Product Owner / Head of Ops", "Fullstack × 2–3", "ML‑engineer × 1",
  "Data / BI × 1–2", "QA + DevOps", "UX‑дизайнер", "Growth‑аналитик",
];
