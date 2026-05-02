import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
// re-bundle marker
import SLDashboard from "./SLDashboard";
import SLItemsList from "./SLItemsList";
import SLBuyForm from "./SLBuyForm";
import SLOperations from "./SLOperations";
import SLClientsList from "./SLClientsList";
import SLLabels from "./SLLabels";
import SLImportExport from "./SLImportExport";
import SLCategories from "./SLCategories";
import SLDiscount from "./SLDiscount";
import SLRevision from "./SLRevision";
import SLRoles from "./SLRoles";
import SLCash from "./SLCash";
import SLDocuments from "./SLDocuments";
import SLJournal from "./SLJournal";
import SLAnalytics from "./SLAnalytics";
import SLBookkeeping from "./SLBookkeeping";
import { slApi, can, type SLMyPermissions } from "./types";

type SubTab =
  | "dashboard"
  | "buy"
  | "stock"
  | "operations"
  | "clients"
  | "labels"
  | "discount"
  | "revision"
  | "cash"
  | "journal"
  | "analytics"
  | "bookkeeping"
  | "import"
  | "categories"
  | "documents"
  | "roles";

type TabDef = { k: SubTab; l: string; icon: string; perm?: string; ownerOnly?: boolean };

const ALL_TABS: TabDef[] = [
  { k: "dashboard", l: "Сводка", icon: "LayoutDashboard" },
  { k: "buy", l: "Скупка", icon: "Plus", perm: "shop_buy" },
  { k: "stock", l: "Склад", icon: "Package", perm: "shop_view" },
  { k: "cash", l: "Касса", icon: "Wallet", perm: "cashflow_view" },
  { k: "operations", l: "Операции", icon: "Activity", perm: "shop_view" },
  { k: "clients", l: "Клиенты", icon: "Users", perm: "clients" },
  { k: "labels", l: "Ценники", icon: "Tag", perm: "labels" },
  { k: "discount", l: "Уценка", icon: "TrendingDown", perm: "discount" },
  { k: "revision", l: "Ревизия", icon: "ClipboardCheck", perm: "revision" },
  { k: "journal", l: "Журнал", icon: "ScrollText" },
  { k: "analytics", l: "Аналитика", icon: "BarChart3", perm: "shifts_view_profit" },
  { k: "bookkeeping", l: "Бухгалтерия", icon: "Calculator", perm: "cashflow_view" },
  { k: "import", l: "Импорт/Экспорт", icon: "ArrowUpDown", perm: "excel_export" },
  { k: "documents", l: "Документы", icon: "FileText" },
  { k: "categories", l: "Категории", icon: "Grid3x3" },
  { k: "roles", l: "Роли и права", icon: "ShieldCheck", ownerOnly: true },
];

export default function SLShopTab({ token, myRole }: { token: string; myRole?: string }) {
  const [tab, setTab] = useState<SubTab>("dashboard");
  const [perms, setPerms] = useState<SLMyPermissions | null>(null);
  const empName = typeof window !== "undefined" ? (localStorage.getItem("employee_name") || "") : "";

  useEffect(() => {
    slApi<SLMyPermissions>(token, "my_permissions").then(r => {
      if (r.ok && r.data) setPerms(r.data);
    });
  }, [token]);

  const isOwner = perms?.is_owner || myRole === "owner";
  const visibleTabs = ALL_TABS.filter(t => {
    if (t.ownerOnly) return isOwner;
    if (!t.perm) return true;
    if (isOwner) return true;
    return can(perms?.permissions, t.perm);
  });

  return (
    <div className="p-3">
      {/* Шапка раздела */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent border border-[#FFD700]/20 p-3 mb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
          <Icon name="Gem" size={20} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold uppercase text-base leading-tight">СмартЛомбард</div>
          <div className="text-[11px] text-white/50 truncate">
            {perms?.name ? `${perms.name} · ` : ""}
            Скупка и продажа Б/У техники, антиквариата и прочих товаров
          </div>
        </div>
      </div>

      {/* Подвкладки */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
        {visibleTabs.map(t => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all active:scale-95 ${
                active
                  ? "bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/20"
                  : "bg-[#141414] border border-[#1F1F1F] text-white/60 hover:text-white hover:border-[#333]"
              }`}
            >
              <Icon name={t.icon} size={13} />
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Контент подвкладки */}
      {tab === "dashboard"  && <SLDashboard token={token} empName={empName} onNav={(k) => setTab(k as SubTab)} />}
      {tab === "buy"        && <SLBuyForm token={token} onSaved={() => setTab("stock")} />}
      {tab === "stock"      && <SLItemsList token={token} empName={empName} isOwner={isOwner} />}
      {tab === "cash"       && <SLCash token={token} isOwner={isOwner} />}
      {tab === "operations" && <SLOperations token={token} myRole={myRole} />}
      {tab === "clients"    && <SLClientsList token={token} />}
      {tab === "labels"     && <SLLabels token={token} empName={empName} />}
      {tab === "discount"   && <SLDiscount token={token} />}
      {tab === "revision"   && <SLRevision token={token} />}
      {tab === "journal"    && <SLJournal token={token} />}
      {tab === "analytics"  && <SLAnalytics token={token} />}
      {tab === "bookkeeping"&& <SLBookkeeping token={token} />}
      {tab === "import"     && <SLImportExport token={token} />}
      {tab === "documents"  && <SLDocuments token={token} isOwner={isOwner} />}
      {tab === "categories" && <SLCategories token={token} />}
      {tab === "roles"      && <SLRoles token={token} isOwner={isOwner} />}
    </div>
  );
}