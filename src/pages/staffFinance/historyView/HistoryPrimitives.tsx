import Icon from "@/components/ui/icon";

export const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

export const PERIOD_COLORS = [
  { line: "#FFD700", bg: "rgba(255,215,0,0.15)",  border: "rgba(255,215,0,0.4)",  text: "#FFD700"  },
  { line: "#60a5fa", bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.4)", text: "#60a5fa"  },
  { line: "#34d399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.4)", text: "#34d399"  },
  { line: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", text: "#f87171" },
];

export const SAFE_COLOR: Record<string, string> = {
  green: "#34d399", yellow: "#FFD700", red: "#f87171",
};

export function OverlayBar({ values, max, colors }: {
  values: number[]; max: number; colors: typeof PERIOD_COLORS;
}) {
  return (
    <div className="relative h-5 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      {values.map((v, i) => {
        const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
        return (
          <div key={i}
            className="absolute top-0 left-0 h-full rounded-lg transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: colors[i]?.line || "#FFD700",
              opacity: 0.35 + (values.length - i) * 0.15,
              zIndex: values.length - i,
            }}
          />
        );
      })}
      {values.map((v, i) => {
        const pct = max > 0 ? Math.min((v / max) * 100, 100) : 0;
        if (pct < 8 || v === 0) return null;
        return (
          <div key={i}
            className="absolute top-0 left-0 h-full flex items-center pl-2"
            style={{ width: `${pct}%`, zIndex: 10 + i }}
          >
            <span className="font-roboto font-bold text-[10px] text-white/90 truncate"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              {fmt(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Delta({ curr, prev }: { curr: number; prev: number | null }) {
  if (prev === null || prev === 0) return null;
  const delta = curr - prev;
  const pct = Math.abs(Math.round((delta / prev) * 100));
  const up = delta > 0;
  return (
    <span className="font-roboto text-[10px] font-semibold ml-1" style={{ color: up ? "#f87171" : "#34d399" }}>
      {up ? "▲" : "▼"}{pct}%
    </span>
  );
}

export function CompareBlock({ title, icon, iconColor, children }: {
  title: string; icon: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(12,9,5,0.97)" }}>
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Icon name={icon} size={13} style={{ color: iconColor }} />
        <span className="font-roboto text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.45)" }}>{title}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export function CompareRow({ label, color, children }: {
  label: string; color: typeof PERIOD_COLORS[0]; children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color.line, boxShadow: `0 0 6px ${color.line}` }} />
        <span className="font-roboto text-[11px] uppercase tracking-wide" style={{ color: color.text }}>{label}</span>
      </div>
      {children}
    </div>
  );
}
