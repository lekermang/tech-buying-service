import Icon from "@/components/ui/icon";

export type Source = "registered" | "repair" | "wh";

export type Contact = {
  id: string;
  full_name: string;
  phone: string;
  source: Source;
};

export const SOURCE_LABEL: Record<Source, string> = {
  registered: "Скидки",
  repair: "Ремонт",
  wh: "WH",
};

export const SOURCE_STYLE: Record<Source, string> = {
  registered: "bg-blue-500/15 text-blue-300 border border-blue-400/30",
  repair: "bg-green-500/15 text-green-300 border border-green-400/30",
  wh: "bg-purple-500/15 text-purple-300 border border-purple-400/30",
};

type Props = {
  showAll: boolean;
  setShowAll: React.Dispatch<React.SetStateAction<boolean>>;
  contacts: Contact[];
  visibleContacts: Contact[];
  loadingContacts: boolean;
  loadContacts: () => void;
  filter: string;
  setFilter: (v: string) => void;
  sourceFilter: "all" | Source;
  setSourceFilter: (v: "all" | Source) => void;
  counts: { all: number; registered: number; repair: number; wh: number };
};

export default function AllContactsPanel({
  showAll, setShowAll, contacts, visibleContacts, loadingContacts, loadContacts,
  filter, setFilter, sourceFilter, setSourceFilter, counts,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0A0A0A] border border-[#1F1F1F] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-oswald font-bold uppercase text-sm text-white flex items-center gap-1.5">
          <Icon name="Users" size={14} className="text-[#FFD700]" />
          База клиентов
          {showAll && (
            <span className="bg-[#FFD700]/15 text-[#FFD700] font-oswald text-[11px] px-2 py-0.5 rounded-full tabular-nums">
              {contacts.length}
            </span>
          )}
        </div>
        {!showAll ? (
          <button onClick={() => setShowAll(true)} disabled={loadingContacts}
            className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] font-roboto text-xs px-3 py-1.5 rounded-md hover:bg-[#FFD700]/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1.5">
            {loadingContacts ? <Icon name="Loader" size={11} className="animate-spin" /> : <Icon name="Download" size={11} />}
            {loadingContacts ? "Загружаю..." : "Показать всех"}
          </button>
        ) : (
          <button onClick={() => loadContacts()} disabled={loadingContacts} title="Обновить"
            className="text-white/40 hover:text-white p-2 rounded-md hover:bg-white/5 transition-colors">
            <Icon name="RefreshCw" size={13} className={loadingContacts ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {showAll && (
        <>
          {/* Фильтр-источник */}
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {([
              { k: "all", l: "Все", count: counts.all },
              { k: "registered", l: "Скидки", count: counts.registered },
              { k: "repair", l: "Ремонт", count: counts.repair },
              ...(counts.wh > 0 ? [{ k: "wh" as const, l: "WH", count: counts.wh }] : []),
            ] as { k: "all" | Source; l: string; count: number }[]).map(s => {
              const a = sourceFilter === s.k;
              return (
                <button key={s.k} onClick={() => setSourceFilter(s.k)}
                  className={`font-roboto text-[11px] px-3 py-1 rounded-full transition-all active:scale-95 ${
                    a
                      ? "bg-[#FFD700] text-black font-bold"
                      : "bg-[#141414] border border-[#1F1F1F] text-white/50 hover:text-white"
                  }`}>
                  {s.l} <span className="opacity-70 tabular-nums">{s.count}</span>
                </button>
              );
            })}
          </div>

          {/* Текстовый фильтр */}
          <div className="mb-3 relative">
            <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Имя или телефон..."
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-white pl-9 pr-9 py-2 font-roboto text-sm rounded-md focus:outline-none focus:border-[#FFD700]/50 focus:bg-[#141414] placeholder:text-white/25 transition-all" />
            {filter && (
              <button onClick={() => setFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white p-0.5 transition-colors">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>

          {loadingContacts ? (
            <div className="text-center py-10 text-white/30 font-roboto text-sm">
              <Icon name="Loader" size={16} className="animate-spin inline mr-2" />Загружаю клиентов...
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-2 bg-[#141414] border border-[#222] rounded-full flex items-center justify-center">
                <Icon name="Users" size={24} className="text-white/20" />
              </div>
              <div className="font-roboto text-white/40 text-sm">Нет клиентов</div>
            </div>
          ) : visibleContacts.length === 0 ? (
            <div className="text-center py-8 text-white/30 font-roboto text-sm">По фильтру ничего не найдено</div>
          ) : (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {visibleContacts.map(c => {
                const initials = c.full_name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
                return (
                  <div key={c.id} className="group bg-[#0A0A0A] border border-[#1A1A1A] rounded-md px-3 py-2.5 flex items-center gap-3 hover:border-[#FFD700]/30 hover:bg-[#141414] transition-all">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#333] to-[#1a1a1a] border border-white/10 flex items-center justify-center font-oswald font-bold text-sm text-white/70 shrink-0 group-hover:border-[#FFD700]/40 transition-colors">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-roboto text-white text-sm truncate font-medium">{c.full_name || <span className="text-white/30 italic">Без имени</span>}</div>
                      <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}
                        className="font-roboto text-[#FFD700]/80 text-[11px] hover:text-[#FFD700] flex items-center gap-1 mt-0.5">
                        <Icon name="Phone" size={9} />{c.phone}
                      </a>
                    </div>
                    <span className={`font-oswald text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wide shrink-0 ${SOURCE_STYLE[c.source]}`}>
                      {SOURCE_LABEL[c.source]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
