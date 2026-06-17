"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Truck, Plus } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const data = await res.json();
    if (data.success) setSuppliers(data.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if ((await res.json()).success) {
      setShowForm(false);
      setForm({ name: "", contactPerson: "", phone: "", email: "" });
      load();
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="h-7 w-7 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
            <p className="text-sm text-slate-500">Data supplier bahan baku</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Tambah Supplier
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Nama supplier" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
            <input placeholder="Email (opsional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
          </div>
          <Button className="mt-3" onClick={handleAdd}>Simpan</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-semibold text-slate-900">{s.name}</p>
            <p className="text-sm text-slate-600">{s.contactPerson}</p>
            <p className="text-sm text-slate-500">{s.phone}</p>
            {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
          </div>
        ))}
        {suppliers.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada supplier. Tambahkan supplier baru.</p>
        )}
      </div>
    </div>
  );
}
