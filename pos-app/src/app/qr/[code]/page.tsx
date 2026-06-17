"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Modifier {
  id: string;
  name: string;
  extraPrice: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  modifiers: Modifier[];
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

interface Table {
  id: string;
  tableNumber: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  modifierIds: string[];
  modifierTotal: number;
}

export default function QrMenuPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [outletName, setOutletName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNumber: string; total: number } | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/public/menu?outlet=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (data.success) {
      setOutletName(data.data.outlet.name);
      setCategories(data.data.categories);
      setTables(data.data.tables);
    } else {
      setError(data.error ?? "Outlet tidak ditemukan");
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + (i.price + i.modifierTotal) * i.quantity, 0),
    [cart],
  );

  function addToCart(item: MenuItem) {
    setCart((prev) => [
      ...prev,
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        modifierIds: [],
        modifierTotal: 0,
      },
    ]);
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) => (i === idx ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  }

  async function submitOrder() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/public/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletCode: code,
        tableNumber: tableNumber || undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
          modifierIds: c.modifierIds,
        })),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.success) {
      setDone({ orderNumber: data.data.orderNumber, total: data.data.totalAmount });
      setCart([]);
    } else {
      setError(data.error ?? "Gagal mengirim pesanan");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Memuat menu...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-6 text-center">
        <div className="max-w-sm rounded-2xl bg-white p-8 shadow-lg">
          <p className="text-4xl">✓</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Pesanan Terkirim!</h1>
          <p className="mt-2 text-slate-600">No. {done.orderNumber}</p>
          <p className="text-lg font-semibold text-green-700">{formatCurrency(done.total)}</p>
          <p className="mt-4 text-sm text-slate-500">Pesanan Anda sedang diproses dapur.</p>
          <button
            onClick={() => setDone(null)}
            className="mt-6 w-full rounded-lg bg-green-600 py-3 font-medium text-white"
          >
            Pesan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{outletName || code}</h1>
        <p className="text-sm text-slate-500">QR Menu — Pesan Sendiri</p>
      </header>

      <div className="space-y-4 p-4">
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <div>
            <label className="text-xs text-slate-500">Meja (opsional)</label>
            <select
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Takeaway</option>
              {tables.map((t) => (
                <option key={t.id} value={t.tableNumber}>
                  Meja {t.tableNumber}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Nama</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama pelanggan"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">No. HP (loyalty)</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-2 font-semibold text-slate-800">{cat.name}</h2>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-500">{item.description}</p>
                    )}
                  </div>
                  <span className="font-semibold text-orange-600">
                    {formatCurrency(item.price)}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 shadow-lg">
          <div className="mb-2 max-h-32 space-y-1 overflow-y-auto">
            {cart.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {c.name} x{c.quantity}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(i, -1)}
                    className="rounded bg-slate-100 px-2 py-0.5"
                  >
                    -
                  </button>
                  <button
                    onClick={() => updateQty(i, 1)}
                    className="rounded bg-slate-100 px-2 py-0.5"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={submitOrder}
            disabled={submitting}
            className="w-full rounded-xl bg-orange-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : `Kirim Pesanan — ${formatCurrency(cartTotal)}`}
          </button>
        </div>
      )}
    </div>
  );
}
