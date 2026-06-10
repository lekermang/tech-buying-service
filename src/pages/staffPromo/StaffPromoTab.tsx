import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const PROMO_API = "https://functions.poehali.dev/d0b139ce-b968-40cb-be48-3bdb67713efb";

interface Promo {
  id: number;
  slug: string;
  title: string;
  short_desc: string;
  full_desc: string;
  image_url: string | null;
  is_active: boolean;
  show_on_main: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_participants: number | null;
  leads_count: number;
  created_at: string;
}

interface Lead {
  id: number;
  name: string;
  phone: string;
  created_at: string;
  promo_title: string;
  slug: string;
}

const EMPTY_FORM = {
  title: "", short_desc: "", full_desc: "", slug: "",
  is_active: true, show_on_main: false,
  starts_at: "", ends_at: "", max_participants: "",
  image_b64: "",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ── Форма создания/редактирования ───────────────────────────────────────────
function PromoForm({
  token, initial, onSave, onCancel,
}: {
  token: string;
  initial?: Promo | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...(initial ? {
    title:            initial.title,
    short_desc:       initial.short_desc,
    full_desc:        initial.full_desc,
    slug:             initial.slug,
    is_active:        initial.is_active,
    show_on_main:     initial.show_on_main,
    starts_at:        initial.starts_at ? initial.starts_at.slice(0, 16) : "",
    ends_at:          initial.ends_at   ? initial.ends_at.slice(0, 16)   : "",
    max_participants: initial.max_participants ? String(initial.max_participants) : "",
    image_b64:        "",
  } : {}) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const TARGET_W = 1600, TARGET_H = 2000;
      const canvas = document.createElement("canvas");
      canvas.width  = TARGET_W;
      canvas.height = TARGET_H;
      const ctx = canvas.getContext("2d")!;
      // Заполняем чёрным фоном
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, TARGET_W, TARGET_H);
      // Cover: масштабируем с обрезкой по центру
      const srcRatio = img.width / img.height;
      const dstRatio = TARGET_W / TARGET_H;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcRatio > dstRatio) {
        sw = img.height * dstRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dstRatio;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
      const b64 = canvas.toDataURL("image/jpeg", 0.92).split(",")[1] || "";
      set("image_b64", b64);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setErr("Введите название акции"); return; }
    setSaving(true); setErr(null);
    try {
      const action = initial ? "admin_update" : "admin_create";
      const payload: Record<string, unknown> = {
        title:            form.title.trim(),
        short_desc:       form.short_desc.trim(),
        full_desc:        form.full_desc.trim(),
        is_active:        form.is_active,
        show_on_main:     form.show_on_main,
        starts_at:        form.starts_at || null,
        ends_at:          form.ends_at   || null,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      };
      if (!initial) payload.slug = form.slug.trim() || undefined;
      if (form.image_b64) payload.image_b64 = form.image_b64;
      if (initial) payload.id = initial.id;

      const r = await fetch(`${PROMO_API}?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (d.ok) onSave();
      else setErr(d.error || "Ошибка сохранения");
    } catch {
      setErr("Ошибка сети");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all";
  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-oswald font-bold text-xl uppercase tracking-wide" style={{ color: "#FFD700" }}>
          {initial ? "Редактировать акцию" : "Новая акция"}
        </h2>
        <button onClick={onCancel} className="text-white/30 hover:text-white/60 transition-colors">
          <Icon name="X" size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={labelCls}>Название акции *</label>
          <input value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="Гидрогелевые пленки 150₽" className={inputCls} style={inputStyle} />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Краткое описание (до 70 символов)</label>
          <input value={form.short_desc} onChange={e => set("short_desc", e.target.value.slice(0, 70))}
            placeholder="Защитные пленки на любую модель — всего 150₽" className={inputCls} style={inputStyle} />
          <div className="text-[10px] text-white/25 mt-0.5 text-right">{form.short_desc.length}/70</div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCls}>Полное описание (до 500 символов)</label>
          <textarea value={form.full_desc} onChange={e => set("full_desc", e.target.value.slice(0, 500))}
            placeholder="Подробное описание условий акции…" rows={4}
            className={`${inputCls} resize-none`} style={inputStyle} />
          <div className="text-[10px] text-white/25 mt-0.5 text-right">{form.full_desc.length}/500</div>
        </div>

        {!initial && (
          <div className="sm:col-span-2">
            <label className={labelCls}>Slug URL (необязательно, авто из названия)</label>
            <input value={form.slug} onChange={e => set("slug", e.target.value)}
              placeholder="hydrogel-film-150" className={inputCls} style={inputStyle} />
            {form.slug && (
              <div className="text-[10px] text-white/30 mt-0.5">
                Ссылка: skypka24.com/promo/{form.slug || "авто"}
              </div>
            )}
          </div>
        )}

        <div>
          <label className={labelCls}>Дата начала</label>
          <input type="datetime-local" value={form.starts_at} onChange={e => set("starts_at", e.target.value)}
            className={inputCls} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        <div>
          <label className={labelCls}>Дата окончания</label>
          <input type="datetime-local" value={form.ends_at} onChange={e => set("ends_at", e.target.value)}
            className={inputCls} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        <div>
          <label className={labelCls}>Макс. участников</label>
          <input type="number" value={form.max_participants} onChange={e => set("max_participants", e.target.value)}
            placeholder="Без ограничений" className={inputCls} style={inputStyle} />
        </div>

        <div>
          <label className={labelCls}>Фото акции (900×480)</label>
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}>
              <Icon name="ImagePlus" size={14} />
              {form.image_b64 ? "Фото выбрано ✓" : "Выбрать файл"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => set("is_active", !form.is_active)}
              className="w-10 h-6 rounded-full relative transition-all"
              style={{ background: form.is_active ? "#22c55e" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.is_active ? "calc(100% - 20px)" : "4px" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: form.is_active ? "#22c55e" : "rgba(255,255,255,0.4)" }}>
              Акция активна
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div onClick={() => set("show_on_main", !form.show_on_main)}
              className="w-10 h-6 rounded-full relative transition-all"
              style={{ background: form.show_on_main ? "#FFD700" : "rgba(255,255,255,0.1)" }}>
              <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.show_on_main ? "calc(100% - 20px)" : "4px" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: form.show_on_main ? "#FFD700" : "rgba(255,255,255,0.4)" }}>
              На главной
            </span>
          </label>
        </div>
      </div>

      {err && <div className="text-red-400 text-sm px-1">{err}</div>}

      <div className="flex gap-3 pt-1">
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide text-black transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)" }}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Icon name="Loader2" size={14} className="animate-spin" />
              Сохраняю…
            </span>
          ) : initial ? "Сохранить изменения" : "Создать акцию"}
        </button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl font-oswald font-bold text-sm uppercase tracking-wide transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
          Отмена
        </button>
      </div>
    </div>
  );
}

// ── Карточка акции ────────────────────────────────────────────────────────────
function PromoCard({ promo, token, onEdit, onRefresh }: {
  promo: Promo; token: string; onEdit: (p: Promo) => void; onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  const toggle = async () => {
    setToggling(true);
    try {
      await fetch(`${PROMO_API}?action=admin_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
      });
      onRefresh();
    } finally {
      setToggling(false);
    }
  };

  const promoUrl = `${window.location.origin}/promo/${promo.slug}`;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${promo.is_active ? "rgba(255,215,0,0.2)" : "rgba(255,255,255,0.07)"}` }}>
      <div className="flex gap-3 p-3">
        {promo.image_url ? (
          <img src={promo.image_url} alt={promo.title}
            className="w-20 h-12 object-cover rounded-lg shrink-0" />
        ) : (
          <div className="w-20 h-12 rounded-lg shrink-0 flex items-center justify-center text-2xl"
            style={{ background: "rgba(255,215,0,0.08)" }}>🎁</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="font-oswald font-bold text-base text-white leading-tight truncate">{promo.title}</div>
            <div className="flex items-center gap-1 shrink-0">
              {promo.is_active ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                  Активна
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  Выкл
                </span>
              )}
            </div>
          </div>
          {promo.short_desc && (
            <div className="text-[11px] text-white/40 mt-0.5 truncate">{promo.short_desc}</div>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#FFD700" }}>
              <Icon name="Users" size={11} />
              {promo.leads_count} заявок
            </span>
            <span className="text-[10px] text-white/25">/promo/{promo.slug}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 pb-3">
        <button onClick={() => onEdit(promo)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", color: "#FFD700" }}>
          <Icon name="Pencil" size={11} /> Редактировать
        </button>
        <button onClick={toggle} disabled={toggling}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Icon name={promo.is_active ? "EyeOff" : "Eye"} size={11} />
          {promo.is_active ? "Выкл." : "Вкл."}
        </button>
        <button onClick={() => { navigator.clipboard.writeText(promoUrl); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Icon name="Copy" size={11} /> Ссылка
        </button>
        <a href={`/promo/${promo.slug}`} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          <Icon name="ExternalLink" size={11} />
        </a>
      </div>
    </div>
  );
}

// ── Заявки ────────────────────────────────────────────────────────────────────
function LeadsPanel({ token, promos }: { token: string; promos: Promo[] }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "all">("week");
  const [promoId, setPromoId] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ action: "admin_leads", period });
      if (promoId) params.set("promo_id", String(promoId));
      const r = await fetch(`${PROMO_API}?${params}`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      setLeads(d.leads || []);
      setTotal(d.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period, promoId]);

  const exportCsv = () => {
    const rows = [["#", "Акция", "Имя", "Телефон", "Дата"]];
    leads.forEach(l => rows.push([String(l.id), l.promo_title, l.name, l.phone, fmtDate(l.created_at)]));
    const csv = rows.map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `promo-leads-${period}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {(["today", "week", "month", "all"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: period === p ? "rgba(255,215,0,0.2)" : "transparent",
                color: period === p ? "#FFD700" : "rgba(255,255,255,0.4)",
              }}>
              {{ today: "Сегодня", week: "Неделя", month: "Месяц", all: "Всё" }[p]}
            </button>
          ))}
        </div>

        <select value={promoId} onChange={e => setPromoId(Number(e.target.value))}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <option value={0}>Все акции</option>
          {promos.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-white/30">Всего: {total}</span>
          <button onClick={exportCsv} disabled={!leads.length}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
            <Icon name="Download" size={12} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 rounded-full border-2 border-[#FFD700] border-t-transparent animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <div className="text-3xl mb-2">📭</div>
          <div className="text-sm">Заявок пока нет</div>
        </div>
      ) : (
        <div className="space-y-1">
          {leads.map((l, i) => (
            <div key={l.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black"
                style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{l.name}</div>
                <div className="text-[11px] text-white/40 truncate">{l.promo_title}</div>
              </div>
              <a href={`tel:${l.phone}`} className="text-sm font-bold shrink-0" style={{ color: "#FFD700" }}>
                {l.phone}
              </a>
              <div className="text-[10px] text-white/25 shrink-0 hidden sm:block">{fmtDate(l.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function StaffPromoTab({ token }: { token: string }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form" | "leads">("list");
  const [editPromo, setEditPromo] = useState<Promo | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${PROMO_API}?action=admin_list`, {
        headers: { "X-Employee-Token": token },
      });
      const d = await r.json();
      setPromos(d.promos || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (p: Promo) => { setEditPromo(p); setView("form"); };
  const handleSaved = () => { setView("list"); setEditPromo(null); load(); };

  return (
    <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">
      {/* Шапка */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-oswald font-bold text-2xl uppercase tracking-wide" style={{ color: "#FFD700" }}>
            🎁 Акции
          </h1>
          <div className="text-[11px] text-white/30 mt-0.5">
            Создавайте акции, принимайте заявки
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("leads")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              background: view === "leads" ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${view === "leads" ? "rgba(255,215,0,0.35)" : "rgba(255,255,255,0.1)"}`,
              color: view === "leads" ? "#FFD700" : "rgba(255,255,255,0.5)",
            }}>
            <Icon name="Users" size={13} /> Заявки
          </button>
          <button onClick={() => { setEditPromo(null); setView("form"); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)" }}>
            <Icon name="Plus" size={13} /> Создать
          </button>
        </div>
      </div>

      {/* Форма */}
      {view === "form" && (
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,215,0,0.2)" }}>
          <PromoForm
            token={token}
            initial={editPromo}
            onSave={handleSaved}
            onCancel={() => { setView("list"); setEditPromo(null); }}
          />
        </div>
      )}

      {/* Заявки */}
      {view === "leads" && (
        <div className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setView("list")} className="text-white/40 hover:text-white/70 transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </button>
            <h2 className="font-oswald font-bold text-lg uppercase tracking-wide text-white">Заявки по акциям</h2>
          </div>
          <LeadsPanel token={token} promos={promos} />
        </div>
      )}

      {/* Список акций */}
      {view === "list" && (
        <>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-[#FFD700] border-t-transparent animate-spin" />
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-5xl">🎁</div>
              <div className="font-oswald font-bold text-lg uppercase text-white/50">Акций пока нет</div>
              <p className="text-white/30 text-sm">Создайте первую акцию — она появится на сайте</p>
              <button onClick={() => setView("form")}
                className="px-6 py-3 rounded-xl font-oswald font-bold text-sm uppercase text-black"
                style={{ background: "linear-gradient(135deg,#FFD700,#f59e0b)" }}>
                Создать первую акцию
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {promos.map(p => (
                <PromoCard key={p.id} promo={p} token={token} onEdit={handleEdit} onRefresh={load} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}