import React from "react";
import Icon from "@/components/ui/icon";
import BackgroundFx from "../staffTheme/BackgroundFx";
import CursorEffects from "../staffTheme/CursorEffects";
import AnimeMascot from "../staffTheme/AnimeMascot";
import StaffThemeSettings from "../staffTheme/StaffThemeSettings";
import { useStaffTheme } from "../staffTheme/StaffThemeContext";
import { OfflineBanner } from "./StaffStatusBanners";
import HolidayBanner from "@/components/holidays/HolidayBanner";
import HolidayCornerDecor from "@/components/holidays/HolidayCornerDecor";
import { canSeeAnalytics, type StaffTab } from "./staffConstants";
import { FontApplier, ThemeBanner, TabErrorBoundary } from "./StaffPwa";
import {
  GoodsTab, StaffRepairTab, GoldTab, SalesTab, ClientsTab, AnalyticsTab,
  EmployeesTab, SmartLombardTab, AvitoProTab, SalaryTab, FinanceTab, PromoTab,
} from "./StaffLazy";
const VisitorsAnalyticsTab = React.lazy(() => import("../StaffAnalytics"));
const StaffFunctionsTab = React.lazy(() => import("../staffFunctions/StaffFunctionsTab"));
const UnlockManagerTab  = React.lazy(() => import("../staffUnlock/UnlockManagerTab"));
import MyProfileModal from "./MyProfileModal";
import StaffSectionBanner from "./StaffSectionBanner";
import LeadsAlertWatcher from "./LeadsAlertWatcher";
import MyDayTab from "../staffMyDay/MyDayTab";
import VipChatTab from "../staffChat/VipChatTab";
import SiteChatTab from "../staffChat/SiteChatTab";
import WantToBuyTab from "../staffWantToBuy/WantToBuyTab";
import AppUpdateBanner from "@/components/AppUpdateBanner";
import { getInitials } from "./staffConstants";

import StaffBackground from "./StaffBackground";
import StaffHeader from "./StaffHeader";
import StaffBottomNav from "./StaffBottomNav";
import StaffPasswordModal from "./StaffPasswordModal";
import DigitalParticles from "@/components/fx/DigitalParticles";
import PriceFloatingButton from "./PriceFloatingButton";
import DebtBouncer from "../staffSalary/DebtBouncer";
import UrgentRepairBanner from "../repair/staffTab/UrgentRepairBanner";

type Tab = StaffTab;

type Props = {
  token: string;
  empName: string;
  empRole: string;
  isOwnerOrAdmin: boolean;
  isOwner: boolean;
  tab: Tab;
  setTab: (t: Tab) => void;
  unlocked: Record<string, boolean>;
  setUnlocked: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  themeOpen: boolean;
  setThemeOpen: (v: boolean) => void;
  pwModal: null | Tab;
  setPwModal: React.Dispatch<React.SetStateAction<null | Tab>>;
  pwInput: string;
  setPwInput: React.Dispatch<React.SetStateAction<string>>;
  pwError: string;
  setPwError: React.Dispatch<React.SetStateAction<string>>;
  submitPw: () => void;
  sending: boolean;
  sendResult: null | boolean;
  sendReminderNow: () => void;
  logout: () => void;
};

