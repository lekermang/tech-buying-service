/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { CallMode, CallStatus } from "./dzchat.call.types";

// ── Круглая кнопка управления ─────────────────────────────────────
export const CallCircle = ({ icon, label, color, size = "md", onPress }: {
  icon: string; label: string; color: string; size?: "md" | "lg";
  onPress: () => void;
}) => {
  const sz = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const iconSz = size === "lg" ? 26 : 20;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onPress}
        className={`${sz} rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg`}
        style={{ background: color }}>
        <Icon name={icon as any} size={iconSz} className="text-white" />
      </button>
      <p className="text-white/40 text-[10px]">{label}</p>
    </div>
  );
};

// ── Панель кнопок для входящего звонка ───────────────────────────
interface RingingControlsProps {
  onReject: () => void;
  onAccept: () => void;
}
export const RingingControls = ({ onReject, onAccept }: RingingControlsProps) => (
  <div className="flex items-end justify-center gap-16">
    <CallCircle icon="PhoneOff" label="Отклонить" color="#ef4444" size="lg" onPress={onReject} />
    <CallCircle icon="Phone" label="Принять" color="#25D366" size="lg" onPress={onAccept} />
  </div>
);

// ── Панель PTT (рация) ─────────────────────────────────────────────
interface PTTControlsProps {
  pttActive: boolean;
  onPttPress: () => void;
  onPttRelease: () => void;
  onToggleMode: () => void;
  onEndCall: () => void;
}
export const PTTControls = ({ pttActive, onPttPress, onPttRelease, onToggleMode, onEndCall }: PTTControlsProps) => (
  <div className="flex flex-col items-center gap-3">
    <button
      onMouseDown={onPttPress} onMouseUp={onPttRelease}
      onTouchStart={e => { e.preventDefault(); onPttPress(); }}
      onTouchEnd={e => { e.preventDefault(); onPttRelease(); }}
      className="w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-2xl"
      style={{
        background: pttActive
          ? "radial-gradient(circle,#22c55e,#16a34a)"
          : "radial-gradient(circle,#1e3a2f,#152b22)",
        border: pttActive ? "3px solid #4ade80" : "3px solid #25D36640",
        boxShadow: pttActive ? "0 0 30px rgba(37,211,102,0.5)" : "none",
      }}>
      <Icon name="Mic" size={34} className="text-white" />
      <span className="text-white/80 text-[10px] font-medium tracking-wide">
        {pttActive ? "ГОВОРЮ" : "ЗАЖМИ"}
      </span>
    </button>
    <p className="text-white/30 text-xs">Удерживай для разговора</p>
    <button onClick={onToggleMode} className="text-white/40 text-xs underline">
      Вернуться к обычному звонку
    </button>
    <div className="flex justify-center mt-2">
      <CallCircle icon="PhoneOff" label="Завершить" color="#ef4444" size="lg" onPress={onEndCall} />
    </div>
  </div>
);

// ── Панель обычного звонка ─────────────────────────────────────────
interface NormalControlsProps {
  muted: boolean;
  onToggleMute: () => void;
  onToggleMode: () => void;
  onEndCall: () => void;
}
export const NormalControls = ({ muted, onToggleMute, onToggleMode, onEndCall }: NormalControlsProps) => (
  <>
    <div className="flex items-center justify-center gap-8">
      <CallCircle
        icon={muted ? "MicOff" : "Mic"}
        label={muted ? "Вкл. микр." : "Без звука"}
        color={muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"}
        onPress={onToggleMute}
      />
      <CallCircle icon="Radio" label="Рация" color="rgba(255,255,255,0.12)" onPress={onToggleMode} />
    </div>
    <div className="flex justify-center mt-2">
      <CallCircle icon="PhoneOff" label="Завершить" color="#ef4444" size="lg" onPress={onEndCall} />
    </div>
  </>
);
