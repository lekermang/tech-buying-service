import Icon from "@/components/ui/icon";
import { Panel, Gold, Skeleton, OrdersTable, ServiceCard, OrderForm, TransactionRow } from "./UnlockShared";
import type { Tab } from "./CabinetNav";

interface Client { id: number; full_name: string; email: string; phone: string; email_verified: boolean; }

const TOPUP_PRESETS = [500, 1000, 2000, 5000, 10000];
const INP_SEARCH = [
  "w-full px-4 py-3 rounded-xl font-roboto text-sm text-white/85 outline-none transition-all pl-9",
  "bg-white/[0.04] border border-white/10",
  "focus:border-[rgba(255,215,0,0.4)] focus:bg-white/[0.06]",
  "placeholder:text-white/25",
].join(" ");

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  client: Client | null;
  balance: string | null;
  currency: string;
  services: Record<string, string>[];
  allOrders: Record<string, string>[];
  transactions: Record<string, string>[];
  prefillSvc: Record<string, string> | null;
  setPrefillSvc: (s: Record<string, string> | null) => void;
  search: string;
  setSearch: (v: string) => void;
  loadBal: boolean;
  loadSvc: boolean;
  loadOrd: boolean;
  loadTx: boolean;
  completedCnt: number;
  pendingCnt: number;
  fetchOrders: () => void;
  fetchBalance: () => void;
  fetchTransactions: () => void;
  refreshOrderStatus: (o: Record<string, string>) => void;
  onTopup: () => void;
}

