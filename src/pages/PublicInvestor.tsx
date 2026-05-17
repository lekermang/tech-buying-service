import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { GOLD_URL, GoldInvestorPublic, money, GOLD_STATUSES } from "./gold/types";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
};

const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
};

export default function PublicInvestor() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<GoldInvestorPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`${GOLD_URL}?action=investor_public&token=${encodeURIComponent(token)}`);
        const d = await r.json();
        if (!alive) return;
        if (!r.ok) {
          setError(d.error || "Ошибка");
        } else {
          setData(d);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Ошибка соединения");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white/60">
        <Icon name="Loader2" size={28} className="animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white/60 p-4 text-center">
        <Icon name="AlertTriangle" size={36} className="text-red-400 mb-2" />
        <div className="font-bold text-white text-lg mb-1">Ссылка недоступна</div>
        <div className="text-sm text-white/50">{error || "Попроси обновить ссылку"}</div>
      </div>
    );
  }

  const { settings, totals, deals, daily } = data;
  const remain = totals.in_safe - totals.spent;
  const dailyChart = daily.map(d => ({ ...d, label: formatShortDate(d.date) }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A0A] via-[#0D0D0D] to-[#0A0A0A] text-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1A1A0A] via-[#0D0D0D] to-[#0A0A0A] border-b border-[#FFD700]/20">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
              <Icon name="Gem" size={20} className="text-black" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-xl uppercase tracking-wide">
                Личный кабинет инвестора
              </div>
              <div className="text-[11px] text-white/40">{settings.investor_name} · золотой портфель</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Балансы — 4 карточки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <KPI
            label="В сейфе"
            value={money(totals.in_safe)}
            hint="Внесено всего"
            icon="Wallet"
            tone="gold"
          />
          <KPI
            label="Вложено в золото"
            value={money(totals.spent)}
            hint={`Свободно: ${money(remain)}`}
            icon="Coins"
            tone="white"
          />
          <KPI
            label="Куплено"
            value={`${totals.grams.toFixed(2)} г`}
            hint={`${deals.length} сделок`}
            icon="Scale"
            tone="white"
          />
          <KPI
            label="Прибыль (отложено)"
            value={`+${money(totals.profit_total)}`}
            hint={`Реализовано: +${money(totals.profit_realized)}`}
            icon="TrendingUp"
            tone="green"
          />
        </div>

        {/* График прибыли по дням */}
        {dailyChart.length > 0 && (
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="LineChart" size={14} className="text-[#FFD700]" />
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Прибыль за 30 дней
              </div>
            </div>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={dailyChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: "#0A0A0A", border: "1px solid #FFD700", borderRadius: 8 }}
                    labelStyle={{ color: "#FFD700", fontWeight: "bold" }}
                    formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₽`, "Прибыль"]}
                  />
                  <Line type="monotone" dataKey="profit" stroke="#FFD700" strokeWidth={2} dot={{ fill: "#FFD700", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Граммы по дням */}
        {dailyChart.length > 0 && (
          <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="BarChart2" size={14} className="text-[#FFD700]" />
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Купленные граммы по дням
              </div>
            </div>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={dailyChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#1F1F1F" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: "#0A0A0A", border: "1px solid #FFD700", borderRadius: 8 }}
                    labelStyle={{ color: "#FFD700", fontWeight: "bold" }}
                    formatter={(v: number) => [`${v} г`, "Граммы"]}
                  />
                  <Bar dataKey="grams" fill="#FFD700" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Список сделок */}
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-xl">
          <div className="px-4 py-3 border-b border-[#1F1F1F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="ListChecks" size={14} className="text-[#FFD700]" />
              <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide">
                Сделки ({deals.length})
              </div>
            </div>
            <div className="text-[10px] text-white/40">Все на деньги инвестора</div>
          </div>

          {deals.length === 0 ? (
            <div className="text-center text-white/40 text-sm py-10">Сделок пока нет</div>
          ) : (
            <>
              {/* Mobile — карточки */}
              <div className="md:hidden divide-y divide-[#1F1F1F]">
                {deals.map(d => {
                  const status = GOLD_STATUSES.find(s => s.key === d.status);
                  return (
                    <div key={d.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white text-[13px] truncate">
                            #{d.id} · {d.item_name || "—"}
                          </div>
                          <div className="text-[10px] text-white/40 mt-0.5">{formatDate(d.created_at)}</div>
                        </div>
                        {status && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.color} font-bold uppercase shrink-0`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-white/40">Вес:</span><span className="text-white">{d.weight} г</span></div>
                        <div className="flex justify-between"><span className="text-white/40">Проба:</span><span className="text-white">{d.purity || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-white/40">За грамм:</span><span className="text-white">{d.weight > 0 ? Math.round(d.buy_price / d.weight).toLocaleString("ru-RU") : "—"} ₽</span></div>
                        <div className="flex justify-between"><span className="text-white/40">Закуп:</span><span className="text-white">{money(d.buy_price)}</span></div>
                        <div className="col-span-2 flex justify-between pt-1 border-t border-[#1F1F1F] mt-1">
                          <span className="text-green-300/80">Прибыль ({d.investor_profit_per_gram} ₽/гр):</span>
                          <span className="text-green-300 font-bold">+{money(d.profit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop — таблица */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-left text-white/40 uppercase tracking-wider text-[10px] border-b border-[#1F1F1F]">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Дата</th>
                      <th className="px-3 py-2">Изделие</th>
                      <th className="px-3 py-2 text-right">Вес</th>
                      <th className="px-3 py-2 text-right">Проба</th>
                      <th className="px-3 py-2 text-right">Цена/гр</th>
                      <th className="px-3 py-2 text-right">Закуп</th>
                      <th className="px-3 py-2 text-right">₽/гр прибыль</th>
                      <th className="px-3 py-2 text-right">Прибыль</th>
                      <th className="px-3 py-2 text-center">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map(d => {
                      const status = GOLD_STATUSES.find(s => s.key === d.status);
                      return (
                        <tr key={d.id} className="border-b border-[#1F1F1F] hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-white/50">{d.id}</td>
                          <td className="px-3 py-2 text-white/70">{formatDate(d.created_at)}</td>
                          <td className="px-3 py-2 text-white">{d.item_name || "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{d.weight} г</td>
                          <td className="px-3 py-2 text-right text-white/70">{d.purity || "—"}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {d.weight > 0 ? Math.round(d.buy_price / d.weight).toLocaleString("ru-RU") : "—"} ₽
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-white">{money(d.buy_price)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-[#FFD700]">{d.investor_profit_per_gram} ₽</td>
                          <td className="px-3 py-2 text-right tabular-nums text-green-300 font-bold">+{money(d.profit)}</td>
                          <td className="px-3 py-2 text-center">
                            {status && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.color} font-bold uppercase`}>
                                {status.label}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FFD700]/5 border-t-2 border-[#FFD700]/20 font-bold">
                      <td colSpan={3} className="px-3 py-2 text-[#FFD700] uppercase tracking-wide text-[10px]">Итого</td>
                      <td className="px-3 py-2 text-right text-white">{totals.grams.toFixed(2)} г</td>
                      <td></td>
                      <td></td>
                      <td className="px-3 py-2 text-right text-white">{money(totals.spent)}</td>
                      <td></td>
                      <td className="px-3 py-2 text-right text-green-300">+{money(totals.profit_total)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="text-center text-[10px] text-white/30 py-4">
          Данные обновляются автоматически · {new Date().toLocaleString("ru-RU")}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, hint, icon, tone }: {
  label: string; value: string; hint?: string; icon: string;
  tone: "gold" | "white" | "green";
}) {
  const toneCls = tone === "gold"
    ? "from-[#FFD700]/15 to-transparent border-[#FFD700]/30 text-[#FFD700]"
    : tone === "green"
      ? "from-green-500/15 to-transparent border-green-500/30 text-green-300"
      : "from-white/5 to-transparent border-[#1F1F1F] text-white";
  return (
    <div className={`bg-gradient-to-br ${toneCls.split(" ").slice(0, 2).join(" ")} border ${toneCls.split(" ")[2]} rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-1 text-white/50">
        <Icon name={icon} size={11} />
        {label}
      </div>
      <div className={`font-oswald font-bold text-xl ${toneCls.split(" ")[3]}`}>{value}</div>
      {hint && <div className="text-[10px] text-white/40 mt-0.5">{hint}</div>}
    </div>
  );
}
