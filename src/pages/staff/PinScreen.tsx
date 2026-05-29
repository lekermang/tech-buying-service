import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import {
  LOGIN_KEYFRAMES,
  CornerBrackets,
  ScanLine,
  GlitchText,
  StatusDot,
  TechBackground,
  TechInput,
  TechButton,
} from "./loginUIPrimitives";

type PinStage = { ticket: string; pin_set: boolean; role: string; full_name: string };

type Props = {
  pinStage: PinStage;
  pinValue: string; setPinValue: (v: string) => void;
  pinConfirm: string; setPinConfirm: (v: string) => void;
  pinError: string; pinLoading: boolean;
  onVerifyPin: () => void; onCancelPin: () => void;
};

export function PinScreen({
  pinStage, pinValue, setPinValue, pinConfirm, setPinConfirm,
  pinError, pinLoading, onVerifyPin, onCancelPin,
}: Props) {
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

      <style>{LOGIN_KEYFRAMES}</style>

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
