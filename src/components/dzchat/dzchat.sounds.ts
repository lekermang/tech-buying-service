/* eslint-disable @typescript-eslint/no-explicit-any */

export const NOTIFICATION_SOUNDS = [
  { id: "default", label: "Стандартный", emoji: "🔔" },
  { id: "chime",   label: "Колокольчик", emoji: "🎵" },
  { id: "pop",     label: "Поп",         emoji: "💬" },
  { id: "ping",    label: "Пинг",        emoji: "📳" },
  { id: "soft",    label: "Мягкий",      emoji: "🎶" },
  { id: "none",    label: "Без звука",   emoji: "🔇" },
];

// Единый AudioContext — создаём один раз и переиспользуем
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx || _ctx.state === "closed") {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _ctx;
  } catch (_e) {
    return null;
  }
}

// Разблокировать AudioContext после первого касания пользователя
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// Инициализируем разблокировку при любом тапе
if (typeof window !== "undefined") {
  const unlock = () => { unlockAudio(); };
  window.addEventListener("touchstart", unlock, { once: true, passive: true });
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

// ── Очередь звуков пока страница скрыта (Page Visibility API) ─────
let _pendingSound: string | null = null;

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && _pendingSound) {
      const s = _pendingSound;
      _pendingSound = null;
      // Небольшая задержка чтобы AudioContext успел разблокироваться
      setTimeout(() => playNotificationSoundImmediate(s), 300);
    }
  });
}

// Внутренняя функция без проверки видимости
function playNotificationSoundImmediate(soundId: string) {
  if (soundId === "none") return;
  if (soundId === "custom") {
    const url = localStorage.getItem("dzchat_custom_audio");
    if (url) { const a = new Audio(url); a.volume = 0.8; a.play().catch(() => {}); }
    return;
  }
  switch (soundId) {
    case "chime": playTone("sine", [880, 1100], 0.3, 0.8, [0, 0.25]); break;
    case "pop":   playTone("sine", [520, 260], 0.45, 0.15, [0, 0.05]); break;
    case "ping":  playTone("triangle", 1320, 0.2, 0.35); break;
    case "soft":  playTone("sine", 440, 0.18, 0.5); break;
    default:      playTone("sine", [660, 880], 0.25, 0.3, [0, 0.1]); break;
  }
}

function playTone(
  type: OscillatorType,
  freq: number | number[],
  gainVal: number,
  duration: number,
  freqTimes?: number[]
) {
  const ctx = getCtx();
  if (!ctx) return;

  const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
  resume.then(() => {
    const freqs = Array.isArray(freq) ? freq : [freq];
    const times = freqTimes ?? freqs.map((_, i) => i * (duration / freqs.length));

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);
    freqs.forEach((f, i) => {
      if (i > 0) osc.frequency.setValueAtTime(f, ctx.currentTime + times[i]);
    });

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }).catch(() => {});
}

// ── Звуки входящих уведомлений ────────────────────────────────────
export const playNotificationSound = (soundId: string) => {
  if (soundId === "none") return;
  // Вибрация (Android + некоторые iOS)
  if (localStorage.getItem("dzchat_vibrate") !== "off" && navigator.vibrate) {
    navigator.vibrate([120, 60, 80]);
  }
  // Если страница скрыта — откладываем звук до возврата
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    _pendingSound = soundId;
    return;
  }
  playNotificationSoundImmediate(soundId);
};

// ── Звук отправки сообщения ───────────────────────────────────────
export const playSendSound = () => {
  if (localStorage.getItem("dzchat_send_sound") === "off") return;

  const ctx = getCtx();
  if (!ctx) return;

  const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
  resume.then(() => {
    // Лёгкий «вжух» — короткий щелчок вверх
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }).catch(() => {});
};

// ── Звук голосового сообщения ─────────────────────────────────────
export const playVoiceSentSound = () => {
  if (localStorage.getItem("dzchat_send_sound") === "off") return;

  const ctx = getCtx();
  if (!ctx) return;

  const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
  resume.then(() => {
    // Два коротких «тик»
    [0, 0.1].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.07);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.07);
    });
  }).catch(() => {});
};

// ── Рингтон звонка (возвращает функцию-стоп) ─────────────────────
export function startRingtone(): () => void {
  const ctx = getCtx();
  if (!ctx) return () => {};

  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout>;

  const playRing = () => {
    if (stopped) return;
    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume.then(() => {
      if (stopped) return;
      // Два тона — имитация телефонного звонка
      const freqs = [480, 620];
      const now = ctx.currentTime;
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.05;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.22, start + 0.04);
        gain.gain.setValueAtTime(0.22, start + 0.35);
        gain.gain.linearRampToValueAtTime(0, start + 0.45);
        osc.start(start);
        osc.stop(start + 0.5);
      });
      // Повторяем каждые 3 сек
      timeoutId = setTimeout(playRing, 3000);
    }).catch(() => {});
  };

  playRing();
  return () => {
    stopped = true;
    clearTimeout(timeoutId);
  };
}

// ── Звук сброса/завершения звонка ────────────────────────────────
export function playHangupSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
  resume.then(() => {
    // Три нисходящих коротких тона
    [0, 0.12, 0.24].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 480 - i * 80;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.1);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.1);
    });
  }).catch(() => {});
}