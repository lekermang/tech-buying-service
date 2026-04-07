/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";
import { api } from "./dzchat.utils";
import { startRingtone, playHangupSound, unlockAudio } from "./dzchat.sounds";
import { ICE_SERVERS, CallMode, CallStatus, Participant } from "./dzchat.call.types";

export function useCallWebRTC({
  me,
  token,
  chat,
  incomingCall,
  onClose,
}: {
  me: any;
  token: string;
  chat?: any;
  incomingCall?: any;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<CallStatus>(incomingCall ? "ringing" : "calling");
  const [callId, setCallId] = useState<number | null>(incomingCall?.id ?? null);
  const [mode, setMode] = useState<CallMode>("normal");
  const [muted, setMuted] = useState(false);
  const [pttActive, setPttActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (incomingCall) return [incomingCall.caller];
    if (chat?.partner) return [chat.partner];
    return [];
  });

  // WebRTC refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Polling / timer refs
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef<ReturnType<typeof setInterval>>();
  const iceBatchRef = useRef<any[]>([]);
  const iceCalleeSeen = useRef(0);
  const iceCallerSeen = useRef(0);
  const pttLongRef = useRef<ReturnType<typeof setTimeout>>();
  const stopRingtoneRef = useRef<(() => void) | null>(null);

  // ── ТАЙМЕР ─────────────────────────────────────────────────────
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
    stopRingtoneRef.current?.();
    stopRingtoneRef.current = null;
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

    pollRef.current = setInterval(async () => {
      const data = await api(`call_status&call_id=${cId}`, "GET", undefined, token).catch(() => null);
      if (!data?.call) { endCall(false); return; }
      const call = data.call;

      if (call.status === "rejected" || call.status === "ended") { endCall(false); return; }

      if (isCaller) {
        if (call.status === "accepted" && call.answer_sdp && !pc.remoteDescription) {
          try {
            await pc.setRemoteDescription({ type: "answer", sdp: call.answer_sdp });
          } catch (e) { void e; }
        }
        const newIce = (call.ice_callee || []).slice(iceCalleeSeen.current);
        if (newIce.length) {
          iceCalleeSeen.current += newIce.length;
          await applyICE(newIce);
        }
      } else {
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

      if (iceQueue.length) {
        await api("call_ice", "POST", { call_id: cId, candidates: iceQueue }, token).catch(() => {});
      }

      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        await api("call_ice", "POST", { call_id: cId, candidates: [e.candidate.toJSON()] }, token).catch(() => {});
      };

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
    playHangupSound();
    cleanup();
    onClose();
  }, [callId, token, cleanup, onClose]);

  // ── PTT ────────────────────────────────────────────────────────
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

  // ── МЬЮТ ───────────────────────────────────────────────────────
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
    unlockAudio();
    stopRingtoneRef.current = startRingtone();
    if (!incomingCall && chat) startCall();
    return cleanup;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "connected") {
      stopRingtoneRef.current?.();
      stopRingtoneRef.current = null;
    }
  }, [status]);

  return {
    // state
    status, callId, mode, muted, pttActive, duration, error, participants,
    // refs
    remoteAudioRef,
    // actions
    fmt, endCall, acceptCall, rejectCall,
    toggleMute, toggleMode, pttPress, pttRelease,
  };
}
