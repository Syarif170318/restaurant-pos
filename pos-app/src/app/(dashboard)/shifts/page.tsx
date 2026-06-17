"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Clock } from "lucide-react";

interface Shift {
  id: string;
  status: string;
  openingCash: number;
  closingCash: number | null;
  totalSales: number;
  openedAt: string;
  closedAt: string | null;
}

export default function ShiftsPage() {
  const [shift, setShift] = useState<Shift | null>(null);
  const [openingCash, setOpeningCash] = useState("500000");
  const [closingCash, setClosingCash] = useState("");

  const loadShift = useCallback(async () => {
    const res = await fetch("/api/shifts");
    const data = await res.json();
    if (data.success) setShift(data.data);
  }, []);

  useEffect(() => { loadShift(); }, [loadShift]);

  async function openShift() {
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open", openingCash: Number(openingCash) }),
    });
    const data = await res.json();
    if (data.success) setShift(data.data);
    else alert(data.error);
  }

  async function closeShift() {
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close", closingCash: Number(closingCash) }),
    });
    const data = await res.json();
    if (data.success) setShift(data.data);
    else alert(data.error);
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <Clock className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Management</h1>
          <p className="text-sm text-slate-500">Buka dan tutup shift kasir</p>
        </div>
      </header>

      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {!shift || shift.status === "closed" ? (
          <div>
            <h3 className="mb-4 font-semibold text-slate-800">Buka Shift Baru</h3>
            <label className="mb-1 block text-sm text-slate-600">Modal Awal (Rp)</label>
            <input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <Button className="w-full" onClick={openShift}>Buka Shift</Button>
          </div>
        ) : (
          <div>
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-center">
              <p className="text-sm text-green-700">Shift Aktif</p>
              <p className="text-xs text-green-600">Dibuka: {formatDateTime(shift.openedAt)}</p>
            </div>
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Modal Awal</span>
                <span>{formatCurrency(shift.openingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Penjualan</span>
                <span className="font-medium">{formatCurrency(shift.totalSales)}</span>
              </div>
            </div>
            <label className="mb-1 block text-sm text-slate-600">Uang di Laci Saat Tutup (Rp)</label>
            <input
              type="number"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <Button className="w-full" variant="danger" onClick={closeShift}>Tutup Shift</Button>
          </div>
        )}

        {shift?.status === "closed" && (
          <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
            <p className="font-medium text-slate-700">Shift Terakhir (Tutup)</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between"><span>Penjualan</span><span>{formatCurrency(shift.totalSales)}</span></div>
              <div className="flex justify-between"><span>Modal Tutup</span><span>{formatCurrency(shift.closingCash ?? 0)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
