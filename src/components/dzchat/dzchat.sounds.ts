/* eslint-disable @typescript-eslint/no-explicit-any */

export const NOTIFICATION_SOUNDS = [
  { id: "default", label: "Стандартный", emoji: "🔔" },
  { id: "chime",   label: "Колокольчик", emoji: "🎵" },
  { id: "pop",     label: "Поп",         emoji: "💬" },
  { id: "ping",    label: "Пинг",        emoji: "📳" },
  { id: "none",    label: "Без звука",   emoji: "🔇" },
];

export const playNotificationSound = (soundId: string) => {
  if (soundId === "none") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (soundId === "chime") {
      osc.type = "sine"; osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc.start(); osc.stop(ctx.currentTime + 0.7);
    } else if (soundId === "pop") {
      osc.type = "sine"; osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } else if (soundId === "ping") {
      osc.type = "triangle"; osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine"; osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_e) { /* Web Audio not supported */ }
};
