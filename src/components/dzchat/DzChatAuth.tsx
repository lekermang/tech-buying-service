/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

type Mode = "login" | "register" | "reset";
type ResetStep = "check" | "newpass";

const DzChatAuth = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetStep, setResetStep] = useState<ResetStep>("check");
  const [resetToken, setResetToken] = useState("");

  const reset = (m: Mode) => {
    setMode(m); setError(""); setPhone(""); setName("");
    setPassword(""); setNewPassword(""); setNewPassword2("");
    setResetStep("check"); setResetToken("");
  };

  // ── ВОЙТИ / ЗАРЕГИСТРИРОВАТЬСЯ ────────────────────────────────
  const handleSubmit = async () => {
    if (!phone.trim() || !password.trim()) return setError("Заполните все поля");
    if (mode === "register" && !name.trim()) return setError("Введите ваше имя");
    if (mode === "register" && password.length < 6) return setError("Пароль — минимум 6 символов");
    setLoading(true); setError("");
    const res = await api(mode === "login" ? "login" : "register", "POST",
      mode === "login" ? { phone, password } : { phone, name, password });
    setLoading(false);
    if (res.error) return setError(res.error);
    const me = await api("me", "GET", undefined, res.token);
    if (rememberMe) localStorage.setItem("dzchat_token", res.token);
    else sessionStorage.setItem("dzchat_token_session", res.token);
    onAuth(res.token, me);
  };

  // ── ВОССТАНОВЛЕНИЕ: шаг 1 — проверка телефона + имени ─────────
  const handleResetCheck = async () => {
    if (!phone.trim() || !name.trim()) return setError("Введите телефон и имя аккаунта");
    setLoading(true); setError("");
    const res = await api("reset_check", "POST", { phone, name });
    setLoading(false);
    if (res.error) return setError(res.error);
    setResetToken(res.reset_token);
    setResetStep("newpass");
  };

  // ── ВОССТАНОВЛЕНИЕ: шаг 2 — новый пароль ─────────────────────
  const handleResetPassword = async () => {
    if (!newPassword.trim()) return setError("Введите новый пароль");
    if (newPassword.length < 6) return setError("Пароль — минимум 6 символов");
    if (newPassword !== newPassword2) return setError("Пароли не совпадают");
    setLoading(true); setError("");
    const res = await api("reset_password", "POST", { phone, reset_token: resetToken, new_password: newPassword });
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

        {/* ── РЕЖИМ ВОССТАНОВЛЕНИЯ ── */}
        {mode === "reset" ? (
          <div>
            <button onClick={() => reset("login")}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition-colors">
              <Icon name="ArrowLeft" size={16} /> Назад ко входу
            </button>

            {resetStep === "check" ? (
              <>
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">Восстановление доступа</h2>
                  <p className="text-white/40 text-sm mt-1">Введите телефон и имя, которые указывали при регистрации</p>
                </div>
                <div className="space-y-3">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Имя аккаунта"
                    className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                    onKeyDown={e => e.key === "Enter" && handleResetCheck()} />
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <button onClick={handleResetCheck} disabled={loading}
                    className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Icon name="Loader" size={18} className="animate-spin" /> Проверка...</> : "Продолжить"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="CheckCircle" size={18} className="text-[#25D366]" />
                    <h2 className="text-white font-semibold text-lg">Аккаунт найден</h2>
                  </div>
                  <p className="text-white/40 text-sm">Придумайте новый пароль для <span className="text-white">{phone}</span></p>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Новый пароль (мин. 6 символов)"
                      className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]" />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                      <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                    </button>
                  </div>
                  <input type={showPassword ? "text" : "password"}
                    value={newPassword2} onChange={e => setNewPassword2(e.target.value)}
                    placeholder="Повторите пароль"
                    className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                    onKeyDown={e => e.key === "Enter" && handleResetPassword()} />
                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <button onClick={handleResetPassword} disabled={loading}
                    className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Icon name="Loader" size={18} className="animate-spin" /> Сохранение...</> : "Сохранить и войти"}
                  </button>
                </div>
              </>
            )}
          </div>

        ) : (
          /* ── ВОЙТИ / РЕГИСТРАЦИЯ ── */
          <>
            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              <button onClick={() => reset("login")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "login" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
                Войти
              </button>
              <button onClick={() => reset("register")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "register" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
                Регистрация
              </button>
            </div>

            <div className="space-y-3">
              {mode === "register" && (
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]" />
              )}
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Придумайте пароль (мин. 6 символов)" : "Пароль"}
                  className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()} />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                </button>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              {/* Запомнить меня */}
              <button
                type="button"
                onClick={() => setRememberMe(v => !v)}
                className="flex items-center gap-2.5 w-full py-1 select-none">
                <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors shrink-0 ${rememberMe ? "bg-[#25D366] border-[#25D366]" : "border-white/30 bg-transparent"}`}>
                  {rememberMe && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                      <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-white/60 text-sm">Оставаться в системе</span>
              </button>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading
                  ? <><Icon name="Loader" size={18} className="animate-spin" /> Загрузка...</>
                  : mode === "login" ? "Войти" : "Создать аккаунт"}
              </button>

              {mode === "login" && (
                <button onClick={() => reset("reset")}
                  className="w-full text-white/30 hover:text-[#25D366] text-sm py-1 transition-colors">
                  Забыли пароль?
                </button>
              )}

              <p className="text-white/20 text-xs text-center pt-1">
                🔒 Пароль хранится в зашифрованном виде
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DzChatAuth;