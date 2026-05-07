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
import SLAvitoShowcase from "./SLAvitoShowcase";
import { slApi, can, type SLMyPermissions } from "./types";
import { SLTabsGrid } from "./slUI";

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
  | "avito"
  | "roles";

type TabDef = { k: SubTab; l: string; icon: string; perm?: string; ownerOnly?: boolean; featured?: boolean; tip?: string };

const ALL_TABS: TabDef[] = [
  { k: "dashboard",     l: "Сводка",         icon: "LayoutDashboard", tip: "Главная сводка: купили, продали, прибыль, склад за выбранный период." },
  { k: "buy",           l: "Скупка",         icon: "Plus", perm: "shop_buy", tip: "Принять Б/У товар у клиента — скупка или комиссия с печатью договора." },
  { k: "contracts14d",  l: "Договор 14 дн.", icon: "Handshake", featured: true, tip: "Скупка с правом обратного выкупа. Ставка 4 % в день, срок 14 дней." },
  { k: "avito",         l: "Витрина Авито",  icon: "Sparkles", featured: true, tip: "Загружай фото с телефона к товарам с Авито — превращай объявления в премиум-карточки на сайте." },
  { k: "stock",         l: "Склад",          icon: "Package", perm: "shop_view", tip: "Товары на складе и витрине: фильтры, поиск, ценники, продажа." },
  { k: "cash",          l: "Касса",          icon: "Wallet", perm: "cashflow_view", tip: "Кассы наличных по филиалам, приход/расход, история движений." },
  { k: "operations",    l: "Операции",       icon: "Activity", perm: "shop_view", tip: "Журнал всех операций: скупка, продажа, возврат, перемещение, списание." },
  { k: "clients",       l: "Клиенты",        icon: "Users", perm: "clients", tip: "База клиентов комиссионки — поиск, паспортные данные, история." },
  { k: "labels",        l: "Ценники",        icon: "Tag", perm: "labels", tip: "Шаблоны ценников и печать: A4, термопринтер, QR-код." },
  { k: "discount",      l: "Уценка",         icon: "TrendingDown", perm: "discount", tip: "Правила автоматической уценки залежавшихся товаров." },
  { k: "revision",      l: "Ревизия",        icon: "ClipboardCheck", perm: "revision", tip: "Инвентаризация склада: сканирование, пересчёт, отчёты." },
  { k: "journal",       l: "Журнал",         icon: "ScrollText", tip: "Лог событий и действий сотрудников по СмартЛомбарду." },
  { k: "analytics",     l: "Аналитика",      icon: "BarChart3", perm: "shifts_view_profit", tip: "Аналитика по дням, сотрудникам, филиалам, категориям, моделям." },
  { k: "bookkeeping",   l: "Бухгалтерия",    icon: "Calculator", perm: "cashflow_view", tip: "Денежная сводка: выручка, себестоимость, ОПЭКС, прибыль, экспорт CSV." },
  { k: "import",        l: "Импорт",         icon: "ArrowUpDown", perm: "excel_export", tip: "Импорт/экспорт товаров и операций (Excel, CSV)." },
  { k: "documents",     l: "Документы",      icon: "FileText", tip: "Шаблоны печатных документов и реквизиты ИП/филиалов." },
  { k: "categories",    l: "Категории",      icon: "Grid3x3", tip: "Иерархия категорий товаров (телефоны, ноутбуки, ювелирка и т.д.)." },
  { k: "roles",         l: "Роли",           icon: "ShieldCheck", ownerOnly: true, tip: "Управление ролями и правами доступа сотрудников." },
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
    <div className="p-2 sm:p-3 max-w-[1400px] mx-auto w-full">
      {/* Премиум-шапка с золотым glow */}
      <div className="relative rounded-xl bg-gradient-to-br from-[#FFD700]/12 via-[#FFD700]/4 to-transparent border border-[#FFD700]/30 px-2.5 py-2 mb-2 flex items-center gap-2.5 shadow-[0_0_24px_rgba(255,215,0,0.08),inset_0_1px_0_rgba(255,215,0,0.1)] overflow-hidden">
        {/* Световой блик */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#FFD700]/8 blur-2xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />

        <div
          className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFE34D] via-[#FFD700] to-[#b8860b] flex items-center justify-center shrink-0 shadow-[0_3px_10px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)]"
          title="СмартЛомбард — модуль скупки и продажи Б/У"
        >
          <Icon name="Gem" size={16} className="text-black drop-shadow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-oswald font-bold uppercase text-[14px] tracking-[0.06em] leading-tight bg-gradient-to-r from-[#FFD700] via-[#FFE34D] to-[#FFD700] bg-clip-text text-transparent">
            СмартЛомбард
          </div>
          <div className="text-[10px] text-white/50 truncate leading-tight">
            {perms?.name ? `${perms.name} · ` : ""}Скупка, склад, касса, договоры
          </div>
        </div>
        {/* Premium индикатор */}
        <div
          className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 shrink-0"
          title="Премиум-модуль с расширенным функционалом"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#FFD700]">Premium</span>
        </div>
      </div>

      {/* Подвкладки — премиум сетка-плитки с подсказками */}
      <div className="mb-2">
        <SLTabsGrid
          items={visibleTabs.map(t => ({ v: t.k, l: t.l, icon: t.icon, featured: t.featured, tooltip: t.tip }))}
          value={tab}
          onChange={(v) => setTab(v as SubTab)}
        />
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
      {tab === "avito"      && <SLAvitoShowcase token={token} />}
      {tab === "categories" && <SLCategories token={token} />}
      {tab === "roles"      && <SLRoles token={token} isOwner={isOwner} />}
    </div>
  );
}