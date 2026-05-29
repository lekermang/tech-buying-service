import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import InstallPwaButton from "./InstallPwaButton";

type LoginForm = { login: string; password: string };
type PinStage = { ticket: string; pin_set: boolean; role: string; full_name: string };

// ─── Animated corner brackets ────────────────────────────────────────────────
function CornerBrackets({ color = "#FFD700" }: { color?: string }) {
  const s = "absolute w-5 h-5 pointer-events-none";
  const b = `2px solid ${color}`;
  return (
    <>
      <span className={s} style={{ top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <span className={s} style={{ top: 0, right: 0, borderTop: b, borderRight: b }} />
      <span className={s} style={{ bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <span className={s} style={{ bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

// ─── Scanning line animation ──────────────────────────────────────────────────
function ScanLine({ color = "#FFD700" }: { color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
      <div
        className="absolute left-0 right-0 h-[2px] opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: "scanLine 3s linear infinite",
          top: 0,
        }}
      />
    </div>
  );
}

// ─── Glitch text ─────────────────────────────────────────────────────────────
function GlitchText({ children, color = "#FFD700" }: { children: string; color?: string }) {
  return (
    <span
      className="relative inline-block font-oswald font-black uppercase"
      style={{ color, letterSpacing: "0.1em" }}
      data-text={children}
    >
      {children}
      <span
        className="absolute inset-0 font-oswald font-black uppercase"
        style={{
          color: `${color}cc`,
          clipPath: "inset(30% 0 50% 0)",
          animation: "glitch1 4s infinite",
          left: "2px",
        }}
        aria-hidden
      >{children}</span>
      <span
        className="absolute inset-0 font-oswald font-black uppercase"
        style={{
          color: `${color}88`,
          clipPath: "inset(60% 0 20% 0)",
          animation: "glitch2 4s infinite",
          left: "-2px",
        }}
        aria-hidden
      >{children}</span>
    </span>
  );
}

// ─── Animated background ─────────────────────────────────────────────────────
function TechBackground({ accentColor = "#FFD700" }: { accentColor?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Базовый фон */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, #0a0812 0%, #050508 60%, #000 100%)" }} />

      {/* Hex-сетка */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700'/%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />

      {/* Сканирующие горизонтальные линии */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,215,0,0.3) 3px, rgba(255,215,0,0.3) 4px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Вертикальные тонкие линии */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(255,215,0,0.5) 79px, rgba(255,215,0,0.5) 80px)",
        }}
      />

      {/* Угловые свечения */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[100px]"
        style={{ background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)` }} />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)" }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div key={i}
          className="absolute rounded-full"
          style={{
            width: `${[2, 3, 2, 4, 2, 3][i]}px`,
            height: `${[2, 3, 2, 4, 2, 3][i]}px`,
            background: accentColor,
            left: `${[10, 25, 60, 75, 45, 88][i]}%`,
            top: `${[20, 65, 30, 75, 50, 15][i]}%`,
            boxShadow: `0 0 6px ${accentColor}`,
            animation: `floatParticle ${[4, 6, 5, 7, 4.5, 6.5][i]}s ease-in-out infinite`,
            animationDelay: `${[0, 1, 2, 0.5, 1.5, 2.5][i]}s`,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}

// ─── Status indicator ─────────────────────────────────────────────────────────
function StatusDot({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
      style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
      </span>
      <span className="text-green-400 font-roboto text-[10px] uppercase tracking-widest font-semibold">{label}</span>
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────────────────────
function TechInput({
  type, value, onChange, onKeyDown, placeholder, icon, label, accentColor = "#FFD700", autoFocus,
}: {
  type: string; value: string; onChange: (v: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder: string; icon: string; label: string;
  accentColor?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-roboto text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: `${accentColor}70` }}>
          {label}
        </label>
        {focused && (
          <span className="text-[9px] font-roboto uppercase tracking-widest animate-pulse"
            style={{ color: `${accentColor}60` }}>
            ACTIVE
          </span>
        )}
      </div>
      <div className="relative">
        {/* Левая полоска-акцент */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l transition-all duration-300"
          style={{
            background: focused
              ? `linear-gradient(180deg, transparent, ${accentColor}, transparent)`
              : "transparent",
            boxShadow: focused ? `0 0 8px ${accentColor}80` : "none",
          }}
        />
        <Icon name={icon} size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
          style={{ color: focused ? accentColor : `${accentColor}40` }} />
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          inputMode={type === "password" && placeholder === "••••" ? "numeric" : undefined}
          className="w-full pl-10 pr-4 py-3.5 font-roboto text-sm text-white outline-none transition-all duration-200 rounded-xl"
          style={{
            background: focused ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
            border: focused ? `1px solid ${accentColor}50` : "1px solid rgba(255,255,255,0.07)",
            boxShadow: focused ? `0 0 0 3px ${accentColor}10, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
          }}
        />
        {/* Правая угловая отметка */}
        {focused && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono"
            style={{ color: `${accentColor}50` }}>
            █
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main login button ────────────────────────────────────────────────────────
function TechButton({
  onClick, disabled, loading, children, accentColor = "#FFD700",
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  children: React.ReactNode; accentColor?: string;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      className="relative w-full overflow-hidden rounded-xl transition-all duration-150 disabled:opacity-40"
      style={{
        background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 50%, ${accentColor}99 100%)`,
        boxShadow: disabled ? "none" : `0 0 20px ${accentColor}40, 0 4px 20px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transform: pressed ? "scale(0.98)" : "scale(1)",
        padding: "14px 20px",
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
          animation: "shimmerBtn 2s infinite",
        }}
      />
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: "rgba(255,255,255,0.3)" }} />

      <span className="relative flex items-center justify-center gap-2 font-oswald font-bold uppercase tracking-wider text-sm"
        style={{ color: "#000" }}>
        {loading
          ? <><Icon name="Loader" size={16} className="animate-spin" /> <span style={{ letterSpacing: "0.2em" }}>ОБРАБОТКА...</span></>
          : children
        }
      </span>
    </button>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
export function LoginScreen({ loginForm, setLoginForm, loginError, loginLoading, onLogin }: {
  loginForm: LoginForm;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
  loginError: string;
  loginLoading: boolean;
  onLogin: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#050508" }}>

      <TechBackground accentColor="#FFD700" />

      {/* CSS для анимаций */}
      <style>{`
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes glitch1 {
          0%, 90%, 100% { transform: translate(0); opacity: 0; }
          92% { transform: translate(2px, -1px); opacity: 0.8; }
          94% { transform: translate(-1px, 1px); opacity: 0.6; }
          96% { transform: translate(1px, 0); opacity: 0.4; }
        }
        @keyframes glitch2 {
          0%, 93%, 100% { transform: translate(0); opacity: 0; }
          95% { transform: translate(-2px, 1px); opacity: 0.7; }
          97% { transform: translate(1px, -1px); opacity: 0.5; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
        }
        @keyframes shimmerBtn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>

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

// ─── PIN SCREEN ───────────────────────────────────────────────────────────────
export function PinScreen({
  pinStage, pinValue, setPinValue, pinConfirm, setPinConfirm,
  pinError, pinLoading, onVerifyPin, onCancelPin,
}: {
  pinStage: PinStage;
  pinValue: string; setPinValue: (v: string) => void;
  pinConfirm: string; setPinConfirm: (v: string) => void;
  pinError: string; pinLoading: boolean;
  onVerifyPin: () => void; onCancelPin: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const isOwnerPin = pinStage.role === "owner";
  const needConfirm = !pinStage.pin_set && !isOwnerPin;
  const accentColor = isOwnerPin ? "#FFD700" : "#60a5fa";

  const title = pinStage.pin_set ? "ВВОД PIN" : isOwnerPin ? "PIN ВЛАДЕЛЬЦА" : "СОЗДАТЬ PIN";
  const subtitle = pinStage.pin_set
    ? pinStage.full_name
    : isOwnerPin
      ? "Введите персональный PIN-код"
      : "Запомните — вводится при каждом входе";

  // PIN dots display
  const dots = Array.from({ length: 6 }, (_, i) => (
    <div key={i}
      className="w-3 h-3 rounded-full transition-all duration-200"
      style={{
        background: i < pinValue.length ? accentColor : "transparent",
        border: `1px solid ${i < pinValue.length ? accentColor : "rgba(255,255,255,0.15)"}`,
        boxShadow: i < pinValue.length ? `0 0 8px ${accentColor}80` : "none",
        transform: i < pinValue.length ? "scale(1.1)" : "scale(1)",
      }}
    />
  ));

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#050508" }}>

      <TechBackground accentColor={accentColor} />

      <style>{`
        @keyframes scanLine {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @keyframes glitch1 {
          0%, 90%, 100% { transform: translate(0); opacity: 0; }
          92% { transform: translate(2px, -1px); opacity: 0.8; }
          94% { transform: translate(-1px, 1px); opacity: 0.6; }
        }
        @keyframes glitch2 {
          0%, 93%, 100% { transform: translate(0); opacity: 0; }
          95% { transform: translate(-2px, 1px); opacity: 0.7; }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
        }
        @keyframes shimmerBtn {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes pinPulse {
          0%, 100% { box-shadow: 0 0 0 0 transparent; }
          50% { box-shadow: 0 0 0 4px rgba(96,165,250,0.15); }
        }
      `}</style>

      <div className="relative w-full max-w-[340px]"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        }}>

        {/* Брендинг */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}99 100%)`,
              boxShadow: `0 0 20px ${accentColor}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}>
            <Icon name="ShieldCheck" size={20} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <GlitchText color={accentColor}>{title}</GlitchText>
            <div className="text-[10px] font-roboto mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
              {subtitle}
            </div>
          </div>
          <StatusDot label="Secure" />
        </div>

        {/* Карточка PIN */}
        <div className="relative rounded-2xl overflow-hidden mb-4"
          style={{
            background: "linear-gradient(145deg, rgba(15,15,20,0.95), rgba(8,8,12,0.98))",
            border: `1px solid ${accentColor}20`,
            boxShadow: `0 0 0 1px ${accentColor}08, 0 24px 60px rgba(0,0,0,0.7), 0 0 40px ${accentColor}08`,
          }}>

          <div className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />

          <ScanLine color={accentColor} />

          <div className="relative p-6">
            <CornerBrackets color={`${accentColor}30`} />

            {/* Имя сотрудника */}
            {pinStage.full_name && (
              <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl"
                style={{ background: `${accentColor}0a`, border: `1px solid ${accentColor}15` }}>
                <Icon name="User" size={13} style={{ color: `${accentColor}80` }} />
                <span className="font-oswald font-bold text-sm uppercase tracking-wide" style={{ color: accentColor }}>
                  {pinStage.full_name}
                </span>
                <span className="ml-auto font-mono text-[9px]" style={{ color: `${accentColor}40` }}>
                  ID_VERIFIED
                </span>
              </div>
            )}

            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-6">
              {dots}
            </div>

            <div className="space-y-4">
              <TechInput
                type="password"
                label="PIN-код"
                placeholder="••••"
                icon="Lock"
                value={pinValue}
                onChange={v => setPinValue(v.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && onVerifyPin()}
                accentColor={accentColor}
                autoFocus
              />

              {needConfirm && (
                <TechInput
                  type="password"
                  label="Повторите PIN"
                  placeholder="••••"
                  icon="ShieldCheck"
                  value={pinConfirm}
                  onChange={v => setPinConfirm(v.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && onVerifyPin()}
                  accentColor={accentColor}
                />
              )}

              {pinError && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-roboto"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <Icon name="AlertTriangle" size={13} className="shrink-0" />
                  {pinError}
                </div>
              )}

              <TechButton onClick={onVerifyPin} disabled={pinLoading} loading={pinLoading} accentColor={accentColor}>
                <Icon name="ShieldCheck" size={15} />
                <span style={{ letterSpacing: "0.15em" }}>
                  {pinStage.pin_set ? "Подтвердить" : "Сохранить и войти"}
                </span>
              </TechButton>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${accentColor}15, transparent)` }} />
        </div>

        {/* Назад */}
        <button onClick={onCancelPin}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-roboto text-sm transition-all duration-200"
          style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.3)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
          }}>
          <Icon name="ArrowLeft" size={14} />
          Вернуться к логину
        </button>

        <div className="text-center mt-5 font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{ color: "rgba(255,255,255,0.1)" }}>
          Encrypted · Two-Factor Auth
        </div>
      </div>
    </div>
  );
}
