import React, { useState, useEffect, Component, type ReactNode, lazy } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import { StaffThemeProvider, useStaffTheme } from "./staffTheme/StaffThemeContext";
import AnimeMascot from "./staffTheme/AnimeMascot";
import CursorEffects from "./staffTheme/CursorEffects";
import BackgroundFx from "./staffTheme/BackgroundFx";
import StaffThemeSettings from "./staffTheme/StaffThemeSettings";

const GoodsTab      = lazy(() => import("./StaffGoodsTab"));
const StaffRepairTab = lazy(() => import("./StaffRepairTab"));
const GoldTab       = lazy(() => import("./GoldTab"));
const SalesTab      = lazy(() => import("./StaffOtherTabs").then(m => ({ default: m.SalesTab })));
const ClientsTab    = lazy(() => import("./StaffOtherTabs").then(m => ({ default: m.ClientsTab })));
const AnalyticsTab  = lazy(() => import("./StaffOtherTabs").then(m => ({ default: m.AnalyticsTab })));
const EmployeesTab  = lazy(() => import("./StaffOtherTabs").then(m => ({ default: m.EmployeesTab })));
const VipChatTab    = lazy(() => import("./StaffVipChatTab"));
const SmartLombardTab = lazy(() => import("./smartlombard/SmartLombardTab"));

class TabErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error) { console.error("[TabError]", e); }
  render() {
    if (this.state.error) return (
      <div className="p-6 text-center">
        <div className="text-red-400 font-roboto text-sm mb-3">Ошибка загрузки раздела</div>
        <div className="text-white/30 font-roboto text-xs mb-4">{this.state.error}</div>
        <button onClick={() => this.setState({ error: null })}
          className="bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 text-sm uppercase">
          Обновить
        </button>
      </div>
    );
    return this.props.children;
  }
}

const PRICE_SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

type Tab = "goods" | "sales" | "clients" | "analytics" | "employees" | "repair" | "chat" | "smartlombard";

function MskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
  const hh = msk.getHours().toString().padStart(2, "0");
  const mm = msk.getMinutes().toString().padStart(2, "0");
  const ss = msk.getSeconds().toString().padStart(2, "0");
  const date = msk.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", weekday: "short" });
  return (
    <div className="text-center leading-tight">
      <div className="font-oswald font-bold text-[#FFD700] text-base tracking-wider tabular-nums flex items-baseline justify-center gap-0.5">
        <span>{hh}</span>
        <span className="animate-pulse opacity-70">:</span>
        <span>{mm}</span>
        <span className="text-[#FFD700]/40 text-xs ml-0.5 tabular-nums">{ss}</span>
      </div>
      <div className="font-roboto text-white/40 text-[9px] uppercase tracking-wide">{date} · МСК</div>
    </div>
  );
}

export default function Staff() {
  const [tokenBoot] = useState(() => localStorage.getItem("employee_token") || "");
  return (
    <StaffThemeProvider token={tokenBoot}>
      <StaffInner />
    </StaffThemeProvider>
  );
}

function FontApplier() {
  const { theme } = useStaffTheme();
  useEffect(() => {
    const root = document.documentElement;
    if (!theme.enabled) { root.style.removeProperty("--staff-font"); return; }
    const map: Record<string, string> = {
      roboto: "'Roboto', sans-serif",
      oswald: "'Oswald', sans-serif",
      inter: "'Inter', sans-serif",
      mplus: "'M PLUS Rounded 1c', sans-serif",
    };
    root.style.setProperty("--staff-font", map[theme.font_family] || map.roboto);
  }, [theme.enabled, theme.font_family]);
  return null;
}

function ThemeBanner({ onOpen }: { onOpen: () => void }) {
  const { theme, saved } = useStaffTheme();
  if (saved) {
    return (
      <div className="w-full py-1.5 px-3 text-center text-[11px] font-roboto font-bold"
        style={{ background: theme.accent_color + "22", color: theme.accent_color }}>
        ✓ Настройки темы сохранены
      </div>
    );
  }
  return (
    <button onClick={onOpen}
      className="w-full py-1.5 px-3 flex items-center justify-center gap-2 text-[11px] font-roboto transition-colors hover:bg-white/5"
      style={{ background: theme.accent_color + "11", color: theme.accent_color }}>
      <span>✨</span>
      <span className="font-bold">Моя аниме-тема</span>
      <span className="opacity-70 hidden sm:inline">— настроить персонажа и эффекты</span>
    </button>
  );
}

