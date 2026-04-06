/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ── VoiceMessage ──────────────────────────────────────────────────
export const VoiceMessage = ({ url, duration, isMine }: { url: string; duration: number; isMine: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setLoadError(false);
    setPlaying(false); setProgress(0); setCurrentTime(0);
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    audio.addEventListener("timeupdate", onTime);
    return () => { audio.removeEventListener("timeupdate", onTime); };
  }, [url]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio || loadError) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      try {
        // Принудительно загружаем если не загружено
        if (audio.readyState < 2) audio.load();
        await audio.play();
        setPlaying(true);
      } catch (_e) {
        setPlaying(false);
        setLoadError(true);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        playsInline
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        onError={() => setLoadError(true)}
      />
      <button
        onClick={handlePlay}
        disabled={loadError}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity ${
          loadError ? "opacity-40" : ""
        } ${isMine ? "bg-white/20" : "bg-[#25D366]/80"}`}
        title={loadError ? "Ошибка загрузки" : undefined}>
        <Icon name={loadError ? "AlertCircle" : playing ? "Pause" : "Play"} size={16} className="text-white" />
      </button>
      <div className="flex-1">
        {loadError ? (
          <p className="text-[11px] opacity-50">Не удалось загрузить</p>
        ) : (
          <>
            <div className="relative h-1.5 rounded-full bg-white/20 cursor-pointer"
              onClick={e => {
                const audio = audioRef.current;
                if (!audio) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                audio.currentTime = pct * (audio.duration || 0);
              }}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/70" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] mt-0.5 opacity-60">{fmt(currentTime || 0)} / {fmt(duration || 0)}</p>
          </>
        )}
      </div>
    </div>
  );
};

// ── MsgStatus ─────────────────────────────────────────────────────
export const MsgStatus = ({ msg, me }: { msg: any; me: any }) => {
  if (msg.sender_id !== me.id) return null;

  // Прочитано — синие двойные галочки с анимацией
  if (msg.is_read) {
    return (
      <span
        className="inline-flex items-center ml-0.5 transition-all duration-500"
        style={{ color: "#60a5fa" }}
        title="Прочитано">
        <Icon name="CheckCheck" size={13} />
      </span>
    );
  }

  // Доставлено (серые двойные галочки)
  return (
    <span
      className="inline-flex items-center ml-0.5 opacity-40 transition-all duration-300"
      title="Доставлено">
      <Icon name="CheckCheck" size={13} />
    </span>
  );
};

// ── VoiceRecorder ─────────────────────────────────────────────────
// Приоритет: webm/opus (Chrome/Android) → mp4 (iOS Safari) → fallback
function getSupportedMime(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export const VoiceRecorder = ({ onSend, disabled }: { onSend: (b64: string, dur: number, mime: string) => void; disabled: boolean }) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef<number>(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });

      const mimeType = getSupportedMime();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      // Реальный mime из рекордера (иногда отличается)
      const actualMime = mr.mimeType || mimeType || "audio/webm";

      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const dur = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          if (!dataUrl) return;
          const b64 = dataUrl.split(",")[1];
          onSend(b64, dur, actualMime);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(250);
      mediaRef.current = mr;
      startRef.current = Date.now();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert("Нет доступа к микрофону. Проверьте настройки браузера.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancel = () => {
    if (mediaRef.current) {
      mediaRef.current.ondataavailable = null;
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
      mediaRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={cancel} className="text-white/40 hover:text-red-400 p-2"><Icon name="X" size={18} /></button>
        <span className="text-red-400 text-sm font-mono animate-pulse">⏺ {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</span>
        <button onClick={stop} className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center text-white">
          <Icon name="Send" size={16} />
        </button>
      </div>
    );
  }

  return (
    <button onMouseDown={start} disabled={disabled}
      className="text-white/50 hover:text-[#25D366] p-2 transition-colors disabled:opacity-30">
      <Icon name="Mic" size={22} />
    </button>
  );
};