import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "./staff.types";
import GoodsTab from "./StaffGoodsTab";
import { SalesTab, ClientsTab, AnalyticsTab, EmployeesTab } from "./StaffOtherTabs";
import StaffRepairTab from "./StaffRepairTab";

type Tab = "goods" | "sales" | "clients" | "analytics" | "employees" | "repair";

export default function Staff() {
  const [token, setToken] = useState(() => localStorage.getItem("employee_token") || "");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [empName, setEmpName] = useState(() => localStorage.getItem("employee_name") || "");
  const [empRole, setEmpRole] = useState(() => localStorage.getItem("employee_role") || "");
  const [tab, setTab] = useState<Tab>("goods");

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

  const login = async () => {
    if (!loginForm.login || !loginForm.password) { setLoginError("Введите логин и пароль"); return; }
    const res = await fetch(EMPLOYEE_AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", ...loginForm }) });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("employee_token", data.token);
      localStorage.setItem("employee_name", data.full_name);
      localStorage.setItem("employee_role", data.role);
      setToken(data.token); setEmpName(data.full_name); setEmpRole(data.role); setAuthed(true);
    } else setLoginError(data.error || "Неверный логин или пароль");
  };

  const logout = () => {
    localStorage.removeItem("employee_token"); localStorage.removeItem("employee_name"); localStorage.removeItem("employee_role");
    setToken(""); setAuthed(false); setEmpName(""); setEmpRole("");
  };

  if (!authed) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
              <Icon name="Users" size={16} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide">Панель сотрудника</span>
          </div>
          <a href="/" className="text-white/30 hover:text-white font-roboto text-xs transition-colors flex items-center gap-1">
            <Icon name="ArrowLeft" size={13} /> На сайт
          </a>
        </div>

        {/* Форма входа */}
        <div className="bg-[#1A1A1A] border border-[#333] p-5 space-y-3 mb-3">
          <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wider mb-2">Вход для сотрудников</div>
          {[{ key: "login", label: "Логин", placeholder: "admin", type: "text" }, { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" }].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">{f.label}</label>
              <input type={f.type} value={(loginForm as Record<string,string>)[f.key]}
                onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && login()}
                placeholder={f.placeholder}
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
          ))}
          {loginError && <div className="text-red-400 font-roboto text-xs">{loginError}</div>}
          <button onClick={login} className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors">
            Войти
          </button>
        </div>

        {/* Кнопка регистрации клиента */}
        <a href="/cabinet"
          className="flex items-center justify-center gap-2 w-full border border-white/10 text-white/50 hover:text-white hover:border-white/30 font-roboto text-sm py-3 transition-colors">
          <Icon name="UserPlus" size={15} />
          Зарегистрироваться как клиент
        </a>
        <div className="font-roboto text-white/20 text-[10px] text-center mt-2">
          Клиентская регистрация даёт скидку до 10% на все услуги
        </div>
      </div>
    </div>
  );

  const isOwnerOrAdmin = empRole === "owner" || empRole === "admin";

  const TABS = [
    { k: "goods", l: "Товары", icon: "Package" },
    { k: "sales", l: "Продажи", icon: "ShoppingCart" },
    { k: "repair", l: "Ремонт", icon: "Wrench" },
    { k: "clients", l: "Клиенты", icon: "Users" },
    { k: "analytics", l: "Аналитика", icon: "BarChart2" },
    ...(isOwnerOrAdmin ? [{ k: "employees", l: "Сотрудники", icon: "UserCog" }] : []),
  ];

  const ROLE_BADGE: Record<string, string> = {
    owner: "bg-[#FFD700] text-black",
    admin: "bg-blue-500/20 text-blue-400",
    staff: "bg-white/10 text-white/50",
  };
  const ROLE_LABEL: Record<string, string> = { owner: "Владелец", admin: "Админ", staff: "Сотрудник" };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="border-b border-[#222] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Users" size={11} className="text-black" />
          </div>
          <span className="font-oswald font-bold uppercase text-sm">{empName}</span>
          <span className={`font-roboto text-[10px] px-1.5 py-0.5 ${ROLE_BADGE[empRole] || "bg-white/10 text-white/50"}`}>
            {ROLE_LABEL[empRole] || empRole}
          </span>
        </div>
        <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors">
          <Icon name="LogOut" size={15} />
        </button>
      </div>

      <div className="flex border-b border-[#222] overflow-x-auto">
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k as Tab)}
            className={`flex items-center gap-1.5 font-roboto text-xs px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${tab === t.k ? "border-[#FFD700] text-[#FFD700]" : "border-transparent text-white/40 hover:text-white"}`}>
            <Icon name={t.icon} size={13} /> {t.l}
          </button>
        ))}
      </div>

      {tab === "goods" && <GoodsTab token={token} />}
      {tab === "sales" && <SalesTab token={token} />}
      {tab === "repair" && <StaffRepairTab token={token} />}
      {tab === "clients" && <ClientsTab token={token} />}
      {tab === "analytics" && <AnalyticsTab token={token} />}
      {tab === "employees" && isOwnerOrAdmin && <EmployeesTab token={token} myRole={empRole} />}
    </div>
  );
}