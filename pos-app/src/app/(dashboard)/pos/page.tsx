"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModifierPicker } from "@/components/pos/modifier-picker";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Table {
  id: string;
  tableNumber: string;
  status: string;
  capacity: number;
}

interface MenuModifier {
  id: string;
  name: string;
  extraPrice: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  station: string;
  modifiers: MenuModifier[];
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  menuItem: { id: string; name: string };
  modifiers: Array<{ modifier: { name: string }; extraPrice: number }>;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  table: { tableNumber: string } | null;
  items: OrderItem[];
}

export default function POSPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway">("dine_in");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [pickerItem, setPickerItem] = useState<MenuItem | null>(null);

  const loadData = useCallback(async () => {
    const [tablesRes, menuRes] = await Promise.all([
      fetch("/api/tables"),
      fetch("/api/menu/categories"),
    ]);
    const tablesData = await tablesRes.json();
    const menuData = await menuRes.json();
    if (tablesData.success) setTables(tablesData.data);
    if (menuData.success) {
      setCategories(menuData.data);
      if (menuData.data.length > 0) setActiveCategory(menuData.data[0].id);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function createOrder() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderType,
        tableId: orderType === "dine_in" ? selectedTable : null,
        items: [],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setCurrentOrder(data.data);
      setMessage(`Order ${data.data.orderNumber} dibuat`);
      loadData();
    } else {
      setMessage(data.error);
    }
  }

  function handleItemClick(menuItem: MenuItem) {
    if (!currentOrder) { setMessage("Buat order dulu"); return; }
    if (!menuItem.isAvailable) { setMessage("Item sold out"); return; }
    if (menuItem.modifiers.length > 0) {
      setPickerItem(menuItem);
    } else {
      addItem(menuItem.id);
    }
  }

  async function addItem(menuItemId: string, modifierIds: string[] = [], notes = "") {
    if (!currentOrder) return;
    const res = await fetch(`/api/orders/${currentOrder.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemId, quantity: 1, modifierIds, notes }),
    });
    const data = await res.json();
    if (data.success) {
      setCurrentOrder(data.data);
      setPickerItem(null);
    } else {
      setMessage(data.error);
    }
  }

  async function voidOrder() {
    if (!currentOrder) return;
    const reason = prompt("Alasan void order:");
    if (!reason) return;
    const res = await fetch(`/api/orders/${currentOrder.id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (data.success) {
      setCurrentOrder(null);
      setMessage("Order dibatalkan");
      loadData();
    } else {
      setMessage(data.error);
    }
  }

  async function removeItem(itemId: string) {
    if (!currentOrder) return;
    const res = await fetch(`/api/orders/${currentOrder.id}/items/${itemId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) setCurrentOrder(data.data);
  }

  async function confirmOrder() {
    if (!currentOrder) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${currentOrder.id}/confirm`, {
      method: "POST",
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setCurrentOrder(data.data);
      setMessage("Order dikirim ke dapur!");
      loadData();
    } else {
      setMessage(data.error);
    }
  }

  function goToPayment() {
    if (!currentOrder) return;
    router.push(`/payment/${currentOrder.id}`);
  }

  const activeItems = categories.find((c) => c.id === activeCategory)?.items ?? [];

  const tableStatusColor = (status: string) => {
    if (status === "available") return "bg-green-100 border-green-400 text-green-800";
    if (status === "occupied") return "bg-red-100 border-red-400 text-red-800";
    return "bg-yellow-100 border-yellow-400 text-yellow-800";
  };

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-xl font-bold text-slate-900">POS — Order Management</h2>
        <p className="text-sm text-slate-500">Buat pesanan, konfirmasi, dan kirim ke dapur</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Tables */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Meja</h3>
          <div className="mb-4 flex gap-1">
            {(["dine_in", "takeaway"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-medium",
                  orderType === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {t === "dine_in" ? "Dine-in" : "Takeaway"}
              </button>
            ))}
          </div>
          {orderType === "dine_in" && (
            <div className="grid grid-cols-2 gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t.id)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-center text-sm font-medium transition-all",
                    tableStatusColor(t.status),
                    selectedTable === t.id && "ring-2 ring-blue-500 ring-offset-1",
                  )}
                >
                  <div className="text-lg font-bold">{t.tableNumber}</div>
                  <div className="text-xs capitalize">{t.status}</div>
                </button>
              ))}
            </div>
          )}
          {!currentOrder && (
            <Button
              className="mt-4 w-full"
              onClick={createOrder}
              disabled={loading || (orderType === "dine_in" && !selectedTable)}
            >
              + Order Baru
            </Button>
          )}
        </div>

        {/* Center: Menu */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-2 border-b border-slate-200 bg-white px-4 py-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium",
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 lg:grid-cols-3 xl:grid-cols-4">
            {activeItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={!currentOrder || !item.isAvailable}
                className={cn(
                  "rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md",
                  !item.isAvailable && "opacity-50",
                  !currentOrder && "cursor-not-allowed",
                )}
              >
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm font-medium text-blue-600">
                  {formatCurrency(item.price)}
                </p>
                {!item.isAvailable && (
                  <span className="mt-2 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-600">
                    Sold Out
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Current Order */}
        <div className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Order Saat Ini</h3>
            {currentOrder ? (
              <p className="text-sm text-slate-500">
                {currentOrder.orderNumber}
                {currentOrder.table && ` — Meja ${currentOrder.table.tableNumber}`}
              </p>
            ) : (
              <p className="text-sm text-slate-400">Belum ada order</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {currentOrder?.items.map((item) => (
              <div key={item.id} className="mb-3 rounded-lg border border-slate-100 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.menuItem.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity}x @ {formatCurrency(item.unitPrice)}</p>
                    {item.modifiers.map((m) => (
                      <p key={m.modifier.name} className="text-xs text-orange-600">+ {m.modifier.name}</p>
                    ))}
                    {item.notes && <p className="text-xs text-slate-400">Note: {item.notes}</p>}
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.subtotal)}</p>
                </div>
                {currentOrder.status === "draft" && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>

          {currentOrder && (
            <div className="border-t border-slate-200 p-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(currentOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pajak</span>
                  <span>{formatCurrency(currentOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span>{formatCurrency(currentOrder.serviceCharge)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">{formatCurrency(currentOrder.totalAmount)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {currentOrder.status === "draft" && (
                  <Button
                    className="w-full"
                    variant="success"
                    onClick={confirmOrder}
                    disabled={loading || currentOrder.items.length === 0}
                  >
                    Konfirmasi → Kitchen
                  </Button>
                )}
                {["confirmed", "preparing", "ready", "served"].includes(currentOrder.status) && (
                  <Button className="w-full" onClick={goToPayment}>
                    Bayar
                  </Button>
                )}
                {currentOrder.status !== "paid" && currentOrder.status !== "void" && (
                  <Button className="w-full" variant="danger" onClick={voidOrder}>
                    Void Order
                  </Button>
                )}
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => setCurrentOrder(null)}
                >
                  Order Baru
                </Button>
              </div>
            </div>
          )}

          {message && (
            <p className="border-t border-slate-200 px-4 py-2 text-center text-xs text-blue-600">
              {message}
            </p>
          )}
        </div>
      </div>

      {pickerItem && (
        <ModifierPicker
          itemName={pickerItem.name}
          basePrice={pickerItem.price}
          modifiers={pickerItem.modifiers}
          onConfirm={(ids, notes) => addItem(pickerItem.id, ids, notes)}
          onCancel={() => setPickerItem(null)}
        />
      )}
    </div>
  );
}
