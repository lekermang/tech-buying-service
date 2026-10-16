import { useEffect, useState } from "react";

export type ToastData = { id: number; text: string; action?: { label: string; run: () => void }; tone?: "ok" | "error"; ttl?: number };

export default function BottomToast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const ttl = toast.ttl ?? 5000;
    setLeft(Math.ceil(ttl / 1000));
    const iv = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    const to = setTimeout(onDone, ttl);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [toast, onDone]);

  if (!toast) return null;
  const err = toast.tone === "error";
  return (
    <div className="fixed left-0 right-0 bottom-20 md:bottom-6 z-[85] px-3 flex justify-center pointer-events-none">
      <div className={`pointer-events-auto w-full max-w-lg rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 ${err ? "bg-red-950 ring-1 ring-red-500/50" : "bg-zinc-100"}`}>
        <span className={`flex-1 text-sm ${err ? "text-red-100" : "text-zinc-900"}`}>{toast.text}</span>
        {toast.action && (
          <button onClick={() => { toast.action!.run(); onDone(); }}
            className={`shrink-0 min-h-[44px] px-4 rounded-lg text-sm font-bold ${err ? "bg-red-400 text-red-950" : "bg-zinc-900 text-white"}`}>
            {toast.action.label}{!err && left > 0 ? ` (${left})` : ""}
          </button>
        )}
      </div>
    </div>
  );
}
