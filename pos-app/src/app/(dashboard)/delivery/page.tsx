"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Package, RefreshCw } from "lucide-react";

interface DeliveryItem {
  name: string;
  qty: number;
  price: number;
}

interface DeliveryOrder {
  id: string;
  platform: string;
  externalId: string;
  customerName: string;
  customerPhone: string | null;
  itemsJson: string;
  totalAmount: number;
  status: string;
  orderId: string | null;
  createdAt: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  gofood: "GoFood",
  grabfood: "GrabFood",
  manual: "Manual",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-violet-100 text-violet-700",
  ready: "bg-green-100 text-green-700",
  delivered: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-600",
};

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/delivery");
    const data = await res.json();
    if (data.success) setOrders(data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAccept(id: string) {
    setAccepting(id);
    const res = await fetch(`/api/delivery/${id}/accept`, { method: "POST" });
    const data = await res.json();
    setAccepting(null);
    if (data.success) {
      load();
    } else {
      alert(data.error ?? "Gagal menerima order");
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Package className="h-7 w-7 text-orange-600" />
            Delivery Orders
          </h1>
          <p className="text-sm text-slate-500">
            Pesanan dari GoFood & GrabFood — terima untuk buat order POS
          </p>
        </div>
        <Button variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      {orders.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          Belum ada pesanan delivery
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = JSON.parse(order.itemsJson) as DeliveryItem[];
            return (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                        {PLATFORM_LABELS[order.platform] ?? order.platform}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "bg-slate-100"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-900">{order.customerName}</p>
                    {order.customerPhone && (
                      <p className="text-sm text-slate-500">{order.customerPhone}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {order.externalId} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    {order.status === "pending" && (
                      <Button
                        className="mt-2"
                        size="sm"
                        onClick={() => handleAccept(order.id)}
                        disabled={accepting === order.id}
                      >
                        {accepting === order.id ? "Memproses..." : "Terima & Buat POS Order"}
                      </Button>
                    )}
                    {order.orderId && (
                      <p className="mt-1 text-xs text-green-600">POS Order linked</p>
                    )}
                  </div>
                </div>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex justify-between px-3 py-2 text-sm">
                      <span>
                        {item.qty}x {item.name}
                      </span>
                      <span className="text-slate-600">
                        {formatCurrency(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
