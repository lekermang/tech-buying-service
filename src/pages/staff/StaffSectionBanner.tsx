import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import type { StaffTab } from "./staffConstants";

type SectionMeta = {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  tag?: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  leads: {
    title: "Заявки",
    subtitle: "Входящие заявки от клиентов сайта — оценка, скупка и вопросы. Отвечай быстро, пока клиент не ушёл к конкурентам.",
    icon: "Inbox",
    color: "#ef4444",
    tag: "CRM",
  },
  myday: {
    title: "Мой день",
    subtitle: "Персональный чек-лист смены: задачи, мёртвые деньги, Авито-индекс и узкие места — всё в одном экране.",
    icon: "CalendarCheck",
    color: "#fb923c",
    tag: "Планировщик",
  },
  repair: {
    title: "Ремонт",
    subtitle: "Заявки на ремонт техники: статусы, сроки выполнения и полная история по каждому устройству.",
    icon: "Wrench",
    color: "#fb923c",
    tag: "Сервис",
  },
  salary: {
    title: "Зарплата",
    subtitle: "Моя текущая смена, начисленные бонусы, ставки и итоговый заработок за любой период.",
    icon: "Wallet",
    color: "#34d399",
    tag: "Финансы",
  },
  wanttobuy: {
    title: "Запросы клиентов",
    subtitle: "Заявки от клиентов на поиск конкретных моделей б/у и нового товара — предложи наличие первым.",
    icon: "ClipboardList",
    color: "#38bdf8",
    tag: "Спрос",
  },
  clients: {
    title: "Клиенты",
    subtitle: "База клиентов с историей сделок, персональными скидками и инструментами рассылок.",
    icon: "Users",
    color: "#60a5fa",
    tag: "CRM",
  },
  smartlombard: {
    title: "Скупка · СмартЛомбард",
    subtitle: "Полный цикл скупки и продажи Б/У техники: оценка, склад, касса и оформление договоров.",
    icon: "Coins",
    color: "#FFD700",
    tag: "Премиум",
  },
  chat: {
    title: "Чат команды",
    subtitle: "Внутренний мессенджер Скупка24 — общение сотрудников, задачи и координация в одном месте.",
    icon: "MessagesSquare",
    color: "#818cf8",
    tag: "Команда",
  },
  avitopro: {
    title: "Авито PRO",
    subtitle: "Статистика объявлений, авто-действия и мониторинг конкурентов на Авито — всё в одном месте.",
    icon: "Zap",
    color: "#34d399",
    tag: "Маркетплейс",
  },
  analytics: {
    title: "Аналитика",
    subtitle: "Динамика продаж, ремонтов и ключевых показателей магазина — графики и сводки за любой период.",
    icon: "BarChart2",
    color: "#a78bfa",
    tag: "Отчёты",
  },
  finance: {
    title: "Финансы",
    subtitle: "ДДС: банковские выписки + данные склада → умный ИИ-финансовый отчёт для принятия решений.",
    icon: "LineChart",
    color: "#f472b6",
    tag: "Владелец",
  },
  visitors: {
    title: "Трафик",
    subtitle: "Кто сейчас на сайте, источники трафика, конверсии и поведение посетителей в реальном времени.",
    icon: "Eye",
    color: "#c084fc",
    tag: "Аналитика",
  },
  gold: {
    title: "Золото",
    subtitle: "Учёт ювелирных изделий: приём, оценка по пробам, остатки и полная история операций.",
    icon: "Gem",
    color: "#fbbf24",
    tag: "Скупка",
  },
  employees: {
    title: "Сотрудники",
    subtitle: "Управление командой: роли и доступы, графики работы, KPI и эффективность каждого сотрудника.",
    icon: "UserCog",
    color: "#60a5fa",
    tag: "Команда",
  },
  functions: {
    title: "Функции",
    subtitle: "Мониторинг облачных функций: нагрузка, время выполнения, стоимость вызовов и оптимизация.",
    icon: "Cpu",
    color: "#94a3b8",
    tag: "Система",
  },
  unlock: {
    title: "Unlock Manager",
    subtitle: "Управление кабинетом разблокировки: наценки на услуги, активные заказы и финансовая отчётность.",
    icon: "Unlock",
    color: "#fbbf24",
    tag: "Сервис",
  },
  promo: {
    title: "Акции",
    subtitle: "Создавайте акции, публикуйте страницы для клиентов, принимайте заявки и смотрите статистику.",
    icon: "Megaphone",
    color: "#f472b6",
    tag: "Маркетинг",
  },
};

export default function StaffSectionBanner({ tab }: { tab: StaffTab }) {
  const [mounted, setMounted] = useState(false);
  const [prevTab, setPrevTab] = useState(tab);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (tab !== prevTab) {
      setVisible(false);
      const t1 = setTimeout(() => { setPrevTab(tab); setVisible(true); }, 120);
      return () => clearTimeout(t1);
    }
  }, [tab, prevTab]);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const currentMeta = SECTION_META[prevTab];
  if (!currentMeta) return null;

  return (
    <div className="px-4 pt-2 pb-1 max-w-[1400px] mx-auto w-full"
      style={{ opacity: mounted && visible ? 1 : 0, transition: "opacity 0.2s" }}>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "var(--sber-card)" }}>
          <Icon name={currentMeta.icon} size={20} style={{ color: "var(--sber-green-2)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-extrabold leading-tight text-white">{currentMeta.title}</h1>
          <p className="text-[12px] truncate leading-tight mt-0.5" style={{ color: "var(--sber-text-2)" }}>
            {currentMeta.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
