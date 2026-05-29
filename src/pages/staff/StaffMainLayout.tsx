import React from "react";
import Icon from "@/components/ui/icon";
import BackgroundFx from "../staffTheme/BackgroundFx";
import CursorEffects from "../staffTheme/CursorEffects";
import AnimeMascot from "../staffTheme/AnimeMascot";
import StaffThemeSettings from "../staffTheme/StaffThemeSettings";
import InstallPwaButton from "./InstallPwaButton";
import { OfflineBanner } from "./StaffStatusBanners";
import HolidayBanner from "@/components/holidays/HolidayBanner";
import HolidayCornerDecor from "@/components/holidays/HolidayCornerDecor";
import HolidayShowAgainButton from "@/components/holidays/HolidayShowAgainButton";
import { PROTECTED_TABS, ROLE_BADGE, ROLE_LABEL, getInitials, canSeeAnalytics, type StaffTab } from "./staffConstants";
import { FontApplier, MskClock, ThemeBanner, TabErrorBoundary } from "./StaffPwa";
import {
  GoodsTab, StaffRepairTab, GoldTab, SalesTab, ClientsTab, AnalyticsTab,
  EmployeesTab, SmartLombardTab, AvitoProTab, SalaryTab, prefetchTab,
} from "./StaffLazy";
const VisitorsAnalyticsTab = React.lazy(() => import("../StaffAnalytics"));
import MyProfileModal from "./MyProfileModal";
import StaffSectionBanner from "./StaffSectionBanner";
import { SLTooltip } from "../slShop/slUI";
import LeadsAlertWatcher from "./LeadsAlertWatcher";
import MyDayTab from "../staffMyDay/MyDayTab";
import VipChatTab from "../staffChat/VipChatTab";
import SiteChatTab from "../staffChat/SiteChatTab";
import WantToBuyTab from "../staffWantToBuy/WantToBuyTab";
import AppUpdateBanner from "@/components/AppUpdateBanner";
import AppSettingsMenu from "@/components/AppSettingsMenu";

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
    if ((PROTECTED_TABS as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const TABS: { k: Tab; l: string; icon: string; badge?: number; tip?: string; premium?: boolean }[] = [
    { k: "myday",        l: "День",        icon: "Sunrise",       tip: "Чек-лист дня, мёртвые деньги, Авито-индекс, узкие места." },
    { k: "sitechat",     l: "Чат",         icon: "MessageCircle", tip: "Чаты от клиентов с сайта.", badge: siteChatUnread || undefined },
    { k: "wanttobuy",    l: "Ищут",        icon: "ShoppingBag",   tip: "Заявки клиентов на поиск б/у и нового товара." },
    { k: "chat",         l: "Команда",     icon: "MessagesSquare", tip: "Чат команды Скупка24." },
    { k: "repair",       l: "Ремонт",      icon: "Wrench",        tip: "Заявки на ремонт техники." },
    { k: "smartlombard", l: "Ломбард",     icon: "Coins",         tip: "СмартЛомбард: скупка и продажа Б/У техники.", premium: true },
    { k: "salary",       l: "Зарплата",    icon: "Wallet",        tip: "Моя смена и заработок." },
    { k: "clients",      l: "Клиенты",     icon: "Users",         tip: "База клиентов, скидки, СМС-рассылки." },
    { k: "avitopro",     l: "Авито",       icon: "Zap",           tip: "Авито PRO: статистика, авто-действия." },
    ...(analyticsAllowed ? [{ k: "analytics" as Tab, l: "Стат.", icon: "BarChart2", tip: "Аналитика по продажам и ремонтам." }] : []),
    { k: "visitors",     l: "Трафик",      icon: "Activity",      tip: "Кто на сайте сейчас, источники трафика.", premium: true },
    ...(isOwnerOrAdmin ? [{ k: "gold" as Tab, l: "Золото", icon: "Gem", tip: "Учёт ювелирных изделий." }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees" as Tab, l: "Команда", icon: "UserCog", tip: "Управление сотрудниками." }] : []),
  ];

  const initials = getInitials(empName);

  // Цвет роли
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

      {/* ── Технологичный фон ── */}
      {/* Hex-сетка */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700' /%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />
      {/* Скан-линии */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          backgroundSize: "100% 4px",
        }}
      />
      {/* Угловые свечения */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-0 rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, ${roleColor}18 0%, transparent 70%)`, transform: "translate(-30%, -30%)" }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none z-0 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", transform: "translate(30%, 30%)" }} />
      <div className="fixed top-1/2 left-1/2 w-[600px] h-[600px] pointer-events-none z-0 rounded-full blur-[160px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 60%)" }} />

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

      {/* ── ШАПКА ── */}
      <header className="relative shrink-0 safe-top z-10">
        {/* Стеклянный фон шапки */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(5,5,8,0.85) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />
        {/* Неоновая полоска сверху */}
        <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none z-10"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${roleColor}99 30%, ${roleColor} 50%, ${roleColor}99 70%, transparent 100%)`,
            boxShadow: `0 0 12px ${roleColor}88, 0 0 30px ${roleColor}44` }} />
        {/* Нижняя граница */}
        <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${roleColor}30, transparent)` }} />

        <div className={`relative flex items-center gap-2 ${isMobile ? "px-2.5 py-2" : "px-4 py-2.5"}`}>

          {/* Аватар */}
          <SLTooltip as="flex" content={<><b>{myName || empName}</b><br />{ROLE_LABEL[empRole] || empRole} · нажми для профиля</>} placement="bottom">
            <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left active:scale-95 transition group">
              <div className="relative shrink-0">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden"
                  style={{ boxShadow: `0 0 0 1.5px ${roleColor}60, 0 0 12px ${roleColor}30` }}>
                  {myAvatar ? (
                    <img src={myAvatar} alt="ava" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-oswald font-bold text-sm"
                      style={{ background: `linear-gradient(135deg, ${roleColor}40, ${roleColor}15)`, color: roleColor }}>
                      {initials}
                    </div>
                  )}
                </div>
                {/* Онлайн-индикатор */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#050508]"
                  style={{ background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.8)" }} />
              </div>

              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="font-oswald font-bold text-sm uppercase tracking-wide truncate leading-none"
                  style={{ color: roleColor, textShadow: `0 0 12px ${roleColor}60` }}>
                  {myName || empName}
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-roboto px-1.5 py-0.5 rounded"
                    style={{ background: `${roleColor}18`, border: `1px solid ${roleColor}35`, color: roleColor }}>
                    {empRole === "owner" && "👑 "}
                    {ROLE_LABEL[empRole] || empRole}
                  </span>
                </div>
              </div>
            </button>
          </SLTooltip>

          {/* Часы — только десктоп */}
          {!isMobile && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-roboto text-xs"
              style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)", color: "rgba(255,255,255,0.5)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              <MskClock />
            </div>
          )}

          {/* Кнопки справа */}
          <div className="flex items-center gap-0.5 shrink-0">
            {isOwnerOrAdmin && !isMobile && (
              <SLTooltip content="Отправить напоминание @PluXan" placement="bottom">
                <button onClick={sendReminderNow} disabled={sending}
                  className="p-2 rounded-lg transition-all active:scale-95"
                  style={{
                    background: sendResult === true ? "rgba(34,197,94,0.15)" : sendResult === false ? "rgba(239,68,68,0.15)" : "rgba(255,215,0,0.08)",
                    border: `1px solid ${sendResult === true ? "rgba(34,197,94,0.3)" : sendResult === false ? "rgba(239,68,68,0.3)" : "rgba(255,215,0,0.2)"}`,
                    color: sendResult === true ? "#22c55e" : sendResult === false ? "#ef4444" : "#FFD700",
                  }}>
                  <Icon name={sending ? "Loader" : sendResult === true ? "Check" : "Bell"} size={14} className={sending ? "animate-spin" : ""} />
                </button>
              </SLTooltip>
            )}
            <InstallPwaButton />
            <HolidayShowAgainButton />
            <AppSettingsMenu />
            <SLTooltip content={<><b>Мой профиль</b><br />Аватар, имя, пин-код</>} placement="bottom">
              <button onClick={() => setProfileOpen(true)}
                className="p-2 rounded-lg text-white/30 hover:text-white/70 transition-all hover:bg-white/5">
                <Icon name="UserCog" size={15} />
              </button>
            </SLTooltip>
            <SLTooltip content={<><b>Оформление</b><br />Тема, цвета, эффекты</>} placement="bottom">
              <button onClick={() => setThemeOpen(true)}
                className="p-2 rounded-lg transition-all"
                style={{ color: `${roleColor}99` }}
                onMouseEnter={e => (e.currentTarget.style.color = roleColor)}
                onMouseLeave={e => (e.currentTarget.style.color = `${roleColor}99`)}>
                <Icon name="Sparkles" size={15} />
              </button>
            </SLTooltip>
            <SLTooltip content={<><b>Выйти</b><br />Завершить сессию</>} placement="bottom">
              <button onClick={logout}
                className="p-2 rounded-lg text-white/20 hover:text-red-400 transition-all hover:bg-red-500/10">
                <Icon name="LogOut" size={15} />
              </button>
            </SLTooltip>
          </div>
        </div>
      </header>

      {/* ── КОНТЕНТ ── */}
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

      {/* ── НИЖНЯЯ НАВИГАЦИЯ ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {/* Градиент-тень сверху */}
        <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-[#050508]/95 to-transparent pointer-events-none" />

        <div className="relative"
          style={{
            background: "rgba(5,5,8,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: `1px solid ${roleColor}25`,
            boxShadow: `0 -1px 0 ${roleColor}15, 0 -20px 40px rgba(5,5,8,0.8)`,
          }}>

          {/* Активная вкладка — неоновый индикатор сверху */}
          <div className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${roleColor}40, transparent)` }} />

          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TABS.map(t => {
              const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
              const active = tab === t.k;
              const isHot = ("badge" in t) && typeof t.badge === "number" && t.badge > 0;

              return (
                <SLTooltip key={t.k} placement="top" delay={400} as="flex"
                  content={<><b style={{ color: roleColor }}>{t.l}</b>{t.tip && <><br />{t.tip}</>}{locked && <><br /><span className="text-red-300">🔒 Пароль владельца</span></>}</>}>
                  <button
                    onClick={() => requestTab(t.k as Tab)}
                    onMouseEnter={() => prefetchTab(t.k)}
                    onTouchStart={() => prefetchTab(t.k)}
                    aria-label={t.l}
                    aria-current={active ? "page" : undefined}
                    className="relative flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-w-[52px] min-h-[60px] transition-all duration-200 active:scale-90 group"
                    style={{ flex: "1 0 52px" }}
                  >
                    {/* Активный индикатор — линия сверху с неоновым свечением */}
                    {active && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-10 rounded-b"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
                          boxShadow: `0 0 8px ${roleColor}cc, 0 0 20px ${roleColor}66`,
                        }} />
                    )}

                    {/* Активный фон */}
                    {active && (
                      <span className="absolute inset-x-1 inset-y-1 rounded-xl pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at 50% 0%, ${roleColor}18 0%, transparent 70%)`,
                          border: `1px solid ${roleColor}20`,
                        }} />
                    )}

                    {/* Премиум-подложка для особых вкладок */}
                    {t.premium && !active && (
                      <span className="absolute inset-x-1 inset-y-1 rounded-xl pointer-events-none"
                        style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.10)" }} />
                    )}

                    {/* Иконка */}
                    <div className="relative">
                      <Icon name={t.icon}
                        size={active ? 19 : 17}
                        style={{
                          color: active ? roleColor : t.premium ? "rgba(255,215,0,0.55)" : "rgba(255,255,255,0.35)",
                          filter: active ? `drop-shadow(0 0 6px ${roleColor}aa)` : "none",
                          transition: "all 0.2s",
                        }}
                      />
                      {/* Бейдж непрочитанных */}
                      {isHot && (
                        <span className="absolute -top-2 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.7)", animation: "pulse 2s infinite" }}>
                          {(t.badge as number) > 99 ? "99+" : t.badge}
                        </span>
                      )}
                      {/* Замок */}
                      {locked && (
                        <span className="absolute -top-1.5 -right-1.5 text-[8px]">🔒</span>
                      )}
                      {/* Премиум точка */}
                      {t.premium && !active && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                          style={{ background: "#FFD700", boxShadow: "0 0 5px rgba(255,215,0,0.9)" }} />
                      )}
                    </div>

                    {/* Лейбл */}
                    <span className="font-roboto leading-none tracking-tight transition-all duration-200"
                      style={{
                        fontSize: "9px",
                        color: active ? roleColor : "rgba(255,255,255,0.3)",
                        fontWeight: active ? 700 : 400,
                        textShadow: active ? `0 0 8px ${roleColor}66` : "none",
                      }}>
                      {t.l}
                    </span>
                  </button>
                </SLTooltip>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Watcher заявок */}
      <LeadsAlertWatcher token={token} empName={empName} />

      {/* ── МОДАЛКА ПАРОЛЯ ── */}
      {pwModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={() => setPwModal(null)}>
          <div onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0a0a10 0%, #050508 100%)",
              border: `1px solid ${roleColor}40`,
              boxShadow: `0 0 0 1px ${roleColor}15, 0 32px 64px rgba(0,0,0,0.8), 0 0 60px ${roleColor}15`,
            }}>
            {/* Верхняя неоновая линия */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`,
                boxShadow: `0 0 12px ${roleColor}` }} />

            {/* Свечения */}
            <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: `${roleColor}12` }} />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: "rgba(99,102,241,0.10)" }} />

            <div className="relative z-10 p-6">
              {/* Заголовок */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${roleColor}15`, border: `1px solid ${roleColor}35` }}>
                  <Icon name="Lock" size={18} style={{ color: roleColor }} />
                </div>
                <div className="flex-1">
                  <div className="font-oswald font-bold uppercase text-base tracking-wide"
                    style={{ color: roleColor }}>
                    {pwModal === "gold" ? "Доступ к золоту" : pwModal === "employees" ? "Доступ к команде" : "Доступ к статистике"}
                  </div>
                  <div className="text-white/40 text-xs font-roboto mt-0.5">Введите пароль владельца</div>
                </div>
                <button onClick={() => setPwModal(null)} className="text-white/20 hover:text-white/50 transition-colors p-1">
                  <Icon name="X" size={16} />
                </button>
              </div>

              <input
                type="password"
                autoFocus
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(""); }}
                onKeyDown={e => { if (e.key === "Enter") submitPw(); if (e.key === "Escape") setPwModal(null); }}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 font-roboto text-base text-white placeholder:text-white/15 outline-none rounded-xl mb-3 tracking-widest transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${pwError ? "rgba(239,68,68,0.5)" : roleColor + "30"}`,
                  boxShadow: pwError ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
                }}
                onFocus={e => { e.currentTarget.style.border = `1px solid ${roleColor}70`; e.currentTarget.style.boxShadow = `0 0 0 3px ${roleColor}15`; }}
                onBlur={e => { e.currentTarget.style.border = `1px solid ${pwError ? "rgba(239,68,68,0.5)" : roleColor + "30"}`; e.currentTarget.style.boxShadow = "none"; }}
              />

              {pwError && (
                <div className="text-red-400 text-xs font-roboto mb-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  <Icon name="AlertCircle" size={12} />{pwError}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setPwModal(null)}
                  className="flex-1 py-3 rounded-xl font-roboto text-sm text-white/40 hover:text-white/60 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                  Отмена
                </button>
                <button onClick={submitPw}
                  className="flex-1 py-3 rounded-xl font-oswald font-bold uppercase text-sm tracking-wide transition-all active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}aa)`,
                    color: "#000",
                    boxShadow: `0 4px 20px ${roleColor}40`,
                  }}>
                  Войти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
