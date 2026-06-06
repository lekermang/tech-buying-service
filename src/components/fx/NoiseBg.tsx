/**
 * NoiseBg — тонкий шум-оверлей поверх фона (film grain texture).
 * Анимированный SVG feTurbulence — придаёт глубину и "живость".
 * Современный эффект: используется Figma, Linear, Vercel.
 */
export default function NoiseBg({ opacity = 0.028 }: { opacity?: number }) {
  return (
    <div aria-hidden className="fixed inset-0 z-[1] pointer-events-none"
      style={{ opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="repair-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#repair-noise)" />
      </svg>
    </div>
  );
}
