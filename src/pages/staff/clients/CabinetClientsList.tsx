import Icon from "@/components/ui/icon";
import { formatDate, type ClientRow } from "./cabinetClientsTypes";

type Props = {
  rows: ClientRow[];
  loading: boolean;
  page: number;
  totalPages: number;
  setPage: (updater: (p: number) => number) => void;
  onOpenEdit: (id: number) => void;
};

export default function CabinetClientsList({
  rows,
  loading,
  page,
  totalPages,
  setPage,
  onOpenEdit,
}: Props) {
  return (
    <div className="bg-gradient-to-br from-[#0F0F0F] to-[#080808] border border-[#1F1F1F] rounded-2xl overflow-hidden">
      {rows.length === 0 && !loading && (
        <div className="px-4 py-10 text-center text-white/40 text-sm">
          <Icon name="Users" size={28} className="mx-auto mb-2 text-white/20" />
          Клиенты не найдены
        </div>
      )}

      <div className="divide-y divide-[#1F1F1F]">
        {rows.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpenEdit(c.id)}
            className="w-full text-left px-3 sm:px-4 py-3 hover:bg-[#FFD700]/5 transition flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-[#FFD700]/5 border border-[#FFD700]/20 flex items-center justify-center shrink-0 overflow-hidden">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[12px] font-bold text-[#FFD700]">
                  {(c.full_name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-bold text-white truncate">
                  {c.full_name || "Без имени"}
                </span>
                {c.email_verified && (
                  <span title="Email подтверждён">
                    <Icon name="BadgeCheck" size={12} className="text-emerald-400" />
                  </span>
                )}
                {c.has_passport && (
                  <span
                    className="text-[9px] bg-[#FFD700]/15 text-[#FFD700] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
                    title="Паспортные данные внесены"
                  >
                    Паспорт
                  </span>
                )}
                {c.discount_pct > 0 && (
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                    -{c.discount_pct}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/45 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Icon name="Phone" size={10} />
                  {c.phone || "—"}
                </span>
                {c.email && (
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <Icon name="Mail" size={10} />
                    {c.email}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-white/30">Последний вход</div>
              <div className="text-[11px] text-white/60">{formatDate(c.last_login_at)}</div>
            </div>
            <Icon name="ChevronRight" size={14} className="text-white/30 shrink-0" />
          </button>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-[#1F1F1F] px-3 py-2 flex items-center justify-between text-[12px]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 disabled:opacity-30 hover:border-[#FFD700]/40"
          >
            ← Назад
          </button>
          <span className="text-white/50">
            Страница {page} из {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-[#0A0A0A] border border-[#1F1F1F] text-white/70 disabled:opacity-30 hover:border-[#FFD700]/40"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
