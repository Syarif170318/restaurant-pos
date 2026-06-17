"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface POItem {
  ingredientId: string;
  quantity: string;
  unitPrice: string;
}

interface PurchaseOrder {
  id: string;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  supplier: { name: string };
  items: Array<{
    quantity: number;
    unitPrice: number;
    ingredient: { name: string; unit: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  received: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { ingredientId: "", quantity: "", unitPrice: "" },
  ]);

  const load = useCallback(async () => {
    const [poRes, supRes, ingRes] = await Promise.all([
      fetch("/api/purchase-orders"),
      fetch("/api/suppliers"),
      fetch("/api/inventory/ingredients"),
    ]);
    const poData = await poRes.json();
    const supData = await supRes.json();
    const ingData = await ingRes.json();
    if (poData.success) setOrders(poData.data);
    if (supData.success) {
      setSuppliers(supData.data);
      if (supData.data.length > 0 && !supplierId) setSupplierId(supData.data[0].id);
    }
    if (ingData.success) setIngredients(ingData.data);
  }, [supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  function updateItem(index: number, field: keyof POItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { ingredientId: "", quantity: "", unitPrice: "" }]);
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleCreate() {
    const validItems = items.filter((i) => i.ingredientId && i.quantity && i.unitPrice);
    if (!supplierId || validItems.length === 0) {
      alert("Pilih supplier dan isi minimal satu item");
      return;
    }

    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        notes: notes || undefined,
        items: validItems.map((i) => ({
          ingredientId: i.ingredientId,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      }),
    });
    const data = await res.json();
    if (data.success) {
      setShowForm(false);
      setNotes("");
      setItems([{ ingredientId: "", quantity: "", unitPrice: "" }]);
      load();
    } else {
      alert(data.error);
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/purchase-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) load();
    else alert(data.error);
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
            <p className="text-sm text-slate-500">Pesanan bahan baku ke supplier</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> Buat PO
        </Button>
      </header>

      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <p className="mb-2 text-sm font-medium text-slate-700">Item PO</p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={item.ingredientId}
                  onChange={(e) => updateItem(index, "ingredientId", e.target.value)}
                  className="min-w-[160px] flex-1 rounded-lg border px-3 py-2 text-sm"
                >
                  <option value="">Pilih bahan</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  className="w-24 rounded-lg border px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Harga/satuan"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  className="w-32 rounded-lg border px-3 py-2 text-sm"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={addItemRow}>
              + Item
            </Button>
            <Button onClick={handleCreate}>Simpan PO</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((po) => (
          <div key={po.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{po.supplier.name}</p>
                <p className="text-xs text-slate-500">{formatDateTime(po.createdAt)}</p>
                {po.notes && <p className="mt-1 text-sm text-slate-500">{po.notes}</p>}
              </div>
              <div className="text-right">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    STATUS_COLORS[po.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {po.status}
                </span>
                <p className="mt-1 font-semibold text-slate-900">
                  {formatCurrency(po.totalAmount)}
                </p>
              </div>
            </div>

            <ul className="mb-3 space-y-1 text-sm text-slate-600">
              {po.items.map((item, i) => (
                <li key={i}>
                  {item.ingredient.name}: {item.quantity} {item.ingredient.unit} ×{" "}
                  {formatCurrency(item.unitPrice)}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              {po.status === "draft" && (
                <Button size="sm" onClick={() => updateStatus(po.id, "sent")}>
                  Tandai Terkirim
                </Button>
              )}
              {po.status === "sent" && (
                <Button size="sm" onClick={() => updateStatus(po.id, "received")}>
                  Tandai Diterima
                </Button>
              )}
              {(po.status === "draft" || po.status === "sent") && (
                <Button size="sm" variant="danger" onClick={() => updateStatus(po.id, "cancelled")}>
                  Batalkan
                </Button>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="text-sm text-slate-400">Belum ada purchase order.</p>
        )}
      </div>
    </div>
  );
}
