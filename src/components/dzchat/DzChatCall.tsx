/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * DzChatCall — WebRTC звонок + PTT-рация + групповой чат
 * Архитектура:
 *  - 1-на-1: классический WebRTC через signaling в БД
 *  - Групповой: каждый участник соединяется с каждым (mesh)
 *  - PTT (рация): микрофон включён только пока зажата кнопка
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./dzchat.utils";
import DzChatAvatar from "./DzChatAvatar";
import Icon from "@/components/ui/icon";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
];

type CallMode = "normal" | "ptt"; // normal = обычный, ptt = рация
type CallStatus = "calling" | "ringing" | "connected" | "ended";

interface Participant {
  id: number;
  name: string;
  avatar_url?: string;
  speaking?: boolean;
}

interface Props {
  me: any;
  token: string;
  chat?: any;
  incomingCall?: any;
  onClose: () => void;
}

const DzChatCall = ({ me, token, chat, incomingCall, onClose }: Props) => {
  const [status, setStatus] = useState<CallStatus>(incomingCall ? "ringing" : "calling");
  const [callId, setCallId] = useState<number | null>(incomingCall?.id ?? null);
  const [mode, setMode] = useState<CallMode>("normal");
  const [muted, setMuted] = useState(false);
  const [pttActive, setPttActive] = useState(false); // PTT нажато
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (incomingCall) return [incomingCall.caller];
    if (chat?.partner) return [chat.partner];
    return [];
  });

  // WebRTC
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Polling
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef<ReturnType<typeof setInterval>>();
  const iceBatchRef = useRef<any[]>([]);
  const iceCalleeSeen = useRef(0);
  const iceCallerSeen = useRef(0);
  const pttLongRef = useRef<ReturnType<typeof setTimeout>>();

  // ── СТАРТ ТАЙМЕРА ──────────────────────────────────────────────
  const startTimer = () => {
    if (durationRef.current) return;
    durationRef.current = setInterval(() => setDuration(d => d + 1), 1000);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── CLEANUP ────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    clearInterval(pollRef.current);
    clearInterval(durationRef.current);
    clearTimeout(pttLongRef.current);
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  }, []);

  // ── ПРИМЕНИТЬ ICE ──────────────────────────────────────────────
  const applyICE = async (candidates: any[]) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    for (const c of candidates) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { void e; }
    }
  };

  // ── СОЗДАТЬ PC ─────────────────────────────────────────────────
  const buildPC = (cId: number, isCaller: boolean): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = async (e) => {
      if (!e.candidate) return;
      iceBatchRef.current.push(e.candidate.toJSON());
      // Дебаунс — отправляем пачкой
      setTimeout(async () => {
        if (!iceBatchRef.current.length) return;
        const batch = [...iceBatchRef.current];
        iceBatchRef.current = [];
        await api("call_ice", "POST", { call_id: cId, candidates: batch }, token).catch(() => {});
      }, 300);
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current && e.streams[0]) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setStatus("connected");
        startTimer();
      }
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        endCall(false);
      }
    };

    // Polling для синхронизации ICE и answer/offer
    pollRef.current = setInterval(async () => {
      const data = await api(`call_status&call_id=${cId}`, "GET", undefined, token).catch(() => null);
      if (!data?.call) { endCall(false); return; }
      const call = data.call;

      if (call.status === "rejected" || call.status === "ended") { endCall(false); return; }

      if (isCaller) {
        // Ждём answer
        if (call.status === "accepted" && call.answer_sdp && !pc.remoteDescription) {
          try {
            await pc.setRemoteDescription({ type: "answer", sdp: call.answer_sdp });
          } catch (e) { void e; }
        }
        // Новые ICE от callee
        const newIce = (call.ice_callee || []).slice(iceCalleeSeen.current);
        if (newIce.length) {
          iceCalleeSeen.current += newIce.length;
          await applyICE(newIce);
        }
      } else {
        // Новые ICE от caller
        const newIce = (call.ice_caller || []).slice(iceCallerSeen.current);
        if (newIce.length) {
          iceCallerSeen.current += newIce.length;
          await applyICE(newIce);
        }
      }
    }, 1500);

    return pc;
  };

  // ── ИСХОДЯЩИЙ ЗВОНОК ──────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!chat?.partner) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // PTT: сразу глушим микрофон если режим рации
      if (mode === "ptt") stream.getAudioTracks().forEach(t => { t.enabled = false; });

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const iceQueue: any[] = [];
      pc.onicecandidate = (e) => { if (e.candidate) iceQueue.push(e.candidate.toJSON()); };
      pc.ontrack = (e) => {
        if (remoteAudioRef.current && e.streams[0]) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") { setStatus("connected"); startTimer(); }
        if (["failed", "disconnected"].includes(pc.connectionState)) endCall(false);
      };

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      // Ждём ICE (максимум 2s)
      await new Promise(r => setTimeout(r, 1800));

      const res = await api("call_start", "POST", {
        chat_id: chat.id,
        callee_id: chat.partner.id,
        offer_sdp: pc.localDescription?.sdp || offer.sdp,
        call_type: "audio",
      }, token);

      if (!res.call_id) throw new Error("Сервер не ответил");
      const cId: number = res.call_id;
      setCallId(cId);

      // Отправляем накопленные ICE
      if (iceQueue.length) {
        await api("call_ice", "POST", { call_id: cId, candidates: iceQueue }, token).catch(() => {});
      }

      // Переключаем onicecandidate на онлайн-отправку
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        await api("call_ice", "POST", { call_id: cId, candidates: [e.candidate.toJSON()] }, token).catch(() => {});
      };

      // Polling
      pollRef.current = setInterval(async () => {
        const data = await api(`call_status&call_id=${cId}`, "GET", undefined, token).catch(() => null);
        if (!data?.call) { endCall(false); return; }
        const call = data.call;
        if (call.status === "rejected" || call.status === "ended") { endCall(false); return; }
        if (call.status === "accepted" && call.answer_sdp && !pc.remoteDescription) {
          try { await pc.setRemoteDescription({ type: "answer", sdp: call.answer_sdp }); } catch (e) { void e; }
        }
        const newIce = (call.ice_callee || []).slice(iceCalleeSeen.current);
        if (newIce.length) { iceCalleeSeen.current += newIce.length; await applyICE(newIce); }
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Ошибка микрофона");
      cleanup();
    }
  }, [chat, token, mode, cleanup]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ПРИНЯТЬ ВХОДЯЩИЙ ──────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      if (mode === "ptt") stream.getAudioTracks().forEach(t => { t.enabled = false; });

      const pc = buildPC(incomingCall.id, false);
      pcRef.current = pc;
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription({ type: "offer", sdp: incomingCall.offer_sdp });

      // Применяем ICE от caller
      const callerIce = incomingCall.ice_caller || [];
      iceCallerSeen.current = callerIce.length;
      for (const c of callerIce) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) { void e; }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await api("call_answer", "POST", {
        call_id: incomingCall.id,
        answer_sdp: pc.localDescription?.sdp || answer.sdp,
        accepted: true,
      }, token);

      setStatus("connected");
      startTimer();
    } catch (err: any) {
      setError(err.message || "Ошибка микрофона");
      await api("call_answer", "POST", { call_id: incomingCall.id, accepted: false }, token).catch(() => {});
      cleanup();
      onClose();
    }
  }, [incomingCall, token, mode, cleanup, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const rejectCall = async () => {
    if (incomingCall) {
      await api("call_answer", "POST", { call_id: incomingCall.id, accepted: false }, token).catch(() => {});
    }
    cleanup();
    onClose();
  };

  const endCall = useCallback(async (notify = true) => {
    if (notify && callId) {
      await api("call_end", "POST", { call_id: callId }, token).catch(() => {});
    }
    cleanup();
    onClose();
  }, [callId, token, cleanup, onClose]);

  // ── PTT: зажать / отпустить ───────────────────────────────────
  const pttPress = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = true; });
    setPttActive(true);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const pttRelease = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = false; });
    setPttActive(false);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  // ── ОБЫЧНЫЙ МЬЮТ ──────────────────────────────────────────────
  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = muted; });
    setMuted(m => !m);
  };

  // ── ПЕРЕКЛЮЧЕНИЕ РЕЖИМА ────────────────────────────────────────
  const toggleMode = () => {
    const newMode = mode === "normal" ? "ptt" : "normal";
    setMode(newMode);
    const stream = localStreamRef.current;
    if (!stream) return;
    if (newMode === "ptt") {
      stream.getAudioTracks().forEach(t => { t.enabled = false; });
      setPttActive(false);
      setMuted(false);
    } else {
      stream.getAudioTracks().forEach(t => { t.enabled = true; });
    }
  };

  // ── ИНИЦИАЛИЗАЦИЯ ─────────────────────────────────────────────
  useEffect(() => {
    if (!incomingCall && chat) startCall();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── RENDER ────────────────────────────────────────────────────
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
          <div className="flex items-end justify-center gap-16">
            <CallCircle icon="PhoneOff" label="Отклонить" color="#ef4444" size="lg" onPress={rejectCall} />
            <CallCircle icon="Phone" label="Принять" color="#25D366" size="lg" onPress={acceptCall} />
          </div>
        )}

        {/* Исходящий / активный */}
        {(status === "calling" || status === "connected") && (
          <>
            {/* Обычные кнопки */}
            {mode === "normal" && (
              <div className="flex items-center justify-center gap-8">
                <CallCircle icon={muted ? "MicOff" : "Mic"} label={muted ? "Вкл. микр." : "Без звука"}
                  color={muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)"} onPress={toggleMute} />
                <CallCircle icon="Radio" label="Рация" color="rgba(255,255,255,0.12)" onPress={toggleMode} />
              </div>
            )}

            {/* PTT кнопка рации */}
            {mode === "ptt" && status === "connected" && (
              <div className="flex flex-col items-center gap-3">
                {/* Большая кнопка PTT */}
                <button
                  onMouseDown={pttPress} onMouseUp={pttRelease}
                  onTouchStart={e => { e.preventDefault(); pttPress(); }}
                  onTouchEnd={e => { e.preventDefault(); pttRelease(); }}
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
                {/* Выйти из PTT */}
                <button onClick={toggleMode} className="text-white/40 text-xs underline">
                  Вернуться к обычному звонку
                </button>
              </div>
            )}

            {/* Кнопка завершить */}
            <div className="flex justify-center mt-2">
              <CallCircle icon="PhoneOff" label="Завершить" color="#ef4444" size="lg" onPress={() => endCall(true)} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Круглая кнопка управления ─────────────────────────────────────
const CallCircle = ({ icon, label, color, size = "md", onPress }: {
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

export default DzChatCall;