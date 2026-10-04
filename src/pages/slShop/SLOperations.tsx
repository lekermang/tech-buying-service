import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLOperation } from "./types";
import PrintDocsButton from "./PrintDocsButton";

const OP_TO_DOC_TYPE: Record<string, string> = {
  buy: "buyout_individual",
  sell: "sell",
  return: "return",
  move: "move_out",
  writeoff: "writeoff",
};

const TYPES = [
  { v: "", l: "Все" },
  { v: "buy", l: "Скупка" },
  { v: "sell", l: "Продажа" },
  { v: "return", l: "Возврат" },
  { v: "move", l: "Перемещение" },
];

const TYPE_CFG: Record<string, { l: string; icon: string; color: string }> = {
  buy: { l: "Скупка", icon: "ShoppingCart", color: "text-emerald-300" },
  sell: { l: "Продажа", icon: "HandCoins", color: "text-blue-300" },
  return: { l: "Возврат", icon: "Undo2", color: "text-red-300" },
  move: { l: "Перемещение", icon: "MoveRight", color: "text-white/60" },
  writeoff: { l: "Списание", icon: "Trash2", color: "text-orange-300" },
};

export default function SLOperations({ token, myRole }: { token: string; myRole?: string }) {
  const [ops, setOps] = useState<SLOperation[]>([]);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const isOwner = myRole === "owner";

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLOperation[]>(token, "operations", { params: { op_type: type } });
    if (r.ok && r.data) setOps(r.data);
    setLoading(false);
  }, [token, type]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: number) => {
    if (!confirm("Удалить операцию? Изменения товара будут отменены (товар вернётся в прежний статус).")) return;
    setDeleting(id); setMsg(null);
    const r = await slApi(token, "operation_delete", { method: "POST", body: { id } });
    setDeleting(null);
    if (r.ok) { setMsg("Операция удалена"); load(); }
    else setMsg(r.error || "Ошибка удаления");
  };

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-1">
        {TYPES.map(t => (
          <button key={t.v} onClick={() => setType(t.v)}
            className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full ${
              type === t.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
            }`}>{t.l}</button>
        ))}
        <button onClick={load} className="ml-auto text-white/40 hover:text-[#FFD700] p-1.5">
          <Icon name={loading ? "Loader" : "RefreshCw"} size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {msg && <div className="bg-[#141414] border border-[#1F1F1F] text-white/70 text-sm p-2.5 rounded-lg mb-2">{msg}</div>}
      {!loading && ops.length === 0 && <div className="text-white/30 text-sm py-8 text-center">Нет операций</div>}

      <div className="space-y-1.5">
        {ops.map(o => {
          const cfg = TYPE_CFG[o.op_type] || TYPE_CFG.move;
          return (
            <div key={o.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-2.5 flex items-start gap-2">
              <div className={`w-7 h-7 rounded-full bg-[#141414] flex items-center justify-center shrink-0 ${cfg.color}`}>
                <Icon name={cfg.icon} size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.l}</span>
                  <span className="text-[10px] text-white/30">{new Date(o.created_at).toLocaleString("ru-RU")}</span>
                </div>
                <div className="text-sm font-medium truncate">{o.item_title || "—"}</div>
                <div className="text-[11px] text-white/50 truncate">
                  {o.client_name && <>{o.client_name} • </>}
                  {o.employee_name && <>{o.employee_name}</>}
                  {o.note && <> • {o.note}</>}
                </div>
              </div>
              {o.amount && Number(o.amount) > 0 && (
                <div className={`text-right shrink-0 font-bold text-sm ${cfg.color}`}>{fmt(o.amount)} ₽</div>
              )}
              <div className="flex gap-1 shrink-0 items-center">
                <PrintDocsButton token={token} opId={o.id} itemId={o.item_id || undefined}
                  opType={OP_TO_DOC_TYPE[o.op_type]} variant="small" />
                {isOwner && (
                  <button onClick={() => remove(o.id)} disabled={deleting === o.id}
                    title="Удалить операцию (только владелец)"
                    className="text-white/30 hover:text-red-400 p-1 rounded">
                    <Icon name={deleting === o.id ? "Loader" : "Trash2"} size={13} className={deleting === o.id ? "animate-spin" : ""} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}