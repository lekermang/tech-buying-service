import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

const AUTH_URL = (funcUrls as Record<string, string>)["client-auth"];

type Props = {
  onAuth: (token: string) => void;
};

type Mode = "login" | "register" | "forgot" | "reset" | "verified";

export default function ClientAuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Обработка query-параметров ?verify=... / ?reset=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = p.get("verify");
    const r = p.get("reset");
    if (v) {
      fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_email", token: v }),
      })
        .then((res) => res.json())
        .then((d) => {
          if (d.ok) {
            setMode("verified");
            setSuccess("Email подтверждён! Войди в кабинет.");
          } else {
            setError(d.error || "Ссылка устарела");
          }
        })
        .finally(() => {
          window.history.replaceState({}, "", "/client");
        });
    }
    if (r) {
      setResetToken(r);
      setMode("reset");
      window.history.replaceState({}, "", "/client");
    }
  }, []);

  const submit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      let body: Record<string, unknown> = {};
      if (mode === "login") {
        body = { action: "login", email: email.trim().toLowerCase(), password };
      } else if (mode === "register") {
        if (password !== password2) {
          setError("Пароли не совпадают");
          setLoading(false);
          return;
        }
        body = {
          action: "register",
          email: email.trim().toLowerCase(),
          password,
          full_name: fullName.trim(),
          phone: phone.trim(),
        };
      } else if (mode === "forgot") {
        body = { action: "request_reset", email: email.trim().toLowerCase() };
      } else if (mode === "reset") {
        if (password !== password2) {
          setError("Пароли не совпадают");
          setLoading(false);
          return;
        }
        body = { action: "reset_password", token: resetToken, password };
      }

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

      if (mode === "login" || mode === "register" || mode === "reset") {
        localStorage.setItem("client_token", d.token);
        onAuth(d.token);
        return;
      }
      if (mode === "forgot") {
        setSuccess("Если такой email есть — мы отправили ссылку для сброса пароля. Проверь почту.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const title = {
    login: "Вход в кабинет",
    register: "Регистрация",
    forgot: "Забыли пароль",
    reset: "Новый пароль",
    verified: "Email подтверждён",
  }[mode];

  const cta = {
    login: "Войти",
    register: "Создать аккаунт",
    forgot: "Отправить ссылку",
    reset: "Сохранить пароль",
    verified: "Войти",
  }[mode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0E0E0E] to-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/30 mb-3">
            <Icon name="UserCircle2" size={32} className="text-[#FFD700]" />
          </div>
          <h1 className="font-oswald text-2xl font-bold text-white uppercase tracking-wider">
            {title}
          </h1>
          <p className="text-sm text-white/50 mt-1">Скупка 24 · твой личный кабинет</p>
        </div>

        <div className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-6 shadow-2xl">
          {(mode === "login" || mode === "register") && (
            <div className="flex gap-2 mb-5 bg-[#0A0A0A] rounded-lg p-1">
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-2 rounded text-[13px] font-bold uppercase tracking-wider transition ${
                  mode === "login"
                    ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Войти
              </button>
              <button
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-2 rounded text-[13px] font-bold uppercase tracking-wider transition ${
                  mode === "register"
                    ? "bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Регистрация
              </button>
            </div>
          )}

          {mode === "verified" && (
            <div className="text-center py-3 mb-3">
              <Icon name="CheckCircle2" size={48} className="text-emerald-400 mx-auto mb-2" />
              <div className="text-white text-sm">{success}</div>
              <button
                onClick={() => setMode("login")}
                className="mt-4 w-full py-3 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[13px] font-bold uppercase tracking-wider hover:brightness-110"
              >
                Перейти ко входу
              </button>
            </div>
          )}

          {mode !== "verified" && (
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
                </>
              )}

              {mode !== "reset" && (
                <Field
                  label="Email"
                  icon="Mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="ivan@example.com"
                  type="email"
                />
              )}

              {(mode === "login" || mode === "register" || mode === "reset") && (
                <Field
                  label={mode === "reset" ? "Новый пароль" : "Пароль"}
                  icon="Lock"
                  value={password}
                  onChange={setPassword}
                  placeholder="Минимум 6 символов"
                  type="password"
                />
              )}

              {(mode === "register" || mode === "reset") && (
                <Field
                  label="Пароль ещё раз"
                  icon="Lock"
                  value={password2}
                  onChange={setPassword2}
                  placeholder="Повтори пароль"
                  type="password"
                />
              )}

              {error && (
                <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
                  <Icon name="AlertCircle" size={14} />
                  {error}
                </div>
              )}
              {success && (
                <div className="px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
                  <Icon name="CheckCircle" size={14} />
                  {success}
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
                  <Icon
                    name={mode === "login" ? "LogIn" : mode === "register" ? "UserPlus" : "Mail"}
                    size={16}
                  />
                )}
                {cta}
              </button>

              {mode === "login" && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[12px] text-white/40 hover:text-[#FFD700] underline"
                  >
                    Забыл пароль?
                  </button>
                </div>
              )}

              {(mode === "forgot" || mode === "reset") && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[12px] text-white/40 hover:text-[#FFD700] underline inline-flex items-center gap-1"
                  >
                    <Icon name="ArrowLeft" size={11} />
                    Назад ко входу
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "register" && (
            <div className="mt-5 pt-4 border-t border-white/5 text-center text-[11px] text-white/35">
              После регистрации мы пришлём письмо для подтверждения email
            </div>
          )}
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
      <label className="block text-[11px] text-white/50 mb-1 uppercase tracking-wider">
        {label}
      </label>
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