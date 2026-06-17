"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Calendar, Plus } from "lucide-react";

interface TableOption {
  id: string;
  tableNumber: string;
  capacity: number;
}

interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  reservedAt: string;
  status: string;
  notes: string | null;
  table: { tableNumber: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  seated: "bg-green-100 text-green-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    partySize: "2",
    reservedAt: "",
    tableId: "",
    notes: "",
  });

  const load = useCallback(async () => {
    const [resRes, tablesRes] = await Promise.all([
      fetch("/api/reservations"),
      fetch("/api/tables"),
    ]);
    const resData = await resRes.json();
    const tablesData = await tablesRes.json();
    if (resData.success) setReservations(resData.data);
    if (tablesData.success) setTables(tablesData.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        phone: form.phone,
        partySize: Number(form.partySize),
        reservedAt: form.reservedAt,
        tableId: form.tableId || undefined,
        notes: form.notes || undefined,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setForm({
        customerName: "",
        phone: "",
        partySize: "2",
        reservedAt: "",
        tableId: "",
        notes: "",
      });
      load();
    } else {
      alert(data.error);
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-7 w-7 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reservations</h1>
            <p className="text-sm text-slate-500">Kelola reservasi meja</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Buat Reservasi
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              placeholder="Nama pelanggan"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Telepon"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Jumlah tamu"
              value={form.partySize}
              onChange={(e) => setForm({ ...form, partySize: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={form.reservedAt}
              onChange={(e) => setForm({ ...form, reservedAt: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              value={form.tableId}
              onChange={(e) => setForm({ ...form, tableId: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Meja (opsional)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tableNumber} ({t.capacity} orang)
                </option>
              ))}
            </select>
            <input
              placeholder="Catatan (opsional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <Button className="mt-3" onClick={handleAdd}>
            Simpan
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Pelanggan</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Waktu</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Tamu</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Meja</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{r.customerName}</p>
                  <p className="text-xs text-slate-500">{r.phone}</p>
                  {r.notes && <p className="text-xs text-slate-400">{r.notes}</p>}
                </td>
                <td className="px-4 py-3">{formatDateTime(r.reservedAt)}</td>
                <td className="px-4 py-3">{r.partySize}</td>
                <td className="px-4 py-3">{r.table?.tableNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && (
          <p className="p-4 text-sm text-slate-400">Belum ada reservasi.</p>
        )}
      </div>
    </div>
  );
}
