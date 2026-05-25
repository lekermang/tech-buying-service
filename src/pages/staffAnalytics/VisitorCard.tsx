/** KPI-карточка, карточка посетителя и список «На сайте сейчас». */
import Icon from "@/components/ui/icon";
import { SOURCE_LABEL, type OnlineSession } from "./api";
import { fmtDuration, hotLabel, urlPath } from "./utils";

export function Kpi({ label, value, color, icon, big }: { label: string; value: string; color: "green" | "gold" | "blue" | "orange"; icon: string; big?: boolean }) {
  const colorMap = {
    green: "text-emerald-300 border-emerald-500/30 bg-emerald-500/[0.06]",
    gold: "text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/[0.06]",
    blue: "text-blue-300 border-blue-500/30 bg-blue-500/[0.06]",
    orange: "text-orange-300 border-orange-500/30 bg-orange-500/[0.06]",
  }[color];
  return (
    <div className={`rounded-xl border p-2.5 ${colorMap}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} />
        <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</span>
      </div>
      <div className={`font-oswald font-extrabold leading-none ${big ? "text-[28px]" : "text-[22px]"}`}>{value}</div>
    </div>
  );
}

export function OnlineList({ items }: { items: OnlineSession[] }) {
  return (
    <section className="rounded-xl bg-[#101010] border border-[#1A1A1A] p-2.5 sm:p-3">
      <h3 className="flex items-center gap-2 mb-2.5">
        <Icon name="Users" size={14} className="text-[#FFD700]" />
        <span className="font-oswald font-bold text-sm uppercase tracking-wider">На сайте сейчас</span>
        <span className="text-[11px] text-white/50">{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <div className="text-center py-8 text-white/35 text-[12px]">
          <Icon name="UserX" size={20} className="inline mb-1 opacity-40" />
          <div>Никого онлайн</div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(it => <VisitorCard key={it.session_id} v={it} />)}
        </div>
      )}
    </section>
  );
}

export function VisitorCard({ v }: { v: OnlineSession }) {
  const src = SOURCE_LABEL[v.source || "direct"] || SOURCE_LABEL.direct;
  const isReturn = v.visit_count > 1;
  const path = (v.path || []).slice(-4);

  const cardCls = v.is_hot
    ? "bg-orange-500/[0.08] border-orange-500/40 hover:border-orange-500/60"
    : v.is_converted
    ? "bg-emerald-500/[0.06] border-emerald-500/30 hover:border-emerald-500/50"
    : "bg-[#0F0F0F] border-[#1F1F1F] hover:border-[#FFD700]/35";

  return (
    <a href={`/staff/analytics/visitor/${v.visitor_id}`}
      className={`block rounded-lg border px-2.5 py-2 transition active:scale-[0.99] ${cardCls}`}>
      <div className="flex items-start gap-2">
        {/* Иконка устройства */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center">
          <Icon name={v.device_type === "mobile" ? "Smartphone" : v.device_type === "tablet" ? "Tablet" : "Monitor"} size={12} className="text-white/60" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Шапка */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
              style={{ color: src.color, background: `${src.color}22`, border: `1px solid ${src.color}44` }}>
              <Icon name={src.icon} size={9} /> {src.label}
            </span>
            {v.search_query && (
              <span className="text-[10px] text-white/60 italic truncate max-w-[200px]" title={v.search_query}>
                «{v.search_query}»
              </span>
            )}
            {v.city && <span className="text-[10px] text-white/45">📍 {v.city}</span>}
            {isReturn && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-[#FFD700]/15 text-[#FFD700] text-[9px] font-bold uppercase">
                #{v.visit_count}
              </span>
            )}
            {v.is_converted && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold uppercase">
                <Icon name="CheckCircle2" size={9} /> Клиент
              </span>
            )}
            {v.is_hot && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded-full bg-orange-500/30 text-orange-200 text-[9px] font-bold uppercase animate-pulse">
                🔥 {hotLabel(v.hot_action)}
              </span>
            )}
          </div>
          {/* Путь */}
          <div className="text-[11px] text-white/75 truncate">
            {path.length === 0 ? (v.current_title || v.current_page || "—") : (
              <span>
                {path.map((p, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-white/30 mx-1">→</span>}
                    <span title={p.url}>{p.title || urlPath(p.url) || "—"}</span>
                  </span>
                ))}
              </span>
            )}
          </div>
          {/* Метаданные */}
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/40 flex-wrap">
            <span>⏱ {fmtDuration(v.time_on_site)}</span>
            <span>📄 {v.page_count}</span>
            {v.browser && <span>{v.browser}</span>}
            {v.os && <span>{v.os}</span>}
            <span className="ml-auto text-white/30 text-[9px]">ID {v.visitor_id.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
