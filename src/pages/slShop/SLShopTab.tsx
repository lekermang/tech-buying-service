import { useState } from "react";
import Icon from "@/components/ui/icon";
import SLDashboard from "./SLDashboard";
import SLItemsList from "./SLItemsList";
import SLBuyForm from "./SLBuyForm";
import SLOperations from "./SLOperations";
import SLClientsList from "./SLClientsList";
import SLLabels from "./SLLabels";
import SLImportExport from "./SLImportExport";
import SLCategories from "./SLCategories";

type SubTab =
  | "dashboard"
  | "buy"
  | "stock"
  | "operations"
  | "clients"
  | "labels"
  | "import"
  | "categories";

const TABS: { k: SubTab; l: string; icon: string }[] = [
  { k: "dashboard", l: "Сводка", icon: "LayoutDashboard" },
  { k: "buy", l: "Скупка", icon: "Plus" },
  { k: "stock", l: "Склад", icon: "Package" },
  { k: "operations", l: "Операции", icon: "Activity" },
  { k: "clients", l: "Клиенты", icon: "Users" },
  { k: "labels", l: "Ценники", icon: "Tag" },
  { k: "import", l: "Импорт/Экспорт", icon: "ArrowUpDown" },
  { k: "categories", l: "Категории", icon: "Grid3x3" },
];

export default function SLShopTab({ token, myRole }: { token: string; myRole?: string }) {
  const [tab, setTab] = useState<SubTab>("dashboard");
  void myRole;
  return (
    <div className="p-3">
      {/* Шапка раздела */}
      <div className="rounded-xl bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent border border-[#FFD700]/20 p-3 mb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-yellow-600 flex items-center justify-center shadow-lg shadow-[#FFD700]/20">
          <Icon name="Gem" size={20} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold uppercase text-base leading-tight">СмартЛомбард</div>
          <div className="text-[11px] text-white/50">Скупка и продажа Б/У техники, антиквариата и прочих товаров</div>
        </div>
      </div>

      {/* Подвкладки */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3">
        {TABS.map(t => {
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
      {tab === "dashboard"  && <SLDashboard token={token} onNav={(k) => setTab(k as SubTab)} />}
      {tab === "buy"        && <SLBuyForm token={token} onSaved={() => setTab("stock")} />}
      {tab === "stock"      && <SLItemsList token={token} />}
      {tab === "operations" && <SLOperations token={token} />}
      {tab === "clients"    && <SLClientsList token={token} />}
      {tab === "labels"     && <SLLabels token={token} />}
      {tab === "import"     && <SLImportExport token={token} />}
      {tab === "categories" && <SLCategories token={token} />}
    </div>
  );
}
