
import { Suspense, lazy, useEffect } from "react";
import { getSavedThemeId, saveAndApplyTheme, applyTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Admin = lazy(() => import("./pages/Admin"));
const Cabinet = lazy(() => import("./pages/Cabinet"));
const Staff = lazy(() => import("./pages/Staff"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolsSync = lazy(() => import("./pages/ToolsSync"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RepairDiscount = lazy(() => import("./pages/RepairDiscount"));
const Requisites = lazy(() => import("./pages/Requisites"));
const Act = lazy(() => import("./pages/Act"));

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
            <Route path="/repair-discount" element={<RepairDiscount />} />
            <Route path="/requisites" element={<Requisites />} />
            <Route path="/act" element={<Act />} />
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
