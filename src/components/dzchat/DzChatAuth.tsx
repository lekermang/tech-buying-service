/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

const DzChatAuth = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!phone.trim() || !name.trim()) return setError("Введите имя и телефон");
    setLoading(true); setError("");
    const res = await api("register", "POST", { phone, name });
    setLoading(false);
    if (res.error) return setError(res.error);
    setDemoOtp(res.otp);
    setStep("otp");
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
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#25D366] rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="MessageCircle" size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">DzChat</h1>
          <p className="text-white/50 text-sm mt-1">Мессенджер нового поколения</p>
        </div>

        {step === "form" ? (
          <div className="space-y-3">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
            />
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              onKeyDown={e => e.key === "Enter" && handleRegister()}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50">
              {loading ? "Отправка..." : "Продолжить"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/60 text-sm text-center">Код подтверждения для <b className="text-white">{phone}</b></p>
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
            <button onClick={() => { setStep("form"); setError(""); setOtp(""); }} className="w-full text-white/40 text-sm py-2">
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DzChatAuth;
