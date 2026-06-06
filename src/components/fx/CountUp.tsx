/**
 * CountUp — анимированный счётчик числа.
 * Запускается когда элемент появляется в viewport (IntersectionObserver).
 * Современный эффект — используется на лендингах для статистики.
 */
import { memo, useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

const CountUp = memo(function CountUp({ to, duration = 1800, suffix = "", prefix = "", decimals = 0, className = "" }: Props) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setValue(parseFloat((eased * to).toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setValue(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, to, duration, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}{decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("ru-RU")}{suffix}
    </span>
  );
});

export default CountUp;