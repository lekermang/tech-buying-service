import { useCallback, useEffect, useState } from "react";
import funcUrls from "../../../backend/func2url.json";
import type { Status } from "@/data/growthRoadmap";

const URL = (funcUrls as Record<string, string>)["growth-roadmap"];

export type Meta = { status: Status; by: string; at: string | null };
export type LogRow = { task_id: string; from: string | null; to: string; by: string; at: string };
export type Note = { id: number; task_id: string; text: string; by: string; at: string };
export type LoadState = "loading" | "ok" | "offline" | "forbidden";

export function useGrowthData(token: string) {
  const [meta, setMeta] = useState<Record<string, Meta>>({});
  const [log, setLog] = useState<LogRow[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [me, setMe] = useState("");
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState(s => (s === "ok" ? s : "loading"));
    try {
      const r = await fetch(URL, { headers: { "X-Employee-Token": token } });
      if (r.status === 401 || r.status === 403) { setState("forbidden"); return; }
      const d = await r.json();
      if (!r.ok) throw new Error();
      setMeta(d.statuses || {});
      setLog(d.log || []);
      setNotes(d.notes || []);
      setMe(d.me || "");
      setState("ok");
    } catch {
      setState("offline");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const post = async (body: object) => {
    const r = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || !d.ok) throw new Error();
    return d;
  };

  const setStatus = async (taskId: string, next: Status): Promise<boolean> => {
    const prev = meta[taskId];
    const at = new Date().toISOString();
    setMeta(m => ({ ...m, [taskId]: { status: next, by: me || "вы", at } }));
    try {
      const d = await post({ task_id: taskId, status: next });
      setLog(l => [{ task_id: taskId, from: prev?.status || "todo", to: next, by: d.by || me, at }, ...l].slice(0, 30));
      return true;
    } catch {
      setMeta(m => {
        const c = { ...m };
        if (prev) c[taskId] = prev; else delete c[taskId];
        return c;
      });
      return false;
    }
  };

  const addNote = async (taskId: string, text: string): Promise<boolean> => {
    try {
      const d = await post({ action: "note", task_id: taskId, text });
      setNotes(n => [d.note, ...n]);
      return true;
    } catch {
      return false;
    }
  };

  return { meta, log, notes, me, state, load, setStatus, addNote };
}
