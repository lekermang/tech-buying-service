import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";
import { Contract14d, fmtDate, fmtMoney } from "./clientTypes";

const URL = (funcUrls as Record<string, string>)["client-cabinet"];

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  active: { text: "Активный", color: "#10B981" },
  closed: { text: "Закрыт", color: "#888" },
  overdue: { text: "Просрочен", color: "#EF4444" },
  terminated: { text: "Расторгнут", color: "#EF4444" },
};

export default function ClientContracts({ token }: { token: string }) {
  const [items, setItems] = useState<Contract14d[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(URL, {
      method: "POST",
      headers: { "X-Client-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "my_contracts" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.error) setError(d.error);
        else setItems(d.contracts || []);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [token]);

  if (error)
    return (
      <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
        {error}
      </div>
    );
  if (items === null)
    return (
      <div className="flex flex-col items-center py-16 gap-2 text-white/40">
        <Icon name="Loader" size={20} className="animate-spin text-[#FFD700]" />
        <span className="text-xs">Загружаю…</span>
      </div>
    );

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center mb-2">
          <Icon name="FileText" size={28} className="text-[#FFD700]/70" />
        </div>
        <div className="text-[15px] font-bold text-white">Залогов пока нет</div>
        <div className="text-[12px] text-white/50 max-w-xs">
          Когда возьмёте залог в нашем ломбарде — здесь будет вся информация: сумма, сроки,
          выкуп.
        </div>
      </div>
    );

  return (
    <div className="space-y-3">
      {items.map((c) => {
        const st = STATUS_LABEL[c.status] || { text: c.status, color: "#888" };
        const isActive = c.status === "active";
        const dl = c.days_left;
        const urgent = isActive && dl !== null && dl <= 3;
        const overdue = isActive && dl !== null && dl < 0;
        return (
          <div
            key={c.id}
            className={`bg-gradient-to-br from-[#0E0E0E] to-[#080808] border rounded-2xl p-4 ${
              overdue ? "border-red-500/40" : urgent ? "border-[#FFD700]/40" : "border-[#1F1F1F]"
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[10px] text-white/40 uppercase tracking-wider">
                  Договор № {c.contract_number}
                </div>
                <div className="text-[15px] font-bold text-white truncate mt-0.5">
                  {[c.item.brand, c.item.model].filter(Boolean).join(" ") || c.item.type || "Залог"}
                </div>
                {c.item.serial && (
                  <div className="text-[11px] text-white/40 mt-0.5">S/N: {c.item.serial}</div>
                )}
              </div>
              <span
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${st.color}20`, color: st.color, border: `1px solid ${st.color}40` }}
              >
                {st.text}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <Box label="Сумма залога" value={fmtMoney(c.amount)} highlight />
              <Box label="К возврату" value={fmtMoney(c.total_due)} highlightColor="#FFD700" />
              <Box label="Оплачено" value={fmtMoney(c.paid_total)} />
              <Box label="Долг" value={fmtMoney(c.remaining_debt)} highlightColor={overdue ? "#EF4444" : undefined} />
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0A0A0A] border border-[#1F1F1F]">
              <Icon name="CalendarClock" size={14} className="text-[#FFD700]" />
              <div className="text-[11px] text-white/60">
                <span className="text-white/40">с</span> {fmtDate(c.start_date)}{" "}
                <span className="text-white/40">по</span> {fmtDate(c.end_date)}
              </div>
              {isActive && dl !== null && (
                <span
                  className="ml-auto text-[11px] font-bold"
                  style={{ color: overdue ? "#EF4444" : urgent ? "#FFD700" : "#10B981" }}
                >
                  {overdue
                    ? `Просрочен на ${Math.abs(dl)} дн.`
                    : dl === 0
                      ? "Возврат сегодня"
                      : `Осталось ${dl} дн.`}
                </span>
              )}
            </div>

            {isActive && (
              <div className="mt-3 flex gap-2">
                <a
                  href={`/p/c/${c.contract_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] text-white/80 text-[12px] font-semibold text-center hover:border-[#FFD700]/40"
                >
                  <Icon name="FileText" size={12} className="inline mr-1" />
                  Открыть договор
                </a>
                <a
                  href="tel:+79929990333"
                  className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider text-center"
                >
                  <Icon name="Phone" size={12} className="inline mr-1" />
                  Продлить
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Box({
  label,
  value,
  highlight,
  highlightColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  highlightColor?: string;
}) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg py-2 px-2.5">
      <div className="text-[9px] text-white/40 uppercase tracking-wider">{label}</div>
      <div
        className={`text-[14px] font-bold mt-0.5 ${highlight ? "" : ""}`}
        style={{ color: highlightColor || (highlight ? "#FFD700" : "#fff") }}
      >
        {value}
      </div>
    </div>
  );
}