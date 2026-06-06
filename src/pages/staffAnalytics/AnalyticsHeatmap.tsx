/** Тепловая карта кликов — топ data-track элементов + топ страниц. */
import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { ANALYTICS_URL } from "./api";

type HeatItem = { track: string; text: string | null; page_url: string | null; clicks: number; sessions: number; pct: number };
type TopPage  = { page_url: string; clicks: number };
type Period   = "today" | "7d" | "30d";

async function fetchHeatmap(token: string, period: Period) {
  const r = await fetch(`${ANALYTICS_URL}?action=heatmap&period=${period}`, { headers: { "X-Employee-Token": token } });
  const d = await r.json();
  return { items: (d.items || []) as HeatItem[], top_pages: (d.top_pages || []) as TopPage[], total: d.total_clicks || 0 };
}

function heat(pct: number) {
  if (pct >= 20) return { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444" };
  if (pct >= 10) return { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.35)", text: "#f97316" };
  if (pct >= 5)  return { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.35)",  text: "#eab308" };
  return           { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.25)",  text: "#22c55e" };
}

function PathLabel({ url }: { url: string | null }) {
  if (!url) return <span className="text-white/25">—</span>;
  try { return <span className="text-white/40 text-[10px]">{new URL(url).pathname || "/"}</span>; }
  catch { return <span className="text-white/40 text-[10px]">{url.slice(0, 30)}</span>; }
}

export default function AnalyticsHeatmap({ token }: { token: string }) {
  const [period, setPeriod] = useState<Period>("today");
  const [items, setItems] = useState<HeatItem[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"elements" | "pages">("elements");

  useEffect(() => {
    setLoading(true);
    fetchHeatmap(token, period).then(d => { setItems(d.items); setTopPages(d.top_pages); setTotal(d.total); setLoading(false); });
  }, [token, period]);

  const maxClicks = Math.max(...items.map(i => i.clicks), 1);

  return (
    <div className="rounded-xl bg-[#101010] border border-[#1A1A1A] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A1A]">
        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
          <Icon name="MousePointerClick" size={14} className="text-red-400" />
        </div>
        <span className="font-oswald uppercase font-bold text-[13px] tracking-wide flex-1">Клики и элементы</span>
        <span className="text-[10px] text-white/30">{total.toLocaleString("ru")} кликов</span>
        <div className="flex rounded overflow-hidden border border-[#2A2A2A] text-[10px]">
          {(["today", "7d", "30d"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2 py-1 font-bold uppercase transition-all ${period === p ? "bg-red-500/20 text-red-300" : "bg-[#1A1A1A] text-white/40 hover:text-white/70"}`}>
              {p === "today" ? "Сег." : p}
            </button>
          ))}
        </div>
      </div>

      {/* Подвкладки */}
      <div className="flex border-b border-[#1A1A1A]">
        {[{ k: "elements" as const, label: "Элементы" }, { k: "pages" as const, label: "Страницы" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${tab === t.k ? "text-red-300 border-b-2 border-red-400" : "text-white/40 hover:text-white/70"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3 max-h-72 overflow-y-auto scrollbar-none">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="Loader2" size={18} className="text-white/30 animate-spin" />
          </div>
        ) : tab === "elements" ? (
          items.length === 0 ? (
            <div className="text-center text-white/25 text-xs py-6">Нет данных — нужны клики с атрибутом data-track</div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {items.map((item, i) => {
                const style = heat(item.pct);
                const barW = (item.clicks / maxClicks) * 100;
                return (
                  <div key={i} className="relative rounded-lg overflow-hidden px-3 py-2"
                    style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                    <div className="absolute left-0 top-0 bottom-0 rounded-l-lg"
                      style={{ width: `${barW}%`, background: style.border + "30" }} />
                    <div className="relative flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-roboto text-xs font-bold truncate" style={{ color: style.text }}>
                          {item.track}
                        </div>
                        {item.text && (
                          <div className="font-roboto text-[10px] text-white/35 truncate">{item.text}</div>
                        )}
                        <PathLabel url={item.page_url} />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-oswald font-bold text-base" style={{ color: style.text }}>{item.clicks}</div>
                        <div className="text-[10px] text-white/30">{item.pct}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="flex flex-col gap-1.5">
            {topPages.map((page, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-[10px] text-white/25 w-5 text-center font-bold">{i + 1}</span>
                <span className="flex-1 font-roboto text-xs text-white/60 truncate">
                  {(() => { try { return new URL(page.page_url).pathname || "/"; } catch { return page.page_url?.slice(0, 40) || "—"; } })()}
                </span>
                <span className="font-oswald font-bold text-sm text-[#FFD700]">{page.clicks}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
