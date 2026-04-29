import React, { useState, useEffect, useCallback, Component, type ReactNode, lazy } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import { StaffThemeProvider, useStaffTheme } from "./staffTheme/StaffThemeContext";
import AnimeMascot from "./staffTheme/AnimeMascot";
import CursorEffects from "./staffTheme/CursorEffects";
import BackgroundFx from "./staffTheme/BackgroundFx";
import StaffThemeSettings from "./staffTheme/StaffThemeSettings";
import InstallPwaButton from "./staff/InstallPwaButton";
import {
  PRICE_SCHEDULER_URL,
  VIP_CHAT_URL,
  SECRET_PW,
  PROTECTED_TABS,
  ROLE_BADGE,
  ROLE_LABEL,
  getInitials,
  readSavedTab,
  saveTab,
  type StaffTab,
} from "./staff/staffConstants";
import { OfflineBanner } from "./staff/StaffStatusBanners";
import { StaffToastProvider, useStaffToast } from "./staff/StaffToast";

// Ленивые модули + прелоадеры (для предзагрузки по hover/touchstart)
const loadGoods         = () => import("./StaffGoodsTab");
const loadRepair        = () => import("./StaffRepairTab");
const loadGold          = () => import("./GoldTab");
const loadOtherTabs     = () => import("./StaffOtherTabs");
const loadVipChat       = () => import("./StaffVipChatTab");
const loadSmartLombard  = () => import("./smartlombard/SmartLombardTab");

const GoodsTab        = lazy(loadGoods);
const StaffRepairTab  = lazy(loadRepair);
const GoldTab         = lazy(loadGold);
const SalesTab        = lazy(() => loadOtherTabs().then(m => ({ default: m.SalesTab })));
const ClientsTab      = lazy(() => loadOtherTabs().then(m => ({ default: m.ClientsTab })));
const AnalyticsTab    = lazy(() => loadOtherTabs().then(m => ({ default: m.AnalyticsTab })));
const EmployeesTab    = lazy(() => loadOtherTabs().then(m => ({ default: m.EmployeesTab })));
const VipChatTab      = lazy(loadVipChat);
const SmartLombardTab = lazy(loadSmartLombard);

const TAB_PRELOADERS: Record<string, () => Promise<unknown>> = {
  goods: loadGoods,
  repair: loadRepair,
  gold: loadGold,
  sales: loadOtherTabs,
  clients: loadOtherTabs,
  analytics: loadOtherTabs,
  employees: loadOtherTabs,
  chat: loadVipChat,
  smartlombard: loadSmartLombard,
};

function prefetchTab(t: string): void {
  const fn = TAB_PRELOADERS[t];
  if (fn) fn().catch(() => {});
}

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

type Tab = StaffTab;

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

function useStaffPwa() {
  useEffect(() => {
    // Динамически подменяем manifest на /staff
    const head = document.head;
    const prev = head.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const prevHref = prev?.href || "";
    const link = prev || document.createElement("link");
    link.rel = "manifest";
    link.href = "/staff-manifest.json";
    if (!prev) head.appendChild(link);

    // theme-color для статус-бара
    let themeMeta = head.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const prevTheme = themeMeta?.content || "";
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      head.appendChild(themeMeta);
    }
    themeMeta.content = "#0A0A0A";

    // Apple title для иконки на рабочем столе
    let appleTitle = head.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    const prevTitle = appleTitle?.content || "";
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      head.appendChild(appleTitle);
    }
    appleTitle.content = "Скупка24";

    // Регистрация лёгкого SW для /staff PWA (offline старт)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/staff-sw.js", { scope: "/staff" }).catch(() => {});
    }

    return () => {
      // Возвращаем как было, чтобы не ломать другие страницы при SPA-навигации
      if (prev && prevHref) prev.href = prevHref;
      if (themeMeta && prevTheme) themeMeta.content = prevTheme;
      if (appleTitle && prevTitle) appleTitle.content = prevTitle;
    };
  }, []);
}

