/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

const DzChatAuth = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  // mode: login = только телефон (вход в существующий), register = новый аккаунт
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetToForm = () => { setStep("form"); setError(""); setOtp(""); };
  const switchMode = (m: "login" | "register") => { setMode(m); setStep("form"); setError(""); setOtp(""); setPhone(""); setName(""); };

  const handleContinue = async () => {
    if (!phone.trim()) return setError("Введите номер телефона");
    if (mode === "register" && !name.trim()) return setError("Введите ваше имя");

    setLoading(true); setError("");

    if (mode === "login") {
      // Проверяем существует ли аккаунт — запрашиваем OTP
      const res = await api("login_otp", "POST", { phone });
      setLoading(false);
      if (res.error) return setError(res.error);
      setDemoOtp(res.otp || "");
      setStep("otp");
    } else {
      // Регистрация — создаём/обновляем аккаунт и запрашиваем OTP
      const res = await api("register", "POST", { phone, name });
      setLoading(false);
      if (res.error) return setError(res.error);
      setDemoOtp(res.otp || "");
      setStep("otp");
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return setError("Введите код");
    setLoading(true); setError("");
    const res = await api("verify", "POST", { phone, otp });
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
          <p className="text-white/50 text-sm mt-1">Мессенджер нового поколения</p>
        </div>

        {/* Переключатель режимов */}
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

        {step === "form" ? (
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
              onKeyDown={e => e.key === "Enter" && handleContinue()}
            />
            {mode === "login" && (
              <p className="text-white/30 text-xs text-center">
                Введите номер — вам придёт код для входа
              </p>
            )}
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleContinue} disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
              {loading ? "Отправка..." : mode === "login" ? "Получить код" : "Зарегистрироваться"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/60 text-sm text-center">
              Код подтверждения для <b className="text-white">{phone}</b>
            </p>
            {demoOtp && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-3 text-center">
                <p className="text-yellow-400 text-xs mb-1">Демо-режим: ваш код</p>
                <p className="text-yellow-300 text-2xl font-bold tracking-widest">{demoOtp}</p>
              </div>
            )}
            <input
              type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6}
              placeholder="000000"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366] text-center text-xl tracking-widest"
              onKeyDown={e => e.key === "Enter" && handleVerify()}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleVerify} disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
              {loading ? "Проверка..." : "Войти"}
            </button>
            <button onClick={resetToForm} className="w-full text-white/40 text-sm py-2">
              ← Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DzChatAuth;
