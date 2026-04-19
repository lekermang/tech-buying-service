
import { Suspense, lazy, useEffect } from "react";
import { getSavedThemeId, saveAndApplyTheme } from "@/lib/theme";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const Admin = lazy(() => import("./pages/Admin"));
const DzChat = lazy(() => import("./pages/DzChat"));
const Cabinet = lazy(() => import("./pages/Cabinet"));
const Staff = lazy(() => import("./pages/Staff"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolsSync = lazy(() => import("./pages/ToolsSync"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RepairDiscount = lazy(() => import("./pages/RepairDiscount"));
const Requisites = lazy(() => import("./pages/Requisites"));

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

const App = () => {
  useEffect(() => {
    saveAndApplyTheme(getSavedThemeId());
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
            <Route path="/dzchat" element={<DzChat />} />
            <Route path="/repair-discount" element={<RepairDiscount />} />
            <Route path="/requisites" element={<Requisites />} />
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