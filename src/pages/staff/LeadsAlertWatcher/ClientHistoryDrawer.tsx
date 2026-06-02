import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { LEADS_URL } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  phone: string;
  name: string;
  token: string;
}

type ClientHistoryLead = {
  id: number;
  source: string;
  category: string | null;
  description: string | null;
  status: string | null;
  device?: string | null;
  created_at: string;
  owner_name?: string | null;
  taken_at?: string | null;
  answered_at?: string | null;
};

type ClientHistoryRepair = {
  id: number;
  model?: string | null;
  repair_type?: string | null;
  status?: string | null;
  repair_amount?: number | null;
  created_at: string;
};

type ClientHistoryGold = {
  id: number;
  item_name?: string | null;
  weight?: number | null;
  purity?: string | null;
  buy_price?: number | null;
  created_at: string;
};

type ClientHistorySummary = {
  total_leads: number;
  total_repairs: number;
  total_gold?: number;
  devices: string[];
  first_seen: string | null;
  last_seen: string | null;
};

type ClientHistoryResponse = {
  ok: boolean;
  phone: string;
  leads: ClientHistoryLead[];
  repairs: ClientHistoryRepair[];
  gold_orders: ClientHistoryGold[];
  client: { id: number; phone: string; display_name?: string | null } | null;
  summary: ClientHistorySummary;
};

const fmtDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
};

const fmtPhoneDigits = (p: string) => (p || "").replace(/\D/g, "");

const STATUS_COLOR_LEAD: Record<string, string> = {
  new: "bg-amber-500/20 text-amber-200",
  taken: "bg-emerald-500/20 text-emerald-200",
  answered: "bg-emerald-500/30 text-emerald-100",
  closed: "bg-white/10 text-white/50",
};

const STATUS_COLOR_REPAIR: Record<string, string> = {
  new: "bg-amber-500/20 text-amber-200",
  accepted: "bg-blue-500/20 text-blue-200",
  in_progress: "bg-emerald-500/20 text-emerald-200",
  waiting_parts: "bg-orange-500/20 text-orange-200",
  ready: "bg-emerald-500/30 text-emerald-100",
  done: "bg-white/10 text-white/60",
  cancelled: "bg-red-500/20 text-red-200",
};

