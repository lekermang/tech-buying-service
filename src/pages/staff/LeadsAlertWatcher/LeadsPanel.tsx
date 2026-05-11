import React from "react";
import Icon from "@/components/ui/icon";
import { fmtPhone, sourceLabel, type Lead, type Stats } from "./types";

type Props = {
  leads: Lead[];
  stats: Stats | null;
  onClose: () => void;
  onTake: (id: number) => void;
  onMarkAnswered: (id: number) => void;
  onCloseLead: (id: number) => void;
  onShare: (lead: Lead) => void;
  onInvite: (lead: Lead) => void;
  onInviteMax: (lead: Lead) => void;
  onRobocall: (lead: Lead) => void;
};

export default function LeadsPanel({
  leads,
  stats,
  onClose,
  onTake,
  onMarkAnswered,
  onCloseLead,
  onShare,
  onInvite,
  onInviteMax,
  onRobocall,
}: Props) {
  const overdue = stats?.overdue_count || 0;
  const newCount = stats?.new_count || 0;

  return (
    <div className="fixed inset-0 z-[180] bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="w-full sm:max-w-2xl bg-[#0F0F0F] border-2 border-[#FFD700]/40 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="sticky top-0 bg-[#0F0F0F] border-b border-[#FFD700]/30 p-4 flex items-center justify-between">
          <div>
            <div className="font-oswald font-bold text-xl text-[#FFD700] uppercase tracking-wide">
              🔥 Горящие заявки
            </div>
            <div className="text-xs text-white/55 mt-0.5">
              Сегодня: {stats?.today_total || 0} · Ответили: {stats?.answered_today || 0} · Просрочено: <b className="text-red-400">{overdue}</b>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* Статы */}
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Новых</div>
            <div className="text-2xl font-black text-amber-300">{newCount}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">В работе</div>
            <div className="text-2xl font-black text-emerald-300">{stats?.taken_count || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider text-red-300/80">Просрочено</div>
            <div className="text-2xl font-black text-red-300">{overdue}</div>
          </div>
        </div>

        {/* Список заявок */}
        <div className="p-3 space-y-2">
          {leads.length === 0 && (
            <div className="text-center py-12 text-white/40">
              <Icon name="Coffee" size={32} className="inline mb-2 text-[#FFD700]/50" />
              <div className="font-bold text-white/70">Все заявки обработаны 🎉</div>
              <div className="text-xs mt-1">Можно выдохнуть</div>
            </div>
          )}
          {leads.map(l => {
            const ageMin = Math.floor(l.age_minutes);
            const isOverdue = ageMin >= 15 && l.status === "new";
            const isCritical = ageMin >= 30 && l.status === "new";
            const ageStr = ageMin < 60 ? `${ageMin} мин` : `${Math.floor(ageMin / 60)}ч ${ageMin % 60}м`;
            const digits = (l.client_phone || "").replace(/\D/g, "");
            return (
              <div
                key={l.id}
                className={`rounded-xl border p-3 ${
                  isCritical ? "bg-red-500/10 border-red-500/40 animate-pulse" :
                  isOverdue  ? "bg-orange-500/10 border-orange-500/40" :
                  l.status === "taken" ? "bg-emerald-500/5 border-emerald-500/30" :
                                        "bg-white/5 border-white/15"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#FFD700] font-bold text-sm">#{l.id}</span>
                      <span className="text-[9px] uppercase tracking-wider bg-white/10 text-white/70 px-1.5 py-0.5 rounded">
                        {sourceLabel[l.source] || l.source}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCritical ? "bg-red-600 text-white" :
                        isOverdue  ? "bg-orange-500 text-white" :
                        l.status === "taken" ? "bg-emerald-500/30 text-emerald-200" :
                                               "bg-amber-500/30 text-amber-200"
                      }`}>
                        {l.status === "taken" ? `🎯 ${l.owner_name || "В работе"}` : ageStr}
                      </span>
                    </div>
                    <div className="mt-1 font-bold text-white text-sm truncate">{l.client_name}</div>
                    <div className="text-[#FFD700] text-sm font-mono">{fmtPhone(l.client_phone)}</div>
                    {l.description && <div className="text-xs text-white/55 mt-0.5 line-clamp-2">{l.description}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {l.status === "new" ? (
                    <button onClick={() => onTake(l.id)}
                      className="col-span-2 bg-[#FFD700] hover:bg-[#FFE34D] text-black rounded text-[11px] font-bold py-1.5 active:scale-95">
                      🎯 Беру в работу
                    </button>
                  ) : (
                    <button onClick={() => onMarkAnswered(l.id)}
                      className="col-span-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[11px] font-bold py-1.5 active:scale-95">
                      ✅ Ответил клиенту
                    </button>
                  )}
                  <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white rounded text-[11px] font-bold py-1.5 active:scale-95 flex items-center justify-center">
                    💬
                  </a>
                  <a href={`tel:+${digits}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold py-1.5 active:scale-95 flex items-center justify-center">
                    📞
                  </a>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => onShare(l)}
                    className="text-[10px] text-blue-300/80 hover:text-blue-200 underline inline-flex items-center gap-1"
                    title="Отправить карточку заявки в чат сотрудников"
                  >
                    <Icon name="MessageSquareShare" size={11} fallback="Send" /> В чат сотрудникам
                  </button>
                  <button
                    onClick={() => onInvite(l)}
                    className="text-[10px] text-emerald-300/80 hover:text-emerald-200 underline inline-flex items-center gap-1"
                    title="Отправить SMS со ссылкой на персональный чат"
                  >
                    <Icon name="MessageCircle" size={11} /> Пригласить в чат
                  </button>
                  <button
                    onClick={() => onInviteMax(l)}
                    className="text-[10px] text-cyan-300/85 hover:text-cyan-200 underline inline-flex items-center gap-1"
                    title="Открыть мессенджер MAX у сотрудника и параллельно отправить клиенту SMS со ссылкой на MAX-чат"
                  >
                    <Icon name="Send" size={11} /> Пригласить в MAX
                  </button>
                  <button
                    onClick={() => onRobocall(l)}
                    className="text-[10px] text-purple-300/80 hover:text-purple-200 underline inline-flex items-center gap-1"
                    title="Робот-звонок клиенту с приглашением на адрес (Zvonok)"
                  >
                    <Icon name="PhoneCall" size={11} /> Робот-звонок
                  </button>
                  {l.status === "taken" && (
                    <button onClick={() => onCloseLead(l.id)} className="text-[10px] text-white/40 hover:text-white/70 underline">
                      Закрыть заявку
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
