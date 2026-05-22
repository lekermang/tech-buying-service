import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";
import ClientAuthScreen from "./client/ClientAuthScreen";
import ClientRepairs from "./client/ClientRepairs";
import ClientContracts from "./client/ClientContracts";
import ClientOffers from "./client/ClientOffers";
import { ClientProfile, Summary, fmtMoney } from "./client/clientTypes";

const AUTH_URL = (funcUrls as Record<string, string>)["client-auth"];
const CAB_URL = (funcUrls as Record<string, string>)["client-cabinet"];

type Tab = "home" | "repairs" | "contracts" | "offers";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "repairs", label: "Ремонты", icon: "Wrench" },
  { id: "contracts", label: "Залоги", icon: "FileText" },
  { id: "offers", label: "Предложения", icon: "Send" },
];

export default function Client() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("client_token"));
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [checked, setChecked] = useState(false);

  // Проверяем токен при загрузке
  useEffect(() => {
    if (!token) {
      setChecked(true);
      return;
    }
    fetch(AUTH_URL, {
      method: "POST",
      headers: { "X-Client-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.client) {
          setProfile(d.client);
        } else {
          localStorage.removeItem("client_token");
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("client_token");
        setToken(null);
      })
      .finally(() => setChecked(true));
  }, [token]);

  // Загружаем сводку
  useEffect(() => {
    if (!token || !profile) return;
    fetch(CAB_URL, {
      method: "POST",
      headers: { "X-Client-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "summary" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setSummary(d as Summary);
      })
      .catch(() => {});
  }, [token, profile, tab]);

  const logout = async () => {
    if (token) {
      await fetch(AUTH_URL, {
        method: "POST",
        headers: { "X-Client-Token": token, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => {});
    }
    localStorage.removeItem("client_token");
    setToken(null);
    setProfile(null);
    setSummary(null);
  };

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Icon name="Loader" size={28} className="animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (!token || !profile) {
    return <ClientAuthScreen onAuth={(t) => setToken(t)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0E0E0E] to-[#080808]">
      {/* Шапка */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur border-b border-[#1F1F1F]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#FFD700] font-bold">
                {profile.full_name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">
              Кабинет клиента
            </div>
            <div className="text-[14px] font-bold text-white truncate">{profile.full_name}</div>
          </div>
          <a
            href="/"
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-[#FFD700]"
            title="На главную"
          >
            <Icon name="Home" size={18} />
          </a>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-red-400"
            title="Выйти"
          >
            <Icon name="LogOut" size={18} />
          </button>
        </div>
      </header>

      {/* Контент */}
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {tab === "home" && <ClientHome profile={profile} summary={summary} onGoto={setTab} />}
        {tab === "repairs" && <ClientRepairs token={token} />}
        {tab === "contracts" && <ClientContracts token={token} />}
        {tab === "offers" && <ClientOffers token={token} />}
      </main>

      {/* Нижнее меню */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur border-t border-[#1F1F1F] z-40">
        <div className="max-w-2xl mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2.5 ${
                tab === t.id ? "text-[#FFD700]" : "text-white/40"
              }`}
            >
              <Icon name={t.icon} size={20} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ClientHome({
  profile,
  summary,
  onGoto,
}: {
  profile: ClientProfile;
  summary: Summary | null;
  onGoto: (t: Tab) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Приветствие */}
      <div className="bg-gradient-to-br from-[#FFD700]/15 via-[#FFD700]/5 to-transparent border border-[#FFD700]/30 rounded-2xl p-5">
        <div className="text-[11px] text-[#FFD700]/80 uppercase tracking-wider font-semibold">
          Добро пожаловать
        </div>
        <div className="text-[22px] font-bold text-white mt-1">
          {profile.full_name.split(" ")[0]}!
        </div>
        <div className="text-[12px] text-white/60 mt-1">
          Здесь вся информация о ваших ремонтах, залогах и предложениях.
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Скидка</div>
            <div className="text-[16px] font-bold text-[#FFD700]">{profile.discount_pct}%</div>
          </div>
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Бонусы</div>
            <div className="text-[16px] font-bold text-white">{profile.loyalty_points} ⭐</div>
          </div>
        </div>
      </div>

      {/* Карточки разделов */}
      <div className="grid grid-cols-2 gap-3">
        <SectionCard
          icon="Wrench"
          title="Мои ремонты"
          count={summary?.repairs.active || 0}
          total={summary?.repairs.total || 0}
          onClick={() => onGoto("repairs")}
        />
        <SectionCard
          icon="FileText"
          title="Мои залоги"
          count={summary?.contracts.active || 0}
          total={summary?.contracts.total || 0}
          subtitle={summary ? fmtMoney(summary.contracts.amount_active) : undefined}
          onClick={() => onGoto("contracts")}
        />
      </div>

      <button
        onClick={() => onGoto("offers")}
        className="w-full bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-4 flex items-center gap-3 text-left hover:border-[#FFD700]/30 transition"
      >
        <div className="w-12 h-12 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center shrink-0">
          <Icon name="Send" size={22} className="text-[#FFD700]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-white">Отправить предложение</div>
          <div className="text-[11px] text-white/50">
            Сдать в скупку · отремонтировать · заложить
          </div>
        </div>
        <Icon name="ChevronRight" size={18} className="text-white/40" />
      </button>

      {/* Быстрые действия */}
      <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-4">
        <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-3">
          Связаться с нами
        </div>
        <div className="grid grid-cols-3 gap-2">
          <a
            href="tel:+78007777777"
            className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#FFD700]/30"
          >
            <Icon name="Phone" size={18} className="text-[#FFD700]" />
            <span className="text-[10px] text-white/70 font-semibold">Звонок</span>
          </a>
          <a
            href="https://wa.me/78007777777"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#10B981]/30"
          >
            <Icon name="MessageCircle" size={18} className="text-[#10B981]" />
            <span className="text-[10px] text-white/70 font-semibold">WhatsApp</span>
          </a>
          <a
            href="/chat"
            className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F] hover:border-[#3B82F6]/30"
          >
            <Icon name="MessagesSquare" size={18} className="text-[#3B82F6]" />
            <span className="text-[10px] text-white/70 font-semibold">Онлайн-чат</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  count,
  total,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  count: number;
  total: number;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-4 text-left hover:border-[#FFD700]/30 transition"
    >
      <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center mb-3">
        <Icon name={icon} size={18} className="text-[#FFD700]" />
      </div>
      <div className="text-[12px] text-white/60 font-semibold">{title}</div>
      <div className="text-[22px] font-bold text-white mt-0.5">{count}</div>
      <div className="text-[10px] text-white/40 mt-0.5">
        {subtitle || `всего: ${total}`}
      </div>
    </button>
  );
}
