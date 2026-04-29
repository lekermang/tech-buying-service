import { useState, useEffect, useCallback } from "react";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import { StaffThemeProvider } from "./staffTheme/StaffThemeContext";
import {
  PRICE_SCHEDULER_URL,
  VIP_CHAT_URL,
  SECRET_PW,
  PROTECTED_TABS,
  readSavedTab,
  saveTab,
  type StaffTab,
} from "./staff/staffConstants";
import { StaffToastProvider, useStaffToast } from "./staff/StaffToast";
import { useStaffPwa } from "./staff/StaffPwa";
import { prefetchTab } from "./staff/StaffLazy";
import { LoginScreen, PinScreen } from "./staff/StaffLoginScreens";
import { StaffMainLayout } from "./staff/StaffMainLayout";

type Tab = StaffTab;

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
    return (
      <PinScreen
        pinStage={pinStage}
        pinValue={pinValue}
        setPinValue={setPinValue}
        pinConfirm={pinConfirm}
        setPinConfirm={setPinConfirm}
        pinError={pinError}
        pinLoading={pinLoading}
        onVerifyPin={verifyPin}
        onCancelPin={cancelPin}
      />
    );
  }

  if (!authed) {
    return (
      <LoginScreen
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        loginError={loginError}
        loginLoading={loginLoading}
        onLogin={login}
      />
    );
  }

  const isOwnerOrAdmin = empRole === "owner" || empRole === "admin";
  const isOwner = empRole === "owner";

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

  return (
    <StaffMainLayout
      token={token}
      empName={empName}
      empRole={empRole}
      isOwnerOrAdmin={isOwnerOrAdmin}
      isOwner={isOwner}
      tab={tab}
      setTab={setTab}
      unlocked={unlocked}
      setUnlocked={setUnlocked}
      themeOpen={themeOpen}
      setThemeOpen={setThemeOpen}
      pwModal={pwModal}
      setPwModal={setPwModal}
      pwInput={pwInput}
      setPwInput={setPwInput}
      pwError={pwError}
      setPwError={setPwError}
      submitPw={submitPw}
      sending={sending}
      sendResult={sendResult}
      sendReminderNow={sendReminderNow}
      logout={logout}
      chatUnread={chatUnread}
      setChatUnread={setChatUnread}
    />
  );
}
