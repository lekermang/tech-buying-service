import Icon from "@/components/ui/icon";
import InstallPwaButton from "./InstallPwaButton";

type LoginForm = { login: string; password: string };
type PinStage = { ticket: string; pin_set: boolean; role: string; full_name: string };

type LoginScreenProps = {
  loginForm: LoginForm;
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>;
  loginError: string;
  loginLoading: boolean;
  onLogin: () => void;
};

export function LoginScreen({ loginForm, setLoginForm, loginError, loginLoading, onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 safe-area-inset relative overflow-hidden">
      {/* Декоративный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-blue-500/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-yellow-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
              <Icon name="Wrench" size={22} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wider text-lg">Скупка24</div>
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-wide">Панель сотрудника</div>
            </div>
          </div>
          <a href="/" title="На главную"
            className="text-white/30 hover:text-white hover:bg-white/5 transition-all p-2.5 rounded-md">
            <Icon name="ArrowLeft" size={18} />
          </a>
        </div>

        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 space-y-3.5 mb-4 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
              <Icon name="Lock" size={14} className="text-[#FFD700]" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase text-sm">Вход для сотрудников</div>
              <div className="font-roboto text-white/40 text-[10px]">Введите логин и пароль</div>
            </div>
          </div>
          {[
            { key: "login", label: "Логин", placeholder: "admin", type: "text", icon: "User" },
            { key: "password", label: "Пароль", placeholder: "••••••••", type: "password", icon: "Key" },
          ].map(f => (
            <div key={f.key}>
              <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">{f.label}</label>
              <div className="relative">
                <Icon name={f.icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type={f.type} value={(loginForm as Record<string, string>)[f.key]}
                  onChange={e => setLoginForm(p => ({ ...p, [f.key]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && onLogin()}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-roboto text-base rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
              </div>
            </div>
          ))}
          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
              <Icon name="AlertCircle" size={12} />{loginError}
            </div>
          )}
          <button onClick={onLogin} disabled={loginLoading}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3.5 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {loginLoading
              ? <><Icon name="Loader" size={16} className="animate-spin" /> Вход...</>
              : <><Icon name="LogIn" size={16} /> Войти</>}
          </button>
        </div>
        <a href="/cabinet"
          className="flex items-center justify-center gap-2 w-full border border-[#1F1F1F] text-white/50 hover:text-white hover:border-[#FFD700]/30 hover:bg-[#141414] active:scale-95 font-roboto text-sm py-3.5 rounded-md transition-all mb-3">
          <Icon name="UserPlus" size={16} />
          Зарегистрироваться как клиент
        </a>
        <div className="flex justify-center">
          <InstallPwaButton />
        </div>
      </div>
    </div>
  );
}

type PinScreenProps = {
  pinStage: PinStage;
  pinValue: string;
  setPinValue: (v: string) => void;
  pinConfirm: string;
  setPinConfirm: (v: string) => void;
  pinError: string;
  pinLoading: boolean;
  onVerifyPin: () => void;
  onCancelPin: () => void;
};

export function PinScreen({
  pinStage, pinValue, setPinValue, pinConfirm, setPinConfirm,
  pinError, pinLoading, onVerifyPin, onCancelPin,
}: PinScreenProps) {
  const isOwnerPin = pinStage.role === "owner";
  const needConfirm = !pinStage.pin_set && !isOwnerPin;
  const title = pinStage.pin_set
    ? "Введите PIN-код"
    : isOwnerPin
      ? "PIN владельца"
      : "Создайте PIN-код";
  const subtitle = pinStage.pin_set
    ? `${pinStage.full_name}`
    : isOwnerPin
      ? "Введите ваш персональный PIN"
      : "Запомните его — будете вводить при каждом входе";

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 safe-area-inset relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/[0.04] via-transparent to-blue-500/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FFD700] to-yellow-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#FFD700]/20">
            <Icon name="ShieldCheck" size={22} className="text-black" />
          </div>
          <div>
            <div className="font-oswald font-bold text-white uppercase tracking-wider text-lg">{title}</div>
            <div className="font-roboto text-white/40 text-[11px]">{subtitle}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-xl p-5 space-y-3.5 mb-4 shadow-2xl shadow-black/50">
          <div>
            <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">PIN-код</label>
            <div className="relative">
              <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                maxLength={8}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && onVerifyPin()}
                placeholder="••••"
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-oswald font-bold text-2xl tracking-[0.5em] tabular-nums rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/20 transition-all text-center"
              />
            </div>
          </div>

          {needConfirm && (
            <div>
              <label className="font-roboto text-white/40 text-[10px] uppercase tracking-wider block mb-1.5">Повторите PIN</label>
              <div className="relative">
                <Icon name="Lock" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && onVerifyPin()}
                  placeholder="••••"
                  className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-10 pr-3 py-3 font-oswald font-bold text-2xl tracking-[0.5em] tabular-nums rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/20 transition-all text-center"
                />
              </div>
            </div>
          )}

          {pinError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded px-2.5 py-2 text-red-400 font-roboto text-xs flex items-center gap-1.5">
              <Icon name="AlertCircle" size={12} />{pinError}
            </div>
          )}

          <button onClick={onVerifyPin} disabled={pinLoading}
            className="w-full bg-gradient-to-b from-[#FFD700] to-yellow-500 text-black font-oswald font-bold py-3.5 uppercase tracking-wide text-sm rounded-md shadow-lg shadow-[#FFD700]/20 hover:shadow-[#FFD700]/40 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {pinLoading
              ? <><Icon name="Loader" size={16} className="animate-spin" /> Проверяю...</>
              : <><Icon name="ShieldCheck" size={16} />{pinStage.pin_set ? "Войти" : "Сохранить и войти"}</>}
          </button>

          <button onClick={onCancelPin}
            className="w-full text-white/40 hover:text-white font-roboto text-xs py-2 flex items-center justify-center gap-1.5">
            <Icon name="ArrowLeft" size={12} /> Назад к логину
          </button>
        </div>
      </div>
    </div>
  );
}