export default function ClientHistoryDrawer({ open, onClose, phone, name, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ClientHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !phone) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(
          `${LEADS_URL}?action=client_history&phone=${encodeURIComponent(phone)}`,
          { headers: { "X-Admin-Token": token, "X-Employee-Token": token } }
        );
        if (!r.ok) {
          if (!cancelled) setError(`Ошибка ${r.status}`);
          return;
        }
        const d = await r.json();
        if (cancelled) return;
        if (d && d.ok) setData(d as ClientHistoryResponse);
        else setError(d?.error || "Не удалось загрузить историю");
      } catch {
        if (!cancelled) setError("Нет связи");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, phone, token]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const digits = fmtPhoneDigits(phone);
  const e164 = digits.length === 11 ? digits : (digits.length === 10 ? "7" + digits : digits);

  return (
    <div className="fixed inset-0 z-[200]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <aside
        onClick={e => e.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[480px] bg-[#0F0F0F] border-l-2 border-[#FFD700]/30 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#FFD700]/20 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-roboto text-[10px] uppercase tracking-wider text-[#FFD700]/70 mb-0.5">
                CRM-карточка
              </div>
              <div className="font-oswald font-bold text-lg text-white truncate">
                {name || "Клиент"}
              </div>
              <div className="font-mono text-[#FFD700] text-sm">{phone}</div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white shrink-0">
              <Icon name="X" size={20} />
            </button>
          </div>

          {/* Быстрые контакт-кнопки */}
          <div className="grid grid-cols-4 gap-1.5 mt-3">
            <a
              href={`tel:+${e164}`}
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-200 active:scale-95 transition-all"
              title="Позвонить"
            >
              <Icon name="Phone" size={14} />
              <span className="text-[10px] font-roboto">Позвонить</span>
            </a>
            <a
              href={`https://wa.me/${e164}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 active:scale-95 transition-all"
              title="WhatsApp"
            >
              <Icon name="MessageCircle" size={14} />
              <span className="text-[10px] font-roboto">WhatsApp</span>
            </a>
            <a
              href={`https://t.me/+${e164}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-200 active:scale-95 transition-all"
              title="Telegram"
            >
              <Icon name="Send" size={14} />
              <span className="text-[10px] font-roboto">Telegram</span>
            </a>
            <a
              href={`max://u/+${e164}`}
              className="flex flex-col items-center gap-0.5 py-2 rounded bg-[#2787F5]/15 hover:bg-[#2787F5]/25 border border-[#2787F5]/30 text-[#76b0ff] active:scale-95 transition-all"
              title="MAX"
            >
              <Icon name="MessageSquare" size={14} />
              <span className="text-[10px] font-roboto">MAX</span>
            </a>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-white/40 gap-2">
              <Icon name="Loader" size={18} className="animate-spin" />
              <span className="font-roboto text-sm">Загрузка истории...</span>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {!loading && data && (
            <>
              {/* Summary */}
              <section className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-xl p-3">
                <div className="font-oswald font-bold text-sm text-[#FFD700] uppercase mb-2 tracking-wider">
                  Сводка
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-roboto">
                  <div>
                    <div className="text-white/40 text-[10px] uppercase">Всего заявок</div>
                    <div className="text-white font-bold text-lg">{data.summary?.total_leads ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-white/40 text-[10px] uppercase">Ремонтов</div>
                    <div className="text-white font-bold text-lg">{data.summary?.total_repairs ?? 0}</div>
                  </div>
                  {(data.summary?.total_gold || 0) > 0 && (
                    <div>
                      <div className="text-white/40 text-[10px] uppercase">Золото</div>
                      <div className="text-white font-bold text-lg">{data.summary.total_gold}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-white/40 text-[10px] uppercase">Первый раз</div>
                    <div className="text-white/85 text-sm">{fmtDate(data.summary?.first_seen)}</div>
                  </div>
                </div>

                {data.summary?.devices && data.summary.devices.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-white/40 text-[10px] uppercase font-roboto mb-1">Устройства</div>
                    <div className="flex flex-wrap gap-1">
                      {data.summary.devices.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-white/8 text-white/80 text-[11px] font-roboto">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Leads */}
              <section>
                <div className="font-oswald font-bold text-sm uppercase tracking-wider text-white/80 mb-2 flex items-center gap-2">
                  <Icon name="FileText" size={14} className="text-[#FFD700]" />
                  Заявки ({data.leads.length})
                </div>
                {data.leads.length === 0 ? (
                  <div className="text-white/35 text-xs font-roboto py-2">Нет заявок</div>
                ) : (
                  <div className="space-y-1.5">
                    {data.leads.map(l => (
                      <div key={l.id} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-roboto">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#FFD700] font-bold">#{l.id}</span>
                            <span className="text-white/40 text-[10px]">{fmtDate(l.created_at)}</span>
                          </div>
                          {l.status && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLOR_LEAD[l.status] || "bg-white/10 text-white/60"}`}>
                              {l.status}
                            </span>
                          )}
                        </div>
                        {(l.category || l.device) && (
                          <div className="mt-1 text-white/70">
                            {l.category && <span className="font-bold">{l.category}</span>}
                            {l.device && <span className="text-white/50"> · {l.device}</span>}
                          </div>
                        )}
                        {l.description && (
                          <div className="mt-0.5 text-white/55 line-clamp-2">{l.description}</div>
                        )}
                        {/* Кто взял заявку — видно владельцу в истории */}
                        {l.owner_name && (
                          <div className="mt-1.5 flex items-center gap-1 text-emerald-300/80 text-[10px] font-semibold">
                            <span>👤</span>
                            <span>Взял: {l.owner_name}</span>
                            {l.taken_at && (
                              <span className="text-white/30 font-normal ml-1">· {fmtDate(l.taken_at)}</span>
                            )}
                          </div>
                        )}
                        {!l.owner_name && l.status === "new" && (
                          <div className="mt-1.5 text-amber-400/60 text-[10px]">⏳ Ещё не взята</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Repairs */}
              <section>
                <div className="font-oswald font-bold text-sm uppercase tracking-wider text-white/80 mb-2 flex items-center gap-2">
                  <Icon name="Wrench" size={14} className="text-[#FFD700]" />
                  Ремонты ({data.repairs.length})
                </div>
                {data.repairs.length === 0 ? (
                  <div className="text-white/35 text-xs font-roboto py-2">Нет ремонтов</div>
                ) : (
                  <div className="space-y-1.5">
                    {data.repairs.map(r => (
                      <div key={r.id} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-roboto">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#FFD700] font-bold">#{r.id}</span>
                            <span className="text-white/40 text-[10px]">{fmtDate(r.created_at)}</span>
                          </div>
                          {r.status && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLOR_REPAIR[r.status] || "bg-white/10 text-white/60"}`}>
                              {r.status}
                            </span>
                          )}
                        </div>
                        {r.model && <div className="mt-1 text-white font-bold">{r.model}</div>}
                        {r.repair_type && <div className="text-white/60">{r.repair_type}</div>}
                        {typeof r.repair_amount === "number" && r.repair_amount > 0 && (
                          <div className="mt-1 text-emerald-300 font-bold">{r.repair_amount.toLocaleString("ru-RU")} ₽</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Gold */}
              {data.gold_orders && data.gold_orders.length > 0 && (
                <section>
                  <div className="font-oswald font-bold text-sm uppercase tracking-wider text-white/80 mb-2 flex items-center gap-2">
                    <Icon name="Gem" size={14} className="text-[#FFD700]" />
                    Золото ({data.gold_orders.length})
                  </div>
                  <div className="space-y-1.5">
                    {data.gold_orders.map(g => (
                      <div key={g.id} className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-roboto">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[#FFD700] font-bold">#{g.id}</span>
                          <span className="text-white/40 text-[10px]">{fmtDate(g.created_at)}</span>
                        </div>
                        <div className="mt-1 text-white">
                          {g.item_name || "Изделие"}{g.purity ? ` · ${g.purity}` : ""}
                          {typeof g.weight === "number" ? ` · ${g.weight} г` : ""}
                        </div>
                        {typeof g.buy_price === "number" && g.buy_price > 0 && (
                          <div className="mt-0.5 text-emerald-300 font-bold">{g.buy_price.toLocaleString("ru-RU")} ₽</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}