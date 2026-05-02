import Icon from "@/components/ui/icon";
import { type SLClient } from "./types";
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
  return (
    <Section title="Клиент (продавец)">
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
              placeholder="ФИО или телефон"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm" />
            {p.showClientDrop && p.clientResults.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-[#141414] border border-[#1F1F1F] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {p.clientResults.map(c => (
                  <button key={c.id} onClick={() => { p.setClientId(c.id); p.setClientQuery(c.full_name); p.setShowClientDrop(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 border-b border-[#1F1F1F] last:border-0">
                    <div className="font-medium">{c.full_name}</div>
                    {c.phone && <div className="text-[11px] text-white/40">{c.phone}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => p.setShowQuickClient(true)}
            className="w-full bg-gradient-to-br from-[#FFD700]/15 to-transparent border border-[#FFD700]/40 text-[#FFD700] rounded-lg py-2.5 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#FFD700]/20">
            <Icon name="Camera" size={14} />
            Новый клиент по фото паспорта
          </button>
          {p.clientId && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded text-[12px]">
              <Icon name="UserCheck" size={11} className="inline mr-1" />
              Клиент: {p.clientQuery} (ID #{p.clientId})
            </div>
          )}
        </>
      )}
    </Section>
  );
}
