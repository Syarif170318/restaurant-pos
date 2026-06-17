"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  phone: string;
  name: string;
  loyaltyPoints: number;
}

export default function LoyaltyPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<Customer | null>(null);
  const [settings, setSettings] = useState<{ pointsPerAmount: number; redeemValue: number } | null>(
    null,
  );

  const load = useCallback(async () => {
    const res = await fetch("/api/loyalty/customers");
    const data = await res.json();
    if (data.success) setCustomers(data.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLookup() {
    if (!phone) return;
    const res = await fetch(`/api/loyalty/lookup?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.success) {
      setLookup(data.data.customer);
      setSettings(data.data.settings);
    } else {
      alert(data.error);
      setLookup(null);
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center gap-3">
        <Gift className="h-7 w-7 text-pink-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loyalty Program</h1>
          <p className="text-sm text-slate-500">1 poin per Rp 1.000 · 1 poin = Rp 100 diskon</p>
        </div>
      </header>

      <div className="mb-6 flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <input
          placeholder="Cari no. HP pelanggan"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <Button onClick={handleLookup}>
          <Search className="mr-1 h-4 w-4" /> Cari
        </Button>
      </div>

      {lookup && (
        <div className="mb-6 rounded-xl border border-pink-200 bg-pink-50 p-4">
          <p className="font-semibold text-slate-900">{lookup.name}</p>
          <p className="text-sm text-slate-600">{lookup.phone}</p>
          <p className="mt-2 text-2xl font-bold text-pink-700">{lookup.loyaltyPoints} poin</p>
          {settings && (
            <p className="mt-1 text-sm text-slate-500">
              Nilai tukar: Rp {(lookup.loyaltyPoints * settings.redeemValue).toLocaleString("id-ID")}
            </p>
          )}
        </div>
      )}

      <h2 className="mb-3 font-semibold text-slate-800">Top Pelanggan</h2>
      <div className="space-y-2">
        {customers.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium text-slate-900">{c.name}</p>
              <p className="text-sm text-slate-500">{c.phone}</p>
            </div>
            <span className="font-bold text-pink-600">{c.loyaltyPoints} pts</span>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada data pelanggan loyalty.</p>
        )}
      </div>
    </div>
  );
}
