import Icon from "@/components/ui/icon";
import type { StaffTab } from "./staffConstants";

type Props = {
  pwModal: StaffTab;
  roleColor: string;
  pwInput: string;
  pwError: string;
  setPwInput: (v: string) => void;
  setPwError: (v: string) => void;
  setPwModal: (v: null) => void;
  submitPw: () => void;
};

export default function StaffPasswordModal({
  pwModal, roleColor, pwInput, pwError,
  setPwInput, setPwError, setPwModal, submitPw,
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={() => setPwModal(null)}>
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a10 0%, #050508 100%)",
          border: `1px solid ${roleColor}40`,
          boxShadow: `0 0 0 1px ${roleColor}15, 0 32px 64px rgba(0,0,0,0.8), 0 0 60px ${roleColor}15`,
        }}>
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)`, boxShadow: `0 0 12px ${roleColor}` }} />
        <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: `${roleColor}12` }} />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(99,102,241,0.10)" }} />

        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${roleColor}15`, border: `1px solid ${roleColor}35` }}>
              <Icon name="Lock" size={18} style={{ color: roleColor }} />
            </div>
            <div className="flex-1">
              <div className="font-oswald font-bold uppercase text-base tracking-wide" style={{ color: roleColor }}>
                {pwModal === "gold" ? "Доступ к золоту" : pwModal === "employees" ? "Доступ к команде" : "Доступ к статистике"}
              </div>
              <div className="text-white/40 text-xs font-roboto mt-0.5">Введите пароль владельца</div>
            </div>
            <button onClick={() => setPwModal(null)} className="text-white/20 hover:text-white/50 transition-colors p-1">
              <Icon name="X" size={16} />
            </button>
          </div>

          <input
            type="password"
            autoFocus
            value={pwInput}
            onChange={e => { setPwInput(e.target.value); setPwError(""); }}
            onKeyDown={e => { if (e.key === "Enter") submitPw(); if (e.key === "Escape") setPwModal(null); }}
            placeholder="••••••••"
            className="w-full px-4 py-3.5 font-roboto text-base text-white placeholder:text-white/15 outline-none rounded-xl mb-3 tracking-widest transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${pwError ? "rgba(239,68,68,0.5)" : roleColor + "30"}`,
              boxShadow: pwError ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
            }}
            onFocus={e => { e.currentTarget.style.border = `1px solid ${roleColor}70`; e.currentTarget.style.boxShadow = `0 0 0 3px ${roleColor}15`; }}
            onBlur={e => { e.currentTarget.style.border = `1px solid ${pwError ? "rgba(239,68,68,0.5)" : roleColor + "30"}`; e.currentTarget.style.boxShadow = "none"; }}
          />

          {pwError && (
            <div className="text-red-400 text-xs font-roboto mb-3 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              <Icon name="AlertCircle" size={12} />{pwError}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setPwModal(null)}
              className="flex-1 py-3 rounded-xl font-roboto text-sm text-white/40 hover:text-white/60 transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              Отмена
            </button>
            <button onClick={submitPw}
              className="flex-1 py-3 rounded-xl font-oswald font-bold uppercase text-sm tracking-wide transition-all active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor}aa)`,
                color: "#000",
                boxShadow: `0 4px 20px ${roleColor}40`,
              }}>
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