export default function Staff() {
  const [tokenBoot] = useState(() => localStorage.getItem("employee_token") || "");
  useStaffPwa();
  return (
    <StaffThemeProvider token={tokenBoot}>
      <StaffToastProvider>
        <StaffInner />
      </StaffToastProvider>
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
  const toast = useStaffToast();
  const [token, setToken] = useState(() => localStorage.getItem("employee_token") || "");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [pinStage, setPinStage] = useState<null | { ticket: string; pin_set: boolean; role: string; full_name: string }>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [empName, setEmpName] = useState(() => localStorage.getItem("employee_name") || "");
  const [empRole, setEmpRole] = useState(() => localStorage.getItem("employee_role") || "");
  const [tab, setTabRaw] = useState<Tab>(() => readSavedTab("repair"));
  const setTab = useCallback((t: Tab) => { setTabRaw(t); saveTab(t); }, []);
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
    const ctrl = new AbortController();
    fetch(EMPLOYEE_AUTH_URL, { headers: { "X-Employee-Token": token }, signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        if (d.id) { setAuthed(true); setEmpName(d.full_name); setEmpRole(d.role); }
        else { localStorage.removeItem("employee_token"); setToken(""); }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [token]);

  // Тост при появлении новой версии PWA
  useEffect(() => {
    if (!authed || !("serviceWorker" in navigator)) return;
    let shown = false;
    const showOnce = (sw: ServiceWorker) => {
      if (shown) return;
      shown = true;
      toast.info("Доступна новая версия приложения", {
        title: "Обновление",
        duration: 0,
        action: {
          label: "Обновить",
          onClick: () => {
            sw.postMessage({ type: "SKIP_WAITING" });
            setTimeout(() => window.location.reload(), 300);
          },
        },
      });
    };
    navigator.serviceWorker.getRegistration("/staff").then((reg) => {
      if (!reg) return;
      if (reg.waiting) showOnce(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) showOnce(sw);
        });
      });
    });
  }, [authed, toast]);

  // Тосты при потере/восстановлении сети
  useEffect(() => {
    if (!authed) return;
    const onOnline = () => toast.success("Связь восстановлена");
    const onOffline = () => toast.warning("Нет интернета — работаем в офлайне", { duration: 4000 });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [authed, toast]);

  // Прогрев соседних чанков после авторизации
  useEffect(() => {
    if (!authed) return;
    prefetchTab(tab);
    if (tab !== "chat") prefetchTab("chat");
    if (tab !== "repair") prefetchTab("repair");
  }, [authed, tab]);

  // Хоткеи 1–7 на десктопе
  useEffect(() => {
    if (!authed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const isOwnerOrAdminLocal = empRole === "owner" || empRole === "admin";
      const order: Tab[] = [
        "repair", "chat", "clients", "analytics", "smartlombard",
        ...(isOwnerOrAdminLocal ? (["gold", "employees"] as Tab[]) : []),
      ];
      const n = parseInt(e.key, 10);
      if (!Number.isFinite(n) || n < 1 || n > order.length) return;
      const next = order[n - 1];
      const isOwnerLocal = empRole === "owner";
      if (next && (isOwnerLocal || unlocked[next] || !(PROTECTED_TABS as readonly string[]).includes(next))) {
        setTab(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [authed, empRole, unlocked, setTab]);

  // Фоновый polling счётчика непрочитанных в чате (каждые 15 сек, когда чат не открыт и вкладка видима)
  useEffect(() => {
    if (!authed || !token || tab === "chat") return;
    let cancelled = false;
    const fetchUnread = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch(VIP_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ action: "poll", after_id: -1, limit: 1 }),
      })
        .then(r => r.json())
        .then(d => { if (!cancelled && typeof d.unread === "number") setChatUnread(d.unread); })
        .catch(() => {});
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 15000);
    const onVisible = () => { if (!document.hidden) fetchUnread(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; clearInterval(t); document.removeEventListener("visibilitychange", onVisible); };
  }, [authed, token, tab]);

  const [loginLoading, setLoginLoading] = useState(false);

  const login = async () => {
    if (!loginForm.login || !loginForm.password) { setLoginError("Введите логин и пароль"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", ...loginForm }) });
      const data = await res.json();
      if (data.stage === "pin" && data.pin_ticket) {
        setPinStage({ ticket: data.pin_ticket, pin_set: !!data.pin_set, role: data.role, full_name: data.full_name });
        setPinValue(""); setPinConfirm(""); setPinError("");
      } else if (data.token) {
        // обратная совместимость
        localStorage.setItem("employee_token", data.token);
        localStorage.setItem("employee_name", data.full_name);
        localStorage.setItem("employee_role", data.role);
        setToken(data.token); setEmpName(data.full_name); setEmpRole(data.role); setAuthed(true);
        toast.success(`Добро пожаловать, ${data.full_name || "сотрудник"}!`);
      } else {
        const msg = data.error || "Неверный логин или пароль";
        setLoginError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[login error]', msg, err);
      setLoginError(`Ошибка: ${msg}`);
      toast.error("Не удалось войти. Проверьте интернет.");
    } finally {
      setLoginLoading(false);
    }
  };

  const verifyPin = async () => {
    if (!pinStage) return;
    if (!/^\d{4,8}$/.test(pinValue)) { setPinError("PIN — 4–8 цифр"); return; }
    if (!pinStage.pin_set) {
      if (pinStage.role === "owner" && pinValue !== "231189") {
        setPinError("Неверный PIN владельца"); return;
      }
      if (pinStage.role !== "owner" && pinValue !== pinConfirm) {
        setPinError("PIN-коды не совпадают"); return;
      }
    }
    setPinLoading(true);
    setPinError("");
    try {
      const res = await fetch(EMPLOYEE_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_pin", pin_ticket: pinStage.ticket, pin: pinValue }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("employee_token", data.token);
        localStorage.setItem("employee_name", data.full_name);
        localStorage.setItem("employee_role", data.role);
        setToken(data.token); setEmpName(data.full_name); setEmpRole(data.role); setAuthed(true);
        setPinStage(null); setPinValue(""); setPinConfirm("");
        toast.success(`Вход выполнен. Здравствуйте, ${data.full_name || "сотрудник"}!`);
      } else {
        const msg = data.error || "Неверный PIN";
        setPinError(msg);
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPinError(`Ошибка: ${msg}`);
      toast.error("Сбой проверки PIN");
    } finally {
      setPinLoading(false);
    }
  };

  const cancelPin = () => {
    setPinStage(null); setPinValue(""); setPinConfirm(""); setPinError("");
    setLoginForm({ login: "", password: "" });
  };

  const logout = () => {
    localStorage.removeItem("employee_token"); localStorage.removeItem("employee_name"); localStorage.removeItem("employee_role");
    setToken(""); setAuthed(false); setEmpName(""); setEmpRole("");
    toast.info("Вы вышли из системы");
  };

  if (!authed && pinStage) {
    const isOwnerPin = pinStage.role === "owner";
    const needConfirm = !pinStage.pin_set && !isOwnerPin;
    const title = pinStage.pin_set
      ? "Введите PIN-код"
      : isOwnerPin
        ? "PIN владельца"
        : "Создайте PIN-код";
    const subtitle = pinStage.pin_set
      ? `${pinStage.full_name}`
      : isOwnerPin
        ? "Введите ваш персональный PIN"
        : "Запомните его — будете вводить при каждом входе";
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 safe-area-inset relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-blue-500/[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-yellow-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
              <Icon name="ShieldCheck" size={22} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wider text-lg">{title}</div>
              <div className="font-roboto text-white/40 text-[11px]">{subtitle}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 space-y-3.5 mb-4 shadow-2xl shadow-black/50">
            <div>
              <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">PIN-код</label>
              <div className="relative">
                <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  maxLength={8}
                  value={pinValue}
                  onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && verifyPin()}
                  placeholder="••••"
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-oswald font-bold text-2xl tracking-[0.5em] tabular-nums rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/20 transition-all text-center"
                />
              </div>
            </div>

            {needConfirm && (
              <div>
                <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">Повторите PIN</label>
                <div className="relative">
                  <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && verifyPin()}
                    placeholder="••••"
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-oswald font-bold text-2xl tracking-[0.5em] tabular-nums rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/20 transition-all text-center"
                  />
                </div>
              </div>
            )}

            {pinError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
                <Icon name="AlertCircle" size={12} />{pinError}
              </div>
            )}

            <button onClick={verifyPin} disabled={pinLoading}
              className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3.5 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {pinLoading
                ? <><Icon name="Loader" size={16} className="animate-spin" /> Проверяю...</>
                : <><Icon name="ShieldCheck" size={16} />{pinStage.pin_set ? "Войти" : "Сохранить и войти"}</>}
            </button>

            <button onClick={cancelPin}
              className="w-full text-white/40 hover:text-white font-roboto text-xs py-2 flex items-center justify-center gap-1.5">
              <Icon name="ArrowLeft" size={12} /> Назад к логину
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          className="flex items-center justify-center gap-2 w-full border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#FFD700]/30 hover:bg-[#141414] active:scale-95 font-roboto text-sm py-3.5 rounded-md transition-all mb-3">
          <Icon name="UserPlus" size={16} />
          Зарегистрироваться как клиент
        </a>
        <div className="flex justify-center">
          <InstallPwaButton />
        </div>
      </div>
    </div>
  );

  const isOwnerOrAdmin = empRole === "owner" || empRole === "admin";
  const isOwner = empRole === "owner";

  const requestTab = (t: Tab) => {
    if (isOwner || unlocked[t]) { setTab(t); return; }
    if ((PROTECTED_TABS as readonly string[]).includes(t)) {
      setPwModal(t); setPwInput(""); setPwError("");
      return;
    }
    setTab(t);
  };

  const submitPw = () => {
    if (pwInput === SECRET_PW && pwModal) {
      const opened = pwModal;
      setUnlocked(u => ({ ...u, [opened]: true }));
      setTab(opened);
      setPwModal(null); setPwInput(""); setPwError("");
      toast.success("Доступ открыт");
    } else {
      setPwError("Неверный пароль");
      toast.error("Неверный пароль");
    }
  };

  const sendReminderNow = async () => {
    setSending(true);
    setSendResult(null);
    const tid = toast.loading("Отправляю напоминание @PluXan...");
    try {
      const res = await fetch(`${PRICE_SCHEDULER_URL}?action=send_morning_reminder_now`);
      const data = await res.json();
      const ok = data.sent === true;
      setSendResult(ok);
      toast.update(tid, ok
        ? { kind: "success", message: "Напоминание отправлено", duration: 3000 }
        : { kind: "error", message: data.error || "Не удалось отправить напоминание", duration: 5000 });
    } catch {
      setSendResult(false);
      toast.update(tid, { kind: "error", message: "Сбой сети при отправке", duration: 5000 });
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 4000);
    }
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