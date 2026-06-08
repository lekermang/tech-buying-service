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
  sitechat: {
    title: "Сайт-чат",
    subtitle: "Чаты с посетителями сайта Скупка24 в реальном времени — отвечай быстро и конвертируй в сделки.",
    icon: "MessageCircle",
    color: "#4ade80",
    tag: "Онлайн",
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

  const color = currentMeta.color || "#FFD700";

  return (
    <>
      <style>{`
        @keyframes bannerScan {
          0%   { top: 0; opacity: 0; }
          5%   { opacity: 0.7; }
          90%  { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.99); filter: blur(3px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
      `}</style>

      <div className="px-3 pt-3 pb-0 sm:px-4 sm:pt-3 max-w-[1400px] mx-auto w-full">
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 14,
            background: `
              linear-gradient(135deg, ${color}0d 0%, rgba(8,6,4,0.0) 60%),
              linear-gradient(180deg, rgba(20,16,10,0.7) 0%, rgba(10,8,6,0.8) 100%)
            `,
            border: `1px solid ${color}20`,
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.03) inset,
              0 -1px 0 rgba(0,0,0,0.4) inset,
              0 8px 32px rgba(0,0,0,0.5),
              0 0 40px ${color}06
            `,
            opacity: mounted && visible ? 1 : 0,
            animation: mounted && visible ? "bannerIn 0.3s cubic-bezier(0.23,1,0.32,1) both" : "none",
          }}
        >
          {/* Верхняя световая линия */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
            height: "1px",
            background: `linear-gradient(90deg, transparent 0%, ${color}50 25%, rgba(255,248,232,0.6) 50%, ${color}50 75%, transparent 100%)`,
          }} />

          {/* Кино-сканлайн */}
          <div className="absolute left-0 right-0 h-px pointer-events-none" style={{
            background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
            animation: "bannerScan 5s linear infinite",
            animationDelay: "1s",
          }} />

          {/* Угловое свечение — как прожектор */}
          <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full pointer-events-none" style={{
            background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
            filter: "blur(16px)",
          }} />

          {/* Watermark */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 font-mono font-black pointer-events-none select-none hidden sm:block"
            style={{ color: `${color}06`, fontSize: "60px", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {currentMeta.tag || tab.toUpperCase()}
          </div>

          {/* Угловые скобки */}
          {[
            { top: 0, left: 0, borderTop: `1.5px solid ${color}55`, borderLeft: `1.5px solid ${color}55`, borderRadius: "14px 0 0 0" },
            { top: 0, right: 0, borderTop: `1.5px solid ${color}55`, borderRight: `1.5px solid ${color}55`, borderRadius: "0 14px 0 0" },
            { bottom: 0, left: 0, borderBottom: `1px solid ${color}28`, borderLeft: `1px solid ${color}28`, borderRadius: "0 0 0 14px" },
            { bottom: 0, right: 0, borderBottom: `1px solid ${color}28`, borderRight: `1px solid ${color}28`, borderRadius: "0 0 14px 0" },
          ].map((s, i) => (
            <span key={i} className="absolute w-4 h-4 pointer-events-none" style={s} />
          ))}

          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Иконка в 3D раме */}
            <div className="shrink-0 relative w-10 h-10 flex items-center justify-center" style={{
              borderRadius: 10,
              background: `linear-gradient(145deg, ${color}18, ${color}08)`,
              border: `1px solid ${color}25`,
              boxShadow: `0 0 20px ${color}15, inset 0 1px 0 rgba(255,255,255,0.06)`,
            }}>
              <Icon name={currentMeta.icon} size={18}
                style={{ color, filter: `drop-shadow(0 0 8px ${color}90)` }} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                style={{ background: color, boxShadow: `0 0 6px ${color}`, opacity: 0.9 }} />
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-oswald font-black uppercase leading-tight"
                  style={{
                    fontSize: "15px",
                    letterSpacing: "0.1em",
                    background: `linear-gradient(90deg, #fff8e8, ${color})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: `drop-shadow(0 0 8px ${color}50)`,
                  }}>
                  {currentMeta.title}
                </h1>
                {currentMeta.tag && (
                  <span className="font-mono text-[8px] px-1.5 py-0.5 hidden sm:inline-block" style={{
                    color: `${color}55`,
                    background: `${color}08`,
                    border: `1px solid ${color}15`,
                    borderRadius: 4,
                    letterSpacing: "0.12em",
                  }}>
                    {currentMeta.tag}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-roboto truncate leading-tight mt-0.5"
                style={{ color: "rgba(255,240,200,0.28)" }}>
                {currentMeta.subtitle}
              </p>
            </div>

            {/* Live статус */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 shrink-0" style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
              borderRadius: 8,
              boxShadow: "0 0 12px rgba(34,197,94,0.08)",
            }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" style={{ boxShadow: "0 0 6px rgba(34,197,94,0.9)" }} />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-green-400">Live</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}