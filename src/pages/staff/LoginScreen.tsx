import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import InstallPwaButton from "./InstallPwaButton";
import {
  LOGIN_KEYFRAMES,
  CornerBrackets,
  ScanLine,
  StatusDot,
  TechBackground,
  TechInput,
  TechButton,
} from "./loginUIPrimitives";

type LoginForm = { login: string; password: string };

type Props = {
  loginForm: LoginForm;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
  loginError: string;
  loginLoading: boolean;
  onLogin: () => void;
};

export function LoginScreen({ loginForm, setLoginForm, loginError, loginLoading, onLogin }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#050508" }}>

      <TechBackground accentColor="#FFD700" />

      <style>{LOGIN_KEYFRAMES}</style>

      <div className="relative w-full max-w-[360px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        }}>

        {/* ── Верхняя часть: брендинг ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Логотип-иконка */}
            <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #b8860b 100%)",
                boxShadow: "0 0 20px rgba(255,215,0,0.4), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}>
              <Icon name="Cpu" size={20} className="text-black" />
              <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)" }} />
            </div>
            <div>
              <div className="font-oswald font-black text-xl uppercase tracking-[0.12em]"
                style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.5)" }}>
                Скупка24
              </div>
              <div className="font-roboto text-[9px] uppercase tracking-[0.25em]" style={{ color: "rgba(255,215,0,0.4)" }}>
                Staff Terminal v2.0
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot label="Online" />
            <a href="/"
              className="p-2 rounded-lg transition-all"
              style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <Icon name="ArrowLeft" size={16} />
            </a>
          </div>
        </div>

        {/* ── Карточка входа ── */}
        <div className="relative rounded-2xl overflow-hidden mb-4"
          style={{
            background: "linear-gradient(145deg, rgba(15,15,20,0.95) 0%, rgba(8,8,12,0.98) 100%)",
            border: "1px solid rgba(255,215,0,0.12)",
            boxShadow: "0 0 0 1px rgba(255,215,0,0.05), 0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(255,215,0,0.05)",
          }}>

          {/* Верхняя неоновая полоска */}
          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)" }} />

          <ScanLine color="#FFD700" />

          {/* Corner brackets */}
          <div className="relative p-6">
            <CornerBrackets color="rgba(255,215,0,0.25)" />

            {/* Заголовок блока */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <Icon name="Lock" size={14} style={{ color: "#FFD700" }} />
              </div>
              <div>
                <div className="font-oswald font-bold text-white text-sm uppercase tracking-wider">Авторизация</div>
                <div className="text-[10px] font-roboto mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Введите учётные данные сотрудника
                </div>
              </div>
              <div className="ml-auto font-mono text-[9px] px-2 py-1 rounded"
                style={{ color: "rgba(255,215,0,0.4)", background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)" }}>
                SYS_AUTH
              </div>
            </div>

            <div className="space-y-4">
              <TechInput
                type="text"
                label="Логин"
                placeholder="username"
                icon="User"
                value={loginForm.login}
                onChange={v => setLoginForm(p => ({ ...p, login: v }))}
                onKeyDown={e => e.key === "Enter" && onLogin()}
                accentColor="#FFD700"
              />
              <TechInput
                type="password"
                label="Пароль"
                placeholder="••••••••"
                icon="Key"
                value={loginForm.password}
                onChange={v => setLoginForm(p => ({ ...p, password: v }))}
                onKeyDown={e => e.key === "Enter" && onLogin()}
                accentColor="#FFD700"
              />

              {loginError && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-roboto"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <Icon name="AlertTriangle" size={13} className="shrink-0" />
                  {loginError}
                </div>
              )}

              <TechButton onClick={onLogin} disabled={loginLoading} loading={loginLoading} accentColor="#FFD700">
                <Icon name="LogIn" size={15} />
                <span style={{ letterSpacing: "0.15em" }}>Войти в систему</span>
              </TechButton>
            </div>
          </div>

          {/* Нижняя полоска */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.15), transparent)" }} />
        </div>

        {/* ── Кнопка клиента ── */}
        <a href="/cabinet"
          className="flex items-center justify-center gap-2.5 w-full rounded-xl font-roboto text-sm py-3.5 mb-3 transition-all duration-200 group relative overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.02)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.2)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.04)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
          }}>
          <Icon name="UserPlus" size={15} />
          Регистрация клиента
          <Icon name="ChevronRight" size={13} className="ml-auto opacity-40" />
        </a>

        <div className="flex justify-center">
          <InstallPwaButton />
        </div>

        {/* Подпись */}
        <div className="text-center mt-5 font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.12)" }}>
          © 2024 Skupka24 · Secure Connection
        </div>
      </div>
    </div>
  );
}
