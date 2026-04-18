import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";
import SkyTab from "@/components/admin/SkyTab";
import RepairTab from "@/components/admin/RepairTab";
import PricesTab from "@/components/admin/PricesTab";
import CatalogTab from "@/components/admin/CatalogTab";
import CatalogEditTab from "@/components/admin/CatalogEditTab";
import { ApiCatalogContent } from "@/pages/ApiCatalog";
import ToolsImportTab from "@/components/admin/ToolsImportTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import NotificationsTab from "@/components/admin/NotificationsTab";
import SettingsTab from "@/components/admin/SettingsTab";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";
const EXPORT_URL = "https://functions.poehali.dev/13db4dbd-0d2b-47d4-8e09-c6f82483ffde";

type Tab = "repair" | "prices" | "sky" | "catalog" | "items" | "api-catalog" | "tools-import" | "analytics" | "notifications" | "settings";

const MENU: { key: Tab; label: string; icon: string; group: string }[] = [
  { key: "analytics",     label: "Аналитика",      icon: "BarChart2",   group: "Статистика" },
  { key: "repair",        label: "Ремонт",         icon: "Wrench",      group: "Заявки" },
  { key: "prices",        label: "Цены",           icon: "Tag",         group: "Заявки" },
  { key: "notifications", label: "Уведомления",    icon: "Bell",        group: "Заявки" },
  { key: "sky",           label: "SKY",            icon: "Package",     group: "Каталог" },
  { key: "items",         label: "Товары",         icon: "ShoppingBag", group: "Каталог" },
  { key: "api-catalog",   label: "Выгрузка API",   icon: "PackageOpen", group: "Каталог" },
  { key: "catalog",       label: "Синхронизация",  icon: "Bot",         group: "Инструменты" },
  { key: "tools-import",  label: "Импорт CSV",     icon: "FileUp",      group: "Инструменты" },
  { key: "settings",      label: "Настройки",      icon: "Settings",    group: "Система" },
];

export default function Admin() {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("admin_token") || "";
    // Сбрасываем если токен содержит не-ASCII (старый сломанный)
    if (t && /[^\u0020-\u007E]/.test(t)) { localStorage.removeItem("admin_token"); return ""; }
    return t;
  });
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("analytics");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [exporting, setExporting] = useState(false);

  const downloadXlsx = async () => {
    setExporting(true);
    try {
      const res = await fetch(EXPORT_URL, { headers: adminHeaders(token) });
      const text = await res.text();
      let base64 = text;
      try {
        const parsed = JSON.parse(text);
        if (parsed.body) base64 = parsed.body;
      } catch (_e) { /* raw base64 */ }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "yandex_market_export.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const checkAuth = async (tok: string) => {
    setChecking(true);
    setError("");
    const res = await fetch(ADMIN_URL, { headers: adminHeaders(tok) });
    setChecking(false);
    if (res.status === 401) { setAuthed(false); setError("Неверный токен"); return; }
    setAuthed(true);
  };

  const login = async () => {
    const tok = tokenInput.trim();
    if (!tok) return;
    localStorage.setItem("admin_token", tok);
    setToken(tok);
    await checkAuth(tok);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(""); setAuthed(false); setTokenInput("");
  };

  useEffect(() => { if (token) checkAuth(token); }, []);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-[#FFD700] flex items-center justify-center">
              <Icon name="Lock" size={13} className="text-black" />
            </div>
            <span className="font-oswald font-bold text-white uppercase tracking-wide">Панель управления</span>
          </div>
          <div className="bg-[#1A1A1A] border border-[#333] p-5">
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Токен доступа</label>
            <input type="password" value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Введите токен..."
              className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#FFD700] transition-colors mb-3"
            />
            {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
            <button onClick={login} disabled={checking}
              className="w-full bg-[#FFD700] text-black font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60">
              {checking ? "Проверяю..." : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groups = [...new Set(MENU.map(m => m.group))];
  const active = MENU.find(m => m.key === tab);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex">
      {/* Левое меню */}
      <aside className={`flex flex-col bg-[#111] border-r border-[#222] transition-all duration-200 shrink-0 ${collapsed ? "w-14" : "w-52"}`}>
        {/* Логотип */}
        <div className={`flex items-center gap-2 px-3 py-4 border-b border-[#222] ${collapsed ? "justify-center" : ""}`}>
          <div className="w-6 h-6 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={12} className="text-black" />
          </div>
          {!collapsed && <span className="font-bold uppercase text-xs tracking-widest text-white truncate">Admin</span>}
        </div>

        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map(group => (
            <div key={group} className="mb-1">
              {!collapsed && (
                <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-white/20 font-bold">{group}</div>
              )}
              {MENU.filter(m => m.group === group).map(m => (
                <button
                  key={m.key}
                  onClick={() => setTab(m.key)}
                  title={collapsed ? m.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left
                    ${collapsed ? "justify-center" : ""}
                    ${tab === m.key
                      ? "bg-[#FFD700]/10 text-[#FFD700] border-r-2 border-[#FFD700]"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <Icon name={m.icon} size={15} className="shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">{m.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Низ */}
        <div className="border-t border-[#222] p-2 flex flex-col gap-1">
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Развернуть" : "Свернуть"}
            className="w-full flex items-center justify-center gap-2 py-2 text-white/30 hover:text-white transition-colors"
          >
            <Icon name={collapsed ? "ChevronRight" : "ChevronLeft"} size={14} />
            {!collapsed && <span className="text-xs">Свернуть</span>}
          </button>
          <button
            onClick={logout}
            title="Выйти"
            className="w-full flex items-center justify-center gap-2 py-2 text-white/30 hover:text-red-400 transition-colors"
          >
            <Icon name="LogOut" size={14} />
            {!collapsed && <span className="text-xs">Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Контент */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Шапка контента */}
        <div className="border-b border-[#222] px-5 py-3 flex items-center gap-3">
          <Icon name={active?.icon || "Circle"} size={16} className="text-[#FFD700]" />
          <span className="font-bold uppercase tracking-wide text-sm">{active?.label}</span>
          <div className="ml-auto">
            <button
              onClick={downloadXlsx}
              disabled={exporting}
              title="Скачать каталог электроники, товары склада и инструменты в Excel"
              className="flex items-center gap-1.5 font-roboto text-[11px] px-3 py-1.5 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
            >
              <Icon name={exporting ? "Loader" : "FileDown"} size={13} className={exporting ? "animate-spin" : ""} />
              {exporting ? "Формирую..." : "Скачать XLSX"}
            </button>
          </div>
        </div>

        <div className={`flex-1 ${tab === "analytics" ? "overflow-hidden flex flex-col" : "overflow-auto"}`}>
          {tab === "analytics"     && <AnalyticsTab />}
          {tab === "repair"        && <RepairTab token={token} />}
          {tab === "prices"        && <PricesTab token={token} />}
          {tab === "notifications" && <NotificationsTab token={token} />}
          {tab === "sky"           && <SkyTab token={token} />}
          {tab === "items"         && <CatalogEditTab token={token} />}
          {tab === "catalog"       && <CatalogTab token={token} />}
          {tab === "api-catalog"   && <ApiCatalogContent token={token} />}
          {tab === "tools-import"  && <ToolsImportTab token={token} />}
          {tab === "settings"      && <SettingsTab token={token} />}
        </div>
      </div>
    </div>
  );
}