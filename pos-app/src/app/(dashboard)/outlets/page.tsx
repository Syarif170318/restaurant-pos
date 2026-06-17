"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Store, Plus } from "lucide-react";

interface Outlet {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  isActive: boolean;
  _count: { users: number; tables: number };
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", address: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/outlets");
    const data = await res.json();
    if (data.success) setOutlets(data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    const res = await fetch("/api/outlets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if ((await res.json()).success) {
      setShowForm(false);
      setForm({ name: "", code: "", address: "" });
      load();
    }
  }

  async function toggleActive(outlet: Outlet) {
    const res = await fetch(`/api/outlets/${outlet.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !outlet.isActive }),
    });
    if ((await res.json()).success) load();
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Outlet Management</h1>
            <p className="text-sm text-slate-500">Kelola cabang / outlet restoran</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Outlet
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Nama outlet"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Kode (opsional)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Alamat (opsional)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <Button className="mt-3" onClick={handleAdd}>
            Simpan
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outlets.map((o) => (
          <div
            key={o.id}
            className={`rounded-xl border bg-white p-4 shadow-sm ${
              o.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
            }`}
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{o.name}</p>
                {o.code && (
                  <span className="text-xs font-medium text-violet-600">{o.code}</span>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  o.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {o.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            {o.address && <p className="mb-2 text-sm text-slate-500">{o.address}</p>}
            <p className="text-xs text-slate-400">
              {o._count.users} user · {o._count.tables} meja
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => toggleActive(o)}
            >
              {o.isActive ? "Nonaktifkan" : "Aktifkan"}
            </Button>
          </div>
        ))}
        {outlets.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada outlet. Tambahkan outlet baru.</p>
        )}
      </div>
    </div>
  );
}
