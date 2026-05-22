import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { Repair, REPAIR_STATUS_LABELS, fmtDate, fmtMoney } from "./clientTypes";

const URL = (funcUrls as Record<string, string>)["client-cabinet"];

export default function ClientRepairs({ token }: { token: string }) {
  const [items, setItems] = useState<Repair[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(URL, {
      method: "POST",
      headers: { "X-Client-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "my_repairs" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setError(d.error);
        else setItems(d.repairs || []);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [token]);

  if (error)
    return <ErrorBox text={error} />;
  if (items === null) return <Loader />;

  if (items.length === 0)
    return (
      <Empty
        icon="Wrench"
        title="Ремонтов пока нет"
        text="Когда сдадите технику в ремонт — здесь появятся все ваши заказы со статусами."
      />
    );

  return (
    <div className="space-y-3">
      {items.map((r) => {
        const st = REPAIR_STATUS_LABELS[r.status] || { text: r.status, color: "#888" };
        return (
          <div
            key={r.id}
            className="bg-gradient-to-br from-[#0E0E0E] to-[#080808] border border-[#1F1F1F] rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                  Заказ №{r.id} · {fmtDate(r.created_at)}
                </div>
                <div className="text-[15px] font-bold text-white truncate mt-0.5">
                  {r.model || r.repair_type || "Ремонт техники"}
                </div>
                {r.repair_type && r.model && (
                  <div className="text-[12px] text-white/55 mt-0.5">{r.repair_type}</div>
                )}
              </div>
              <span
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  background: `${st.color}20`,
                  color: st.color,
                  border: `1px solid ${st.color}40`,
                }}
              >
                {st.text}
              </span>
            </div>
            {r.comment && (
              <div className="text-[12px] text-white/65 italic mb-2 line-clamp-2">
                «{r.comment}»
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Стоимость" value={fmtMoney(r.price)} />
              <Stat label="Аванс" value={fmtMoney(r.advance)} />
              <Stat
                label={r.is_paid ? "Оплачено" : "К оплате"}
                value={r.is_paid ? "✓" : fmtMoney((r.price || 0) - (r.advance || 0))}
                valueColor={r.is_paid ? "#10B981" : "#FFD700"}
              />
            </div>
            {r.admin_note && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/20 text-[12px] text-[#FFD700]">
                <Icon name="MessageSquare" size={12} className="inline mr-1.5" />
                {r.admin_note}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-1.5">
      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
      <div className="text-[13px] font-bold mt-0.5" style={{ color: valueColor || "#fff" }}>
        {value}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-white/40">
      <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
      <span className="text-xs">Загружаю…</span>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center gap-2">
      <Icon name="AlertCircle" size={14} />
      {text}
    </div>
  );
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-2">
        <Icon name={icon} size={28} className="text-[#FFD700]/70" />
      </div>
      <div className="text-[15px] font-bold text-white">{title}</div>
      <div className="text-[12px] text-white/50 max-w-xs">{text}</div>
    </div>
  );
}
