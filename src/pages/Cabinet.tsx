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

  if (profile) return (
    <div className="min-h-screen bg-[#0D0D0D] text-white px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FFD700] flex items-center justify-center">
            <Icon name="User" size={20} className="text-black" />
          </div>
          <div>
            <div className="font-oswald font-bold text-lg text-white">Привет, {profile.full_name}!</div>
            <div className="font-roboto text-white/40 text-xs">{profile.phone}</div>
          </div>
          <button onClick={logout} className="ml-auto text-white/30 hover:text-red-400 transition-colors"><Icon name="LogOut" size={16} /></button>
        </div>

        {/* Скидка */}
        <div className="bg-[#FFD700] p-5 mb-4 text-center">
          <div className="font-oswald font-bold text-6xl text-black">{profile.discount_pct}%</div>
          <div className="font-roboto text-black/70 text-sm mt-1">Ваша персональная скидка на все услуги</div>
        </div>

        {/* Баллы */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-roboto text-white/60 text-sm">Баллы лояльности</span>
            <span className="font-oswald font-bold text-[#FFD700]">{profile.loyalty_points}</span>
          </div>
          <div className="bg-black/50 h-2 rounded-full overflow-hidden">
            <div className="bg-[#FFD700] h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="font-roboto text-white/30 text-[10px] mt-1">До следующего уровня скидки: {nextLevel - (profile.loyalty_points % 500)} баллов</div>
        </div>

        {/* Как получить больше */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4">
          <div className="font-oswald font-bold text-sm uppercase tracking-wide mb-3">Как увеличить скидку</div>
          {[
            { icon: "Wrench", text: "Оформите ремонт", bonus: "+5 баллов" },
            { icon: "ShoppingBag", text: "Купите б/у технику", bonus: "+10 баллов" },
            { icon: "UserPlus", text: "Приведите друга", bonus: "+50 баллов" },
          ].map(item => (
            <div key={item.text} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <Icon name={item.icon} size={14} className="text-[#FFD700]" />
                <span className="font-roboto text-white/70 text-sm">{item.text}</span>
              </div>
              <span className="font-roboto text-[#FFD700] text-xs">{item.bonus}</span>
            </div>
          ))}
          <div className="font-roboto text-white/30 text-[10px] mt-3">Скидка растёт до 10% по мере накопления баллов</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#FFD700] flex items-center justify-center">
            <Icon name="User" size={16} className="text-black" />
          </div>
          <div>
            <div className="font-oswald font-bold text-white uppercase tracking-wide">Личный кабинет</div>
            <div className="font-roboto text-white/40 text-xs">Скидки до 10% на все услуги</div>
          </div>
        </div>

        <div className="flex gap-1 mb-4">
          {[{ k: "form", l: "Телефон" }, { k: "yandex", l: "Яндекс" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k as typeof tab)}
              className={`flex-1 font-roboto text-xs py-2 border transition-colors ${tab === t.k ? "border-[#FFD700] text-[#FFD700]" : "border-white/10 text-white/40 hover:text-white"}`}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "form" ? (
          <div className="bg-[#1A1A1A] border border-[#333] p-5 space-y-3">
            <div>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Ваше ФИО</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Иванов Иван Иванович"
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
            <div>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Телефон *</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__" type="tel"
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
            <div>
              <label className="font-roboto text-white/40 text-xs uppercase tracking-wider block mb-1">Email (необязательно)</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="mail@example.com" type="email"
                className="w-full bg-[#0D0D0D] border border-[#444] text-white px-3 py-2.5 font-roboto text-sm focus:outline-none focus:border-[#FFD700] transition-colors" />
            </div>
            {error && <div className="text-red-400 font-roboto text-xs">{error}</div>}
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-[#FFD700] text-black font-oswald font-bold py-3 uppercase tracking-wide hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {loading ? "..." : "Войти / Зарегистрироваться"}
            </button>
            <div className="font-roboto text-white/30 text-[10px] text-center">Регистрируясь, вы получаете скидку 3% сразу</div>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#333] p-5 text-center">
            <div className="w-12 h-12 bg-[#FF0000] flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">Я</span>
            </div>
            <div className="font-oswald font-bold text-white mb-1">Войти через Яндекс</div>
            <div className="font-roboto text-white/40 text-xs mb-4">Быстрая авторизация через аккаунт Яндекса</div>
            <button disabled className="w-full bg-[#333] text-white/30 font-oswald font-bold py-3 uppercase tracking-wide cursor-not-allowed text-sm">
              Скоро доступно
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
