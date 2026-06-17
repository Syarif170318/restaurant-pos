"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutGrid, Plus, Pencil } from "lucide-react";

interface TableRow {
  id: string;
  tableNumber: string;
  capacity: number;
  area: string;
  status: string;
  isActive: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-red-100 text-red-700",
  reserved: "bg-amber-100 text-amber-700",
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tableNumber: "", capacity: "4", area: "Indoor" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    tableNumber: "",
    capacity: "",
    area: "",
    status: "available",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/tables?manage=true");
    const data = await res.json();
    if (data.success) setTables(data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: form.tableNumber,
        capacity: Number(form.capacity),
        area: form.area,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setForm({ tableNumber: "", capacity: "4", area: "Indoor" });
      load();
    } else {
      alert(data.error);
    }
  }

  function startEdit(table: TableRow) {
    setEditId(table.id);
    setEditForm({
      tableNumber: table.tableNumber,
      capacity: String(table.capacity),
      area: table.area,
      status: table.status,
    });
  }

  async function handleEdit() {
    if (!editId) return;
    const res = await fetch(`/api/tables/${editId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: editForm.tableNumber,
        capacity: Number(editForm.capacity),
        area: editForm.area,
        status: editForm.status,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setEditId(null);
      load();
    } else {
      alert(data.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Nonaktifkan meja ini?")) return;
    const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) load();
    else alert(data.error);
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
            <p className="text-sm text-slate-500">Kelola meja outlet</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Meja
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="No. meja"
              value={form.tableNumber}
              onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Kapasitas"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Area (Indoor/Outdoor)"
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <Button className="mt-3" onClick={handleAdd}>
            Simpan
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-xl border bg-white p-4 shadow-sm",
              t.isActive ? "border-slate-200" : "border-slate-200 opacity-60",
            )}
          >
            {editId === t.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.tableNumber}
                  onChange={(e) => setEditForm({ ...editForm, tableNumber: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <input
                  value={editForm.area}
                  onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded border px-2 py-1 text-sm capitalize"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit}>
                    Simpan
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{t.tableNumber}</p>
                    <p className="text-sm text-slate-500">
                      {t.area} · {t.capacity} orang
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      STATUS_COLORS[t.status] ?? "bg-slate-100 text-slate-600",
                    )}
                  >
                    {t.status}
                  </span>
                </div>
                {!t.isActive && (
                  <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                    Nonaktif
                  </span>
                )}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(t)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {t.isActive && (
                    <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>
                      Hapus
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        {tables.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada meja. Tambahkan meja baru.</p>
        )}
      </div>
    </div>
  );
}
