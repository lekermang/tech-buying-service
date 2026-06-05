import Icon from "@/components/ui/icon";
import MarkupCard from "@/pages/staffUnlock/MarkupCard";
import { MarkupRow, Order, Tx, Client, STATUS_COLOR, STATUS_LABEL } from "@/pages/staffUnlock/unlockTypes";

/* ── НАЦЕНКИ ─────────────────────────────────────────────────────── */
interface MarkupSectionProps {
  loading: boolean;
  markup: MarkupRow[];
  onSaved: () => void;
}
export function MarkupSection({ loading, markup, onSaved }: MarkupSectionProps) {
  return (
    <div>
      <div className="font-roboto text-[11px] text-white/30 mb-4 leading-relaxed">
        Наценка применяется автоматически ко всем услугам при отображении цены клиенту.
      </div>
      {loading
        ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />)}
          </div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {markup.map(row => <MarkupCard key={row.id} row={row} onSaved={onSaved} />)}
          </div>
      }
    </div>
  );
}

/* ── УСЛУГИ 3GSM ─────────────────────────────────────────────────── */
interface ServicesSectionProps {
  syncing: boolean;
  syncResult: { count: number; sample?: object[] } | null;
  syncRaw: string | null;
  htmlSource: string;
  onHtmlSourceChange: (value: string) => void;
  onSync: () => void;
}
export function ServicesSection({
  syncing,
  syncResult,
  syncRaw,
  htmlSource,
  onHtmlSourceChange,
  onSync,
}: ServicesSectionProps) {
  return (
    <div>
      <div className="rounded-2xl overflow-hidden mb-4"
        style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(125,211,252,0.15)" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div>
            <div className="font-oswald font-bold text-base text-white uppercase">Синхронизация услуг</div>
            <div className="font-roboto text-[10px] text-white/35 mt-0.5">
              Загружает актуальный каталог из 3gsm.ru → сохраняет в кэш → клиенты видят свежие цены
            </div>
          </div>
          <button onClick={onSync} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-oswald font-bold text-xs uppercase text-black transition-all disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg,#7dd3fc,#0ea5e9)" }}>
            <Icon name={syncing ? "Loader" : "RefreshCcw"} size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Синхронизирую..." : "Синхронизировать"}
          </button>
        </div>
        <div className="px-5 py-4">
          {syncResult && (
            <div className="flex items-start gap-3 p-3 rounded-xl mb-3"
              style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.25)" }}>
              <Icon name="CheckCircle" size={16} className="text-[#6ee7b7] shrink-0 mt-0.5" />
              <div>
                <div className="font-oswald font-bold text-sm text-[#6ee7b7]">
                  Загружено {syncResult.count} услуг из 3gsm.ru
                </div>
                {syncResult.sample && syncResult.sample.length > 0 && (
                  <div className="font-roboto text-[10px] text-white/40 mt-1">
                    Примеры: {(syncResult.sample as Record<string,string>[]).slice(0,2).map(s => s.title || s.serviceid).join(" · ")}
                  </div>
                )}
              </div>
            </div>
          )}
          {syncRaw && (
            <div className="p-3 rounded-xl mb-3"
              style={{ background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.2)" }}>
              <div className="font-roboto text-xs text-[#fca5a5] font-bold mb-1">API 3gsm недоступен. Используй ручную загрузку ↓</div>
              <div className="font-mono text-[10px] text-white/30 truncate">{syncRaw.slice(0,200)}</div>
            </div>
          )}

          {/* Ручная загрузка HTML */}
          <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.15)" }}>
            <div className="font-oswald font-bold text-sm text-white/70 uppercase mb-1 flex items-center gap-2">
              <Icon name="Code" size={14} style={{ color: "#FFD700" }} />
              Загрузить HTML вручную
            </div>
            <div className="font-roboto text-[10px] text-white/35 mb-3 leading-relaxed">
              1. Открой <a href="https://3gsm.ru/resellerplaceorder/imei" target="_blank" className="text-[#7dd3fc] underline">3gsm.ru/resellerplaceorder/imei</a><br />
              2. Нажми F12 → Elements → найди <code className="text-[#FFD700]">&lt;select id="service_id"&gt;</code><br />
              3. Правой кнопкой → «Copy → OuterHTML» → вставь сюда
            </div>
            <textarea
              value={htmlSource}
              onChange={e => onHtmlSourceChange(e.target.value)}
              placeholder='<select id="service_id">...<optgroup label="IMEI Check">...<option value="45c48..." data-price="0.018">Apple FMI check - 0.018 usd</option>...'
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg font-mono text-[10px] text-white/70 outline-none resize-none mb-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button
              onClick={onSync}
              disabled={syncing || !htmlSource.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-oswald font-bold text-xs uppercase text-black disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)" }}>
              <Icon name={syncing ? "Loader" : "Upload"} size={13} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Загружаю..." : "Загрузить и сохранить"}
            </button>
          </div>

          <div className="mt-3 font-roboto text-[10px] text-white/20 leading-relaxed">
            Кэш хранится 1 час · После загрузки услуги сразу появятся на /unlock · Наценки применяются автоматически
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── КЛИЕНТЫ ─────────────────────────────────────────────────────── */
interface ClientsSectionProps {
  loading: boolean;
  clients: Client[];
}
export function ClientsSection({ loading, clients }: ClientsSectionProps) {
  return (
    <div>
      {loading
        ? <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
        : !clients.length
          ? <div className="text-center py-14 text-white/25">
              <Icon name="Users" size={32} className="mx-auto mb-2 opacity-30"/>
              <div className="font-oswald uppercase text-sm">Клиентов ещё нет</div>
            </div>
          : <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-4 py-3 border-b flex items-center gap-2"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <Icon name="Users" size={14} style={{ color: "#7dd3fc" }} />
                <span className="font-oswald font-bold text-sm uppercase text-white">
                  {clients.length} клиентов
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {["#","Имя / Email","Телефон","Зарегистрирован","Заказов","Потрачено"].map(h=>(
                        <th key={h} className="px-4 py-3 text-left font-roboto text-[10px] uppercase tracking-widest text-white/25">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(cl => (
                      <tr key={cl.id} className="border-b transition-colors hover:bg-white/[0.015]"
                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 font-mono text-xs text-white/30">#{cl.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-roboto text-sm text-white/80">{cl.full_name || "—"}</div>
                          <div className="font-roboto text-[10px] text-white/35">{cl.email}</div>
                        </td>
                        <td className="px-4 py-3 font-roboto text-xs text-white/40">{cl.phone || "—"}</td>
                        <td className="px-4 py-3 font-roboto text-[10px] text-white/30 whitespace-nowrap">
                          {cl.registered_at ? new Date(cl.registered_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-oswald font-bold text-sm" style={{ color: "#7dd3fc" }}>
                            {cl.order_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                          {parseFloat(cl.total_spent || "0") > 0
                            ? `${parseFloat(cl.total_spent).toLocaleString("ru-RU")} ₽`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
      }
    </div>
  );
}

/* ── ЗАКАЗЫ (все клиенты) ────────────────────────────────────────── */
interface OrdersSectionProps {
  loading: boolean;
  orders: Order[];
  totalProfit: number;
}
export function OrdersSection({ loading, orders, totalProfit }: OrdersSectionProps) {
  return (
    <div>
      {loading
        ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
        : !orders.length
          ? <div className="text-center py-14 text-white/25">
              <Icon name="Inbox" size={32} className="mx-auto mb-2 opacity-30"/>
              <div className="font-oswald uppercase text-sm">Заказов ещё нет</div>
            </div>
          : <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-4 py-3 border-b flex items-center gap-2"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <Icon name="ClipboardList" size={14} style={{ color: "#7dd3fc" }} />
                <span className="font-oswald font-bold text-sm uppercase text-white">
                  {orders.length} заказов · прибыль {totalProfit.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {["ID","Клиент","Услуга","IMEI","Дата","3gsm","Клиент","Прибыль","Статус"].map(h=>(
                        <th key={h} className="px-3 py-3 text-left font-roboto text-[10px] uppercase tracking-widest text-white/25">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => {
                      const sc = STATUS_COLOR[o.status] ?? "#94a3b8";
                      const sl = STATUS_LABEL[o.status] ?? o.status;
                      const profit = o.price_client && o.price_credits
                        ? parseFloat(o.price_client) - parseFloat(o.price_credits) : 0;
                      return (
                        <tr key={o.id} className="border-b transition-colors hover:bg-white/[0.015]"
                          style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                          <td className="px-3 py-3 font-mono text-xs text-white/30">#{o.id}</td>
                          <td className="px-3 py-3 max-w-[120px]">
                            <div className="font-roboto text-xs text-white/70 truncate">{o.client_name || "—"}</div>
                            <div className="font-roboto text-[9px] text-white/30 truncate">{o.client_email}</div>
                          </td>
                          <td className="px-3 py-3 max-w-[160px]">
                            <div className="font-roboto text-xs text-white/75 truncate">{o.service_name}</div>
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-white/40">{o.imei || "—"}</td>
                          <td className="px-3 py-3 font-roboto text-[10px] text-white/30 whitespace-nowrap">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"}) : "—"}
                          </td>
                          <td className="px-3 py-3 font-roboto text-xs text-white/40">
                            {o.price_credits ? `${o.price_credits}₽` : "—"}
                          </td>
                          <td className="px-3 py-3 font-oswald font-bold text-sm" style={{ color: "#FFD700" }}>
                            {o.price_client ? `${o.price_client}₽` : "—"}
                          </td>
                          <td className="px-3 py-3">
                            {profit > 0
                              ? <span className="font-oswald font-bold text-sm" style={{ color: "#6ee7b7" }}>+{profit.toFixed(0)}₽</span>
                              : <span className="text-white/20">—</span>}
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-1 rounded-full font-roboto text-[10px] font-bold uppercase"
                              style={{ background: `${sc}18`, border: `1px solid ${sc}35`, color: sc }}>
                              {sl}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
      }
    </div>
  );
}

/* ── ФИНАНСЫ ─────────────────────────────────────────────────────── */
interface FinanceSectionProps {
  loading: boolean;
  txs: Tx[];
  totalIn: number;
  totalSpent: number;
  totalProfit: number;
}
export function FinanceSection({ loading, txs, totalIn, totalSpent, totalProfit }: FinanceSectionProps) {
  return (
    <div>
      {/* Сводка */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Всего пополнено",   value: `${totalIn.toLocaleString("ru-RU")} ₽`,     color: "#6ee7b7" },
          { label: "Всего списано",      value: `${totalSpent.toLocaleString("ru-RU")} ₽`,  color: "#fca5a5" },
          { label: "Прибыль (заказы)",   value: `${totalProfit.toLocaleString("ru-RU")} ₽`, color: "#FFD700" },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 rounded-xl"
            style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
            <div className="font-roboto text-[10px] uppercase tracking-widest mb-1 text-white/35">{s.label}</div>
            <div className="font-oswald font-bold text-xl" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      {loading
        ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }}/>)}</div>
        : !txs.length
          ? <div className="text-center py-14 text-white/25">
              <Icon name="CreditCard" size={32} className="mx-auto mb-2 opacity-30"/>
              <div className="font-oswald uppercase text-sm">Транзакций нет</div>
            </div>
          : <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(8,7,10,0.98)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {txs.map(tx => {
                const isIn = tx.type === "deposit";
                const color = isIn ? "#6ee7b7" : "#fca5a5";
                const typeLabel: Record<string,string> = { deposit:"Пополнение", order_payment:"Заказ", refund:"Возврат" };
                return (
                  <div key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
                      <Icon name={isIn ? "ArrowDownLeft" : "ArrowUpRight"} size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-roboto text-sm text-white/70 truncate">
                        {tx.description || typeLabel[tx.type] || tx.type}
                      </div>
                      <div className="font-roboto text-[10px] text-white/30 flex items-center gap-2">
                        <span>{tx.created_at ? new Date(tx.created_at).toLocaleString("ru-RU",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}) : "—"}</span>
                        {tx.client_name && <span className="text-white/20">· {tx.client_name}</span>}
                      </div>
                    </div>
                    <div className="font-oswald font-bold text-base shrink-0" style={{ color }}>
                      {isIn ? "+" : "−"}{parseFloat(tx.amount||"0").toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                );
              })}
            </div>
      }
    </div>
  );
}
