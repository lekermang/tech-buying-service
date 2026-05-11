import React from "react";
import Icon from "@/components/ui/icon";
import { fmtPhone, sourceLabel, type Toast } from "./types";

type Props = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
  onTake: (id: number) => void;
};

export default function ToastsStack({ toasts, onDismiss, onTake }: Props) {
  return (
    <div className="fixed top-3 right-3 sm:top-6 sm:right-6 z-[200] flex flex-col gap-2 max-w-sm w-[calc(100vw-24px)] sm:w-[380px] pointer-events-none">
      {toasts.slice(-4).map(t => {
        const cls =
          t.level === "30min" ? "from-red-600 to-red-700 border-red-300/60 shadow-red-500/40 animate-pulse" :
          t.level === "15min" ? "from-orange-500 to-red-600 border-orange-300/50 shadow-orange-500/30" :
          t.level === "5min"  ? "from-amber-500 to-orange-600 border-amber-300/50 shadow-amber-500/30" :
                                 "from-[#FFD700] to-[#d4a017] border-[#FFE34D] shadow-[#FFD700]/30";
        const headline =
          t.level === "30min" ? "🚨 КРИТИЧНО — 30 мин без ответа!" :
          t.level === "15min" ? "🔥 Горит — 15 мин!" :
          t.level === "5min"  ? "⚠️ Не взята — 5 мин" :
                                 "📦 НОВАЯ ЗАЯВКА";
        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border-2 bg-gradient-to-br shadow-2xl text-black p-3 ${cls}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider opacity-80">
                  {headline} · #{t.lead.id} · {sourceLabel[t.lead.source] || t.lead.source}
                </div>
                <div className="font-black text-base mt-0.5 truncate">{t.lead.client_name}</div>
                <div className="font-bold text-sm">{fmtPhone(t.lead.client_phone)}</div>
                {t.lead.description && (
                  <div className="text-xs opacity-80 line-clamp-2 mt-0.5">{t.lead.description}</div>
                )}
              </div>
              <button onClick={() => onDismiss(t.id)} className="opacity-60 hover:opacity-100 shrink-0">
                <Icon name="X" size={14} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              <button
                onClick={() => onTake(t.id)}
                className="bg-black/85 text-white rounded text-[11px] font-bold py-1.5 hover:bg-black active:scale-95"
              >
                🎯 Беру
              </button>
              <a
                href={`https://wa.me/${(t.lead.client_phone || "").replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 text-white rounded text-[11px] font-bold py-1.5 hover:bg-green-700 active:scale-95 text-center"
              >
                💬 WA
              </a>
              <a
                href={`tel:+${(t.lead.client_phone || "").replace(/\D/g, "")}`}
                className="bg-blue-600 text-white rounded text-[11px] font-bold py-1.5 hover:bg-blue-700 active:scale-95 text-center"
              >
                📞 Звон.
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
