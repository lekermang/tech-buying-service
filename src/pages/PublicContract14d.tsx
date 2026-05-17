import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";

const SL_C14D_URL = (funcUrls as Record<string, string>)["sl-contracts-14d"];

type TodayCalc = {
  days_passed: number;
  days_passed_raw: number;
  is_early: boolean;
  interest_today: number;
  today_due_full: number;
  today_remaining: number;
  full_due: number;
  saving: number;
};

type PublicContract = {
  contract_number: string;
  status: string;
  amount: number;
  interest_rate: number;
  term_days: number;
  start_date: string | null;
  end_date: string | null;
  days_remaining: number | null;
  overdue_days: number;
  client_name_masked: string;
  item_brand: string | null;
  item_model: string | null;
  today_calc: TodayCalc | null;
  paid_total: number;
  total_due: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n));

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активный",
  closed: "Закрыт",
  terminated: "Расторгнут",
  draft: "Черновик",
};

export default function PublicContract14d() {
  const { number } = useParams<{ number: string }>();
  const [data, setData] = useState<PublicContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!number) return;
    const load = async () => {
      try {
        setLoading(true);
        const url = new URL(SL_C14D_URL);
        url.searchParams.set("action", "public_view");
        url.searchParams.set("number", number);
        const res = await fetch(url.toString());
        const j = await res.json();
        if (!res.ok) {
          setError(j?.error || "Договор не найден");
        } else {
          setData(j);
        }
      } catch {
        setError("Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [number]);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-zinc-400">Загрузка...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
        <div className="text-center">
          <Icon name="CircleAlert" size={48} className="mx-auto text-amber-500 mb-3" />
          <div className="text-xl font-semibold mb-1">Договор не найден</div>
          <div className="text-zinc-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  const c = data;
  const tc = c.today_calc;
  const isActive = c.status === "active";
  const itemTitle = [c.item_brand, c.item_model].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Договор</div>
            <div className="text-lg font-bold text-amber-400">{c.contract_number}</div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full border ${
              isActive
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-700/40 border-zinc-600 text-zinc-300"
            }`}
          >
            {STATUS_LABELS[c.status] || c.status}
          </span>
        </div>

        {isActive && tc && (
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 shadow-xl">
            <div className="text-xs uppercase tracking-wider text-emerald-300/80 mb-1 flex items-center gap-2">
              <Icon name="Zap" size={14} /> К возврату сегодня
            </div>
            <div className="text-5xl font-bold text-emerald-300 tracking-tight">
              {fmt(tc.today_remaining)} ₽
            </div>
            {tc.saving > 0 && (
              <div className="text-xs text-emerald-400/80 mt-2">
                Экономия {fmt(tc.saving)} ₽ при выкупе сегодня
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Прошло дней"
            value={tc ? `${Math.max(0, tc.days_passed_raw)}/${c.term_days}` : `—/${c.term_days}`}
            icon="CalendarClock"
          />
          <Stat
            label={c.overdue_days > 0 ? "Просрочка" : "Осталось дней"}
            value={
              c.overdue_days > 0
                ? `+${c.overdue_days} дн.`
                : c.days_remaining != null
                  ? `${c.days_remaining} дн.`
                  : "—"
            }
            icon={c.overdue_days > 0 ? "TriangleAlert" : "Hourglass"}
            color={c.overdue_days > 0 ? "red" : "amber"}
          />
          <Stat label="Дата окончания" value={fmtDate(c.end_date)} icon="CalendarCheck" wide />
          <Stat label="Дата заключения" value={fmtDate(c.start_date)} icon="Calendar" wide />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-sm">
          <Row k="Сумма выдачи" v={`${fmt(c.amount)} ₽`} />
          {c.paid_total > 0 && <Row k="Оплачено" v={`${fmt(c.paid_total)} ₽`} accent="emerald" />}
          <Row k="Клиент" v={c.client_name_masked} />
          {itemTitle && <Row k="Имущество" v={itemTitle} />}
        </div>

        {!isActive && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center text-sm text-zinc-400">
            Договор {STATUS_LABELS[c.status]?.toLowerCase() || c.status}. Расчёт к возврату не
            требуется.
          </div>
        )}

        <div className="text-center text-[11px] text-zinc-600 pt-2">
          Данные обновляются автоматически. Сохраните ссылку — сумма пересчитывается ежедневно.
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  color = "zinc",
  wide,
}: {
  label: string;
  value: string;
  icon: string;
  color?: "zinc" | "amber" | "red";
  wide?: boolean;
}) {
  const tone =
    color === "red"
      ? "text-red-300"
      : color === "amber"
        ? "text-amber-300"
        : "text-zinc-100";
  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 ${wide ? "col-span-2" : ""}`}
    >
      <div className="text-[11px] uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={12} />
        {label}
      </div>
      <div className={`text-lg font-semibold ${tone}`}>{value}</div>
    </div>
  );
}

function Row({
  k,
  v,
  accent,
}: {
  k: string;
  v: string;
  accent?: "orange" | "emerald";
}) {
  const tone =
    accent === "orange" ? "text-orange-300" : accent === "emerald" ? "text-emerald-300" : "text-zinc-100";
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-zinc-500">{k}</span>
      <span className={`font-medium ${tone}`}>{v}</span>
    </div>
  );
}