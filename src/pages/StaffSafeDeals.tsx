/** Быстрый доступ в админку Безопасных сделок — /staff/safe-deals.
 * Использует сохранённый employee_token. Если его нет — отправляет на /staff для логина. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import SafeDealsTab from "./slShop/safeDeals/SafeDealsTab";

export default function StaffSafeDeals() {
  const [token, setToken] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Безопасные сделки — Скупка24 / Админ";
    const t = localStorage.getItem("employee_token") || "";
    setToken(t);
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0] flex items-center justify-center px-5"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
        <div className="max-w-md text-center">
          <Icon name="Lock" size={36} className="text-[#FFD700] mx-auto mb-3" />
          <h1 className="text-xl font-extrabold mb-2">Нужна авторизация</h1>
          <p className="text-sm text-[#999] mb-5">
            Войдите как сотрудник, чтобы открыть админку безопасных сделок.
          </p>
          <a href="/staff" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD700] text-black font-bold text-sm">
            <Icon name="LogIn" size={16} /> Войти как сотрудник
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F0F0F0]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2A2A] bg-[#141414]">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg bg-[#FFD700] flex items-center justify-center text-black font-extrabold text-base">С</div>
          <span className="text-[#FFD700] font-bold text-base">Скупка24</span>
          <span className="text-xs text-[#777] hidden sm:inline">/ Админ / Безоп. сделка</span>
        </a>
        <div className="flex items-center gap-2">
          <a href="/staff" className="text-xs text-[#FFD700] hover:underline">
            <Icon name="LayoutDashboard" size={12} className="inline mr-1" /> Все модули
          </a>
        </div>
      </div>
      <div className="p-2 sm:p-4 max-w-[1400px] mx-auto">
        <SafeDealsTab token={token} />
      </div>
    </div>
  );
}
