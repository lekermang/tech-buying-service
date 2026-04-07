 
/**
 * DzChatCall — WebRTC звонок + PTT-рация + групповой чат
 * Архитектура:
 *  - 1-на-1: классический WebRTC через signaling в БД
 *  - Групповой: каждый участник соединяется с каждым (mesh)
 *  - PTT (рация): микрофон включён только пока зажата кнопка
 */
import Icon from "@/components/ui/icon";
import DzChatAvatar from "./DzChatAvatar";
import { useCallWebRTC } from "./useCallWebRTC";
import { RingingControls, PTTControls, NormalControls } from "./DzChatCallControls";
import { CallProps } from "./dzchat.call.types";

const DzChatCall = ({ me, token, chat, incomingCall, onClose }: CallProps) => {
  const {
    status, mode, muted, pttActive, duration, error, participants,
    remoteAudioRef,
    fmt, endCall, acceptCall, rejectCall,
    toggleMute, toggleMode, pttPress, pttRelease,
  } = useCallWebRTC({ me, token, chat, incomingCall, onClose });

  const partner = participants[0];

  return (
    <div className="fixed inset-0 z-[90] flex flex-col select-none"
      style={{ background: "linear-gradient(160deg,#0d1f2d,#071420)" }}>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Верхняя полоска — с safe-area для Dynamic Island */}
      <div className="flex items-center justify-between px-5 pb-2"
        style={{ paddingTop: "max(env(safe-area-inset-top), 3.5rem)" }}>
        <div className="text-white/40 text-xs uppercase tracking-widest">
          {status === "calling" ? "Вызов" : status === "ringing" ? "Входящий" : status === "connected" ? fmt(duration) : ""}
        </div>
        <button onClick={() => endCall(true)} className="text-white/30 hover:text-white transition-colors">
          <Icon name="Minimize2" size={20} />
        </button>
      </div>

      {/* Аватар + имя */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="relative">
          {/* Пульсация при вызове */}
          {(status === "calling" || status === "ringing") && (
            <>
              <div className="absolute inset-0 rounded-full animate-ping opacity-15"
                style={{ background: "#25D366", transform: "scale(1.7)" }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-10"
                style={{ background: "#25D366", transform: "scale(2.2)", animationDelay: "0.4s" }} />
            </>
          )}
          {/* Подсветка PTT */}
          {pttActive && (
            <div className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 0 8px rgba(37,211,102,0.4), 0 0 0 16px rgba(37,211,102,0.2)" }} />
          )}
          <DzChatAvatar name={partner?.name || "?"} url={partner?.avatar_url} size={120} />
        </div>

        <div className="text-center">
          <p className="text-white font-bold text-2xl leading-tight">{partner?.name || "Неизвестный"}</p>
          <p className="text-white/40 text-sm mt-1">
            {error
              ? <span className="text-red-400">{error}</span>
              : status === "calling" ? "Ожидаем ответа..."
              : status === "ringing" ? "Голосовой звонок"
              : status === "connected"
                ? mode === "ptt"
                  ? pttActive ? "🎙 Говоришь..." : "Зажми кнопку чтобы говорить"
                  : muted ? "🔇 Микрофон выключен" : "Соединено"
                : ""}
          </p>
        </div>

        {/* Метка режима */}
        {status === "connected" && (
          <div className="flex items-center gap-2 bg-white/8 rounded-full px-4 py-1.5">
            <Icon name={mode === "ptt" ? "Radio" : "Phone"} size={13} className="text-white/50" />
            <span className="text-white/50 text-xs">
              {mode === "ptt" ? "Режим рации" : "Обычный звонок"}
            </span>
          </div>
        )}
      </div>

      {/* Кнопки управления */}
      <div className="px-6 space-y-5" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 4rem)" }}>

        {/* Входящий: принять / отклонить */}
        {status === "ringing" && (
          <RingingControls onReject={rejectCall} onAccept={acceptCall} />
        )}

        {/* Исходящий / активный */}
        {(status === "calling" || status === "connected") && (
          <>
            {mode === "normal" && (
              <NormalControls
                muted={muted}
                onToggleMute={toggleMute}
                onToggleMode={toggleMode}
                onEndCall={() => endCall(true)}
              />
            )}

            {mode === "ptt" && status === "connected" && (
              <PTTControls
                pttActive={pttActive}
                onPttPress={pttPress}
                onPttRelease={pttRelease}
                onToggleMode={toggleMode}
                onEndCall={() => endCall(true)}
              />
            )}

            {/* Кнопка завершить в режиме исходящего (пока не соединились) */}
            {status === "calling" && (
              <div className="flex justify-center mt-2">
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => endCall(true)}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-lg"
                    style={{ background: "#ef4444" }}>
                    <Icon name="PhoneOff" size={26} className="text-white" />
                  </button>
                  <p className="text-white/40 text-[10px]">Завершить</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DzChatCall;
