
import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { getSavedThemeId, saveAndApplyTheme, applyTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
const NotFound = safeLazy(() => import("./pages/NotFound"));
const RepairDiscount = safeLazy(() => import("./pages/RepairDiscount"));
const Requisites = safeLazy(() => import("./pages/Requisites"));
const Act = safeLazy(() => import("./pages/Act"));
const PublicChat = safeLazy(() => import("./pages/PublicChat"));
const PublicContract14d = safeLazy(() => import("./pages/PublicContract14d"));
const PublicInvestor = safeLazy(() => import("./pages/PublicInvestor"));

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
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            <Route path="/repair-discount" element={<RepairDiscount />} />
            <Route path="/requisites" element={<Requisites />} />
            <Route path="/act" element={<Act />} />
            <Route path="/chat" element={<PublicChat />} />
            <Route path="/p/c/:number" element={<PublicContract14d />} />
            <Route path="/investor/:token" element={<PublicInvestor />} />
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