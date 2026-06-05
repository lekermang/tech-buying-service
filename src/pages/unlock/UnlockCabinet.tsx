import { useState, useEffect, useCallback } from "react";
import { clearToken, authCall, apiCall } from "./unlockConstants";
import { TopupModal } from "./UnlockShared";
import { AiChatWidget } from "./UnlockAuth";
import { CabinetHeader } from "./CabinetHeader";
import { CabinetNav, type Tab } from "./CabinetNav";
import { CabinetTabs } from "./CabinetTabs";

interface Client { id: number; full_name: string; email: string; phone: string; email_verified: boolean; }

export function Cabinet({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [client, setClient] = useState<Client | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [currency, setCurrency] = useState("₽");
  const [services, setServices] = useState<Record<string, string>[]>([]);
  const [myOrders, setMyOrders] = useState<Record<string, string>[]>([]);
  const [gsmOrders, setGsmOrders] = useState<Record<string, string>[]>([]);
  const [transactions, setTransactions] = useState<Record<string, string>[]>([]);
  const [loadBal, setLoadBal] = useState(true);
  const [loadSvc, setLoadSvc] = useState(true);
  const [loadOrd, setLoadOrd] = useState(true);
  const [loadTx, setLoadTx] = useState(false);
  const [prefillSvc, setPrefillSvc] = useState<Record<string, string> | null>(null);
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showTopup, setShowTopup] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoadBal(true);
    const d = await apiCall("getBalance").catch(() => null);
    if (d?.credits) { setBalance(d.credits); if (d.currency) setCurrency(d.currency); }
    setLoadBal(false);
  }, []);

  const fetchServices = useCallback(async (forceRefresh = false) => {
    setLoadSvc(true);
    const action = forceRefresh ? "getServices&refresh=1" : "getServices";
    const d = await apiCall(action).catch(() => null);
    if (d?.services) setServices(d.services);
    setLoadSvc(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadOrd(true);
    const [my, gsm] = await Promise.all([
      apiCall("myOrders", {}, "GET").catch(() => null),
      apiCall("getOrderList", {}, "GET").catch(() => null),
    ]);
    if (my?.orders) setMyOrders(my.orders);
    if (gsm?.orders) setGsmOrders(gsm.orders);
    setLoadOrd(false);
  }, []);

  const fetchClient = useCallback(async () => {
    const d = await authCall({ action: "me" }).catch(() => null);
    if (d?.id) setClient(d);
    else { clearToken(); onLogout(); }
  }, [onLogout]);

  const fetchTransactions = useCallback(async () => {
    setLoadTx(true);
    const d = await apiCall("getTransactions", {}, "GET").catch(() => null);
    if (d?.transactions) setTransactions(d.transactions);
    setLoadTx(false);
  }, []);

  useEffect(() => {
    fetchClient();
    fetchBalance();
    fetchServices();
    fetchOrders();
  }, [fetchClient, fetchBalance, fetchServices, fetchOrders]);

  useEffect(() => {
    if (tab === "transactions" && transactions.length === 0) fetchTransactions();
    if (tab === "profile" && transactions.length === 0) fetchTransactions();
  }, [tab, transactions.length, fetchTransactions]);

  async function refreshOrderStatus(o: Record<string, string>) {
    if (!o.gsm_order_id) return;
    const d = await apiCall("refreshStatus", { gsm_order_id: o.gsm_order_id, local_id: o.id }, "POST");
    if (d.status) {
      setMyOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: d.status } : x));
    }
  }

  const allOrders = myOrders.length ? myOrders : gsmOrders;

  const completedCnt = allOrders.filter(o => ["completed","approved","success"].includes((o.status ?? "").toLowerCase())).length;
  const pendingCnt   = allOrders.filter(o => ["pending","processing","inprogress","queued","sent"].includes((o.status ?? "").toLowerCase())).length;

  return (
    <div className="min-h-screen" style={{ background: "#060406" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 35% at 50% 0%,rgba(255,215,0,0.06) 0%,transparent 60%)" }} />

      {showTopup && client && (
        <TopupModal client={client} onClose={() => setShowTopup(false)} />
      )}

      <AiChatWidget />

      <CabinetHeader
        client={client}
        balance={balance}
        currency={currency}
        loadBal={loadBal}
        onTopup={() => setShowTopup(true)}
        onLogout={onLogout}
      />

      <div className="relative max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <CabinetNav tab={tab} onTab={setTab} onLogout={onLogout} />

        <CabinetTabs
          tab={tab}
          setTab={setTab}
          client={client}
          balance={balance}
          currency={currency}
          services={services}
          allOrders={allOrders}
          transactions={transactions}
          prefillSvc={prefillSvc}
          setPrefillSvc={setPrefillSvc}
          search={search}
          setSearch={setSearch}
          loadBal={loadBal}
          loadSvc={loadSvc}
          loadOrd={loadOrd}
          loadTx={loadTx}
          completedCnt={completedCnt}
          pendingCnt={pendingCnt}
          fetchOrders={fetchOrders}
          fetchBalance={fetchBalance}
          fetchServices={fetchServices}
          fetchTransactions={fetchTransactions}
          refreshOrderStatus={refreshOrderStatus}
          onTopup={() => setShowTopup(true)}
        />
      </div>

      {mobileMenu && <div onClick={() => setMobileMenu(false)} className="fixed inset-0 z-20" />}
    </div>
  );
}