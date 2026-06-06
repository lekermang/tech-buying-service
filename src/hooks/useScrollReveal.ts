import { useEffect, useRef } from "react";

/**
 * Эффект 6 — Fade-in секций при скролле.
 * Добавляет класс "visible" к элементам с классом "scroll-reveal",
 * когда они попадают в зону видимости (threshold 15%).
 * Stagger задаётся через классы scroll-reveal-delay-1/2/3.
 */
export function useScrollReveal(selector = ".scroll-reveal") {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);
}
