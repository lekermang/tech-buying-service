import Icon from "@/components/ui/icon";
import Reveal from "@/components/skupka/Reveal";
import { ReactNode } from "react";

type IconName = Parameters<typeof Icon>[0]["name"];

type Props = {
  id?: string;
  /** Мелкая плашка с иконкой над заголовком (например «Эко-программа» / «Премиум-сервис») */
  badge?: {
    icon: IconName;
    label: string;
    color?: "gold" | "emerald" | "blue" | "rose" | "purple" | "cyan";
  };
  /** Мелкий золотой надзаголовок справа от бейджа */
  eyebrow?: string;
  /** Главный заголовок. Можно HTML-фрагмент через children */
  title?: ReactNode;
  /** Цвет декоративных blur-пятен (по умолчанию золото + изумруд как в Trade In) */
  accentA?: string;
  accentB?: string;
  /** Убрать верхнюю разделяющую линию */
  seamless?: boolean;
  /** Центрировать шапку */
  centered?: boolean;
  children: ReactNode;
  className?: string;
};

const BADGE_STYLES: Record<string, string> = {
  gold:    "bg-[#FFD700]/15 border-[#FFD700]/40 text-[#FFD700]",
  emerald: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
  blue:    "bg-sky-500/15 border-sky-500/40 text-sky-400",
  rose:    "bg-rose-500/15 border-rose-500/40 text-rose-400",
  purple:  "bg-violet-500/15 border-violet-500/40 text-violet-400",
  cyan:    "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
};

export default function PremiumSection({
  id, badge, eyebrow, title,
  accentA = "rgba(255,215,0,0.10)",
  accentB = "rgba(16,185,129,0.10)",
  seamless = false,
  centered = false,
  children,
  className = "",
}: Props) {
  const badgeStyle = BADGE_STYLES[badge?.color || "emerald"];

  return (
    <section
      id={id}
      className={`relative py-14 md:py-20 overflow-hidden ${seamless ? "" : "border-t border-[#FFD700]/10"} ${className}`}
    >
      {/* Фоновые слои — как в Trade In: градиент + два blur-круга */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${accentB} 0%, transparent 50%, ${accentA} 100%)` }}
      />
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: accentB }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ background: accentA }}
      />

      <div className="relative max-w-7xl mx-auto px-4">
        {(badge || eyebrow || title) && (
          <Reveal className={`mb-8 md:mb-12 ${centered ? "text-center flex flex-col items-center" : ""}`}>
            {(badge || eyebrow) && (
              <div className={`flex items-center gap-2 mb-2 ${centered ? "justify-center" : ""}`}>
                {badge && (
                  <span className={`inline-flex items-center gap-1.5 border font-roboto text-[10px] md:text-xs uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeStyle}`}>
                    <Icon name={badge.icon} size={12} />
                    {badge.label}
                  </span>
                )}
                {eyebrow && (
                  <span className="font-roboto text-[#FFD700] text-sm uppercase tracking-widest">{eyebrow}</span>
                )}
              </div>
            )}
            {title && (
              <h2 className="font-oswald text-3xl md:text-5xl font-bold leading-[1.05]">
                {title}
              </h2>
            )}
          </Reveal>
        )}

        {children}
      </div>
    </section>
  );
}

/** Карточка-«шаг» в стиле Trade In «Как это работает» */
export function PremiumStepCard({ children, accent = "gold" }: { children: ReactNode; accent?: "gold" | "emerald" }) {
  const glow = accent === "emerald"
    ? "from-emerald-500/20 to-[#FFD700]/20"
    : "from-[#FFD700]/20 to-emerald-500/20";
  return (
    <div className="relative">
      <div className={`absolute -inset-2 bg-gradient-to-br ${glow} blur-xl pointer-events-none`} />
      <div className="relative bg-[#0D0D0D] border border-[#FFD700]/20 p-5 md:p-7">
        {children}
      </div>
    </div>
  );
}

/** Плитка-фича: иконка + текст (в сетке преимуществ как в Trade In) */
export function PremiumFeatureTile({ icon, label, accent = "gold" }: { icon: IconName; label: string; accent?: "gold" | "emerald" }) {
  const border = accent === "emerald" ? "border-emerald-500/15 hover:border-emerald-500/40" : "border-[#FFD700]/15 hover:border-[#FFD700]/40";
  const color  = accent === "emerald" ? "text-emerald-400" : "text-[#FFD700]";
  return (
    <div className={`flex items-center gap-2 bg-[#0D0D0D] border px-3 py-2.5 transition-colors ${border}`}>
      <Icon name={icon} size={16} className={`${color} shrink-0`} />
      <span className="font-roboto text-white/80 text-xs md:text-sm">{label}</span>
    </div>
  );
}
