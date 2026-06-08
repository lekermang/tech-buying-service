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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

      {/* ══ Premium cosmic banner ══ */}
      <div className="relative overflow-hidden rounded-2xl mb-4" style={{
        background: "linear-gradient(145deg, rgba(14,10,4,0.99) 0%, rgba(8,6,2,1) 100%)",
        border: "1px solid rgba(255,215,0,0.18)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,0,0.06)",
      }}>
        {/* 1.5px top light line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,215,0,0.5) 30%, rgba(255,255,220,0.8) 50%, rgba(255,215,0,0.5) 70%, transparent)"
        }} />
        {/* Cosmic nebula bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-48 h-48 rounded-full blur-3xl" style={{ background: "rgba(255,215,0,0.07)", transform: "translate(-30%,-30%)" }} />
          <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(255,150,0,0.05)", transform: "translate(20%,20%)" }} />
          {/* 5-point starfield */}
          <div className="absolute inset-0" style={{
            backgroundImage: [
              "radial-gradient(1px 1px at 15% 25%, rgba(255,215,0,0.6) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 70% 40%, rgba(255,215,0,0.5) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 45% 70%, rgba(255,215,0,0.4) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 85% 15%, rgba(255,215,0,0.55) 0%, transparent 100%)",
              "radial-gradient(1px 1px at 30% 85%, rgba(255,215,0,0.45) 0%, transparent 100%)",
            ].join(", ")
          }} />
        </div>

        <div className="relative px-4 py-3 flex items-start gap-3">
          {/* Icon with pulse ring */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.08) 100%)",
              border: "1px solid rgba(255,215,0,0.3)",
            }}>
              <Icon name="Coins" size={22} className="text-[#FFD700]" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border border-[#FFD700]/30 animate-ping" style={{ animationDuration: "2.5s" }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Module title */}
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h2 className="font-oswald font-black text-[18px] leading-tight uppercase tracking-wide" style={{
                background: "linear-gradient(135deg, #fff8e8 0%, #FFD700 60%, #c8960a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>СмартЛомбард</h2>
              {perms?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{
                  background: "rgba(255,215,0,0.12)",
                  border: "1px solid rgba(255,215,0,0.25)",
                  color: "rgba(255,215,0,0.8)",
                }}>{perms.name}</span>
              )}
            </div>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {["Скупка", "Склад", "Касса", "Договоры"].map(tag => (
                <span key={tag} className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>{tag}</span>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => navigate("/staff/evaluator")}
                className="relative overflow-hidden group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-oswald font-bold text-[11px] uppercase tracking-wider text-black active:scale-95 transition-all"
                style={{
                  background: "linear-gradient(135deg, #FFE34D 0%, #FFD700 50%, #c8960a 100%)",
                  boxShadow: "0 2px 12px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
                }}
              >
                {/* Shimmer */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{
                  background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
                }} />
                <Icon name="Zap" size={12} className="relative" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.4))" }} />
                <span className="relative">Оценить</span>
              </button>

              {/* Live badge */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.25)",
              }}>
                <div className="relative w-2 h-2 rounded-full" style={{
                  background: "#34d399",
                  boxShadow: "0 0 6px rgba(52,211,153,0.8), 0 0 12px rgba(52,211,153,0.4)",
                }}>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "#34d399", opacity: 0.5 }} />
                </div>
                <span className="font-roboto text-[9px] font-semibold text-emerald-300 uppercase tracking-wider">Live</span>
              </div>
            </div>
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