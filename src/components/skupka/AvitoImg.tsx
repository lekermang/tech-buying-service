import { useState, useRef, useEffect } from "react";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
};

const SHIMMER_BG =
  "linear-gradient(110deg, rgba(255,255,255,0.04) 30%, rgba(255,215,0,0.08) 50%, rgba(255,255,255,0.04) 70%)";

export default function AvitoImg({ src, alt, className = "", width = 400, sizes, priority, fit = "cover" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [inView, setInView] = useState(!!priority);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || inView || !ref.current) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "300px" },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [priority, inView]);

  // poehali CDN поддерживает параметр ?w= для on-the-fly ресайза
  const isCdn = src && src.includes("cdn.poehali.dev");
  const optimized = isCdn ? `${src}?w=${width}&q=75` : src || "";
  const tiny = isCdn ? `${src}?w=24&q=30&blur=20` : null;

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* Shimmer placeholder */}
      {!loaded && !errored && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: SHIMMER_BG,
            backgroundSize: "200% 100%",
            animation: "shimmer 2s linear infinite",
          }}
        />
      )}

      {/* Tiny blur (быстрый микро-превью пока грузится оригинал) */}
      {tiny && inView && !loaded && !errored && (
        <img
          src={tiny}
          alt=""
          aria-hidden
          className={`absolute inset-0 w-full h-full ${
            fit === "contain" ? "object-contain" : "object-cover"
          } scale-110 blur-xl opacity-90`}
        />
      )}

      {/* Полная картинка */}
      {inView && src && !errored && (
        <img
          src={optimized}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full transition-opacity duration-500 ${
            fit === "contain" ? "object-contain" : "object-cover"
          } ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] text-white/30 text-[10px]">
          фото недоступно
        </div>
      )}
    </div>
  );
}