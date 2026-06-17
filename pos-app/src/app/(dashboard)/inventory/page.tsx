"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package } from "lucide-react";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  minStockLevel: number;
  stock: { currentStock: number; lastUpdated: string } | null;
}

interface Alert {
  ingredientId: string;
  name: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [opnameId, setOpnameId] = useState<string | null>(null);
  const [opnameQty, setOpnameQty] = useState("");

  const loadData = useCallback(async () => {
    const [ingRes, alertRes] = await Promise.all([
      fetch("/api/inventory/ingredients"),
      fetch("/api/inventory/alerts"),
    ]);
    const ingData = await ingRes.json();
    const alertData = await alertRes.json();
    if (ingData.success) setIngredients(ingData.data);
    if (alertData.success) setAlerts(alertData.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleOpname() {
    if (!opnameId || !opnameQty) return;
    const res = await fetch("/api/inventory/opname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientId: opnameId,
        actualStock: Number(opnameQty),
        notes: "Stock opname",
      }),
    });
    const data = await res.json();
    if (data.success) {
      setOpnameId(null);
      setOpnameQty("");
      loadData();
    } else {
      alert(data.error);
    }
  }

  async function handleRestock() {
    if (!restockId || !restockQty) return;
    const res = await fetch("/api/inventory/restock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientId: restockId,
        quantity: Number(restockQty),
        notes: "Manual restock",
      }),
    });
    const data = await res.json();
    if (data.success) {
      setRestockId(null);
      setRestockQty("");
      loadData();
    }
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-sm text-slate-500">Stok bahan baku — auto-deduct saat order confirmed</p>
          </div>
        </div>
      </header>

      {alerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Low Stock Alert ({alerts.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a) => (
              <span key={a.ingredientId} className="rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-800">
                {a.name}: {a.currentStock} {a.unit} (min: {a.minStockLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Bahan Baku</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Stok</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Min Level</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Restock</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Opname</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((ing) => {
              const stock = ing.stock?.currentStock ?? 0;
              const low = stock < ing.minStockLevel;
              return (
                <tr key={ing.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3">
                    {stock} {ing.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {ing.minStockLevel} {ing.unit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        low ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
                      )}
                    >
                      {low ? "Low Stock" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {restockId === ing.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} placeholder="Qty" className="w-20 rounded border px-2 py-1 text-sm" />
                        <Button size="sm" onClick={handleRestock}>OK</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRestockId(null)}>X</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setRestockId(ing.id)}>+ Restock</Button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {opnameId === ing.id ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={opnameQty} onChange={(e) => setOpnameQty(e.target.value)} placeholder="Actual" className="w-20 rounded border px-2 py-1 text-sm" />
                        <Button size="sm" onClick={handleOpname}>OK</Button>
                        <Button size="sm" variant="ghost" onClick={() => setOpnameId(null)}>X</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { setOpnameId(ing.id); setOpnameQty(String(stock)); }}>Opname</Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
