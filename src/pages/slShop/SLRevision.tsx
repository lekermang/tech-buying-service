import { useEffect, useState, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { slApi, fmt, type SLRevision, type SLRevisionItem, type SLCategory } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";

export default function SLRevision({ token }: { token: string }) {
  const [list, setList] = useState<SLRevision[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await slApi<SLRevision[]>(token, "revisions");
    if (r.ok && r.data) setList(r.data);
    setLoading(false);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  if (openId) return <RevisionDetail token={token} id={openId} onBack={() => { setOpenId(null); load(); }} />;
  if (creating) return <RevisionCreate token={token} onCreated={(id) => { setCreating(false); setOpenId(id); }} onCancel={() => setCreating(false)} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-wide text-white/50">Ревизии склада</div>
        <button onClick={() => setCreating(true)} className="bg-[#FFD700] text-black font-bold px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
          <Icon name="Plus" size={13} />Новая ревизия
        </button>
      </div>

      {loading && <div className="text-white/30 text-sm py-4 text-center">Загрузка...</div>}
      {!loading && list.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          <Icon name="ClipboardCheck" size={32} className="mx-auto mb-2 opacity-30" />
          Ревизий пока не было. Создайте новую — сканируйте товары, и система покажет что есть в наличии,
          чего не хватает и что лежит лишнее.
        </div>
      )}

      <div className="space-y-2">
        {list.map(r => (
          <button key={r.id} onClick={() => setOpenId(r.id)}
            className="w-full text-left bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 hover:border-[#FFD700]/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{r.name}</div>
                <div className="text-[11px] text-white/50">{new Date(r.started_at).toLocaleString("ru-RU")} • {r.started_by || "—"}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 ${
                r.status === "open" ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" : "bg-white/10 text-white/40 border border-white/10"
              }`}>
                {r.status === "open" ? "В работе" : "Закрыта"}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2 text-center">
              <Mini l="Ожид." v={r.total_expected} c="white" />
              <Mini l="Найдено" v={r.total_found} c="emerald" />
              <Mini l="Нет" v={r.total_missing} c="red" />
              <Mini l="Лишн." v={r.total_extra} c="orange" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Mini({ l, v, c }: { l: string; v: number; c: string }) {
  const colors: Record<string, string> = {
    white: "text-white",
    emerald: "text-emerald-300",
    red: "text-red-300",
    orange: "text-orange-300",
  };
  return (
    <div className="bg-[#141414] rounded p-1.5">
      <div className="text-[9px] uppercase text-white/40">{l}</div>
      <div className={`text-base font-bold ${colors[c]}`}>{v}</div>
    </div>
  );
}

function RevisionCreate({ token, onCreated, onCancel }: { token: string; onCreated: (id: number) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [cats, setCats] = useState<SLCategory[]>([]);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [scope, setScope] = useState("stock");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    slApi<SLCategory[]>(token, "categories").then(r => { if (r.ok && r.data) setCats(r.data); });
  }, [token]);

  const create = async () => {
    setSaving(true);
    const r = await slApi<{ id: number; total: number }>(token, "revision_create", {
      method: "POST", body: { name: name.trim(), category_id: categoryId || null, scope_status: scope },
    });
    setSaving(false);
    if (r.ok && r.data) onCreated(r.data.id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onCancel}><Icon name="ArrowLeft" size={16} /></button>
        <div className="font-bold">Новая ревизия</div>
      </div>
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3 space-y-2">
        <div>
          <div className="text-[11px] text-white/50 mb-0.5">Название</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ревизия склада 01.05"
            className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <div className="text-[11px] text-white/50 mb-0.5">Только статус</div>
          <div className="flex gap-1">
            {[
              { v: "stock", l: "Склад" },
              { v: "showcase", l: "Витрина" },
              { v: "consignment", l: "Реализация" },
            ].map(o => (
              <button key={o.v} onClick={() => setScope(o.v)}
                className={`flex-1 text-[11px] py-2 rounded ${scope === o.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"}`}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-white/50 mb-0.5">Категория (опц.)</div>
          <CategoryTreeSelect categories={cats} value={categoryId} onChange={(id) => setCategoryId(id)} />
        </div>
      </div>
      <button onClick={create} disabled={saving} className="w-full bg-[#FFD700] text-black font-bold py-2.5 rounded-lg disabled:opacity-50">
        {saving ? "Создаю..." : "Начать ревизию"}
      </button>
    </div>
  );
}

function RevisionDetail({ token, id, onBack }: { token: string; id: number; onBack: () => void }) {
  const [data, setData] = useState<{ revision: SLRevision; items: SLRevisionItem[] } | null>(null);
  const [scanCode, setScanCode] = useState("");
  const [scanResult, setScanResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tab, setTab] = useState<"all" | "pending" | "found" | "missing" | "extra">("pending");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await slApi<{ revision: SLRevision; items: SLRevisionItem[] }>(token, "revision_get", { params: { id } });
    if (r.ok && r.data) setData(r.data);
  }, [token, id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const scan = async () => {
    const code = scanCode.trim();
    if (!code) return;
    setScanCode("");
    const r = await slApi<{ state: string; title?: string; message?: string }>(token, "revision_scan", { method: "POST", body: { revision_id: id, code } });
    if (r.ok && r.data) {
      const map: Record<string, string> = { found: "Найдено", extra: "Лишний (не из ревизии)" };
      const ok = r.data.state === "found";
      setScanResult({ ok, msg: `${map[r.data.state] || r.data.state}: ${r.data.title || code}` });
      setTimeout(() => setScanResult(null), 2000);
      load();
    } else {
      setScanResult({ ok: false, msg: r.error || "Ошибка" });
    }
    inputRef.current?.focus();
  };

  const finish = async () => {
    if (!confirm("Закрыть ревизию? Все непросканированные товары станут «Нет в наличии».")) return;
    const r = await slApi(token, "revision_finish", { method: "POST", body: { id } });
    if (r.ok) load();
  };

  if (!data) return <div className="text-white/30 text-center py-8">Загрузка...</div>;

  const r = data.revision;
  const items = data.items;
  const filtered = tab === "all" ? items : items.filter(i => i.state === tab);
  const isOpen = r.status === "open";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onBack}><Icon name="ArrowLeft" size={16} /></button>
        <div className="flex-1 min-w-0">
          <div className="font-bold truncate">{r.name}</div>
          <div className="text-[11px] text-white/40">{new Date(r.started_at).toLocaleString("ru-RU")}</div>
        </div>
        {isOpen && (
          <button onClick={finish} className="bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-lg text-[12px] font-bold">
            Завершить
          </button>
        )}
      </div>

      {/* Прогресс */}
      <div className="grid grid-cols-4 gap-2">
        <Mini l="Ожид." v={r.total_expected} c="white" />
        <Mini l="Найд." v={items.filter(i => i.state === "found").length} c="emerald" />
        <Mini l="Нет" v={items.filter(i => i.state === "missing").length} c="red" />
        <Mini l="Лишн." v={items.filter(i => i.state === "extra").length} c="orange" />
      </div>

      {/* Сканер */}
      {isOpen && (
        <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent border border-[#FFD700]/30 rounded-xl p-3">
          <div className="text-[11px] uppercase tracking-wide text-[#FFD700] font-bold mb-2 flex items-center gap-1">
            <Icon name="ScanLine" size={12} />Сканирование (IMEI / SKU / штрих-код)
          </div>
          <div className="flex gap-2">
            <input ref={inputRef} value={scanCode} onChange={e => setScanCode(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") scan(); }}
              placeholder="Сканируйте или введите код"
              className="flex-1 bg-[#0A0A0A] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm font-mono" />
            <button onClick={scan} className="bg-[#FFD700] text-black font-bold px-4 rounded-lg">OK</button>
          </div>
          {scanResult && (
            <div className={`mt-2 text-sm p-2 rounded ${scanResult.ok ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              <Icon name={scanResult.ok ? "Check" : "AlertCircle"} size={12} className="inline mr-1" />
              {scanResult.msg}
            </div>
          )}
        </div>
      )}

      {/* Фильтры */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { v: "all", l: "Все" },
          { v: "pending", l: "Не отскан." },
          { v: "found", l: "Найдено" },
          { v: "missing", l: "Нет" },
          { v: "extra", l: "Лишние" },
        ].map(t => (
          <button key={t.v} onClick={() => setTab(t.v as typeof tab)}
            className={`shrink-0 text-[11px] px-3 py-1.5 rounded-full ${
              tab === t.v ? "bg-[#FFD700] text-black font-bold" : "bg-[#141414] border border-[#1F1F1F] text-white/60"
            }`}>{t.l}</button>
        ))}
      </div>

      {/* Список */}
      <div className="space-y-1.5">
        {filtered.length === 0 && <div className="text-white/30 text-sm py-6 text-center">Пусто</div>}
        {filtered.map(it => {
          const cfg = STATE_CFG[it.state] || STATE_CFG.pending;
          return (
            <div key={it.id} className={`bg-[#0F0F0F] border rounded-lg p-2.5 flex items-center gap-2 ${cfg.border}`}>
              <Icon name={cfg.icon} size={14} className={cfg.color} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{it.title || it.scanned_code || "—"}</div>
                <div className="text-[10px] text-white/40 truncate">
                  {it.imei && <>IMEI: {it.imei} • </>}
                  {it.sku && <>{it.sku}</>}
                </div>
              </div>
              {it.sell_price && <div className="text-[#FFD700] text-[12px] font-bold shrink-0">{fmt(it.sell_price)} ₽</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATE_CFG: Record<string, { l: string; icon: string; color: string; border: string }> = {
  pending: { l: "Не отсканировано", icon: "Circle", color: "text-white/30", border: "border-[#1F1F1F]" },
  found: { l: "Найдено", icon: "CheckCircle2", color: "text-emerald-300", border: "border-emerald-500/30" },
  missing: { l: "Нет в наличии", icon: "XCircle", color: "text-red-300", border: "border-red-500/30" },
  extra: { l: "Лишний", icon: "AlertCircle", color: "text-orange-300", border: "border-orange-500/30" },
};
