import { useEffect, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Schedule, SYNC_URL, VAS_TYPES, WEEKDAYS, formatDate } from "./types";

export default function AvitoPromote() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [running, setRunning] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const flash = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${SYNC_URL}?action=schedules`);
      const d = await r.json();
      if (d.ok) setSchedules(d.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (s: Schedule) => {
    const r = await fetch(`${SYNC_URL}?action=schedule_save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    });
    const d = await r.json();
    if (d.ok) {
      flash("ok", s.id ? "Сохранено" : "Расписание создано");
      setEditing(null);
      load();
    } else {
      flash("err", d.error || "Не удалось сохранить");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Удалить расписание?")) return;
    await fetch(`${SYNC_URL}?action=schedule_delete&id=${id}`, { method: "POST" });
    flash("ok", "Удалено");
    load();
  };

  const runNow = async (id: number) => {
    setRunning(id);
    try {
      const r = await fetch(`${SYNC_URL}?action=schedule_run&id=${id}`, { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        flash("ok", `Поднято ${d.bumped} объявлений${d.failed ? `, ошибок ${d.failed}` : ""}`);
        load();
      } else {
        flash("err", d.error || "Ошибка запуска");
      }
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/30 p-3">
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Icon name="Rocket" size={16} className="text-orange-300" />
              <span className="font-oswald font-bold text-white text-sm uppercase tracking-wide">Автопродвижение</span>
            </div>
            <div className="text-[11px] text-white/60 mt-0.5">
              Расписание поднятий объявлений в топ выдачи Авито · {schedules.length} {schedules.length === 1 ? "расписание" : "расписаний"}
            </div>
          </div>
          <button
            onClick={() => setEditing({ name: "", category: null, weekdays: "1,2,3,4,5,6,7", hour: 10, vas_type: "xl", is_active: true })}
            className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-oswald font-bold text-xs px-3 py-1.5 rounded uppercase tracking-wide"
          >
            <Icon name="Plus" size={12} />
            Добавить
          </button>
        </div>
      </div>

      {msg && (
        <div className={`text-[11px] rounded px-3 py-2 flex items-center gap-2 ${
          msg.type === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300"
        }`}>
          <Icon name={msg.type === "ok" ? "CheckCircle2" : "AlertCircle"} size={13} />
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <Icon name="Rocket" size={32} className="text-orange-400/50 mx-auto mb-2" />
          <div className="text-white/70 font-oswald font-bold text-sm uppercase tracking-wide">Пока нет расписаний</div>
          <div className="text-white/40 font-roboto text-[11px] mt-1">
            Создай первое — например «Поднимать телефоны по будням в 10:00»
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.is_active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-white/30"}`} />
                    <div className="font-oswald font-bold text-white text-sm">{s.name}</div>
                    <span className="bg-white/5 text-white/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide">
                      {VAS_TYPES.find(v => v.v === s.vas_type)?.l || s.vas_type}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/60 mt-1">
                    {s.category ? <>Категория: <b className="text-white/80">{s.category}</b></> : "Все категории"}
                    {" · "}
                    {WEEKDAYS.filter(d => s.weekdays.split(",").includes(d.v)).map(d => d.l).join(" ")}
                    {" · "}
                    {String(s.hour).padStart(2, "0")}:00
                  </div>
                  {s.last_run_at && (
                    <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                      <Icon name="CheckCircle2" size={10} />
                      Последний запуск: {formatDate(s.last_run_at)} · поднято {s.last_run_count}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => s.id && runNow(s.id)}
                    disabled={running === s.id || !s.is_active}
                    className="flex items-center gap-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-oswald font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wide disabled:opacity-40"
                  >
                    <Icon name={running === s.id ? "Loader2" : "Play"} size={11} className={running === s.id ? "animate-spin" : ""} />
                    Запустить
                  </button>
                  <button
                    onClick={() => setEditing(s)}
                    className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 text-white/70 flex items-center justify-center"
                    title="Редактировать"
                  >
                    <Icon name="Pencil" size={12} />
                  </button>
                  <button
                    onClick={() => s.id && remove(s.id)}
                    className="w-8 h-8 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ScheduleModal initial={editing} onClose={() => setEditing(null)} onSave={save} />
      )}
    </div>
  );
}

function ScheduleModal({ initial, onClose, onSave }: { initial: Schedule; onClose: () => void; onSave: (s: Schedule) => void }) {
  const [s, setS] = useState<Schedule>(initial);
  const days = s.weekdays.split(",");

  const toggleDay = (v: string) => {
    const next = days.includes(v) ? days.filter(d => d !== v) : [...days, v];
    setS({ ...s, weekdays: next.sort().join(",") });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-orange-500/30 rounded-t-2xl sm:rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="font-oswald font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Icon name="Rocket" size={16} className="text-orange-300" />
            {s.id ? "Редактирование" : "Новое расписание"}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white"><Icon name="X" size={16} /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-[11px] text-white/60 uppercase tracking-wide font-roboto">Название</label>
            <input
              value={s.name}
              onChange={e => setS({ ...s, name: e.target.value })}
              placeholder="Например, Телефоны по будням"
              className="w-full mt-1 bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/60 uppercase tracking-wide font-roboto">Категория (необязательно)</label>
            <input
              value={s.category || ""}
              onChange={e => setS({ ...s, category: e.target.value || null })}
              placeholder="Все категории если пусто"
              className="w-full mt-1 bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-white/60 uppercase tracking-wide font-roboto">Дни недели</label>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {WEEKDAYS.map(d => (
                <button
                  key={d.v}
                  onClick={() => toggleDay(d.v)}
                  className={`flex-1 min-w-[40px] py-2 rounded font-oswald font-bold text-xs uppercase ${
                    days.includes(d.v)
                      ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white"
                      : "bg-white/5 text-white/50 border border-white/10"
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-white/60 uppercase tracking-wide font-roboto">Время запуска</label>
            <select
              value={s.hour}
              onChange={e => setS({ ...s, hour: parseInt(e.target.value) })}
              className="w-full mt-1 bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-orange-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-white/60 uppercase tracking-wide font-roboto">Тип продвижения</label>
            <select
              value={s.vas_type}
              onChange={e => setS({ ...s, vas_type: e.target.value })}
              className="w-full mt-1 bg-[#0D0D0D] border border-white/15 text-white px-3 py-2 font-roboto text-sm rounded focus:outline-none focus:border-orange-500"
            >
              {VAS_TYPES.map(v => (
                <option key={v.v} value={v.v}>{v.l} ({v.price})</option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
            <div>
              <div className="font-oswald font-bold text-white text-xs uppercase tracking-wide">Активно</div>
              <div className="text-[10px] text-white/40">Если выключено — расписание не работает</div>
            </div>
            <input
              type="checkbox"
              checked={s.is_active}
              onChange={e => setS({ ...s, is_active: e.target.checked })}
              className="w-5 h-5 accent-orange-500"
            />
          </label>
        </div>
        <div className="p-3 border-t border-white/10 flex gap-2 bg-black/30">
          <button onClick={onClose} className="px-3 py-2 border border-white/20 rounded text-white/60 font-roboto text-xs hover:border-white/40">Отмена</button>
          <button
            onClick={() => onSave(s)}
            disabled={!s.name.trim() || !days.length}
            className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-oswald font-bold text-sm py-2 rounded uppercase tracking-wide disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
