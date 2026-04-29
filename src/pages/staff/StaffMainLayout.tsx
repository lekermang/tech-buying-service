import React from "react";
import Icon from "@/components/ui/icon";
import BackgroundFx from "../staffTheme/BackgroundFx";
import CursorEffects from "../staffTheme/CursorEffects";
import AnimeMascot from "../staffTheme/AnimeMascot";
import StaffThemeSettings from "../staffTheme/StaffThemeSettings";
import InstallPwaButton from "./InstallPwaButton";
import { OfflineBanner } from "./StaffStatusBanners";
import { PROTECTED_TABS, ROLE_BADGE, ROLE_LABEL, getInitials, type StaffTab } from "./staffConstants";
import { FontApplier, MskClock, ThemeBanner, TabErrorBoundary } from "./StaffPwa";
import {
  GoodsTab, StaffRepairTab, GoldTab, SalesTab, ClientsTab, AnalyticsTab,
  EmployeesTab, VipChatTab, SmartLombardTab, prefetchTab,
} from "./StaffLazy";

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
  const requestTab = (t: Tab) => {
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if ((PROTECTED_TABS as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const TABS: { k: Tab; l: string; icon: string; badge?: number }[] = [
    { k: "repair",       l: "Ремонт",       icon: "Wrench" },
    { k: "chat",         l: "Чат",          icon: "MessageCircle", badge: chatUnread },
    { k: "clients",      l: "Клиенты",      icon: "Users" },
    { k: "analytics",    l: "Статистика",   icon: "BarChart2" },
    ...(isOwnerOrAdmin ? [{ k: "smartlombard" as Tab, l: "СмартЛомбард", icon: "Coins" }] : []),
    ...(isOwnerOrAdmin ? [{ k: "gold" as Tab, l: "Золото", icon: "Gem" }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees" as Tab, l: "Команда", icon: "UserCog" }] : []),
  ];

  const initials = getInitials(empName);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative" style={{ fontFamily: "var(--staff-font, inherit)" }}>
      <FontApplier />
      <BackgroundFx />
      <CursorEffects />
      <AnimeMascot onOpenSettings={() => setThemeOpen(true)} />
      {themeOpen && <StaffThemeSettings onClose={() => setThemeOpen(false)} />}
      {/* Системный баннер офлайн (постоянный, пока нет сети) */}
      <OfflineBanner />
      {/* Баннер темы */}
      <ThemeBanner onOpen={() => setThemeOpen(true)} />
      {/* Шапка — премиальная с градиентом */}
      <div className="relative shrink-0 safe-top border-b border-[#222]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-blue-500/[0.03] pointer-events-none" />
        <div className="relative px-3 py-2.5 flex items-center justify-between gap-2">
          {/* Аватар + имя */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-oswald font-bold text-sm ${
                empRole === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black" :
                empRole === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white" :
                "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70 border border-white/10"
              }`}>
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-[#0A0A0A] rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="font-oswald font-bold uppercase text-sm truncate leading-tight">{empName}</div>
              <span className={`font-roboto text-[9px] px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1 mt-0.5 ${ROLE_BADGE[empRole] || "bg-white/10 text-white/50"}`}>
                {empRole === "owner" && <span>👑</span>}
                {ROLE_LABEL[empRole] || empRole}
              </span>
            </div>
          </div>

          <MskClock />

          <div className="flex items-center gap-1 shrink-0">
            {isOwnerOrAdmin && (
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
            <button onClick={() => setThemeOpen(true)} title="Моя тема"
              className="text-white/30 hover:text-[#FFD700] active:text-[#FFD700] transition-colors p-2 rounded-sm hover:bg-[#FFD700]/10">
              <Icon name="Sparkles" size={16} />
            </button>
            <button onClick={logout} title="Выйти"
              className="text-white/30 hover:text-red-400 active:text-red-500 transition-colors p-2 rounded-sm hover:bg-red-500/10">
              <Icon name="LogOut" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Контент — растягивается, с паддингом под нижнюю панель */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(62px + env(safe-area-inset-bottom, 16px))' }}>
        <TabErrorBoundary key={tab}>
          <React.Suspense fallback={<div className="flex items-center justify-center py-16 text-white/20 font-roboto text-sm"><Icon name="Loader" size={16} className="animate-spin mr-2" />Загружаю...</div>}>
            {tab === "repair"    && <StaffRepairTab token={token} isOwner={empRole === "owner"} />}
            {tab === "goods"     && <GoodsTab token={token} />}
            {tab === "sales"     && <SalesTab token={token} />}
            {tab === "clients"   && <ClientsTab token={token} />}
            {tab === "analytics" && <AnalyticsTab token={token} />}
            {tab === "gold"      && isOwnerOrAdmin && <GoldTab token={token} />}
            {tab === "employees" && isOwnerOrAdmin && <EmployeesTab token={token} myRole={empRole} />}
            {tab === "smartlombard" && isOwnerOrAdmin && <SmartLombardTab token={token} myRole={empRole} />}
            {tab === "chat"      && <VipChatTab token={token} onUnread={setChatUnread} />}
          </React.Suspense>
        </TabErrorBoundary>
      </div>

      {/* Нижняя навигация — premium glassmorphism */}
      <nav className="fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Glow сверху */}
        <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        <div className="relative bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/[0.06]">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map(t => {
              const locked = !isOwner && !unlocked[t.k] && (PROTECTED_TABS as readonly string[]).includes(t.k);
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => requestTab(t.k as Tab)}
                  onMouseEnter={() => prefetchTab(t.k)}
                  onTouchStart={() => prefetchTab(t.k)}
                  aria-label={t.l}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 min-w-[64px] flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 min-h-[58px] transition-all duration-300 active:scale-95 relative group ${
                    active ? "text-[#FFD700]" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {/* Активная подсветка */}
                  {active && <>
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent rounded-b-full" />
                    <span className="absolute inset-x-3 top-2 bottom-2 bg-gradient-to-b from-[#FFD700]/10 to-transparent rounded-xl -z-10" />
                  </>}

                  <div className={`relative transition-transform duration-300 ${active ? "scale-110" : "group-active:scale-90"}`}>
                    <Icon name={t.icon} size={20} />
                    {locked && (
                      <span className="absolute -top-1.5 -right-2 text-[9px] bg-[#0A0A0A] rounded-full px-0.5">🔒</span>
                    )}
                    {("badge" in t) && typeof t.badge === "number" && t.badge > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {t.badge > 99 ? "99+" : t.badge}
                      </span>
                    )}
                  </div>
                  <span className={`font-roboto text-[10px] tracking-tight ${active ? "font-bold" : ""}`}>
                    {t.l}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Модалка пароля для сотрудников */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPwModal(null)}>
          <div onClick={e => e.stopPropagation()}
            className="relative bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-[#FFD700]/30 w-full max-w-sm p-6 rounded-lg shadow-2xl shadow-[#FFD700]/10">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#FFD700]/50 to-transparent" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/40 flex items-center justify-center shrink-0">
                <Icon name="Lock" size={18} className="text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-oswald font-bold text-white uppercase text-base leading-tight">
                  {pwModal === "gold" ? "Доступ к золоту" : pwModal === "employees" ? "Доступ к команде" : "Доступ к статистике"}
                </div>
                <div className="font-roboto text-white/40 text-[11px] mt-0.5">Требуется пароль владельца</div>
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
              className={`w-full bg-[#0A0A0A] border-2 text-white px-4 py-3.5 font-roboto text-base focus:outline-none transition-all mb-3 rounded-md tracking-widest ${
                pwError ? "border-red-500/50 focus:border-red-400" : "border-[#333] focus:border-[#FFD700]"
              }`}
            />
            {pwError && (
              <div className="text-red-400 font-roboto text-xs mb-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-2 rounded">
                <Icon name="AlertCircle" size={12} />{pwError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setPwModal(null)}
                className="flex-1 border border-[#333] text-white/60 font-roboto text-sm py-3 rounded-md hover:text-white hover:border-white/20 transition-colors">
                Отмена
              </button>
              <button onClick={submitPw}
                className="flex-1 bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black font-oswald font-bold uppercase text-sm py-3 rounded-md hover:shadow-lg hover:shadow-[#FFD700]/30 active:scale-95 transition-all">
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
