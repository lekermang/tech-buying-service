import { useState, useEffect } from "react";
import { CATEGORY_PHOTOS } from "@/pages/catalog.types";

const HERO_SLIDES = [
  {
    cat: "iPhone 17/AIR/PRO/MAX",
    title: "iPhone 17 Pro Max",
    subtitle: "Titanium. Brilliant.",
    desc: "Camera Control · ProMotion · USB‑C",
    bg: "linear-gradient(135deg, #1a0a00 0%, #3d1a00 40%, #7c3500 70%, #c55800 100%)",
    photo: CATEGORY_PHOTOS["iPhone 17/AIR/PRO/MAX"] || "",
    badge: "NEW",
    color: "#f97316",
  },
  {
    cat: "Samsung S-Z",
    title: "Galaxy S26 Ultra",
    subtitle: "Built for the bold.",
    desc: "Galaxy AI · S Pen · 200MP",
    bg: "linear-gradient(135deg, #000818 0%, #001a3d 50%, #003080 100%)",
    photo: "https://3bqdrb5nxj.a.trbcdn.net/shop/media/goods/196x302/ebadf9cf-4655-47d1-8e60-58103e2934eb.jpg",
    badge: "AI",
    color: "#3b82f6",
  },
  {
    cat: "MacBook",
    title: "MacBook Air M4",
    subtitle: "Impossibly thin. Incredibly capable.",
    desc: "M4 chip · 18h battery · 13\" & 15\"",
    bg: "linear-gradient(135deg, #0a0015 0%, #200040 50%, #4a0080 100%)",
    photo: CATEGORY_PHOTOS["MacBook"] || "",
    badge: "",
    color: "#a855f7",
  },
];

const CATS = [
  { title: "iPhone 17",    cat: "iPhone 17/AIR/PRO/MAX",      accent: "#f97316" },
  { title: "iPhone 16",    cat: "iPhone 16/e/+/PRO/MAX",      accent: "#f59e0b" },
  { title: "iPhone 15",    cat: "iPhone 15/+/PRO/MAX",        accent: "#3b82f6" },
  { title: "iPhone 11–14", cat: "iPhone 11/12/13/14",         accent: "#6b7280" },
  { title: "MacBook",      cat: "MacBook",                    accent: "#8b5cf6" },
  { title: "Apple Watch",  cat: "Apple Watch",                accent: "#ef4444" },
  { title: "AirPods",      cat: "AirPods",                    accent: "#06b6d4" },
  { title: "iPad",         cat: "Apple iPad",                 accent: "#3b82f6" },
  { title: "Samsung S",    cat: "Samsung S-Z",                accent: "#1d4ed8" },
  { title: "Samsung A",    cat: "Samsung A-M",                accent: "#0ea5e9" },
  { title: "Dyson",        cat: "Dyson / Garmin",             accent: "#f97316" },
  { title: "Pixel·Honor",  cat: "Honor / PIXEL",              accent: "#16a34a" },
  { title: "POCO·Xiaomi",  cat: "POCO M-X-F",                 accent: "#f43f5e" },
  { title: "Sony·GoPro",   cat: "Sony / XBOX / GoPro",        accent: "#7c3aed" },
  { title: "OnePlus",      cat: "Realme / OnePlus / Nothing", accent: "#dc2626" },
  { title: "JBL·Яндекс",  cat: "Яндекс / JBL / Marshall",    accent: "#ca8a04" },
];

interface Props {
  onCategory: (cat: string) => void;
  activeCategory: string;
}

export default function CatalogBanners({ onCategory, activeCategory }: Props) {
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setSlide(s => (s + 1) % HERO_SLIDES.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const s = HERO_SLIDES[slide];

  return (
    <div className="bg-black select-none">

      {/* ── HERO SLIDER ── */}
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ minHeight: 220 }}
        onClick={() => onCategory(s.cat)}
      >
        {/* Background */}
        <div
          className="absolute inset-0 transition-all duration-700"
          style={{ background: s.bg }}
        />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        />

        {/* Product photo */}
        {s.photo && (
          <div className={`absolute right-0 top-0 bottom-0 w-1/2 transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
            <img
              src={s.photo}
              alt={s.title}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-[85%] w-auto object-contain drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 0 40px rgba(255,255,255,0.08))" }}
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
          </div>
        )}

        {/* Content */}
        <div className={`relative z-10 px-6 py-8 sm:py-10 max-w-sm transition-opacity duration-300 ${animating ? "opacity-0" : "opacity-100"}`}>
          {s.badge && (
            <span className="inline-block text-[10px] font-black tracking-[0.25em] uppercase px-2.5 py-1 rounded-full mb-3"
              style={{ background: `${s.color}25`, color: s.color, border: `1px solid ${s.color}40` }}>
              {s.badge}
            </span>
          )}
          <h1 className="text-white font-black text-3xl sm:text-4xl leading-none tracking-tight mb-1">{s.title}</h1>
          <p className="font-light tracking-widest text-sm mb-3" style={{ color: `${s.color}cc` }}>{s.subtitle}</p>
          <p className="text-white/40 text-xs">{s.desc}</p>

          <div className="mt-5 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-xs font-semibold">
            Смотреть цены →
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-4 left-6 flex gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setSlide(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === slide ? 20 : 6,
                height: 6,
                background: i === slide ? s.color : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── КАТЕГОРИИ ── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16">
        {CATS.map(c => {
          const photo = CATEGORY_PHOTOS[c.cat];
          const isActive = activeCategory === c.cat;
          return (
            <button
              key={c.cat}
              onClick={() => onCategory(c.cat)}
              className="relative aspect-square overflow-hidden group transition-all"
              style={{
                outline: isActive ? `2px solid ${c.accent}` : "1px solid rgba(255,255,255,0.06)",
                outlineOffset: "-1px",
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                  background: photo
                    ? "transparent"
                    : `linear-gradient(145deg, ${c.accent}30 0%, ${c.accent}08 100%)`,
                }}
              />
              {photo && (
                <img
                  src={photo}
                  alt={c.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{
                background: isActive
                  ? `linear-gradient(to top, ${c.accent}80 0%, ${c.accent}10 60%, transparent 100%)`
                  : "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)"
              }} />

              {/* Title */}
              <div className="absolute inset-x-0 bottom-0 pb-2 px-1.5 text-center">
                <div className={`font-bold leading-tight text-[8px] sm:text-[9px] transition-colors ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                  {c.title}
                </div>
              </div>

              {/* Active dot */}
              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full border-2 border-black"
                  style={{ background: c.accent }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
