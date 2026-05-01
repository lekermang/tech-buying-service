import { useState } from "react";
import Icon from "@/components/ui/icon";
import { slApi, OP_TYPE_LABELS, type SLDocTemplate, type SLDocContext } from "./types";
import { printDoc } from "./docPrinter";

type Props = {
  token: string;
  itemId?: number | null;
  opId?: number | null;
  opType?: string;
  variant?: "button" | "small";
  label?: string;
};

export default function PrintDocsButton({ token, itemId, opId, opType, variant = "button", label }: Props) {
  const [open, setOpen] = useState(false);
  const [tpls, setTpls] = useState<SLDocTemplate[]>([]);
  const [ctx, setCtx] = useState<SLDocContext | null>(null);
  const [loading, setLoading] = useState(false);

  const openPicker = async () => {
    setOpen(true);
    setLoading(true);
    const params: Record<string, string | number | undefined> = { only_active: "1" };
    if (opType) params.op_type = opType;
    const [tplRes, ctxRes] = await Promise.all([
      slApi<SLDocTemplate[]>(token, "doc_templates", { params }),
      slApi<SLDocContext>(token, "doc_context", {
        params: { item_id: itemId || undefined, op_id: opId || undefined },
      }),
    ]);
    if (tplRes.ok && tplRes.data) setTpls(tplRes.data);
    if (ctxRes.ok && ctxRes.data) setCtx(ctxRes.data);
    setLoading(false);
  };

  const print = (t: SLDocTemplate) => {
    if (!ctx) return;
    printDoc(t, ctx);
  };

  if (variant === "small") {
    return (
      <>
        <button onClick={openPicker}
          title="Документы"
          className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 text-white/70 hover:text-[#FFD700] px-2 py-1 rounded text-[10px]">
          <Icon name="FileText" size={11} />
        </button>
        {open && <Modal token={token} loading={loading} tpls={tpls} ctx={ctx} onClose={() => setOpen(false)} onPick={print} />}
      </>
    );
  }

  return (
    <>
      <button onClick={openPicker}
        className="bg-[#141414] border border-[#1F1F1F] hover:border-[#FFD700]/40 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5">
        <Icon name="FileText" size={13} />
        {label || "Документы"}
      </button>
      {open && <Modal token={token} loading={loading} tpls={tpls} ctx={ctx} onClose={() => setOpen(false)} onPick={print} />}
    </>
  );
}

function Modal({ loading, tpls, ctx, onClose, onPick }: {
  token: string; loading: boolean; tpls: SLDocTemplate[]; ctx: SLDocContext | null;
  onClose: () => void; onPick: (t: SLDocTemplate) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between z-10">
          <div className="font-bold">Печать документов</div>
          <button onClick={onClose}><Icon name="X" size={16} /></button>
        </div>
        <div className="p-3 space-y-2">
          {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
          {!loading && tpls.length === 0 && (
            <div className="text-white/30 text-sm py-6 text-center">
              Нет активных шаблонов для этого типа операции.<br />
              Включите шаблоны в разделе «Документы».
            </div>
          )}
          {ctx?.item ? (
            <div className="bg-[#141414] border border-[#1F1F1F] rounded-lg p-2.5 text-sm">
              <div className="font-bold">{String(ctx.item.title || "")}</div>
              <div className="text-[11px] text-white/50">
                #{String(ctx.item.id || "")}
                {ctx.client?.full_name ? ` • ${String(ctx.client.full_name)}` : ""}
                {ctx.branch?.name ? ` • ${String(ctx.branch.name)}` : ""}
              </div>
            </div>
          ) : null}
          <div className="space-y-1.5">
            {tpls.map(t => (
              <button key={t.id} onClick={() => onPick(t)}
                className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5 rounded-lg p-2.5 transition-colors">
                <div className="flex items-start gap-2">
                  <Icon name="FileText" size={14} className="text-[#FFD700] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{t.name}</div>
                    {t.description && <div className="text-[10px] text-white/50 truncate">{t.description}</div>}
                    <div className="flex gap-1 flex-wrap mt-1">
                      {(t.op_types || []).slice(0, 3).map(o => (
                        <span key={o} className="text-[9px] bg-[#141414] border border-[#1F1F1F] text-white/50 px-1.5 py-0.5 rounded">
                          {OP_TYPE_LABELS[o] || o}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Icon name="Printer" size={13} className="text-white/40 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
