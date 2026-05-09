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
import { PROTECTED_TABS, ROLE_BADGE, ROLE_LABEL, getInitials, type StaffTab } from "./staffConstants";
import { FontApplier, MskClock, ThemeBanner, TabErrorBoundary } from "./StaffPwa";
import {
  GoodsTab, StaffRepairTab, GoldTab, SalesTab, ClientsTab, AnalyticsTab,
  EmployeesTab, VipChatTab, SmartLombardTab, AvitoProTab, prefetchTab,
} from "./StaffLazy";
import MyProfileModal from "./MyProfileModal";
import StaffSectionBanner from "./StaffSectionBanner";
import { SLTooltip } from "../slShop/slUI";
import LeadsAlertWatcher from "./LeadsAlertWatcher";

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
  chatUnread: number;
  setChatUnread: (n: number) => void;
};

export function StaffMainLayout({
  token, empName, empRole, isOwnerOrAdmin, isOwner,
  tab, setTab, unlocked,
  themeOpen, setThemeOpen,
  pwModal, setPwModal, pwInput, setPwInput, pwError, setPwError, submitPw,
  sending, sendResult, sendReminderNow, logout,
  chatUnread, setChatUnread,
}: Props) {
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [myAvatar, setMyAvatar] = React.useState<string | null>(null);
  const [myName, setMyName] = React.useState<string | null>(null);
  // Мобильный режим: на узких экранах отключаем тяжёлые эффекты и компактим UI
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
    // Подтянем avatar_url из профиля — откладываем до простоя браузера
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
  const requestTab = (t: Tab) => {
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if ((PROTECTED_TABS as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const TABS: { k: Tab; l: string; icon: string; badge?: number; tip?: string }[] = [
    { k: "repair",       l: "Ремонт",       icon: "Wrench",        tip: "Заявки на ремонт техники: новые, в работе, готовые. Поиск, фото, статусы." },
    { k: "chat",         l: "Чат",          icon: "MessageCircle", tip: "Внутренний чат сотрудников и общение с VIP-клиентами.", badge: chatUnread },
    { k: "clients",      l: "Клиенты",      icon: "Users",         tip: "База клиентов, скидки, СМС-рассылки." },
    { k: "analytics",    l: "Статистика",   icon: "BarChart2",     tip: "Аналитика по продажам, ремонтам и сотрудникам." },
    { k: "smartlombard", l: "СмартЛомбард", icon: "Coins",         tip: "Скупка и продажа Б/У техники, касса, договоры на 14 дней." },
    { k: "avitopro",     l: "Авито PRO",    icon: "Zap",           tip: "Сводка по объявлениям, статистика просмотров и контактов, авто-действия." },
    ...(isOwnerOrAdmin ? [{ k: "gold" as Tab, l: "Золото", icon: "Gem", tip: "Учёт ювелирных изделий и драгметаллов." }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees" as Tab, l: "Команда", icon: "UserCog", tip: "Управление сотрудниками, роли, графики." }] : []),
  ];

  const initials = getInitials(empName);

  return (
    <div
      className="bg-[#0D0D0D] text-white flex flex-col relative overflow-x-hidden"
      style={{
        fontFamily: "var(--staff-font, inherit)",
        // 100dvh учитывает адресную строку Safari — иначе нижняя навигация уезжает под бар
        minHeight: "100dvh",
      }}
    >
      <FontApplier />
      {/* Премиум фон — как на главной (hero-grid + золотые blur-свечения) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,215,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 85%)",
        }}
      />
      <div className="fixed -top-32 -left-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none z-0" style={{ background: "rgba(255,215,0,0.07)" }} />
      <div className="fixed -bottom-32 -right-32 w-[420px] h-[420px] rounded-full blur-3xl pointer-events-none z-0" style={{ background: "rgba(255,184,0,0.04)" }} />
      <div className="fixed top-1/3 -right-24 w-[320px] h-[320px] rounded-full blur-3xl pointer-events-none z-0" style={{ background: "rgba(255,215,0,0.04)" }} />

      {/* На мобильных отключаем тяжёлые GPU-эффекты ради скорости */}
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
      {/* Системный баннер офлайн (постоянный, пока нет сети) */}
      <OfflineBanner />
      {/* Праздничный баннер (показывается за N дней до и после праздника) */}
      <HolidayBanner className="z-20" />
      {/* Угловое праздничное украшение (Георгиевская лента 9 мая, снежинки на НГ и т.д.) */}
      <HolidayCornerDecor />
      {/* Баннер темы */}
      <ThemeBanner onOpen={() => setThemeOpen(true)} />
      {/* Шапка — премиальная как на главной */}
      <div className="relative shrink-0 safe-top z-10">
        {/* Градиент-фон шапки */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.8) 100%)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(255,215,0,0.05) 0%, transparent 30%, transparent 70%, rgba(255,215,0,0.05) 100%)" }}
        />
        {/* Угловые blur-свечения */}
        <div className="absolute -top-12 left-8 w-44 h-44 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.08)" }} />
        <div className="absolute -bottom-12 right-8 w-44 h-44 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.05)" }} />

        <div className={`relative flex items-center justify-between gap-2 ${isMobile ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
          {/* Аватар + имя — премиум-медальон как лого на главной */}
          <SLTooltip as="flex" content={<><b>{myName || empName}</b><br/>{ROLE_LABEL[empRole] || empRole} · нажми, чтобы открыть профиль</>} placement="bottom">
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left active:scale-95 transition group">
            <div className="relative shrink-0">
              {/* Премиум-кольцо: conic-gradient как лого на главной */}
              <div className="relative w-10 h-10 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_14px_rgba(255,215,0,0.3)]">
                {myAvatar ? (
                  <img src={myAvatar} alt="ava" className="w-full h-full rounded-full object-cover bg-black" />
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center font-oswald font-bold text-sm ${
                    empRole === "owner" ? "bg-gradient-to-br from-[#FFD700] to-[#b8860b] text-black" :
                    empRole === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white" :
                    "bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] text-white/80"
                  }`}>
                    {initials}
                  </div>
                )}
              </div>
              {/* Зелёная точка статуса */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#0D0D0D] rounded-full shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
            </div>
            <div className="min-w-0">
              <div className="font-oswald font-bold uppercase text-sm truncate leading-tight bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
                {myName || empName}
              </div>
              <span className={`font-roboto text-[9px] px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1 mt-0.5 ${ROLE_BADGE[empRole] || "bg-white/10 text-white/50"}`}>
                {empRole === "owner" && <span>👑</span>}
                {ROLE_LABEL[empRole] || empRole}
              </span>
            </div>
          </button>
          </SLTooltip>

          <div className={isMobile ? "hidden" : "block"}>
            <MskClock />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isOwnerOrAdmin && !isMobile && (
              <button
                onClick={sendReminderNow}
                disabled={sending}
                title="Отправить напоминание @PluXan сейчас"
                className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-roboto font-bold uppercase tracking-wide rounded-sm transition-all active:scale-95 ${
                  sendResult === true ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/40" :
                  sendResult === false ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40" :
                  "bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20 ring-1 ring-[#FFD700]/20"
                } ${sending ? "opacity-60 cursor-wait" : ""}`}
              >
                <Icon name={sending ? "Loader" : sendResult === true ? "Check" : "Bell"} size={12} className={sending ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{sending ? "..." : sendResult === true ? "OK" : sendResult === false ? "Ошибка" : "Напом."}</span>
              </button>
            )}
            <InstallPwaButton />
            <HolidayShowAgainButton />
            <SLTooltip content={<><b>Мой профиль</b><br/>Изменить аватар, имя, пин-код</>} placement="bottom">
              <button onClick={() => setProfileOpen(true)}
                className="text-white/40 hover:text-[#FFD700] active:text-[#FFD700] transition-all p-2 rounded-md hover:bg-[#FFD700]/10 hover:shadow-[0_0_10px_rgba(255,215,0,0.15)]">
                <Icon name="UserCog" size={16} />
              </button>
            </SLTooltip>
            <SLTooltip content={<><b>Оформление</b><br/>Выбрать тему, цвета, эффекты курсора</>} placement="bottom">
              <button onClick={() => setThemeOpen(true)}
                className="text-white/40 hover:text-[#FFD700] active:text-[#FFD700] transition-all p-2 rounded-md hover:bg-[#FFD700]/10 hover:shadow-[0_0_10px_rgba(255,215,0,0.15)]">
                <Icon name="Sparkles" size={16} />
              </button>
            </SLTooltip>
            <SLTooltip content={<><b>Выйти</b><br/>Завершить сессию</>} placement="bottom">
              <button onClick={logout}
                className="text-white/40 hover:text-red-400 active:text-red-500 transition-all p-2 rounded-md hover:bg-red-500/10 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <Icon name="LogOut" size={16} />
              </button>
            </SLTooltip>
          </div>
        </div>
        {/* Золотая нижняя линия с shimmer — как на главной */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.45),transparent)] pointer-events-none" />
      </div>

      {/* Контент — растягивается, с паддингом под нижнюю панель.
          Запас 24px нужен для Safari/Chrome на iOS: их адресная строка
          может перекрывать кнопки, если контент скроллится в самый низ. */}
      <div
        className="flex-1 overflow-y-auto relative z-10"
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 32px)' }}
      >
        <StaffSectionBanner tab={tab} />
        <TabErrorBoundary key={tab}>
          <React.Suspense fallback={<div className="flex items-center justify-center py-16 text-white/20 font-roboto text-sm"><Icon name="Loader" size={16} className="animate-spin mr-2" />Загружаю...</div>}>
            {tab === "repair"    && <StaffRepairTab token={token} isOwner={empRole === "owner"} />}
            {tab === "goods"     && <GoodsTab token={token} />}
            {tab === "sales"     && <SalesTab token={token} />}
            {tab === "clients"   && <ClientsTab token={token} />}
            {tab === "analytics" && <AnalyticsTab token={token} />}
            {tab === "gold"      && isOwnerOrAdmin && <GoldTab token={token} />}
            {tab === "employees" && isOwnerOrAdmin && <EmployeesTab token={token} myRole={empRole} />}
            {tab === "smartlombard" && <SmartLombardTab token={token} myRole={empRole} />}
            {tab === "avitopro"  && <AvitoProTab token={token} />}
            {tab === "chat"      && <VipChatTab token={token} onUnread={setChatUnread} />}
          </React.Suspense>
        </TabErrorBoundary>
      </div>

      {/* Нижняя навигация — premium glassmorphism как на главной */}
      <nav className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Glow сверху */}
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-black/95 to-transparent pointer-events-none" />
        {/* Золотая shimmer-линия сверху */}
        <div className="absolute top-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,215,0,0.45),transparent)] pointer-events-none z-10" />
        <div className="relative bg-[#0D0D0D]/92 backdrop-blur-xl border-t border-[#FFD700]/15">
          {/* Угловые золотые свечения */}
          <div className="absolute -top-8 left-1/4 w-40 h-16 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.06)" }} />
          <div className="absolute -top-8 right-1/4 w-40 h-16 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.05)" }} />
          <div className="relative flex overflow-x-auto no-scrollbar">
            {TABS.map(t => {
              const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
              const active = tab === t.k;
              return (
                <SLTooltip
                  key={t.k}
                  placement="top"
                  delay={400}
                  as="flex"
                  content={
                    <>
                      <b className="text-[#FFD700]">{t.l}</b>
                      {t.tip && <><br/>{t.tip}</>}
                      {locked && <><br/><span className="text-red-300">🔒 Требуется пароль владельца</span></>}
                    </>
                  }
                >
                <button
                  onClick={() => requestTab(t.k as Tab)}
                  onMouseEnter={() => prefetchTab(t.k)}
                  onTouchStart={() => prefetchTab(t.k)}
                  aria-label={t.l}
                  aria-current={active ? "page" : undefined}
                  className={`w-full min-w-[56px] flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 min-h-[56px] transition-all duration-300 active:scale-95 relative group ${
                    active ? "text-[#FFD700]" : "text-white/45 hover:text-white/85"
                  }`}
                >
                  {/* Активная подсветка — премиум */}
                  {active && <>
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-b-full shadow-[0_0_10px_rgba(255,215,0,0.6)]" />
                    <span className="absolute inset-x-2 top-1.5 bottom-1.5 bg-gradient-to-b from-[#FFD700]/14 via-[#FFD700]/4 to-transparent rounded-xl -z-10 shadow-[inset_0_1px_0_rgba(255,215,0,0.15)]" />
                  </>}

                  <div className={`relative transition-transform duration-300 ${active ? "scale-110 drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" : "group-active:scale-90"}`}>
                    <Icon name={t.icon} size={18} />
                    {locked && (
                      <span className="absolute -top-1.5 -right-2 text-[9px] bg-[#0A0A0A] rounded-full px-0.5">🔒</span>
                    )}
                    {("badge" in t) && typeof t.badge === "number" && t.badge > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                        {t.badge > 99 ? "99+" : t.badge}
                      </span>
                    )}
                  </div>
                  <span className={`font-roboto text-[9px] leading-none tracking-tight ${active ? "font-bold" : ""}`}>
                    {t.l}
                  </span>
                </button>
                </SLTooltip>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Глобальный watcher горящих заявок: всплывающие toast'ы + плавающая кнопка */}
      <LeadsAlertWatcher token={token} empName={empName} />

      {/* Модалка пароля для сотрудников */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPwModal(null)}>
          <div onClick={e => e.stopPropagation()}
            className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-[#FFD700]/30 w-full max-w-sm p-6 rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(255,215,0,0.15)] overflow-hidden">
            {/* Угловые свечения */}
            <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,215,0,0.1)" }} />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(255,184,0,0.06)" }} />
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent" />
            <div className="relative z-10 flex items-center gap-3 mb-4">
              {/* Премиум-медальон с conic-gradient */}
              <div className="relative w-11 h-11 rounded-full p-[1.5px] bg-[conic-gradient(from_0deg,#b8860b,#ffd700,#fff3a0,#ffd700,#b8860b)] shadow-[0_0_18px_rgba(255,215,0,0.35)] shrink-0">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#FFD700]/20 to-black flex items-center justify-center">
                  <Icon name="Lock" size={16} className="text-[#FFD700]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold uppercase text-base leading-tight bg-gradient-to-r from-[#FFD700] via-[#fff3a0] to-[#FFD700] bg-clip-text text-transparent animate-shimmer">
                  {pwModal === "gold" ? "Доступ к золоту" : pwModal === "employees" ? "Доступ к команде" : "Доступ к статистике"}
                </div>
                <div className="font-roboto text-white/45 text-[11px] mt-0.5">Требуется пароль владельца</div>
              </div>
              <button onClick={() => setPwModal(null)} className="text-white/30 hover:text-white transition-colors -mr-1">
                <Icon name="X" size={18} />
              </button>
            </div>
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(""); }}
              onKeyDown={e => { if (e.key === "Enter") submitPw(); if (e.key === "Escape") setPwModal(null); }}
              placeholder="••••••••"
              className={`relative z-10 w-full bg-[#0A0A0A] border-2 text-white px-4 py-3.5 font-roboto text-base focus:outline-none transition-all mb-3 rounded-md tracking-widest ${
                pwError ? "border-red-500/50 focus:border-red-400" : "border-[#333] focus:border-[#FFD700]"
              }`}
            />
            {pwError && (
              <div className="relative z-10 text-red-400 font-roboto text-xs mb-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-2 rounded">
                <Icon name="AlertCircle" size={12} />{pwError}
              </div>
            )}
            <div className="relative z-10 flex gap-2">
              <button onClick={() => setPwModal(null)}
                className="flex-1 border border-[#333] text-white/60 font-roboto text-sm py-3 rounded-md hover:text-white hover:border-white/20 transition-colors">
                Отмена
              </button>
              <button onClick={submitPw}
                className="flex-1 btn-gold-premium py-3 text-sm">
                Войти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffMainLayout;