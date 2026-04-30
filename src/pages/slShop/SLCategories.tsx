import { useEffect, useState, useCallback, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { slApi, type SLCategory } from "./types";
import CategoryTreeSelect from "./CategoryTreeSelect";

export default function SLCategories({ token }: { token: string }) {
  const [list, setList] = useState<SLCategory[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Package");
  const [parentId, setParentId] = useState<number | "">("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    const r = await slApi<SLCategory[]>(token, "categories");
    if (r.ok && r.data) setList(r.data);
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    const r = await slApi(token, "category_create", { method: "POST", body: { name, icon, parent_id: parentId || null } });
    if (r.ok) { setAdding(false); setName(""); setIcon("Package"); setParentId(""); load(); }
  };

  const tree = useMemo(() => {
    const byParent: Record<string, SLCategory[]> = {};
    list.forEach(c => {
      const k = String(c.parent_id ?? "root");
      (byParent[k] = byParent[k] || []).push(c);
    });
    return byParent;
  }, [list]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const renderRow = (c: SLCategory, level: number) => {
    const children = tree[String(c.id)] || [];
    const isOpen = expanded.has(c.id);
    return (
      <div key={c.id}>
        <div className="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-2"
          style={{ paddingLeft: 8 + level * 16 }}>
          {children.length > 0 ? (
            <button onClick={() => toggleExpand(c.id)} className="text-white/40 w-4">
              <Icon name={isOpen ? "ChevronDown" : "ChevronRight"} size={12} />
            </button>
          ) : <div className="w-4" />}
          <Icon name={c.icon || "Package"} size={14} className="text-[#FFD700] shrink-0" />
          <div className="flex-1 truncate text-sm">{c.name}</div>
          {children.length > 0 && (
            <span className="text-[10px] text-white/30 shrink-0">{children.length}</span>
          )}
        </div>
        {isOpen && children.map(ch => renderRow(ch, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-2 mb-3">
        {(tree["root"] || []).map(c => renderRow(c, 0))}
      </div>

      <div className="text-[10px] text-white/40 mb-2 px-2">Всего категорий: {list.length}</div>

      {!adding ? (
        <button onClick={() => setAdding(true)}
          className="w-full bg-[#141414] border border-dashed border-[#1F1F1F] rounded-lg py-3 text-sm text-white/50 flex items-center justify-center gap-2">
          <Icon name="Plus" size={14} />Добавить категорию
        </button>
      ) : (
        <div className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-3 space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Название категории"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="Иконка (например Smartphone)"
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded px-2 py-1.5 text-sm" />
          <div>
            <div className="text-[11px] text-white/50 mb-0.5">Родительская категория (опц.)</div>
            <CategoryTreeSelect categories={list} value={parentId} onChange={(id) => setParentId(id)} emptyLabel="Корневая" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 bg-[#141414] py-2 rounded text-sm">Отмена</button>
            <button onClick={add} className="flex-1 bg-[#FFD700] text-black font-bold py-2 rounded text-sm">Добавить</button>
          </div>
        </div>
      )}
    </div>
  );
}
