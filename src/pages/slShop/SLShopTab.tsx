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
import C14dTab from "./c14d/C14dTab";
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
  | "contracts14d"
  | "roles";

type TabDef = { k: SubTab; l: string; icon: string; perm?: string; ownerOnly?: boolean; featured?: boolean };

const ALL_TABS: TabDef[] = [
  { k: "dashboard", l: "Сводка", icon: "LayoutDashboard" },
  { k: "buy", l: "Скупка", icon: "Plus", perm: "shop_buy" },
  { k: "contracts14d", l: "Договор продажи 14 дней", icon: "Handshake", featured: true },
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
    <div className="p-2 sm:p-2.5">
      {/* Премиум-шапка — компактная */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/3 to-transparent border border-[#FFD700]/20 px-2.5 py-2 mb-2 flex items-center gap-2 shadow-[0_0_24px_rgba(255,215,0,0.05)]">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(255,215,0,0.3)]">
          <Icon name="Gem" size={14} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold uppercase text-[13px] tracking-wide leading-tight">СмартЛомбард</div>
          <div className="text-[10px] text-white/45 truncate leading-tight">
            {perms?.name ? `${perms.name} · ` : ""}Б/У техника, антиквариат и др.
          </div>
        </div>
      </div>

      {/* Подвкладки — компактнее */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-2 -mx-1 px-1">
        {visibleTabs.map(t => {
          const active = tab === t.k;
          const isFeatured = t.featured && !active;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-[0.06em] transition-all active:scale-[0.97] ${
                active
                  ? "bg-[#FFD700] text-black shadow-[0_2px_8px_rgba(255,215,0,0.25)]"
                  : isFeatured
                    ? "bg-gradient-to-br from-[#FFD700]/20 via-[#FFD700]/10 to-transparent border border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/20 shadow-[0_0_12px_rgba(255,215,0,0.2)]"
                    : "bg-[#101010] border border-[#1A1A1A] text-white/55 hover:text-white hover:border-[#2A2A2A]"
              }`}
            >
              <Icon name={t.icon} size={11} />
              {t.l}
              {isFeatured && (
                <span className="relative inline-flex h-1 w-1 ml-0.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-1 w-1 bg-[#FFD700]" />
                </span>
              )}
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
      {tab === "contracts14d" && <C14dTab token={token} />}
      {tab === "categories" && <SLCategories token={token} />}
      {tab === "roles"      && <SLRoles token={token} isOwner={isOwner} />}
    </div>
  );
}