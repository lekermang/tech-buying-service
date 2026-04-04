import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import SkyTab from "@/components/admin/SkyTab";
import RepairTab from "@/components/admin/RepairTab";
import PricesTab from "@/components/admin/PricesTab";
import CatalogTab from "@/components/admin/CatalogTab";

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"repair" | "prices" | "sky" | "catalog">("repair");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const checkAuth = async (tok: string) => {
    setChecking(true);
    setError("");
    const res = await fetch(ADMIN_URL, { headers: { "X-Admin-Token": tok } });
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

  useEffect(() => {
    if (token) checkAuth(token);
  }, []);

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
            <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Токен доступа</label>
            <input type="password" value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Введите токен..."
              className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors mb-3"
            />
            {error && <div className="text-red-400 font-roboto text-xs mb-3">{error}</div>}
            <button onClick={login} disabled={checking}
              className="w-full bg-[#FFD700] text-black font-oswald font-bold py-2.5 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-60">
              {checking ? "Проверяю..." : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Шапка */}
      <div className="border-b border-[#222] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#FFD700] flex items-center justify-center shrink-0">
            <Icon name="Wrench" size={11} className="text-black" />
          </div>
          <div className="flex gap-1">
            {[
              { key: "repair", label: "Ремонт", icon: "Wrench" },
              { key: "prices", label: "Цены", icon: "Tag" },
              { key: "sky", label: "SKY", icon: "Package" },
              { key: "catalog", label: "Каталог", icon: "Bot" },
            ].map((t) => (
              <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
                className={`flex items-center gap-1.5 font-oswald font-bold uppercase text-xs px-3 py-1.5 transition-colors ${tab === t.key ? "bg-[#FFD700] text-black" : "text-white/40 hover:text-white"}`}>
                <Icon name={t.icon} size={12} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("admin_token"); setToken(""); setAuthed(false); setTokenInput(""); }}
          className="text-white/30 hover:text-red-400 transition-colors">
          <Icon name="LogOut" size={15} />
        </button>
      </div>

      {tab === "repair" && <RepairTab token={token} />}
      {tab === "prices" && <PricesTab token={token} />}
      {tab === "sky" && <SkyTab token={token} />}
      {tab === "catalog" && <CatalogTab token={token} />}
    </div>
  );
}
