import React from "react";
import { shareToChat, formatLeadShare } from "@/lib/shareToChat";
import FloatingButton from "./LeadsAlertWatcher/FloatingButton";
import ToastsStack from "./LeadsAlertWatcher/ToastsStack";
import LeadsPanel from "./LeadsAlertWatcher/LeadsPanel";
import {
  LEADS_URL,
  fmtPhone,
  getSeenIds,
  saveSeenIds,
  playBeep,
  type Lead,
  type Stats,
  type Toast,
} from "./LeadsAlertWatcher/types";

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

  // Live-чат удалён. Приглашение через WhatsApp как fallback.
  const inviteLead = async (lead: Lead) => {
    try {
      const digits = (lead.client_phone || "").replace(/\D/g, "");
      if (digits.length >= 10) {
        const wa = `https://wa.me/${digits.length === 11 ? digits : "7" + digits.slice(-10)}`;
        window.open(wa, "_blank");
        setShareToast("💬 WhatsApp открыт");
      } else {
        setShareToast("❌ Нет телефона клиента");
      }
    } catch {
      setShareToast("❌ Ошибка");
    }
    setTimeout(() => setShareToast(null), 3500);
  };

  // Пригласить клиента в мессенджер MAX: открываем диплинк MAX у сотрудника.
  const inviteMax = async (lead: Lead) => {
    try {
      const digits = (lead.client_phone || "").replace(/\D/g, "");
      if (digits.length >= 10) {
        const phone = digits.length === 11 ? digits : "7" + digits.slice(-10);
        window.open(`max://u/+${phone}`, "_blank");
        setShareToast("💬 MAX открыт");
      } else {
        setShareToast("❌ Нет телефона клиента");
      }
    } catch {
      setShareToast("❌ Ошибка");
    }
    setTimeout(() => setShareToast(null), 3500);
  };

  return (
    <>
      {/* Плавающая кнопка-индикатор */}
      <FloatingButton stats={stats} onOpen={() => setPanelOpen(true)} />

      {/* Toast-уведомления */}
      <ToastsStack toasts={toasts} onDismiss={dismissToast} onTake={takeLead} />

      {/* Панель горящих заявок */}
      {panelOpen && (
        <LeadsPanel
          leads={leads}
          stats={stats}
          onClose={() => setPanelOpen(false)}
          onTake={takeLead}
          onMarkAnswered={markAnswered}
          onCloseLead={closeLead}
          onShare={shareLead}
          onInvite={inviteLead}
          onInviteMax={inviteMax}
          onRobocall={robocallLead}
        />
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