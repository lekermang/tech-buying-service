/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

type Mode = "login" | "register";
type Step = "phone" | "code";

const DzChatAuth = ({ onAuth }: { onAuth: (token: string, user: any) => void }) => {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const resetForm = (m: Mode) => {
    setMode(m); setStep("phone");
    setPhone(""); setName(""); setCode(""); setError("");
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const t = setInterval(() => {
      setResendCooldown(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!phone.trim()) return setError("Введите номер телефона");
    if (mode === "register" && !name.trim()) return setError("Введите ваше имя");
    setLoading(true); setError("");
    const res = await api("sms_send", "POST", {
      phone: phone.trim(),
      name: name.trim(),
      mode,
    });
    setLoading(false);
    if (res.error) return setError(res.error);
    setStep("code");
    startCooldown();
  };

  const handleVerify = async () => {
    if (!code.trim() || code.length < 4) return setError("Введите код из SMS");
    setLoading(true); setError("");
    const res = await api("sms_verify", "POST", { phone: phone.trim(), code: code.trim() });
    setLoading(false);
    if (res.error) return setError(res.error);
    const me = await api("me", "GET", undefined, res.token);
    localStorage.setItem("dzchat_token", res.token);
    onAuth(res.token, me);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setCode(""); setError(""); setLoading(true);
    const res = await api("sms_send", "POST", { phone: phone.trim(), name: name.trim(), mode });
    setLoading(false);
    if (res.error) return setError(res.error);
    startCooldown();
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

        {/* Переключатель Войти / Регистрация — только на шаге phone */}
        {step === "phone" && (
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button onClick={() => resetForm("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "login" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
              Войти
            </button>
            <button onClick={() => resetForm("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "register" ? "bg-[#25D366] text-white" : "text-white/40 hover:text-white"}`}>
              Регистрация
            </button>
          </div>
        )}

        {/* ШАГ 1: телефон */}
        {step === "phone" && (
          <div className="space-y-3">
            {mode === "register" && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              />
            )}
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366]"
              onKeyDown={e => e.key === "Enter" && handleSendCode()}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Icon name="Loader" size={18} className="animate-spin" /> Отправляю...</>
                : <><Icon name="MessageSquare" size={18} /> Получить код по SMS</>}
            </button>
          </div>
        )}

        {/* ШАГ 2: ввод кода */}
        {step === "code" && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep("phone"); setCode(""); setError(""); }}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
            >
              <Icon name="ArrowLeft" size={16} /> Изменить номер
            </button>

            <div className="bg-white/5 rounded-xl p-4 text-center">
              <Icon name="Smartphone" size={28} className="text-[#25D366] mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Код отправлен на</p>
              <p className="text-[#25D366] font-bold mt-1">{phone}</p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Введите код из SMS"
              className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#25D366] text-center text-xl tracking-widest font-bold"
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              autoFocus
            />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || code.length < 4}
              className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#1da851] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <><Icon name="Loader" size={18} className="animate-spin" /> Проверяю...</>
                : <><Icon name="CheckCircle" size={18} /> Войти</>}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0 || loading}
              className="w-full text-white/40 hover:text-white text-sm transition-colors disabled:opacity-40 text-center py-1"
            >
              {resendCooldown > 0 ? `Отправить повторно через ${resendCooldown} сек.` : "Отправить код повторно"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DzChatAuth;
