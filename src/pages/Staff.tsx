import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import GoodsTab from "./StaffGoodsTab";
import { SalesTab, ClientsTab, AnalyticsTab, EmployeesTab } from "./StaffOtherTabs";
import StaffRepairTab from "./StaffRepairTab";

const PRICE_SCHEDULER_URL = "https://functions.poehali.dev/b09271ea-c662-4225-973f-4dd4c6a0e32c";

type Tab = "goods" | "sales" | "clients" | "analytics" | "employees" | "repair";

function MskClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
  const time = msk.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = msk.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <div className="text-center leading-tight">
      <div className="font-oswald font-bold text-[#FFD700] text-sm tracking-wider">{time}</div>
      <div className="font-roboto text-white/30 text-[9px]">{date} МСК</div>
    </div>
  );
}

export default function Staff() {
  const [token, setToken] = useState(() => localStorage.getItem("employee_token") || "");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [empName, setEmpName] = useState(() => localStorage.getItem("employee_name") || "");
  const [empRole, setEmpRole] = useState(() => localStorage.getItem("employee_role") || "");
  const [tab, setTab] = useState<Tab>("repair");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | boolean>(null);

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
    } catch {
      setLoginError("Ошибка соединения. Попробуй ещё раз.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("employee_token"); localStorage.removeItem("employee_name"); localStorage.removeItem("employee_role");
    setToken(""); setAuthed(false); setEmpName(""); setEmpRole("");
  };

  if (!authed) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 safe-area-inset">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700] flex items-center justify-center shrink-0">
              <Icon name="Wrench" size={18} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wide text-base">Скупка24</div>
              <div className="font-roboto text-white/40 text-[10px]">Панель сотрудника</div>
            </div>
          </div>
          <a href="/" className="text-white/30 hover:text-white transition-colors p-2">
            <Icon name="ArrowLeft" size={18} />
          </a>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333] p-5 space-y-4 mb-4">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider">Вход для сотрудников</div>
          {[{ key: "login", label: "Логин", placeholder: "admin", type: "text" }, { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" }].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1.5">{f.label}</label>
              <input type={f.type} value={(loginForm as Record<string,string>)[f.key]}
                onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder={f.placeholder}
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-4 py-3 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          ))}
          {loginError && <div className="text-red-400 font-roboto text-sm">{loginError}</div>}
          <button onClick={login} disabled={loginLoading} className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3.5 uppercase tracking-wide text-sm hover:bg-yellow-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loginLoading ? <><Icon name="Loader" size={16} className="animate-spin" /> Вход...</> : "Войти"}
          </button>
        </div>

        <a href="/cabinet"
          className="flex items-center justify-center gap-2 w-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 font-roboto text-sm py-3.5 transition-colors">
          <Icon name="UserPlus" size={16} />
          Зарегистрироваться как клиент
        </a>
      </div>
    </div>
  );

  const isOwnerOrAdmin = empRole === "owner" || empRole === "admin";

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
    { k: "goods",     l: "Товары",    icon: "Package" },
    { k: "sales",     l: "Продажи",   icon: "ShoppingCart" },
    { k: "clients",   l: "Клиенты",   icon: "Users" },
    { k: "analytics", l: "Статистика",icon: "BarChart2" },
    ...(isOwnerOrAdmin ? [{ k: "employees", l: "Команда", icon: "UserCog" }] : []),
  ];

  const ROLE_BADGE: Record<string, string> = {
    owner: "bg-[#FFD700] text-black",
    admin: "bg-blue-500/20 text-blue-400",
    staff: "bg-white/10 text-white/50",
  };
  const ROLE_LABEL: Record<string, string> = { owner: "Владелец", admin: "Админ", staff: "Сотрудник" };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* Шапка — компактная */}
      <div className="border-b border-[#222] px-4 py-2.5 flex items-center justify-between shrink-0 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={12} className="text-black" />
          </div>
          <span className="font-oswald font-bold uppercase text-sm truncate max-w-[140px]">{empName}</span>
          <span className={`font-roboto text-[10px] px-1.5 py-0.5 shrink-0 ${ROLE_BADGE[empRole] || "bg-white/10 text-white/50"}`}>
            {ROLE_LABEL[empRole] || empRole}
          </span>
        </div>
        <MskClock />
        <div className="flex items-center gap-1">
          {isOwnerOrAdmin && (
            <button
              onClick={sendReminderNow}
              disabled={sending}
              title="Отправить напоминание @PluXan сейчас"
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-roboto font-bold uppercase tracking-wide transition-all active:opacity-60 ${
                sendResult === true ? "bg-green-500/20 text-green-400" :
                sendResult === false ? "bg-red-500/20 text-red-400" :
                "bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700]/20"
              } ${sending ? "opacity-50 cursor-wait" : ""}`}
            >
              <Icon name={sending ? "Loader" : sendResult === true ? "Check" : "Bell"} size={12} className={sending ? "animate-spin" : ""} />
              {sending ? "..." : sendResult === true ? "Отправлено" : sendResult === false ? "Ошибка" : "Напомнить"}
            </button>
          )}
          <button onClick={logout} className="text-white/30 active:text-red-400 transition-colors p-2 -mr-2">
            <Icon name="LogOut" size={16} />
          </button>
        </div>
      </div>

      {/* Контент — растягивается, с паддингом под нижнюю панель */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(50px + env(safe-area-inset-bottom, 16px))' }}>
        {tab === "repair"    && <StaffRepairTab token={token} isOwner={empRole === "owner"} />}
        {tab === "goods"     && <GoodsTab token={token} />}
        {tab === "sales"     && <SalesTab token={token} />}
        {tab === "clients"   && <ClientsTab token={token} />}
        {tab === "analytics" && <AnalyticsTab token={token} />}
        {tab === "employees" && isOwnerOrAdmin && <EmployeesTab token={token} myRole={empRole} />}
      </div>

      {/* Нижняя навигация — фиксированная, с safe area для iPhone */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-sm border-t border-[#2A2A2A] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as Tab)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 min-h-[50px] transition-colors active:opacity-60 relative ${
                tab === t.k ? "text-[#FFD700]" : "text-white/30"
              }`}
            >
              {tab === t.k && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#FFD700] rounded-b-full" />
              )}
              <Icon name={t.icon} size={20} />
              <span className="font-roboto text-[8px] leading-none tracking-wide">{t.l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}