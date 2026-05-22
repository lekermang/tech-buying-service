import { useCallback, useEffect, useState } from "react";
import { useStaffToast } from "../StaffToast";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import {
  STAFF_CLIENTS_URL,
  type ClientFull,
  type ClientRow,
  type Filter,
} from "./cabinetClientsTypes";
import CabinetClientsHeader from "./CabinetClientsHeader";
import CabinetClientsList from "./CabinetClientsList";
import ClientEditorModal from "./ClientEditorModal";

export default function CabinetClientsPanel({ token }: { token: string }) {
  const toast = useStaffToast();
  const [q, setQ] = useState("");
  const dq = useDebouncedValue(q, 350);
  const [filter, setFilter] = useState<Filter>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ClientFull | null>(null);

  const perPage = 30;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(STAFF_CLIENTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Employee-Token": token },
        body: JSON.stringify({
          action: "list",
          q: dq,
          page,
          per_page: perPage,
          only: filter,
        }),
      });
      const d = await res.json();
      if (d.error) {
        toast.error(d.error);
        return;
      }
      setRows(d.clients || []);
      setTotal(d.total || 0);
    } catch {
      toast.error("Не удалось загрузить список");
    } finally {
      setLoading(false);
    }
  }, [token, dq, page, filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [dq, filter]);

  const openEdit = async (id: number) => {
    const res = await fetch(STAFF_CLIENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify({ action: "get", id }),
    });
    const d = await res.json();
    if (d.error) {
      toast.error(d.error);
      return;
    }
    setEditing(d.client);
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-3">
      <CabinetClientsHeader
        total={total}
        loading={loading}
        onReload={load}
        q={q}
        setQ={setQ}
        filter={filter}
        setFilter={setFilter}
      />

      <CabinetClientsList
        rows={rows}
        loading={loading}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        onOpenEdit={openEdit}
      />

      {editing && (
        <ClientEditorModal
          token={token}
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
