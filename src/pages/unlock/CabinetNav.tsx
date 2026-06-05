import Icon from "@/components/ui/icon";
import { clearToken } from "./unlockConstants";

export type Tab = "dashboard" | "services" | "orders" | "neworder" | "profile" | "transactions";

export const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "dashboard",    icon: "LayoutDashboard", label: "Главная"  },
  { id: "services",     icon: "Grid3X3",         label: "Услуги"   },
  { id: "orders",       icon: "ClipboardList",   label: "Заказы"   },
  { id: "neworder",     icon: "PlusCircle",      label: "Заказать" },
  { id: "transactions", icon: "ArrowLeftRight",  label: "Финансы"  },
  { id: "profile",      icon: "User",            label: "Профиль"  },
];

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  onLogout: () => void;
}

export function CabinetNav({ tab, onTab, onLogout }: Props) {
  return (
    <>
      {/* Сайдбар (desktop) */}
      <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0 sticky top-6 self-start">
        {TABS.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all font-roboto text-sm font-medium"
            style={{
              background: tab === t.id ? "rgba(255,215,0,0.1)" : "transparent",
              color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.4)",
              border: `1px solid ${tab === t.id ? "rgba(255,215,0,0.3)" : "transparent"}`,
            }}>
            <Icon name={t.icon} size={16} />
            {t.label}
          </button>
        ))}

        <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <button onClick={() => { clearToken(); onLogout(); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left font-roboto text-sm text-white/30 hover:text-white/60 transition-colors">
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Нижняя навигация (mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t"
        style={{ background: "rgba(6,4,6,0.97)", borderColor: "rgba(255,215,0,0.12)", backdropFilter: "blur(12px)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
            style={{ color: tab === t.id ? "#FFD700" : "rgba(255,255,255,0.3)" }}>
            <Icon name={t.icon} size={18} />
            <span className="font-roboto text-[9px]">{t.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
