import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { adminHeaders } from "@/lib/adminFetch";

const API = "https://functions.poehali.dev/6a0376b8-d712-4ee7-aa28-96e99c89ed9d";

const SHOPS = [
  { key: "kirova7",  label: "Кирова, 7" },
  { key: "kirova11", label: "Кирова, 11" },
];

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));
const fmtDec = (n: number) => new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

type TodayData = {
  date: string;
  gold_buy: number; gold_sell: number;
  repair: number; phone_sale: number;
  rent: number; other_expense: number; total: number;
};

type DashData = {
  today: TodayData;
  weekly_daily: { date: string; [k: string]: number | string }[];
  gold_stock_grams: number;
  rent: Record<string, { amount: number; day_of_month: number }>;
};

type AnalyticsData = {
  date_from: string; date_to: string;
  totals: Record<string, number>;
  by_shop: Record<string, Record<string, number>>;
  daily: { date: string; [k: string]: number | string }[];
  total_income: number; total_expense: number; net_profit: number;
};

type Entry = {
  id: number; entry_date: string; shop: string; category: string;
  amount: number; comment: string | null;
  gold_grams: number | null; gold_price_per_gram: number | null;
  source: string; created_at: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  gold_buy: "Покупка золота",
  gold_sell: "Продажа золота",
  repair: "Ремонт техники",
  phone_sale: "Продажа телефонов",
  rent: "Аренда",
  other_expense: "Прочий расход",
};

const CAT_COLOR: Record<string, string> = {
  gold_buy:     "text-yellow-400",
  gold_sell:    "text-green-400",
  repair:       "text-blue-400",
  phone_sale:   "text-purple-400",
  rent:         "text-red-400",
  other_expense:"text-red-300",
};

type View = "dashboard" | "gold" | "phones" | "rent" | "analytics" | "entries";
type Period = "day" | "yesterday" | "week" | "month" | "custom";