export function StaffMainLayout({
  token, empName, empRole, isOwnerOrAdmin, isOwner,
  tab, setTab, unlocked,
  themeOpen, setThemeOpen,
  pwModal, setPwModal, pwInput, setPwInput, pwError, setPwError, submitPw,
  sending, sendResult, sendReminderNow, logout,
}: Props) {
  const { theme } = useStaffTheme();
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [myAvatar, setMyAvatar] = React.useState<string | null>(null);
  const [myName, setMyName] = React.useState<string | null>(null);
  const [siteChatUnread, setSiteChatUnread] = React.useState(0);
  const [leadsStats, setLeadsStats] = React.useState<{ new_count: number; overdue_count: number } | null>(null);
  const [leadsPanelOpen, setLeadsPanelOpen] = React.useState(false);
  const [urgentRepairCount, setUrgentRepairCount] = React.useState(0);
  const [urgentRepairTrigger, setUrgentRepairTrigger] = React.useState(0);

  React.useEffect(() => {
    const CHAT_URL = "https://functions.poehali.dev/60644856-ff88-4875-b2a9-97c87d32a630";
    const check = async () => {
      try {
        const r = await fetch(`${CHAT_URL}?action=staff_rooms`, { headers: { "X-Employee-Token": token } });
        const d = await r.json();
        if (d?.ok && Array.isArray(d.rooms)) {
          const total = d.rooms.reduce((s: number, rm: { unread_count: number }) => s + (rm.unread_count || 0), 0);
          setSiteChatUnread(total);
        }
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 20000);
    return () => clearInterval(id);
  }, [token]);

  // Мобила = узкий экран ИЛИ сенсорное устройство (надёжнее, чем только ширина).
  // На таких устройствах отключаем тяжёлые canvas/WebGL-эффекты, которые
  // могут крашить рендер (чёрный экран) на iOS Safari / слабых Android.
  const detectMobile = () => {
    if (typeof window === "undefined") return false;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    return narrow || coarse;
  };
  const [isMobile, setIsMobile] = React.useState<boolean>(detectMobile);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mqNarrow = window.matchMedia("(max-width: 768px)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const onChange = () => setIsMobile(mqNarrow.matches || mqCoarse.matches);
    mqNarrow.addEventListener?.("change", onChange);
    mqCoarse.addEventListener?.("change", onChange);
    return () => {
      mqNarrow.removeEventListener?.("change", onChange);
      mqCoarse.removeEventListener?.("change", onChange);
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    type IdleWin = Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
    const w = window as IdleWin;
    const run = () => {
      if (cancelled) return;
      fetch("https://functions.poehali.dev/29210248-0b73-4c54-9b9f-acd13668dfea", {
        headers: { "X-Employee-Token": token },
      }).then(r => r.json()).then(j => {
        if (cancelled) return;
        if (j && j.avatar_url) setMyAvatar(j.avatar_url);
      }).catch(() => {});
    };
    if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 });
    else setTimeout(run, 1500);
    return () => { cancelled = true; };
  }, [token]);

  const analyticsAllowed = canSeeAnalytics(empRole, empName);

  const requestTab = (t: Tab) => {
    if (t === "sitechat") setSiteChatUnread(0);
    // Заявки — открываем панель поверх текущей вкладки, не меняем таб
    if (t === "leads") { setLeadsPanelOpen(true); return; }
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if ((["gold", "employees"] as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  // ── Навигация по ролям ──────────────────────────────────────────────────────
  // Staff/master: только самое важное — 5 вкладок
  // Admin: + Клиенты, Ломбард — 7 вкладок
  // Owner: 6 основных + кнопка «···» (drawer) со всем остальным

  // Бейдж заявок: горящий счётчик новых / просроченных
  const leadsNewCount  = leadsStats?.new_count     || 0;
  const leadsOverdue   = leadsStats?.overdue_count || 0;
  const leadsHot       = leadsOverdue > 0 ? leadsOverdue : leadsNewCount;

  const ALL_TABS: { k: Tab; l: string; icon: string; badge?: number; tip?: string; premium?: boolean; hot?: boolean }[] = [
    // «Заявки» — первой, видна всем ролям (открывает панель, не меняет таб)
    { k: "leads", l: "Заявки", icon: leadsOverdue > 0 ? "Flame" : "Inbox",
      badge: leadsHot || undefined,
      hot: leadsOverdue > 0,
      tip: "Входящие заявки от клиентов сайта — оценка, скупка, вопросы. Горящие — просроченные без ответа." },
    { k: "myday",        l: "Мой день",    icon: "CalendarCheck",   tip: "Персональный чек-лист смены: мёртвые деньги, Авито-индекс, узкие места и план дня." },
    { k: "repair",       l: "Ремонт",      icon: "Wrench",          tip: "Заявки на ремонт техники: статусы, сроки, история по устройствам." },
    { k: "sitechat",     l: "Сайт-чат",    icon: "MessageCircle",   tip: "Чаты с клиентами, открытыми прямо на сайте Скупка24 — отвечай быстро.", badge: siteChatUnread || undefined },
    { k: "salary",       l: "Зарплата",    icon: "Wallet",          tip: "Моя текущая смена, начисления, ставки и итоговый заработок за период." },
    { k: "wanttobuy",    l: "Запросы",     icon: "ClipboardList",   tip: "Заявки клиентов на поиск конкретных моделей б/у и нового товара — можно предложить наличие." },
    { k: "clients",      l: "Клиенты",     icon: "Users",           tip: "База клиентов, история сделок, скидки, СМС и пуш-рассылки." },
    { k: "smartlombard", l: "Скупка",      icon: "Coins",           tip: "СмартЛомбард: скупка, продажа Б/У техники, склад, касса и договоры.", premium: true },
    { k: "chat",         l: "Чат",         icon: "MessagesSquare",  tip: "Внутренний чат команды Скупка24 — общение сотрудников и руководства." },
    { k: "avitopro",     l: "Авито",       icon: "Zap",             tip: "Авито PRO: статистика объявлений, авто-действия, мониторинг конкурентов." },
    ...(analyticsAllowed ? [{ k: "analytics" as Tab, l: "Аналитика",  icon: "BarChart2",    tip: "Аналитика по продажам, ремонтам и динамике показателей магазина." }] : []),
    ...(isOwner ? [{ k: "finance"   as Tab, l: "Финансы",   icon: "LineChart",    tip: "ДДС: банковские выписки + данные склада → ИИ-финансовый отчёт." }] : []),
    { k: "visitors",     l: "Трафик",      icon: "Eye",             tip: "Кто сейчас на сайте, источники трафика, конверсии и поведение посетителей.", premium: true },
    ...(isOwnerOrAdmin ? [{ k: "gold"      as Tab, l: "Золото",      icon: "Gem",          tip: "Учёт ювелирных изделий: приём, оценка, остатки, история по пробам." }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees" as Tab, l: "Сотрудники",  icon: "UserCog",      tip: "Управление командой: роли, доступы, графики работы, KPI сотрудников." }] : []),
    ...(isOwner ? [{ k: "functions" as Tab, l: "Функции",   icon: "Cpu",          tip: "Мониторинг и оптимизация потребления облачных функций — нагрузка и стоимость." }] : []),
    ...(isOwner ? [{ k: "unlock"    as Tab, l: "Unlock",    icon: "Unlock",       tip: "Управление кабинетом разблокировки: наценки, заказы, выплаты, финансы." }] : []),
    ...(isOwner ? [{ k: "promo"     as Tab, l: "Акции",     icon: "Megaphone",    tip: "Создание акций, страниц для клиентов и сбор заявок." }] : []),
  ];

  // Вкладки в основной панели по роли
  // Заявки (index 0) — всегда первая для всех
  // Staff/master: 5 вкладок (Заявки · День · Ремонт · Чат · Зарплата)
  // Admin: 7 вкладок (+ Ищут · Клиенты)
  // Owner: 6 вкладок (+ Ломбард) + drawer для остальных
  const TABS: typeof ALL_TABS = isOwner
    ? ALL_TABS.slice(0, 8)          // Owner: первые 8 + drawer для остальных
    : isOwnerOrAdmin
      ? ALL_TABS.slice(0, 8)        // Admin: первые 8
      : ALL_TABS.slice(0, 8);       // Staff/master: первые 8 (Заявки·День·Ремонт·Чат·Зарплата·Ищут·Клиенты·Ломбард)

  const initials = getInitials(empName);

  const roleColor =
    empRole === "owner" ? "#FFD700" :
    empRole === "admin" ? "#60a5fa" :
    "#a3e635";

  return (
    <div
      className="text-white flex flex-col relative overflow-x-hidden noir-scanline"
      style={{ fontFamily: "var(--staff-font, inherit)", minHeight: "100dvh", background: "#050403" }}
    >
      <FontApplier />

      {/* Технологичный фон */}
      <StaffBackground roleColor={roleColor} isMobile={isMobile} />
      {!isMobile && <DigitalParticles />}

      {!isMobile && <BackgroundFx />}
      {!isMobile && theme.enabled && theme.bg_style === "webgl" && (
        <div className="fixed inset-0 z-[1] pointer-events-none" style={{ opacity: 0.045, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px 180px", mixBlendMode: "overlay" }} />
      )}
      {!isMobile && <CursorEffects />}
      {!isMobile && <AnimeMascot onOpenSettings={() => setThemeOpen(true)} />}
      {themeOpen && <StaffThemeSettings onClose={() => setThemeOpen(false)} />}
      {profileOpen && (
        <MyProfileModal
          token={token}
          onClose={() => setProfileOpen(false)}
          onUpdated={({ avatar_url, full_name }) => {
            if (avatar_url !== undefined) setMyAvatar(avatar_url || null);
            if (full_name) setMyName(full_name);
          }}
        />
      )}

      <OfflineBanner />
      <AppUpdateBanner />
      <HolidayBanner className="z-20" />
      <HolidayCornerDecor />
      <ThemeBanner onOpen={() => setThemeOpen(true)} />
      {/* Баннер долга — только для рядовых сотрудников */}
      {empRole === "staff" && <DebtBouncer token={token} />}

      {/* Шапка */}
      <StaffHeader
        empName={empName}
        empRole={empRole}
        myName={myName}
        myAvatar={myAvatar}
        initials={initials}
        roleColor={roleColor}
        isMobile={isMobile}
        isOwnerOrAdmin={isOwnerOrAdmin}
        sending={sending}
        sendResult={sendResult}
        sendReminderNow={sendReminderNow}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenTheme={() => setThemeOpen(true)}
        logout={logout}
      />

      {/* Контент */}
      <div className="flex-1 overflow-y-auto relative z-10"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <StaffSectionBanner tab={tab} />
        <TabErrorBoundary key={tab}>
          <React.Suspense fallback={
            <div className="flex items-center justify-center py-16 text-white/20 font-roboto text-sm">
              <Icon name="Loader" size={16} className="animate-spin mr-2" />Загружаю...
            </div>
          }>
            {tab === "myday"        && <MyDayTab token={token} />}
            {tab === "sitechat"     && <SiteChatTab token={token} />}
            {tab === "wanttobuy"    && <WantToBuyTab token={token} />}
            {tab === "chat"         && <VipChatTab token={token} />}
            {tab === "repair"       && <StaffRepairTab token={token} isOwner={empRole === "owner"} onUrgentCount={setUrgentRepairCount} initialUrgentFilter={urgentRepairTrigger > 0} />}
            {tab === "goods"        && <GoodsTab token={token} />}
            {tab === "sales"        && <SalesTab token={token} />}
            {tab === "clients"      && <ClientsTab token={token} />}
            {tab === "visitors"     && <VisitorsAnalyticsTab embedded tokenProp={token} />}
            {tab === "analytics"    && analyticsAllowed && <AnalyticsTab token={token} />}
            {tab === "analytics"    && !analyticsAllowed && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-1">
                  <Icon name="Lock" size={24} className="text-red-400/70" />
                </div>
                <div className="font-oswald font-bold text-lg text-white/60 uppercase tracking-wide">Нет доступа</div>
                <div className="font-roboto text-sm text-white/30 max-w-xs">Аналитика доступна только владельцу и уполномоченным сотрудникам</div>
              </div>
            )}
            {tab === "gold"         && isOwnerOrAdmin && <GoldTab token={token} />}
            {tab === "employees"    && isOwnerOrAdmin && <EmployeesTab token={token} myRole={empRole} />}
            {tab === "smartlombard" && <SmartLombardTab token={token} myRole={empRole} />}
            {tab === "avitopro"     && <AvitoProTab token={token} />}
            {tab === "salary"       && <SalaryTab role={empRole} token={token} employeeName={empName} />}
            {tab === "functions"    && isOwner && <StaffFunctionsTab token={token} />}
            {tab === "unlock"       && isOwner && <UnlockManagerTab token={token} />}
            {tab === "promo"        && isOwner && <PromoTab token={token} />}
            {tab === "finance"      && isOwner && <FinanceTab token={token} />}
            {tab === "finance"      && !isOwner && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-1">
                  <Icon name="Lock" size={24} className="text-red-400/70" />
                </div>
                <div className="font-oswald font-bold text-lg text-white/60 uppercase tracking-wide">Нет доступа</div>
                <div className="font-roboto text-sm text-white/30 max-w-xs">Финансовый отчёт доступен только владельцу</div>
              </div>
            )}
          </React.Suspense>
        </TabErrorBoundary>
      </div>

      {/* Плавающая кнопка «Отправить прайс» — для всех сотрудников */}
      <PriceFloatingButton token={token} />

      {/* Кнопка СРОЧНО — срочные ремонты (видна на всех вкладках) */}
      <UrgentRepairBanner
        count={urgentRepairCount}
        onClick={() => {
          setUrgentRepairTrigger(v => v + 1);
          requestTab("repair");
        }}
      />

      {/* Нижняя навигация */}
      <StaffBottomNav
        tabs={TABS}
        drawerTabs={isOwner ? ALL_TABS.slice(8) : []}
        tab={tab}
        roleColor={roleColor}
        isOwner={isOwner}
        unlocked={unlocked}
        onRequestTab={requestTab}
      />

      {/* Watcher заявок — без плавающей кнопки, панель управляется из навигации */}
      <LeadsAlertWatcher
        token={token}
        empName={empName}
        panelOpen={leadsPanelOpen}
        onPanelOpen={() => setLeadsPanelOpen(true)}
        onPanelClose={() => setLeadsPanelOpen(false)}
        onStatsChange={(s) => setLeadsStats(s ? { new_count: s.new_count, overdue_count: s.overdue_count } : null)}
      />

      {/* Модалка пароля */}
      {pwModal && (
        <StaffPasswordModal
          pwModal={pwModal}
          roleColor={roleColor}
          pwInput={pwInput}
          pwError={pwError}
          setPwInput={setPwInput}
          setPwError={setPwError}
          setPwModal={() => setPwModal(null)}
          submitPw={submitPw}
        />
      )}
    </div>
  );
}