import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { GOLD_URL, GoldOrder, GoldInvestorSettings, money, GOLD_STATUSES } from "./types";

type Props = {
  token: string;
  orders: GoldOrder[];
  loadingOrders: boolean;
  onReload: () => void;
};

export default function GoldInvestorTab({ token, orders, loadingOrders, onReload }: Props) {
  const headers = { "Content-Type": "application/json", "X-Employee-Token": token };
  const [settings, setSettings] = useState<GoldInvestorSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [safeEdit, setSafeEdit] = useState("");
  const [nameEdit, setNameEdit] = useState("");
  const [profitEdit, setProfitEdit] = useState("");
  const [copied, setCopied] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${GOLD_URL}?action=investor_settings`, { headers });
    const d = await r.json();
    if (d.settings) {
      setSettings(d.settings);
      setSafeEdit(String(d.settings.money_in_safe));
      setNameEdit(d.settings.investor_name);
      setProfitEdit(String(d.settings.default_profit_per_gram));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async (patch: Record<string, unknown>) => {
    setSaving(true);
    const r = await fetch(GOLD_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ action: "investor_settings", ...patch }),
    });
    const d = await r.json();
    if (d.settings) setSettings(d.settings);
    setSaving(false);
  };

  const toggleInvestor = async (order: GoldOrder) => {
    const newVal = !order.is_investor_money;
    await fetch(GOLD_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: order.id,
        is_investor_money: newVal,
        // если включаем и стоит 0 — выставляем дефолт
        investor_profit_per_gram: newVal && (!order.investor_profit_per_gram || order.investor_profit_per_gram <= 0)
          ? (settings?.default_profit_per_gram ?? 200)
          : order.investor_profit_per_gram,
      }),
    });
    onReload();
  };

  const updateProfit = async (order: GoldOrder, val: string) => {
    const v = parseFloat(val.replace(",", "."));
    if (isNaN(v) || v < 0) return;
    await fetch(GOLD_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ id: order.id, investor_profit_per_gram: v }),
    });
    onReload();
  };

  const publicUrl = settings ? `${window.location.origin}/investor/${settings.share_token}` : "";

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Считаем балансы
  const investorDeals = orders.filter(o => o.is_investor_money);
  const totalGrams = investorDeals.reduce((s, o) => s + (o.weight || 0), 0);
  const totalSpent = investorDeals.reduce((s, o) => s + (o.buy_price || 0), 0);
  const totalProfit = investorDeals.reduce(
    (s, o) => s + (o.weight || 0) * (o.investor_profit_per_gram || 0), 0,
  );
  const remainInSafe = (settings?.money_in_safe || 0) - totalSpent;

  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A] p-3 space-y-3">
      {/* Заголовок + ссылка */}
      <div className="bg-gradient-to-br from-[#1A1A0A] to-[#0D0D0D] border border-[#FFD700]/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="Briefcase" size={18} className="text-[#FFD700]" />
          <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide flex-1">
            Инвестор {settings && <span className="text-white/40 text-[11px] normal-case">· {settings.investor_name}</span>}
          </div>
          {loading && <Icon name="Loader2" size={14} className="text-white/40 animate-spin" />}
        </div>

        {settings && (
          <>
            <div className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Публичная ссылка</div>
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={publicUrl}
                onFocus={e => e.target.select()}
                className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-white/80 text-[11px] px-2 py-1.5 font-mono"
              />
              <button
                onClick={copyLink}
                className="bg-[#FFD700] text-black font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide active:scale-95 inline-flex items-center gap-1"
              >
                <Icon name={copied ? "Check" : "Copy"} size={12} />
                {copied ? "Скопировано" : "Копировать"}
              </button>
              <button
                onClick={() => window.open(publicUrl, "_blank")}
                className="bg-[#141414] border border-[#1F1F1F] text-white/70 hover:text-[#FFD700] text-[11px] px-2 py-1.5 rounded"
                title="Открыть"
              >
                <Icon name="ExternalLink" size={12} />
              </button>
              <button
                onClick={() => {
                  if (confirm("Перегенерировать ссылку? Старая перестанет работать.")) {
                    saveSettings({ regenerate_token: true });
                  }
                }}
                className="bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-red-300 text-[11px] px-2 py-1.5 rounded"
                title="Сменить ссылку"
              >
                <Icon name="RefreshCcw" size={12} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Балансы */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-3">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">В сейфе</div>
          <div className="flex items-center gap-1.5">
            <input
              value={safeEdit}
              onChange={e => setSafeEdit(e.target.value.replace(/[^\d.]/g, ""))}
              onBlur={() => {
                const v = parseFloat(safeEdit) || 0;
                if (settings && v !== settings.money_in_safe) {
                  saveSettings({ money_in_safe: v });
                }
              }}
              className="flex-1 bg-transparent text-[#FFD700] font-bold text-base font-oswald focus:outline-none w-full min-w-0"
              inputMode="decimal"
            />
            <span className="text-[#FFD700]/60 text-xs">₽</span>
          </div>
          <div className="text-[9px] text-white/35 mt-0.5">сумма, которую инвестор внёс</div>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-3">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Вложено в золото</div>
          <div className="font-oswald font-bold text-base text-white">{money(totalSpent)}</div>
          <div className="text-[9px] text-white/35 mt-0.5">остаток в сейфе: <span className="text-white/70">{money(remainInSafe)}</span></div>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-3">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Куплено грамм</div>
          <div className="font-oswald font-bold text-base text-white">{totalGrams.toFixed(2)} г</div>
          <div className="text-[9px] text-white/35 mt-0.5">{investorDeals.length} сделок</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/15 to-transparent border border-green-500/30 rounded-lg p-3">
          <div className="text-[10px] text-green-300/70 uppercase tracking-wider mb-0.5">Прибыль (отложено)</div>
          <div className="font-oswald font-bold text-base text-green-300">+{money(Math.round(totalProfit))}</div>
          <div className="text-[9px] text-green-300/50 mt-0.5">сразу при покупке</div>
        </div>
      </div>

      {/* Настройки имени и дефолтной ставки */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-3 space-y-2">
        <div className="text-[10px] text-white/40 uppercase tracking-wider">Настройки</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[9px] text-white/40 mb-0.5">Имя инвестора</div>
            <input
              value={nameEdit}
              onChange={e => setNameEdit(e.target.value)}
              onBlur={() => { if (settings && nameEdit !== settings.investor_name) saveSettings({ investor_name: nameEdit }); }}
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#FFD700]/40"
            />
          </div>
          <div>
            <div className="text-[9px] text-white/40 mb-0.5">Ставка ₽/гр (по умолчанию)</div>
            <input
              value={profitEdit}
              onChange={e => setProfitEdit(e.target.value.replace(/[^\d.]/g, ""))}
              onBlur={() => {
                const v = parseFloat(profitEdit) || 0;
                if (settings && v !== settings.default_profit_per_gram) saveSettings({ default_profit_per_gram: v });
              }}
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-[#FFD700]/40"
              inputMode="decimal"
            />
          </div>
        </div>
        {saving && <div className="text-[10px] text-white/40 flex items-center gap-1"><Icon name="Loader2" size={10} className="animate-spin" /> Сохраняю…</div>}
      </div>

      {/* Список сделок с галкой */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="text-[10px] text-white/40 uppercase tracking-wider">Сделки золота · отметь нужные</div>
          <button onClick={onReload} className="text-white/40 hover:text-[#FFD700]">
            <Icon name={loadingOrders ? "Loader2" : "RefreshCw"} size={12} className={loadingOrders ? "animate-spin" : ""} />
          </button>
        </div>

        {orders.length === 0 && !loadingOrders && (
          <div className="text-center text-white/40 text-xs py-8">Нет сделок</div>
        )}

        <div className="space-y-1.5">
          {orders.map(o => {
            const status = GOLD_STATUSES.find(s => s.key === o.status);
            const profit = (o.weight || 0) * (o.investor_profit_per_gram || 0);
            return (
              <div
                key={o.id}
                className={`rounded-lg border p-2.5 transition-all ${
                  o.is_investor_money
                    ? "bg-gradient-to-r from-[#FFD700]/8 to-transparent border-[#FFD700]/30"
                    : "bg-[#141414] border-[#1F1F1F]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleInvestor(o)}
                    className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                      o.is_investor_money
                        ? "bg-[#FFD700] border-[#FFD700]"
                        : "bg-transparent border-white/30 hover:border-[#FFD700]/60"
                    }`}
                  >
                    {o.is_investor_money && <Icon name="Check" size={13} className="text-black" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="font-roboto font-semibold text-white text-xs truncate">
                        #{o.id} {o.item_name || "—"}
                      </div>
                      {status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${status.color} font-bold uppercase`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50 mt-0.5">
                      {o.weight ? `${o.weight} г` : "—"} · {o.purity || "—"} · закуп {money(o.buy_price)}
                    </div>
                    {o.is_investor_money && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <div className="text-[10px] text-white/60">Прибыль:</div>
                        <input
                          defaultValue={String(o.investor_profit_per_gram || 0)}
                          onBlur={e => updateProfit(o, e.target.value)}
                          className="w-14 bg-[#0A0A0A] border border-[#FFD700]/30 text-[#FFD700] text-[11px] font-bold text-center rounded px-1 py-0.5 focus:outline-none focus:border-[#FFD700]"
                          inputMode="decimal"
                        />
                        <div className="text-[10px] text-white/40">₽/гр</div>
                        <div className="text-[10px] text-green-300 ml-auto font-bold">
                          = +{Math.round(profit).toLocaleString("ru-RU")} ₽
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
