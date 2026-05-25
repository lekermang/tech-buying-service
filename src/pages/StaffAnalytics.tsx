/** Раздел аналитики посетителей в админке /staff/analytics.
 * Использует polling (Cloud Functions stateless, без WS/SSE):
 *  - /online каждые 5 сек (только при visible вкладке)
 *  - /stats_today, /conversions каждые 30 сек
 *  - /recent_events каждые 10 сек для toast-уведомлений
 */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import AnalyticsDashboard from "./staffAnalytics/AnalyticsDashboard";

export default function StaffAnalytics({ embedded, tokenProp }: { embedded?: boolean; tokenProp?: string } = {}) {
  const [token, setToken] = useState(tokenProp || "");
  const [authReady, setAuthReady] = useState(!!tokenProp);

  useEffect(() => {
    if (tokenProp) { setToken(tokenProp); setAuthReady(true); return; }
    const t = localStorage.getItem("employee_token") || "";
    setToken(t); setAuthReady(true);
    document.title = "Аналитика посетителей — Скупка24 / Админ";
  }, [tokenProp]);

  if (!authReady) return null;
  if (!token) {
    return (
      <div className={embedded ? "p-8 text-center" : "min-h-screen bg-[#0D0D0D] text-[#F0F0F0] flex items-center justify-center px-5"}
        style={embedded ? undefined : { fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
        <div className="max-w-md text-center mx-auto">
          <Icon name="Lock" size={36} className="text-[#FFD700] mx-auto mb-3" />
          <h1 className="text-xl font-extrabold mb-2">Нужна авторизация</h1>
          <p className="text-sm text-[#999] mb-5">Войдите как сотрудник, чтобы открыть аналитику.</p>
          {!embedded && (
            <a href="/staff" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm">
              <Icon name="LogIn" size={16} /> Войти как сотрудник
            </a>
          )}
        </div>
      </div>
    );
  }

  // Embedded режим — без TopBar (внутри StaffMainLayout)
  if (embedded) {
    return (
      <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
        <AnalyticsDashboard token={token} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <TopBar />
      <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
        <AnalyticsDashboard token={token} />
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#141414]">
      <a href="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
        <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
        <span className="text-xs text-[#777] hidden sm:inline">/ Админ / Аналитика</span>
      </a>
      <a href="/staff" className="text-xs text-[#FFD700] hover:underline">
        <Icon name="LayoutDashboard" size={12} className="inline mr-1" /> Все модули
      </a>
    </div>
  );
}
