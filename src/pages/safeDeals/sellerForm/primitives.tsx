/** Общие примитивы и хелперы для формы продавца. */
import Icon from "@/components/ui/icon";
import { type AiCheckResult } from "../api";

export type PhotoItem = { url: string; preview?: string };

export async function fileToBase64Compressed(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1] || "");
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const maxSide = 1600;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (Math.max(w, h) > maxSide) {
    const k = maxSide / Math.max(w, h);
    w = Math.round(w * k);
    h = Math.round(h * k);
  }
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl.split(",")[1] || "";
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return out.split(",")[1] || "";
}

export function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5">
      <h2 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon name={icon} size={14} /> {title}
      </h2>
      {children}
    </section>
  );
}

export function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs text-[#888] mb-1">{label}</span>
      {children}
    </label>
  );
}

export function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl px-3 py-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[#777] mb-0.5">{label}</div>
      <div className="text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

export function PriceOpt({ label, value, color, onClick, highlighted }: {
  label: string;
  value: number;
  color: string;
  onClick: () => void;
  highlighted?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`rounded-xl px-2 py-2.5 text-center transition active:scale-[0.96] ${
        highlighted ? "bg-[#FFD700]/[0.15] border-2 border-[#FFD700]" : "bg-[#1C1C1C] border border-[#2A2A2A] hover:border-[#FFD700]/40"
      }`}>
      <div className="text-[9px] uppercase tracking-wider text-[#999] mb-0.5 leading-tight">{label}</div>
      <div className="text-sm font-extrabold leading-tight" style={{ color }}>{(value || 0).toLocaleString("ru-RU")} ₽</div>
    </button>
  );
}

export function AiCheckBlock({ result }: { result: AiCheckResult }) {
  const colorCls = {
    low: { bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/30", text: "text-emerald-300", icon: "ShieldCheck" },
    medium: { bg: "bg-orange-500/[0.06]", border: "border-orange-500/30", text: "text-orange-300", icon: "AlertTriangle" },
    high: { bg: "bg-red-500/[0.06]", border: "border-red-500/30", text: "text-red-300", icon: "AlertCircle" },
    unknown: { bg: "bg-white/[0.04]", border: "border-white/15", text: "text-white/70", icon: "HelpCircle" },
  }[result.risk_level];
  const label = {
    low: "Всё отлично",
    medium: "Можно улучшить",
    high: "Есть подозрения",
    unknown: "Базовая проверка",
  }[result.risk_level];
  return (
    <div className={`mt-3 ${colorCls.bg} ${colorCls.border} border rounded-xl p-3.5`}>
      <div className={`text-xs font-bold uppercase tracking-wider ${colorCls.text} mb-2 flex items-center gap-1.5`}>
        <Icon name={colorCls.icon} size={13} /> {label}
      </div>
      <p className="text-sm text-[#ddd] mb-2">{result.summary}</p>
      {result.warnings.length > 0 && (
        <ul className="space-y-1 text-xs text-[#bbb]">
          {result.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <Icon name="AlertCircle" size={11} className={`mt-0.5 shrink-0 ${colorCls.text}`} />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
      {result.suggestions.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-[#777] mb-1">Рекомендации</div>
          <ul className="space-y-1 text-xs text-[#bbb]">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Icon name="Sparkles" size={11} className="mt-0.5 text-[#FFD700] shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
