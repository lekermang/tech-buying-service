import Icon from "@/components/ui/icon";

export type DiscountClient = {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  discount_pct: number;
  loyalty_points: number;
  registered_at: string | null;
};

type Props = {
  discountOpen: boolean;
  setDiscountOpen: React.Dispatch<React.SetStateAction<boolean>>;
  discountClients: DiscountClient[];
  visibleDiscountClients: DiscountClient[];
  discountFilter: string;
  setDiscountFilter: (v: string) => void;
  loadingDiscount: boolean;
  loadDiscountClients: () => void;
};

export default function DiscountClientsPanel({
  discountOpen, setDiscountOpen, discountClients, visibleDiscountClients,
  discountFilter, setDiscountFilter, loadingDiscount, loadDiscountClients,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
      <button
        onClick={() => setDiscountOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#FFD700]/15 border border-[#FFD700]/30 flex items-center justify-center">
            <Icon name="Users" size={14} className="text-[#FFD700]" />
          </div>
          <div className="text-left">
            <div className="font-oswald font-bold uppercase text-sm text-white">База клиентов программы</div>
            <div className="font-roboto text-white/40 text-[10px]">
              Все зарегистрированные · скидка · баллы
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {discountClients.length > 0 && (
            <span className="font-oswald font-bold tabular-nums text-[#FFD700] text-xs">
              {discountClients.length}
            </span>
          )}
          <Icon name={discountOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-white/40" />
        </div>
      </button>

      {discountOpen && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                value={discountFilter}
                onChange={e => setDiscountFilter(e.target.value)}
                placeholder="Поиск по имени, телефону, email..."
                className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-3 py-2.5 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 placeholder:text-white/25"
              />
            </div>
            <button
              onClick={() => loadDiscountClients()}
              disabled={loadingDiscount}
              className="text-white/50 hover:text-white p-2.5 rounded-md hover:bg-white/5 transition-colors disabled:opacity-50 border border-[#1F1F1F]"
              title="Обновить"
            >
              <Icon name="RefreshCw" size={14} className={loadingDiscount ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingDiscount && discountClients.length === 0 ? (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">Загружаю базу...</div>
          ) : visibleDiscountClients.length === 0 ? (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">
              {discountFilter ? "Совпадений не найдено" : "База пуста"}
            </div>
          ) : (
            <>
              <div className="text-[10px] font-roboto text-white/40 uppercase tracking-wide flex items-center justify-between">
                <span>Найдено: <span className="text-[#FFD700] font-bold">{visibleDiscountClients.length}</span></span>
              </div>
              <div className="max-h-[420px] overflow-y-auto rounded-md border border-[#1F1F1F] divide-y divide-[#1F1F1F]">
                {visibleDiscountClients.slice(0, 500).map(c => {
                  const initials = (c.full_name || "?").trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-2.5 bg-[#0A0A0A] hover:bg-[#FFD700]/5 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-yellow-700/30 border border-[#FFD700]/30 flex items-center justify-center font-oswald font-bold text-[#FFD700] text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-oswald font-bold text-white text-sm truncate">{c.full_name || "—"}</div>
                        <div className="font-roboto text-white/50 text-[11px] flex items-center gap-2">
                          <span className="text-[#FFD700]/80 font-mono">{c.phone}</span>
                          {c.email && <span className="truncate">· {c.email}</span>}
                        </div>
                        {c.registered_at && (
                          <div className="font-roboto text-white/30 text-[9px] mt-0.5">
                            Регистрация: {new Date(c.registered_at).toLocaleDateString("ru-RU")}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="font-oswald font-bold text-[10px] bg-green-500/15 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full tabular-nums">
                          {c.discount_pct}%
                        </span>
                        <span className="font-roboto text-[9px] text-white/50 tabular-nums">
                          <Icon name="Star" size={9} className="inline text-[#FFD700] mr-0.5" />
                          {c.loyalty_points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {visibleDiscountClients.length > 500 && (
                <div className="text-center text-[10px] text-white/30 font-roboto">
                  Показаны первые 500. Используйте поиск, чтобы сузить выбор.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
