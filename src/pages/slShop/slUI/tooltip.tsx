import { useState, useRef, useEffect, useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

// ============ Премиум визуальный Tooltip ============
type TooltipPlacement = "top" | "bottom" | "left" | "right" | "auto";

export function SLTooltip({
  content, children, placement = "auto", delay = 350, maxWidth = 280, className = "", as = "inline",
}: {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  maxWidth?: number;
  className?: string;
  /** "inline" — span; "flex" — растягивается как flex-1 (для нав.табов и грид-кнопок) */
  as?: "inline" | "flex";
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; place: "top" | "bottom" | "left" | "right" }>({ top: 0, left: 0, place: "top" });

  const show = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    setOpen(false);
  };
  useEffect(() => () => { if (timerRef.current) window.clearTimeout(timerRef.current); }, []);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current || !tipRef.current) return;
    const trigger = wrapRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = 8;

    // Определяем место
    let place: "top" | "bottom" | "left" | "right" = placement === "auto" ? "top" : placement;
    if (placement === "auto") {
      if (trigger.top - tip.height - gap < 8) place = "bottom";
      else place = "top";
    }

    let top = 0, left = 0;
    if (place === "top") {
      top = trigger.top - tip.height - gap;
      left = trigger.left + trigger.width / 2 - tip.width / 2;
    } else if (place === "bottom") {
      top = trigger.bottom + gap;
      left = trigger.left + trigger.width / 2 - tip.width / 2;
    } else if (place === "left") {
      top = trigger.top + trigger.height / 2 - tip.height / 2;
      left = trigger.left - tip.width - gap;
    } else {
      top = trigger.top + trigger.height / 2 - tip.height / 2;
      left = trigger.right + gap;
    }
    // clamp
    if (left < 8) left = 8;
    if (left + tip.width > vw - 8) left = vw - tip.width - 8;
    if (top < 8) top = 8;
    if (top + tip.height > vh - 8) top = vh - tip.height - 8;
    setPos({ top, left, place });
  }, [open, placement, content]);

  const arrowCls = {
    top: "bottom-[-5px] left-1/2 -translate-x-1/2 border-t border-r rotate-[135deg]",
    bottom: "top-[-5px] left-1/2 -translate-x-1/2 border-t border-r -rotate-45",
    left: "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r rotate-45",
    right: "left-[-5px] top-1/2 -translate-y-1/2 border-t border-r -rotate-[135deg]",
  }[pos.place];

  const wrapCls = as === "flex" ? `flex-1 min-w-0 ${className}` : `inline-block ${className}`;
  return (
    <>
      <span
        ref={wrapRef}
        className={wrapCls}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={tipRef}
          role="tooltip"
          className="fixed z-[200] pointer-events-none animate-[tooltipIn_0.18s_ease-out]"
          style={{ top: pos.top, left: pos.left, maxWidth }}
        >
          <div className="relative rounded-lg bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-[#FFD700]/40 shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,215,0,0.08)_inset,0_0_18px_rgba(255,215,0,0.15)] px-2.5 py-1.5">
            {/* Золотая верхняя линия-glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/60 to-transparent rounded-t-lg" />
            <div className="text-[11px] leading-snug font-roboto text-white/90 whitespace-pre-line">{content}</div>
            {/* Стрелка */}
            <span className={`absolute w-2 h-2 bg-[#1A1A1A] border-[#FFD700]/40 ${arrowCls}`} style={{ borderTopWidth: "1px", borderRightWidth: "1px" }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