export function CabinetTabs({
  tab, setTab,
  client, balance, currency,
  services, allOrders, transactions,
  prefillSvc, setPrefillSvc,
  search, setSearch,
  loadBal, loadSvc, loadOrd, loadTx,
  completedCnt, pendingCnt,
  fetchOrders, fetchBalance, fetchTransactions,
  refreshOrderStatus, onTopup,
}: Props) {
  const filteredSvc = services.filter(s =>
    (s.title ?? s.servicename ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="flex-1 min-w-0 pb-20 lg:pb-0">

      {/* ДАШБОРД */}
      {tab === "dashboard" && (
        <div className="space-y-5">
          <div>
            <h1 className="font-oswald font-black text-2xl sm:text-3xl uppercase text-white">
              Привет, <Gold>{client?.full_name?.split(" ")[0] ?? "..."}</Gold> 👋
            </h1>
            <p className="text-white/35 text-sm font-roboto mt-1">Кабинет разблокировки · 3gsm.ru</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "Wallet",       label: "Баланс",    value: balance ? `${balance} ${currency}` : "—", accent: "#FFD700", loading: loadBal },
              { icon: "Package",      label: "Заказов",   value: String(allOrders.length),                  accent: "#7dd3fc", loading: loadOrd },
              { icon: "CheckCircle",  label: "Выполнено", value: String(completedCnt),                      accent: "#6ee7b7", loading: loadOrd },
              { icon: "Clock",        label: "В работе",  value: String(pendingCnt),                        accent: "#c4b5fd", loading: loadOrd },
            ].map(({ icon, label, value, accent, loading: ld }) => (
              <Panel key={label}>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                    <Icon name={icon} size={18} style={{ color: accent }} />
                  </div>
                  <div>
                    <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35">{label}</div>
                    {ld ? <Skeleton h="h-5" w="w-16" /> : <div className="font-oswald font-bold text-lg" style={{ color: accent }}>{value}</div>}
                  </div>
                </div>
              </Panel>
            ))}
          </div>

          <Panel>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(125,211,252,0.1)", border: "1px solid rgba(125,211,252,0.2)" }}>
                    <Icon name="ClipboardList" size={14} style={{ color: "#7dd3fc" }} />
                  </div>
                  <span className="font-oswald font-bold text-lg uppercase text-white">Последние заказы</span>
                </div>
                <button onClick={() => setTab("orders")}
                  className="font-roboto text-[11px] flex items-center gap-1 transition-colors"
                  style={{ color: "rgba(255,215,0,0.45)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                  Все <Icon name="ChevronRight" size={11} />
                </button>
              </div>
              <OrdersTable orders={allOrders.slice(0, 5)} loading={loadOrd} onRefresh={refreshOrderStatus} />
            </div>
          </Panel>

          <Panel>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.2)" }}>
                    <Icon name="Zap" size={14} style={{ color: "#FFD700" }} />
                  </div>
                  <span className="font-oswald font-bold text-lg uppercase text-white">Популярные услуги</span>
                </div>
                <button onClick={() => setTab("services")}
                  className="font-roboto text-[11px] flex items-center gap-1 transition-colors"
                  style={{ color: "rgba(255,215,0,0.45)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,215,0,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,215,0,0.45)")}>
                  Все <Icon name="ChevronRight" size={11} />
                </button>
              </div>
              {loadSvc
                ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} h="h-20" />)}</div>
                : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.slice(0, 6).map(s => (
                      <ServiceCard key={s.serviceid ?? s.id} s={s} onOrder={svc => { setPrefillSvc(svc); setTab("neworder"); }} />
                    ))}
                  </div>
              }
            </div>
          </Panel>
        </div>
      )}

      {/* УСЛУГИ */}
      {tab === "services" && (
        <Panel>
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
                <Icon name="Grid3X3" size={17} className="text-black" />
              </div>
              <div>
                <h2 className="font-oswald font-bold text-xl uppercase text-white">Каталог услуг</h2>
                <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                  {loadSvc ? "Загрузка..." : `${services.length} услуг`}
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <Icon name="Search" size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Поиск услуги..."
                className={INP_SEARCH} />
            </div>

            {loadSvc
              ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} h="h-20" />)}</div>
              : filteredSvc.length
                ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                    {filteredSvc.map(s => (
                      <ServiceCard key={s.serviceid ?? s.id} s={s} onOrder={svc => { setPrefillSvc(svc); setTab("neworder"); }} />
                    ))}
                  </div>
                : <div className="text-center py-10 text-white/25 font-roboto text-sm">Ничего не найдено</div>
            }
          </div>
        </Panel>
      )}

      {/* ЗАКАЗЫ */}
      {tab === "orders" && (
        <Panel>
          <div className="p-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(125,211,252,0.12)", border: "1px solid rgba(125,211,252,0.25)" }}>
                  <Icon name="ClipboardList" size={17} style={{ color: "#7dd3fc" }} />
                </div>
                <div>
                  <h2 className="font-oswald font-bold text-xl uppercase text-white">История заказов</h2>
                  <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                    {loadOrd ? "Загрузка..." : `${allOrders.length} заказов`}
                  </div>
                </div>
              </div>
              <button onClick={fetchOrders}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                <Icon name="RefreshCw" size={12} />Обновить
              </button>
            </div>
            <OrdersTable orders={allOrders} loading={loadOrd} onRefresh={refreshOrderStatus} />
          </div>
        </Panel>
      )}

      {/* НОВЫЙ ЗАКАЗ */}
      {tab === "neworder" && (
        <Panel>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#6ee7b7,#059669)", boxShadow: "0 0 16px rgba(110,231,183,0.3)" }}>
                <Icon name="PlusCircle" size={17} className="text-black" />
              </div>
              <div>
                <h2 className="font-oswald font-bold text-xl uppercase text-white">Создать заказ</h2>
                <div className="font-roboto text-[10px] text-white/30 mt-0.5">Отправить IMEI на разблокировку</div>
              </div>
            </div>
            <div className="max-w-lg">
              <OrderForm
                services={services}
                prefill={prefillSvc}
                onSuccess={() => { fetchOrders(); fetchBalance(); setTab("orders"); }}
                onCancel={() => setTab("dashboard")}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* ТРАНЗАКЦИИ */}
      {tab === "transactions" && (
        <Panel>
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#6ee7b7,#059669)", boxShadow: "0 0 16px rgba(110,231,183,0.3)" }}>
                  <Icon name="ArrowLeftRight" size={17} className="text-black" />
                </div>
                <div>
                  <h2 className="font-oswald font-bold text-xl uppercase text-white">Финансы</h2>
                  <div className="font-roboto text-[10px] text-white/30 mt-0.5">
                    {loadTx ? "Загрузка..." : `${transactions.length} операций`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onTopup}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase text-black transition-all"
                  style={{
                    background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                    boxShadow: "0 0 0 1px rgba(255,215,0,0.5)",
                  }}>
                  <Icon name="Plus" size={13} />Пополнить
                </button>
                <button onClick={fetchTransactions}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,0.3)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
                  <Icon name="RefreshCw" size={12} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { label: "Пополнено", value: transactions.filter(t=>t.type==="deposit").reduce((s,t)=>s+parseFloat(t.amount||"0"),0), color: "#6ee7b7" },
                { label: "Потрачено", value: transactions.filter(t=>t.type==="order_payment").reduce((s,t)=>s+parseFloat(t.amount||"0"),0), color: "#fca5a5" },
                { label: "Операций", value: transactions.length, color: "#FFD700", noRub: true },
              ].map(({ label, value, color, noRub }) => (
                <div key={label} className="px-4 py-3 rounded-xl"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                  <div className="font-roboto text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
                  {loadTx
                    ? <Skeleton h="h-6" w="w-16" />
                    : <div className="font-oswald font-bold text-xl" style={{ color }}>
                        {noRub ? value : `${(value as number).toLocaleString("ru-RU")} ₽`}
                      </div>
                  }
                </div>
              ))}
            </div>

            {loadTx
              ? <div className="space-y-2">{[1,2,3].map(i=><Skeleton key={i} h="h-14"/>)}</div>
              : transactions.length
                ? <div>{transactions.map(tx=><TransactionRow key={tx.id} tx={tx}/>)}</div>
                : <div className="text-center py-12 text-white/25">
                    <Icon name="CreditCard" size={36} className="mx-auto mb-3 opacity-30"/>
                    <div className="font-oswald uppercase tracking-wide text-sm">Операций пока нет</div>
                    <button onClick={onTopup}
                      className="mt-4 px-4 py-2 rounded-xl font-roboto text-xs transition-all"
                      style={{ background:"rgba(255,215,0,0.08)", border:"1px solid rgba(255,215,0,0.2)", color:"rgba(255,215,0,0.7)" }}>
                      Пополнить баланс
                    </button>
                  </div>
            }
          </div>
        </Panel>
      )}

      {/* ПРОФИЛЬ */}
      {tab === "profile" && client && (
        <div className="space-y-4">
          <Panel>
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-oswald font-bold"
                  style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,215,0,0.05))", border: "2px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
                  {client.full_name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <div className="font-oswald font-bold text-xl text-white">{client.full_name}</div>
                  <div className="font-roboto text-sm text-white/45">{client.email}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: client.email_verified ? "#6ee7b7" : "#fca5a5" }} />
                    <span className="font-roboto text-[10px] uppercase tracking-widest"
                      style={{ color: client.email_verified ? "#6ee7b7" : "#fca5a5" }}>
                      {client.email_verified ? "Email подтверждён" : "Email не подтверждён"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Имя", value: client.full_name },
                  { label: "Email", value: client.email },
                  { label: "Телефон", value: client.phone || "—" },
                  { label: "ID клиента", value: `#${client.id}` },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="font-roboto text-[10px] uppercase tracking-widest text-white/30 mb-1">{label}</div>
                    <div className="font-roboto text-sm text-white/80">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Баланс + пополнение */}
          <Panel>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-roboto text-[10px] uppercase tracking-widest text-white/35 mb-1">Баланс 3gsm.ru</div>
                  {loadBal
                    ? <Skeleton h="h-7" w="w-24" />
                    : <div className="font-oswald font-bold text-3xl" style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.3)" }}>
                        {balance ?? "—"} {currency}
                      </div>
                  }
                </div>
                <button onClick={fetchBalance}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-roboto text-xs transition-all"
                  style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)", color: "rgba(255,215,0,0.7)" }}>
                  <Icon name="RefreshCw" size={12} />Обновить
                </button>
              </div>

              <div className="font-roboto text-[10px] uppercase tracking-widest text-white/30 mb-3">Быстрое пополнение</div>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {TOPUP_PRESETS.map(p => (
                  <button key={p}
                    onClick={onTopup}
                    className="py-2.5 rounded-xl font-oswald font-bold text-xs transition-all hover:scale-105"
                    style={{
                      background: "rgba(255,215,0,0.07)",
                      border: "1px solid rgba(255,215,0,0.15)",
                      color: "rgba(255,215,0,0.7)",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(255,215,0,0.14)"; el.style.borderColor = "rgba(255,215,0,0.35)"; el.style.color = "#FFD700"; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.background = "rgba(255,215,0,0.07)"; el.style.borderColor = "rgba(255,215,0,0.15)"; el.style.color = "rgba(255,215,0,0.7)"; }}>
                    {p >= 1000 ? `${p/1000}k` : p} ₽
                  </button>
                ))}
              </div>

              <button onClick={onTopup}
                className="group relative overflow-hidden w-full py-3.5 rounded-xl font-oswald font-bold uppercase tracking-wide text-sm text-black transition-all flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
                  boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 8px 24px rgba(255,215,0,0.3)",
                }}>
                <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.7)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Icon name="Plus" size={16} className="relative" />
                <span className="relative">Пополнить баланс</span>
              </button>
            </div>
          </Panel>
        </div>
      )}

    </main>
  );
}
