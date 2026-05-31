import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const isStaff = window.location.pathname.startsWith("/staff") || window.location.pathname.startsWith("/admin");
  const isMobile = window.matchMedia("(pointer: coarse)").matches;

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);
  const clicking = useRef(false);
  const hovering = useRef(false);

  useEffect(() => {
    if (isStaff || isMobile) return;

    const move = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const down = () => { clicking.current = true; };
    const up = () => { clicking.current = false; };
    const checkHover = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      hovering.current = !!(el.closest("a,button,[role=button],[tabindex]"));
    };

    const animate = () => {
      const speed = 0.13;
      ring.current.x += (mouse.current.x - ring.current.x) * speed;
      ring.current.y += (mouse.current.y - ring.current.y) * speed;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mouse.current.x}px,${mouse.current.y}px) translate(-50%,-50%) scale(${clicking.current ? 0.5 : 1})`;
      }
      if (ringRef.current) {
        const scale = hovering.current ? 1.8 : clicking.current ? 0.75 : 1;
        ringRef.current.style.transform = `translate(${ring.current.x}px,${ring.current.y}px) translate(-50%,-50%) scale(${scale})`;
        ringRef.current.style.borderColor = hovering.current ? "#FFD700" : "rgba(255,215,0,0.5)";
      }
      raf.current = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mousemove", checkHover);
    document.addEventListener("mousedown", down);
    document.addEventListener("mouseup", up);
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mousemove", checkHover);
      document.removeEventListener("mousedown", down);
      document.removeEventListener("mouseup", up);
      cancelAnimationFrame(raf.current);
    };
  }, [isStaff, isMobile]);

  if (isStaff || isMobile) return null;

  return (
    <>
      <style>{`
        @media (pointer: fine) {
          body { cursor: none !important; }
          body * { cursor: none !important; }
        }
      `}</style>
      <div
        ref={dotRef}
        className="custom-cursor-dot"
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 99999,
          width: 8, height: 8, borderRadius: "50%",
          background: "#FFD700",
          pointerEvents: "none", willChange: "transform",
          boxShadow: "0 0 8px #FFD700, 0 0 16px rgba(255,215,0,0.4)",
        }}
      />
      <div
        ref={ringRef}
        className="custom-cursor-ring"
        style={{
          position: "fixed", top: 0, left: 0, zIndex: 99998,
          width: 36, height: 36, borderRadius: "50%",
          border: "1.5px solid rgba(255,215,0,0.5)",
          pointerEvents: "none", willChange: "transform",
          transition: "border-color 0.2s",
        }}
      />
    </>
  );
}
