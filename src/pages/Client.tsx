import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";
import ClientAuthScreen from "./client/ClientAuthScreen";
import ClientRepairs from "./client/ClientRepairs";
import ClientContracts from "./client/ClientContracts";
import ClientOffers from "./client/ClientOffers";
import ClientChat from "./client/ClientChat";
import ClientProfileTab from "./client/ClientProfile";
import ClientSales from "./client/ClientSales";
import ClientNotificationsBanner from "./client/ClientNotificationsBanner";
import { ClientProfile } from "./client/clientTypes";

const AUTH_URL = (funcUrls as Record<string, string>)["client-auth"];
const CAB_URL = (funcUrls as Record<string, string>)["client-cabinet"];

type Tab = "repairs" | "contracts" | "sales" | "offers" | "chat" | "profile";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "repairs", label: "Ремонты", icon: "Wrench" },
  { id: "contracts", label: "Договор", icon: "ScrollText" },
  { id: "sales", label: "Скупка", icon: "PackageCheck" },
  { id: "offers", label: "Заявки", icon: "Send" },
  { id: "chat", label: "Чат", icon: "MessageCircle" },
  { id: "profile", label: "Профиль", icon: "UserCircle" },
];

export default function Client() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("client_token"));
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [tab, setTab] = useState<Tab>(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab") as Tab | null;
    return (t && ["repairs", "contracts", "sales", "offers", "chat", "profile"].includes(t)) ? t : "repairs";
  });
  const [loading, setLoading] = useState(false);

  const loadProfile = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const r = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-Token": t },
        body: JSON.stringify({ action: "me" }),
      });
      const d = await r.json();
      if (r.ok && d.id) setProfile(d);
      else {
        localStorage.removeItem("client_token");
        setToken(null);
      }
    } catch {
      localStorage.removeItem("client_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadProfile(token);
  }, [token, loadProfile]);

  // Каждые 60 сек проверяем статусы → бэк сам пошлёт push если что-то изменилось
  useEffect(() => {
    if (!token) return;
    const fire = () => {
      fetch(CAB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-Token": token },
        body: JSON.stringify({ action: "check_updates" }),
      }).catch(() => {});
    };
    fire();
    const id = setInterval(fire, 60_000);
    return () => clearInterval(id);
  }, [token]);

  const onAuth = (t: string) => {
    localStorage.setItem("client_token", t);
    setToken(t);
  };

  const onLogout = async () => {
    if (token) {
      fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Client-Token": token },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => {});
    }
    localStorage.removeItem("client_token");
    setToken(null);
    setProfile(null);
  };

  if (!token) {
    return <ClientAuthScreen onAuth={onAuth} />;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Icon name="Loader" size={28} className="animate-spin text-[#FFD700]" />
      </div>
    );
  }

  const profileComplete = !!(
    profile.birth_date && profile.delivery_city && profile.delivery_address
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-black text-white">
      {/* Шапка */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0A0A0A]/85 border-b border-[#1F1F1F]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setTab("profile")}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#d4a017] flex items-center justify-center shrink-0 overflow-hidden relative"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-black font-bold">
                {profile.full_name.slice(0, 1).toUpperCase()}
              </span>
            )}
            {!profileComplete && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#FFD700] rounded-full border-2 border-[#0A0A0A]" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-white truncate">{profile.full_name}</div>
            <div className="text-[10px] text-white/40 flex items-center gap-2 flex-wrap">
              <span>Скидка {profile.discount_pct}%</span>
              {profile.loyalty_points > 0 && (
                <>
                  <span>·</span>
                  <span className="text-[#FFD700]">{profile.loyalty_points} баллов</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-red-400 transition"
            title="Выйти"
          >
            <Icon name="LogOut" size={16} />
          </button>
        </div>

        {/* Табы */}
        <div className="max-w-3xl mx-auto px-2 pb-1 flex gap-0.5 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[68px] px-2 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wide flex flex-col items-center gap-1 transition relative ${
                tab === t.id
                  ? "bg-gradient-to-b from-[#FFE34D]/20 to-[#d4a017]/10 border border-[#FFD700]/30 text-[#FFD700]"
                  : "text-white/45 hover:text-white"
              }`}
            >
              <Icon name={t.icon} size={15} />
              <span>{t.label}</span>
              {t.id === "profile" && !profileComplete && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFD700] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-3xl mx-auto px-3 py-4 pb-24">
        <ClientNotificationsBanner token={token} />
        {tab === "repairs" && <ClientRepairs token={token} />}
        {tab === "contracts" && <ClientContracts token={token} />}
        {tab === "sales" && <ClientSales token={token} />}
        {tab === "offers" && <ClientOffers token={token} />}
        {tab === "chat" && <ClientChat token={token} />}
        {tab === "profile" && (
          <ClientProfileTab
            token={token}
            profile={profile}
            onProfileUpdate={setProfile}
          />
        )}
      </main>

      {/* Футер */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-[#1F1F1F] px-4 py-2.5 text-center text-[10px] text-white/30">
        Скупка 24 · {new Date().getFullYear()} · Кабинет клиента
      </footer>
    </div>
  );
}