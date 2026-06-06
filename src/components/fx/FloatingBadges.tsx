/**
 * FloatingBadges — плавающие бейджи с данными сервиса.
 * Появляются в углах hero-секции, дрейфуют вверх-вниз.
 * Современный UI-элемент: social proof прямо в hero.
 */
import Icon from "@/components/ui/icon";

const BADGES = [
  { icon: "Star",        text: "5.0",        sub: "рейтинг",       color: "#FFD700",  pos: "top-[18%] right-[4%]",  delay: 0 },
  { icon: "Zap",         text: "20 мин",     sub: "ремонт при вас", color: "#86efac",  pos: "top-[55%] right-[2%]",  delay: 0.8 },
  { icon: "BadgeCheck",  text: "Гарантия",   sub: "до 12 мес",     color: "#93c5fd",  pos: "top-[30%] left-[1%]",   delay: 1.4 },
  { icon: "Gift",        text: "0 ₽",        sub: "диагностика",   color: "#c4b5fd",  pos: "top-[68%] left-[2%]",   delay: 0.4 },
];

export default function FloatingBadges() {
  return (
    <>
      <style>{`
        @keyframes fb-float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes fb-in {
          from { opacity:0; transform:scale(0.7) translateY(12px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
      `}</style>
      {BADGES.map((b, i) => (
        <div key={i}
          className={`absolute hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl pointer-events-none select-none ${b.pos}`}
          style={{
            background: "rgba(13,13,13,0.85)",
            border: `1px solid ${b.color}30`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 4px 24px rgba(0,0,0,0.5),0 0 0 1px ${b.color}15`,
            animation: `fb-in 0.6s cubic-bezier(0.22,1,0.36,1) ${b.delay + 1.8}s both, fb-float ${3.5 + i * 0.6}s ease-in-out ${b.delay}s infinite`,
          }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: b.color + "18", border: `1px solid ${b.color}30` }}>
            <Icon name={b.icon} size={13} style={{ color: b.color }} />
          </div>
          <div>
            <div className="font-oswald font-bold text-sm text-white leading-none">{b.text}</div>
            <div className="font-roboto text-[10px] text-white/40 mt-0.5">{b.sub}</div>
          </div>
        </div>
      ))}
    </>
  );
}
