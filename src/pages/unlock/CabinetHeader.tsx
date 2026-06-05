import Icon from "@/components/ui/icon";
import { clearToken } from "./unlockConstants";

interface Client { id: number; full_name: string; email: string; phone: string; email_verified: boolean; }

interface Props {
  client: Client | null;
  balance: string | null;
  currency: string;
  loadBal: boolean;
  onTopup: () => void;
  onLogout: () => void;
}

export function CabinetHeader({ client, balance, currency, loadBal, onTopup, onLogout }: Props) {
  return (
    <header className="relative z-20 border-b" style={{ borderColor: "rgba(255,215,0,0.1)", background: "rgba(6,4,6,0.95)", backdropFilter: "blur(12px)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)", boxShadow: "0 0 16px rgba(255,215,0,0.35)" }}>
            <Icon name="Unlock" size={17} className="text-black" />
          </div>
          <div>
            <div className="font-oswald font-black text-base uppercase text-white leading-none">Unlock</div>
            <div className="font-roboto text-[9px] uppercase tracking-widest text-white/30">Скупка24</div>
          </div>
        </div>

        {/* Баланс + кнопка пополнить (desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.18)" }}>
            <Icon name="Wallet" size={14} style={{ color: "#FFD700" }} />
            {loadBal
              ? <div className="h-4 w-16 rounded animate-pulse" style={{ background: "rgba(255,215,0,0.2)" }} />
              : <span className="font-oswald font-bold text-base" style={{ color: "#FFD700" }}>{balance ?? "—"} {currency}</span>
            }
          </div>
          <button onClick={onTopup}
            className="group relative overflow-hidden flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase tracking-wide text-black transition-all"
            style={{
              background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
              boxShadow: "0 0 0 1px rgba(255,215,0,0.5),0 4px 12px rgba(255,215,0,0.25)",
            }}>
            <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.6)_50%,transparent_65%)] bg-[length:200%_100%] -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <Icon name="Plus" size={13} className="relative" />
            <span className="relative">Пополнить</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {client && (
            <div className="hidden sm:block text-right">
              <div className="font-roboto text-xs text-white/70">{client.full_name}</div>
              <div className="font-roboto text-[10px] text-white/30">{client.email}</div>
            </div>
          )}
          {/* Пополнить — только мобильный */}
          <button onClick={onTopup}
            className="sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl font-oswald font-bold text-xs uppercase text-black"
            style={{
              background: "linear-gradient(180deg,#fff3a0 0%,#FFD700 45%,#d4a017 100%)",
              boxShadow: "0 0 0 1px rgba(255,215,0,0.5)",
            }}>
            <Icon name="Plus" size={13} />
            Пополнить
          </button>
          <button onClick={() => { clearToken(); onLogout(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-roboto text-xs text-white/40 hover:text-white/70 transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Icon name="LogOut" size={13} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
}
