/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ── VoiceMessage ──────────────────────────────────────────────────
export const VoiceMessage = ({ url, duration, isMine }: { url: string; duration: number; isMine: boolean }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    audio.addEventListener("timeupdate", onTime);
    return () => { audio.removeEventListener("timeupdate", onTime); };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const handlePlay = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      try {
        // iOS требует setAttribute перед play()
        audioRef.current.setAttribute("playsinline", "true");
        await audioRef.current.play();
        setPlaying(true);
      } catch (_e) {
        // Попробуем заново с user gesture
        setPlaying(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      {/* audio без autoplay — iOS не позволяет */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        playsInline
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
      />
      <button onClick={handlePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isMine ? "bg-white/20" : "bg-[#25D366]/80"}`}>
        <Icon name={playing ? "Pause" : "Play"} size={16} className="text-white" />
      </button>
      <div className="flex-1">
        <div className="relative h-1.5 rounded-full bg-white/20 cursor-pointer"
          onClick={e => {
            if (!audioRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioRef.current.currentTime = pct * (audioRef.current.duration || 0);
          }}>
          <div className="absolute inset-y-0 left-0 rounded-full bg-white/70" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] mt-0.5 opacity-60">{fmt(currentTime || 0)} / {fmt(duration || 0)}</p>
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
export const VoiceRecorder = ({ onSend, disabled }: { onSend: (b64: string, dur: number, mime: string) => void; disabled: boolean }) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef<number>(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Определяем поддерживаемый формат: iOS Safari → mp4, остальные → webm
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const actualMime = mr.mimeType || "audio/webm";

      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const dur = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
        const blob = new Blob(chunksRef.current, { type: actualMime });
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          const b64 = dataUrl.split(",")[1];
          // Передаём mime чтобы бэкенд корректно сохранил расширение
          onSend(b64, dur, actualMime);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(200); // собираем чанки каждые 200мс
      mediaRef.current = mr;
      startRef.current = Date.now();
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert("Нет доступа к микрофону");
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