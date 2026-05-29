import React from "react";
import Icon from "@/components/ui/icon";
import BackgroundFx from "../staffTheme/BackgroundFx";
import CursorEffects from "../staffTheme/CursorEffects";
import AnimeMascot from "../staffTheme/AnimeMascot";
import StaffThemeSettings from "../staffTheme/StaffThemeSettings";
import { OfflineBanner } from "./StaffStatusBanners";
import HolidayBanner from "@/components/holidays/HolidayBanner";
import HolidayCornerDecor from "@/components/holidays/HolidayCornerDecor";
import { canSeeAnalytics, type StaffTab } from "./staffConstants";
import { FontApplier, ThemeBanner, TabErrorBoundary } from "./StaffPwa";
import {
  GoodsTab, StaffRepairTab, GoldTab, SalesTab, ClientsTab, AnalyticsTab,
  EmployeesTab, SmartLombardTab, AvitoProTab, SalaryTab,
} from "./StaffLazy";
const VisitorsAnalyticsTab = React.lazy(() => import("../StaffAnalytics"));
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
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [myAvatar, setMyAvatar] = React.useState<string | null>(null);
  const [myName, setMyName] = React.useState<string | null>(null);
  const [siteChatUnread, setSiteChatUnread] = React.useState(0);

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

  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 480px)").matches
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 480px)");
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
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
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if ((["gold", "employees"] as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const TABS: { k: Tab; l: string; icon: string; badge?: number; tip?: string; premium?: boolean }[] = [
    { k: "myday",        l: "День",        icon: "Sunrise",        tip: "Чек-лист дня, мёртвые деньги, Авито-индекс, узкие места." },
    { k: "sitechat",     l: "Чат",         icon: "MessageCircle",  tip: "Чаты от клиентов с сайта.", badge: siteChatUnread || undefined },
    { k: "wanttobuy",    l: "Ищут",        icon: "ShoppingBag",    tip: "Заявки клиентов на поиск б/у и нового товара." },
    { k: "chat",         l: "Команда",     icon: "MessagesSquare", tip: "Чат команды Скупка24." },
    { k: "repair",       l: "Ремонт",      icon: "Wrench",         tip: "Заявки на ремонт техники." },
    { k: "smartlombard", l: "Ломбард",     icon: "Coins",          tip: "СмартЛомбард: скупка и продажа Б/У техники.", premium: true },
    { k: "salary",       l: "Зарплата",    icon: "Wallet",         tip: "Моя смена и заработок." },
    { k: "clients",      l: "Клиенты",     icon: "Users",          tip: "База клиентов, скидки, СМС-рассылки." },
    { k: "avitopro",     l: "Авито",       icon: "Zap",            tip: "Авито PRO: статистика, авто-действия." },
    ...(analyticsAllowed ? [{ k: "analytics" as Tab, l: "Стат.", icon: "BarChart2", tip: "Аналитика по продажам и ремонтам." }] : []),
    { k: "visitors",     l: "Трафик",      icon: "Activity",       tip: "Кто на сайте сейчас, источники трафика.", premium: true },
    ...(isOwnerOrAdmin ? [{ k: "gold"      as Tab, l: "Золото",  icon: "Gem",     tip: "Учёт ювелирных изделий." }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees" as Tab, l: "Команда", icon: "UserCog", tip: "Управление сотрудниками." }] : []),
  ];

  const initials = getInitials(empName);

  const roleColor =
    empRole === "owner" ? "#FFD700" :
    empRole === "admin" ? "#60a5fa" :
    "#a3e635";

  return (
    <div
      className="text-white flex flex-col relative overflow-x-hidden"
      style={{ fontFamily: "var(--staff-font, inherit)", minHeight: "100dvh", background: "#050508" }}
    >
      <FontApplier />

      {/* Технологичный фон */}
      <StaffBackground roleColor={roleColor} />

      {!isMobile && <BackgroundFx />}
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
            {tab === "repair"       && <StaffRepairTab token={token} isOwner={empRole === "owner"} />}
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
          </React.Suspense>
        </TabErrorBoundary>
      </div>

      {/* Нижняя навигация */}
      <StaffBottomNav
        tabs={TABS}
        tab={tab}
        roleColor={roleColor}
        isOwner={isOwner}
        unlocked={unlocked}
        onRequestTab={requestTab}
      />

      {/* Watcher заявок */}
      <LeadsAlertWatcher token={token} empName={empName} />

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
