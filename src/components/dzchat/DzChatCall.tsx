/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";
import Icon from "@/components/ui/icon";

// Бесплатные STUN серверы Google + Cloudflare
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

interface CallState {
  callId: number;
  status: CallStatus;
  isCaller: boolean;
  partner: { id: number; name: string; avatar_url?: string };
  callType: "audio" | "video";
}

interface Props {
  me: any;
  token: string;
  chat?: any; // если звонок из чата
  incomingCall?: any; // входящий звонок из polling
  onClose: () => void;
}

const DzChatCall = ({ me, token, chat, incomingCall, onClose }: Props) => {
  const [callState, setCallState] = useState<CallState | null>(null);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef<ReturnType<typeof setInterval>>();
  const pendingIceCaller = useRef<any[]>([]);
  const pendingIceCallee = useRef<any[]>([]);
  const iceSentRef = useRef<any[]>([]);

  // Создаём PeerConnection
  const createPC = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (e) => {
      if (e.candidate && callState?.callId) {
        const cand = e.candidate.toJSON();
        iceSentRef.current.push(cand);
        await api("call_ice", "POST", {
          call_id: callState.callId,
          candidates: [cand],
        }, token).catch(() => {});
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallState(s => s ? { ...s, status: "connected" } : s);
        setConnecting(false);
        startDurationTimer();
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        endCall(true);
      }
    };

    return pc;
  }, [callState?.callId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDurationTimer = () => {
    if (durationRef.current) return;
    durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  // Применяем ICE кандидаты партнёра
  const applyRemoteICE = async (pc: RTCPeerConnection, candidates: any[]) => {
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) { void e; }
    }
  };

  // Polling статуса звонка
  const pollCallStatus = useCallback(async (callId: number, isCaller: boolean) => {
    const data = await api(`call_status&call_id=${callId}`, "GET", undefined, token).catch(() => null);
    if (!data?.call) { endCall(false); return; }

    const call = data.call;
    const pc = pcRef.current;
    if (!pc) return;

    // Применяем ICE от партнёра
    if (isCaller) {
      const newIce = (call.ice_callee || []).slice(pendingIceCallee.current.length);
      if (newIce.length > 0) {
        pendingIceCallee.current.push(...newIce);
        if (pc.remoteDescription) await applyRemoteICE(pc, newIce);
      }
      // Caller ждёт answer
      if (call.status === "accepted" && call.answer_sdp && !pc.remoteDescription) {
        try {
          await pc.setRemoteDescription({ type: "answer", sdp: call.answer_sdp });
          await applyRemoteICE(pc, pendingIceCallee.current);
        } catch (e) { void e; }
      }
    } else {
      const newIce = (call.ice_caller || []).slice(pendingIceCaller.current.length);
      if (newIce.length > 0) {
        pendingIceCaller.current.push(...newIce);
        if (pc.remoteDescription) await applyRemoteICE(pc, newIce);
      }
    }

    if (call.status === "rejected" || call.status === "ended" || call.status === "missed") {
      endCall(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Исходящий звонок
  const startCall = useCallback(async (callType: "audio" | "video" = "audio") => {
    if (!chat) return;
    setConnecting(true);
    setCallError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          iceSentRef.current.push(e.candidate.toJSON());
        }
      };

      pc.ontrack = (e) => {
        if (remoteAudioRef.current && e.streams[0]) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallState(s => s ? { ...s, status: "connected" } : s);
          setConnecting(false);
          startDurationTimer();
        }
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          endCall(true);
        }
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      // Ждём сбора ICE (max 2s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const partner = chat.partner;
      const res = await api("call_start", "POST", {
        chat_id: chat.id,
        callee_id: partner.id,
        offer_sdp: pc.localDescription?.sdp || offer.sdp,
        call_type: callType,
      }, token);

      if (!res.call_id) throw new Error("Не удалось начать звонок");

      const callId = res.call_id;

      // Теперь отправляем ICE которые успели собраться
      if (iceSentRef.current.length > 0) {
        await api("call_ice", "POST", { call_id: callId, candidates: iceSentRef.current }, token).catch(() => {});
      }

      // Подписываемся на новые ICE
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          const cand = e.candidate.toJSON();
          iceSentRef.current.push(cand);
          await api("call_ice", "POST", { call_id: callId, candidates: [cand] }, token).catch(() => {});
        }
      };

      setCallState({
        callId,
        status: "calling",
        isCaller: true,
        partner,
        callType,
      });

      // Polling
      pollRef.current = setInterval(() => pollCallStatus(callId, true), 1500);

    } catch (err: any) {
      setCallError(err.message || "Ошибка при звонке");
      setConnecting(false);
      cleanup();
    }
  }, [chat, token, pollCallStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Принять входящий
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setConnecting(true);
    setCallError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (remoteAudioRef.current && e.streams[0]) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") {
          setCallState(s => s ? { ...s, status: "connected" } : s);
          setConnecting(false);
          startDurationTimer();
        }
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          endCall(true);
        }
      };

      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          const cand = e.candidate.toJSON();
          iceSentRef.current.push(cand);
          await api("call_ice", "POST", { call_id: incomingCall.id, candidates: [cand] }, token).catch(() => {});
        }
      };

      await pc.setRemoteDescription({ type: "offer", sdp: incomingCall.offer_sdp });

      // Применяем ICE от caller
      await applyRemoteICE(pc, incomingCall.ice_caller || []);
      pendingIceCaller.current = [...(incomingCall.ice_caller || [])];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await api("call_answer", "POST", {
        call_id: incomingCall.id,
        answer_sdp: pc.localDescription?.sdp || answer.sdp,
        accepted: true,
      }, token);

      setCallState({
        callId: incomingCall.id,
        status: "connected",
        isCaller: false,
        partner: incomingCall.caller,
        callType: incomingCall.call_type || "audio",
      });

      startDurationTimer();
      pollRef.current = setInterval(() => pollCallStatus(incomingCall.id, false), 2000);

    } catch (err: any) {
      setCallError(err.message || "Ошибка при ответе");
      setConnecting(false);
      await api("call_answer", "POST", { call_id: incomingCall.id, accepted: false }, token).catch(() => {});
      cleanup();
    }
  }, [incomingCall, token, pollCallStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const rejectCall = useCallback(async () => {
    if (incomingCall) {
      await api("call_answer", "POST", { call_id: incomingCall.id, accepted: false }, token).catch(() => {});
    }
    cleanup();
    onClose();
  }, [incomingCall, token, onClose]);  

  const endCall = useCallback(async (notify = true) => {
    if (notify && callState?.callId) {
      await api("call_end", "POST", { call_id: callState.callId }, token).catch(() => {});
    }
    cleanup();
    onClose();
  }, [callState, token, onClose]);  

  const cleanup = () => {
    clearInterval(pollRef.current);
    clearInterval(durationRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    iceSentRef.current = [];
    pendingIceCaller.current = [];
    pendingIceCallee.current = [];
  };

  // Запуск
  useEffect(() => {
    if (incomingCall) {
      // Входящий — показываем UI, ждём действия пользователя
      setCallState({
        callId: incomingCall.id,
        status: "ringing",
        isCaller: false,
        partner: incomingCall.caller,
        callType: incomingCall.call_type || "audio",
      });
    } else if (chat) {
      startCall("audio");
    }
    return cleanup;  
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Управление микрофоном
  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  const fmtDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const partner = callState?.partner || incomingCall?.caller || chat?.partner;
  const status = callState?.status;

  const statusLabel = () => {
    if (callError) return callError;
    if (connecting) return "Устанавливаем соединение...";
    if (status === "calling") return "Вызов...";
    if (status === "ringing") return "Входящий звонок";
    if (status === "connected") return fmtDuration(duration);
    return "";
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-between"
      style={{ background: "linear-gradient(160deg,#0d1f2d 0%,#0a1929 60%,#071420 100%)" }}>

      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Топ */}
      <div className="w-full flex items-center justify-end px-4 pt-12">
        <button onClick={() => endCall(true)}
          className="text-white/40 hover:text-white transition-colors">
          <Icon name="X" size={22} />
        </button>
      </div>

      {/* Центр — аватар и статус */}
      <div className="flex flex-col items-center gap-5 px-8">
        {/* Пульс-кольца при звонке */}
        <div className="relative">
          {(status === "calling" || status === "ringing") && (
            <>
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: "#25D366", transform: "scale(1.6)" }} />
              <div className="absolute inset-0 rounded-full animate-ping opacity-10"
                style={{ background: "#25D366", transform: "scale(2.0)", animationDelay: "0.3s" }} />
            </>
          )}
          <DzChatAvatar name={partner?.name || "?"} url={partner?.avatar_url} size={120} />
          {status === "connected" && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
              <Icon name="Phone" size={14} className="text-white" />
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-white font-bold text-2xl">{partner?.name}</p>
          <p className="text-white/50 text-sm mt-1">{statusLabel()}</p>
          {callError && (
            <p className="text-red-400 text-xs mt-2">{callError}</p>
          )}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="w-full px-8 pb-16">

        {/* Входящий звонок */}
        {status === "ringing" && (
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <button onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                <Icon name="PhoneOff" size={28} className="text-white" />
              </button>
              <p className="text-white/50 text-xs">Отклонить</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button onClick={acceptCall}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                style={{ background: "#25D366" }}>
                <Icon name="Phone" size={28} className="text-white" />
              </button>
              <p className="text-white/50 text-xs">Принять</p>
            </div>
          </div>
        )}

        {/* Активный / исходящий звонок */}
        {(status === "calling" || status === "connected") && (
          <div className="flex flex-col gap-6">
            {/* Доп кнопки */}
            <div className="flex items-center justify-center gap-8">
              <CallBtn icon={muted ? "MicOff" : "Mic"} label={muted ? "Вкл. микр." : "Выкл. микр."}
                active={muted} onClick={toggleMute} />
              <CallBtn icon={speakerOn ? "Volume2" : "VolumeX"} label={speakerOn ? "Динамик" : "Тихо"}
                active={!speakerOn} onClick={() => setSpeakerOn(s => !s)} />
            </div>
            {/* Завершить */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => endCall(true)}
                  className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                  <Icon name="PhoneOff" size={28} className="text-white" />
                </button>
                <p className="text-white/50 text-xs">Завершить</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CallBtn = ({ icon, label, active, onClick }: {
  icon: string; label: string; active: boolean; onClick: () => void;
}) => (
  <div className="flex flex-col items-center gap-2">
    <button onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
        active ? "bg-white/25" : "bg-white/10 hover:bg-white/20"
      }`}>
      <Icon name={icon as any} size={22} className="text-white" />
    </button>
    <p className="text-white/40 text-xs">{label}</p>
  </div>
);

export default DzChatCall;