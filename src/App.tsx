
import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { getSavedThemeId, saveAndApplyTheme, applyTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GrainOverlay from "@/components/fx/GrainOverlay";
import FunReaction from "@/components/FunReaction";

/**
 * Безопасный lazy-импорт: если после деплоя браузер запросил старый chunk,
 * который больше не существует ("Importing a module script failed" / "Failed to fetch dynamically imported module"),
 * мы один раз сбрасываем кэш Service Worker и перезагружаем страницу.
 */
const RELOAD_KEY = "__chunk_reload__";
const safeLazy = <T extends ComponentType<unknown>>(factory: () => Promise<{ default: T }>) =>
  lazy(() =>
    factory().catch((err: unknown) => {
      const msg = String((err as Error)?.message || err);
      const isChunkErr = /Importing a module script failed|Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError/i.test(msg);
      if (isChunkErr && !sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => { /* ignore */ });
        }
        if ("caches" in window) {
          caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => { /* ignore */ });
        }
        setTimeout(() => window.location.reload(), 100);
      }
      throw err;
    })
  );

const Index = safeLazy(() => import("./pages/Index"));
const Admin = safeLazy(() => import("./pages/Admin"));
const Cabinet = safeLazy(() => import("./pages/Cabinet"));
const Staff = safeLazy(() => import("./pages/Staff"));
const StaffShare = safeLazy(() => import("./pages/StaffShare"));
const Catalog = safeLazy(() => import("./pages/Catalog"));
const Tools = safeLazy(() => import("./pages/Tools"));
const ToolsSync = safeLazy(() => import("./pages/ToolsSync"));
const NotFound = safeLazy(() => import("./pages/NotFound404"));
const RepairStatus = safeLazy(() => import("./pages/RepairStatus"));
const RepairDiscount = safeLazy(() => import("./pages/RepairDiscount"));
const Repair = safeLazy(() => import("./pages/Repair"));
const Unlock = safeLazy(() => import("./pages/Unlock"));
const Ocenka = safeLazy(() => import("./pages/Ocenka"));
const SkupkaAntikvariata = safeLazy(() => import("./pages/SkupkaAntikvariata"));
const RemontIphoneKaluga = safeLazy(() => import("./pages/repair/RemontIphoneKaluga"));
const RemontSamsungKaluga = safeLazy(() => import("./pages/repair/RemontSamsungKaluga"));
const RemontXiaomiKaluga = safeLazy(() => import("./pages/repair/RemontXiaomiKaluga"));
const ZamenaSteklaKaluga = safeLazy(() => import("./pages/repair/ZamenaSteklaKaluga"));
const ZamenaAkkumulyatoraKaluga = safeLazy(() => import("./pages/repair/ZamenaAkkumulyatoraKaluga"));
const RemontPosleVodyKaluga = safeLazy(() => import("./pages/repair/RemontPosleVodyKaluga"));
const BgaPajkaKaluga = safeLazy(() => import("./pages/repair/BgaPajkaKaluga"));
const SnyatieFrpKaluga = safeLazy(() => import("./pages/repair/SnyatieFrpKaluga"));
const Requisites = safeLazy(() => import("./pages/Requisites"));
const Act = safeLazy(() => import("./pages/Act"));
const PublicChat = safeLazy(() => import("./pages/PublicChat"));
const PublicContract14d = safeLazy(() => import("./pages/PublicContract14d"));
const PublicInvestor = safeLazy(() => import("./pages/PublicInvestor"));
const Client = safeLazy(() => import("./pages/Client"));
const Transfer = safeLazy(() => import("./pages/Transfer"));
const TransferGuide = safeLazy(() => import("./pages/TransferGuide"));
const SafeDeals = safeLazy(() => import("./pages/SafeDeals"));
const SafeDealQR = safeLazy(() => import("./pages/SafeDealQR"));
const SafeDealsShop = safeLazy(() => import("./pages/SafeDealsShop"));
const SafeDealsYandexCallback = safeLazy(() => import("./pages/SafeDealsYandexCallback"));
const SafeDealsBlacklist = safeLazy(() => import("./pages/SafeDealsBlacklist"));
const SafeDealsLanding = safeLazy(() => import("./pages/SafeDealsLanding"));
const SafeDealsChecklist = safeLazy(() => import("./pages/SafeDealsChecklist"));
const SafeDealsItem = safeLazy(() => import("./pages/SafeDealsItem"));
const StaffSafeDeals = safeLazy(() => import("./pages/StaffSafeDeals"));
const StaffAnalytics = safeLazy(() => import("./pages/StaffAnalytics"));
const StaffEvaluator = safeLazy(() => import("./pages/StaffEvaluator"));
const StaffAnalyticsVisitor = safeLazy(() => import("./pages/StaffAnalyticsVisitor"));
const CatalogPhotoImport = safeLazy(() => import("./pages/CatalogPhotoImport"));
const AncientCoins = safeLazy(() => import("./pages/AncientCoins"));
const BronzeSculptures = safeLazy(() => import("./pages/BronzeSculptures"));
const RussianCoins = safeLazy(() => import("./pages/RussianCoins"));
const RussianIcons = safeLazy(() => import("./pages/RussianIcons"));
const RussianPorcelain = safeLazy(() => import("./pages/RussianPorcelain"));
const SovietAntiques = safeLazy(() => import("./pages/SovietAntiques"));
const Blog = safeLazy(() => import("./pages/Blog"));
const BlogChtoDelatVoda = safeLazy(() => import("./pages/blog/ChtoDelatTelefonVoda"));
const BlogTop5Iphone = safeLazy(() => import("./pages/blog/Top5PolomokIphone"));
const BlogVybratServis = safeLazy(() => import("./pages/blog/KakVybratServisnyjCentr"));
const VykupAvto = safeLazy(() => import("./pages/VykupAvto"));
const VykupSpectehniki = safeLazy(() => import("./pages/VykupSpectehniki"));
const KupimUchastok = safeLazy(() => import("./pages/KupimUchastok"));
const SkupkaIphoneKaluga = safeLazy(() => import("./pages/seo/SkupkaIphoneKaluga"));
const SkupkaMacbookKaluga = safeLazy(() => import("./pages/seo/SkupkaMacbookKaluga"));
const SkupkaNoutbukovKaluga = safeLazy(() => import("./pages/seo/SkupkaNoutbukovKaluga"));
const SkupkaZolotaKaluga = safeLazy(() => import("./pages/seo/SkupkaZolotaKaluga"));
const SkupkaSamsungKaluga = safeLazy(() => import("./pages/seo/SkupkaSamsungKaluga"));
const SkupkaXiaomiKaluga = safeLazy(() => import("./pages/seo/SkupkaXiaomiKaluga"));
const RemontIphoneKalugaSeo = safeLazy(() => import("./pages/seo/RemontIphoneKalugaSeo"));
const RemontSamsungKalugaSeo = safeLazy(() => import("./pages/seo/RemontSamsungKaluga"));
const ApplePrice = safeLazy(() => import("./pages/ApplePrice"));
const PromoPage  = safeLazy(() => import("./pages/PromoPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ADMIN_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

const fetchWithTimeout = (url: string, ms: number) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
};

const App = () => {
  useEffect(() => {
    sessionStorage.removeItem(RELOAD_KEY);
    saveAndApplyTheme(getSavedThemeId());
    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
      if (typeof w.requestIdleCallback === "function") w.requestIdleCallback(cb);
      else setTimeout(cb, 1500);
    };
    idle(() => {
      fetchWithTimeout(`${ADMIN_URL}?action=theme_get`, 4000)
        .then(r => r.json())
        .then(d => { if (d.theme) applyTheme(d.theme); })
        .catch(() => { /* ignore */ });

      // Регистрация SW сайта (только на корне и публичных страницах, не на /staff)
      if ("serviceWorker" in navigator && !window.location.pathname.startsWith("/staff")) {
        navigator.serviceWorker.register("/site-sw.js", { scope: "/" }).catch(() => { /* ignore */ });
      }

      // Idle-prefetch: пока пользователь смотрит главную, фоном тянем чанки соседних разделов.
      // На /staff и /admin это не нужно — там сотрудники.
      const path = window.location.pathname;
      if (path === "/" || path === "/TopGold") {
        import("./pages/Repair").catch(() => { /* ignore */ });
        import("./pages/RepairDiscount").catch(() => { /* ignore */ });
        import("./pages/Catalog").catch(() => { /* ignore */ });
        import("./pages/Tools").catch(() => { /* ignore */ });
      }
    });
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FunReaction />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GrainOverlay />
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/TopGold" element={<Index goldOpen />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools-sync" element={<ToolsSync />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/staff/share" element={<StaffShare />} />
            <Route path="/ancient-coins" element={<AncientCoins />} />
            <Route path="/bronze-sculptures" element={<BronzeSculptures />} />
            <Route path="/russian-coins" element={<RussianCoins />} />
            <Route path="/icons" element={<RussianIcons />} />
            <Route path="/porcelain" element={<RussianPorcelain />} />
            <Route path="/soviet-antiques" element={<SovietAntiques />} />
            <Route path="/skupka-antikvariata" element={<SkupkaAntikvariata />} />
            <Route path="/repair" element={<Repair />} />
            <Route path="/unlock" element={<Unlock />} />
            <Route path="/ocenka" element={<Ocenka />} />
            <Route path="/remont-iphone-kaluga" element={<RemontIphoneKaluga />} />
            <Route path="/remont-samsung-kaluga" element={<RemontSamsungKaluga />} />
            <Route path="/remont-xiaomi-kaluga" element={<RemontXiaomiKaluga />} />
            <Route path="/zamena-stekla-kaluga" element={<ZamenaSteklaKaluga />} />
            <Route path="/zamena-akkumulyatora-kaluga" element={<ZamenaAkkumulyatoraKaluga />} />
            <Route path="/remont-posle-vody-kaluga" element={<RemontPosleVodyKaluga />} />
            <Route path="/bga-pajka-kaluga" element={<BgaPajkaKaluga />} />
            <Route path="/snyatie-frp-kaluga" element={<SnyatieFrpKaluga />} />
            <Route path="/repair-status" element={<RepairStatus />} />
            <Route path="/repair-discount" element={<RepairDiscount />} />
            <Route path="/requisites" element={<Requisites />} />
            <Route path="/act" element={<Act />} />
            <Route path="/chat" element={<PublicChat />} />
            <Route path="/p/c/:number" element={<PublicContract14d />} />
            <Route path="/investor/:token" element={<PublicInvestor />} />
            <Route path="/client" element={<Client />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer/guide" element={<TransferGuide />} />
            <Route path="/safe-deals" element={<SafeDeals />} />
            <Route path="/safe-deals/shop" element={<SafeDealsShop />} />
            <Route path="/safe-deals/qr/:code" element={<SafeDealQR />} />
            <Route path="/safe-deals/yandex-callback" element={<SafeDealsYandexCallback />} />
            <Route path="/safe-deals/blacklist" element={<SafeDealsBlacklist />} />
            <Route path="/safe-deals/checklist" element={<SafeDealsChecklist />} />
            <Route path="/safe-deals/item/:dealNumber" element={<SafeDealsItem />} />
            <Route path="/staff/safe-deals" element={<StaffSafeDeals />} />
            <Route path="/staff/analytics" element={<StaffAnalytics />} />
            <Route path="/staff/evaluator" element={<StaffEvaluator />} />
            <Route path="/staff/analytics/visitor/:id" element={<StaffAnalyticsVisitor />} />
            <Route path="/staff/catalog-photos" element={<CatalogPhotoImport />} />
            <Route path="/safe-deals/:slug" element={<SafeDealsLanding />} />
            {/* Удобные алиасы */}
            <Route path="/blacklist" element={<Navigate to="/safe-deals/blacklist" replace />} />
            <Route path="/checklist" element={<Navigate to="/safe-deals/checklist" replace />} />
            <Route path="/qr/:code" element={<SafeDealQR />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/chto-delat-esli-telefon-upal-v-vodu" element={<BlogChtoDelatVoda />} />
            <Route path="/blog/top-5-polomok-iphone" element={<BlogTop5Iphone />} />
            <Route path="/blog/kak-vybrat-servisnyj-centr-v-kaluge" element={<BlogVybratServis />} />
            <Route path="/vykup-avto" element={<VykupAvto />} />
            <Route path="/vykup-spectehniki" element={<VykupSpectehniki />} />
            <Route path="/kupim-uchastok" element={<KupimUchastok />} />
            {/* SEO-посадочные страницы */}
            <Route path="/skupka-iphone-kaluga"    element={<SkupkaIphoneKaluga />} />
            <Route path="/skupka-macbook-kaluga"   element={<SkupkaMacbookKaluga />} />
            <Route path="/skupka-noutbukov-kaluga" element={<SkupkaNoutbukovKaluga />} />
            <Route path="/skupka-zolota-kaluga"    element={<SkupkaZolotaKaluga />} />
            <Route path="/skupka-samsung-kaluga"   element={<SkupkaSamsungKaluga />} />
            <Route path="/skupka-xiaomi-kaluga"    element={<SkupkaXiaomiKaluga />} />
            <Route path="/remont-iphone-kaluga"    element={<RemontIphoneKalugaSeo />} />
            <Route path="/remont-samsung-kaluga"   element={<RemontSamsungKalugaSeo />} />
            <Route path="/Apple" element={<ApplePrice />} />
            <Route path="/promo/:slug" element={<PromoPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;