function StaffInner() {
  const [token, setToken] = useState(() => localStorage.getItem("employee_token") || "");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [empName, setEmpName] = useState(() => localStorage.getItem("employee_name") || "");
  const [empRole, setEmpRole] = useState(() => localStorage.getItem("employee_role") || "");
  const [tab, setTab] = useState<Tab>("repair");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | boolean>(null);
  const [pwModal, setPwModal] = useState<null | Tab>(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [themeOpen, setThemeOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetch(EMPLOYEE_AUTH_URL, { headers: { "X-Employee-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (d.id) { setAuthed(true); setEmpName(d.full_name); setEmpRole(d.role); }
        else { localStorage.removeItem("employee_token"); setToken(""); }
      })
      .catch(() => {});
  }, [token]);

  // Фоновый polling счётчика непрочитанных в чате (каждые 15 сек, когда чат не открыт)
  useEffect(() => {
    if (!authed || !token || tab === "chat") return;
    const VIP_URL = "https://functions.poehali.dev/f4a88e67-03e7-4387-a091-32588d90df73";
    const fetchUnread = () => {
      fetch(VIP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "poll", after_id: -1, limit: 1 }),
      })
        .then(r => r.json())
        .then(d => { if (typeof d.unread === "number") setChatUnread(d.unread); })
        .catch(() => {});
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 15000);
    return () => clearInterval(t);
  }, [authed, token, tab]);

  const [loginLoading, setLoginLoading] = useState(false);

  const login = async () => {
    if (!loginForm.login || !loginForm.password) { setLoginError("Введите логин и пароль"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", ...loginForm }) });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("employee_token", data.token);
        localStorage.setItem("employee_name", data.full_name);
        localStorage.setItem("employee_role", data.role);
        setToken(data.token); setEmpName(data.full_name); setEmpRole(data.role); setAuthed(true);
      } else setLoginError(data.error || "Неверный логин или пароль");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[login error]', msg, err);
      setLoginError(`Ошибка: ${msg}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("employee_token"); localStorage.removeItem("employee_name"); localStorage.removeItem("employee_role");
    setToken(""); setAuthed(false); setEmpName(""); setEmpRole("");
  };

  if (!authed) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 safe-area-inset relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-blue-500/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-yellow-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
              <Icon name="Wrench" size={22} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wider text-lg">Скупка24</div>
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Панель сотрудника</div>
            </div>
          </div>
          <a href="/" title="На главную"
            className="text-white/30 hover:text-white hover:bg-white/5 transition-all p-2.5 rounded-md">
            <Icon name="ArrowLeft" size={18} />
          </a>
        </div>

        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 space-y-3.5 mb-4 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
              <Icon name="Lock" size={14} className="text-[#FFD700]" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase text-sm">Вход для сотрудников</div>
              <div className="font-roboto text-white/40 text-[10px]">Введите логин и пароль</div>
            </div>
          </div>
          {[
            { key: "login", label: "Логин", placeholder: "admin", type: "text", icon: "User" },
            { key: "password", label: "Пароль", placeholder: "••••••••", type: "password", icon: "Key" },
          ].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">{f.label}</label>
              <div className="relative">
                <Icon name={f.icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type={f.type} value={(loginForm as Record<string, string>)[f.key]}
                  onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && login()}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-roboto text-base rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
              </div>
            </div>
          ))}
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
              <Icon name="AlertCircle" size={12} />{loginError}
            </div>
          )}
          <button onClick={login} disabled={loginLoading}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3.5 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loginLoading ? <><Icon name="Loader" size={16} className="animate-spin" /> Вход...</> : <><Icon name="LogIn" size={16} />Войти</>}
          </button>
        </div>

        <a href="/cabinet"
          className="flex items-center justify-center gap-2 w-full border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#FFD700]/30 hover:bg-[#141414] active:scale-95 font-roboto text-sm py-3.5 rounded-md transition-all">
          <Icon name="UserPlus" size={16} />
          Зарегистрироваться как клиент
        </a>
      </div>
    </div>
  );

  const isOwnerOrAdmin = empRole === "owner" || empRole === "admin";
  const isOwner = empRole === "owner";
  const SECRET_PW = "Mark2015N";

  const requestTab = (t: Tab) => {
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if (t === "gold" || t === "analytics" || t === "employees") {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const submitPw = () => {
    if (pwInput === SECRET_PW && pwModal) {
      setUnlocked(u => ({ ...u, [pwModal]: true }));
      setTab(pwModal);
      setPwModal(null); setPwInput(""); setPwError("");
    } else {
      setPwError("Неверный пароль");
    }
  };

  const sendReminderNow = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${PRICE_SCHEDULER_URL}?action=send_morning_reminder_now`);
      const data = await res.json();
      setSendResult(data.sent === true);
    } catch {
      setSendResult(false);
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 4000);
    }
  };

  const TABS = [
    { k: "repair",    l: "Ремонт",    icon: "Wrench" },
    { k: "chat",      l: "Чат",       icon: "MessageCircle", badge: chatUnread },
    { k: "clients",   l: "Клиенты",   icon: "Users" },
    { k: "analytics", l: "Статистика",icon: "BarChart2" },
    { k: "smartlombard", l: "SmartLombard", icon: "Gem" },
    ...(isOwnerOrAdmin ? [{ k: "gold", l: "Золото", icon: "Coins" }] : []),
    ...(isOwnerOrAdmin ? [{ k: "employees", l: "Команда", icon: "UserCog" }] : []),
  ];

  const ROLE_BADGE: Record<string, string> = {
    owner: "bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black shadow-lg shadow-[#FFD700]/20",
    admin: "bg-gradient-to-r from-blue-500/30 to-blue-600/20 text-blue-300 border border-blue-400/30",
    staff: "bg-white/10 text-white/60 border border-white/10",
  };
  const ROLE_LABEL: Record<string, string> = { owner: "Владелец", admin: "Админ", staff: "Сотрудник" };
  const initials = empName.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col relative" style={{ fontFamily: "var(--staff-font, inherit)" }}>
      <FontApplier />
      <BackgroundFx />
      <CursorEffects />
      <AnimeMascot onOpenSettings={() => setThemeOpen(true)} />
      {themeOpen && <StaffThemeSettings onClose={() => setThemeOpen(false)} />}
      {/* Баннер темы — самый верх */}
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
            {tab === "chat"      && <VipChatTab token={token} onUnread={setChatUnread} />}
            {tab === "smartlombard" && <SmartLombardTab token={token} myRole={empRole} />}
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
              const locked = !isOwner && !unlocked[t.k] && (t.k === "gold" || t.k === "analytics" || t.k === "employees");
              const active = tab === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => requestTab(t.k as Tab)}
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
                  <span className={`font-roboto text-[9px] leading-none tracking-wide transition-all ${active ? "font-bold" : "font-normal"}`}>
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