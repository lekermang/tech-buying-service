import { lazy } from "react";

// Ленивые модули + прелоадеры (для предзагрузки по hover/touchstart)
export const loadGoods         = () => import("../StaffGoodsTab");
export const loadRepair        = () => import("../StaffRepairTab");
export const loadGold          = () => import("../GoldTab");
export const loadOtherTabs     = () => import("../StaffOtherTabs");
export const loadVipChat       = () => import("../StaffVipChatTab");
export const loadSmartLombard  = () => import("../smartlombard/SmartLombardTab");

export const GoodsTab        = lazy(loadGoods);
export const StaffRepairTab  = lazy(loadRepair);
export const GoldTab         = lazy(loadGold);
export const SalesTab        = lazy(() => loadOtherTabs().then(m => ({ default: m.SalesTab })));
export const ClientsTab      = lazy(() => loadOtherTabs().then(m => ({ default: m.ClientsTab })));
export const AnalyticsTab    = lazy(() => loadOtherTabs().then(m => ({ default: m.AnalyticsTab })));
export const EmployeesTab    = lazy(() => loadOtherTabs().then(m => ({ default: m.EmployeesTab })));
export const VipChatTab      = lazy(loadVipChat);
export const SmartLombardTab = lazy(loadSmartLombard);

export const TAB_PRELOADERS: Record<string, () => Promise<unknown>> = {
  goods: loadGoods,
  repair: loadRepair,
  gold: loadGold,
  sales: loadOtherTabs,
  clients: loadOtherTabs,
  analytics: loadOtherTabs,
  employees: loadOtherTabs,
  chat: loadVipChat,
  smartlombard: loadSmartLombard,
};

export function prefetchTab(t: string): void {
  const fn = TAB_PRELOADERS[t];
  if (fn) fn().catch(() => {});
}
