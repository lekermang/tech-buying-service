/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

const DzChatAuth = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m: "login" | "register") => {
    setMode(m); setError(""); setPhone(""); setName(""); setPassword("");
  };

  const handleSubmit = async () => {
    if (!phone.trim() || !password.trim()) return setError("Заполните все поля");
    if (mode === "register" && !name.trim()) return setError("Введите ваше имя");
    if (mode === "register" && password.length < 6) return setError("Пароль — минимум 6 символов");

    setLoading(true); setError("");

    const action = mode === "login" ? "login" : "register";
    const body = mode === "login"
      ? { phone, password }
      : { phone, name, password };

    const res = await api(action, "POST", body);
    setLoading(false);

    if (res.error) return setError(res.error);

    const me = await api("me", "GET", undefined, res.token);
    localStorage.setItem("dzchat_token", res.token);
    onAuth(res.token, me);
  };

  return (
    <div className="min-h-screen bg-[#0f1923] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MessageCircle" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">DzChat</h1>
          <p className="text-white/40 text-sm mt-1">Безопасный мессенджер</p>
        </div>

        {/* Переключатель */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          <button onClick={() => switchMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "login" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
            Войти
          </button>
          <button onClick={() => switchMode("register")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "register" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
            Регистрация
          </button>
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
            />
          )}
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+7 (999) 000-00-00"
            className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Придумайте пароль (мин. 6 символов)" : "Пароль"}
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
            <button type="button" onClick={() => setShowPassword(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
              <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
            </button>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading
              ? <><Icon name="Loader" size={18} className="animate-spin" /> Загрузка...</>
              : mode === "login" ? "Войти" : "Создать аккаунт"
            }
          </button>

          <p className="text-white/20 text-xs text-center pt-1">
            🔒 Пароль хранится в зашифрованном виде
          </p>
        </div>
      </div>
    </div>
  );
};

export default DzChatAuth;
