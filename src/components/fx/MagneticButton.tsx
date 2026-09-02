/**
 * MagneticButton — кнопка с магнитным эффектом:
 * при наведении следует за курсором, как будто притягивается.
 * Современный микроинтеракшн 2024-2026.
 */
import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  as?: "button" | "a";
  href?: string;
}

export default function MagneticButton({ children, className = "", strength = 0.35, onClick, as: Tag = "button", href }: Props) {
  const ref = useRef<HTMLElement>(null);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    el.style.transform = `translate(${dx}px,${dy}px) scale(1.04)`;
    el.style.transition = "transform 0.12s cubic-bezier(0.22,1,0.36,1)";
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0) scale(1)";
    el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
  };

  const props = {
    ref: ref as React.RefObject<HTMLButtonElement & HTMLAnchorElement>,
    className,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    onClick,
    ...(href ? { href } : {}),
  };

  return <Tag {...props}>{children}</Tag>;
}