export default function LiquidityTab({ token }: { token: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [dash, setDash] = useState<DashData | null>(null);
  const [dashLoading, setDashLoading] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>("week");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Entries
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entryShop, setEntryShop] = useState("all");
  const [entryCat, setEntryCat] = useState("all");

  // Gold form
  const [goldTab, setGoldTab] = useState<"buy" | "sell">("buy");
  const [goldGrams, setGoldGrams] = useState("");
  const [goldPrice, setGoldPrice] = useState("");
  const [goldShop, setGoldShop] = useState("kirova7");
  const [goldDate, setGoldDate] = useState(new Date().toISOString().slice(0, 10));
  const [goldComment, setGoldComment] = useState("");
  const [goldSaving, setGoldSaving] = useState(false);
  const [goldMsg, setGoldMsg] = useState<string | null>(null);

  // Phone form
  const [phoneAmount, setPhoneAmount] = useState("");
  const [phoneShop, setPhoneShop] = useState("kirova7");
  const [phoneDate, setPhoneDate] = useState(new Date().toISOString().slice(0, 10));
  const [phoneComment, setPhoneComment] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  // Rent form
  const [rentSettings, setRentSettings] = useState<Record<string, { amount: number; day_of_month: number }>>({});
  const [rentEdit, setRentEdit] = useState<Record<string, string>>({});
  const [rentSaving, setRentSaving] = useState<string | null>(null);
  const [rentMsg, setRentMsg] = useState<string | null>(null);
  const [chargingRent, setChargingRent] = useState<string | null>(null);



  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try {
      const res = await fetch(`${API}?action=dashboard`, { headers: adminHeaders(token) });
      const data = await res.json();
      if (data.today) {
        setDash(data);
        if (data.rent) {
          setRentSettings(data.rent);
          const init: Record<string, string> = {};
          Object.entries(data.rent as Record<string, { amount: number }>).forEach(([k, v]) => {
            init[k] = String(v.amount);
          });
          setRentEdit(init);
        }
      }
    } catch { /* ignore */ }
    setDashLoading(false);
  }, [token]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    const today = new Date();
    let d_from = "", d_to = today.toISOString().slice(0, 10);
    if (period === "day") { d_from = d_to; }
    else if (period === "week") { const f = new Date(today); f.setDate(today.getDate() - 6); d_from = f.toISOString().slice(0, 10); }
    else if (period === "month") { const f = new Date(today); f.setDate(today.getDate() - 29); d_from = f.toISOString().slice(0, 10); }
    else { d_from = dateFrom; d_to = dateTo; }
    const url = `${API}?action=analytics&period=${period}&date_from=${d_from}&date_to=${d_to}`;
    const res = await fetch(url, { headers: adminHeaders(token) });
    const data = await res.json();
    setAnalytics(data);
    setAnalyticsLoading(false);
  }, [token, period, dateFrom, dateTo]);

  const loadEntries = useCallback(async () => {
    setEntriesLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const d_from = (entryShop === "all" && entryCat === "all")
      ? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      : new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    let url = `${API}?action=entries&date_from=${d_from}&date_to=${today}`;
    if (entryShop !== "all") url += `&shop=${entryShop}`;
    if (entryCat !== "all") url += `&category=${entryCat}`;
    const res = await fetch(url, { headers: adminHeaders(token) });
    const data = await res.json();
    setEntries(data.entries || []);
    setEntriesLoading(false);
  }, [token, entryShop, entryCat]);

  useEffect(() => { loadDash(); }, [loadDash]);
  useEffect(() => { if (view === "analytics") loadAnalytics(); }, [view, loadAnalytics]);
  useEffect(() => { if (view === "entries") loadEntries(); }, [view, loadEntries]);

  const goldTotal = goldGrams && goldPrice ? parseFloat(goldGrams) * parseFloat(goldPrice) : 0;

  const submitGold = async () => {
    if (!goldGrams || !goldPrice) return;
    setGoldSaving(true); setGoldMsg(null);
    const action = goldTab === "buy" ? "add_gold_buy" : "sell_gold";
    const res = await fetch(API, {
      method: "POST", headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        action, grams: parseFloat(goldGrams),
        price_per_gram: parseFloat(goldPrice),
        shop: goldShop, date: goldDate, comment: goldComment,
      }),
    });
    const data = await res.json();
    setGoldSaving(false);
    if (data.error) { setGoldMsg("Ошибка: " + data.error); return; }
    const verb = goldTab === "buy" ? "Куплено" : "Продано";
    setGoldMsg(`${verb} ${goldGrams} г на ${fmt(goldTotal)} ₽`);
    setGoldGrams(""); setGoldPrice(""); setGoldComment("");
    loadDash();
  };

  const submitPhone = async () => {
    if (!phoneAmount) return;
    setPhoneSaving(true); setPhoneMsg(null);
    const res = await fetch(API, {
      method: "POST", headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_phone_sale",
        amount: parseFloat(phoneAmount),
        shop: phoneShop, date: phoneDate, comment: phoneComment,
      }),
    });
    const data = await res.json();
    setPhoneSaving(false);
    if (data.error) { setPhoneMsg("Ошибка: " + data.error); return; }
    setPhoneMsg(`Записано +${fmt(parseFloat(phoneAmount))} ₽`);
    setPhoneAmount(""); setPhoneComment("");
    loadDash();
  };

  const saveRent = async (shop: string) => {
    setRentSaving(shop); setRentMsg(null);
    const res = await fetch(API, {
      method: "POST", headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_rent", shop, amount: parseFloat(rentEdit[shop] || "0") }),
    });
    const data = await res.json();
    setRentSaving(null);
    if (data.error) { setRentMsg("Ошибка: " + data.error); return; }
    setRentMsg("Сохранено");
    setRentSettings(prev => ({ ...prev, [shop]: { ...prev[shop], amount: parseFloat(rentEdit[shop] || "0") } }));
    loadDash();
  };

  const chargeRent = async (shop: string) => {
    setChargingRent(shop); setRentMsg(null);
    const res = await fetch(API, {
      method: "POST", headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "charge_rent", shop, date: new Date().toISOString().slice(0, 10) }),
    });
    const data = await res.json();
    setChargingRent(null);
    if (data.error) { setRentMsg("Ошибка: " + data.error); return; }
    setRentMsg(`Аренда списана: -${fmt(data.amount)} ₽`);
    loadDash();
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("Удалить запись #" + id + "?")) return;
    await fetch(API, {
      method: "POST", headers: { ...adminHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_entry", id }),
    });
    loadEntries(); loadDash();
  };

  const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
  const LBL = "font-roboto text-white/40 text-[10px] block mb-1";
  const BTN_Y = "flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold px-4 py-2 text-xs uppercase hover:bg-yellow-400 transition-colors disabled:opacity-50";
  const BTN_G = "flex items-center gap-1.5 border border-[#333] text-white/60 hover:text-white hover:border-white/40 px-3 py-1.5 font-roboto text-xs transition-colors disabled:opacity-40";

  const NAV: { key: View; label: string; icon: string }[] = [
    { key: "dashboard", label: "Сегодня",   icon: "LayoutDashboard" },
    { key: "gold",      label: "Золото",     icon: "Gem" },
    { key: "phones",    label: "Телефоны",   icon: "Smartphone" },
    { key: "rent",      label: "Аренда",     icon: "Building2" },
    { key: "analytics", label: "Аналитика",  icon: "BarChart2" },
    { key: "entries",   label: "История",    icon: "List" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Шапка-навигация */}
      <div className="px-4 py-3 border-b border-[#222] flex items-center gap-2 flex-wrap">
        <div className="flex rounded overflow-hidden border border-[#333]">
          {NAV.map(n => (
            <button key={n.key} onClick={() => setView(n.key)}
              className={`px-3 py-1.5 font-roboto text-xs transition-colors flex items-center gap-1.5 ${view === n.key ? "bg-[#FFD700] text-black font-bold" : "text-white/50 hover:text-white"}`}>
              <Icon name={n.icon} size={13} />{n.label}
            </button>
          ))}
        </div>
        <button onClick={loadDash} disabled={dashLoading} className="ml-auto text-white/40 hover:text-white p-1.5">
          <Icon name={dashLoading ? "Loader" : "RefreshCw"} size={14} className={dashLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div className="p-4 space-y-4 max-w-3xl">
            {dashLoading && <div className="text-white/30 text-sm text-center py-10">Загружаю...</div>}
            {dash?.today && (
              <>
                <div className="font-roboto text-white/30 text-[10px] uppercase tracking-widest">
                  За сегодня — {new Date(dash.today.date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                </div>

                {/* Карточки-итоги */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Золото", value: dash.today.gold_sell - dash.today.gold_buy, icon: "Gem", color: "text-yellow-400" },
                    { label: "Ремонт", value: dash.today.repair, icon: "Wrench", color: "text-blue-400" },
                    { label: "Телефоны", value: dash.today.phone_sale, icon: "Smartphone", color: "text-purple-400" },
                    { label: "Итого", value: dash.today.total, icon: "TrendingUp", color: dash.today.total >= 0 ? "text-green-400" : "text-red-400" },
                  ].map(c => (
                    <div key={c.label} className="bg-[#1A1A1A] border border-[#333] p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon name={c.icon} size={13} className={c.color} />
                        <span className="font-roboto text-[10px] text-white/40 uppercase tracking-wider">{c.label}</span>
                      </div>
                      <div className={`font-oswald font-bold text-xl ${c.color}`}>
                        {c.value >= 0 ? "+" : ""}{fmt(c.value)} ₽
                      </div>
                    </div>
                  ))}
                </div>

                {/* Аренда и золото */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#1A1A1A] border border-[#333] p-3">
                    <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-2">Аренда (расход)</div>
                    {SHOPS.map(s => (
                      <div key={s.key} className="flex justify-between items-center py-1">
                        <span className="font-roboto text-xs text-white/60">{s.label}</span>
                        <span className="font-roboto text-xs text-red-400">
                          {dash.rent?.[s.key]?.amount ? `-${fmt(dash.rent[s.key].amount)} ₽` : "не задана"}
                          <span className="text-white/20 ml-1">({dash.rent?.[s.key]?.day_of_month} числа)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#1A1A1A] border border-[#333] p-3">
                    <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-2">Золото на остатке</div>
                    <div className="font-oswald font-bold text-2xl text-yellow-400">{fmtDec(dash.gold_stock_grams)} г</div>
                    <div className="font-roboto text-[10px] text-white/30 mt-1">наборное золото</div>
                  </div>
                </div>

                {/* График недели */}
                {dash.weekly_daily.length > 0 && (
                  <div className="bg-[#1A1A1A] border border-[#333] p-3">
                    <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-3">Прибыль за 7 дней</div>
                    <div className="flex items-end gap-1 h-20">
                      {dash.weekly_daily.map(d => {
                        const profit = (typeof d.gold_sell === "number" ? d.gold_sell : 0)
                          - (typeof d.gold_buy === "number" ? d.gold_buy : 0)
                          + (typeof d.repair === "number" ? d.repair : 0)
                          + (typeof d.phone_sale === "number" ? d.phone_sale : 0)
                          + (typeof d.rent === "number" ? d.rent : 0)
                          + (typeof d.other_expense === "number" ? d.other_expense : 0);
                        const all = dash.weekly_daily.map(x => {
                          const v = Object.values(x).filter(v => typeof v === "number").reduce((a, b) => (a as number) + (b as number), 0);
                          return Math.abs(v as number);
                        });
                        const maxVal = Math.max(...(all as number[]), 1);
                        const pct = Math.abs(profit) / maxVal * 100;
                        const ds = new Date(d.date + "T00:00:00");
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${ds.toLocaleDateString("ru-RU", {day:"numeric",month:"short"})}: ${fmt(profit)} ₽`}>
                            <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                              <div
                                className={`w-full rounded-sm transition-all ${profit >= 0 ? "bg-[#FFD700]/70" : "bg-red-500/60"}`}
                                style={{ height: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                            <div className="font-roboto text-[9px] text-white/30">
                              {ds.toLocaleDateString("ru-RU", { day: "numeric", month: "numeric" })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ЗОЛОТО ── */}
        {view === "gold" && (
          <div className="p-4 space-y-4 max-w-md">
            <div className="flex gap-2 mb-2">
              {[{ k: "buy", l: "Купить золото" }, { k: "sell", l: "Продать (инкассо)" }].map(t => (
                <button key={t.k} onClick={() => setGoldTab(t.k as "buy" | "sell")}
                  className={`flex-1 py-2 font-roboto text-xs border transition-colors ${goldTab === t.k ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
                  {t.l}
                </button>
              ))}
            </div>

            {goldTab === "buy" && (
              <div className="bg-[#1A1A1A] border border-[#FFD700]/20 p-4 space-y-3">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest">Покупка наборного золота</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LBL}>Граммы (г)</label>
                    <input type="number" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} placeholder="0.000" className={INP} />
                  </div>
                  <div>
                    <label className={LBL}>Цена за 1 гр (₽)</label>
                    <input type="number" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} placeholder="2500" className={INP} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LBL}>Магазин</label>
                    <select value={goldShop} onChange={e => setGoldShop(e.target.value)} className={INP}>
                      {SHOPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Дата</label>
                    <input type="date" value={goldDate} onChange={e => setGoldDate(e.target.value)} className={INP} />
                  </div>
                </div>
                <div>
                  <label className={LBL}>Комментарий</label>
                  <input value={goldComment} onChange={e => setGoldComment(e.target.value)} placeholder="Кольца, цепи, зубы..." className={INP} />
                </div>
                {goldTotal > 0 && (
                  <div className="font-roboto text-xs text-yellow-400">
                    Итого: {fmtDec(parseFloat(goldGrams || "0"))} г × {fmt(parseFloat(goldPrice || "0"))} ₽ = <strong>{fmt(goldTotal)} ₽</strong>
                  </div>
                )}
                <button onClick={submitGold} disabled={goldSaving || !goldGrams || !goldPrice} className={BTN_Y}>
                  <Icon name={goldSaving ? "Loader" : "ShoppingCart"} size={13} className={goldSaving ? "animate-spin" : ""} />
                  {goldSaving ? "Сохраняю..." : "Записать покупку"}
                </button>
              </div>
            )}

            {goldTab === "sell" && (
              <div className="bg-[#1A1A1A] border border-green-500/20 p-4 space-y-3">
                <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest">Продажа / инкассо золота</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LBL}>Граммы (г)</label>
                    <input type="number" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} placeholder="0.000" className={INP} />
                  </div>
                  <div>
                    <label className={LBL}>Цена продажи за 1 гр (₽)</label>
                    <input type="number" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} placeholder="3200" className={INP} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LBL}>Магазин</label>
                    <select value={goldShop} onChange={e => setGoldShop(e.target.value)} className={INP}>
                      {SHOPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LBL}>Дата</label>
                    <input type="date" value={goldDate} onChange={e => setGoldDate(e.target.value)} className={INP} />
                  </div>
                </div>
                <div>
                  <label className={LBL}>Комментарий</label>
                  <input value={goldComment} onChange={e => setGoldComment(e.target.value)} placeholder="Инкассо, скупщик..." className={INP} />
                </div>
                {goldTotal > 0 && (
                  <div className="font-roboto text-xs text-green-400">
                    Выручка: {fmtDec(parseFloat(goldGrams || "0"))} г × {fmt(parseFloat(goldPrice || "0"))} ₽ = <strong>{fmt(goldTotal)} ₽</strong>
                  </div>
                )}
                {dash && (
                  <div className="font-roboto text-[10px] text-yellow-400/70">
                    Остаток на складе: {fmtDec(dash.gold_stock_grams)} г
                  </div>
                )}
                <button onClick={submitGold} disabled={goldSaving || !goldGrams || !goldPrice} className={BTN_Y}>
                  <Icon name={goldSaving ? "Loader" : "ArrowUpCircle"} size={13} className={goldSaving ? "animate-spin" : ""} />
                  {goldSaving ? "Сохраняю..." : "Записать продажу"}
                </button>
              </div>
            )}

            {goldMsg && (
              <div className={`font-roboto text-xs px-3 py-2 ${goldMsg.startsWith("Ошибка") ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>
                {goldMsg}
              </div>
            )}

            {/* Остаток золота */}
            {dash && (
              <div className="bg-[#1A1A1A] border border-[#333] p-3 flex items-center gap-3">
                <Icon name="Gem" size={20} className="text-yellow-400" />
                <div>
                  <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest">Всего на остатке</div>
                  <div className="font-oswald font-bold text-xl text-yellow-400">{fmtDec(dash.gold_stock_grams)} г</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ТЕЛЕФОНЫ ── */}
        {view === "phones" && (
          <div className="p-4 space-y-4 max-w-md">
            <div className="bg-[#1A1A1A] border border-purple-500/20 p-4 space-y-3">
              <div className="font-roboto text-white/40 text-[10px] uppercase tracking-widest">Заработок с продажи телефона</div>
              <div>
                <label className={LBL}>Прибыль (купил/продал) (₽)</label>
                <input type="number" value={phoneAmount} onChange={e => setPhoneAmount(e.target.value)} placeholder="3000" className={INP} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={LBL}>Магазин</label>
                  <select value={phoneShop} onChange={e => setPhoneShop(e.target.value)} className={INP}>
                    {SHOPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LBL}>Дата</label>
                  <input type="date" value={phoneDate} onChange={e => setPhoneDate(e.target.value)} className={INP} />
                </div>
              </div>
              <div>
                <label className={LBL}>Что продали / комментарий</label>
                <input value={phoneComment} onChange={e => setPhoneComment(e.target.value)} placeholder="iPhone 13, Samsung A52..." className={INP} />
              </div>
              <button onClick={submitPhone} disabled={phoneSaving || !phoneAmount} className={BTN_Y}>
                <Icon name={phoneSaving ? "Loader" : "Smartphone"} size={13} className={phoneSaving ? "animate-spin" : ""} />
                {phoneSaving ? "Сохраняю..." : "Записать продажу"}
              </button>
            </div>
            {phoneMsg && (
              <div className={`font-roboto text-xs px-3 py-2 ${phoneMsg.startsWith("Ошибка") ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>
                {phoneMsg}
              </div>
            )}
          </div>
        )}

        {/* ── АРЕНДА ── */}
        {view === "rent" && (
          <div className="p-4 space-y-4 max-w-md">
            <div className="font-roboto text-white/30 text-xs mb-2">
              Аренда вычитается автоматически: Кирова, 11 — 10 числа, Кирова, 7 — 25 числа. Здесь можно задать суммы и списать вручную.
            </div>
            {rentMsg && (
              <div className={`font-roboto text-xs px-3 py-2 ${rentMsg.startsWith("Ошибка") ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"}`}>
                {rentMsg}
              </div>
            )}
            {SHOPS.map(s => (
              <div key={s.key} className="bg-[#1A1A1A] border border-[#333] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon name="Building2" size={15} className="text-[#FFD700]" />
                  <span className="font-roboto text-sm text-white font-medium">{s.label}</span>
                  <span className="font-roboto text-[10px] text-white/30 ml-auto">
                    списывается {rentSettings[s.key]?.day_of_month || "—"} числа
                  </span>
                </div>
                <div>
                  <label className={LBL}>Сумма аренды (₽/мес)</label>
                  <input
                    type="number"
                    value={rentEdit[s.key] ?? ""}
                    onChange={e => setRentEdit(prev => ({ ...prev, [s.key]: e.target.value }))}
                    placeholder="50000"
                    className={INP}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveRent(s.key)} disabled={rentSaving === s.key} className={BTN_Y}>
                    <Icon name={rentSaving === s.key ? "Loader" : "Save"} size={13} className={rentSaving === s.key ? "animate-spin" : ""} />
                    Сохранить
                  </button>
                  <button onClick={() => chargeRent(s.key)} disabled={chargingRent === s.key} className={BTN_G}>
                    <Icon name={chargingRent === s.key ? "Loader" : "Minus"} size={13} className={chargingRent === s.key ? "animate-spin" : ""} />
                    Списать сейчас
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── АНАЛИТИКА ── */}
        {view === "analytics" && (
          <div className="p-4 space-y-4 max-w-3xl">
            {/* Переключатель периода */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { k: "day",       l: "Сегодня" },
                { k: "yesterday", l: "Вчера" },
                { k: "week",      l: "Неделя" },
                { k: "month",     l: "Месяц" },
                { k: "custom",    l: "Период" },
              ].map(p => (
                <button key={p.k} onClick={() => setPeriod(p.k as Period)}
                  className={`px-3 py-1.5 font-roboto text-xs border transition-colors ${period === p.k ? "border-[#FFD700] text-[#FFD700] bg-[#FFD700]/10" : "border-[#333] text-white/40 hover:text-white"}`}>
                  {p.l}
                </button>
              ))}
              {period === "custom" && (
                <>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
                  <span className="text-white/20 text-xs">—</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#0D0D0D] border border-[#333] text-white/70 px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700] w-32" />
                  <button onClick={loadAnalytics} className={BTN_Y}>Показать</button>
                </>
              )}
              <button onClick={loadAnalytics} disabled={analyticsLoading} className={BTN_G}>
                <Icon name={analyticsLoading ? "Loader" : "RefreshCw"} size={13} className={analyticsLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {analyticsLoading && <div className="text-white/30 text-sm text-center py-10">Загружаю...</div>}

            {analytics && !analyticsLoading && (
              <>
                <div className="font-roboto text-[10px] text-white/20 uppercase tracking-widest">
                  {analytics.date_from} — {analytics.date_to}
                </div>

                {/* Итого */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Доходы", value: analytics.total_income, color: "text-green-400" },
                    { label: "Расходы", value: analytics.total_expense, color: "text-red-400", neg: true },
                    { label: "Прибыль", value: analytics.net_profit, color: analytics.net_profit >= 0 ? "text-[#FFD700]" : "text-red-400" },
                  ].map(c => (
                    <div key={c.label} className="bg-[#1A1A1A] border border-[#333] p-3">
                      <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-1">{c.label}</div>
                      <div className={`font-oswald font-bold text-lg ${c.color}`}>
                        {c.neg ? "-" : c.value >= 0 ? "+" : ""}{fmt(Math.abs(c.value))} ₽
                      </div>
                    </div>
                  ))}
                </div>

                {/* По категориям */}
                <div className="bg-[#1A1A1A] border border-[#333] p-3 space-y-2">
                  <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-2">По категориям</div>
                  {Object.entries(analytics.totals).filter(([, v]) => v !== 0).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className={`font-roboto text-xs ${CAT_COLOR[cat] || "text-white/60"}`}>{CATEGORY_LABELS[cat] || cat}</span>
                      <span className={`font-roboto text-xs font-bold ${val >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {val >= 0 ? "+" : ""}{fmt(val)} ₽
                      </span>
                    </div>
                  ))}
                </div>

                {/* По магазинам */}
                <div className="grid grid-cols-2 gap-2">
                  {SHOPS.map(s => {
                    const shopData = analytics.by_shop[s.key] || {};
                    const total = Object.values(shopData).reduce((a, b) => a + b, 0);
                    return (
                      <div key={s.key} className="bg-[#1A1A1A] border border-[#333] p-3 space-y-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Icon name="Building2" size={13} className="text-[#FFD700]" />
                          <span className="font-roboto text-xs text-white/70 font-medium">{s.label}</span>
                        </div>
                        {Object.entries(shopData).filter(([, v]) => v !== 0).map(([cat, val]) => (
                          <div key={cat} className="flex justify-between">
                            <span className="font-roboto text-[10px] text-white/40">{CATEGORY_LABELS[cat] || cat}</span>
                            <span className={`font-roboto text-[10px] ${val >= 0 ? "text-green-400" : "text-red-400"}`}>{val >= 0 ? "+" : ""}{fmt(val)}</span>
                          </div>
                        ))}
                        <div className="border-t border-[#333] pt-1 flex justify-between">
                          <span className="font-roboto text-[10px] text-white/30">Итого</span>
                          <span className={`font-roboto text-xs font-bold ${total >= 0 ? "text-[#FFD700]" : "text-red-400"}`}>{total >= 0 ? "+" : ""}{fmt(total)} ₽</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* График по дням */}
                {analytics.daily.length > 1 && (
                  <div className="bg-[#1A1A1A] border border-[#333] p-3">
                    <div className="font-roboto text-[10px] text-white/30 uppercase tracking-widest mb-3">Прибыль по дням</div>
                    <div className="flex items-end gap-0.5 h-24">
                      {analytics.daily.map(d => {
                        const profit = Object.entries(d).filter(([k]) => k !== "date").reduce((a, [, v]) => a + (typeof v === "number" ? v : 0), 0);
                        const all = analytics.daily.map(x =>
                          Math.abs(Object.entries(x).filter(([k]) => k !== "date").reduce((a, [, v]) => a + (typeof v === "number" ? v : 0), 0))
                        );
                        const maxVal = Math.max(...all, 1);
                        const pct = Math.abs(profit) / maxVal * 100;
                        const ds = new Date(d.date + "T00:00:00");
                        return (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.date}: ${fmt(profit)} ₽`}>
                            <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                              <div
                                className={`w-full rounded-sm ${profit >= 0 ? "bg-[#FFD700]/70" : "bg-red-500/60"}`}
                                style={{ height: `${Math.max(pct, 3)}%` }}
                              />
                            </div>
                            <div className="font-roboto text-[8px] text-white/20 truncate w-full text-center">
                              {ds.toLocaleDateString("ru-RU", { day: "numeric" })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ИСТОРИЯ ── */}
        {view === "entries" && (
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select value={entryShop} onChange={e => setEntryShop(e.target.value)} className="bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]">
                <option value="all">Все магазины</option>
                {SHOPS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select value={entryCat} onChange={e => setEntryCat(e.target.value)} className="bg-[#0D0D0D] border border-[#333] text-white px-2 py-1.5 font-roboto text-xs focus:outline-none focus:border-[#FFD700]">
                <option value="all">Все категории</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button onClick={loadEntries} disabled={entriesLoading} className={BTN_G}>
                <Icon name={entriesLoading ? "Loader" : "RefreshCw"} size={13} className={entriesLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {entriesLoading && <div className="text-white/30 text-sm text-center py-10">Загружаю...</div>}
            {!entriesLoading && entries.length === 0 && (
              <div className="text-white/20 text-sm text-center py-10">Записей нет</div>
            )}
            <div className="space-y-1">
              {entries.map(e => (
                <div key={e.id} className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] px-3 py-2 hover:border-[#333] transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.amount >= 0 ? "#4ade80" : "#f87171" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-roboto text-xs font-bold ${e.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {e.amount >= 0 ? "+" : ""}{fmt(e.amount)} ₽
                      </span>
                      <span className={`font-roboto text-[10px] ${CAT_COLOR[e.category] || "text-white/40"}`}>{CATEGORY_LABELS[e.category] || e.category}</span>
                      <span className="font-roboto text-[10px] text-white/20">{SHOPS.find(s => s.key === e.shop)?.label || e.shop}</span>
                      {e.gold_grams && (
                        <span className="font-roboto text-[10px] text-yellow-400/60">{fmtDec(e.gold_grams)} г</span>
                      )}
                    </div>
                    {e.comment && <div className="font-roboto text-[10px] text-white/30 truncate">{e.comment}</div>}
                  </div>
                  <div className="font-roboto text-[10px] text-white/20 shrink-0">
                    {new Date(e.entry_date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </div>
                  <button onClick={() => deleteEntry(e.id)} className="text-white/10 hover:text-red-400 transition-colors p-1 shrink-0">
                    <Icon name="X" size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}