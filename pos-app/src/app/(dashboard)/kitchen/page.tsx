"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Clock, ChefHat, Volume2, VolumeX, Zap } from "lucide-react";

interface OrderItem {
  id: string;
  quantity: number;
  notes: string | null;
  status: string;
  menuItem: { name: string; station: string };
  modifiers: Array<{ modifier: { name: string } }>;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  isRush: boolean;
  confirmedAt: string | null;
  table: { tableNumber: string } | null;
  items: OrderItem[];
}

function elapsedMinutes(date: string | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUtvT18=",
    );
    audio.play().catch(() => {});
  }
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [station, setStation] = useState("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [useSSE, setUseSSE] = useState(false);
  const knownOrderIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  const handleOrders = useCallback(
    (incoming: KitchenOrder[]) => {
      if (soundEnabled && !initialLoad.current) {
        const newOrders = incoming.filter((o) => !knownOrderIds.current.has(o.id));
        if (newOrders.length > 0) playBeep();
      }
      incoming.forEach((o) => knownOrderIds.current.add(o.id));
      initialLoad.current = false;
      setOrders(incoming);
    },
    [soundEnabled],
  );

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/kitchen/orders");
    const data = await res.json();
    if (data.success) handleOrders(data.data);
  }, [handleOrders]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      setUseSSE(false);
      loadOrders();
      pollInterval = setInterval(loadOrders, 3000);
    }

    try {
      eventSource = new EventSource("/api/kitchen/stream");
      setUseSSE(true);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.success) handleOrders(payload.data);
        } catch {
          /* ignore malformed events */
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        startPolling();
      };
    } catch {
      startPolling();
    }

    return () => {
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [loadOrders, handleOrders]);

  async function updateStatus(itemId: string, status: "preparing" | "ready" | "served") {
    await fetch(`/api/kitchen/items/${itemId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  async function toggleRush(orderId: string, currentRush: boolean) {
    await fetch(`/api/orders/${orderId}/rush`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rush: !currentRush }),
    });
    loadOrders();
  }

  const filtered = orders
    .map((order) => ({
      ...order,
      items: order.items.filter(
        (item) => station === "all" || item.menuItem.station === station,
      ),
    }))
    .filter((o) => o.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-8 w-8 text-green-400" />
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display (KDS)</h1>
            <p className="text-sm text-slate-400">
              {useSSE ? "Live stream (SSE) — refresh setiap 2 detik" : "Polling — refresh setiap 3 detik"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
              soundEnabled ? "bg-green-700 text-white" : "bg-slate-700 text-slate-300",
            )}
            title={soundEnabled ? "Mute notifications" : "Enable notifications"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? "Sound On" : "Sound Off"}
          </button>
          {["all", "grill", "bar", "pastry"].map((s) => (
            <button
              key={s}
              onClick={() => setStation(s)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium capitalize",
                station === s ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300",
              )}
            >
              {s === "all" ? "Semua" : s}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800">
          <p className="text-slate-400">Tidak ada order aktif di dapur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => {
            const mins = elapsedMinutes(order.confirmedAt);
            const urgent = mins >= 10;
            return (
              <div
                key={order.id}
                className={cn(
                  "rounded-2xl border-2 bg-slate-800 p-5",
                  order.isRush && "border-orange-500 ring-2 ring-orange-500/30",
                  !order.isRush && urgent && "border-red-500",
                  !order.isRush && !urgent && "border-slate-600",
                  order.status === "ready" && !order.isRush && "border-green-500",
                )}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-green-400">{order.orderNumber}</p>
                      {order.isRush && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold uppercase">
                          <Zap className="h-3 w-3" />
                          Rush
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {order.orderType === "takeaway"
                        ? "Takeaway"
                        : `Meja ${order.table?.tableNumber}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={cn("flex items-center gap-1 text-sm", urgent ? "text-red-400" : "text-slate-400")}>
                      <Clock className="h-4 w-4" />
                      {mins}m
                    </div>
                    <Button
                      size="sm"
                      variant={order.isRush ? "secondary" : "ghost"}
                      className="h-7 text-xs"
                      onClick={() => toggleRush(order.id, order.isRush)}
                    >
                      {order.isRush ? "Unrush" : "Mark Rush"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-lg bg-slate-700 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">
                            {item.quantity}x {item.menuItem.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-yellow-400">Note: {item.notes}</p>
                          )}
                          {item.modifiers.map((m) => (
                            <p key={m.modifier.name} className="text-xs text-orange-300">
                              + {m.modifier.name}
                            </p>
                          ))}
                        </div>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-medium capitalize",
                            item.status === "ready" && "bg-green-600",
                            item.status === "preparing" && "bg-yellow-600",
                            item.status === "pending" && "bg-slate-500",
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateStatus(item.id, "preparing")}
                          >
                            Preparing
                          </Button>
                        )}
                        {item.status === "preparing" && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => updateStatus(item.id, "ready")}
                          >
                            Ready
                          </Button>
                        )}
                        {item.status === "ready" && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(item.id, "served")}
                          >
                            Served
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  {order.confirmedAt && formatDateTime(order.confirmedAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
