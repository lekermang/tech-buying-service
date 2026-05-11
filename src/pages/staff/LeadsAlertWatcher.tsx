import React from "react";
import Icon from "@/components/ui/icon";
import { shareToChat, formatLeadShare } from "@/lib/shareToChat";

const LEADS_URL = "https://functions.poehali.dev/cccc3788-d793-49a5-9254-f194e6d94e18";

type Lead = {
  id: number;
  source: string;
  client_name: string;
  client_phone: string;
  category: string | null;
  description: string | null;
  status: string;
  owner_name: string | null;
  age_minutes: number;
  created_at: string;
};

type Stats = {
  new_count: number;
  taken_count: number;
  overdue_count: number;
  answered_today: number;
  today_total: number;
};

type Toast = {
  id: number;
  lead: Lead;
  level: "new" | "5min" | "15min" | "30min";
};

const LS_SEEN_KEY = "leads_seen_v1";

const fmtPhone = (p: string) => {
  const d = (p || "").replace(/\D/g, "");
  if (d.length !== 11) return p;
  return `+${d[0]} (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
};

const sourceLabel: Record<string, string> = {
  lead: "Оценка",
  repair: "Ремонт",
  apple: "Apple",
  gold: "Золото",
  jobs: "Вакансия",
  catalog: "Каталог",
  tools: "Инструменты",
  avito: "Авито",
  exit_popup: "Поп-ап",
};

const getSeenIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const saveSeenIds = (s: Set<number>) => {
  try {
    const arr = Array.from(s).slice(-200);
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify(arr));
  } catch { /* */ }
};

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.5);
  } catch { /* */ }
};

export default function LeadsAlertWatcher({ token, empName }: { token: string; empName: string }) {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const seenRef = React.useRef<Set<number>>(getSeenIds());

  const fetchHot = React.useCallback(async () => {
    try {
      const r = await fetch(`${LEADS_URL}?action=hot`, { headers: { "X-Employee-Token": token } });
      if (!r.ok) return;
      const d = await r.json();
      if (!d || !d.ok) return;
      const list: Lead[] = d.leads || [];
      setLeads(list);
      setStats(d.stats || null);
      // Найти новые (не виденные) и показать toast
      const fresh: Toast[] = [];
      for (const l of list) {
        if (l.status !== "new" && l.status !== "taken") continue;
        if (seenRef.current.has(l.id)) continue;
        seenRef.current.add(l.id);
        let level: Toast["level"] = "new";
        if (l.age_minutes >= 30) level = "30min";
        else if (l.age_minutes >= 15) level = "15min";
        else if (l.age_minutes >= 5) level = "5min";
        fresh.push({ id: l.id, lead: l, level });
      }
      if (fresh.length) {
        saveSeenIds(seenRef.current);
        setToasts(prev => [...prev, ...fresh]);
        playBeep();
        // Браузерное уведомление
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            for (const t of fresh) {
              new Notification(`Заявка #${t.lead.id} — ${t.lead.client_name}`, {
                body: `${fmtPhone(t.lead.client_phone)} · ${t.lead.description || t.lead.category || ""}`,
                tag: `lead-${t.lead.id}`,
              });
            }
          }
        } catch { /* */ }
      }
    } catch { /* */ }
  }, [token]);

  React.useEffect(() => {
    fetchHot();
    const id = setInterval(fetchHot, 30000);
    // запросить разрешение на браузерные уведомления (один раз)
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch { /* */ }
    return () => clearInterval(id);
  }, [fetchHot]);

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const takeLead = async (id: number) => {
    try {
      const r = await fetch(`${LEADS_URL}?action=take`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ lead_id: id, owner_name: empName || "Сотрудник" }),
      });
      const d = await r.json();
      if (d.ok) {
        dismissToast(id);
        fetchHot();
      }
    } catch { /* */ }
  };

  const markAnswered = async (id: number) => {
    try {
      await fetch(`${LEADS_URL}?action=answered`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ lead_id: id, actor_name: empName || "Сотрудник" }),
      });
      fetchHot();
    } catch { /* */ }
  };

  const closeLead = async (id: number) => {
    try {
      await fetch(`${LEADS_URL}?action=close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ lead_id: id }),
      });
      fetchHot();
    } catch { /* */ }
  };

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const shareLead = async (lead: Lead) => {
    const ok = await shareToChat(token, formatLeadShare({
      id: lead.id,
      client_name: lead.client_name,
      client_phone: lead.client_phone,
      category: lead.category,
      description: lead.description,
      source: lead.source,
    }));
    setShareToast(ok ? "✅ Отправлено в чат" : "❌ Не удалось отправить");
    setTimeout(() => setShareToast(null), 2000);
  };

  const robocallLead = async (lead: Lead) => {
    try {
      const r = await fetch(`${LEADS_URL}?action=robocall_lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ lead_id: lead.id }),
      });
      const d = await r.json();
      setShareToast(d.ok ? "📞 Робот звонит клиенту" : `❌ ${d.error || "Ошибка"}`);
    } catch {
      setShareToast("❌ Ошибка сети");
    }
    setTimeout(() => setShareToast(null), 3000);
  };

  const inviteLead = async (lead: Lead) => {
    try {
      const r = await fetch("https://functions.poehali.dev/db114166-21ce-4b87-9d05-59286ee73d6e?action=invite_create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ phone: lead.client_phone, name: lead.client_name, lead_id: lead.id }),
      });
      const d = await r.json();
      if (d.ok) {
        const channels: string[] = [];
        if (d.tg_sent) channels.push("TG");
        if (d.sms_sent) channels.push("SMS");
        const msg = channels.length
          ? `📲 Отправлено: ${channels.join(" + ")}`
          : "✅ Ссылка создана";
        setShareToast(msg);
        // Если ничего не отправлено — открываем WhatsApp как fallback
        if (!d.tg_sent && !d.sms_sent && d.wa_url) {
          window.open(d.wa_url as string, "_blank");
        }
      } else {
        setShareToast("❌ Ошибка приглашения");
      }
    } catch {
      setShareToast("❌ Ошибка сети");
    }
    setTimeout(() => setShareToast(null), 3500);
  };

  // Пригласить клиента в мессенджер MAX: сотруднику открывается MAX на чате с клиентом,
  // плюс клиенту параллельно уходит SMS со ссылкой (через тот же invite_create).
  const inviteMax = async (lead: Lead) => {
    try {
      const r = await fetch("https://functions.poehali.dev/db114166-21ce-4b87-9d05-59286ee73d6e?action=invite_create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ phone: lead.client_phone, name: lead.client_name, lead_id: lead.id }),
      });
      const d = await r.json();
      if (d.ok && d.max_url) {
        // Открываем MAX у сотрудника (диплинк или ссылка на бота)
        window.open(d.max_url as string, "_blank");
        const parts: string[] = ["MAX открыт"];
        if (d.sms_sent) parts.push("SMS клиенту");
        setShareToast(`💬 ${parts.join(" + ")}`);
      } else {
        setShareToast("❌ Не удалось открыть MAX");
      }
    } catch {
      setShareToast("❌ Ошибка сети");
    }
    setTimeout(() => setShareToast(null), 3500);
  };

  const overdue = stats?.overdue_count || 0;
  const newCount = stats?.new_count || 0;
  const totalActive = newCount + (stats?.taken_count || 0);

  return (
    <>
      {/* Плавающая кнопка-индикатор */}
      <button
        onClick={() => setPanelOpen(true)}
        className={`fixed z-[150] bottom-20 right-3 sm:bottom-6 sm:right-6 rounded-full shadow-2xl border-2 transition-all active:scale-95 flex items-center gap-2 px-3.5 py-2.5 font-bold text-sm ${
          overdue > 0
            ? "bg-gradient-to-br from-red-500 to-red-600 border-red-300/50 text-white animate-pulse shadow-red-500/40"
            : newCount > 0
              ? "bg-gradient-to-br from-[#FFD700] to-[#d4a017] border-[#FFE34D] text-black shadow-[#FFD700]/30"
              : "bg-[#1A1A1A]/90 border-[#FFD700]/30 text-white/70 backdrop-blur"
        }`}
        title="Горящие заявки"
      >
        <Icon name={overdue > 0 ? "Flame" : "Inbox"} size={18} />
        {totalActive > 0 ? (
          <span>
            {overdue > 0 && <span className="font-black">🔥 {overdue}</span>}
            {overdue === 0 && newCount > 0 && <span>Новых: {newCount}</span>}
            {overdue === 0 && newCount === 0 && <span>В работе: {stats?.taken_count}</span>}
          </span>
        ) : <span>Заявки</span>}
      </button>

      {/* Toast-уведомления */}
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
                <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100 shrink-0">
                  <Icon name="X" size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2">
                <button
                  onClick={() => takeLead(t.id)}
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

      {/* Панель горящих заявок */}
      {panelOpen && (
        <div className="fixed inset-0 z-[180] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setPanelOpen(false)}>
          <div
            className="w-full sm:max-w-2xl bg-[#0F0F0F] border-2 border-[#FFD700]/40 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="sticky top-0 bg-[#0F0F0F] border-b border-[#FFD700]/30 p-4 flex items-center justify-between">
              <div>
                <div className="font-oswald font-bold text-xl text-[#FFD700] uppercase tracking-wide">
                  🔥 Горящие заявки
                </div>
                <div className="text-xs text-white/55 mt-0.5">
                  Сегодня: {stats?.today_total || 0} · Ответили: {stats?.answered_today || 0} · Просрочено: <b className="text-red-400">{overdue}</b>
                </div>
              </div>
              <button onClick={() => setPanelOpen(false)} className="text-white/60 hover:text-white">
                <Icon name="X" size={22} />
              </button>
            </div>

            {/* Статы */}
            <div className="grid grid-cols-3 gap-2 p-3">
              <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Новых</div>
                <div className="text-2xl font-black text-amber-300">{newCount}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">В работе</div>
                <div className="text-2xl font-black text-emerald-300">{stats?.taken_count || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] uppercase tracking-wider text-red-300/80">Просрочено</div>
                <div className="text-2xl font-black text-red-300">{overdue}</div>
              </div>
            </div>

            {/* Список заявок */}
            <div className="p-3 space-y-2">
              {leads.length === 0 && (
                <div className="text-center py-12 text-white/40">
                  <Icon name="Coffee" size={32} className="inline mb-2 text-[#FFD700]/50" />
                  <div className="font-bold text-white/70">Все заявки обработаны 🎉</div>
                  <div className="text-xs mt-1">Можно выдохнуть</div>
                </div>
              )}
              {leads.map(l => {
                const ageMin = Math.floor(l.age_minutes);
                const isOverdue = ageMin >= 15 && l.status === "new";
                const isCritical = ageMin >= 30 && l.status === "new";
                const ageStr = ageMin < 60 ? `${ageMin} мин` : `${Math.floor(ageMin / 60)}ч ${ageMin % 60}м`;
                const digits = (l.client_phone || "").replace(/\D/g, "");
                return (
                  <div
                    key={l.id}
                    className={`rounded-xl border p-3 ${
                      isCritical ? "bg-red-500/10 border-red-500/40 animate-pulse" :
                      isOverdue  ? "bg-orange-500/10 border-orange-500/40" :
                      l.status === "taken" ? "bg-emerald-500/5 border-emerald-500/30" :
                                            "bg-white/5 border-white/15"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#FFD700] font-bold text-sm">#{l.id}</span>
                          <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                            {sourceLabel[l.source] || l.source}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCritical ? "bg-red-600 text-white" :
                            isOverdue  ? "bg-orange-500 text-white" :
                            l.status === "taken" ? "bg-emerald-500/30 text-emerald-200" :
                                                   "bg-amber-500/30 text-amber-200"
                          }`}>
                            {l.status === "taken" ? `🎯 ${l.owner_name || "В работе"}` : ageStr}
                          </span>
                        </div>
                        <div className="mt-1 font-bold text-white text-sm truncate">{l.client_name}</div>
                        <div className="text-[#FFD700] text-sm font-mono">{fmtPhone(l.client_phone)}</div>
                        {l.description && <div className="text-xs text-white/55 mt-0.5 line-clamp-2">{l.description}</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      {l.status === "new" ? (
                        <button onClick={() => takeLead(l.id)}
                          className="col-span-2 bg-[#FFD700] hover:bg-[#FFE34D] text-black rounded text-[11px] font-bold py-1.5 active:scale-95">
                          🎯 Беру в работу
                        </button>
                      ) : (
                        <button onClick={() => markAnswered(l.id)}
                          className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold py-1.5 active:scale-95">
                          ✅ Ответил клиенту
                        </button>
                      )}
                      <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold py-1.5 active:scale-95 flex items-center justify-center">
                        💬
                      </a>
                      <a href={`tel:+${digits}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold py-1.5 active:scale-95 flex items-center justify-center">
                        📞
                      </a>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
                      <button
                        onClick={() => shareLead(l)}
                        className="text-[10px] text-blue-300/80 hover:text-blue-200 underline inline-flex items-center gap-1"
                        title="Отправить карточку заявки в чат сотрудников"
                      >
                        <Icon name="MessageSquareShare" size={11} fallback="Send" /> В чат сотрудникам
                      </button>
                      <button
                        onClick={() => inviteLead(l)}
                        className="text-[10px] text-emerald-300/80 hover:text-emerald-200 underline inline-flex items-center gap-1"
                        title="Отправить SMS со ссылкой на персональный чат"
                      >
                        <Icon name="MessageCircle" size={11} /> Пригласить в чат
                      </button>
                      <button
                        onClick={() => inviteMax(l)}
                        className="text-[10px] text-cyan-300/85 hover:text-cyan-200 underline inline-flex items-center gap-1"
                        title="Открыть мессенджер MAX у сотрудника и параллельно отправить клиенту SMS со ссылкой на MAX-чат"
                      >
                        <Icon name="Send" size={11} /> Пригласить в MAX
                      </button>
                      <button
                        onClick={() => robocallLead(l)}
                        className="text-[10px] text-purple-300/80 hover:text-purple-200 underline inline-flex items-center gap-1"
                        title="Робот-звонок клиенту с приглашением на адрес (Zvonok)"
                      >
                        <Icon name="PhoneCall" size={11} /> Робот-звонок
                      </button>
                      {l.status === "taken" && (
                        <button onClick={() => closeLead(l.id)} className="text-[10px] text-white/40 hover:text-white/70 underline">
                          Закрыть заявку
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Мини-уведомление об успехе шаринга */}
      {shareToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[210] px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold shadow-2xl shadow-blue-500/30 animate-in fade-in slide-in-from-top-2">
          {shareToast}
        </div>
      )}
    </>
  );
}