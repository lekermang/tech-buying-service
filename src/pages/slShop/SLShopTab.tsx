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
import SafeDealsTab from "./safeDeals/SafeDealsTab";
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
  | "safedeals"
  | "avito"
  | "roles";

type TabDef = { k: SubTab; l: string; icon: string; perm?: string; ownerOnly?: boolean; featured?: boolean; tip?: string };

const ALL_TABS: TabDef[] = [
  { k: "dashboard",     l: "Сводка",         icon: "LayoutDashboard", tip: "Главная сводка: купили, продали, прибыль, склад за выбранный период." },
  { k: "buy",           l: "Скупка",         icon: "Plus", perm: "shop_buy", tip: "Принять Б/У товар у клиента — скупка или комиссия с печатью договора." },
  { k: "contracts14d",  l: "Договор 14 дн.", icon: "Handshake", featured: true, tip: "Скупка с правом обратного выкупа. Ставка 4 % в день, срок 14 дней." },
  { k: "safedeals",     l: "Безоп. сделка", icon: "Shield", featured: true, tip: "Комиссионка с гарантом: продавец → офис → проверка → QR → покупатель. Комиссия 10%." },
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
    <div className="px-2 pt-2 pb-1 sm:px-3 max-w-[1400px] mx-auto w-full">

      {/* ── Компактная шапка модуля ── */}
      <div className="relative rounded-2xl overflow-hidden mb-2.5"
        style={{
          background: "linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.04) 50%, transparent 100%)",
          border: "1px solid rgba(255,215,0,0.22)",
          boxShadow: "0 0 30px rgba(255,215,0,0.07), inset 0 1px 0 rgba(255,215,0,0.15)",
        }}>
        {/* Верхняя неоновая полоска */}
        <div className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.7), transparent)" }} />
        {/* Угловое свечение */}
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(255,215,0,0.12)" }} />

        <div className="relative flex items-center gap-2.5 px-3 py-2.5">
          {/* Иконка */}
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #FFE34D 0%, #FFD700 55%, #b8860b 100%)",
              boxShadow: "0 0 16px rgba(255,215,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
            }}>
            <Icon name="Gem" size={17} className="text-black" />
          </div>

          {/* Текст */}
          <div className="flex-1 min-w-0">
            <div className="font-oswald font-black uppercase text-[15px] tracking-[0.08em] leading-none"
              style={{ color: "#FFD700", textShadow: "0 0 16px rgba(255,215,0,0.5)" }}>
              СмартЛомбард
            </div>
            <div className="text-[10px] font-roboto mt-0.5 truncate"
              style={{ color: "rgba(255,255,255,0.38)" }}>
              {perms?.name ? `${perms.name} · ` : ""}Скупка · Склад · Касса · Договоры
            </div>
          </div>

          {/* Premium badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl shrink-0"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-400">Live</span>
          </div>
        </div>
      </div>

      {/* ── Навигация по разделам ── */}
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
      {tab === "safedeals"  && <SafeDealsTab token={token} />}
      {tab === "avito"      && <SLAvitoShowcase token={token} />}
      {tab === "categories" && <SLCategories token={token} />}
      {tab === "roles"      && <SLRoles token={token} isOwner={isOwner} />}
    </div>
  );
}