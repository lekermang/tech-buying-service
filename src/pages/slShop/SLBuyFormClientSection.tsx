import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLClient } from "./types";
import QuickClientForm from "./QuickClientForm";
import { Section } from "./SLBuyFormParts";

type Props = {
  token: string;
  clientQuery: string;
  setClientQuery: (v: string) => void;
  clientId: number | "";
  setClientId: (id: number | "") => void;
  clientResults: SLClient[];
  showClientDrop: boolean;
  setShowClientDrop: (v: boolean) => void;
  showQuickClient: boolean;
  setShowQuickClient: (v: boolean) => void;
};

export default function SLBuyFormClientSection(p: Props) {
  // Загружаем полную карточку выбранного клиента — показываем фото паспорта,
  // серию/номер, дату рождения. Скупщик сразу видит, что всё на месте.
  const [selectedClient, setSelectedClient] = useState<SLClient | null>(null);
  useEffect(() => {
    if (!p.clientId) { setSelectedClient(null); return; }
    // Сначала пробуем найти в уже подгруженных результатах
    const fromResults = p.clientResults.find(c => c.id === p.clientId);
    if (fromResults && fromResults.passport_photo_url !== undefined) {
      setSelectedClient(fromResults);
      return;
    }
    // Иначе подтягиваем по ID через поиск
    let cancelled = false;
    (async () => {
      const r = await slApi<SLClient[]>(p.token, "clients", { params: { q: p.clientQuery } });
      if (!cancelled && r.ok && r.data) {
        const found = r.data.find(c => c.id === p.clientId);
        if (found) setSelectedClient(found);
      }
    })();
    return () => { cancelled = true; };
  }, [p.clientId, p.clientResults, p.token, p.clientQuery]);

  return (
    <Section title="Клиент (продавец)" icon="UserSquare">
      {p.showQuickClient ? (
        <QuickClientForm
          token={p.token}
          onCreated={(id, name) => {
            p.setClientId(id);
            p.setClientQuery(name);
            p.setShowQuickClient(false);
          }}
          onCancel={() => p.setShowQuickClient(false)}
        />
      ) : (
        <>
          <div className="relative">
            <input value={p.clientQuery} onChange={e => { p.setClientQuery(e.target.value); p.setClientId(""); p.setShowClientDrop(true); }}
              onFocus={() => p.setShowClientDrop(true)}
              placeholder="ФИО или телефон постоянного клиента"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
            {p.showClientDrop && p.clientResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-[#141414] border border-[#1F1F1F] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {p.clientResults.map(c => (
                  <button key={c.id} onClick={() => { p.setClientId(c.id); p.setClientQuery(c.full_name); p.setShowClientDrop(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-[#1F1F1F] last:border-0 flex items-center gap-2">
                    {c.passport_photo_url ? (
                      <img src={c.passport_photo_url} alt="" className="w-8 h-8 object-cover rounded shrink-0 border border-[#FFD700]/20" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#1F1F1F] flex items-center justify-center shrink-0">
                        <Icon name="User" size={14} className="text-white/30" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{c.full_name}</div>
                      <div className="text-[10px] text-white/40 flex gap-2">
                        {c.phone && <span><Icon name="Phone" size={9} className="inline mr-0.5" />{c.phone}</span>}
                        {c.passport_series && <span>{c.passport_series} {c.passport_number}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Большая акцентная кнопка — фото паспорта с распознаванием ИИ */}
          {!p.clientId && (
            <button onClick={() => p.setShowQuickClient(true)}
              className="relative w-full overflow-hidden bg-gradient-to-br from-[#FFD700]/18 via-[#FFD700]/8 to-transparent border-2 border-dashed border-[#FFD700]/50 hover:border-[#FFD700] hover:bg-[#FFD700]/12 active:scale-[0.98] text-[#FFD700] rounded-xl py-3 px-3 transition-all flex items-center gap-2.5 group">
              {/* Декоративный блик */}
              <span aria-hidden className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#FFD700]/20 blur-2xl pointer-events-none" />
              <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700]/25 to-[#FFD700]/5 border border-[#FFD700]/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Icon name="Camera" size={18} className="drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              </div>
              <div className="relative flex-1 text-left min-w-0">
                <div className="font-bold text-[13px] uppercase tracking-wide leading-tight flex items-center gap-1.5">
                  Сфотографировать паспорт
                  <span className="inline-flex items-center gap-0.5 text-[8px] uppercase tracking-wider font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Icon name="Sparkles" size={8} /> ИИ
                  </span>
                </div>
                <div className="text-[10px] text-[#FFD700]/70 leading-tight mt-0.5">
                  ИИ сам заполнит ФИО, серию, номер, кем выдан, адрес
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="relative shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Карточка выбранного клиента: фото + ключевые данные */}
          {p.clientId && selectedClient && (
            <div className="relative bg-gradient-to-br from-emerald-500/10 via-[#FFD700]/5 to-transparent border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2 overflow-hidden">
              <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400" />
              {selectedClient.passport_photo_url ? (
                <a href={selectedClient.passport_photo_url} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={selectedClient.passport_photo_url} alt="Паспорт" className="w-12 h-12 object-cover rounded border border-[#FFD700]/30 hover:border-[#FFD700]" />
                </a>
              ) : (
                <div className="w-12 h-12 rounded bg-[#0F0F0F] border border-[#1F1F1F] flex items-center justify-center shrink-0">
                  <Icon name="UserCheck" size={18} className="text-emerald-300" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[12px] text-emerald-200 truncate flex items-center gap-1">
                  <Icon name="UserCheck" size={11} />
                  {selectedClient.full_name}
                  <span className="text-[9px] text-white/35 font-normal">#{selectedClient.id}</span>
                </div>
                <div className="text-[10px] text-white/55 flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                  {selectedClient.phone && (
                    <span><Icon name="Phone" size={9} className="inline mr-0.5" />{selectedClient.phone}</span>
                  )}
                  {selectedClient.passport_series && (
                    <span><Icon name="IdCard" size={9} className="inline mr-0.5" />{selectedClient.passport_series} {selectedClient.passport_number}</span>
                  )}
                  {selectedClient.birth_date && (
                    <span><Icon name="Cake" size={9} className="inline mr-0.5" />{new Date(selectedClient.birth_date).toLocaleDateString("ru-RU")}</span>
                  )}
                </div>
                {selectedClient.address && (
                  <div className="text-[9px] text-white/40 truncate mt-0.5">
                    <Icon name="MapPin" size={8} className="inline mr-0.5" />{selectedClient.address}
                  </div>
                )}
              </div>
              <button onClick={() => { p.setClientId(""); p.setClientQuery(""); }}
                title="Сбросить и выбрать другого"
                className="shrink-0 text-white/30 hover:text-red-400 p-1">
                <Icon name="X" size={12} />
              </button>
            </div>
          )}

          {/* Если выбран, но карточка ещё подгружается */}
          {p.clientId && !selectedClient && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded text-[12px] flex items-center gap-1.5">
              <Icon name="Loader2" size={11} className="animate-spin" />
              Клиент: {p.clientQuery} (ID #{p.clientId})
            </div>
          )}
        </>
      )}
    </Section>
  );
}