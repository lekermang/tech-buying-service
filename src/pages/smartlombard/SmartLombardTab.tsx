import { useState, lazy, Suspense } from "react";
import Icon from "@/components/ui/icon";

const Dashboard = lazy(() => import("./SLDashboard"));
const Operations = lazy(() => import("./SLOperations"));
const Clients = lazy(() => import("./SLClients"));
const NewPledge = lazy(() => import("./SLNewPledge"));
const Tickets = lazy(() => import("./SLTickets"));
const GoodsList = lazy(() => import("./SLGoods"));
const Reconcile = lazy(() => import("./SLReconcile"));

type Section = "dashboard" | "operations" | "clients" | "new_pledge" | "tickets" | "goods" | "reconcile";

const SECTIONS: { k: Section; l: string; icon: string; ownerOnly?: boolean }[] = [
  { k: "dashboard",  l: "Сводка",     icon: "LayoutDashboard" },
  { k: "operations", l: "Операции",   icon: "Activity" },
  { k: "clients",    l: "Клиенты",    icon: "Users" },
  { k: "new_pledge", l: "Новый залог", icon: "PlusCircle", ownerOnly: true },
  { k: "tickets",    l: "Билеты",     icon: "FileText" },
  { k: "goods",      l: "Товары",     icon: "Package" },
  { k: "reconcile",  l: "Сверка",     icon: "GitCompareArrows", ownerOnly: true },
];

export function SmartLombardTab({ token, myRole }: { token: string; myRole: string }) {
  const [section, setSection] = useState<Section>("dashboard");
  const isOwnerOrAdmin = myRole === "owner" || myRole === "admin";
  const visible = SECTIONS.filter(s => !s.ownerOnly || isOwnerOrAdmin);

  return (
    <div className="flex flex-col">
      {/* Шапка раздела */}
      <div className="px-3 pt-3 pb-2">
        <div className="bg-gradient-to-br from-[#FFD700]/10 via-transparent to-blue-500/5 border border-[#FFD700]/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black flex items-center justify-center shrink-0">
              <Icon name="Gem" size={16} />
            </div>
            <div>
              <div className="font-oswald font-bold text-white text-sm uppercase leading-tight">SmartLombard</div>
              <div className="font-roboto text-white/40 text-[10px]">онлайн-управление ломбардом</div>
            </div>
          </div>
        </div>
      </div>

      {/* Подменю секций */}
      <div className="px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {visible.map(s => {
            const a = section === s.k;
            return (
              <button key={s.k} onClick={() => setSection(s.k)}
                className={`shrink-0 flex items-center gap-1.5 font-roboto text-[11px] px-3 py-2 rounded-md transition-all active:scale-95 ${
                  a
                    ? "bg-[#FFD700] text-black font-bold shadow-md shadow-[#FFD700]/20"
                    : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white"
                }`}>
                <Icon name={s.icon} size={13} />{s.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Контент секции */}
      <Suspense fallback={
        <div className="flex items-center justify-center py-16 text-white/30 font-roboto text-sm">
          <Icon name="Loader" size={16} className="animate-spin mr-2" />Загружаю...
        </div>
      }>
        {section === "dashboard"  && <Dashboard token={token} />}
        {section === "operations" && <Operations token={token} />}
        {section === "clients"    && <Clients token={token} myRole={myRole} />}
        {section === "new_pledge" && isOwnerOrAdmin && <NewPledge token={token} />}
        {section === "tickets"    && <Tickets token={token} />}
        {section === "goods"      && <GoodsList token={token} />}
        {section === "reconcile"  && isOwnerOrAdmin && <Reconcile token={token} />}
      </Suspense>
    </div>
  );
}

export default SmartLombardTab;