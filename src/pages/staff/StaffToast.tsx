import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Icon from "@/components/ui/icon";

export type ToastKind = "success" | "error" | "info" | "warning" | "loading";

export type ToastInput = {
  kind?: ToastKind;
  title?: string;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type Toast = Required<Pick<ToastInput, "message">> & {
  id: number;
  kind: ToastKind;
  title?: string;
  duration: number;
  action?: ToastInput["action"];
  leaving?: boolean;
};

type Ctx = {
  show: (t: ToastInput) => number;
  success: (m: string, opts?: Partial<ToastInput>) => number;
  error: (m: string, opts?: Partial<ToastInput>) => number;
  info: (m: string, opts?: Partial<ToastInput>) => number;
  warning: (m: string, opts?: Partial<ToastInput>) => number;
  loading: (m: string, opts?: Partial<ToastInput>) => number;
  update: (id: number, patch: Partial<ToastInput>) => void;
  dismiss: (id: number) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

const ICONS: Record<ToastKind, string> = {
  success: "CheckCircle2",
  error: "AlertCircle",
  info: "Info",
  warning: "AlertTriangle",
  loading: "Loader",
};

const STYLES: Record<ToastKind, string> = {
  success: "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-400/40 text-emerald-100",
  error: "bg-gradient-to-r from-red-500/20 to-red-500/5 border-red-400/40 text-red-100",
  info: "bg-gradient-to-r from-blue-500/20 to-blue-500/5 border-blue-400/40 text-blue-100",
  warning: "bg-gradient-to-r from-amber-500/20 to-amber-500/5 border-amber-400/40 text-amber-100",
  loading: "bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/5 border-[#FFD700]/40 text-[#FFD700]",
};

const ICON_COLOR: Record<ToastKind, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  info: "text-blue-400",
  warning: "text-amber-400",
  loading: "text-[#FFD700]",
};

export function StaffToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const removeNow = useCallback((id: number) => {
    setItems((arr) => arr.filter((t) => t.id !== id));
    const tm = timersRef.current[id];
    if (tm) { clearTimeout(tm); delete timersRef.current[id]; }
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((arr) => arr.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => removeNow(id), 220);
  }, [removeNow]);

  const scheduleAutoDismiss = useCallback((id: number, duration: number) => {
    const prev = timersRef.current[id];
    if (prev) clearTimeout(prev);
    if (duration <= 0) return;
    timersRef.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const show = useCallback((t: ToastInput): number => {
    const id = ++idRef.current;
    const kind: ToastKind = t.kind || "info";
    const duration = t.duration ?? (kind === "error" ? 6000 : kind === "loading" ? 0 : 3500);
    const item: Toast = {
      id, kind, title: t.title, message: t.message, duration, action: t.action,
    };
    setItems((arr) => [...arr.slice(-4), item]);
    scheduleAutoDismiss(id, duration);
    return id;
  }, [scheduleAutoDismiss]);

  const update = useCallback((id: number, patch: Partial<ToastInput>) => {
    setItems((arr) => arr.map((t) => {
      if (t.id !== id) return t;
      const next: Toast = {
        ...t,
        kind: patch.kind ?? t.kind,
        title: patch.title ?? t.title,
        message: patch.message ?? t.message,
        action: patch.action ?? t.action,
        duration: patch.duration ?? t.duration,
      };
      if (patch.duration !== undefined || patch.kind !== undefined) {
        scheduleAutoDismiss(id, next.duration);
      }
      return next;
    }));
  }, [scheduleAutoDismiss]);

  useEffect(() => () => {
    Object.values(timersRef.current).forEach(clearTimeout);
  }, []);

  const ctx = useMemo<Ctx>(() => ({
    show,
    success: (m, o) => show({ ...o, kind: "success", message: m }),
    error: (m, o) => show({ ...o, kind: "error", message: m }),
    info: (m, o) => show({ ...o, kind: "info", message: m }),
    warning: (m, o) => show({ ...o, kind: "warning", message: m }),
    loading: (m, o) => show({ ...o, kind: "loading", message: m }),
    update, dismiss,
  }), [show, update, dismiss]);

  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      {/* Контейнер тостов */}
      <div
        className="fixed left-0 right-0 z-[300] flex flex-col items-center gap-2 px-3 pointer-events-none"
        style={{ bottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-md backdrop-blur-xl border shadow-2xl rounded-lg px-3.5 py-2.5 flex items-start gap-2.5 ${STYLES[t.kind]} ${
              t.leaving ? "animate-out fade-out slide-out-to-bottom-2 duration-200" : "animate-in fade-in slide-in-from-bottom-3 duration-200"
            }`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            <div className={`shrink-0 mt-0.5 ${ICON_COLOR[t.kind]}`}>
              <Icon name={ICONS[t.kind]} size={18} className={t.kind === "loading" ? "animate-spin" : ""} />
            </div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="font-oswald font-bold uppercase tracking-wide text-[12px] leading-tight text-white mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="font-roboto text-[13px] leading-snug text-white/90 break-words">
                {t.message}
              </div>
            </div>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="shrink-0 px-2 py-1 rounded font-roboto text-[11px] font-bold uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {t.action.label}
              </button>
            )}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-white/40 hover:text-white p-0.5 -mr-1 -mt-0.5 rounded transition-colors"
              aria-label="Закрыть уведомление"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useStaffToast(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Безопасный фолбек, если хук вызвали вне провайдера — не падаем
    const noop = () => 0;
    return {
      show: noop,
      success: noop, error: noop, info: noop, warning: noop, loading: noop,
      update: () => {}, dismiss: () => {},
    };
  }
  return ctx;
}
