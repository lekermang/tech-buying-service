import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const AUTH_CLIENT_URL = "https://functions.poehali.dev/58edd0bc-cce3-4ece-acca-a003e2260758";

type Profile = { id: number; full_name: string; phone: string; email: string; discount_pct: number; loyalty_points: number };

export default function Cabinet() {
  const [tab, setTab] = useState<"form" | "yandex">("form");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("client_token");
    if (!token) return;
    fetch(AUTH_CLIENT_URL + "?action=profile", { headers: { "X-Client-Token": token } })
      .then(r => r.json())
      .then(d => { if (d.id) setProfile(d); else localStorage.removeItem("client_token"); })
      .catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (!form.phone || !form.full_name) { setError("Укажите ФИО и телефон"); return; }
    setLoading(true); setError("");
    const res = await fetch(AUTH_CLIENT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", ...form }) });
    const data = await res.json();
    setLoading(false);
    if (data.token) { localStorage.setItem("client_token", data.token); window.location.reload(); }
    else setError(data.error || "Ошибка");
  };

  const logout = () => { localStorage.removeItem("client_token"); setProfile(null); };

  const nextLevel = Math.ceil((profile?.loyalty_points || 0) / 500) * 500;
  const progress = nextLevel > 0 ? Math.min(100, ((profile?.loyalty_points || 0) % 500) / 500 * 100) : 0;

  if (profile) {
    const initials = profile.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
    const pointsToNext = nextLevel - (profile.loyalty_points % 500);
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-md mx-auto">
          {/* Шапка */}
          <div className="flex items-center gap-3 mb-6 p-3 bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center font-oswald font-bold text-lg text-black">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#0A0A0A] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-oswald font-bold text-base text-white uppercase truncate">Привет, {profile.full_name.split(" ")[0]}!</div>
              <div className="font-roboto text-white/40 text-[11px] flex items-center gap-1.5">
                <Icon name="Phone" size={10} />{profile.phone}
              </div>
            </div>
            <button onClick={logout} title="Выйти"
              className="text-white/30 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all p-2 rounded-md">
              <Icon name="LogOut" size={16} />
            </button>
          </div>

          {/* Скидка — премиум */}
          <div className="relative bg-gradient-to-br from-[#FFD700] via-[#FFD700] to-yellow-500 p-6 mb-4 rounded-xl text-center overflow-hidden shadow-2xl shadow-[#FFD700]/20">
            <div className="absolute -top-10 -right-10 text-[160px] opacity-10 select-none">💎</div>
            <div className="relative">
              <div className="font-roboto text-black/60 text-[10px] uppercase tracking-widest mb-1">Персональная скидка</div>
              <div className="font-oswald font-bold text-7xl text-black leading-none tabular-nums">{profile.discount_pct}%</div>
              <div className="font-roboto text-black/60 text-xs mt-2">на все услуги и ремонт</div>
            </div>
          </div>

          {/* Баллы с прогресс-баром */}
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-roboto text-white/50 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="Star" size={12} className="text-[#FFD700]" />
                Баллы лояльности
              </span>
              <span className="font-oswald font-bold text-[#FFD700] text-xl tabular-nums">{profile.loyalty_points}</span>
            </div>
            <div className="relative h-2 bg-[#0A0A0A] rounded-full overflow-hidden border border-[#1F1F1F]">
              <div className="bg-gradient-to-r from-[#FFD700] to-yellow-500 h-full rounded-full transition-all shadow-lg shadow-[#FFD700]/30" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 font-roboto text-[10px]">
              <span className="text-white/40">0</span>
              <span className="text-[#FFD700]/70">до следующего уровня: <span className="font-bold tabular-nums">{pointsToNext}</span></span>
              <span className="text-white/40 tabular-nums">{nextLevel}</span>
            </div>
          </div>

          {/* Как получить больше */}
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-4">
            <div className="font-oswald font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Icon name="TrendingUp" size={14} className="text-[#FFD700]" />
              Как увеличить скидку
            </div>
            {[
              { icon: "Wrench", text: "Оформите ремонт", bonus: "+5 баллов", color: "from-blue-500/10 to-transparent" },
              { icon: "ShoppingBag", text: "Купите б/у технику", bonus: "+10 баллов", color: "from-green-500/10 to-transparent" },
              { icon: "UserPlus", text: "Приведите друга", bonus: "+50 баллов", color: "from-[#FFD700]/10 to-transparent" },
            ].map(item => (
              <div key={item.text} className={`flex items-center justify-between py-2.5 px-2 rounded-md bg-gradient-to-r ${item.color} border border-transparent hover:border-[#1F1F1F] transition-all`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                    <Icon name={item.icon} size={13} className="text-[#FFD700]" />
                  </div>
                  <span className="font-roboto text-white/80 text-sm">{item.text}</span>
                </div>
                <span className="font-oswald font-bold text-[#FFD700] text-xs tabular-nums">{item.bonus}</span>
              </div>
            ))}
            <div className="font-roboto text-white/30 text-[10px] mt-3 text-center">Скидка растёт до 10% по мере накопления баллов</div>
          </div>

          <a href="/" className="flex items-center justify-center gap-1.5 mt-4 text-white/40 hover:text-white font-roboto text-sm transition-colors">
            <Icon name="ArrowLeft" size={14} />На главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shrink-0">
            <Icon name="User" size={18} className="text-black" />
          </div>
          <div>
            <div className="font-oswald font-bold text-white uppercase tracking-wide text-base">Личный кабинет</div>
            <div className="font-roboto text-white/40 text-[11px]">Скидки до 10% на все услуги</div>
          </div>
        </div>

        <div className="flex bg-[#141414] border border-[#1F1F1F] rounded-md p-0.5 mb-4">
          {[{ k: "form", l: "Телефон", icon: "Phone" }, { k: "yandex", l: "Яндекс", icon: "Globe" }].map(t => {
            const active = tab === t.k;
            return (
              <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
                className={`flex-1 font-roboto text-xs py-2 rounded-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                  active
                    ? "bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-bold shadow-md shadow-[#FFD700]/20"
                    : "text-white/50 hover:text-white"
                }`}>
                <Icon name={t.icon} size={12} />
                {t.l}
              </button>
            );
          })}
        </div>

        {tab === "form" ? (
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 space-y-3">
            {[
              { key: "full_name", label: "Ваше ФИО", placeholder: "Иванов Иван Иванович", icon: "User", type: "text" },
              { key: "phone", label: "Телефон *", placeholder: "+7 (___) ___-__-__", icon: "Phone", type: "tel" },
              { key: "email", label: "Email (необязательно)", placeholder: "mail@example.com", icon: "Mail", type: "email" },
            ].map(f => (
              <div key={f.key}>
                <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1">{f.label}</label>
                <div className="relative">
                  <Icon name={f.icon} size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  <input
                    type={f.type}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-3 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
                </div>
              </div>
            ))}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
                <Icon name="AlertCircle" size={12} />{error}
              </div>
            )}
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3 uppercase tracking-wide rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Icon name="Loader" size={14} className="animate-spin" />Вход...</> : <><Icon name="LogIn" size={14} />Войти / Зарегистрироваться</>}
            </button>
            <div className="font-roboto text-white/30 text-[10px] text-center flex items-center justify-center gap-1">
              <Icon name="Gift" size={10} className="text-[#FFD700]/60" />
              Регистрируясь, вы получаете скидку 3% сразу
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF0000] to-red-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/20">
              <span className="text-white font-bold text-xl">Я</span>
            </div>
            <div className="font-oswald font-bold text-white mb-1">Войти через Яндекс</div>
            <div className="font-roboto text-white/40 text-xs mb-4">Быстрая авторизация через аккаунт Яндекса</div>
            <button disabled className="w-full bg-[#1F1F1F] border border-[#2A2A2A] text-white/30 font-oswald font-bold py-3 uppercase tracking-wide cursor-not-allowed rounded-md text-sm">
              Скоро доступно
            </button>
          </div>
        )}

        <a href="/" className="flex items-center justify-center gap-1.5 mt-4 text-white/40 hover:text-white font-roboto text-sm transition-colors">
          <Icon name="ArrowLeft" size={14} />На главную
        </a>
      </div>
    </div>
  );
}
