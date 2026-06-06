/**
 * TypeWriter — печатающийся текст с курсором.
 * Перебирает массив фраз по кругу. Современный hero-эффект.
 */
import { useEffect, useState } from "react";

interface Props {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
}

export default function TypeWriter({
  phrases,
  typingSpeed = 65,
  deletingSpeed = 35,
  pauseMs = 1800,
  className = "",
  cursorClassName = "text-[#FFD700]",
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed === current) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && displayed === "") {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    } else if (deleting) {
      timeout = setTimeout(() => setDisplayed(s => s.slice(0, -1)), deletingSpeed);
    } else {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), typingSpeed);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIdx, phrases, typingSpeed, deletingSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span className={`inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-[blink_0.8s_step-end_infinite] ${cursorClassName}`}
        style={{ background: "currentColor" }} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  );
}
