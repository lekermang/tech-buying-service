import { useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const AUTH_URL = (funcUrls as Record<string, string>)["client-auth"];

type Props = {
  onAuth: (token: string) => void;
};

export default function ClientAuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const body =
        mode === "login"
          ? { action: "login", login: login.trim(), password }
          : {
              action: "register",
              login: login.trim(),
              password,
              full_name: fullName.trim(),
              phone: phone.trim(),
              email: email.trim() || undefined,
            };
      const r = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok || d.error) {
        setError(d.error || `Ошибка ${r.status}`);
        return;
      }
      localStorage.setItem("client_token", d.token);
      onAuth(d.token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0E0E0E] to-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/30 mb-3">
            <Icon name="UserCircle2" size={32} className="text-[#FFD700]" />
          </div>
          <h1 className="font-oswald text-2xl font-bold text-white uppercase tracking-wider">
            Кабинет клиента
          </h1>
          <p className="text-sm text-white/50 mt-1">Скупка 24 · ваш личный кабинет</p>
        </div>

        <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-2 mb-5 bg-[#0A0A0A] rounded-lg p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded text-[13px] font-bold uppercase tracking-wider transition ${
                mode === "login"
                  ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Войти
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded text-[13px] font-bold uppercase tracking-wider transition ${
                mode === "register"
                  ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <>
                <Field
                  label="Имя и фамилия"
                  icon="User"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Иван Петров"
                />
                <Field
                  label="Телефон"
                  icon="Phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                />
                <Field
                  label="Email (необязательно)"
                  icon="Mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="ivan@example.com"
                  type="email"
                />
              </>
            )}
            <Field
              label={mode === "login" ? "Логин или телефон" : "Придумайте логин"}
              icon="AtSign"
              value={login}
              onChange={setLogin}
              placeholder={mode === "login" ? "ivan_petrov или +7..." : "ivan_petrov"}
            />
            <Field
              label="Пароль"
              icon="Lock"
              value={password}
              onChange={setPassword}
              placeholder="Минимум 6 символов"
              type="password"
            />

            {error && (
              <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Icon name="Loader" size={16} className="animate-spin" />
              ) : (
                <Icon name={mode === "login" ? "LogIn" : "UserPlus"} size={16} />
              )}
              {mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 text-center text-[11px] text-white/35">
            Регистрируясь, вы соглашаетесь с условиями обработки персональных данных
          </div>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-[12px] text-white/40 hover:text-[#FFD700] underline">
            ← На главную
          </a>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-white/50 mb-1 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <Icon
          name={icon}
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          fallback="Circle"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#0A0A0A] border border-[#1F1F1F] focus:border-[#FFD700]/40 text-white pl-9 pr-3 py-2.5 rounded-lg text-[13px] focus:outline-none"
        />
      </div>
    </div>
  );
}
